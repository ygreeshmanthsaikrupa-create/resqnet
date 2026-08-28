import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Phone, Users, Cross, Home, Shield, Flame, Package, Coffee, 
  RefreshCw, Navigation, AlertCircle, Plus, Minus, CheckCircle, Search
} from 'lucide-react';
import { api, updateResource } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const ICONS = {
  hospital: Cross,
  shelter: Home,
  police: Shield,
  fire: Flame,
  relief: Package,
  relief_center: Package,
  food_water: Coffee
};

export default function Resources() {
  const { user, isVolunteer, isAdmin } = useAuth();
  const { socket } = useSocket();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchResources = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getResources();
      setResources(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError(err.message || 'Failed to retrieve emergency resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();

    if (socket) {
      const handleResourceUpdated = (updated) => {
        setResources((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      };
      socket.on('resource_updated', handleResourceUpdated);
      return () => socket.off('resource_updated', handleResourceUpdated);
    }
  }, [socket]);

  const handleOccupancyChange = async (resItem, delta) => {
    if (!isVolunteer && !isAdmin) return;
    const current = resItem.currentOccupancy || 0;
    const cap = resItem.capacity || 100;
    const newOccupancy = Math.max(0, Math.min(cap, current + delta));
    const newStatus = newOccupancy >= cap ? 'full' : newOccupancy > 0 ? 'open' : 'open';

    setUpdatingId(resItem.id);
    try {
      const updated = await updateResource(resItem.id, {
        currentOccupancy: newOccupancy,
        status: newStatus
      });
      setResources((prev) => prev.map((r) => (r.id === resItem.id ? updated : r)));
    } catch (err) {
      alert(`Failed to update occupancy: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = resources.filter((r) => {
    if (filter !== 'all' && r.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = r.name?.toLowerCase().includes(q);
      const matchAddress = r.location?.address?.toLowerCase().includes(q);
      if (!matchName && !matchAddress) return false;
    }
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'full': return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'closed': return 'bg-red-500/15 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/15 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Emergency Resources & Shelters</h1>
          <p className="text-gray-400 text-sm mt-1">Live capacity tracking for hospitals, evacuation camps, and relief depots.</p>
        </div>

        <button
          onClick={fetchResources}
          className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-xl border border-gray-700 text-xs font-bold text-gray-300 transition shadow"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
          <span>Refresh Availability</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search facility name, address or landmark..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap gap-1.5 bg-dark-800 p-1 rounded-xl border border-gray-700">
          {['all', 'shelter', 'hospital', 'police', 'fire', 'food_water'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                filter === f ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/15 border border-red-500/40 rounded-2xl text-red-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchResources}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-dark-800 border border-gray-800 rounded-2xl p-6 animate-pulse">
              <div className="flex justify-between items-center mb-4">
                <div className="w-10 h-10 bg-gray-700 rounded-xl"></div>
                <div className="w-16 h-5 bg-gray-700 rounded-full"></div>
              </div>
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="bg-dark-800/60 border border-gray-800 rounded-3xl p-12 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Matching Resources</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-6">
            No emergency facilities match the selected type or search query.
          </p>
          <button
            onClick={() => { setFilter('all'); setSearch(''); }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
          >
            Show All Resources
          </button>
        </div>
      ) : (
        /* Resource Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((res) => {
              const Icon = ICONS[res.type] || Home;
              const cap = res.capacity || 100;
              const occ = res.currentOccupancy || 0;
              const percent = Math.round((occ / cap) * 100);

              const lat = res.location?.lat || 16.5062;
              const lng = res.location?.lng || 80.6480;

              return (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-dark-800 border border-gray-700/80 rounded-3xl p-6 hover:border-gray-600 transition-all flex flex-col justify-between shadow-xl"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getStatusColor(res.status)}`}>
                        {res.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-white mb-2 leading-snug">{res.name}</h3>

                    {res.location?.address && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                        <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        <span className="truncate">{res.location.address}</span>
                      </div>
                    )}

                    {/* Capacity Meter (for Shelters & Hospitals) */}
                    {(res.type === 'shelter' || res.type === 'hospital' || res.type === 'relief_center') && (
                      <div className="bg-dark-900/80 border border-gray-700/60 rounded-2xl p-3.5 mb-4">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> Occupancy:
                          </span>
                          <span className="font-mono font-bold text-white">
                            {occ} / {cap} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-dark-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-orange-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          ></div>
                        </div>

                        {/* Live Shelter Capacity Adjustment (Volunteer/Admin) */}
                        {(isVolunteer || isAdmin) && (
                          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-800">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Field Adjust:</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                disabled={updatingId === res.id || occ <= 0}
                                onClick={() => handleOccupancyChange(res, -5)}
                                className="px-2 py-1 bg-dark-800 hover:bg-dark-700 border border-gray-700 rounded-lg text-xs font-bold text-gray-300 hover:text-white transition disabled:opacity-40"
                                title="Subtract 5 occupants"
                              >
                                -5
                              </button>
                              <button
                                disabled={updatingId === res.id || occ >= cap}
                                onClick={() => handleOccupancyChange(res, 5)}
                                className="px-2 py-1 bg-blue-600/30 hover:bg-blue-600 border border-blue-500/40 rounded-lg text-xs font-bold text-blue-300 hover:text-white transition disabled:opacity-40"
                                title="Add 5 occupants"
                              >
                                +5
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {res.contact && (
                      <div className="flex items-center gap-2 text-xs text-gray-300 mb-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-mono">{res.contact}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-800 mt-2 flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400 font-mono">
                      📍 {res.distance || '1.5'} km away
                    </span>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Directions</span>
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
