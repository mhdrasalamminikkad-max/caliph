/**
 * Objectives API - Track custom objectives like cap wearing, nail cutting, etc.
 */

import { nanoid } from 'nanoid';

// Storage keys
const OBJECTIVES_KEY = 'caliph_objectives';
const OBJECTIVE_RECORDS_KEY = 'caliph_objective_records';

// Types
export interface Objective {
  id: string;
  name: string;
  description: string;
  icon: string;
  createdAt: Date;
}

export interface ObjectiveRecord {
  id: string;
  objectiveId: string;
  objectiveName: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  status: "yes" | "no"; // yes = followed/completed, no = not followed
  notes?: string;
  timestamp: string;
}

// ==================== Objectives Management ====================

export function getObjectives(): Objective[] {
  try {
    const stored = localStorage.getItem(OBJECTIVES_KEY);
    return stored ? JSON.parse(stored) : getDefaultObjectives();
  } catch (error) {
    console.error('Error loading objectives:', error);
    return getDefaultObjectives();
  }
}

function getDefaultObjectives(): Objective[] {
  const defaults: Objective[] = [
    {
      id: 'cap-wearing',
      name: 'Cap/Topi Wearing',
      description: 'Student wearing Islamic cap',
      icon: 'checkroom',
      createdAt: new Date()
    },
    {
      id: 'nails-cut',
      name: 'Nails Cut',
      description: 'Nails properly trimmed',
      icon: 'cut',
      createdAt: new Date()
    },
    {
      id: 'uniform-proper',
      name: 'Proper Uniform',
      description: 'Wearing complete uniform',
      icon: 'school',
      createdAt: new Date()
    },
    {
      id: 'cleanliness',
      name: 'Cleanliness',
      description: 'Clean and tidy appearance',
      icon: 'clean_hands',
      createdAt: new Date()
    }
  ];
  
  // Save defaults if nothing exists
  localStorage.setItem(OBJECTIVES_KEY, JSON.stringify(defaults));
  return defaults;
}

export function createObjective(name: string, description: string, icon: string = 'check_circle'): Objective {
  const objectives = getObjectives();
  
  // Check for duplicate
  if (objectives.some(o => o.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('Objective already exists');
  }
  
  const newObjective: Objective = {
    id: nanoid(),
    name: name.trim(),
    description: description.trim(),
    icon,
    createdAt: new Date()
  };
  
  objectives.push(newObjective);
  localStorage.setItem(OBJECTIVES_KEY, JSON.stringify(objectives));
  
  console.log('✅ Objective created:', newObjective.name);
  return newObjective;
}

export function deleteObjective(objectiveId: string): boolean {
  const objectives = getObjectives();
  const updatedObjectives = objectives.filter(o => o.id !== objectiveId);
  
  if (updatedObjectives.length === objectives.length) {
    return false; // Not found
  }
  
  localStorage.setItem(OBJECTIVES_KEY, JSON.stringify(updatedObjectives));
  console.log('✅ Objective deleted');
  return true;
}

// ==================== Objective Records ====================

export function getObjectiveRecords(): ObjectiveRecord[] {
  try {
    const stored = localStorage.getItem(OBJECTIVE_RECORDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading objective records:', error);
    return [];
  }
}

export function saveObjectiveRecord(record: ObjectiveRecord): void {
  const records = getObjectiveRecords();
  
  // Check if record already exists for this student-objective-date
  const existingIndex = records.findIndex(
    r => r.studentId === record.studentId && 
         r.objectiveId === record.objectiveId && 
         r.date === record.date
  );
  
  if (existingIndex >= 0) {
    // Update existing record
    records[existingIndex] = { ...record, timestamp: new Date().toISOString() };
  } else {
    // Add new record
    records.push({ ...record, timestamp: new Date().toISOString() });
  }
  
  localStorage.setItem(OBJECTIVE_RECORDS_KEY, JSON.stringify(records));
}

export function saveObjectiveBatch(records: ObjectiveRecord[]): void {
  const existingRecords = getObjectiveRecords();
  const timestamp = new Date().toISOString();
  
  // Create a map for faster lookup
  const recordMap = new Map(
    existingRecords.map(r => [
      `${r.studentId}-${r.objectiveId}-${r.date}`,
      r
    ])
  );
  
  // Update or add all records
  records.forEach(record => {
    const key = `${record.studentId}-${record.objectiveId}-${record.date}`;
    recordMap.set(key, { ...record, timestamp });
  });
  
  // Save all records
  const allRecords = Array.from(recordMap.values());
  localStorage.setItem(OBJECTIVE_RECORDS_KEY, JSON.stringify(allRecords));
  
  console.log(`✅ Saved ${records.length} objective records`);
}

export function getObjectiveRecordsByDate(date: string): ObjectiveRecord[] {
  const records = getObjectiveRecords();
  return records.filter(r => r.date === date);
}

export function getObjectiveRecordsByClass(className: string, date?: string): ObjectiveRecord[] {
  const records = getObjectiveRecords();
  return records.filter(r => {
    const matchClass = r.className === className;
    const matchDate = date ? r.date === date : true;
    return matchClass && matchDate;
  });
}

export function getObjectiveRecordsByStudent(studentId: string): ObjectiveRecord[] {
  const records = getObjectiveRecords();
  return records.filter(r => r.studentId === studentId);
}

// ==================== Statistics ====================

export function getObjectiveStats(objectiveId: string, startDate?: string, endDate?: string): {
  total: number;
  yes: number;
  no: number;
  percentage: number;
} {
  const records = getObjectiveRecords();
  
  const filtered = records.filter(r => {
    const matchObjective = r.objectiveId === objectiveId;
    const matchStart = startDate ? r.date >= startDate : true;
    const matchEnd = endDate ? r.date <= endDate : true;
    return matchObjective && matchStart && matchEnd;
  });
  
  const yes = filtered.filter(r => r.status === 'yes').length;
  const no = filtered.filter(r => r.status === 'no').length;
  const total = filtered.length;
  const percentage = total > 0 ? Math.round((yes / total) * 100) : 0;
  
  return { total, yes, no, percentage };
}

export function getStudentObjectiveStats(studentId: string, startDate?: string, endDate?: string): {
  total: number;
  yes: number;
  no: number;
  percentage: number;
} {
  const records = getObjectiveRecords();
  
  const filtered = records.filter(r => {
    const matchStudent = r.studentId === studentId;
    const matchStart = startDate ? r.date >= startDate : true;
    const matchEnd = endDate ? r.date <= endDate : true;
    return matchStudent && matchStart && matchEnd;
  });
  
  const yes = filtered.filter(r => r.status === 'yes').length;
  const no = filtered.filter(r => r.status === 'no').length;
  const total = filtered.length;
  const percentage = total > 0 ? Math.round((yes / total) * 100) : 0;
  
  return { total, yes, no, percentage };
}

// ==================== Clear Data ====================

export function clearObjectiveData(): void {
  localStorage.removeItem(OBJECTIVES_KEY);
  localStorage.removeItem(OBJECTIVE_RECORDS_KEY);
  console.log('🗑️ Objective data cleared');
}








