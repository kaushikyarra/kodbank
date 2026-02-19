import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

export default function Dashboard() {
    const [balance, setBalance] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const checkBalance = async () => {
        try {
            const res = await axios.get('http://localhost:5000/balance', { withCredentials: true });
            setBalance(res.data.balance);
            setError('');

            // Trigger confetti animation
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/login');
            }
            setError('Failed to fetch balance');
        }
    };

    const logout = async () => {
        try {
            await axios.post('http://localhost:5000/logout', {}, { withCredentials: true });
            navigate('/login');
        } catch (e) {
            navigate('/login');
        }
    }

    return (
        <div className="glass-panel p-8 w-full max-w-2xl text-center">
            <h1 className="text-4xl font-bold mb-2">Welcome to Kodbank</h1>
            <p className="text-slate-400 mb-8">Secure Banking Portal</p>

            <div className="flex flex-col items-center gap-6">
                <button
                    onClick={checkBalance}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-105 active:scale-95 text-xl"
                >
                    Check Balance
                </button>

                {balance !== null && (
                    <div className="mt-6 p-6 bg-slate-800/50 rounded-xl border border-slate-700 animate-fade-in">
                        <p className="text-2xl font-mono text-emerald-400">
                            your balance is : <span className="font-bold text-white">{balance}</span>
                        </p>
                    </div>
                )}

                {error && <p className="text-red-400 mt-4">{error}</p>}

                <button onClick={logout} className="mt-8 text-slate-500 hover:text-white transition-colors">
                    Logout
                </button>
            </div>
        </div>
    );
}
