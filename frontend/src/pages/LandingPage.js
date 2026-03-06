import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, ArrowRight } from 'lucide-react';
import propnexaLogo from '../propnexa_logo.png';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#030712] text-white font-sans flex flex-col relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse glow-blue"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-700 glow-accent"></div>
            </div>

            {/* Header */}
            <header className="relative z-10 p-6 flex justify-between items-center container mx-auto animate-in fade-in slide-up">
                <div className="flex items-center gap-3">
                    <img src={propnexaLogo} alt="Logo" className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    <span className="text-2xl font-bold bg-gradient-to-br from-white via-blue-100 to-blue-400 bg-clip-text text-transparent tracking-tight">PropNexa</span>
                </div>
                <button className="text-slate-300 hover:text-white transition-colors font-medium border border-slate-700/50 hover:bg-white/5 hover:border-slate-500 rounded-full px-6 py-2 backdrop-blur-md">Contact Support</button>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col justify-center items-center p-6 text-center container mx-auto">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white via-slate-200 to-slate-500 bg-clip-text text-transparent animate-in zoom-in slide-up">
                    Property Management <br /> <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Reimagined.</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed animate-in fade-in slide-up delay-200">
                    Seamlessly connect property owners and tenants. Automate rent, track maintenance, and handle documents with intelligent precision.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl animate-in slide-up zoom-in delay-300">
                    {/* Owner Card */}
                    <div
                        onClick={() => navigate('/login?role=owner')}
                        className="group glass-card p-10 rounded-[2rem] cursor-pointer flex flex-col items-center hover:-translate-y-2 hover:glow-blue active:scale-[0.98]"
                    >
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300 border border-blue-500/20">
                            <Building2 className="w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-blue-300 transition-colors">I am a Landlord</h2>
                        <p className="text-slate-400 mb-8 text-sm leading-relaxed">Manage your entire portfolio, automate rent collection, and organize all documents in one secure place.</p>
                        <div className="mt-auto px-6 py-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold text-sm group-hover:bg-blue-500 group-hover:text-white transition-all flex items-center gap-2">
                            Owner Login <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>

                    {/* Tenant Card */}
                    <div
                        onClick={() => navigate('/login?role=tenant')}
                        className="group glass-card p-10 rounded-[2rem] cursor-pointer flex flex-col items-center hover:-translate-y-2 hover:glow-accent active:scale-[0.98]"
                    >
                        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300 border border-indigo-500/20">
                            <Users className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-indigo-300 transition-colors">I am a Tenant</h2>
                        <p className="text-slate-400 mb-8 text-sm leading-relaxed">Pay rent seamlessly via UPI, submit maintenance requests in seconds, and track your lease details effortlessly.</p>
                        <div className="mt-auto px-6 py-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-sm group-hover:bg-indigo-500 group-hover:text-white transition-all flex items-center gap-2">
                            Tenant Login <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>
            </main>

            <footer className="relative z-10 p-6 text-center text-slate-600 text-sm">
                &copy; 2024 PropNexa Inc. All rights reserved.
            </footer>
        </div>
    );
}
