/**
 * Sync Status Indicator Component
 * 
 * Displays the current sync status of the hybrid storage system.
 * Shows: Online/Offline status and pending sync count.
 * 
 * Usage: Add to any page where you want to show sync status
 * <SyncStatusIndicator />
 */

import { useState, useEffect } from "react";
import { getSyncStatus, syncToFirestore, CLOUD_SYNC_DISABLED } from "@/lib/hybridStorage";
import { Button } from "@/components/ui/button";

export default function SyncStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({ total: 0, synced: 0, pending: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Hide indicator if cloud sync is disabled
  if (CLOUD_SYNC_DISABLED) {
    return null;
  }

  useEffect(() => {
    // Update sync status
    const updateStatus = () => {
      const status = getSyncStatus();
      setSyncStatus(status);
    };

    updateStatus();

    // Update every 2 seconds
    const interval = setInterval(updateStatus, 2000);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      updateStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateStatus();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || syncStatus.pending === 0) return;
    
    setIsSyncing(true);
    try {
      await syncToFirestore();
      // Update status after sync
      const newStatus = getSyncStatus();
      setSyncStatus(newStatus);
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't show if no data
  if (syncStatus.total === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-4 right-4 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-2 border-emerald-200/50 dark:border-emerald-800/50 rounded-2xl shadow-xl px-4 py-3 max-w-xs">
      <div className="flex items-center gap-3">
        {/* Online/Offline Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isOnline
                ? "bg-green-500 animate-pulse"
                : "bg-red-500"
            }`}
          ></div>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>

        {/* Sync Status */}
        <div className="flex-1 text-right">
          {syncStatus.pending > 0 ? (
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                {syncStatus.pending} pending
              </span>
              {isOnline && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="h-6 px-2 text-xs mt-1"
                >
                  {isSyncing ? (
                    <>
                      <span className="material-icons text-xs animate-spin mr-1">sync</span>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <span className="material-icons text-xs mr-1">cloud_upload</span>
                      Sync Now
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <span className="material-icons text-sm">check_circle</span>
              <span className="text-xs font-semibold">All synced</span>
            </div>
          )}
        </div>
      </div>

      {/* Total Records Info */}
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between">
          <span>Total records:</span>
          <span className="font-bold">{syncStatus.total}</span>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between mt-1">
          <span>Synced to cloud:</span>
          <span className="font-bold text-green-600">{syncStatus.synced}</span>
        </div>
      </div>
    </div>
  );
}

