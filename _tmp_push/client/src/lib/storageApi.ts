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
  try {
    if (await isBackendAvailable()) {
      return await backendApi.getClasses();
    }
  } catch (error) {
    console.warn('⚠️ Backend unavailable, using LocalStorage fallback');
  }
  
  // Fallback to LocalStorage
  return getClassesFromStorage();
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
    updatedAt: new Date().toISOString(),
  };
  
  try {
    if (await isBackendAvailable()) {
      return await backendApi.createClass(id, trimmedName);
    }
  } catch (error) {
    console.warn('⚠️ Backend unavailable, using LocalStorage fallback');
  }
  
  // Fallback to LocalStorage
  const classes = getClassesFromStorage();
  
  // Check for duplicate
  if (classes.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
    throw new Error(`Class name "${trimmedName}" already exists`);
  }
  
  classes.push(newClass);
  localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
  
  return newClass;
}

export async function deleteClass(classId: string): Promise<boolean> {
  try {
    if (await isBackendAvailable()) {
      await backendApi.deleteClass(classId);
      return true;
    }
  } catch (error) {
    console.warn('⚠️ Backend unavailable, using LocalStorage fallback');
  }
  
  // Fallback to LocalStorage
  const classes = getClassesFromStorage();
  const classToDelete = classes.find(c => c.id === classId);
  const updatedClasses = classes.filter(c => c.id !== classId);
  localStorage.setItem(CLASSES_KEY, JSON.stringify(updatedClasses));
  
  // Also delete students in this class
  if (classToDelete) {
    const students = getStudentsFromStorage();
    const updatedStudents = students.filter(s => s.className !== classToDelete.name);
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(updatedStudents));
  }
  
  return true;
}

// ==================== Students ====================

export async function getStudents(): Promise<Student[]> {
  try {
    if (await isBackendAvailable()) {
      return await backendApi.getStudents();
    }
  } catch (error) {
    console.warn('⚠️ Backend unavailable, using LocalStorage fallback');
  }
  
  // Fallback to LocalStorage
  return getStudentsFromStorage();
}

export async function getStudentsByClass(className: string): Promise<Student[]> {
  try {
    if (await isBackendAvailable()) {
      return await backendApi.getStudentsByClass(className);
    }
  } catch (error) {
    console.warn('⚠️ Backend unavailable, using LocalStorage fallback');
  }
  
  // Fallback to LocalStorage
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
  
  try {
    if (await isBackendAvailable()) {
      return await backendApi.createStudent(id, trimmedName, className, rollNumber);
    }
  } catch (error) {
    console.warn('⚠️ Backend unavailable, using LocalStorage fallback');
  }
  
  // Fallback to LocalStorage
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
  
  students.push(newStudent);
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  
  return newStudent;
}

export async function deleteStudent(studentId: string): Promise<boolean> {
  try {
    if (await isBackendAvailable()) {
      await backendApi.deleteStudent(studentId);
      return true;
    }
  } catch (error) {
    console.warn('⚠️ Backend unavailable, using LocalStorage fallback');
  }
  
  // Fallback to LocalStorage
  const students = getStudentsFromStorage();
  const updatedStudents = students.filter(s => s.id !== studentId);
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(updatedStudents));
  
  return true;
}

// ==================== Utils ====================

export function clearAllData(): void {
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

