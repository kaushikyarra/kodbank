require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
    'http://localhost:5173',
    'https://kodbank-liard.vercel.app',
    /\.vercel\.app$/
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // allow non-browser requests (Postman etc)
        const allowed = allowedOrigins.some(o =>
            typeof o === 'string' ? o === origin : o.test(origin)
        );
        if (allowed) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

const authenticateToken = async (req, res, next) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // extra security: check if token exists in DB
        // Token table uses uid, so we need to get uid from username in next step or store uid in token too.
        // Requirement says: "generate JWT token based on username as subject and role as claim"
        // But UserToken table has `uid`. So we need to map `username` back to `uid` or include `uid` in token for verification efficiently.
        // HOWEVER, requirements say: "once token is verified extract the username information using token and fetch the balance from koduser using username"

        // Let's stick to the requirement: Subject = username. 
        // We will query KodUser to get UID for token verification in UserToken table.

        const [users] = await db.execute('SELECT uid FROM KodUser WHERE username = ?', [decoded.sub]);
        if (users.length === 0) return res.status(403).json({ message: 'Invalid user' });
        const uid = users[0].uid;

        const [rows] = await db.execute('SELECT * FROM UserToken WHERE token = ? AND uid = ?', [token, uid]);
        if (rows.length === 0) return res.status(403).json({ message: 'Invalid or expired token' });

        req.user = decoded; // Contains { sub: 'username', role: 'role', ... }
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

app.post('/register', async (req, res) => {
    const { uid, username, email, password, phone } = req.body;
    if (!uid || !username || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute(
            'INSERT INTO KodUser (uid, username, email, password, balance, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [uid, username, email, hashedPassword, 100000, phone || null, 'customer']
        );
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'User already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await db.execute('SELECT * FROM KodUser WHERE username = ?', [username]);
        const user = users[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Requirements: "subject = username", "claim = role"
        const token = jwt.sign({ sub: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1);

        await db.execute('INSERT INTO UserToken (token, uid, expairy) VALUES (?, ?, ?)', [token, user.uid, expiryDate]);

        res.cookie('auth_token', token, {
            httpOnly: true,
            // secure: true, // uncomment in production with https
            // sameSite: 'strict',
            maxAge: 3600000
        });

        res.json({ message: 'Login successful', username: user.username });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/balance', authenticateToken, async (req, res) => {
    try {
        // Requirements: "extract the username information using token and fetch the balance from koduser using username"
        const username = req.user.sub;

        const [users] = await db.execute('SELECT balance FROM KodUser WHERE username = ?', [username]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        res.json({ balance: users[0].balance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ message: 'Logged out' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
