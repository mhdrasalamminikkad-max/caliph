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

// Check if backend is available
async function isBackendAvailable(): Promise<boolean> {
  const now = Date.now();
  if (backendAvailableCache !== null && (now - lastBackendCheck) < BACKEND_CHECK_INTERVAL) {
    return backendAvailableCache;
  }
  
  try {
    const response = await fetch('http://localhost:5000/api/attendance', {
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
 * Save attendance record to backend API
 */
export async function saveAttendanceLocal(record: AttendanceRecord): Promise<void> {
  try {
    // Ensure record has timestamp
    const recordWithTimestamp = {
      ...record,
      timestamp: record.timestamp || new Date().toISOString(),
    };
    
    // Try to save to backend first
    if (await isBackendAvailable()) {
      try {
        await backendApi.saveAttendance(recordWithTimestamp);
        console.log(`✅ Attendance saved to backend: ${record.studentName} - ${record.prayer}`);
        return;
      } catch (error) {
        console.warn('⚠️ Backend save failed, using LocalStorage fallback:', error);
      }
    }
    
    // Fallback to LocalStorage if backend unavailable
    const existingRecords = await getLocalAttendance();
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
    console.log(`✅ Attendance saved to LocalStorage: ${record.studentName} - ${record.prayer}`);
  } catch (error) {
    console.error("❌ Error saving attendance:", error);
    throw error;
  }
}

/**
 * Batch save multiple attendance records
 */
export async function saveAttendanceBatch(records: AttendanceRecord[]): Promise<void> {
  if (records.length === 0) return;
  
  try {
    // Try to save all to backend first
    if (await isBackendAvailable()) {
      try {
        await Promise.all(records.map(record => {
          const recordWithTimestamp = {
            ...record,
            timestamp: record.timestamp || new Date().toISOString(),
          };
          return backendApi.saveAttendance(recordWithTimestamp);
        }));
        console.log(`✅ Batch saved ${records.length} attendance records to backend`);
        return;
      } catch (error) {
        console.warn('⚠️ Backend batch save failed, using LocalStorage fallback:', error);
      }
    }
    
    // Fallback to LocalStorage
    const existingRecords = await getLocalAttendance();
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
    console.log(`✅ Batch saved ${records.length} attendance records to LocalStorage`);
  } catch (error) {
    console.error("❌ Error batch saving attendance:", error);
    throw error;
  }
}

/**
 * Get all attendance records from backend or LocalStorage
 */
export async function getLocalAttendance(): Promise<AttendanceRecord[]> {
  try {
    // Try to get from backend first
    if (await isBackendAvailable()) {
      try {
        const records = await backendApi.getAttendance();
        console.log(`✅ Loaded ${records.length} attendance records from backend`);
        // Ensure all records have timestamps
        return records.map(r => ({
          ...r,
          timestamp: r.timestamp || new Date().toISOString()
        }));
      } catch (error) {
        console.warn('⚠️ Backend fetch failed, using LocalStorage fallback:', error);
      }
    }
  } catch (error) {
    console.warn('⚠️ Backend unavailable, using LocalStorage fallback');
  }
  
  // Fallback to LocalStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const allRecords: AttendanceRecord[] = JSON.parse(stored);
    
    // Deduplicate: Keep only the latest record for each student-date-prayer combination
    const recordMap = new Map<string, AttendanceRecord>();
    
    allRecords.forEach(record => {
      const key = `${record.studentId}-${record.date}-${record.prayer}`;
      const existing = recordMap.get(key);
      
      // Keep the record with the latest timestamp
      if (!existing || new Date(record.timestamp) > new Date(existing.timestamp)) {
        recordMap.set(key, record);
      }
    });
    
    return Array.from(recordMap.values());
  } catch (error) {
    console.error("❌ Error reading from LocalStorage:", error);
    return [];
  }
}

/**
 * Get attendance by date range
 */
export async function getLocalAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceRecord[]> {
  try {
    if (await isBackendAvailable()) {
      try {
        const allRecords = await backendApi.getAttendance();
        return allRecords
          .map(r => ({
            ...r,
            timestamp: r.timestamp || new Date().toISOString()
          }))
          .filter(record => {
            return record.date >= startDate && record.date <= endDate;
          });
      } catch (error) {
        console.warn('⚠️ Backend fetch failed, using LocalStorage fallback:', error);
      }
    }
  } catch (error) {
    // Continue to LocalStorage fallback
  }
  
  const allRecords = await getLocalAttendance();
  return allRecords.filter(record => {
    return record.date >= startDate && record.date <= endDate;
  });
}

/**
 * Get attendance for a specific student
 */
export async function getLocalStudentAttendance(studentId: string): Promise<AttendanceRecord[]> {
  try {
    if (await isBackendAvailable()) {
      try {
        const records = await backendApi.getAttendance({ studentId });
        return records.map(r => ({
          ...r,
          timestamp: r.timestamp || new Date().toISOString()
        }));
      } catch (error) {
        console.warn('⚠️ Backend fetch failed, using LocalStorage fallback:', error);
      }
    }
  } catch (error) {
    // Continue to LocalStorage fallback
  }
  
  const allRecords = await getLocalAttendance();
  return allRecords.filter(record => record.studentId === studentId);
}

/**
 * Get attendance by filters (date, className, prayer)
 */
export async function getLocalAttendanceByFilters(filters: {
  date?: string;
  className?: string;
  prayer?: string;
}): Promise<AttendanceRecord[]> {
  try {
    if (await isBackendAvailable()) {
      try {
        const records = await backendApi.getAttendance(filters);
        return records.map(r => ({
          ...r,
          timestamp: r.timestamp || new Date().toISOString()
        }));
      } catch (error) {
        console.warn('⚠️ Backend fetch failed, using LocalStorage fallback:', error);
      }
    }
  } catch (error) {
    // Continue to LocalStorage fallback
  }
  
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
 * Initialize sync listeners (simplified - no real-time sync needed)
 */
export function initializeSyncListeners(onUpdate?: () => void): void {
  // Clean up any duplicate attendance records on startup
  console.log("🧹 Checking for duplicate attendance records...");
  removeDuplicateAttendance().then(() => {
    if (onUpdate) {
      onUpdate();
    }
  });
  
  // Sync LocalStorage to backend when coming online
  window.addEventListener("online", async () => {
    try {
      const localRecords = await getLocalAttendanceFromStorage();
      if (localRecords.length > 0 && await isBackendAvailable()) {
        console.log(`🔄 Syncing ${localRecords.length} local records to backend...`);
        await saveAttendanceBatch(localRecords);
        // Clear LocalStorage after successful sync
        localStorage.removeItem(STORAGE_KEY);
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to sync local records to backend:', error);
    }
  });
  
  // Initial sync if online
  if (navigator.onLine) {
    setTimeout(async () => {
      try {
        const localRecords = await getLocalAttendanceFromStorage();
        if (localRecords.length > 0 && await isBackendAvailable()) {
          console.log(`🔄 Syncing ${localRecords.length} local records to backend...`);
          await saveAttendanceBatch(localRecords);
          // Clear LocalStorage after successful sync
          localStorage.removeItem(STORAGE_KEY);
          if (onUpdate) {
            onUpdate();
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to sync local records to backend:', error);
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
