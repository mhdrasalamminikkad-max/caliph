import { type Student, type InsertStudent, type Attendance, type InsertAttendance, type Class, type InsertClass, type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { broadcastAttendanceUpdate, broadcastAttendanceDelete, broadcastClassUpdate, broadcastClassDelete, broadcastStudentUpdate, broadcastStudentDelete } from './websocket';

const DATA_FILE = path.join(process.cwd(), "data", "attendance_data.json");

interface StorageData {
  classes: Record<string, Class>;
  students: Record<string, Student>;
  attendance: Record<string, Attendance>;
  users: Record<string, User>;
}

export interface IStorage {
  // Class methods
  getClasses(): Promise<Class[]>;
  getClass(id: string): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  deleteClass(id: string): Promise<boolean>;
  clearAllClasses(): Promise<number>;
  
  // Student methods
  getStudent(id: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  getStudentsByClass(className: string): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, data: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;
  clearAllStudents(): Promise<number>;
  
  // Attendance methods
  getAttendance(date: string, prayer: string, className: string): Promise<Attendance[]>;
  getAllAttendance(): Promise<Attendance[]>;
  getAttendanceByDateRange(startDate: string, endDate: string): Promise<Attendance[]>;
  markAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getStudentAttendance(studentId: string): Promise<Attendance[]>;
  updateAttendance(id: string, data: Partial<InsertAttendance>): Promise<Attendance | undefined>;
  deleteAttendance(id: string): Promise<boolean>;
  clearAllAttendance(): Promise<number>;
  
  // Clear all data
  clearAllData(): Promise<{ classesCleared: number; studentsCleared: number; attendanceCleared: number }>;
  
  // User methods
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(username: string, password: string): Promise<User | null>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private classes: Map<string, Class>;
  private students: Map<string, Student>;
  private attendance: Map<string, Attendance>;
  private users: Map<string, User>;

  constructor() {
    this.classes = new Map();
    this.students = new Map();
    this.attendance = new Map();
    this.users = new Map();
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
        this.users = new Map(Object.entries(data.users || {}));
        
        // Convert timestamp strings back to Date objects
        const attendanceEntries = Object.entries(data.attendance || {}).map(([id, att]) => [
          id,
          { ...att, timestamp: att.timestamp ? new Date(att.timestamp) : new Date() }
        ]);
        this.attendance = new Map(attendanceEntries as [string, Attendance][]);
        
        const userEntries = Object.entries(data.users || {}).map(([id, user]) => [
          id,
          { ...user, createdAt: user.createdAt ? new Date(user.createdAt) : new Date() }
        ]);
        this.users = new Map(userEntries as [string, User][]);
        
        console.log(`✅ Loaded ${this.classes.size} classes, ${this.students.size} students, ${this.attendance.size} attendance records, ${this.users.size} users`);
      } else {
        console.log("No data file found, starting with empty data");
        this.initializeEmptyData();
      }
      
      // Create default admin user if no users exist
      this.ensureDefaultAdmin();
    } catch (error) {
      console.error("❌ Error loading data:", error);
      console.log("Initializing with empty data due to error");
      this.initializeEmptyData();
    }
  }

  private async ensureDefaultAdmin() {
    if (this.users.size === 0) {
      console.log("📝 Creating default user...");
      const hashedPassword = await bcrypt.hash("caliph786", 10);
      const id = randomUUID();
      const admin: User = {
        id,
        username: "user",
        password: hashedPassword,
        role: "admin",
        createdAt: new Date(),
      };
      this.users.set(id, admin);
      this.saveData();
      console.log("✅ Default user created (username: user, password: caliph786)");
    }
  }

  private initializeEmptyData() {
    this.classes = new Map();
    this.students = new Map();
    this.attendance = new Map();
    this.users = new Map();
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
        users: Object.fromEntries(this.users),
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

  async getAllAttendance(): Promise<Attendance[]> {
    return Array.from(this.attendance.values());
  }

  async getAttendanceByDateRange(startDate: string, endDate: string): Promise<Attendance[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return Array.from(this.attendance.values()).filter(att => {
      const attDate = new Date(att.date);
      return attDate >= start && attDate <= end;
    });
  }

  async updateStudent(id: string, data: Partial<InsertStudent>): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;

    const updatedStudent: Student = {
      ...student,
      ...data,
    };

    this.students.set(id, updatedStudent);
    this.saveData();
    broadcastStudentUpdate(updatedStudent);
    return updatedStudent;
  }

  async updateAttendance(id: string, data: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const attendance = this.attendance.get(id);
    if (!attendance) return undefined;

    const updatedAttendance: Attendance = {
      ...attendance,
      ...data,
      id,
      timestamp: new Date(),
    };

    this.attendance.set(id, updatedAttendance);
    this.saveData();
    broadcastAttendanceUpdate(updatedAttendance);
    return updatedAttendance;
  }

  async deleteAttendance(id: string): Promise<boolean> {
    const deleted = this.attendance.delete(id);
    if (deleted) {
      this.saveData();
      broadcastAttendanceDelete(id);
    }
    return deleted;
  }

  async clearAllAttendance(): Promise<number> {
    const count = this.attendance.size;
    this.attendance.clear();
    this.saveData();
    console.log(`✅ Cleared ${count} attendance records`);
    return count;
  }

  async clearAllClasses(): Promise<number> {
    const count = this.classes.size;
    // Also clear students and attendance since they depend on classes
    const studentCount = this.students.size;
    const attendanceCount = this.attendance.size;
    
    this.classes.clear();
    this.students.clear();
    this.attendance.clear();
    this.saveData();
    
    console.log(`✅ Cleared ${count} classes, ${studentCount} students, ${attendanceCount} attendance records`);
    return count;
  }

  async clearAllStudents(): Promise<number> {
    const count = this.students.size;
    // Also clear attendance since it depends on students
    const attendanceCount = this.attendance.size;
    
    this.students.clear();
    this.attendance.clear();
    this.saveData();
    
    console.log(`✅ Cleared ${count} students and ${attendanceCount} attendance records`);
    return count;
  }

  async clearAllData(): Promise<{ classesCleared: number; studentsCleared: number; attendanceCleared: number }> {
    const classesCleared = this.classes.size;
    const studentsCleared = this.students.size;
    const attendanceCleared = this.attendance.size;
    
    this.classes.clear();
    this.students.clear();
    this.attendance.clear();
    this.saveData();
    
    console.log(`✅ Cleared all data: ${classesCleared} classes, ${studentsCleared} students, ${attendanceCleared} attendance records`);
    return { classesCleared, studentsCleared, attendanceCleared };
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const existing = await this.getUserByUsername(insertUser.username);
    if (existing) {
      throw new Error("Username already exists");
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);

    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      role: insertUser.role || "teacher",
      createdAt: new Date(),
    };

    this.users.set(id, user);
    this.saveData();
    return user;
  }

  async verifyPassword(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      role,
    };

    this.users.set(id, updatedUser);
    this.saveData();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const deleted = this.users.delete(id);
    if (deleted) {
      this.saveData();
    }
    return deleted;
  }
}

export const storage = new MemStorage();
