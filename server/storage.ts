import { type Student, type InsertStudent, type Attendance, type InsertAttendance, type Class, type InsertClass } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { broadcastAttendanceUpdate, broadcastAttendanceDelete, broadcastClassUpdate, broadcastClassDelete, broadcastStudentUpdate, broadcastStudentDelete } from './websocket';

const DATA_FILE = path.join(process.cwd(), "data", "attendance_data.json");

interface StorageData {
  classes: Record<string, Class>;
  students: Record<string, Student>;
  attendance: Record<string, Attendance>;
}

export interface IStorage {
  // Class methods
  getClasses(): Promise<Class[]>;
  getClass(id: string): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  deleteClass(id: string): Promise<boolean>;
  
  // Student methods
  getStudent(id: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  getStudentsByClass(className: string): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  deleteStudent(id: string): Promise<boolean>;
  
  // Attendance methods
  getAttendance(date: string, prayer: string, className: string): Promise<Attendance[]>;
  getAttendanceByDateRange(startDate: string, endDate: string): Promise<Attendance[]>;
  markAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getStudentAttendance(studentId: string): Promise<Attendance[]>;
}

export class MemStorage implements IStorage {
  private classes: Map<string, Class>;
  private students: Map<string, Student>;
  private attendance: Map<string, Attendance>;

  constructor() {
    this.classes = new Map();
    this.students = new Map();
    this.attendance = new Map();
    this.loadData();
  }

  private loadData() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`Created data directory: ${dataDir}`);
      }

      // Load data if file exists
      if (fs.existsSync(DATA_FILE)) {
        const rawData = fs.readFileSync(DATA_FILE, "utf-8");
        
        // Validate JSON before parsing
        if (!rawData || rawData.trim() === '') {
          console.warn("Data file is empty, initializing with empty data");
          this.initializeEmptyData();
          return;
        }
        
        const data: StorageData = JSON.parse(rawData);
        
        // Convert objects back to Maps with validation
        this.classes = new Map(Object.entries(data.classes || {}));
        this.students = new Map(Object.entries(data.students || {}));
        
        // Convert timestamp strings back to Date objects
        const attendanceEntries = Object.entries(data.attendance || {}).map(([id, att]) => [
          id,
          { ...att, timestamp: att.timestamp ? new Date(att.timestamp) : new Date() }
        ]);
        this.attendance = new Map(attendanceEntries as [string, Attendance][]);
        
        console.log(`✅ Loaded ${this.classes.size} classes, ${this.students.size} students, ${this.attendance.size} attendance records`);
      } else {
        console.log("No data file found, starting with empty data");
        this.initializeEmptyData();
      }
    } catch (error) {
      console.error("❌ Error loading data:", error);
      console.log("Initializing with empty data due to error");
      this.initializeEmptyData();
    }
  }

  private initializeEmptyData() {
    this.classes = new Map();
    this.students = new Map();
    this.attendance = new Map();
    // Save empty structure
    this.saveData();
  }

  private saveData() {
    try {
      // Ensure directory exists before saving
      const dataDir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const data: StorageData = {
        classes: Object.fromEntries(this.classes),
        students: Object.fromEntries(this.students),
        attendance: Object.fromEntries(this.attendance),
      };
      
      // Write to temporary file first, then rename (atomic operation)
      const tempFile = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
      
      // Create backup of existing file
      if (fs.existsSync(DATA_FILE)) {
        fs.copyFileSync(DATA_FILE, `${DATA_FILE}.backup`);
      }
      
      // Rename temp file to actual file (atomic)
      fs.renameSync(tempFile, DATA_FILE);
      
      console.log(`✅ Data saved successfully`);
    } catch (error) {
      console.error("❌ Error saving data:", error);
      
      // Try to restore from backup if save failed
      const backupFile = `${DATA_FILE}.backup`;
      if (fs.existsSync(backupFile)) {
        try {
          fs.copyFileSync(backupFile, DATA_FILE);
          console.log("✅ Restored data from backup");
        } catch (restoreError) {
          console.error("❌ Failed to restore backup:", restoreError);
        }
      }
    }
  }

  // Class methods
  async getClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }

  async getClass(id: string): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async createClass(classData: InsertClass): Promise<Class> {
    // Check if class name already exists
    const existingClass = Array.from(this.classes.values()).find(
      (c) => c.name.toLowerCase() === classData.name.toLowerCase()
    );
    
    if (existingClass) {
      throw new Error("Class name already exists");
    }

    const id = randomUUID();
    const newClass: Class = {
      ...classData,
      id,
      createdAt: new Date(),
    };
    this.classes.set(id, newClass);
    this.saveData();
    broadcastClassUpdate(newClass);
    return newClass;
  }

  async deleteClass(id: string): Promise<boolean> {
    const classToDelete = this.classes.get(id);
    if (!classToDelete) return false;

    // CASCADE DELETE: Also delete all students in this class
    const studentsInClass = Array.from(this.students.entries()).filter(
      ([_, student]) => student.className === classToDelete.name
    );

    // Delete all students in this class
    studentsInClass.forEach(([studentId, _]) => {
      this.students.delete(studentId);
    });

    // Also delete all attendance records for this class
    const attendanceInClass = Array.from(this.attendance.entries()).filter(
      ([_, att]) => att.className === classToDelete.name
    );

    attendanceInClass.forEach(([attId, _]) => {
      this.attendance.delete(attId);
    });

    // Delete the class itself
    const deleted = this.classes.delete(id);
    if (deleted) {
      console.log(`✅ Deleted class "${classToDelete.name}" with ${studentsInClass.length} students and ${attendanceInClass.length} attendance records`);
      this.saveData();
      broadcastClassDelete(id);
      // Broadcast student deletions
      studentsInClass.forEach(([studentId]) => broadcastStudentDelete(studentId));
      // Broadcast attendance deletions
      attendanceInClass.forEach(([attId]) => broadcastAttendanceDelete(attId));
    }
    return deleted;
  }

  // Student methods
  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentsByClass(className: string): Promise<Student[]> {
    return Array.from(this.students.values()).filter(
      (student) => student.className === className,
    );
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student: Student = { 
      ...insertStudent, 
      id,
      rollNumber: insertStudent.rollNumber ?? null 
    };
    this.students.set(id, student);
    this.saveData();
    broadcastStudentUpdate(student);
    return student;
  }

  async deleteStudent(id: string): Promise<boolean> {
    const student = this.students.get(id);
    if (!student) return false;

    // CASCADE DELETE: Also delete all attendance records for this student
    const attendanceForStudent = Array.from(this.attendance.entries()).filter(
      ([_, att]) => att.studentId === id
    );

    attendanceForStudent.forEach(([attId, _]) => {
      this.attendance.delete(attId);
    });

    // Delete the student
    const deleted = this.students.delete(id);
    if (deleted) {
      console.log(`✅ Deleted student "${student.name}" with ${attendanceForStudent.length} attendance records`);
      this.saveData();
      broadcastStudentDelete(id);
      // Broadcast attendance deletions
      attendanceForStudent.forEach(([attId]) => broadcastAttendanceDelete(attId));
    }
    return deleted;
  }

  // Attendance methods
  async getAttendance(date: string, prayer: string, className: string): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(
      (att) => att.date === date && att.prayer === prayer && att.className === className,
    );
  }

  async markAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    // Check if attendance already exists for this student, date, and prayer
    const existing = Array.from(this.attendance.entries()).find(
      ([_, att]) =>
        att.studentId === insertAttendance.studentId &&
        att.date === insertAttendance.date &&
        att.prayer === insertAttendance.prayer
    );

    let id: string;
    let attendance: Attendance;

    if (existing) {
      // Update existing record
      id = existing[0];
      attendance = {
        ...existing[1],
        ...insertAttendance,
        id,
        reason: insertAttendance.reason ?? null,
        timestamp: new Date(),
      };
    } else {
      // Create new record
      id = randomUUID();
      attendance = {
      ...insertAttendance,
      id,
        reason: insertAttendance.reason ?? null,
      timestamp: new Date(),
    };
    }

    this.attendance.set(id, attendance);
    this.saveData();
    broadcastAttendanceUpdate(attendance);
    return attendance;
  }

  async getStudentAttendance(studentId: string): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(
      (att) => att.studentId === studentId,
    );
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getAttendanceByDateRange(startDate: string, endDate: string): Promise<Attendance[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return Array.from(this.attendance.values()).filter(att => {
      const attDate = new Date(att.date);
      return attDate >= start && attDate <= end;
    });
  }
}

export const storage = new MemStorage();
