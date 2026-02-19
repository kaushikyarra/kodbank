import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/login', formData, { withCredentials: true });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="glass-panel p-8 w-full max-w-md">
            <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Kodbank Login
            </h2>
            {error && <p className="text-red-400 text-center mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <input name="username" type="text" placeholder="Username" onChange={handleChange} className="input-field" required />
                <input name="password" type="password" placeholder="Password" onChange={handleChange} className="input-field" required />
                <button type="submit" className="btn-primary">Login</button>
            </form>
            <p className="mt-4 text-center text-slate-400">
                New to Kodbank? <Link to="/register" className="text-blue-400 hover:text-blue-300">Register</Link>
            </p>
        </div>
    );
}
