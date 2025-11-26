/**
 * Storage API - Uses Backend API
 * Connects to local Node.js backend for data persistence
 */

import { nanoid } from 'nanoid';
import type { Class, Student } from '@shared/schema';
import { DEFAULT_CLASSES } from './seedData';
import * as storageApi from './storageApi';

// Storage keys
const CLASSES_KEY = 'caliph_classes';
const STUDENTS_KEY = 'caliph_students';
const INITIALIZED_KEY = 'caliph_initialized';

// ==================== Classes ====================

export async function getClasses(): Promise<Class[]> {
  return await storageApi.getClasses();
}

export async function createClass(name: string): Promise<Class> {
  return await storageApi.createClass(name);
}

export async function deleteClass(classId: string): Promise<boolean> {
  return await storageApi.deleteClass(classId);
}

// ==================== Students ====================

export async function getStudents(): Promise<Student[]> {
  return await storageApi.getStudents();
}

export async function getStudentsByClass(className: string): Promise<Student[]> {
  return await storageApi.getStudentsByClass(className);
}

export async function createStudent(name: string, className: string, rollNumber?: string): Promise<Student> {
  return await storageApi.createStudent(name, className, rollNumber);
}

export async function deleteStudent(studentId: string): Promise<boolean> {
  return await storageApi.deleteStudent(studentId);
}

// ==================== Utils ====================

export function clearAllData(): void {
  storageApi.clearAllData();
}

export async function removeDuplicateStudents(): Promise<number> {
  const students = await getStudents();
  const seen = new Map<string, Student>();
  const uniqueStudents: Student[] = [];
  let duplicateCount = 0;
  
  students.forEach(student => {
    // Create a unique key based on name + className
    const key = `${student.name.toLowerCase()}_${student.className}`.trim();
    
    if (!seen.has(key)) {
      // Keep the first occurrence
      seen.set(key, student);
      uniqueStudents.push(student);
    } else {
      // Found a duplicate
      duplicateCount++;
      console.log(`🗑️ Removing duplicate: ${student.name} (${student.className})`);
    }
  });
  
  if (duplicateCount > 0) {
    // Note: This updates LocalStorage directly, which is fine for duplicates
    localStorage.setItem('caliph_students', JSON.stringify(uniqueStudents));
    console.log(`✅ Removed ${duplicateCount} duplicate student(s)`);
  } else {
    console.log('✅ No duplicate students found');
  }
  
  return duplicateCount;
}

// ==================== Seed Data Initialization ====================

/**
 * Initialize app with default classes and students on first run
 * This runs automatically when the app first loads
 * Only initializes if no classes/students exist (won't overwrite existing data)
 */
export async function initializeSeedData(): Promise<void> {
  // Check if already initialized
  const isInitialized = localStorage.getItem(INITIALIZED_KEY);
  
  if (isInitialized === 'true') {
    console.log('✅ App already initialized with seed data');
    return;
  }
  
  // Check if there are existing classes (might have been loaded from Firebase)
  const existingClasses = await getClasses();
  if (existingClasses.length > 0) {
    console.log(`✅ Found ${existingClasses.length} existing class(es) - skipping seed data initialization`);
    // Mark as initialized so we don't run this again
    localStorage.setItem(INITIALIZED_KEY, 'true');
    return;
  }
  
  console.log('🌱 First time loading - initializing with default data...');
  
  let totalClasses = 0;
  let totalStudents = 0;
  
  // Load each class and its students
  for (const seedClass of DEFAULT_CLASSES) {
    try {
      // Create the class
      const newClass = await createClass(seedClass.name);
      totalClasses++;
      console.log(`✅ Created class: ${newClass.name}`);
      
      // Add all students to this class
      for (const seedStudent of seedClass.students) {
        try {
          await createStudent(
            seedStudent.name,
            newClass.name,
            seedStudent.rollNumber
          );
          totalStudents++;
        } catch (error) {
          console.warn(`⚠️ Could not add student ${seedStudent.name}:`, error);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not create class ${seedClass.name}:`, error);
    }
  }
  
  // Mark as initialized
  localStorage.setItem(INITIALIZED_KEY, 'true');
  
  console.log(`🎉 Initialization complete! Created ${totalClasses} classes with ${totalStudents} students`);
}

/**
 * Reset initialization (for testing or re-deploying with new data)
 * Call this to allow seed data to be loaded again
 */
export function resetInitialization(): void {
  localStorage.removeItem(INITIALIZED_KEY);
  console.log('🔄 Initialization reset - app will reload seed data on next refresh');
}




