import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClassSchema, insertStudentSchema, insertAttendanceSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Class routes
  app.get("/api/classes", async (_req, res) => {
    try {
      const classes = await storage.getClasses();
      res.json(classes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/classes", async (req, res) => {
    try {
      const classData = insertClassSchema.parse(req.body);
      const newClass = await storage.createClass(classData);
      res.status(201).json(newClass);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/classes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteClass(id);
      if (!deleted) {
        return res.status(404).json({ message: "Class not found" });
      }
      res.json({ message: "Class deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Student routes
  app.get("/api/students/class/:className", async (req, res) => {
    try {
      const { className } = req.params;
      const students = await storage.getStudentsByClass(className);
      res.json(students);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      const newStudent = await storage.createStudent(studentData);
      res.status(201).json(newStudent);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteStudent(id);
      if (!deleted) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json({ message: "Student deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Attendance routes
  app.get("/api/attendance", async (req, res) => {
    try {
      const { date, prayer, className } = req.query;
      if (!date || !prayer || !className) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      const attendance = await storage.getAttendance(
        date as string,
        prayer as string,
        className as string
      );
      res.json(attendance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      const newAttendance = await storage.markAttendance(attendanceData);
      res.status(201).json(newAttendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get attendance by date range
  app.get("/api/attendance/range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      const attendance = await storage.getAttendanceByDateRange(
        startDate as string,
        endDate as string
      );
      res.json(attendance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all students
  app.get("/api/students", async (_req, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get student attendance by ID
  app.get("/api/students/:id/attendance", async (req, res) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      
      let attendance;
      if (startDate && endDate) {
        const allAttendance = await storage.getAttendanceByDateRange(
          startDate as string,
          endDate as string
        );
        attendance = allAttendance.filter(att => att.studentId === id);
      } else {
        attendance = await storage.getStudentAttendance(id);
      }
      
      res.json(attendance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
