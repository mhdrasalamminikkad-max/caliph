/**
 * Seed Data - Default classes and students
 * Edit this file to customize the initial data for your deployment
 */

export interface SeedClass {
  name: string;
  students: Array<{
    name: string;
    rollNumber?: string;
  }>;
}

/**
 * DEFAULT DATA - EDIT THIS TO CUSTOMIZE FOR YOUR SCHOOL
 * 
 * Add your actual class names and student lists here.
 * When a teacher first opens the app, this data will be loaded automatically.
 */
export const DEFAULT_CLASSES: SeedClass[] = [
  // Empty - classes and students are managed through the app interface
  // Data will sync automatically via Firestore across all devices
];

/**
 * You can also add more classes below:
 * 
 * Example:
 * {
 *   name: "Class 3A",
 *   students: [
 *     { name: "Student Name 1", rollNumber: "1" },
 *     { name: "Student Name 2", rollNumber: "2" },
 *     // ... add more students
 *   ]
 * },
 */


