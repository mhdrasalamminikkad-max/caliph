/**
 * Backend API Client
 * Simple API client for the local Node.js backend
 */

// Get API base URL from environment or use current origin (works on Replit and localhost)
const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
const BASE_URL = `${API_BASE_URL}/api`;

// Types
export interface Class {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Student {
  id: string;
  name: string;
  rollNumber?: string | null;
  className: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  prayer: string;
  date: string;
  status: "present" | "absent";
  reason?: string | null;
  timestamp?: string;
  updatedAt?: string;
}

// Helper function to fetch from API
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`❌ API Error (${endpoint}):`, error);
    throw error;
  }
}

// ==================== CLASSES ====================

export async function getClasses(): Promise<Class[]> {
  return apiFetch<Class[]>('/api/classes');
}

export async function createClass(id: string, name: string): Promise<Class> {
  return apiFetch<Class>('/api/classes', {
    method: 'POST',
    body: JSON.stringify({ id, name }),
  });
}

export async function deleteClass(id: string): Promise<void> {
  await apiFetch('/api/classes/' + id, {
    method: 'DELETE',
  });
}

// ==================== STUDENTS ====================

export async function getStudents(): Promise<Student[]> {
  return apiFetch<Student[]>('/api/students');
}

export async function getStudentsByClass(className: string): Promise<Student[]> {
  return apiFetch<Student[]>(`/api/students/class/${encodeURIComponent(className)}`);
}

export async function createStudent(id: string, name: string, className: string, rollNumber?: string): Promise<Student> {
  return apiFetch<Student>('/api/students', {
    method: 'POST',
    body: JSON.stringify({ id, name, className, rollNumber }),
  });
}

export async function deleteStudent(id: string): Promise<void> {
  await apiFetch('/api/students/' + id, {
    method: 'DELETE',
  });
}

// ==================== ATTENDANCE ====================

export async function getAttendance(filters?: {
  date?: string;
  className?: string;
  prayer?: string;
  studentId?: string;
}): Promise<AttendanceRecord[]> {
  const params = new URLSearchParams();
  if (filters?.date) params.append('date', filters.date);
  if (filters?.className) params.append('className', filters.className);
  if (filters?.prayer) params.append('prayer', filters.prayer);
  if (filters?.studentId) params.append('studentId', filters.studentId);

  const query = params.toString();
  return apiFetch<AttendanceRecord[]>(`/api/attendance${query ? '?' + query : ''}`);
}

export async function saveAttendance(record: AttendanceRecord): Promise<AttendanceRecord> {
  return apiFetch<AttendanceRecord>('/api/attendance', {
    method: 'POST',
    body: JSON.stringify(record),
  });
}

export async function deleteAttendance(id: string): Promise<void> {
  await apiFetch('/api/attendance/' + id, {
    method: 'DELETE',
  });
}

// ==================== SUMMARY ====================

export async function getSummary(filters?: {
  date?: string;
  className?: string;
}): Promise<Record<string, Record<string, AttendanceRecord[]>>> {
  const params = new URLSearchParams();
  if (filters?.date) params.append('date', filters.date);
  if (filters?.className) params.append('className', filters.className);

  const query = params.toString();
  return apiFetch<Record<string, Record<string, AttendanceRecord[]>>>(`/api/summary${query ? '?' + query : ''}`);
}


