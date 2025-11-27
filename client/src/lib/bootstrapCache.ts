/**
 * Bootstrap Cache - Pre-loads React Query cache from localStorage for INSTANT loading
 * This eliminates the need for network requests before rendering
 */

import type { Class, Student } from '@shared/schema';
import { queryClient } from './queryClient';

const CLASSES_KEY = 'caliph_classes';
const STUDENTS_KEY = 'caliph_students';
const BOOTSTRAP_CACHE_KEY = 'caliph_bootstrap_cache';

interface BootstrapData {
  classes: Class[];
  students: Student[];
  studentsByClass: Record<string, Student[]>;
  clearedAt: string | null;
  timestamp: number;
}

/**
 * Get classes from localStorage synchronously (no async/await)
 */
function getLocalClasses(): Class[] {
  try {
    const stored = localStorage.getItem(CLASSES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get students from localStorage synchronously (no async/await)
 */
function getLocalStudents(): Student[] {
  try {
    const stored = localStorage.getItem(STUDENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Group students by class name
 */
function groupStudentsByClass(students: Student[]): Record<string, Student[]> {
  const grouped: Record<string, Student[]> = {};
  students.forEach(student => {
    if (!grouped[student.className]) {
      grouped[student.className] = [];
    }
    grouped[student.className].push(student);
  });
  return grouped;
}

/**
 * Pre-populate React Query cache from localStorage
 * This runs SYNCHRONOUSLY before any components render
 * Making the UI appear instantly without waiting for API calls
 */
export function preloadCacheFromLocalStorage(): void {
  console.log('⚡ Pre-loading cache from localStorage for instant loading...');
  
  const classes = getLocalClasses();
  const students = getLocalStudents();
  const studentsByClass = groupStudentsByClass(students);
  
  // Pre-populate the React Query cache with localStorage data
  // This makes useQuery return immediately without waiting for API
  
  if (classes.length > 0) {
    queryClient.setQueryData(['classes'], classes);
    console.log(`⚡ Pre-loaded ${classes.length} classes`);
  }
  
  if (students.length > 0) {
    queryClient.setQueryData(['all-students'], studentsByClass);
    console.log(`⚡ Pre-loaded ${students.length} students`);
  }
  
  // Also pre-populate individual class student queries
  Object.entries(studentsByClass).forEach(([className, classStudents]) => {
    queryClient.setQueryData(['students', className], classStudents);
  });
}

/**
 * Background sync from server - updates cache with fresh data
 * This runs AFTER the UI has already rendered with localStorage data
 */
export async function backgroundSyncFromServer(): Promise<void> {
  try {
    console.log('🔄 Background syncing from server...');
    
    const response = await fetch('/api/bootstrap');
    if (!response.ok) {
      console.warn('⚠️ Background sync failed:', response.status);
      return;
    }
    
    const data: BootstrapData = await response.json();
    
    // Update localStorage with fresh data
    localStorage.setItem(CLASSES_KEY, JSON.stringify(data.classes));
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(data.students));
    localStorage.setItem(BOOTSTRAP_CACHE_KEY, JSON.stringify({
      timestamp: data.timestamp,
      clearedAt: data.clearedAt
    }));
    
    // Update React Query cache with fresh data
    queryClient.setQueryData(['classes'], data.classes);
    queryClient.setQueryData(['all-students'], data.studentsByClass);
    
    // Update individual class student queries
    Object.entries(data.studentsByClass).forEach(([className, classStudents]) => {
      queryClient.setQueryData(['students', className], classStudents);
    });
    
    console.log(`✅ Background sync complete: ${data.classes.length} classes, ${data.students.length} students`);
  } catch (error) {
    console.warn('⚠️ Background sync error (non-critical):', error);
  }
}

/**
 * Initialize instant loading
 * Call this once when the app starts
 */
export function initializeInstantLoading(): void {
  // Step 1: Immediately pre-populate cache from localStorage (synchronous)
  preloadCacheFromLocalStorage();
  
  // Step 2: Background sync from server (async, non-blocking)
  backgroundSyncFromServer().catch(err => {
    console.warn('Background sync failed:', err);
  });
}
