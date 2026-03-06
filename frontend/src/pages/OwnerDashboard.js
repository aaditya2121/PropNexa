import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileText, AlertCircle, Search, Upload, Wrench, DollarSign, Users, TrendingUp, Printer, Download, Send, CheckCircle, Share2, UserPlus, LogOut, Home } from 'lucide-react';
import propnexaLogo from '../propnexa_logo.png';
import { getAllProperties, getAllMaintenance, getAllDocuments, getAnalytics, addProperty, updateProperty, addUser, addDocument, updateMaintenanceStatus } from '../firebase/firestore';
import { uploadDocument } from '../firebase/storage';

function OwnerDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };
  const [properties, setProperties] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // Tenant Form State
  const [newTenant, setNewTenant] = useState({
    name: '', username: '', password: '',
    property_id: '', rent_amount: '', lease_start: '', lease_end: ''
  });
  const [tenantFiles, setTenantFiles] = useState({ aadhaar: null, pan: null });
  // New Property State
  const [newProperty, setNewProperty] = useState({ address: '', type: 'Residential', rent_amount: '', owner_name: '' });
  // Receipt State
  const [receiptDetails, setReceiptDetails] = useState({ tenant_id: '', month: '', amount: '', date: new Date().toISOString().split('T')[0] });
  // Upload State
  const [uploadMeta, setUploadMeta] = useState({ property_id: '', tenant_id: '' });

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    try {
      await addProperty({
        address: newProperty.address,
        type: newProperty.type,
        rentAmount: parseFloat(newProperty.rent_amount),
        landlordName: newProperty.owner_name || 'Ishaan Chawla',
        leaseType: 'Fixed',
        status: 'Vacant'
      });
      alert('Property Created Successfully in Firestore!');
      setNewProperty({ address: '', type: 'Residential', rent_amount: '', owner_name: '' });
      fetchAllData();
    } catch (err) {
      console.error(err);
      alert('Error creating property');
    }
  };

  const handleQRUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { url } = await uploadDocument(file, 'qr_codes');
      alert(`QR Code Uploaded to Storage! URL: ${url}`);
    } catch (err) { alert('Upload failed'); }
  };

  const handleOnboardTenant = async (e) => {
    e.preventDefault();
    if (!newTenant.property_id) return alert('Please select a property');

    try {
      let aadhaarUrl = null;
      let panUrl = null;

      // 1. Upload Documents
      if (tenantFiles.aadhaar) {
        const res = await uploadDocument(tenantFiles.aadhaar, 'identification');
        aadhaarUrl = res.url;
      }
      if (tenantFiles.pan) {
        const res = await uploadDocument(tenantFiles.pan, 'identification');
        panUrl = res.url;
      }

      // 2. Create Tenant Data in Firestore (Note: Auth user creation typically requires Admin SDK or separate flow)
      const tenantId = newTenant.username; // Using username as ID for simplicity
      await addUser({
        name: newTenant.name,
        email: `${newTenant.username}@example.com`, // Pseudo email
        role: 'tenant',
        propertyId: newTenant.property_id,
        phone: "9999999999",
        aadhaarUrl,
        panUrl
      }, tenantId);

      // 3. Update Property with Tenant Info
      await updateProperty(newTenant.property_id, {
        tenantName: newTenant.name,
        tenantId: tenantId,
        rentAmount: parseFloat(newTenant.rent_amount),
        leaseStartDate: newTenant.lease_start,
        leaseEndDate: newTenant.lease_end,
        status: 'Occupied'
      });

      alert('Tenant Onboarded & Documents Uploaded Successfully!');
      setNewTenant({ name: '', username: '', password: '', property_id: '', rent_amount: '', lease_start: '', lease_end: '' });
      setTenantFiles({ aadhaar: null, pan: null });
      fetchAllData();
    } catch (err) {
      console.error(err);
      alert('Error onboarding tenant: ' + err.message);
    }
  };

  // Helper for Indian Currency Formatting
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch from Firestore instead of backend API
      const [propsData, maintenanceData, docsData, analyticsData] = await Promise.all([
        getAllProperties(),
        getAllMaintenance(),
        getAllDocuments(),
        getAnalytics()
      ]);

      setProperties(propsData);

      // Enrich maintenance data with property address
      const enrichedMaintenance = maintenanceData.map(issue => {
        const prop = propsData.find(p => p.id === issue.propertyId);
        return {
          ...issue,
          address: prop ? prop.address : 'Unknown Property'
        };
      });

      setMaintenance(enrichedMaintenance);
      setDocuments(docsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching data from Firestore:', error);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      // Simulate backend search with client-side filtering since backend is removed
      const lowerQuery = query.toLowerCase();

      const filteredMaintenance = maintenance.filter(issue =>
        (issue.address && issue.address.toLowerCase().includes(lowerQuery)) ||
        (issue.description && issue.description.toLowerCase().includes(lowerQuery)) ||
        (issue.category && issue.category.toLowerCase().includes(lowerQuery))
      );

      let answer = `Found ${filteredMaintenance.length} records matching "${query}".`;
      let totalCost = 0;

      if (filteredMaintenance.length > 0) {
        totalCost = filteredMaintenance.reduce((sum, item) => sum + (item.cost || 0), 0);
        if (lowerQuery.includes('cost') || lowerQuery.includes('spend') || lowerQuery.includes('total')) {
          answer += ` The total cost for these issues is ${formatCurrency(totalCost)}.`;
        }
      } else {
        answer = `No records found matching "${query}".`;
      }

      setQueryResult({
        answer: answer,
        data: filteredMaintenance,
        query_type: 'search'
      });

    } catch (error) {
      console.error('Query error:', error);
      setQueryResult({
        answer: 'Error processing query.',
        data: [],
        query_type: 'error'
      });
    }
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!uploadMeta.property_id) return alert("Please select a property first!");

    try {
      // Upload to Firebase Storage
      const { url, filename } = await uploadDocument(file, 'documents');

      // Save metadata to Firestore
      await addDocument({
        propertyId: uploadMeta.property_id,
        tenantId: uploadMeta.tenant_id,
        filename: filename,
        url: url,
        type: 'Lease/Contract' // Default type
      });

      alert('File Uploaded Successfully!');
      fetchAllData();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    }
  };

  const resolveIssue = async (id) => {
    try {
      await updateMaintenanceStatus(id, 'Resolved');
      alert('Issue marked as Resolved');
      fetchAllData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-50 font-sans selection:bg-blue-500/30 relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse glow-blue z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse delay-700 glow-accent z-0"></div>

      <div className="container mx-auto p-6 max-w-7xl relative z-10 animate-in slide-up">
        {/* Header */}
        <div className="mb-8 glass p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="relative group w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 glow-blue">
              <img
                src={propnexaLogo}
                alt="PropNexa Logo"
                className="relative w-14 h-14 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-b from-white via-blue-100 to-blue-400 bg-clip-text text-transparent">
                PropNexa
              </h1>
              <p className="text-blue-400 font-bold tracking-widest text-xs mt-2 uppercase">Full Stack AI-Powered Property Management</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 px-5 py-2.5 glass-card hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all hover-lift font-semibold text-sm">
              <Home className="w-4 h-4" /> Home
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-all border border-red-500/20 hover:border-red-500/40 hover-lift font-semibold text-sm">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-10 glass-strong rounded-[2rem] p-8 glow-blue animate-in fade-in slide-up delay-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-blue-500/50 w-6 h-6 group-focus-within:text-blue-400 group-focus-within:scale-110 transition-all duration-300" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
                placeholder="Ask AI: 'Show maintenance for Galaxy...', 'Expiring Leases'..."
                className="w-full input-glass pl-16 pr-6 py-5 rounded-2xl text-lg placeholder:text-slate-500"
              />
            </div>
            <button
              onClick={handleQuery}
              disabled={loading}
              className="btn-primary py-5 px-8 text-lg rounded-2xl md:w-auto w-full"
            >
              {loading ? 'Processing...' : 'Search'}
            </button>
          </div>

          {queryResult && (
            <div className="mt-6 p-6 glass-card rounded-2xl glow-blue animate-in slide-up">
              <p className="text-lg mb-6 text-slate-50 font-medium leading-relaxed border-l-4 border-blue-500 pl-4">{queryResult.answer}</p>
              {queryResult.data && queryResult.data.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {queryResult.data.map((item, idx) => (
                    <div key={idx} className="glass p-6 rounded-2xl transition-all duration-300 hover:border-blue-500/30 hover-lift">
                      {item.address && <div className="font-bold text-blue-300 mb-2 text-base">{item.address}</div>}
                      {item.description && <div className="text-slate-100/90 mb-3 leading-relaxed">{item.description}</div>}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {item.date && <span className="bg-slate-900/50 px-3 py-1.5 rounded-lg text-blue-400 border border-blue-500/20">📅 {item.date}</span>}
                        {item.cost > 0 && <span className="bg-blue-900/40 px-3 py-1.5 rounded-lg text-blue-300 font-semibold border border-blue-500/30">💰 {formatCurrency(item.cost)}</span>}
                        {item.total_cost > 0 && <span className="bg-blue-900/40 px-3 py-1.5 rounded-lg text-blue-300 font-semibold border border-blue-500/30">💵 Total: {formatCurrency(item.total_cost)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 md:gap-3 mb-10 glass p-3 rounded-2xl animate-in fade-in slide-up delay-200">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'properties', label: 'Properties', icon: Building2 },
            { id: 'maintenance', label: 'Maintenance', icon: Wrench },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'collect', label: 'Transactions', icon: DollarSign },
            { id: 'issue', label: 'Receipts', icon: Printer },
            { id: 'add_tenant', label: 'Add Tenant', icon: UserPlus },
            { id: 'add_property', label: 'Add Property', icon: Home },
            { id: 'upload', label: 'Upload Doc', icon: Upload }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] py-3.5 px-4 rounded-xl font-bold transition-all duration-300 capitalize flex items-center justify-center gap-2 ${activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/40 glow-blue'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {
          activeTab === 'dashboard' && analytics && (
            <div className="animate-in fade-in slide-up delay-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="glass-card p-6 rounded-3xl glow-on-hover hover-lift group cursor-pointer relative overflow-hidden">
                  <div className="absolute top-[-50%] right-[-10%] w-[150px] h-[150px] bg-blue-500/10 rounded-full blur-[40px] group-hover:bg-blue-500/20 transition-colors"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-3.5 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner border border-blue-500/20">
                      <Building2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 backdrop-blur-sm">Total</span>
                  </div>
                  <div className="text-4xl font-black mb-1 text-white tracking-tight relative z-10">{analytics.total_properties}</div>
                  <div className="text-blue-200/70 font-medium text-sm tracking-wide uppercase relative z-10">Properties Managed</div>
                </div>

                <div className="glass-card p-6 rounded-3xl glow-on-hover hover-lift group cursor-pointer relative overflow-hidden">
                  <div className="absolute top-[-50%] right-[-10%] w-[150px] h-[150px] bg-emerald-500/10 rounded-full blur-[40px] group-hover:bg-emerald-500/20 transition-colors"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-3.5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner border border-emerald-500/20">
                      <DollarSign className="w-6 h-6 text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 backdrop-blur-sm">Monthly</span>
                  </div>
                  <div className="text-4xl font-black mb-1 text-white tracking-tight relative z-10">{formatCurrency(analytics.total_monthly_rent)}</div>
                  <div className="text-emerald-200/70 font-medium text-sm tracking-wide uppercase relative z-10">Total Rent Roll</div>
                </div>

                <div className="glass-card p-6 rounded-3xl glow-on-hover hover-lift group cursor-pointer relative overflow-hidden">
                  <div className="absolute top-[-50%] right-[-10%] w-[150px] h-[150px] bg-orange-500/10 rounded-full blur-[40px] group-hover:bg-orange-500/20 transition-colors"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-3.5 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner border border-orange-500/20">
                      <Wrench className="w-6 h-6 text-orange-400" />
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 backdrop-blur-sm">Active</span>
                  </div>
                  <div className="text-4xl font-black mb-1 text-white tracking-tight relative z-10">{analytics.active_issues}</div>
                  <div className="text-orange-200/70 font-medium text-sm tracking-wide uppercase relative z-10">Maintenance Issues</div>
                </div>

                <div className="glass-card p-6 rounded-3xl glow-on-hover hover-lift group cursor-pointer relative overflow-hidden">
                  <div className="absolute top-[-50%] right-[-10%] w-[150px] h-[150px] bg-purple-500/10 rounded-full blur-[40px] group-hover:bg-purple-500/20 transition-colors"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-3.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner border border-purple-500/20">
                      <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 backdrop-blur-sm">YTD</span>
                  </div>
                  <div className="text-4xl font-black mb-1 text-white tracking-tight relative z-10">{formatCurrency(analytics.total_maintenance_cost)}</div>
                  <div className="text-purple-200/70 font-medium text-sm tracking-wide uppercase relative z-10">Maintenance Cost</div>
                </div>
              </div>

              <div className="glass-strong p-8 rounded-3xl glow-blue">
                <h3 className="text-2xl font-black mb-6 text-white tracking-tight">Maintenance by Category</h3>
                <div className="space-y-4">
                  {analytics.issues_by_category.map((cat, idx) => (
                    <div key={idx} className="glass p-5 rounded-2xl transition-all duration-300 hover-lift hover:border-blue-500/40 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className="w-2 h-14 bg-gradient-to-b from-blue-400 to-indigo-600 rounded-full shadow-lg shadow-blue-500/50"></div>
                          <div>
                            <div className="font-bold capitalize text-white text-lg">{cat.category}</div>
                            <div className="text-sm text-slate-400 font-medium">{cat.count} issue{cat.count !== 1 ? 's' : ''}</div>
                          </div>
                        </div>
                        <div className="text-emerald-400 font-bold font-mono bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 shadow-inner">
                          {formatCurrency(cat.total_cost)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        }

        {/* Properties Tab */}
        {
          activeTab === 'properties' && (
            <div className="space-y-5 animate-in fade-in slide-up delay-300">
              {properties.map((prop, idx) => (
                <div key={prop.id} className="glass-card p-6 rounded-3xl glow-on-hover hover-lift cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{prop.address}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300 font-medium">
                      <span className="px-3 py-1 bg-white/5 rounded-md border border-white/10">{prop.type}</span>
                      <span className="text-slate-500">•</span>
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20">{prop.leaseType} Leased</span>
                    </div>
                  </div>
                  <div className="text-left md:text-right w-full md:w-auto">
                    <div className="text-3xl font-black text-emerald-400 tracking-tight">{formatCurrency(prop.rentAmount)}<span className="text-sm text-emerald-400/50 font-normal ml-1 uppercase">/ mo</span></div>
                    <div className="text-slate-400 text-xs font-semibold tracking-wide uppercase mt-2">Expires: <span className="text-white">{prop.leaseEndDate}</span></div>
                  </div>
                  <div className="w-full md:w-auto flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-semibold tracking-wider uppercase mb-0.5">Current Tenant</div>
                      <div className="text-slate-50 font-bold">{prop.tenantName}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }

        {/* Maintenance Tab */}
        {
          activeTab === 'maintenance' && (
            <div className="space-y-4 animate-in fade-in slide-up delay-300">
              {maintenance.map((issue, idx) => (
                <div key={issue.id} className="glass p-6 rounded-3xl cursor-pointer hover-lift transition-all hover:border-blue-500/30">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                      <div className="font-black text-white text-xl mb-2 tracking-tight">{issue.address}</div>
                      <div className="text-slate-300 mb-4 leading-relaxed font-medium">{issue.description}</div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-semibold tracking-wide">
                        <span className="bg-white/5 px-3 py-1.5 rounded-md border border-white/10 uppercase">📅 {issue.date}</span>
                        <span className="bg-white/5 px-3 py-1.5 rounded-md border border-white/10 uppercase text-blue-300">👷 {issue.vendor}</span>
                        <span className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-300 px-3 py-1.5 rounded-md border border-blue-500/20 uppercase">{issue.category}</span>
                      </div>
                    </div>
                    <div className="text-left md:text-right flex flex-col md:items-end gap-3 w-full md:w-auto">
                      <div className="text-slate-50 font-black text-2xl tracking-tight">{formatCurrency(issue.cost)}</div>
                      <div className={`text-xs px-4 py-1.5 rounded-full font-bold tracking-widest uppercase border ${issue.status === 'Resolved'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20 animate-glow-pulse'
                        }`}>
                        {issue.status}
                      </div>
                      {issue.status !== 'Resolved' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); resolveIssue(issue.id); }}
                          className="mt-2 text-xs btn-primary bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 py-1.5 px-4 shadow-none"
                        >
                          <CheckCircle className="w-3 h-3 inline mr-1" /> Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }

        {/* Documents Tab */}
        {
          activeTab === 'documents' && (
            <div className="space-y-4 animate-in fade-in slide-up delay-300">
              {documents.map((doc, idx) => (
                <div key={doc.id} className="glass p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between glow-on-hover hover-lift group cursor-pointer border border-white/5 hover:border-blue-500/30 gap-4">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-all duration-300 group-hover:scale-110 border border-blue-500/10">
                      <FileText className="w-7 h-7 text-blue-400 group-hover:text-blue-300" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg mb-0.5 tracking-tight">{doc.filename}</div>
                      <div className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                        📁 Property ID: {doc.propertyId} <span className="text-slate-600 mx-2">•</span> 📅 {doc.uploadDate}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold border border-blue-500/20 uppercase tracking-widest whitespace-nowrap">
                      {doc.type}
                    </span>
                    <button className="p-2.5 bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-300 rounded-xl transition-colors shrink-0">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        }

        {/* Pay Rent Tab */}
        {/* Collect Rent Tab (Landlord View) */}
        {
          activeTab === 'collect' && (
            <div className="animate-in fade-in slide-up delay-300 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-strong p-8 rounded-3xl glow-blue flex flex-col">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl border border-emerald-500/20">
                    <DollarSign className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">Rent Collection Status</h3>
                    <p className="text-slate-400 text-sm font-medium">Manage and track pending payments</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {properties.map(prop => (
                    <div key={prop.id} className="glass p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center hover:border-blue-500/30 hover-lift transition-all gap-4">
                      <div className="flex-1">
                        <div className="font-bold text-white text-lg mb-1">{prop.address.split(',')[0]}</div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-400 font-medium">Tenant: <span className="text-slate-200">{prop.tenantName}</span></span>
                        </div>
                      </div>
                      <div className="text-left md:text-right w-full md:w-auto">
                        <div className="text-2xl font-black text-white">{formatCurrency(prop.rentAmount)}</div>
                        <div className="flex flex-wrap gap-2 mt-3 justify-start md:justify-end">
                          <button
                            className="text-xs font-bold btn-primary bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 py-1.5 px-4 shadow-none"
                            onClick={() => alert(`Marked ${prop.address} as PAID`)}
                          >
                            <CheckCircle className="w-3 h-3 inline mr-1" /> Mark Paid
                          </button>
                          <button
                            className="text-xs font-bold bg-white/10 hover:bg-blue-500/20 transition-colors text-blue-300 py-1.5 px-4 rounded-xl flex items-center gap-1 border border-white/10 hover:border-blue-500/30"
                            onClick={() => window.open(`https://wa.me/?text=Hello ${prop.tenantName}, this is a reminder to pay rent of ${formatCurrency(prop.rentAmount)} for ${prop.address}. Please pay via UPI.`, '_blank')}
                          >
                            <Send className="w-3 h-3" /> Remind
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-8 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden h-fit sticky top-6">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none"></div>

                <h3 className="text-2xl font-black text-white mb-2 relative z-10">Receive Payments</h3>
                <p className="text-slate-400 font-medium text-sm mb-8 relative z-10">Show this QR to tenants for direct transfer</p>

                <div className="bg-white p-6 rounded-[2rem] shadow-2xl shadow-blue-900/40 mb-8 relative z-10 border-4 border-white/10">
                  <div className="border border-slate-200 rounded-xl overflow-hidden p-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=propnexa@bank&pn=PropNexa&am=0&cu=INR`}
                      onError={(e) => e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=propnexa@bank&pn=PropNexa&am=0&cu=INR`}
                      alt="My UPI QR Code"
                      className="w-56 h-56 md:w-64 md:h-64 object-contain mix-blend-multiply"
                    />
                  </div>
                </div>

                <label className="relative z-10 cursor-pointer text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 py-2.5 px-6 rounded-xl border border-white/10 transition-all uppercase tracking-wider">
                  <Upload className="w-3 h-3 inline mr-2" /> Upload Custom QR
                  <input type="file" onChange={handleQRUpload} className="hidden" />
                </label>

                <p className="text-xs text-slate-500 mt-6 font-medium relative z-10 bg-[#030712] px-4 py-2 rounded-full border border-white/5 shadow-inner">UPI: propnexa@bank</p>

                <div className="flex items-center gap-3 mt-4 text-xs font-bold text-slate-400 grayscale opacity-60">
                  <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span>
                </div>
              </div>
            </div>
          )
        }

        {/* Issue Receipts Tab (Landlord View) */}
        {
          activeTab === 'issue' && (
            <div className="animate-in fade-in slide-up delay-300 max-w-4xl mx-auto">
              <div className="glass-strong p-8 md:p-10 rounded-[2.5rem] glow-blue shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-white/10 pb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl border border-blue-500/20">
                      <FileText className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight">Generate Rent Receipt</h3>
                      <p className="text-slate-400 text-sm font-medium">Create and share official receipts</p>
                    </div>
                  </div>
                  <button className="btn-primary flex items-center gap-2 py-3 px-6 shadow-none font-bold" onClick={() => window.open(`https://wa.me/?text=Here is your rent receipt for ${receiptDetails.month}. Amount: ${receiptDetails.amount}. Property: ${properties.find(p => p.id === receiptDetails.tenant_id)?.address}`, '_blank')}>
                    <Share2 className="w-4 h-4" /> Share to WhatsApp
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm font-bold uppercase tracking-wider pl-1">Select Tenant / Property</label>
                    <div className="relative">
                      <select value={receiptDetails.tenant_id} onChange={e => {
                        const p = properties.find(x => x.id === e.target.value);
                        setReceiptDetails({ ...receiptDetails, tenant_id: e.target.value, amount: p ? p.rentAmount : '' });
                      }} className="w-full input-glass p-4 rounded-2xl bg-[#030712]/50 text-white appearance-none cursor-pointer">
                        <option value="">Choose a Tenant</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.tenantName} - {p.address}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">▼</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-2 text-sm font-bold uppercase tracking-wider pl-1">For Month</label>
                    <input type="month" value={receiptDetails.month} onChange={e => setReceiptDetails({ ...receiptDetails, month: e.target.value })} className="w-full input-glass p-4 rounded-2xl bg-[#030712]/50 text-white css-invert-calendar" />
                  </div>
                </div>

                {/* Receipt Preview */}
                {/* Receipt Preview */}
                {receiptDetails.tenant_id && (
                  <div className="bg-white text-slate-900 p-8 rounded-lg shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Building2 className="w-32 h-32" />
                    </div>

                    <div className="text-center mb-8 border-b-2 border-slate-900 pb-4">
                      <h2 className="text-3xl font-serif font-bold">RENT PAYMENT RECEIPT</h2>
                      <p className="text-sm text-slate-500 mt-1">Authorized Official Receipt</p>
                    </div>

                    <div className="space-y-4 relative z-10 text-left">
                      <div className="flex items-center gap-2">
                        <span className="w-32 text-slate-600 font-semibold">Received from:</span>
                        <input
                          type="text"
                          value={receiptDetails.tenant_name || ''}
                          onChange={e => setReceiptDetails({ ...receiptDetails, tenant_name: e.target.value })}
                          className="font-bold border-b-2 border-slate-900 px-2 flex-1 outline-none bg-transparent hover:bg-slate-50 focus:bg-blue-50 transition-colors"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-32 text-slate-600 font-semibold">The sum of:</span>
                        <input
                          type="text"
                          value={receiptDetails.amount ? formatCurrency(receiptDetails.amount) : ''}
                          onChange={e => setReceiptDetails({ ...receiptDetails, amount: e.target.value.replace(/[^0-9]/g, '') })}
                          className="font-bold border-b-2 border-slate-900 px-2 flex-1 outline-none bg-transparent hover:bg-slate-50 focus:bg-blue-50 transition-colors"
                        />
                      </div>
                      <div className="">
                        <span className="text-slate-600 block mb-1 font-semibold">Being rent for the premises at:</span>
                        <textarea
                          value={receiptDetails.address || ''}
                          onChange={e => setReceiptDetails({ ...receiptDetails, address: e.target.value })}
                          className="font-bold block w-full border-l-4 border-slate-900 pl-4 py-2 bg-slate-100 rounded-r outline-none resize-none hover:bg-blue-50 focus:bg-white transition-colors"
                          rows="2"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-32 text-slate-600 font-semibold">Month:</span>
                        <span className="font-bold border-b-2 border-slate-900 px-2 flex-1">{receiptDetails.month ? new Date(receiptDetails.month).toLocaleDateString('default', { month: 'long', year: 'numeric' }) : 'Current Month'}</span>
                      </div>
                    </div>

                    <div className="mt-12 flex justify-between items-end">
                      <div className="text-sm text-slate-500">
                        <p>Date: {new Date().toLocaleDateString()}</p>
                        <p>Location: Mumbai</p>
                      </div>
                      <div className="text-center">
                        <p className="font-serif italic text-lg mb-1">{properties.find(p => p.id === receiptDetails.tenant_id)?.landlordName || 'Authorized Signatory'}</p>
                        <div className="h-0 w-32 border-b border-slate-900 mb-1"></div>
                        <p className="text-xs font-bold uppercase tracking-wider">Landlord Signature</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        }

        {/* Upload Tab */}
        {
          activeTab === 'upload' && (
            <div className="glass-strong p-8 rounded-2xl glow-blue animate-in fade-in zoom-in-95">
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={uploadMeta.property_id} onChange={e => setUploadMeta({ ...uploadMeta, property_id: e.target.value })} className="input-glass p-3 rounded-lg bg-slate-900 text-slate-300 border border-slate-700/50">
                  <option value="">Select Property (required)</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.address}</option>)}
                </select>
                <select value={uploadMeta.tenant_id} onChange={e => setUploadMeta({ ...uploadMeta, tenant_id: e.target.value })} className="input-glass p-3 rounded-lg bg-slate-900 text-slate-300 border border-slate-700/50">
                  <option value="">Select Tenant (Optional)</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.tenantName}</option>)}
                </select>
              </div>
              <div className="border-2 border-dashed border-blue-500/30 rounded-2xl p-16 text-center hover:border-blue-500 hover:bg-blue-950/20 transition-all duration-300 group animate-glow-pulse">
                <Upload className="w-16 h-16 mx-auto mb-6 text-blue-500/50 group-hover:text-blue-400 transition-all duration-300 group-hover:scale-110 animate-float" />
                <label className="cursor-pointer block">
                  <span className="text-blue-400 font-bold text-lg hover:text-blue-300 underline decoration-2 underline-offset-4 transition-colors">Click to upload document</span>
                  <span className="text-slate-400 block mt-2">or drag and drop files here</span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </label>
                <p className="text-slate-500 text-sm mt-6">Supported: PDF, JPG, PNG, DOC (max 10MB)</p>
              </div>

              <div className="mt-8 bubble p-6 rounded-xl flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-400 leading-relaxed">
                  <strong className="text-blue-400 block mb-1 text-base">System Connected</strong>
                  Files are securely stored in the local database. Our AI automatically extracts metadata, categorizes details, and links them to specific properties.
                </div>
              </div>
            </div>
          )
        }

        {/* Add Tenant Tab */}
        {
          activeTab === 'add_tenant' && (
            <div className="glass-strong p-8 rounded-2xl glow-blue animate-in fade-in zoom-in-95 max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Onboard New Tenant</h3>
                  <p className="text-slate-400 text-sm">Create credentials and assign property</p>
                </div>
              </div>

              <form onSubmit={handleOnboardTenant} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Property Selection */}
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-2 pl-1 font-bold uppercase tracking-wider text-xs">Assign Property</label>
                  <div className="relative">
                    <select
                      value={newTenant.property_id}
                      onChange={e => setNewTenant({ ...newTenant, property_id: e.target.value })}
                      className="w-full input-glass p-4 rounded-2xl text-white appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Select Property</option>
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.address} {p.tenantName ? `(Current: ${p.tenantName})` : '(Vacant)'}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">▼</div>
                  </div>
                </div>

                <div className="space-y-5 glass p-6 rounded-3xl">
                  <h4 className="text-blue-400 font-black uppercase text-sm tracking-widest border-b border-blue-500/20 pb-3 mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Personal Details</h4>
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-2 pl-1 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      value={newTenant.name}
                      onChange={e => setNewTenant({ ...newTenant, name: e.target.value })}
                      className="w-full input-glass p-4 rounded-2xl text-white placeholder:text-slate-600"
                      placeholder="e.g. Rahul Sharma"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-2 pl-1 uppercase tracking-wider">Username (Login ID)</label>
                    <input
                      type="text"
                      value={newTenant.username}
                      onChange={e => setNewTenant({ ...newTenant, username: e.target.value })}
                      className="w-full input-glass p-4 rounded-2xl text-white placeholder:text-slate-600"
                      placeholder="e.g. rahul_sharma"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-2 pl-1 uppercase tracking-wider">Password</label>
                    <input
                      type="text"
                      value={newTenant.password}
                      onChange={e => setNewTenant({ ...newTenant, password: e.target.value })}
                      className="w-full input-glass p-4 rounded-2xl text-white placeholder:text-slate-600"
                      placeholder="Secret Password"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-5 glass p-6 rounded-3xl">
                  <h4 className="text-emerald-400 font-black uppercase text-sm tracking-widest border-b border-emerald-500/20 pb-3 mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Lease Terms</h4>
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-2 pl-1 uppercase tracking-wider">Monthly Rent (₹)</label>
                    <input
                      type="number"
                      value={newTenant.rent_amount}
                      onChange={e => setNewTenant({ ...newTenant, rent_amount: e.target.value })}
                      className="w-full input-glass p-4 rounded-2xl text-white placeholder:text-slate-600 font-mono text-lg"
                      placeholder="45000"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 text-xs font-bold mb-2 pl-1 uppercase tracking-wider">Start Date</label>
                      <input
                        type="date"
                        value={newTenant.lease_start}
                        onChange={e => setNewTenant({ ...newTenant, lease_start: e.target.value })}
                        className="w-full input-glass p-4 rounded-2xl text-white css-invert-calendar appearance-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs font-bold mb-2 pl-1 uppercase tracking-wider">End Date</label>
                      <input
                        type="date"
                        value={newTenant.lease_end}
                        onChange={e => setNewTenant({ ...newTenant, lease_end: e.target.value })}
                        className="w-full input-glass p-4 rounded-2xl text-white css-invert-calendar appearance-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-5 glass p-6 rounded-3xl mt-2">
                  <h4 className="text-yellow-400 font-black uppercase text-sm tracking-widest border-b border-yellow-500/20 pb-3 mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> Identity Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-400 text-xs font-bold mb-2 pl-1 uppercase tracking-wider">Aadhaar Card (PDF/JPG)</label>
                      <input
                        type="file"
                        onChange={e => setTenantFiles({ ...tenantFiles, aadhaar: e.target.files[0] })}
                        className="w-full input-glass p-2 text-slate-300 text-sm file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-wider file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30 transition-all cursor-pointer"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs font-bold mb-2 pl-1 uppercase tracking-wider">PAN Card (PDF/JPG)</label>
                      <input
                        type="file"
                        onChange={e => setTenantFiles({ ...tenantFiles, pan: e.target.files[0] })}
                        className="w-full input-glass p-2 text-slate-300 text-sm file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-wider file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30 transition-all cursor-pointer"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 pt-6">
                  <button type="submit" className="w-full btn-primary py-5 text-lg shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]">
                    <UserPlus className="w-5 h-5 inline mr-2" /> Create Tenant Account
                  </button>
                </div>
              </form>
            </div>
          )
        }

        {/* Add Property Tab */}
        {/* Add Property Tab */}
        {
          activeTab === 'add_property' && (
            <div className="glass-strong p-8 md:p-10 rounded-[2.5rem] glow-blue animate-in fade-in slide-up delay-300 max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>
              <div className="flex items-center gap-5 mb-10 border-b border-white/10 pb-6 relative z-10">
                <div className="p-4 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl border border-blue-500/20 shadow-inner">
                  <Building2 className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white tracking-tight leading-tight">Add New Property</h3>
                  <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase mt-1">Expand Your Portfolio</p>
                </div>
              </div>

              <form onSubmit={handleCreateProperty} className="space-y-6 relative z-10">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 pl-1">Property Address</label>
                  <input type="text" value={newProperty.address} onChange={e => setNewProperty({ ...newProperty, address: e.target.value })} className="w-full input-glass p-4 rounded-2xl text-white placeholder:text-slate-600 text-lg" placeholder="e.g. 502, Ocean View, Mumbai" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 pl-1">Property Type</label>
                    <div className="relative">
                      <select value={newProperty.type} onChange={e => setNewProperty({ ...newProperty, type: e.target.value })} className="w-full input-glass p-4 rounded-2xl text-white appearance-none cursor-pointer text-lg">
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Industrial">Industrial</option>
                      </select>
                      <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-blue-400">▼</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 pl-1">Expected Rent (₹)</label>
                    <input type="number" value={newProperty.rent_amount} onChange={e => setNewProperty({ ...newProperty, rent_amount: e.target.value })} className="w-full input-glass p-4 rounded-2xl text-white placeholder:text-slate-600 font-mono text-lg" placeholder="25000" required />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 pl-1">Owner Name (for Records)</label>
                  <input type="text" value={newProperty.owner_name} onChange={e => setNewProperty({ ...newProperty, owner_name: e.target.value })} className="w-full input-glass p-4 rounded-2xl text-white placeholder:text-slate-600 text-lg" placeholder="Ishaan Chawla" required />
                </div>
                <button type="submit" className="w-full btn-primary py-5 mt-4 text-lg font-black tracking-wide shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]">
                  <Building2 className="w-5 h-5 inline mr-2" /> Add Property to Portfolio
                </button>
              </form>
            </div>
          )
        }
      </div >
    </div >
  );
}

export default OwnerDashboard;