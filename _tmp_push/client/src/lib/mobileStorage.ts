/**
 * Mobile Storage Utilities
 * 
 * Handles mobile-specific storage issues:
 * - LocalStorage quota management
 * - Storage cleanup for mobile browsers
 * - Error handling for mobile restrictions
 */

const STORAGE_WARNING_THRESHOLD = 0.8; // Warn at 80% capacity
const MAX_STORAGE_ITEMS = 1000; // Limit items to prevent quota issues

/**
 * Check LocalStorage quota and clean up old data if needed
 */
export function checkStorageQuota(): { available: boolean; used: number; limit: number } {
  try {
    // Try to estimate storage usage
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
    }
    
    // Most mobile browsers allow ~5-10MB
    const estimatedLimit = 5 * 1024 * 1024; // 5MB conservative estimate
    const usagePercent = totalSize / estimatedLimit;
    
    return {
      available: usagePercent < STORAGE_WARNING_THRESHOLD,
      used: totalSize,
      limit: estimatedLimit
    };
  } catch (error) {
    console.warn("⚠️ Could not check storage quota:", error);
    return { available: true, used: 0, limit: 0 };
  }
}

/**
 * Clean up old attendance records to free space on mobile
 * Keeps the most recent records
 */
export function cleanupOldAttendanceRecords(daysToKeep: number = 90): number {
  try {
    const STORAGE_KEY = "caliph_attendance_local";
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) return 0;
    
    const records = JSON.parse(stored);
    if (!Array.isArray(records)) return 0;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];
    
    const before = records.length;
    const filtered = records.filter((record: any) => {
      return record.date >= cutoffDateString;
    });
    
    if (filtered.length < before) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log(`🧹 Cleaned up ${before - filtered.length} old attendance records (kept last ${daysToKeep} days)`);
      return before - filtered.length;
    }
    
    return 0;
  } catch (error) {
    console.error("❌ Error cleaning up old records:", error);
    return 0;
  }
}

/**
 * Get storage usage info
 */
export function getStorageInfo(): { items: number; estimatedSize: string; quota: { available: boolean; used: number; limit: number } } {
  const quota = checkStorageQuota();
  let totalSize = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && localStorage.getItem(key)) {
      totalSize += (key.length + localStorage.getItem(key)!.length) * 2; // UTF-16 = 2 bytes per char
    }
  }
  
  const sizeKB = (totalSize / 1024).toFixed(2);
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  return {
    items: localStorage.length,
    estimatedSize: parseFloat(sizeMB) > 1 ? `${sizeMB} MB` : `${sizeKB} KB`,
    quota
  };
}

/**
 * Test if LocalStorage is available and working
 */
export function testLocalStorage(): { available: boolean; error?: string } {
  try {
    const testKey = '__mobile_storage_test__';
    const testValue = 'test';
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    if (retrieved !== testValue) {
      return { available: false, error: 'Storage read/write failed' };
    }
    
    return { available: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('quota') || errorMessage.includes('QUOTA')) {
      return { available: false, error: 'Storage quota exceeded. Please clear old data.' };
    }
    
    if (errorMessage.includes('disabled') || errorMessage.includes('denied')) {
      return { available: false, error: 'LocalStorage is disabled in this browser.' };
    }
    
    return { available: false, error: errorMessage };
  }
}

/**
 * Initialize mobile storage with cleanup
 */
export function initializeMobileStorage(): void {
  // Test storage availability
  const storageTest = testLocalStorage();
  
  if (!storageTest.available) {
    console.error(`❌ LocalStorage not available: ${storageTest.error}`);
    return;
  }
  
  // Check quota
  const quota = checkStorageQuota();
  
  if (!quota.available) {
    console.warn(`⚠️ Storage usage high (${((quota.used / quota.limit) * 100).toFixed(1)}%). Cleaning up old records...`);
    const cleaned = cleanupOldAttendanceRecords(60); // Keep last 60 days
    if (cleaned > 0) {
      console.log(`✅ Freed space by removing ${cleaned} old records`);
    }
  }
  
  const info = getStorageInfo();
  console.log(`📱 Storage: ${info.items} items, ${info.estimatedSize}`);
}

