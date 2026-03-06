import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Wrench, FileText, LogOut, CheckCircle, Clock, Plus, X, Home } from 'lucide-react';
import propnexaLogo from '../propnexa_logo.png';
import { getProperty, getMaintenanceByProperty, getDocumentsByProperty, addMaintenance } from '../firebase/firestore';

export default function TenantDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('home');
    const [property, setProperty] = useState(null);
    const [issues, setIssues] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showQRModal, setShowQRModal] = useState(false);

    // Modal State
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [newIssue, setNewIssue] = useState({ category: 'plumbing', description: '' });

    useEffect(() => {
        const u = JSON.parse(localStorage.getItem('user'));
        if (!u || u.role !== 'tenant') {
            navigate('/login');
            return;
        }
        setUser(u);
        fetchPropertyData(u.propertyId);
    }, [navigate]);

    const fetchPropertyData = async (propId) => {
        try {
            // Fetch property from Firestore
            const propData = await getProperty(propId);
            setProperty(propData);

            // Fetch maintenance issues from Firestore
            const maintenanceData = await getMaintenanceByProperty(propId);
            setIssues(maintenanceData.sort((a, b) => new Date(b.date) - new Date(a.date)));

            // Fetch documents from Firestore
            const docsData = await getDocumentsByProperty(propId);
            setDocuments(docsData);
        } catch (error) {
            console.error("Failed to fetch data from Firestore:", error);
        }
        setLoading(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    const submitIssue = async (e) => {
        e.preventDefault();
        if (!newIssue.description) return;

        try {
            await addMaintenance({
                propertyId: user.propertyId,
                category: newIssue.category,
                description: newIssue.description,
                date: new Date().toISOString().split('T')[0],
                status: 'Open',
                cost: 0,
                vendor: 'Pending Assignment'
            });

            alert('Issue Reported Successfully');
            setShowIssueModal(false);
            setNewIssue({ category: 'plumbing', description: '' });
            fetchPropertyData(user.propertyId); // Reload data
        } catch (err) {
            console.error('Error reporting issue:', err);
            alert('Failed to report issue');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#030712] text-slate-50 font-sans relative overflow-hidden">
            {/* Background Decor */}
            <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse glow-blue"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse delay-700 glow-accent"></div>

            <div className="container mx-auto p-4 max-w-5xl relative z-10">
                {/* Premium Header */}
                <div className="flex justify-between items-center mb-8 glass p-5 rounded-2xl animate-in slide-up">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 glow-blue">
                            <img src={propnexaLogo} alt="Logo" className="w-8 h-8 object-contain drop-shadow-md" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">PropNexa</h1>
                            <div className="text-xs text-blue-400 font-semibold tracking-wider uppercase">Tenant Portal</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4">
                        <span className="text-sm font-medium text-slate-300 hidden md:inline-block">Welcome, <span className="text-white">{user.username}</span></span>
                        <button
                            onClick={() => navigate('/')}
                            className="p-2.5 bg-slate-800/50 text-slate-300 rounded-xl hover:bg-white/10 transition-colors border border-slate-700"
                            title="Home"
                        >
                            <Home className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/20 hover:border-red-500/40"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Glass Tabs */}
                <div className="flex gap-2 md:gap-4 mb-8 glass p-2 rounded-2xl animate-in slide-up delay-100">
                    <button
                        onClick={() => setActiveTab('home')}
                        className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'home' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg glow-blue' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Building2 className="w-5 h-5" /> <span className="hidden sm:inline">My Home</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('maintenance')}
                        className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'maintenance' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg glow-blue' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Wrench className="w-5 h-5" /> <span className="hidden sm:inline">Maintenance</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'documents' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg glow-blue' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <FileText className="w-5 h-5" /> <span className="hidden sm:inline">Documents</span>
                    </button>
                </div>

                {/* Content Container */}
                <div className="min-h-[500px] animate-in slide-up delay-200">
                    {loading ? <div className="text-center p-10 text-slate-500">Loading Property Data...</div> : (
                        <>
                            {activeTab === 'home' && property && (
                                <div className="space-y-6">
                                    <h2 className="text-3xl font-black mb-6 tracking-tight">Financial Overview</h2>

                                    {/* Rent Card */}
                                    <div className="glass-card p-8 rounded-3xl border border-indigo-500/30 glow-accent relative overflow-hidden group">
                                        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-colors"></div>
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-6">
                                            <div>
                                                <div className="text-indigo-300 font-semibold text-sm mb-2 tracking-wide uppercase">Upcoming Payment</div>
                                                <div className="text-5xl font-black text-white mb-2">{formatCurrency(property.rentAmount)}</div>
                                                <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full text-xs font-medium border border-indigo-500/20">
                                                    <Clock className="w-3 h-3" /> Due: 1st {new Date().toLocaleString('default', { month: 'short' })}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowQRModal(true)}
                                                className="w-full md:w-auto btn-primary bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-900/40"
                                            >
                                                Pay Rent Instantly
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold mt-10 mb-4 tracking-tight">Lease Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="glass p-6 rounded-2xl hover-lift">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Property Address</label>
                                            <div className="text-lg font-medium text-slate-100">{property.address}</div>
                                        </div>
                                        <div className="glass p-6 rounded-2xl hover-lift delay-100">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Landlord</label>
                                            <div className="text-lg font-medium text-slate-100">{property.landlordName}</div>
                                        </div>
                                        <div className="glass p-6 rounded-2xl hover-lift delay-200">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Lease End Date</label>
                                            <div className="text-lg font-medium text-slate-100">{property.leaseEndDate}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'maintenance' && (
                                <div className="animate-in fade-in space-y-6">
                                    <div className="flex justify-between items-center bg-slate-900/20 p-2 rounded-2xl">
                                        <h2 className="text-3xl font-black px-4 tracking-tight">Reported Issues</h2>
                                        <button
                                            onClick={() => setShowIssueModal(true)}
                                            className="btn-primary py-2.5 px-5 text-sm"
                                        >
                                            <Plus className="w-4 h-4 inline-block mr-1" /> New Request
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {issues.length === 0 ? (
                                            <div className="glass-card text-center py-16 rounded-3xl">
                                                <Wrench className="w-16 h-16 mx-auto mb-4 text-slate-600 opacity-50" />
                                                <p className="text-slate-400 font-medium text-lg">No issues reported. Everything looks good!</p>
                                            </div>
                                        ) : issues.map(issue => (
                                            <div key={issue.id} className="glass p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-blue-500/30 transition-all hover-lift">
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-3 rounded-xl mt-1 md:mt-0 shadow-lg ${issue.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
                                                        {issue.status === 'Resolved' ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                                                    </div>
                                                    <div>
                                                        <div className="text-lg font-bold text-white mb-1">{issue.description}</div>
                                                        <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                                                            <span className="bg-white/5 px-2 py-0.5 rounded-md border border-white/10 capitalize">{issue.category}</span>
                                                            <span>Reported: {issue.date}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${issue.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                                                    {issue.status}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'documents' && (
                                <div className="animate-in fade-in space-y-4">
                                    <h2 className="text-3xl font-black mb-6 tracking-tight">My Documents</h2>
                                    {documents.length === 0 ? (
                                        <div className="glass-card text-center py-16 rounded-3xl">
                                            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600 opacity-50" />
                                            <p className="text-slate-400 font-medium text-lg">No documents shared yet.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {documents.map(doc => (
                                                <div key={doc.id} className="glass p-5 rounded-2xl flex items-center justify-between hover:glow-blue transition-all hover-lift">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl text-blue-400 shadow-inner">
                                                            <FileText className="w-7 h-7" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white text-lg">{doc.filename}</div>
                                                            <div className="text-xs font-medium text-slate-400 tracking-wide uppercase mt-1">{doc.type} • {doc.upload_date}</div>
                                                        </div>
                                                    </div>
                                                    <button className="text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 p-2.5 rounded-xl transition-colors font-bold text-sm">Download</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Modals Container */}

                {showQRModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[#030712]/80 backdrop-blur-md" onClick={() => setShowQRModal(false)}></div>
                        <div className="glass-strong p-8 rounded-[2rem] max-w-sm w-full relative z-10 animate-in zoom-in slide-up">
                            <button onClick={() => setShowQRModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                            <h3 className="text-2xl font-black text-white mb-6 text-center">Scan to Pay Rent</h3>
                            <div className="bg-white p-6 rounded-2xl mb-6 shadow-inner">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=propnexa@bank&pn=PropNexa&am=0&cu=INR`}
                                    className="w-full h-auto aspect-square object-contain mx-auto mix-blend-multiply"
                                    alt="QR Code"
                                />
                            </div>
                            <div className="text-center bg-[#0f172a] p-3 rounded-xl border border-slate-800">
                                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">UPI ID</p>
                                <p className="text-white font-mono text-sm">propnexa@bank</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* New Issue Modal */}
                {showIssueModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-[#030712]/80 backdrop-blur-md" onClick={() => setShowIssueModal(false)}></div>
                        <div className="glass-strong border border-white/10 p-8 rounded-[2rem] w-full max-w-md shadow-2xl relative z-10 animate-in zoom-in slide-up glow-blue">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-white">Report New Issue</h3>
                                <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={submitIssue} className="space-y-5">
                                <div>
                                    <label className="block text-slate-300 font-semibold text-sm mb-2 tracking-wide">Category</label>
                                    <select
                                        value={newIssue.category}
                                        onChange={e => setNewIssue({ ...newIssue, category: e.target.value })}
                                        className="input-glass w-full"
                                    >
                                        <option value="plumbing">Plumbing</option>
                                        <option value="electrical">Electrical</option>
                                        <option value="painting">Painting</option>
                                        <option value="appliance">Appliance</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-300 font-semibold text-sm mb-2 tracking-wide">Description</label>
                                    <textarea
                                        value={newIssue.description}
                                        onChange={e => setNewIssue({ ...newIssue, description: e.target.value })}
                                        className="input-glass w-full min-h-[120px] resize-none"
                                        placeholder="Please provide details about the issue..."
                                        required
                                    />
                                </div>
                                <button type="submit" className="w-full btn-primary py-3.5 mt-2">Submit Maintenance Request</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
