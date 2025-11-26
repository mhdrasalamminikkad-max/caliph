/**
 * Storage API - Uses Backend API
 * Connects to local Node.js backend for data persistence
 */

import { nanoid } from 'nanoid';
import type { Class, Student } from '@shared/schema';
import * as backendApi from './backendApi';

// Storage keys for LocalStorage fallback (if backend unavailable)
const CLASSES_KEY = 'caliph_classes';
const STUDENTS_KEY = 'caliph_students';
const INITIALIZED_KEY = 'caliph_initialized';

// Check if backend is available
async function isBackendAvailable(): Promise<boolean> {
  try {
    // Use the current origin (works on Replit and localhost)
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const response = await fetch(`${apiUrl}/api/classes`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Helper function to get classes from LocalStorage only (no backend check)
function getClassesFromStorage(): Class[] {
  try {
    const stored = localStorage.getItem(CLASSES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading classes from storage:', error);
    return [];
  }
}

// Helper function to get students from LocalStorage only (no backend check)
function getStudentsFromStorage(): Student[] {
  try {
    const stored = localStorage.getItem(STUDENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading students from storage:', error);
    return [];
  }
}

// ==================== Classes ====================

export async function getClasses(): Promise<Class[]> {
  // INSTANT: Return from LocalStorage first
  const localClasses = getClassesFromStorage();
  
  // Background sync from backend (don't block UI)
  (async () => {
    try {
      const backendClasses = await backendApi.getClasses();
      if (backendClasses && backendClasses.length > 0) {
        localStorage.setItem(CLASSES_KEY, JSON.stringify(backendClasses));
      }
    } catch (error) {
      // Silently fail - local data is already returned
    }
  })();
  
  // Return local data immediately (if empty, try backend once)
  if (localClasses.length === 0) {
    try {
      const backendClasses = await backendApi.getClasses();
      if (backendClasses) {
        localStorage.setItem(CLASSES_KEY, JSON.stringify(backendClasses));
        return backendClasses;
      }
    } catch (error) {
      // Continue with empty array
    }
  }
  
  return localClasses;
}

export async function createClass(name: string): Promise<Class> {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    throw new Error('Class name cannot be empty');
  }
  
  const id = nanoid();
  const newClass: Class = {
    id,
    name: trimmedName,
    createdAt: new Date().toISOString(),
  };
  
  // Get current classes from LocalStorage
  const classes = getClassesFromStorage();
  
  // Check for duplicate
  if (classes.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
    throw new Error(`Class name "${trimmedName}" already exists`);
  }
  
  // INSTANT: Save to LocalStorage first
  classes.push(newClass);
  localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
  
  // Background sync to backend
  (async () => {
    try {
      await backendApi.createClass(id, trimmedName);
    } catch (error) {
      console.warn('⚠️ Backend create failed, data preserved in LocalStorage');
    }
  })();
  
  return newClass;
}

export async function deleteClass(classId: string): Promise<boolean> {
  // Get class name before deletion for LocalStorage cleanup
  const classes = getClassesFromStorage();
  const classToDelete = classes.find(c => c.id === classId);
  
  // INSTANT: Delete from LocalStorage first
  const updatedClasses = classes.filter(c => c.id !== classId);
  localStorage.setItem(CLASSES_KEY, JSON.stringify(updatedClasses));
  
  // Also delete students in this class
  if (classToDelete) {
    const students = getStudentsFromStorage();
    const updatedStudents = students.filter(s => s.className !== classToDelete.name);
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(updatedStudents));
  }
  
  // Background sync to backend
  (async () => {
    try {
      await backendApi.deleteClass(classId);
    } catch (error) {
      console.warn('⚠️ Backend delete failed');
    }
  })();
  
  return true;
}

// ==================== Students ====================

export async function getStudents(): Promise<Student[]> {
  // INSTANT: Return from LocalStorage first
  const localStudents = getStudentsFromStorage();
  
  // Background sync from backend (don't block UI)
  (async () => {
    try {
      const backendStudents = await backendApi.getStudents();
      if (backendStudents && backendStudents.length > 0) {
        localStorage.setItem(STUDENTS_KEY, JSON.stringify(backendStudents));
      }
    } catch (error) {
      // Silently fail - local data is already returned
    }
  })();
  
  // Return local data immediately (if empty, try backend once)
  if (localStudents.length === 0) {
    try {
      const backendStudents = await backendApi.getStudents();
      if (backendStudents) {
        localStorage.setItem(STUDENTS_KEY, JSON.stringify(backendStudents));
        return backendStudents;
      }
    } catch (error) {
      // Continue with empty array
    }
  }
  
  return localStudents;
}

export async function getStudentsByClass(className: string): Promise<Student[]> {
  // INSTANT: Read from LocalStorage only (no backend check)
  const students = getStudentsFromStorage();
  return students.filter(s => s.className === className);
}

export async function createStudent(name: string, className: string, rollNumber?: string): Promise<Student> {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    throw new Error('Student name cannot be empty');
  }
  
  if (!className) {
    throw new Error('Class name is required');
  }
  
  const id = nanoid();
  const newStudent: Student = {
    id,
    name: trimmedName,
    rollNumber: rollNumber?.trim() || null,
    className,
  };
  
  // Get current students from LocalStorage
  const students = getStudentsFromStorage();
  
  // Check for duplicate student in the same class
  const normalizedName = trimmedName.toLowerCase();
  const duplicate = students.find(s => 
    s.name.toLowerCase() === normalizedName && 
    s.className === className
  );
  
  if (duplicate) {
    throw new Error(`Student "${trimmedName}" already exists in class "${className}"`);
  }
  
  // Check for duplicate roll number in the same class
  if (rollNumber) {
    const normalizedRoll = rollNumber.trim();
    const duplicateRoll = students.find(s => 
      s.rollNumber?.toLowerCase() === normalizedRoll.toLowerCase() && 
      s.className === className
    );
    
    if (duplicateRoll) {
      throw new Error(`Roll number "${rollNumber}" already exists in class "${className}"`);
    }
  }
  
  // INSTANT: Save to LocalStorage first
  students.push(newStudent);
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  
  // Background sync to backend
  (async () => {
    try {
      await backendApi.createStudent(id, trimmedName, className, rollNumber);
    } catch (error) {
      console.warn('⚠️ Backend create failed, data preserved in LocalStorage');
    }
  })();
  
  return newStudent;
}

export async function deleteStudent(studentId: string): Promise<boolean> {
  // INSTANT: Delete from LocalStorage first
  const students = getStudentsFromStorage();
  const updatedStudents = students.filter(s => s.id !== studentId);
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(updatedStudents));
  
  // Background sync to backend
  (async () => {
    try {
      await backendApi.deleteStudent(studentId);
    } catch (error) {
      console.warn('⚠️ Backend delete failed');
    }
  })();
  
  return true;
}

// ==================== Utils ====================

export function clearLocalStorageData(): void {
  localStorage.removeItem(CLASSES_KEY);
  localStorage.removeItem(STUDENTS_KEY);
  localStorage.removeItem(INITIALIZED_KEY);
  localStorage.removeItem('caliph_attendance_local');
  localStorage.removeItem('caliph_attendance_sync_queue');
  localStorage.removeItem('caliph_custom_reasons');
  localStorage.removeItem('caliph_objectives');
  localStorage.removeItem('caliph_objective_records');
  console.log('🗑️ All local storage data cleared');
}

export async function clearAllData(token?: string): Promise<void> {
  // Clear LocalStorage FIRST
  clearLocalStorageData();
  
  // Then clear backend if token is provided
  if (token) {
    try {
      if (await isBackendAvailable()) {
        await backendApi.clearAllData(token);
        console.log('🗑️ All backend data cleared');
      }
    } catch (error) {
      console.warn('⚠️ Backend clear failed:', error);
    }
  }
}

export async function clearAllAttendance(token?: string): Promise<void> {
  // Clear LocalStorage attendance
  localStorage.removeItem('caliph_attendance_local');
  localStorage.removeItem('caliph_attendance_sync_queue');
  console.log('🗑️ LocalStorage attendance cleared');
  
  // Then clear backend if token is provided
  if (token) {
    try {
      if (await isBackendAvailable()) {
        await backendApi.clearAllAttendance(token);
        console.log('🗑️ Backend attendance cleared');
      }
    } catch (error) {
      console.warn('⚠️ Backend attendance clear failed:', error);
    }
  }
}

