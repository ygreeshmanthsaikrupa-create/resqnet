import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Clock, MapPin, Search, AlertTriangle, Shield, RefreshCw, Radio, CheckCircle } from 'lucide-react';
import { api } from '../utils/api';
import AlertBadge from '../components/ui/AlertBadge';
import { useSocket } from '../context/SocketContext';

export default function AlertCenter() {
  const { socket } = useSocket();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAlerts();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message || 'Failed to load live alerts from disaster feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    if (socket) {
      const handleNewAlert = (newAlert) => {
        setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);
      };
      socket.on('new_alert', handleNewAlert);
      return () => socket.off('new_alert', handleNewAlert);
    }
  }, [socket]);

  const filteredAlerts = alerts.filter((a) => {
    const alertSeverity = a.type || 'warning';
    if (filter !== 'all' && alertSeverity !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = a.title?.toLowerCase().includes(q);
      const matchArea = a.area?.toLowerCase().includes(q);
      const matchMsg = a.message?.toLowerCase().includes(q);
      if (!matchTitle && !matchArea && !matchMsg) return false;
    }
    return true;
  });

  const getBorderColor = (severity) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500';
      case 'warning': return 'border-l-orange-500';
      case 'advisory': return 'border-l-yellow-500';
      case 'all_clear': return 'border-l-green-500';
      default: return 'border-l-red-500';
    }
  };

  const getBgColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 border-red-500/30';
      case 'warning': return 'bg-orange-500/10 border-orange-500/30';
      case 'advisory': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'all_clear': return 'bg-green-500/10 border-green-500/30';
      default: return 'bg-dark-800 border-gray-700/80';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Disaster Alert Center</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-600/20 text-red-400 border border-red-500/30 flex items-center gap-1.5 animate-pulse">
              <Radio className="w-3.5 h-3.5" /> LIVE BROADCAST
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">Official directives, AI risk projections and verified citizen advisories.</p>
        </div>

        <button
          onClick={fetchAlerts}
          className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-xl border border-gray-700 text-xs font-bold text-gray-300 transition shadow"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search alerts by area, hazard or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap gap-1.5 bg-dark-800 p-1 rounded-xl border border-gray-700">
          {['all', 'critical', 'warning', 'advisory', 'all_clear'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                filter === tab
                  ? tab === 'critical' ? 'bg-red-600 text-white' : tab === 'warning' ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'all_clear' ? 'All Clear' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/15 border border-red-500/40 rounded-2xl text-red-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAlerts}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-dark-800 border border-gray-800 rounded-2xl p-6 animate-pulse">
              <div className="flex justify-between items-center mb-3">
                <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                <div className="h-4 bg-gray-700 rounded w-16"></div>
              </div>
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        /* Empty State */
        <div className="bg-dark-800/60 border border-gray-800 rounded-3xl p-12 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Active Alerts Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-6">
            {filter !== 'all' || search
              ? 'No alerts match your current filter parameters. Try clearing the filter or search query.'
              : 'There are no active emergency alerts in this sector at this time.'}
          </p>
          <a
            href="/map"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
          >
            <MapPin className="w-4 h-4" />
            <span>Inspect Live Operations Map</span>
          </a>
        </div>
      ) : (
        /* Alerts List */
        <div className="space-y-4">
          <AnimatePresence>
            {filteredAlerts.map((alert) => {
              const severityType = alert.type || 'warning';
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className={`bg-dark-800 border ${getBgColor(severityType)} border-l-4 ${getBorderColor(severityType)} rounded-2xl p-6 shadow-xl transition-all hover:border-gray-600`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        severityType === 'critical' ? 'bg-red-600 text-white animate-pulse' :
                        severityType === 'warning' ? 'bg-orange-600 text-white' :
                        'bg-blue-600 text-white'
                      }`}>
                        {severityType}
                      </span>
                      <AlertBadge type={alert.verificationStatus || 'official'} />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(alert.issuedAt || Date.now()).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-extrabold text-white mb-2 leading-snug">{alert.title}</h3>
                  <p className="text-xs text-gray-300 mb-4 leading-relaxed">{alert.message}</p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-700/60 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span className="font-semibold text-gray-300">{alert.area || 'All Sectors'}</span>
                    </div>

                    <a
                      href="/map"
                      className="text-xs font-bold text-red-400 hover:text-red-300 transition flex items-center gap-1"
                    >
                      <span>Locate on Map &rarr;</span>
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
