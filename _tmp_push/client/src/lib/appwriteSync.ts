/**
 * Appwrite Sync for Classes, Students, Attendance, and Summary
 * Syncs data to Appwrite for multi-device access with real-time updates
 */

import { databases, isAppwriteAvailable, COLLECTION_IDS, DATABASE_ID } from './appwriteConfig';
import { Query } from 'appwrite';
import type { Class, Student } from '@shared/schema';
import type { AttendanceRecord } from './hybridStorage';

const CLASSES_KEY = 'caliph_classes';
const STUDENTS_KEY = 'caliph_students';

// Store unsubscribe functions for real-time listeners
let classesUnsubscribe: (() => void) | null = null;
let studentsUnsubscribe: (() => void) | null = null;

/**
 * Sync all classes to Appwrite
 */
export async function syncClassesToFirestore(): Promise<void> {
  if (!isAppwriteAvailable() || !databases) {
    console.warn("⚠️ Appwrite not available - skipping class sync");
    return;
  }

  if (!navigator.onLine) {
    console.log("📴 Offline - skipping class sync");
    return;
  }

  try {
    const stored = localStorage.getItem(CLASSES_KEY);
    if (!stored) {
      console.log("📝 No classes in LocalStorage to sync");
      return;
    }

    const classes: Class[] = JSON.parse(stored);

    if (classes.length === 0) {
      console.log("📝 No classes to sync (empty array)");
      return;
    }

    console.log(`🔄 Syncing ${classes.length} class(es) to Appwrite:`, classes.map(c => c.name).join(', '));

    // Helper function to wait/delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Helper function to retry with exponential backoff - very conservative for success
    const retryWithBackoff = async (fn: () => Promise<any>, retries = 10, delayMs = 5000): Promise<any> => {
      for (let i = 0; i < retries; i++) {
        try {
          return await fn();
        } catch (error: any) {
          // Check if rate limited (429) - check multiple possible error formats
          const isRateLimited = 
            error.code === 429 || 
            error.response?.code === 429 ||
            error.message?.includes('rate limit') ||
            error.message?.includes('Rate limit') ||
            error.type === 'general_rate_limit_exceeded';
          
          if (isRateLimited) {
            // Much longer wait times for rate limits: 5s, 10s, 20s, 40s, 80s, 160s, 320s, 640s, 1280s, 2560s
            const waitTime = delayMs * Math.pow(2, i);
            // Only log first retry to avoid spam
            if (i === 0) {
              console.log(`⏳ Rate limited. Waiting ${waitTime/1000}s and retrying (up to ${retries} times)...`);
            }
            await delay(waitTime);
            continue;
          }
          
          // For 409 (conflict) or 404 (not found), these are handled in the catch block
          // Don't retry these - they're expected in some cases
          if (error.code === 409 || error.code === 404) {
            throw error;
          }
          
          // For other errors on last retry, throw
          if (i === retries - 1) {
            throw error;
          }
          
          // For other errors, wait a bit and retry (silently)
          const waitTime = 1000 * (i + 1); // 1s, 2s, 3s, etc.
          await delay(waitTime);
        }
      }
      throw new Error("Max retries exceeded");
    };

    // Upsert all classes to Appwrite with rate limiting
    for (const classItem of classes) {
      try {
        if (!databases) throw new Error("Databases not available");
        
        await retryWithBackoff(async () => {
          // Prepare data - only include fields that exist in Appwrite collection
          const classData: any = {
            id: String(classItem.id),
            name: String(classItem.name),
          };
          
          // Only add DateTime fields if they exist and are valid
          if (classItem.createdAt) {
            try {
              classData.createdAt = new Date(classItem.createdAt).toISOString();
            } catch (e) {
              // Skip if invalid date
            }
          }
          
          return await databases.createDocument(
            DATABASE_ID,
            COLLECTION_IDS.CLASSES,
            classItem.id, // Use class ID as document ID
            classData
          ).catch(async (error: any) => {
            // If document exists, update it
            if (!databases) throw new Error("Databases not available");
            if (error.code === 409 || error.code === 404) {
              const updateData: any = {
                name: String(classItem.name),
              };
              // Only add updatedAt if the attribute exists
              try {
                updateData.updatedAt = new Date().toISOString();
              } catch (e) {
                // Skip if error
              }
              return await databases.updateDocument(
                DATABASE_ID,
                COLLECTION_IDS.CLASSES,
                classItem.id,
                updateData
              );
            }
            // Log 400 errors for debugging
            if (error.code === 400) {
              console.error(`❌ 400 Bad Request for class "${classItem.name}":`, error.message);
              console.error(`   Data sent:`, classData);
            }
            // If rate limited, throw to trigger retry
            if (error.code === 429 || error.response?.code === 429) {
              throw error;
            }
            throw error;
          });
        });
        
        // Much longer delay between requests to avoid rate limits - ensure success
        await delay(2000); // 2 seconds between classes
        } catch (error: any) {
          const isRateLimited = 
            error.code === 429 || 
            error.response?.code === 429 ||
            error.message?.includes('rate limit') ||
            error.message?.includes('Rate limit') ||
            error.type === 'general_rate_limit_exceeded';
          
          // Silently skip rate-limited items - they'll be retried later
          // Only log if it's not a rate limit (actual errors)
          if (!isRateLimited && !error.message?.includes('Max retries exceeded')) {
            // Only log actual errors, not rate limits or retry failures
            console.warn(`⚠️ Skipped class "${classItem.name}" - will retry later`);
          }
          // Don't throw - continue with other classes
        }
    }

    console.log(`✅ Synced ${classes.length} class(es) to Appwrite`);
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    console.error("❌ Error syncing classes to Appwrite:", errorMessage);
    throw error;
  }
}

/**
 * Sync all students to Appwrite
 */
export async function syncStudentsToFirestore(): Promise<void> {
  if (!isAppwriteAvailable() || !databases) {
    console.warn("⚠️ Appwrite not available - skipping student sync");
    return;
  }

  if (!navigator.onLine) {
    console.log("📴 Offline - skipping student sync");
    return;
  }

  try {
    const stored = localStorage.getItem(STUDENTS_KEY);
    if (!stored) {
      console.log("📝 No students to sync");
      return;
    }

    const students: Student[] = JSON.parse(stored);

    if (students.length === 0) {
      console.log("📝 No students to sync");
      return;
    }

    console.log(`🔄 Syncing ${students.length} student(s) to Appwrite...`);

    // Helper function to wait/delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Helper function to retry with exponential backoff - very conservative for success
    const retryWithBackoff = async (fn: () => Promise<any>, retries = 10, delayMs = 5000): Promise<any> => {
      for (let i = 0; i < retries; i++) {
        try {
          return await fn();
        } catch (error: any) {
          // Check if rate limited (429) - check multiple possible error formats
          const isRateLimited = 
            error.code === 429 || 
            error.response?.code === 429 ||
            error.message?.includes('rate limit') ||
            error.message?.includes('Rate limit') ||
            error.type === 'general_rate_limit_exceeded';
          
          if (isRateLimited) {
            // Much longer wait times for rate limits: 5s, 10s, 20s, 40s, 80s, 160s, 320s, 640s, 1280s, 2560s
            const waitTime = delayMs * Math.pow(2, i);
            // Only log first retry to avoid spam
            if (i === 0) {
              console.log(`⏳ Rate limited. Waiting ${waitTime/1000}s and retrying (up to ${retries} times)...`);
            }
            await delay(waitTime);
            continue;
          }
          
          // For 409 (conflict) or 404 (not found), these are handled in the catch block
          // Don't retry these - they're expected in some cases
          if (error.code === 409 || error.code === 404) {
            throw error;
          }
          
          // For other errors on last retry, throw
          if (i === retries - 1) {
            throw error;
          }
          
          // For other errors, wait a bit and retry (silently)
          const waitTime = 1000 * (i + 1); // 1s, 2s, 3s, etc.
          await delay(waitTime);
        }
      }
      throw new Error("Max retries exceeded");
    };

    // Sync students with rate limiting - VERY slow to avoid 429 errors
    const batchSize = 2; // Very small batches (2 students at a time)
    const delayBetweenRequests = 1000; // 1 second delay between each request
    const delayBetweenBatches = 5000; // 5 seconds delay between batches (much longer wait)
    
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      
      for (const student of batch) {
        try {
          if (!databases) throw new Error("Databases not available");
          
          await retryWithBackoff(async () => {
            // Prepare data - only include fields that exist in Appwrite collection
            const studentData: any = {
              id: String(student.id),
              name: String(student.name),
              className: String(student.className),
            };
            
            // Only add rollNumber if it exists (it's optional)
            if (student.rollNumber) {
              studentData.rollNumber = String(student.rollNumber);
            }
            
            // Only add updatedAt if the attribute exists in Appwrite
            try {
              studentData.updatedAt = new Date().toISOString();
            } catch (e) {
              // Skip if error
            }
            
            return await databases.createDocument(
              DATABASE_ID,
              COLLECTION_IDS.STUDENTS,
              student.id, // Use student ID as document ID
              studentData
            ).catch(async (error: any) => {
              if (!databases) throw new Error("Databases not available");
              // If document exists, update it
              if (error.code === 409 || error.code === 404) {
                const updateData: any = {
                  name: String(student.name),
                  className: String(student.className),
                };
                
                // Only add rollNumber if it exists
                if (student.rollNumber) {
                  updateData.rollNumber = String(student.rollNumber);
                }
                
                // Only add updatedAt if the attribute exists
                try {
                  updateData.updatedAt = new Date().toISOString();
                } catch (e) {
                  // Skip if error
                }
                
                return await databases.updateDocument(
                  DATABASE_ID,
                  COLLECTION_IDS.STUDENTS,
                  student.id,
                  updateData
                );
              }
              // Log 400 errors for debugging
              if (error.code === 400) {
                console.error(`❌ 400 Bad Request for student "${student.name}":`, error.message);
                console.error(`   Data sent:`, studentData);
              }
              // If rate limited, throw to trigger retry
              if (error.code === 429 || error.response?.code === 429) {
                throw error;
              }
              throw error;
            });
          });
          
          // Small delay between requests to avoid rate limits
          await delay(delayBetweenRequests);
        } catch (error: any) {
          const isRateLimited = 
            error.code === 429 || 
            error.response?.code === 429 ||
            error.message?.includes('rate limit') ||
            error.message?.includes('Rate limit') ||
            error.type === 'general_rate_limit_exceeded';
          
          // Silently skip rate-limited items - they'll be retried later
          // Only log occasionally to avoid spam (every 10th error)
          const shouldLog = Math.random() < 0.1; // 10% chance to log
          if (shouldLog && !isRateLimited && !error.message?.includes('Max retries exceeded')) {
            console.warn(`⚠️ Some students skipped - will retry later`);
          }
          // Don't throw - continue with other students
        }
      }

      console.log(`   Progress: ${Math.min(i + batchSize, students.length)}/${students.length} students`);
      
      // Delay between batches to avoid rate limits
      if (i + batchSize < students.length) {
        await delay(delayBetweenBatches);
      }
    }

    console.log(`✅ Synced ${students.length} student(s) to Appwrite`);
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    console.error("❌ Error syncing students to Appwrite:", errorMessage);
    throw error;
  }
}

/**
 * Delete class from Appwrite
 * Also deletes all students in that class from Appwrite
 */
export async function deleteClassFromFirestore(classId: string, className?: string): Promise<void> {
  if (!isAppwriteAvailable() || !databases) {
    return;
  }

  if (!navigator.onLine) {
    return;
  }

  try {
    // Delete class from Appwrite
    await databases.deleteDocument(DATABASE_ID, COLLECTION_IDS.CLASSES, classId);
    console.log(`✅ Deleted class ${classId} from Appwrite`);

    // Also delete all students in this class from Appwrite
    if (className) {
      const { documents } = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.STUDENTS,
        [Query.equal('className', className)]
      );

      if (documents.length > 0) {
        console.log(`🔄 Found ${documents.length} student(s) in Appwrite for class "${className}"`);
        for (const doc of documents) {
          try {
            await databases.deleteDocument(DATABASE_ID, COLLECTION_IDS.STUDENTS, doc.$id);
          } catch (err) {
            console.warn(`⚠️ Failed to delete student ${doc.$id} from Appwrite:`, err);
          }
        }
        console.log(`✅ Deleted ${documents.length} student(s) from Appwrite`);
      }
    }
  } catch (error) {
    console.error("❌ Error deleting class from Appwrite:", error);
    throw error;
  }
}

/**
 * Delete student from Appwrite
 */
export async function deleteStudentFromFirestore(studentId: string): Promise<void> {
  if (!isAppwriteAvailable() || !databases) {
    return;
  }

  if (!navigator.onLine) {
    return;
  }

  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_IDS.STUDENTS, studentId);
    console.log(`✅ Deleted student ${studentId} from Appwrite`);
  } catch (error) {
    console.error("❌ Error deleting student from Appwrite:", error);
  }
}

/**
 * Fetch classes from Appwrite and merge with local
 * Returns the number of classes after merge
 */
export async function fetchClassesFromFirestore(): Promise<number> {
  if (!isAppwriteAvailable() || !databases) {
    const localClasses = JSON.parse(localStorage.getItem(CLASSES_KEY) || '[]');
    return localClasses.length;
  }

  if (!navigator.onLine) {
    const localClasses = JSON.parse(localStorage.getItem(CLASSES_KEY) || '[]');
    return localClasses.length;
  }

  try {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTION_IDS.CLASSES);

    const localClasses = JSON.parse(localStorage.getItem(CLASSES_KEY) || '[]') as Class[];
    const classMap = new Map<string, Class>();

    // Add local classes first
    localClasses.forEach(c => classMap.set(c.id, c));

    // Merge cloud classes (cloud wins if exists)
    documents.forEach((doc: any) => {
      const cloudClass: Class = {
        id: doc.id || doc.$id,
        name: doc.name,
        createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      };
      classMap.set(cloudClass.id, cloudClass);
    });

    const mergedClasses = Array.from(classMap.values());
    localStorage.setItem(CLASSES_KEY, JSON.stringify(mergedClasses));

    console.log(`✅ Fetched and merged ${documents.length} class(es) from Appwrite`);
    console.log(`   Classes in LocalStorage now: ${mergedClasses.map(c => c.name).join(', ')}`);

    return mergedClasses.length;
  } catch (error) {
    console.error("❌ Error fetching classes from Appwrite:", error);
    throw error;
  }
}

/**
 * Fetch students from Appwrite and merge with local
 * Returns the number of students after merge
 */
export async function fetchStudentsFromFirestore(): Promise<number> {
  if (!isAppwriteAvailable() || !databases) {
    const localStudents = JSON.parse(localStorage.getItem(STUDENTS_KEY) || '[]');
    return localStudents.length;
  }

  if (!navigator.onLine) {
    const localStudents = JSON.parse(localStorage.getItem(STUDENTS_KEY) || '[]');
    return localStudents.length;
  }

  try {
    const { documents } = await databases.listDocuments(DATABASE_ID, COLLECTION_IDS.STUDENTS);

    const localStudents = JSON.parse(localStorage.getItem(STUDENTS_KEY) || '[]') as Student[];
    const studentMap = new Map<string, Student>();

    // Add ALL local students first (preserve local data)
    localStudents.forEach(s => {
      studentMap.set(s.id, s);
    });

    // Merge cloud students (cloud wins if exists, but don't delete local-only students)
    documents.forEach((doc: any) => {
      const cloudStudent: Student = {
        id: doc.id || doc.$id,
        name: doc.name,
        rollNumber: doc.rollNumber || null,
        className: doc.className,
      };
      studentMap.set(cloudStudent.id, cloudStudent); // Cloud wins if same ID exists
    });

    const mergedStudents = Array.from(studentMap.values());
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(mergedStudents));

    console.log(`✅ Fetched and merged ${documents.length} student(s) from Appwrite`);
    console.log(`   Total students in LocalStorage now: ${mergedStudents.length}`);

    return mergedStudents.length;
  } catch (error) {
    console.error("❌ Error fetching students from Appwrite:", error);
    throw error;
  }
}

/**
 * Initialize real-time sync for classes using Appwrite subscriptions
 */
export function initializeRealtimeClassesSync(onUpdate?: () => void): void {
  if (classesUnsubscribe) {
    classesUnsubscribe();
    classesUnsubscribe = null;
  }

  if (!isAppwriteAvailable() || !databases) {
    if (onUpdate) {
      onUpdate();
    }
    return;
  }

  if (!navigator.onLine) {
    window.addEventListener("online", () => initializeRealtimeClassesSync(onUpdate), { once: true });
    return;
  }

  try {
    import('./appwriteConfig').then(({ realtime }) => {
      if (!realtime) {
        throw new Error("Realtime not available");
      }

      // Subscribe to classes collection changes
      realtime.subscribe(
        `databases.${DATABASE_ID}.collections.${COLLECTION_IDS.CLASSES}.documents`,
        (response: any) => {
          console.log(`📡 Class change: ${response.event} - INSTANT SYNC`);
          
          // Fetch latest from Appwrite and merge
          fetchClassesFromFirestore()
            .then(() => {
              if (onUpdate) {
                onUpdate(); // Trigger UI update instantly
                setTimeout(() => onUpdate(), 100); // Extra trigger for reliability
                setTimeout(() => onUpdate(), 500);
              }
            })
            .catch((err) => {
              console.error("❌ Error fetching classes after real-time update:", err);
            });
        }
      ).then((subscription) => {
        classesUnsubscribe = () => subscription.close();
        console.log("✅ Classes real-time sync active");
      });
    }).catch((error) => {
      console.error("❌ Failed to initialize classes real-time sync:", error);
    });
  } catch (error) {
    console.error("❌ Failed to initialize classes real-time sync:", error);
  }
}

/**
 * Initialize real-time sync for students using Appwrite subscriptions
 */
export function initializeRealtimeStudentsSync(onUpdate?: () => void): void {
  if (studentsUnsubscribe) {
    studentsUnsubscribe();
    studentsUnsubscribe = null;
  }

  if (!isAppwriteAvailable() || !databases) {
    if (onUpdate) {
      onUpdate();
    }
    return;
  }

  if (!navigator.onLine) {
    window.addEventListener("online", () => initializeRealtimeStudentsSync(onUpdate), { once: true });
    return;
  }

  try {
    import('./appwriteConfig').then(({ realtime }) => {
      if (!realtime) {
        throw new Error("Realtime not available");
      }

      // Subscribe to students collection changes
      realtime.subscribe(
        `databases.${DATABASE_ID}.collections.${COLLECTION_IDS.STUDENTS}.documents`,
        (response: any) => {
          console.log(`📡 Student change: ${response.event} - INSTANT SYNC`);

          // Fetch latest from Appwrite and merge
          fetchStudentsFromFirestore()
            .then(() => {
              if (onUpdate) {
                onUpdate(); // Trigger UI update instantly
                setTimeout(() => onUpdate(), 100); // Extra trigger for reliability
                setTimeout(() => onUpdate(), 500);
              }
            })
            .catch((err) => {
              console.error("❌ Error fetching students after real-time update:", err);
            });
        }
      ).then((subscription) => {
        studentsUnsubscribe = () => subscription.close();
        console.log("✅ Students real-time sync active");
      });
    }).catch((error) => {
      console.error("❌ Failed to initialize students real-time sync:", error);
    });
  } catch (error) {
    console.error("❌ Failed to initialize students real-time sync:", error);
  }
}

/**
 * Force sync all existing classes and students to Appwrite
 */
export async function forceSyncAllData(): Promise<void> {
  console.log("🔄 Force syncing all classes and students to Appwrite...");

  try {
    await Promise.all([
      syncClassesToFirestore(),
      syncStudentsToFirestore(),
    ]);
    console.log("✅ Force sync complete!");
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    console.error("❌ Force sync failed:", errorMessage);
    throw error;
  }
}

/**
 * Initialize all real-time syncs and fetch initial data
 */
export async function initializeFirebaseSync(onUpdate?: () => void): Promise<void> {
  if (!isAppwriteAvailable() || !databases) {
    console.log("📦 Appwrite not available - skipping initialization");
    if (onUpdate) {
      onUpdate();
    }
    return;
  }

  if (!navigator.onLine) {
    console.log("📴 Offline - sync will start when online");
    return;
  }

  // STEP 1: Sync ALL local data TO Appwrite FIRST
  console.log("🔄 Step 1: Syncing ALL local classes and students TO Appwrite...");
  try {
    await Promise.all([
      syncClassesToFirestore(),
      syncStudentsToFirestore(),
    ]);
    console.log("✅ All local data synced to Appwrite successfully!");
  } catch (err: any) {
    const errorMessage = err?.message || String(err);
    console.error("❌ Failed to sync local data to Appwrite:", errorMessage);
    console.warn("⚠️ You may need to configure Appwrite collections and permissions");
  }

  // STEP 2: Fetch data FROM Appwrite (to merge with data from other devices)
  console.log("🔄 Step 2: Fetching classes and students FROM Appwrite...");
  try {
    const [classesCount, studentsCount] = await Promise.all([
      fetchClassesFromFirestore(),
      fetchStudentsFromFirestore(),
    ]);
    console.log(`✅ Fetched data from Appwrite - ${classesCount} classes, ${studentsCount} students merged`);

    if (onUpdate) {
      onUpdate();
      setTimeout(() => onUpdate(), 500);
    }
  } catch (err: any) {
    const errorMessage = err?.message || String(err);
    console.error("❌ Failed to fetch from Appwrite:", errorMessage);
  }

  // STEP 3: Start real-time listeners (for instant updates)
  console.log("🔄 Step 3: Starting real-time sync listeners...");
  initializeRealtimeClassesSync(onUpdate);
  initializeRealtimeStudentsSync(onUpdate);

  // Periodic sync every 30 seconds if online
  setInterval(() => {
    if (navigator.onLine && isAppwriteAvailable()) {
      Promise.all([
        fetchClassesFromFirestore(),
        fetchStudentsFromFirestore(),
      ]).then(() => {
        if (onUpdate) {
          onUpdate();
        }
      }).catch(() => {});

      syncClassesToFirestore().catch(() => {});
      syncStudentsToFirestore().catch(() => {});
    }
  }, 30 * 1000); // 30 seconds

  // Fetch when coming online
  window.addEventListener("online", () => {
    Promise.all([
      syncClassesToFirestore(),
      syncStudentsToFirestore(),
    ]).then(() => {
      Promise.all([
        fetchClassesFromFirestore(),
        fetchStudentsFromFirestore(),
      ]).then(() => {
        if (onUpdate) {
          onUpdate();
        }
      }).catch(() => {});
    }).catch(() => {});
  });
}

/**
 * Stop all real-time syncs
 */
export function stopFirebaseSync(): void {
  if (classesUnsubscribe) {
    classesUnsubscribe();
    classesUnsubscribe = null;
  }
  if (studentsUnsubscribe) {
    studentsUnsubscribe();
    studentsUnsubscribe = null;
  }
  console.log("🛑 Appwrite sync stopped");
}
