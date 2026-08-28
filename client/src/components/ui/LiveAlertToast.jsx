import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ArrowRight, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';

export default function LiveAlertToast() {
  const { socket, lastAlert, lastReport } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const addNotification = (notif) => {
    const id = Date.now() + Math.random();
    const newNotif = { ...notif, id, timestamp: Date.now() };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 2)]);
  };

  useEffect(() => {
    if (isHovered || notifications.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setNotifications((prev) => prev.filter((n) => now - n.timestamp < 9000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isHovered, notifications]);

  useEffect(() => {
    if (!socket) return;

    const handleNewAlert = (alert) => {
      addNotification({
        type: 'alert',
        title: alert.title || 'CRITICAL DISASTER ALERT',
        message: alert.message || 'Immediate action required for your zone.',
        severity: alert.type || 'critical',
        zone: alert.area || 'Monitored Disaster Area',
        link: '/alerts'
      });
    };

    const handleNewReport = (report) => {
      addNotification({
        type: 'report',
        title: `Citizen Report: ${report.title || report.category}`,
        message: report.description || 'New ground observation submitted.',
        severity: report.severity >= 4 ? 'critical' : 'warning',
        zone: report.location?.address || 'Incident Location',
        link: '/map'
      });
    };

    const handleReportUpdated = (report) => {
      if (report.status === 'verified' || report.status === 'resolved') {
        addNotification({
          type: 'update',
          title: `Status: ${report.title || 'Incident'} marked ${report.status.toUpperCase()}`,
          message: report.adminNotes || 'Response crew assigned to location.',
          severity: report.status === 'resolved' ? 'success' : 'info',
          zone: report.location?.address,
          link: '/map'
        });
      }
    };

    socket.on('new_alert', handleNewAlert);
    socket.on('new_report', handleNewReport);
    socket.on('report_updated', handleReportUpdated);

    return () => {
      socket.off('new_alert', handleNewAlert);
      socket.off('new_report', handleNewReport);
      socket.off('report_updated', handleReportUpdated);
    };
  }, [socket]);

  useEffect(() => {
    if (lastAlert) {
      addNotification({
        type: 'alert',
        title: lastAlert.title || 'EMERGENCY BROADCAST',
        message: lastAlert.message,
        severity: lastAlert.type || 'critical',
        zone: lastAlert.area,
        link: '/alerts'
      });
    }
  }, [lastAlert]);

  const dismiss = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed top-20 right-4 z-[999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4"
    >
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            className={`pointer-events-auto rounded-2xl p-4 shadow-2xl border backdrop-blur-xl transition-all ${
              notif.severity === 'critical'
                ? 'bg-red-950/95 border-red-500/60 text-white shadow-red-950/60'
                : notif.severity === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/60 text-white shadow-emerald-950/60'
                : 'bg-orange-950/95 border-orange-500/60 text-white shadow-orange-950/60'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl flex-shrink-0 ${
                  notif.severity === 'critical'
                    ? 'bg-red-600/30 text-red-400 animate-pulse'
                    : notif.severity === 'success'
                    ? 'bg-emerald-600/30 text-emerald-400'
                    : 'bg-orange-600/30 text-orange-400'
                }`}
              >
                {notif.type === 'alert' ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : notif.severity === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white">
                    {notif.type === 'alert' ? '🔴 Live Alert' : notif.type === 'update' ? '✨ Update' : '⚠️ Incident'}
                  </span>
                  <button
                    onClick={() => dismiss(notif.id)}
                    className="text-gray-400 hover:text-white transition p-1"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="font-bold text-sm text-white leading-snug">{notif.title}</h4>
                <p className="text-xs text-gray-200 line-clamp-2 mt-1">{notif.message}</p>

                {notif.zone && (
                  <div className="text-[11px] text-gray-300 mt-2 flex items-center gap-1 font-mono">
                    <span>📍</span> {notif.zone}
                  </div>
                )}

                <button
                  onClick={() => {
                    navigate(notif.link);
                    dismiss(notif.id);
                  }}
                  className="mt-3 flex items-center gap-1.5 text-xs font-extrabold text-blue-300 hover:text-white transition"
                >
                  <span>Open Operations Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
