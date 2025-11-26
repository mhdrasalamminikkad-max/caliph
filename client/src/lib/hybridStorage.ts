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
 */
export async function getLocalAttendance(): Promise<AttendanceRecord[]> {
  try {
    // Get local data first (instant)
    const stored = localStorage.getItem(STORAGE_KEY);
    const localRecords: AttendanceRecord[] = stored ? JSON.parse(stored) : [];
    
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

// Export sync functions for compatibility (no-op)
export async function syncToFirestore(): Promise<void> {
  // No-op - sync is handled automatically
}

export async function fetchFromFirestore(): Promise<AttendanceRecord[]> {
  return await getLocalAttendance();
}
