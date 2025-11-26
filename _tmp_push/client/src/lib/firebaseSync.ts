/**
 * Appwrite Sync API for Classes and Students
 * 
 * This file re-exports Appwrite sync functions for backward compatibility.
 * All functions now use Appwrite for real-time multi-device sync.
 */

// Re-export all functions from appwriteSync for backward compatibility
export {
  syncClassesToFirestore,
  syncStudentsToFirestore,
  deleteClassFromFirestore,
  deleteStudentFromFirestore,
  fetchClassesFromFirestore,
  fetchStudentsFromFirestore,
  initializeRealtimeClassesSync,
  initializeRealtimeStudentsSync,
  forceSyncAllData,
  initializeFirebaseSync,
  stopFirebaseSync,
} from './appwriteSync';