import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for offline detection and sync status
 */
export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Monitor online/offline status
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

  // Load pending sync items from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('pendingSync');
    if (stored) {
      try {
        setPendingSync(JSON.parse(stored));
      } catch (err) {
        console.error('Error loading pending sync:', err);
      }
    }

    const lastSync = localStorage.getItem('lastSyncTime');
    if (lastSync) {
      setLastSyncTime(new Date(lastSync));
    }
  }, []);

  /**
   * Queue an action for later sync
   */
  const queueForSync = useCallback((action) => {
    const newItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...action,
    };

    setPendingSync(prev => {
      const updated = [...prev, newItem];
      localStorage.setItem('pendingSync', JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Remove an item from the sync queue
   */
  const removeFromQueue = useCallback((itemId) => {
    setPendingSync(prev => {
      const updated = prev.filter(item => item.id !== itemId);
      localStorage.setItem('pendingSync', JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Clear all pending sync items
   */
  const clearQueue = useCallback(() => {
    setPendingSync([]);
    localStorage.removeItem('pendingSync');
  }, []);

  /**
   * Mark sync as completed
   */
  const markSynced = useCallback(() => {
    const now = new Date();
    setLastSyncTime(now);
    localStorage.setItem('lastSyncTime', now.toISOString());
  }, []);

  /**
   * Process pending sync queue
   * This should be called when coming back online
   */
  const processSyncQueue = useCallback(async (syncHandler) => {
    if (!isOnline || pendingSync.length === 0) return;

    const results = [];

    for (const item of pendingSync) {
      try {
        await syncHandler(item);
        removeFromQueue(item.id);
        results.push({ id: item.id, success: true });
      } catch (err) {
        console.error('Sync error for item:', item.id, err);
        results.push({ id: item.id, success: false, error: err.message });
      }
    }

    if (results.every(r => r.success)) {
      markSynced();
    }

    return results;
  }, [isOnline, pendingSync, removeFromQueue, markSynced]);

  return {
    isOnline,
    isOffline: !isOnline,
    pendingSync,
    hasPendingSync: pendingSync.length > 0,
    pendingSyncCount: pendingSync.length,
    lastSyncTime,
    queueForSync,
    removeFromQueue,
    clearQueue,
    processSyncQueue,
    markSynced,
  };
}
