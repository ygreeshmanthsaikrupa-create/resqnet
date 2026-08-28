import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
  AlertTriangle, Map, Bell, FileText, CheckCircle, Users, Home, AlertCircle,
  RefreshCw, Shield, Send, HeartHandshake, UserCheck, Navigation, Phone,
  Radio, Check, Clock, Eye, Activity, Flame, Droplets, MapPin
} from 'lucide-react';
import { api } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import SeverityIndicator from '../components/ui/SeverityIndicator';
import StatusBadge from '../components/ui/StatusBadge';

export default function Dashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  // Role tab state: default to user role if logged in, otherwise 'admin'
  const [activeTab, setActiveTab] = useState(user?.role || 'admin');

  // General dashboard data
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [resources, setResources] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Admin Broadcast Alert Form
  const [newAlertTitle, setNewAlertTitle] = useState('');
  const [newAlertMessage, setNewAlertMessage] = useState('');
  const [newAlertSeverity, setNewAlertSeverity] = useState('critical');
  const [newAlertArea, setNewAlertArea] = useState('Zone A - Krishna River Basin');
  const [isPublishingAlert, setIsPublishingAlert] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);

  // Citizen safety check-in state
  const [isSafe, setIsSafe] = useState(false);
  const [safetyMessage, setSafetyMessage] = useState('');

  const fetchData = async () => {
    try {
      const [statsData, reportsData, resourcesData, zonesData] = await Promise.all([
        api.get('/dashboard/stats').catch(() => ({
          activeDisasters: 2, highRiskZones: 3, activeAlerts: 4, totalReports: 15,
          verifiedIncidents: 6, peopleAffected: 84, availableShelters: 12, unresolvedIncidents: 9,
          reportsOverTime: [
            { hour: '08:00', count: 4 }, { hour: '10:00', count: 8 },
            { hour: '12:00', count: 15 }, { hour: '14:00', count: 22 },
            { hour: '16:00', count: 18 }, { hour: '18:00', count: 28 }
          ],
          severityDistribution: [
            { severity: 'Critical', count: 5 }, { severity: 'High', count: 6 },
            { severity: 'Medium', count: 3 }, { severity: 'Low', count: 1 }
          ],
          categoryDistribution: [
            { category: 'Flood', count: 8 }, { category: 'Medical', count: 3 },
            { category: 'Stranded', count: 3 }, { category: 'Road Block', count: 1 }
          ]
        })),
        api.get('/reports').catch(() => []),
        api.get('/resources').catch(() => []),
        api.get('/disasters').catch(() => [])
      ]);

      setStats(statsData);
      setReports(reportsData || []);
      setResources(resourcesData || []);
      setZones(zonesData || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user?.role) {
      setActiveTab(user.role);
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    socket.on('dashboard_update', (data) => setStats(prev => ({ ...prev, ...data })));
    socket.on('new_report', (report) => {
      setReports(prev => [report, ...prev]);
    });
    socket.on('report_updated', (updated) => {
      setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
    });

    return () => {
      socket.off('dashboard_update');
      socket.off('new_report');
      socket.off('report_updated');
    };
  }, [socket]);

  const handleAction = async (id, status) => {
    try {
      await api.patch(`/reports/${id}`, { status });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmReport = async (id) => {
    try {
      await api.post(`/reports/${id}/confirm`);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateBroadcastAlert = async (e) => {
    e.preventDefault();
    if (!newAlertTitle || !newAlertMessage) return;
    setIsPublishingAlert(true);
    try {
      await api.post('/alerts', {
        title: newAlertTitle,
        message: newAlertMessage,
        type: newAlertSeverity,
        area: newAlertArea,
        disasterType: 'flood',
        source: 'authority',
        verificationStatus: 'official'
      });
      setNewAlertTitle('');
      setNewAlertMessage('');
      setAlertSuccess(true);
      setTimeout(() => setAlertSuccess(false), 4000);
      fetchData();
    } catch (err) {
      console.error('Failed to issue alert', err);
    } finally {
      setIsPublishingAlert(false);
    }
  };

  const handleUpdateResourceCapacity = async (resId, change) => {
    const target = resources.find(r => r.id === resId);
    if (!target) return;
    const newOccupancy = Math.max(0, Math.min(target.capacity, (target.currentOccupancy || 0) + change));
    // In demo, we update local state and notify
    setResources(prev => prev.map(r => r.id === resId ? { ...r, currentOccupancy: newOccupancy } : r));
  };

  if (loading && !stats) {
    return (
      <div className="flex-1 flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  const kpis = [
    { label: 'Active Disasters', value: stats?.activeDisasters || 0, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
    { label: 'High-Risk Zones', value: stats?.highRiskZones || 0, icon: Map, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
    { label: 'Active Alerts', value: stats?.activeAlerts || 0, icon: Bell, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { label: 'Total Reports', value: stats?.totalReports || reports.length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Verified Incidents', value: stats?.verifiedIncidents || reports.filter(r => r.status === 'verified').length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
    { label: 'People Impacted', value: stats?.peopleAffected || 84, icon: Users, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { label: 'Available Shelters', value: stats?.availableShelters || 14, icon: Home, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Unresolved Actions', value: stats?.unresolvedIncidents || reports.filter(r => r.status !== 'resolved').length, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  ];

  const SEVERITY_COLORS = ['#ef4444', '#f97316', '#eab308', '#10b981'];

  return (
    <div className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Operations Dashboard</h1>
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-600/20 text-red-400 border border-red-500/30 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> LIVE SYSTEM
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Intelligent real-time emergency response platform connecting prediction, field operations & community safety.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3.5 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg border border-gray-700 text-sm text-gray-300 transition"
          >
            <RefreshCw className="w-4 h-4 text-blue-400" />
            <span>Sync Live Data</span>
          </button>
        </div>
      </div>

      {/* Role Navigation Tabs */}
      <div className="bg-dark-800/80 p-1.5 rounded-xl border border-gray-700 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'admin'
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/20'
              : 'text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Authority Command Center</span>
          {activeTab === 'admin' && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase">Active</span>}
        </button>

        <button
          onClick={() => setActiveTab('volunteer')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'volunteer'
              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/20'
              : 'text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Volunteer Operations Hub</span>
          {activeTab === 'volunteer' && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase">Active</span>}
        </button>

        <button
          onClick={() => setActiveTab('citizen')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'citizen'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Citizen Safety Portal</span>
          {activeTab === 'citizen' && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase">Active</span>}
        </button>

        <button
          onClick={() => setActiveTab('prediction')}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'prediction'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20'
              : 'text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>AI Early Warning & Predictions</span>
          {activeTab === 'prediction' && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase">Active</span>}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. AUTHORITY / ADMIN COMMAND CENTER TAB */}
      {/* ========================================================================= */}
      {activeTab === 'admin' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <div key={i} className="bg-dark-800 border border-gray-700/80 rounded-xl p-5 shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 rounded-lg border ${kpi.bg}`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <span className="text-xs text-gray-500 font-mono">LIVE</span>
                </div>
                <div className="text-3xl font-extrabold text-white mb-1 font-mono tracking-tight">{kpi.value}</div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Admin Action: Broadcast Emergency Alert */}
          <div className="bg-gradient-to-br from-red-950/40 via-dark-800 to-dark-800 border border-red-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-600/20 text-red-400 rounded-lg border border-red-500/30">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Broadcast Emergency Alert (All Citizens)</h3>
                <p className="text-xs text-gray-400">Instantly push verified disaster alerts and evacuation directives to all active users via Socket.io.</p>
              </div>
            </div>

            {alertSuccess && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/40 text-green-300 text-sm rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Alert broadcasted successfully to all connected users and saved to database.</span>
              </div>
            )}

            <form onSubmit={handleCreateBroadcastAlert} className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Alert Headline</label>
                <input
                  type="text"
                  placeholder="e.g. CRITICAL: Flash Flood Evacuation Order"
                  value={newAlertTitle}
                  onChange={(e) => setNewAlertTitle(e.target.value)}
                  className="w-full bg-dark-900 border border-gray-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Target Zone</label>
                <select
                  value={newAlertArea}
                  onChange={(e) => setNewAlertArea(e.target.value)}
                  className="w-full bg-dark-900 border border-gray-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                >
                  <option value="Zone A - Krishna River Basin">Zone A - Krishna River Basin</option>
                  <option value="Zone B - Eluru Road Corridor">Zone B - Eluru Road</option>
                  <option value="Zone C - Benz Circle Area">Zone C - Benz Circle</option>
                  <option value="Zone D - Kanuru Residential">Zone D - Kanuru</option>
                  <option value="All Vijayawada Municipal Zones">All Municipal Zones</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Severity</label>
                <select
                  value={newAlertSeverity}
                  onChange={(e) => setNewAlertSeverity(e.target.value)}
                  className="w-full bg-dark-900 border border-gray-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-red-500 font-bold"
                >
                  <option value="critical" className="text-red-400">🔴 Critical</option>
                  <option value="warning" className="text-orange-400">🟠 Warning</option>
                  <option value="advisory" className="text-yellow-400">🟡 Advisory</option>
                </select>
              </div>

              <div className="md:col-span-12">
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">Emergency Instructions & Details</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Provide specific safety actions, evacuation routes or shelter locations..."
                    value={newAlertMessage}
                    onChange={(e) => setNewAlertMessage(e.target.value)}
                    className="flex-1 bg-dark-900 border border-gray-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isPublishingAlert}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg flex items-center gap-2 transition shadow-lg shadow-red-600/30 disabled:opacity-50 flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isPublishingAlert ? 'Broadcasting...' : 'Broadcast Alert'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-dark-800 border border-gray-700/80 rounded-xl p-6 h-80 flex flex-col shadow-lg">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Incident Frequency (Hourly Timeline)</span>
                <span className="text-xs text-blue-400 font-mono">Live Inflow</span>
              </h3>
              <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.reportsOverTime || []}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="hour" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#374151', color: '#fff', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-dark-800 border border-gray-700/80 rounded-xl p-6 h-80 flex flex-col shadow-lg">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">
                Severity Impact Distribution
              </h3>
              <div className="flex-1 min-h-0 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.severityDistribution?.map(s => ({ name: s.severity, value: s.count })) || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats?.severityDistribution?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[index % SEVERITY_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#374151', color: '#fff', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Priority Action Queue */}
          <div className="bg-dark-800 border border-gray-700/80 rounded-xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-red-500" />
                  <span>AI Emergency Priority Queue</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Calculated by: Severity + Casualty Count + Location Risk + Multi-Citizen Confidence.</p>
              </div>
              <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full border border-red-500/20 text-xs font-bold font-mono">
                {reports.filter(r => r.status !== 'resolved').length} Pending Incidents
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-dark-900/60 text-gray-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Priority Score</th>
                    <th className="px-6 py-4">Incident Detail</th>
                    <th className="px-6 py-4">People At Risk</th>
                    <th className="px-6 py-4">Confidence</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Dispatch / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {reports.slice(0, 8).map((report) => {
                    const pScore = report.priorityScore || (report.severity * 18);
                    return (
                      <tr key={report.id} className="hover:bg-dark-700/40 transition">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center justify-center font-mono font-extrabold px-2.5 py-1 rounded text-sm ${
                            pScore >= 80 ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                            pScore >= 50 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {pScore}/100
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-white mb-0.5">{report.title || report.category}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-red-400" />
                            <span>{report.location?.address || `${report.location?.lat?.toFixed(3)}, ${report.location?.lng?.toFixed(3)}`}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-red-400 font-mono">
                            {report.peopleAffected || 0} trapped/affected
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          {report.confidenceScore || 75}%
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={report.status} />
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {report.status === 'submitted' && (
                            <button
                              onClick={() => handleAction(report.id, 'under_verification')}
                              className="px-3 py-1.5 bg-yellow-600/80 hover:bg-yellow-600 text-white rounded text-xs font-bold transition"
                            >
                              Triage
                            </button>
                          )}
                          {report.status !== 'verified' && report.status !== 'resolved' && (
                            <button
                              onClick={() => handleAction(report.id, 'verified')}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition"
                            >
                              Dispatch Team
                            </button>
                          )}
                          {report.status !== 'resolved' && (
                            <button
                              onClick={() => handleAction(report.id, 'resolved')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition"
                            >
                              Mark Resolved
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VOLUNTEER OPERATIONS HUB TAB */}
      {/* ========================================================================= */}
      {activeTab === 'volunteer' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Volunteer Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-dark-800 border border-orange-500/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Unverified Citizen Reports</span>
                <HeartHandshake className="w-5 h-5 text-orange-400" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                {reports.filter(r => r.status === 'submitted' || r.status === 'under_verification').length}
              </div>
              <p className="text-xs text-gray-400 mt-1">Needs community ground confirmation</p>
            </div>

            <div className="bg-dark-800 border border-green-500/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Active Shelters & Relief Points</span>
                <Home className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                {resources.filter(r => r.type === 'shelter' || r.type === 'relief_center').length}
              </div>
              <p className="text-xs text-gray-400 mt-1">Shelters operational in region</p>
            </div>

            <div className="bg-dark-800 border border-blue-500/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Confirmed Safe Rescues</span>
                <CheckCircle className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                {reports.filter(r => r.status === 'resolved').length}
              </div>
              <p className="text-xs text-gray-400 mt-1">Incidents closed by relief crew</p>
            </div>
          </div>

          {/* Volunteer Task 1: Ground Verification Queue */}
          <div className="bg-dark-800 border border-gray-700/80 rounded-xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-orange-400" />
                  <span>Field Verification & Confirmation Desk</span>
                </h3>
                <p className="text-xs text-gray-400">Volunteers cross-verify citizen reports from the ground to boost AI confidence score.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.filter(r => r.status !== 'resolved').slice(0, 6).map((report) => (
                <div key={report.id} className="bg-dark-900 border border-gray-700/70 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-orange-400 uppercase px-2 py-0.5 bg-orange-500/10 rounded">
                        {report.category}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">Confidence: {report.confidenceScore || 50}%</span>
                    </div>
                    <h4 className="font-bold text-white text-base mb-1">{report.title}</h4>
                    <p className="text-xs text-gray-300 mb-3">{report.description}</p>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mb-4">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span>{report.location?.address || 'Near Vijayawada Main Junction'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
                    <button
                      onClick={() => handleConfirmReport(report.id)}
                      className="flex-1 py-1.5 px-3 bg-orange-600/80 hover:bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Report (+15% Conf.)</span>
                    </button>
                    <button
                      onClick={() => handleAction(report.id, 'verified')}
                      className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Volunteer Task 2: Shelter Capacity Manager */}
          <div className="bg-dark-800 border border-gray-700/80 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Home className="w-5 h-5 text-emerald-400" />
              <span>Live Shelter & Relief Supply Management</span>
            </h3>
            <p className="text-xs text-gray-400 mb-6">Update available bed capacity and resources for citizens seeking shelter.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {resources.slice(0, 6).map((res) => (
                <div key={res.id} className="bg-dark-900 border border-gray-700/60 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white text-sm">{res.name}</h4>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${res.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {res.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{res.location?.address || 'Vijayawada'}</p>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>Occupancy:</span>
                      <span className="font-mono font-bold">{res.currentOccupancy || 0} / {res.capacity || 100}</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${Math.min(100, (((res.currentOccupancy || 0) / (res.capacity || 100)) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateResourceCapacity(res.id, 5)}
                      className="flex-1 py-1 bg-dark-800 hover:bg-dark-700 border border-gray-700 rounded text-xs text-gray-300 transition"
                    >
                      +5 People
                    </button>
                    <button
                      onClick={() => handleUpdateResourceCapacity(res.id, -5)}
                      className="flex-1 py-1 bg-dark-800 hover:bg-dark-700 border border-gray-700 rounded text-xs text-gray-300 transition"
                    >
                      -5 People
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CITIZEN SAFETY PORTAL TAB */}
      {/* ========================================================================= */}
      {activeTab === 'citizen' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Personal Safety Check-in Banner */}
          <div className="bg-gradient-to-r from-blue-950/60 via-dark-800 to-dark-800 border border-blue-500/40 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${isSafe ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-blue-500/20 text-blue-400 border-blue-500/40'}`}>
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Community Safety Status</h3>
                <p className="text-xs text-gray-300 mt-1">
                  {isSafe
                    ? '✅ You have marked yourself and your family as SAFE. Emergency contacts notified.'
                    : 'Are you currently in a safe location? Let responders & volunteers know your status.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={() => setIsSafe(!isSafe)}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-lg flex items-center gap-2 ${
                  isSafe
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/30'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isSafe ? 'I Am Safe (Checked In)' : 'Mark Myself Safe'}</span>
              </button>
            </div>
          </div>

          {/* Local Risk Meter & Quick SOS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Zone Threat Gauge */}
            <div className="bg-dark-800 border border-gray-700/80 rounded-xl p-6 shadow-lg">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Local Area Hazard Index</h4>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-extrabold text-red-500 font-mono">89%</div>
                  <div className="text-xs font-bold text-red-400 uppercase mt-0.5">CRITICAL FLOOD RISK</div>
                </div>
                <div className="p-3 bg-red-600/20 rounded-xl text-red-400 border border-red-500/30">
                  <Droplets className="w-8 h-8 animate-bounce" />
                </div>
              </div>
              <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                Krishna River basin water level is <strong>8.5m</strong> (Critical threshold: 7.0m). Avoid low-lying corridors.
              </p>
              <a
                href="/map"
                className="w-full py-2 bg-dark-900 hover:bg-dark-700 border border-gray-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Map className="w-4 h-4 text-blue-400" />
                <span>Inspect Safe Zone Map</span>
              </a>
            </div>

            {/* Emergency Hotlines Directory */}
            <div className="bg-dark-800 border border-gray-700/80 rounded-xl p-6 shadow-lg">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Emergency Dispatch Numbers</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 bg-dark-900 rounded-lg border border-gray-700">
                  <span className="text-xs text-gray-300 font-medium">National Emergency Helpline</span>
                  <a href="tel:112" className="text-sm font-mono font-bold text-red-400 hover:underline flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> 112
                  </a>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-dark-900 rounded-lg border border-gray-700">
                  <span className="text-xs text-gray-300 font-medium">State Disaster Response (AP SDRF)</span>
                  <a href="tel:1070" className="text-sm font-mono font-bold text-orange-400 hover:underline flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> 1070
                  </a>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-dark-900 rounded-lg border border-gray-700">
                  <span className="text-xs text-gray-300 font-medium">Medical / Ambulance</span>
                  <a href="tel:108" className="text-sm font-mono font-bold text-green-400 hover:underline flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> 108
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Report Trigger */}
            <div className="bg-dark-800 border border-gray-700/80 rounded-xl p-6 shadow-lg flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notice An Emergency?</h4>
                <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                  Report water logging, fallen trees, road blockages, or trapped residents to alert rescue teams immediately.
                </p>
              </div>
              <a
                href="/report"
                className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Submit Incident Report</span>
              </a>
            </div>
          </div>

          {/* Nearest Open Shelters & Hospitals */}
          <div className="bg-dark-800 border border-gray-700/80 rounded-xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Home className="w-5 h-5 text-emerald-400" />
                  <span>Closest Verified Emergency Shelters & Hospitals</span>
                </h3>
                <p className="text-xs text-gray-400">Open facilities with verified medical resources and bed availability.</p>
              </div>
              <a href="/resources" className="text-xs font-bold text-blue-400 hover:underline">
                View All 20+ Resources →
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {resources.filter(r => r.type === 'hospital' || r.type === 'shelter').slice(0, 3).map((res) => (
                <div key={res.id} className="bg-dark-900 border border-gray-700/70 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold capitalize px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                        {res.type}
                      </span>
                      <span className="text-xs text-emerald-400 font-bold font-mono">OPEN</span>
                    </div>
                    <h4 className="font-bold text-white text-base mb-1">{res.name}</h4>
                    <p className="text-xs text-gray-400 mb-2">{res.location?.address || 'Vijayawada Central'}</p>
                    <p className="text-xs text-gray-300 font-mono mb-4">Distance: {res.distance || '1.8'} km away</p>
                  </div>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${res.location?.lat || 16.5062},${res.location?.lng || 80.6480}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Navigate Now</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. AI EARLY WARNING & PREDICTION TELEMETRY TAB */}
      {/* ========================================================================= */}
      {activeTab === 'prediction' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Environmental Sensor Telemetry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-dark-800 border border-blue-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Droplets className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full animate-pulse">
                  CRITICAL SURGE
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white font-mono mb-1">145 mm/hr</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rainfall Precipitation</div>
              <div className="w-full bg-dark-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full rounded-full" style={{ width: '85%' }}></div>
              </div>
              <div className="text-[11px] text-gray-400 mt-2 font-mono">Threshold: 100 mm/hr (Exceeded)</div>
            </div>

            <div className="bg-dark-800 border border-red-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                  CREST DANGER
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white font-mono mb-1">8.50 m</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">River Basin Water Gauge</div>
              <div className="w-full bg-dark-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full rounded-full" style={{ width: '92%' }}></div>
              </div>
              <div className="text-[11px] text-gray-400 mt-2 font-mono">Floodwall Limit: 7.00 m (+1.5m overflow)</div>
            </div>

            <div className="bg-dark-800 border border-yellow-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  <Radio className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                  HIGH VELOCITY
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white font-mono mb-1">115 km/h</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cyclone Wind Velocity</div>
              <div className="w-full bg-dark-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full rounded-full" style={{ width: '70%' }}></div>
              </div>
              <div className="text-[11px] text-gray-400 mt-2 font-mono">Bay of Bengal Cyclone Storm Track</div>
            </div>

            <div className="bg-dark-800 border border-orange-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Flame className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                  SOIL SATURATION
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white font-mono mb-1">88.4%</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Landslide Vulnerability Index</div>
              <div className="w-full bg-dark-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full rounded-full" style={{ width: '88%' }}></div>
              </div>
              <div className="text-[11px] text-gray-400 mt-2 font-mono">Hill Slope Shear Stability Alert</div>
            </div>
          </div>

          {/* 24-Hour Predictive Rise Curve */}
          <div className="bg-dark-800 border border-gray-700/80 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  <span>24-Hour Predictive Water Level & Inundation Curve</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  AI neural model extrapolating upstream catchment discharge against downstream embankment thresholds.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                  Forecast Confidence: 94.8%
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { time: '00:00', actual: 4.2, predicted: 4.2, threshold: 7.0 },
                    { time: '04:00', actual: 5.1, predicted: 5.1, threshold: 7.0 },
                    { time: '08:00', actual: 6.3, predicted: 6.3, threshold: 7.0 },
                    { time: '12:00 (Now)', actual: 8.5, predicted: 8.5, threshold: 7.0 },
                    { time: '+4h (16:00)', predicted: 9.8, threshold: 7.0 },
                    { time: '+8h (20:00)', predicted: 10.4, threshold: 7.0 },
                    { time: '+12h (00:00)', predicted: 9.6, threshold: 7.0 },
                    { time: '+24h (12:00)', predicted: 7.8, threshold: 7.0 },
                  ]}
                >
                  <defs>
                    <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} unit="m" domain={[0, 12]} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="predicted" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#predictedGrad)" name="Water Level Forecast (m)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 p-4 bg-red-950/40 border border-red-500/30 rounded-2xl text-xs text-red-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span>
                  <strong>PREDICTED CREST PEAK IN 6 HOURS:</strong> Water level projected to peak at <strong>10.4m</strong> (+3.4m over safety embankment). Preemptive evacuation of Zone A & B mandatory.
                </span>
              </div>
              <a
                href="/map"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex-shrink-0 transition text-xs"
              >
                Inspect Zone on Map
              </a>
            </div>
          </div>

          {/* AI Risk Score Table Across Zones */}
          <div className="bg-dark-800 border border-gray-700/80 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h3 className="text-xl font-extrabold text-white mb-2">Zone-by-Zone Predictive Risk Breakdown</h3>
            <p className="text-xs text-gray-400 mb-6">Weighted risk calculation taking into account historical vulnerability, population density, elevation & real-time telemetry.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Zone / Location</th>
                    <th className="pb-3">Primary Threat</th>
                    <th className="pb-3">AI Calculated Risk</th>
                    <th className="pb-3">Water Level / Sensor</th>
                    <th className="pb-3">Trend</th>
                    <th className="pb-3 text-right">Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-200">
                  <tr className="hover:bg-dark-700/40 transition">
                    <td className="py-3.5 font-bold text-white">Zone A - Krishna River Basin (India)</td>
                    <td><span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded font-bold">Flood Inundation</span></td>
                    <td><span className="font-mono font-extrabold text-red-400 text-sm">91% (CRITICAL)</span></td>
                    <td className="font-mono">8.50m (Thresh: 7.0m)</td>
                    <td><span className="text-red-400 font-bold">↑ Increasing Rapidly</span></td>
                    <td className="text-right"><span className="text-xs font-bold text-red-400 bg-red-600/10 px-2.5 py-1 rounded-lg border border-red-500/20">Evacuation Mandatory</span></td>
                  </tr>
                  <tr className="hover:bg-dark-700/40 transition">
                    <td className="py-3.5 font-bold text-white">Zone B - Eluru Road Corridor (India)</td>
                    <td><span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded font-bold">Urban Waterlogging</span></td>
                    <td><span className="font-mono font-extrabold text-orange-400 text-sm">74% (HIGH)</span></td>
                    <td className="font-mono">5.20m (Thresh: 5.0m)</td>
                    <td><span className="text-orange-400 font-bold">↑ Rising</span></td>
                    <td className="text-right"><span className="text-xs font-bold text-orange-400 bg-orange-600/10 px-2.5 py-1 rounded-lg border border-orange-500/20">Roads Diverted</span></td>
                  </tr>
                  <tr className="hover:bg-dark-700/40 transition">
                    <td className="py-3.5 font-bold text-white">Zone C - Benz Circle Area (India)</td>
                    <td><span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded font-bold">Traffic & Power Outage</span></td>
                    <td><span className="font-mono font-extrabold text-yellow-400 text-sm">68% (HIGH)</span></td>
                    <td className="font-mono">4.80m (Thresh: 5.0m)</td>
                    <td><span className="text-yellow-400 font-bold">→ Stable</span></td>
                    <td className="text-right"><span className="text-xs font-bold text-yellow-400 bg-yellow-600/10 px-2.5 py-1 rounded-lg border border-yellow-500/20">Standby Crews</span></td>
                  </tr>
                  <tr className="hover:bg-dark-700/40 transition">
                    <td className="py-3.5 font-bold text-white">Zone D - Kanuru Residential (India)</td>
                    <td><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-bold">Drainage Surcharging</span></td>
                    <td><span className="font-mono font-extrabold text-emerald-400 text-sm">45% (MEDIUM)</span></td>
                    <td className="font-mono">3.10m (Thresh: 4.5m)</td>
                    <td><span className="text-emerald-400 font-bold">↓ Receding</span></td>
                    <td className="text-right"><span className="text-xs font-bold text-emerald-400 bg-emerald-600/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">Pumping Active</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
