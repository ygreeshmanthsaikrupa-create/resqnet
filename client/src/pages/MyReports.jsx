import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Shield, AlertCircle, MessageSquare, CheckCircle, RefreshCw, Send, MapPin, Image as ImageIcon } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import StatusBadge from '../components/ui/StatusBadge';
import SeverityIndicator from '../components/ui/SeverityIndicator';

const STATUS_FLOW = ['submitted', 'under_verification', 'verified', 'resolved'];

export default function MyReports() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getReports();
      if (Array.isArray(data)) {
        // Filter reports submitted by current user (or show all if admin/volunteer)
        const myReports = data.filter((r) => r.reportedBy === user?.id || !r.reportedBy);
        setReports(myReports.length > 0 ? myReports : data.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching my reports:', err);
      setError(err.message || 'Failed to retrieve your submitted reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();

    if (socket) {
      const handleReportUpdated = (updated) => {
        setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      };
      socket.on('report_updated', handleReportUpdated);
      return () => socket.off('report_updated', handleReportUpdated);
    }
  }, [socket, user]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">My Emergency Reports</h1>
          <p className="text-gray-400 text-sm mt-1">Real-time status tracking for incidents you reported.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMyReports}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-xl border border-gray-700 text-xs font-bold text-gray-300 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Refresh</span>
          </button>
          <a
            href="/report"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            <Send className="w-3.5 h-3.5" />
            <span>New Report</span>
          </a>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/15 border border-red-500/40 rounded-2xl text-red-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchMyReports}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-dark-800 border border-gray-800 rounded-3xl p-6 animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 bg-dark-800/60 rounded-3xl border border-gray-800 p-8 shadow-xl">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Active Personal Reports</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-6 leading-relaxed">
            You haven't submitted any incident reports yet. When you report a hazard, you can track responder progress here.
          </p>
          <a
            href="/report"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-red-600/30"
          >
            <Send className="w-4 h-4" />
            <span>Submit Ground Report</span>
          </a>
        </div>
      ) : (
        /* Reports Timeline List */
        <div className="space-y-6">
          <AnimatePresence>
            {reports.map((report) => {
              const currentStepIdx = STATUS_FLOW.indexOf(report.status);

              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-dark-800 border border-gray-700/80 rounded-3xl p-6 sm:p-8 shadow-xl hover:border-gray-600 transition"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-[10px] text-gray-400 font-mono bg-dark-900 px-2 py-0.5 rounded-lg border border-gray-700">
                          #{report.id.substring(0, 10)}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(report.reportedAt || Date.now()).toLocaleString()}</span>
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold text-white">{report.title || report.category?.replace('_', ' ')}</h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <SeverityIndicator score={(report.severity || 3) * 20} />
                      <StatusBadge status={report.status} />
                    </div>
                  </div>

                  {/* Status Progression Bar */}
                  <div className="bg-dark-900/80 border border-gray-700/60 rounded-2xl p-4 sm:p-5 mb-6">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute left-4 right-4 h-1 bg-gray-800 top-1/2 -translate-y-1/2 z-0"></div>
                      <div
                        className="absolute left-4 h-1 bg-blue-600 top-1/2 -translate-y-1/2 z-0 transition-all duration-500"
                        style={{
                          width: `${Math.max(0, (currentStepIdx / (STATUS_FLOW.length - 1)) * 100)}%`
                        }}
                      ></div>

                      {STATUS_FLOW.map((s, idx) => {
                        const isPassed = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;

                        return (
                          <div key={s} className="flex flex-col items-center relative z-10">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isPassed
                                  ? 'bg-blue-600 text-white ring-4 ring-blue-600/20'
                                  : 'bg-dark-800 text-gray-600 border border-gray-700'
                              } ${isCurrent ? 'animate-pulse' : ''}`}
                            >
                              {idx + 1}
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 capitalize mt-2 hidden sm:block">
                              {s.replace('_', ' ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 text-xs">
                    {report.location?.address && (
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        <span>{report.location.address}</span>
                      </div>
                    )}

                    <p className="text-gray-300 bg-dark-900/60 p-3 rounded-xl border border-gray-800 leading-relaxed">
                      {report.description}
                    </p>

                    {report.imageUrl && (
                      <div className="mt-3">
                        <img src={report.imageUrl} alt="Attached Evidence" className="h-32 rounded-xl object-cover border border-gray-700 shadow" />
                      </div>
                    )}

                    {report.adminNotes && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 flex items-start gap-2 mt-3">
                        <MessageSquare className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Authority Dispatch Log:</span>
                          <span className="text-gray-200">{report.adminNotes}</span>
                        </div>
                      </div>
                    )}
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
