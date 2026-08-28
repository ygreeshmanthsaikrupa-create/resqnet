import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const OfflineContext = createContext();

const OFFLINE_QUEUE_KEY = 'resqnet_offline_reports';
const CACHED_RESOURCES_KEY = 'resqnet_cached_resources';
const CACHED_ZONES_KEY = 'resqnet_cached_zones';

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  // Load offline queue on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (saved) {
        setOfflineQueue(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load offline queue:', e);
    }
  }, []);

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cache resources and zones for offline availability
  const cacheEssentialData = useCallback(async () => {
    if (!navigator.onLine || simulatedOffline) return;
    try {
      const [res, zones] = await Promise.all([
        api.getResources().catch(() => null),
        api.getMapZones().catch(() => null)
      ]);
      if (res) localStorage.setItem(CACHED_RESOURCES_KEY, JSON.stringify(res));
      if (zones) localStorage.setItem(CACHED_ZONES_KEY, JSON.stringify(zones));
    } catch (e) {
      // ignore
    }
  }, [simulatedOffline]);

  useEffect(() => {
    cacheEssentialData();
  }, [cacheEssentialData]);

  // Queue report locally
  const queueReport = (reportData) => {
    const newReport = {
      ...reportData,
      id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      queuedAt: new Date().toISOString(),
      status: 'queued_offline'
    };

    const updated = [...offlineQueue, newReport];
    setOfflineQueue(updated);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    return newReport;
  };

  // Sync queued reports when internet returns
  const syncReports = useCallback(async () => {
    if (!isOnline || simulatedOffline || offlineQueue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    let synced = 0;
    const remaining = [];

    for (const report of offlineQueue) {
      try {
        const { id, queuedAt, status, ...payload } = report;
        await api.createReport(payload);
        synced++;
      } catch (err) {
        console.error('Failed to sync offline report:', err);
        remaining.push(report);
      }
    }

    setOfflineQueue(remaining);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    setIsSyncing(false);

    if (synced > 0) {
      setLastSyncResult({
        count: synced,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  }, [isOnline, simulatedOffline, offlineQueue, isSyncing]);

  // Auto-trigger sync when connectivity is restored
  useEffect(() => {
    if (isOnline && !simulatedOffline && offlineQueue.length > 0) {
      syncReports();
    }
  }, [isOnline, simulatedOffline, offlineQueue.length, syncReports]);

  const toggleSimulateOffline = () => {
    setSimulatedOffline((prev) => !prev);
  };

  // Effective status
  const effectiveOnline = isOnline && !simulatedOffline;

  return (
    <OfflineContext.Provider value={{
      isOnline: effectiveOnline,
      simulatedOffline,
      toggleSimulateOffline,
      offlineQueue,
      queueReport,
      syncReports,
      isSyncing,
      lastSyncResult,
      clearSyncResult: () => setLastSyncResult(null)
    }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => useContext(OfflineContext);
