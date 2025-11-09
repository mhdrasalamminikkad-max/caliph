import { useState, useEffect } from "react";
import { Prayer, type Student } from "@shared/schema";
import StudentRow from "./StudentRow";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { saveAttendanceBatch, getSyncStatus } from "@/lib/hybridStorage";
import { getStudentsByClass, createStudent, deleteStudent } from "@/lib/offlineApi";
import BulkStudentImport from "./BulkStudentImport";

interface AttendanceListProps {
  prayer: Prayer;
  className: string;
  onBack: () => void;
}

export default function AttendanceList({ prayer, className, onBack }: AttendanceListProps) {
  const [attendance, setAttendance] = useState<Record<string, { status: "present" | "absent"; reason?: string }>>({});
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentRollNumber, setNewStudentRollNumber] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [absentRollNumbers, setAbsentRollNumbers] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date().toLocaleDateString("en-US", { 
    weekday: "long", 
    month: "short", 
    day: "numeric" 
  });

  const dateForApi = new Date().toISOString().split('T')[0];

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["students", className],
    queryFn: async () => {
      console.log(`📚 Fetching students for class: "${className}"`);
      // TODO: Replace with backend API call when implementing new backend
      // const { fetchStudentsFromFirestore } = await import("@/lib/firebaseSync");
      // await fetchStudentsFromFirestore();
      const { getStudentsByClass } = await import("@/lib/offlineApi");
      const studentsList = await getStudentsByClass(className);
      console.log(`📚 Found ${studentsList.length} student(s) for class "${className}":`, studentsList.map(s => s.name).join(', '));
      return studentsList;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data - INSTANT SYNC
  });

  // Automatically mark all students as present when they load
  useEffect(() => {
    if (students.length > 0) {
      setAttendance(prev => {
        const initialAttendance = { ...prev };
        students.forEach(student => {
          // Only set if not already set (to avoid overwriting manual changes)
          if (!initialAttendance[student.id]) {
            initialAttendance[student.id] = { status: "present" };
          }
        });
        return initialAttendance;
      });
    }
  }, [students]);

  const createStudentMutation = useMutation({
    mutationFn: async ({ name, rollNumber }: { name: string; rollNumber?: string }) => {
      const newStudent = createStudent(name, className, rollNumber);
      // TODO: Replace with backend API call when implementing new backend
      // const { syncStudentsToFirestore } = await import("@/lib/firebaseSync");
      // await syncStudentsToFirestore();
      return newStudent;
    },
    onSuccess: async () => {
      // Get fresh students from backend/LocalStorage (includes the newly created one)
      const { getStudentsByClass } = await import("@/lib/offlineApi");
      const currentStudents = await getStudentsByClass(className);
      
      // CRITICAL: Directly update the query cache with fresh data
      // This ensures the UI shows the new student IMMEDIATELY without waiting for refetch
      queryClient.setQueryData(["students", className], currentStudents);
      
      // Invalidate queries to trigger refetch
      await queryClient.invalidateQueries({ queryKey: ["students", className] });
      await queryClient.invalidateQueries({ queryKey: ["class-students"] });
      
      setNewStudentName("");
      setNewStudentRollNumber("");
      setDialogOpen(false);
      toast({
        title: "✅ Success",
        description: "Student added! It will sync to other devices automatically.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      console.log(`🔄 Deleting student with ID: ${studentId}`);
      
      // Get student name before deletion for logging
      const { getStudentsByClass } = await import("@/lib/offlineApi");
      const students = await getStudentsByClass(className);
      const studentToDelete = students.find(s => s.id === studentId);
      const studentName = studentToDelete?.name || "Unknown";
      
      // Delete locally first
      const deleted = deleteStudent(studentId);
      if (!deleted) {
        throw new Error("Failed to delete student locally");
      }
      
      console.log(`✅ Student "${studentName}" deleted locally`);
      
      // TODO: Replace with backend API call when implementing new backend
      // const { deleteStudentFromFirestore } = await import("@/lib/firebaseSync");
      // await deleteStudentFromFirestore(studentId);
      
      return deleted;
    },
    onSuccess: async () => {
      // Refresh students immediately
      const { getStudentsByClass } = await import("@/lib/offlineApi");
      const currentStudents = await getStudentsByClass(className);
      queryClient.setQueryData(["students", className], currentStudents);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["students", className] });
      queryClient.invalidateQueries({ queryKey: ["class-students"] });
      
      // TODO: Replace with backend API call when implementing new backend
      // const { fetchStudentsFromFirestore } = await import("@/lib/firebaseSync");
      // await fetchStudentsFromFirestore();
      
      toast({
        title: "✅ Success",
        description: "Student deleted successfully",
      });
    },
    onError: (error: Error) => {
      console.error("❌ Error deleting student:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitAllAttendanceMutation = useMutation({
    mutationFn: async () => {
      // Build all records at once
      const attendanceRecords = students.map((student) => {
        const record = attendance[student.id] || { status: "present" };
        return {
          id: `${student.id}-${dateForApi}-${prayer}`,
          studentId: student.id,
          studentName: student.name,
          className,
          prayer,
          date: dateForApi,
          status: record.status,
          reason: record.reason,
          timestamp: new Date().toISOString(),
          synced: false
        };
      });
      
      // Save ALL records in ONE operation (super fast!)
      saveAttendanceBatch(attendanceRecords);
    },
    onSuccess: () => {
      // Invalidate queries in background
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      
      // Show instant success message
      toast({
        title: "✅ Saved!",
        description: `${students.length} students recorded`,
      });
      
      // Go back immediately
      onBack();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (studentId: string, studentName: string, status: "present" | "absent", reason?: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { status, reason }
    }));
  };

  const handleSubmitAttendance = () => {
    submitAllAttendanceMutation.mutate();
  };

  const handleAddStudent = () => {
    if (newStudentName.trim()) {
      createStudentMutation.mutate({ 
        name: newStudentName.trim(), 
        rollNumber: newStudentRollNumber.trim() || undefined 
      });
    }
  };

  const handleQuickAbsent = () => {
    if (!absentRollNumbers.trim()) return;
    
    // Split by comma, space, or newline
    const rollNumbers = absentRollNumbers
      .split(/[\s,]+/)
      .map(r => r.trim())
      .filter(r => r.length > 0);
    
    let markedCount = 0;
    const notFoundRolls: string[] = [];
    const updatedAttendance = { ...attendance };
    
    rollNumbers.forEach(rollNum => {
      const student = students.find(s => s.rollNumber === rollNum);
      if (student) {
        updatedAttendance[student.id] = { status: "absent", reason: "" };
        markedCount++;
      } else {
        notFoundRolls.push(rollNum);
      }
    });
    
    // Update all at once
    if (markedCount > 0) {
      setAttendance(updatedAttendance);
      
      toast({
        title: "✅ Students Marked Absent",
        description: `${markedCount} student(s) marked absent${notFoundRolls.length > 0 ? `. Not found: ${notFoundRolls.join(', ')}` : ''}`,
      });
    } else {
      toast({
        title: "❌ No Students Found",
        description: `Roll numbers not found: ${notFoundRolls.join(', ')}`,
        variant: "destructive",
      });
    }
    
    setAbsentRollNumbers("");
  };

  const presentCount = Object.values(attendance).filter(a => a.status === "present").length;
  const totalCount = students.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-green-400 to-teal-500 dark:from-emerald-900 dark:via-green-800 dark:to-teal-900 relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-16 left-16 w-36 h-36 bg-gradient-to-br from-orange-300 to-yellow-400 rounded-full opacity-25 blur-lg animate-float"></div>
        <div className="absolute bottom-24 right-24 w-44 h-44 bg-gradient-to-br from-blue-300 to-cyan-400 rounded-3xl opacity-20 blur-lg animate-float-delayed"></div>
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-gradient-to-br from-purple-300 to-pink-400 rounded-2xl rotate-45 opacity-25 blur-lg animate-float-slow"></div>
      </div>
      
      <div className="sticky top-0 z-50 bg-white/30 dark:bg-gray-900/30 backdrop-blur-3xl border-b border-white/50 dark:border-white/20 shadow-[0_10px_40px_-10px_rgba(0,200,83,0.3)]">
        <div className="max-w-4xl mx-auto p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              data-testid="button-back"
              className="text-white hover:bg-white/20 active:bg-white/30 backdrop-blur-sm h-10 w-10 sm:h-12 sm:w-12 touch-manipulation"
            >
              <span className="material-icons text-xl sm:text-2xl">arrow_back</span>
            </Button>
            <div className="flex flex-col items-center flex-1 px-2 sm:px-4">
              <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-white drop-shadow-lg text-center">{prayer} - {className}</h2>
              <p className="text-xs sm:text-sm md:text-base font-semibold text-white/80 drop-shadow-md">{today}</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 active:bg-white/30 backdrop-blur-sm h-10 w-10 sm:h-12 sm:w-12 touch-manipulation">
                  <span className="material-icons text-xl sm:text-2xl">person_add</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Student Name</label>
                    <Input
                      placeholder="Enter student name"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddStudent();
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Roll Number (Optional)</label>
                    <Input
                      placeholder="e.g., 1, 01, A1"
                      value={newStudentRollNumber}
                      onChange={(e) => setNewStudentRollNumber(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddStudent();
                      }}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddStudent}
                      disabled={!newStudentName.trim() || createStudentMutation.isPending}
                    >
                      {createStudentMutation.isPending ? "Adding..." : "Add"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base">
            <span className="material-icons text-white text-lg sm:text-xl drop-shadow-md">people</span>
            <span className="font-bold text-white drop-shadow-md" data-testid="text-attendance-count">
              {presentCount}/{totalCount} present
            </span>
          </div>
        </div>
      </div>

      {/* Quick Absent Roll Number Input */}
      {students.length > 0 && students.some(s => s.rollNumber) && (
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-2 relative z-10">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl border-2 border-red-200 dark:border-red-800 p-3 sm:p-4 shadow-lg">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
              <div className="flex items-center gap-2 min-w-fit">
                <span className="material-icons text-red-500 text-xl">schedule</span>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Quick Absent
                </label>
              </div>
              <Input
                placeholder="Enter roll numbers (e.g., 1, 2, 3 or 1 2 3)"
                value={absentRollNumbers}
                onChange={(e) => setAbsentRollNumbers(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleQuickAbsent();
                }}
                className="flex-1 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 focus:border-red-500 dark:focus:border-red-500"
              />
              <Button
                onClick={handleQuickAbsent}
                disabled={!absentRollNumbers.trim()}
                className="bg-red-500 hover:bg-red-600 text-white font-bold whitespace-nowrap"
                size="default"
              >
                <span className="material-icons mr-1 text-lg">done</span>
                Mark Absent
              </Button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 ml-7">
              💡 Tip: Enter multiple roll numbers separated by commas or spaces
            </p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto pb-32 sm:pb-36 md:pb-40 relative z-10 min-h-screen">
        {isLoading ? (
          <div className="text-center py-8 sm:py-12 text-white text-base sm:text-lg font-semibold drop-shadow-lg">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 space-y-4 px-4">
            <p className="text-white font-bold text-lg sm:text-xl drop-shadow-lg">No students in this class yet</p>
            <p className="text-white/90 text-sm sm:text-base drop-shadow-md">Add students individually or import from Excel file</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-6">
              <BulkStudentImport 
                className={className}
                onSuccess={async () => {
                  console.log('🔄 BulkStudentImport onSuccess called, refreshing student list...');
                  
                  // Get fresh students from backend/LocalStorage
                  const { getStudentsByClass } = await import("@/lib/offlineApi");
                  const currentStudents = await getStudentsByClass(className);
                  
                  // CRITICAL: Directly update the query cache with fresh data
                  queryClient.setQueryData(["students", className], currentStudents);
                  
                  // Invalidate all student-related queries
                  await queryClient.invalidateQueries({ queryKey: ["students"] });
                  await queryClient.invalidateQueries({ queryKey: ["students", className] });
                  await queryClient.invalidateQueries({ queryKey: ["class-students", className] });
                  
                  // Force immediate refetch
                  await queryClient.refetchQueries({ queryKey: ["students", className] });
                  
                  console.log(`✅ Student list refreshed after bulk import: ${currentStudents.length} students`);
                }}
              />
              <span className="text-white/80 text-sm">or use the + button above</span>
            </div>
          </div>
        ) : (
          students.map((student) => (
            <StudentRow
              key={student.id}
              studentId={student.id}
              studentName={student.name}
              rollNumber={student.rollNumber || undefined}
              initialStatus={attendance[student.id]?.status || "present"}
              initialReason={attendance[student.id]?.reason || ""}
              onStatusChange={(status, reason) => handleStatusChange(student.id, student.name, status, reason)}
              onDelete={() => {
                if (confirm(`⚠️ Delete "${student.name}"?\n\nThis will also delete all attendance records for this student.\n\nThis cannot be undone!`)) {
                  deleteStudentMutation.mutate(student.id);
                }
              }}
            />
          ))
        )}
      </div>

      {students.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/30 dark:bg-gray-900/30 backdrop-blur-3xl border-t border-white/50 dark:border-white/20 p-4 sm:p-6 md:p-8 shadow-[0_-10px_40px_-10px_rgba(0,200,83,0.3)] z-50 safe-bottom">
          <div className="max-w-4xl mx-auto">
            <Button 
              className="w-full bg-white/95 hover:bg-white active:bg-white/90 text-emerald-600 hover:text-emerald-700 active:text-emerald-800 shadow-[0_10px_30px_-8px_rgba(0,200,83,0.5)] hover:shadow-[0_15px_40px_-8px_rgba(0,200,83,0.6)] active:shadow-[0_8px_25px_-6px_rgba(0,200,83,0.4)] transition-all duration-300 sm:duration-400 md:duration-500 transform hover:-translate-y-1 active:translate-y-0 hover:scale-[1.01] active:scale-[0.99] text-base sm:text-lg md:text-xl font-extrabold py-4 sm:py-6 md:py-8 rounded-2xl sm:rounded-[1.75rem] md:rounded-[2rem] border-2 sm:border-3 md:border-4 border-white/60 hover:border-white active:border-white/80 touch-manipulation" 
              size="lg"
              onClick={handleSubmitAttendance}
              disabled={submitAllAttendanceMutation.isPending}
            >
              <span className="material-icons mr-2 sm:mr-3 text-2xl sm:text-3xl">
                {submitAllAttendanceMutation.isPending ? "done_all" : "check_circle"}
              </span>
              <span className="hidden sm:inline">{submitAllAttendanceMutation.isPending ? "Saving..." : "Submit Attendance"}</span>
              <span className="sm:hidden">{submitAllAttendanceMutation.isPending ? "Saving..." : "Submit"}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
