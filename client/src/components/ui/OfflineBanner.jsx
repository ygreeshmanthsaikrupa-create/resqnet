import React from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle, AlertTriangle, CloudOff } from 'lucide-react';
import { useOffline } from '../../context/OfflineContext';

export default function OfflineBanner() {
  const { 
    isOnline, 
    simulatedOffline, 
    toggleSimulateOffline, 
    offlineQueue, 
    syncReports, 
    isSyncing, 
    lastSyncResult, 
    clearSyncResult 
  } = useOffline();

  return (
    <>
      {/* Top Offline Mode Bar */}
      {!isOnline && (
        <div className="bg-amber-600 text-amber-950 px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-3 shadow-lg z-[70] relative border-b border-amber-700">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 flex-shrink-0 animate-bounce text-amber-950" />
            <span>
              ⚡ <strong>Low Connectivity / Offline Mode:</strong> Emergency shelters cached. Reports queued locally ({offlineQueue.length} pending).
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSimulateOffline}
              className="px-2.5 py-1 bg-amber-900/30 hover:bg-amber-900/50 text-amber-950 rounded-lg text-[11px] font-black uppercase transition border border-amber-800/40"
            >
              {simulatedOffline ? 'Restore Network' : 'Simulate Offline'}
            </button>
          </div>
        </div>
      )}

      {/* Reconnection Sync Toast */}
      {lastSyncResult && (
        <div className="fixed bottom-20 right-4 z-[999] bg-emerald-950/95 border border-emerald-500/60 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-xl max-w-sm flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600/30 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/40">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-white">Auto-Sync Complete</h4>
              <p className="text-[11px] text-emerald-300">
                {lastSyncResult.count} offline report{lastSyncResult.count > 1 ? 's' : ''} uploaded to live operations.
              </p>
            </div>
          </div>
          <button
            onClick={clearSyncResult}
            className="text-xs text-emerald-400 hover:text-white font-bold"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}
