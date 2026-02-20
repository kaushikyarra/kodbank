import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const [formData, setFormData] = useState({
        uid: '',
        username: '',
        email: '',
        password: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/register`, formData);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="glass-panel p-8 w-full max-w-md">
            <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Kodbank Register
            </h2>
            {error && <p className="text-red-400 text-center mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <input name="uid" type="number" placeholder="User ID" onChange={handleChange} className="input-field" required />
                <input name="username" type="text" placeholder="Username" onChange={handleChange} className="input-field" required />
                <input name="email" type="email" placeholder="Email" onChange={handleChange} className="input-field" required />
                <input name="password" type="password" placeholder="Password" onChange={handleChange} className="input-field" required />
                <input name="phone" type="tel" placeholder="Phone" onChange={handleChange} className="input-field" />
                <button type="submit" className="btn-primary">Register</button>
            </form>
            <p className="mt-4 text-center text-slate-400">
                Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300">Login</Link>
            </p>
        </div>
    );
}
