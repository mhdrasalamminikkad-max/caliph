/**
 * Attendance Storage System with Backend API
 * 
 * This module provides attendance storage using:
 * 1. Backend API for data persistence (JSON file)
 * 2. LocalStorage as fallback if backend unavailable
 * 
 * Features:
 * - Saves to backend API immediately
 * - Falls back to LocalStorage if backend unavailable
 * - Works offline with LocalStorage
 */

import * as backendApi from './backendApi';

const STORAGE_KEY = "caliph_attendance_local";

// Types
export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  prayer: string;
  date: string;
  status: "present" | "absent";
  reason?: string | null;
  timestamp: string;
}

// Cache backend availability to reduce checks
let backendAvailableCache: boolean | null = null;
let lastBackendCheck = 0;
const BACKEND_CHECK_INTERVAL = 30000; // Check every 30 seconds

// Keys for persisting clear state (local fallback)
const CLEAR_TIMESTAMP_KEY = 'caliph_attendance_cleared_at';

// Cache for server's cleared timestamp
let serverClearedAtCache: number | null = null;
let lastServerClearedAtCheck = 0;
const SERVER_CLEARED_CHECK_INTERVAL = 10000; // Check every 10 seconds

// Fetch the server's cleared timestamp (source of truth for multi-client)
async function getServerClearedAt(): Promise<number> {
  const now = Date.now();
  if (serverClearedAtCache !== null && (now - lastServerClearedAtCheck) < SERVER_CLEARED_CHECK_INTERVAL) {
    return serverClearedAtCache;
  }
  
  try {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/attendance/cleared-at`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      credentials: 'include',
      signal: AbortSignal.timeout(2000),
    });
    
    if (response.ok) {
      const data = await response.json();
      serverClearedAtCache = data.clearedAt || 0;
      lastServerClearedAtCheck = now;
      return serverClearedAtCache ?? 0;
    }
  } catch (error) {
    console.warn('⚠️ Could not fetch server cleared timestamp:', error);
  }
  
  // Fall back to local timestamp
  return getLocalClearTimestamp();
}

// Get persisted clear timestamp from localStorage (local fallback)
function getLocalClearTimestamp(): number {
  const stored = localStorage.getItem(CLEAR_TIMESTAMP_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

// Set persisted clear timestamp locally
function setClearTimestamp(timestamp: number): void {
  if (timestamp > 0) {
    localStorage.setItem(CLEAR_TIMESTAMP_KEY, timestamp.toString());
  } else {
    localStorage.removeItem(CLEAR_TIMESTAMP_KEY);
  }
  // Also update the cache
  serverClearedAtCache = timestamp;
  lastServerClearedAtCheck = Date.now();
}

// Get effective clear timestamp (prefers server, falls back to local)
// This is the authoritative timestamp - records older than this should ALWAYS be filtered
async function getEffectiveClearTimestamp(): Promise<number> {
  const serverTime = await getServerClearedAt();
  const localTime = getLocalClearTimestamp();
  // Use the more recent of the two
  return Math.max(serverTime, localTime);
}

// Get API base URL (use window.location.origin for Replit compatibility)
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

// Check if backend is available
async function isBackendAvailable(): Promise<boolean> {
  const now = Date.now();
  if (backendAvailableCache !== null && (now - lastBackendCheck) < BACKEND_CHECK_INTERVAL) {
    return backendAvailableCache;
  }
  
  try {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/attendance`, {
      method: 'GET',
      signal: AbortSignal.timeout(1000), // Reduced to 1 second for faster response
    });
    backendAvailableCache = response.ok;
    lastBackendCheck = now;
    return backendAvailableCache;
  } catch (error) {
    backendAvailableCache = false;
    lastBackendCheck = now;
    return false;
  }
}

/**
 * Save attendance record - INSTANT LocalStorage, background backend sync
 */
export async function saveAttendanceLocal(record: AttendanceRecord): Promise<void> {
  try {
    // Ensure record has timestamp
    const recordWithTimestamp = {
      ...record,
      timestamp: record.timestamp || new Date().toISOString(),
    };
    
    // INSTANT save to LocalStorage FIRST for immediate UI update
    const storedData = localStorage.getItem(STORAGE_KEY);
    const existingRecords: AttendanceRecord[] = storedData ? JSON.parse(storedData) : [];
    const recordIndex = existingRecords.findIndex(
      r => r.id === record.id || 
      (r.studentId === record.studentId && r.date === record.date && r.prayer === record.prayer)
    );
    
    if (recordIndex >= 0) {
      existingRecords[recordIndex] = recordWithTimestamp;
    } else {
      existingRecords.push(recordWithTimestamp);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingRecords));
    
    // Sync to backend - await for data integrity (UI uses optimistic updates)
    try {
      await backendApi.saveAttendance(recordWithTimestamp);
    } catch (error) {
      console.warn('⚠️ Backend sync failed (data preserved in LocalStorage):', error);
      // Data is safe in LocalStorage, will retry on next online event
    }
  } catch (error) {
    console.error("❌ Error saving attendance:", error);
    throw error;
  }
}

/**
 * Batch save multiple attendance records - INSTANT LocalStorage, background backend sync
 */
export async function saveAttendanceBatch(records: AttendanceRecord[]): Promise<void> {
  if (records.length === 0) return;
  
  try {
    // INSTANT save to LocalStorage FIRST for immediate UI update
    const storedData = localStorage.getItem(STORAGE_KEY);
    const existingRecords: AttendanceRecord[] = storedData ? JSON.parse(storedData) : [];
    const existingMap = new Map(
      existingRecords.map(r => [`${r.studentId}-${r.date}-${r.prayer}`, r])
    );
    
    records.forEach(record => {
      const key = `${record.studentId}-${record.date}-${record.prayer}`;
      const newRecord = {
        ...record,
        timestamp: record.timestamp || new Date().toISOString(),
      };
      existingMap.set(key, newRecord);
    });
    
    const updatedRecords = Array.from(existingMap.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
    
    // ✅ RETURN IMMEDIATELY - LocalStorage write complete, UI can proceed
    
    // Background backend sync (fire and forget - doesn't block UI)
    (async () => {
      try {
        const batchSize = 10;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          await Promise.all(batch.map(record => {
            const recordWithTimestamp = {
              ...record,
              timestamp: record.timestamp || new Date().toISOString(),
            };
            return backendApi.saveAttendance(recordWithTimestamp);
          }));
        }
      } catch (error) {
        console.warn('⚠️ Backend batch sync failed (data preserved in LocalStorage):', error);
        // Data is safe in LocalStorage, will retry on next online event
      }
    })();
  } catch (error) {
    console.error("❌ Error batch saving attendance:", error);
    throw error;
  }
}

/**
 * Get all attendance records - merge local and backend when available
 * Respects the clear flag to prevent restoration of cleared data
 */
export async function getLocalAttendance(): Promise<AttendanceRecord[]> {
  try {
    // Get local data first (instant)
    const stored = localStorage.getItem(STORAGE_KEY);
    const localRecords: AttendanceRecord[] = stored ? JSON.parse(stored) : [];
    
    // ALWAYS filter records older than the clear timestamp (authoritative, no time limit)
    const clearTime = await getEffectiveClearTimestamp();
    if (clearTime > 0) {
      const filteredLocal = localRecords.filter(record => {
        const recordTime = new Date(record.timestamp || 0).getTime();
        return recordTime > clearTime;
      });
      
      // If backend is available, also filter backend records
      if (await isBackendAvailable()) {
        try {
          const backendRecords = await backendApi.getAttendance();
          if (backendRecords) {
            const filteredBackend = backendRecords.filter(record => {
              const recordTime = new Date(record.timestamp || 0).getTime();
              return recordTime > clearTime;
            });
            
            // Merge filtered records
            const mergeMap = new Map<string, AttendanceRecord>();
            filteredBackend.forEach(record => {
              const key = `${record.studentId}-${record.date}-${record.prayer}`;
              mergeMap.set(key, record);
            });
            filteredLocal.forEach(record => {
              const key = `${record.studentId}-${record.date}-${record.prayer}`;
              const existing = mergeMap.get(key);
              const localTime = new Date(record.timestamp || 0).getTime();
              const existingTime = existing ? new Date(existing.timestamp || 0).getTime() : 0;
              if (!existing || localTime > existingTime) {
                mergeMap.set(key, record);
              }
            });
            
            const mergedRecords = Array.from(mergeMap.values());
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedRecords));
            return mergedRecords;
          }
        } catch (error) {
          console.warn('⚠️ Backend fetch failed, using filtered LocalStorage:', error);
        }
      }
      
      return filteredLocal;
    }
    
    // Normal flow (no recent clear)
    // If backend is available, merge to get the most accurate data
    if (await isBackendAvailable()) {
      try {
        const backendRecords = await backendApi.getAttendance();
        if (backendRecords) {
          // Merge both sources, keeping the most recent version of each record
          const mergeMap = new Map<string, AttendanceRecord>();
          
          // Add backend records first
          backendRecords.forEach(record => {
            const key = `${record.studentId}-${record.date}-${record.prayer}`;
            mergeMap.set(key, record);
          });
          
          // Merge local records (keep local if newer - preserves offline edits)
          localRecords.forEach(record => {
            const key = `${record.studentId}-${record.date}-${record.prayer}`;
            const existing = mergeMap.get(key);
            const localTime = new Date(record.timestamp || 0).getTime();
            const existingTime = existing ? new Date(existing.timestamp || 0).getTime() : 0;
            
            if (!existing || localTime > existingTime) {
              mergeMap.set(key, record);
            }
          });
          
          const mergedRecords = Array.from(mergeMap.values());
          // Update LocalStorage with merged data
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedRecords));
          return mergedRecords;
        }
      } catch (error) {
        console.warn('⚠️ Backend fetch failed, using LocalStorage:', error);
      }
    }
    
    // Deduplicate local records
    const recordMap = new Map<string, AttendanceRecord>();
    localRecords.forEach(record => {
      const key = `${record.studentId}-${record.date}-${record.prayer}`;
      const existing = recordMap.get(key);
      
      if (!existing || new Date(record.timestamp) > new Date(existing.timestamp)) {
        recordMap.set(key, record);
      }
    });
    
    return Array.from(recordMap.values());
  } catch (error) {
    console.error("❌ Error reading attendance:", error);
    return [];
  }
}

/**
 * Get attendance by date range - INSTANT from LocalStorage
 */
export async function getLocalAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceRecord[]> {
  const allRecords = await getLocalAttendance();
  return allRecords.filter(record => {
    return record.date >= startDate && record.date <= endDate;
  });
}

/**
 * Get attendance for a specific student - INSTANT from LocalStorage
 */
export async function getLocalStudentAttendance(studentId: string): Promise<AttendanceRecord[]> {
  const allRecords = await getLocalAttendance();
  return allRecords.filter(record => record.studentId === studentId);
}

/**
 * Get attendance by filters (date, className, prayer) - INSTANT from LocalStorage
 */
export async function getLocalAttendanceByFilters(filters: {
  date?: string;
  className?: string;
  prayer?: string;
}): Promise<AttendanceRecord[]> {
  const allRecords = await getLocalAttendance();
  return allRecords.filter(record => {
    if (filters.date && record.date !== filters.date) return false;
    if (filters.className && record.className !== filters.className) return false;
    if (filters.prayer && record.prayer !== filters.prayer) return false;
    return true;
  });
}

/**
 * Get sync status (for compatibility - always returns synced if backend available)
 */
export function getSyncStatus(): { total: number; synced: number; pending: number } {
  // For backend-only mode, we don't track sync status
  // All records are considered synced if backend is available
  return {
    total: 0,
    synced: 0,
    pending: 0
  };
}

/**
 * Merge local and backend data, preserving offline changes
 * This function reconciles both sources by keeping the most recent version of each record
 */
async function mergeAndSync(): Promise<AttendanceRecord[]> {
  try {
    // Get local data
    const stored = localStorage.getItem(STORAGE_KEY);
    const localRecords: AttendanceRecord[] = stored ? JSON.parse(stored) : [];
    
    // Get backend data
    let backendRecords: AttendanceRecord[] = [];
    try {
      backendRecords = await backendApi.getAttendance();
    } catch (error) {
      console.warn('⚠️ Backend unavailable during merge');
      return localRecords;
    }
    
    // Create a map for merging, using most recent timestamp
    const mergeMap = new Map<string, AttendanceRecord>();
    
    // Add backend records first (these are the baseline)
    backendRecords.forEach(record => {
      const key = `${record.studentId}-${record.date}-${record.prayer}`;
      mergeMap.set(key, record);
    });
    
    // Merge local records - keep local version if it's newer (offline edits)
    let pushedToBackend = 0;
    for (const localRecord of localRecords) {
      const key = `${localRecord.studentId}-${localRecord.date}-${localRecord.prayer}`;
      const backendRecord = mergeMap.get(key);
      
      const localTimestamp = new Date(localRecord.timestamp || 0).getTime();
      const backendTimestamp = backendRecord ? new Date(backendRecord.timestamp || 0).getTime() : 0;
      
      // If local is newer or doesn't exist in backend, push to backend
      if (!backendRecord || localTimestamp > backendTimestamp) {
        try {
          await backendApi.saveAttendance(localRecord);
          mergeMap.set(key, localRecord);
          pushedToBackend++;
        } catch (error) {
          console.warn(`⚠️ Failed to push local record to backend:`, error);
          // Keep local version anyway
          mergeMap.set(key, localRecord);
        }
      }
    }
    
    if (pushedToBackend > 0) {
      console.log(`✅ Pushed ${pushedToBackend} local changes to backend`);
    }
    
    const mergedRecords = Array.from(mergeMap.values());
    
    // Update LocalStorage with merged data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedRecords));
    
    return mergedRecords;
  } catch (error) {
    console.error('❌ Error during merge and sync:', error);
    // Fall back to local data
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }
}

/**
 * Initialize sync listeners with proper bidirectional sync
 */
export function initializeSyncListeners(onUpdate?: () => void): void {
  // Clean up any duplicate attendance records on startup
  console.log("🧹 Checking for duplicate attendance records...");
  removeDuplicateAttendance().then(() => {
    if (onUpdate) {
      onUpdate();
    }
  });
  
  // On coming online, merge local changes with backend (bidirectional sync)
  window.addEventListener("online", async () => {
    try {
      if (await isBackendAvailable()) {
        console.log('🔄 Online detected - merging local and backend data...');
        await mergeAndSync();
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to sync:', error);
    }
  });
  
  // Initial sync - merge local and backend (preserves offline changes)
  if (navigator.onLine) {
    setTimeout(async () => {
      try {
        if (await isBackendAvailable()) {
          console.log('🔄 Initial sync: merging local and backend data...');
          const merged = await mergeAndSync();
          console.log(`✅ Initial sync complete: ${merged.length} total records`);
          if (onUpdate) {
            onUpdate();
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to sync:', error);
      }
    }, 1000);
  }
}

/**
 * Get attendance from LocalStorage only (internal helper)
 */
async function getLocalAttendanceFromStorage(): Promise<AttendanceRecord[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    return [];
  }
}

/**
 * Remove duplicate attendance records
 */
async function removeDuplicateAttendance(): Promise<number> {
  try {
    const records = await getLocalAttendance();
    const recordMap = new Map<string, AttendanceRecord>();
    let duplicatesRemoved = 0;
    
    records.forEach(record => {
      const key = `${record.studentId}-${record.date}-${record.prayer}`;
      const existing = recordMap.get(key);
      
      if (existing) {
        duplicatesRemoved++;
        // Keep the record with the latest timestamp
        if (new Date(record.timestamp) > new Date(existing.timestamp)) {
          recordMap.set(key, record);
        }
      } else {
        recordMap.set(key, record);
      }
    });
    
    if (duplicatesRemoved > 0) {
      const uniqueRecords = Array.from(recordMap.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueRecords));
      console.log(`🧹 Removed ${duplicatesRemoved} duplicate attendance records`);
    }
    
    return duplicatesRemoved;
  } catch (error) {
    console.error('❌ Error removing duplicates:', error);
    return 0;
  }
}

/**
 * Delete attendance record
 */
export async function deleteAttendanceRecord(id: string): Promise<void> {
  try {
    if (await isBackendAvailable()) {
      try {
        await backendApi.deleteAttendance(id);
        console.log(`✅ Deleted attendance record from backend: ${id}`);
        return;
      } catch (error) {
        console.warn('⚠️ Backend delete failed, using LocalStorage fallback:', error);
      }
    }
  } catch (error) {
    // Continue to LocalStorage fallback
  }
  
  // Fallback to LocalStorage
  const records = await getLocalAttendanceFromStorage();
  const updatedRecords = records.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
  console.log(`✅ Deleted attendance record from LocalStorage: ${id}`);
}

/**
 * Clear ALL attendance data from both LocalStorage and backend
 * Sets a persisted flag IMMEDIATELY to prevent sync from restoring old data
 * Throws error if backend clear fails to alert the user
 */
export async function clearAllAttendanceData(): Promise<{ count: number; clearedAt: number }> {
  const clearTime = Date.now();
  
  console.log('🗑️ Clearing all attendance data...');
  
  // SET PROTECTION FLAG IMMEDIATELY - before any async operations
  // This prevents any sync from restoring data while we're clearing
  setClearTimestamp(clearTime);
  console.log('🛡️ Protection flag set to prevent data restoration');
  
  // Clear LocalStorage immediately
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('caliph_attendance_sync_queue');
  console.log('✅ LocalStorage attendance cleared');
  
  // Clear backend - this MUST succeed for the clear to be complete
  let count = 0;
  let serverClearedAt = clearTime;
  const apiUrl = getApiBaseUrl();
  const token = localStorage.getItem('auth_token');
  
  try {
    const response = await fetch(`${apiUrl}/api/attendance`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      // Backend failed - throw error to alert user, but keep protection flag active
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to clear attendance from server (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    count = data.count || 0;
    serverClearedAt = data.clearedAt || clearTime;
    
    // Update local timestamp with server's authoritative timestamp
    setClearTimestamp(serverClearedAt);
    
    console.log(`✅ Backend attendance cleared: ${count} records at ${serverClearedAt}`);
  } catch (error) {
    // Keep protection flag active if backend clear fails
    console.error('❌ Backend clear failed - protection flag remains active:', error);
    throw error;
  }
  
  // Verify the deletion by fetching from backend (with cache busting and auth headers)
  try {
    const verifyResponse = await fetch(`${apiUrl}/api/attendance?_t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      cache: 'no-store',
    });
    
    // Handle both 200 (with data) and 304 (not modified - treat as empty if we just cleared)
    if (verifyResponse.ok) {
      const remaining = await verifyResponse.json();
      if (Array.isArray(remaining) && remaining.length > 0) {
        console.warn(`⚠️ ${remaining.length} records still exist after clear - keeping protection flag`);
        // Keep protection flag since some data wasn't cleared
      } else {
        console.log('✅ Verified: Backend is empty after clear');
        // Backend is empty - we can safely rely on the server timestamp now
      }
    } else if (verifyResponse.status === 304) {
      // 304 Not Modified - this shouldn't happen with cache-busting, but treat as success
      console.log('✅ Verified (304): Assuming backend is empty after clear');
    } else {
      // Non-success status - keep protection flag
      console.warn(`⚠️ Verification failed (${verifyResponse.status}) - keeping protection flag`);
    }
  } catch (verifyError) {
    console.warn('⚠️ Could not verify clear, keeping protection flag:', verifyError);
    // Keep protection flag as fallback
  }
  
  // Reset caches to force fresh checks
  backendAvailableCache = null;
  lastBackendCheck = 0;
  serverClearedAtCache = serverClearedAt;
  lastServerClearedAtCheck = Date.now();
  
  return { count, clearedAt: serverClearedAt };
}

/**
 * Reset the clear flag (call this if needed to restore normal sync behavior)
 */
export function resetClearFlag(): void {
  setClearTimestamp(0);
}

// Export sync functions for compatibility (no-op)
export async function syncToFirestore(): Promise<void> {
  // No-op - sync is handled automatically
}

export async function fetchFromFirestore(): Promise<AttendanceRecord[]> {
  return await getLocalAttendance();
}
