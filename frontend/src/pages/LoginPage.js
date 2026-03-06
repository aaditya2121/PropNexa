import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, User, Eye, EyeOff, Home } from 'lucide-react';
import propnexaLogo from '../propnexa_logo.png';
import { loginUser } from '../firebase/auth';
import { setupUsers } from '../firebase/setupUsers';

export default function LoginPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const role = searchParams.get('role') || 'owner'; // Default to owner

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Convert username to email format for Firebase Auth
            const email = username.includes('@') ? username : `${username.toLowerCase()}@propnexa.com`;

            const result = await loginUser(email, password);

            if (result.status === 'success') {
                // Save to local storage
                localStorage.setItem('user', JSON.stringify(result.user));

                // Redirect based on role
                if (result.user.role === 'owner') navigate('/owner');
                else if (result.user.role === 'tenant') navigate('/tenant');
                else setError('Unknown role');
            } else {
                setError(result.message || 'Login failed');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Login failed. Please check your credentials.');
        }
        setLoading(false);
    };

    const handleSetupDemo = async () => {
        if (!window.confirm("Initialize Demo Users? This will create 'Ishaan' and 'Rohan' accounts if they don't exist.")) return;
        setLoading(true);
        try {
            await setupUsers();
            alert("Demo users initialized! You can now login.");
        } catch (e) {
            console.error(e);
            alert("Setup failed: " + e.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#030712] flex flex-col justify-center items-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse glow-blue"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse delay-500 glow-accent"></div>

            {/* Home Button */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition-all hover:translate-x-1 group z-10 glass px-4 py-2 rounded-full"
            >
                <Home className="w-4 h-4" />
                <span className="text-sm font-semibold tracking-wide">Return Home</span>
            </button>

            <div className="w-full max-w-md animate-in fade-in zoom-in slide-up duration-500 relative z-10">
                <div className="text-center mb-10">
                    <img src={propnexaLogo} alt="Logo" className="w-20 h-20 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Welcome Back</h2>
                    <p className="text-slate-400 font-medium">Login to your <span className="text-blue-400">{role === 'owner' ? 'Landlord' : 'Tenant'}</span> Portal</p>
                </div>

                <div className="glass-card p-8 sm:p-10 rounded-3xl w-full">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center">{error}</div>}

                        <div>
                            <label className="block text-slate-300 text-sm font-semibold mb-2 pl-1 tracking-wide">Username</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 w-5 h-5 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="input-glass w-full pl-12"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-300 text-sm font-semibold mb-2 pl-1 tracking-wide">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 w-5 h-5 transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="input-glass w-full pl-12 pr-12"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 mb-2 pt-2">
                            {role === 'owner' ? (
                                <button
                                    type="button"
                                    onClick={() => { setUsername('Ishaan'); setPassword('Ishaan123'); }}
                                    className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 py-2.5 rounded-xl text-xs font-bold transition-colors border border-blue-500/20 hover:border-blue-500/40"
                                >
                                    Use Demo Landlord
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => { setUsername('Rohan'); setPassword('Rohan123'); }}
                                    className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 py-2.5 rounded-xl text-xs font-bold transition-colors border border-indigo-500/20 hover:border-indigo-500/40"
                                >
                                    Use Demo Tenant
                                </button>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary flex justify-center items-center gap-2 mt-4"
                        >
                            {loading ? 'Authenticating...' : <>Sign In <ArrowRight className="w-5 h-5" /></>}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-8 text-sm text-slate-500">
                    Protected by PropNexa Secure Auth
                    <div className="mt-2">
                        <button onClick={handleSetupDemo} className="text-xs text-blue-500 hover:text-blue-400 underline">
                            Can't login? Initialize Demo Users
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
