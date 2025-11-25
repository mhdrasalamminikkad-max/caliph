import { Prayer, type Class } from "@shared/schema";
import ClassCard from "./ClassCard";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getClasses, createClass, deleteClass, getStudentsByClass } from "@/lib/offlineApi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AttendanceRecord } from "@/lib/backendApi";

interface ClassSelectionProps {
  prayer: Prayer;
  onClassSelect: (className: string) => void;
  onBack: () => void;
  title?: string;
}

export default function ClassSelection({ prayer, onClassSelect, onBack, title }: ClassSelectionProps) {
  const [newClassName, setNewClassName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date().toLocaleDateString("en-US", { 
    weekday: "long", 
    month: "short", 
    day: "numeric" 
  });

  const { data: classes = [], isLoading } = useQuery<Class[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      // TODO: Replace with backend API call when implementing new backend
      // const { fetchClassesFromFirestore } = await import("@/lib/firebaseSync");
      // await fetchClassesFromFirestore();
      const { getClasses } = await import("@/lib/offlineApi");
      return await getClasses();
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data - INSTANT SYNC
  });

  const { data: classStudentsMap = {} } = useQuery<Record<string, any[]>>({
    queryKey: ["class-students", classes],
    queryFn: async () => {
      // TODO: Replace with backend API call when implementing new backend
      // const { fetchStudentsFromFirestore } = await import("@/lib/firebaseSync");
      // await fetchStudentsFromFirestore();
      const { getStudentsByClass } = await import("@/lib/offlineApi");
      const studentsMap: Record<string, any[]> = {};
      for (const cls of classes) {
        const students = await getStudentsByClass(cls.name);
        studentsMap[cls.name] = students;
      }
      return studentsMap;
    },
    enabled: classes.length > 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data - INSTANT SYNC
  });

  const { data: allAttendance = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance"],
    queryFn: async () => {
      const { getAttendance } = await import("@/lib/backendApi");
      return getAttendance();
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });


  const createClassMutation = useMutation({
    mutationFn: async (name: string) => {
      console.log(`🔄 Creating class "${name}"...`);
      
      try {
        // Step 1: Create class locally (this is the critical step)
        const newClass = createClass(name);
        console.log(`✅ Class "${newClass.name}" created locally with ID: ${newClass.id}`);
        
        // TODO: Replace with backend API call when implementing new backend
        // const { syncClassesToFirestore } = await import("@/lib/firebaseSync");
        // await syncClassesToFirestore();
        
        // Return immediately - don't wait for sync
        return newClass;
      } catch (error: any) {
        console.error(`❌ Error creating class "${name}":`, error);
        const errorMsg = error?.message || String(error);
        
        // Re-throw with more context
        if (errorMsg.includes("already exists")) {
          throw new Error(`Class "${name}" already exists`);
        } else {
          throw new Error(`Failed to create class: ${errorMsg}`);
        }
      }
    },
    onSuccess: async (newClass) => {
      console.log("✅ Class creation successful:", newClass);
      
      // CRITICAL: Close dialog first so user sees the result
      setNewClassName("");
      setDialogOpen(false);
      
      // Get fresh classes from backend/LocalStorage (includes the newly created one)
      const { getClasses } = await import("@/lib/offlineApi");
      const currentClasses = await getClasses();
      console.log(`📋 Classes after create: ${currentClasses.length} total`);
      console.log(`   Classes: ${currentClasses.map(c => c.name).join(', ')}`);
      
      // CRITICAL: Directly update the query cache with fresh data from LocalStorage
      // This ensures the UI shows the new class IMMEDIATELY without waiting for refetch
      queryClient.setQueryData(["classes"], currentClasses);
      
      // Also invalidate to trigger refetch (but cache is already updated above)
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["class-students"] });
      
      // TODO: Replace with backend API call when implementing new backend
      // const { fetchClassesFromFirestore } = await import("@/lib/firebaseSync");
      // await fetchClassesFromFirestore();
      
      toast({
        title: "✅ Success",
        description: "Class created! It will sync to other devices automatically.",
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

  const deleteClassMutation = useMutation({
    mutationFn: async (classId: string) => {
      console.log(`🔄 Deleting class with ID: ${classId}`);
      
      // Get class name BEFORE deletion (needed for Firebase cleanup)
      const classes = await getClasses();
      const classToDelete = classes.find(c => c.id === classId);
      
      if (!classToDelete) {
        throw new Error("Class not found");
      }
      
      const className = classToDelete.name;
      console.log(`📋 Found class "${className}" to delete`);
      
      // Delete from backend/LocalStorage
      const deleted = await deleteClass(classId);
      if (!deleted) {
        throw new Error("Failed to delete class");
      }
      
      console.log(`✅ Class "${className}" deleted successfully`);
      
      return { deleted, className };
    },
    onSuccess: async () => {
      // Refresh classes immediately
      const { getClasses } = await import("@/lib/offlineApi");
      const currentClasses = await getClasses();
      
      // CRITICAL: Directly update the query cache with fresh data
      queryClient.setQueryData(["classes"], currentClasses);
      
      // Invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      await queryClient.invalidateQueries({ queryKey: ["class-students"] });
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      
      // Force immediate refetch
      await queryClient.refetchQueries({ queryKey: ["classes"] });
      
      toast({
        title: "✅ Success",
        description: "Class deleted successfully",
      });
    },
    onError: (error: Error) => {
      console.error("❌ Error deleting class:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateClass = () => {
    const trimmedName = newClassName.trim();
    if (!trimmedName) {
      toast({
        title: "Error",
        description: "Class name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    console.log(`🔄 Attempting to create class: "${trimmedName}"`);
    try {
      createClassMutation.mutate(trimmedName);
    } catch (error: any) {
      console.error("❌ Error calling createClassMutation:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create class",
        variant: "destructive",
      });
    }
  };

  const shareToWhatsApp = () => {
    const currentDate = new Date();
    const todayDate = currentDate.toISOString().split("T")[0];
    const todayDateFormatted = currentDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    // Filter for TODAY's absent students only
    const absentRecords = allAttendance.filter(
      a => {
        const recordDate = new Date(a.date).toISOString().split("T")[0];
        return a.prayer === prayer && a.status === "absent" && recordDate === todayDate;
      }
    );

    const absentStudents = absentRecords.map(record => ({
      name: record.studentName,
      className: record.className,
      date: record.date,
      reason: record.reason
    }));

    // Format the message
    let message = `*🕌 ${prayer.toUpperCase()} - ABSENT STUDENTS*\n`;
    message += `📅 Date: ${todayDateFormatted}\n`;
    message += `👥 Total Absent: ${absentStudents.length}\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (absentStudents.length === 0) {
      message += `✅ No absent students for ${prayer} today!\n\n`;
    } else {
      absentStudents.forEach((student, idx) => {
        message += `${idx + 1}. ${student.name} (${student.className})`;
        if (student.reason) {
          message += ` - ${student.reason}`;
        }
        message += `\n`;
      });
      message += `\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📱 Caliph Attendance System`;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);

    // Open WhatsApp with the pre-filled message
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');

    toast({
      title: "📱 Opening WhatsApp",
      description: `${prayer} absent students list ready to share`,
    });
  };

  const downloadAbsentStudentsPDF = () => {
    const doc = new jsPDF();
    const currentDate = new Date();
    const todayDate = currentDate.toISOString().split("T")[0];

    // Filter for TODAY's absent students only
    const absentRecords = allAttendance.filter(
      a => {
        const recordDate = new Date(a.date).toISOString().split("T")[0];
        return a.prayer === prayer && a.status === "absent" && recordDate === todayDate;
      }
    );

    // Group absent students by class
    const studentsByClass: Record<string, Array<{ name: string; reason?: string }>> = {};
    absentRecords.forEach(record => {
      if (!studentsByClass[record.className]) {
        studentsByClass[record.className] = [];
      }
      studentsByClass[record.className].push({
        name: record.studentName,
        reason: record.reason
      });
    });

    // Sort class names alphabetically
    const sortedClasses = Object.keys(studentsByClass).sort();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 200, 83);
    doc.text(`${prayer.toUpperCase()} - ABSENT STUDENTS`, 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(currentDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), 105, 28, { align: "center" });

    // Starting Y position for content
    let yPosition = 45;

    if (sortedClasses.length === 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 150, 0);
      doc.text("✓ No absent students for this prayer", 105, yPosition, { align: "center" });
    } else {
      // Loop through each class
      sortedClasses.forEach((className, classIndex) => {
        const students = studentsByClass[className];

        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        // Class name (bold and larger)
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(className, 20, yPosition);
        yPosition += 8;

        // Student names
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);

        students.forEach((student, studentIndex) => {
          // Check if we need a new page
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }

          const studentText = `  ${studentIndex + 1}. ${student.name}${student.reason ? ` - ${student.reason}` : ''}`;
          doc.text(studentText, 25, yPosition);
          yPosition += 6;
        });

        // Add spacing between classes
        yPosition += 5;
      });
    }

    // Footer with page numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount} | Caliph Attendance System`,
        105,
        285,
        { align: "center" }
      );
    }

    doc.save(`${prayer}_Absent_Students_${currentDate.toISOString().split("T")[0]}.pdf`);

    toast({
      title: "✅ PDF Downloaded",
      description: `${prayer} absent students list downloaded successfully`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-green-400 to-teal-500 dark:from-emerald-900 dark:via-green-800 dark:to-teal-900 relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full opacity-30 blur-md animate-float"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-300 to-teal-400 rounded-3xl opacity-25 blur-md animate-float-delayed"></div>
        <div className="absolute top-1/2 right-1/4 w-28 h-28 bg-gradient-to-br from-pink-300 to-purple-400 rounded-2xl rotate-45 opacity-30 blur-md animate-float-slow"></div>
      </div>
      
      <div className="sticky top-0 z-50 bg-white/30 dark:bg-gray-900/30 backdrop-blur-3xl border-b border-white/50 dark:border-white/20 shadow-[0_10px_40px_-10px_rgba(0,200,83,0.3)] p-3 sm:p-4 md:p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            data-testid="button-back"
            className="text-white hover:bg-white/20 backdrop-blur-sm h-10 w-10 sm:h-12 sm:w-12 touch-manipulation"
          >
            <span className="material-icons text-xl sm:text-2xl">arrow_back</span>
          </Button>
          <div className="flex flex-col items-center flex-1 px-2 sm:px-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white drop-shadow-lg">{title || prayer}</h2>
            <p className="text-xs sm:text-sm md:text-base font-semibold text-white/80 drop-shadow-md">{today}</p>
          </div>
          <div className="w-10 sm:w-12"></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-10">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white drop-shadow-lg">Select a Class</h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={downloadAbsentStudentsPDF}
              className="flex-1 sm:flex-initial bg-white/95 hover:bg-white text-emerald-600 hover:text-emerald-700 shadow-[0_10px_30px_-5px_rgba(0,200,83,0.4)] hover:shadow-[0_15px_40px_-5px_rgba(0,200,83,0.5)] active:shadow-[0_8px_20px_-5px_rgba(0,200,83,0.4)] transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 font-bold text-sm sm:text-base touch-manipulation"
              data-testid="button-download-absent-students"
            >
              <span className="material-icons mr-1 sm:mr-2 text-lg sm:text-xl">download</span>
              <span className="hidden sm:inline">PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            <Button
              onClick={shareToWhatsApp}
              className="flex-1 sm:flex-initial bg-green-500 hover:bg-green-600 text-white shadow-[0_10px_30px_-5px_rgba(34,197,94,0.4)] hover:shadow-[0_15px_40px_-5px_rgba(34,197,94,0.5)] active:shadow-[0_8px_20px_-5px_rgba(34,197,94,0.4)] transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 font-bold text-sm sm:text-base touch-manipulation"
              data-testid="button-whatsapp-absent-students"
            >
              <span className="mr-1 sm:mr-2 text-base sm:text-lg">📱</span>
              <span className="hidden sm:inline">WhatsApp</span>
              <span className="sm:hidden">Share</span>
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-initial bg-white/95 hover:bg-white text-emerald-600 hover:text-emerald-700 shadow-[0_10px_30px_-5px_rgba(0,200,83,0.4)] hover:shadow-[0_15px_40px_-5px_rgba(0,200,83,0.5)] active:shadow-[0_8px_20px_-5px_rgba(0,200,83,0.4)] transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 rounded-xl sm:rounded-2xl px-6 sm:px-8 py-2.5 sm:py-3 font-bold text-sm sm:text-base touch-manipulation">
                  <span className="material-icons mr-2 text-lg sm:text-xl">add</span>
                  Add Class
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Enter class name (e.g., Grade 1)"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateClass();
                  }}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateClass}
                    disabled={!newClassName.trim() || createClassMutation.isPending}
                  >
                    {createClassMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-white font-semibold">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="text-center py-8 text-white font-semibold">
            No classes yet. Click "Add Class" to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {classes.map((cls) => {
              const classStudents = classStudentsMap[cls.name] || [];
              const studentCount = classStudents.length;
              
              return (
                <ClassCard
                  key={cls.id}
                  className={cls.name}
                  studentCount={studentCount}
                  students={classStudents}
                  onClick={() => onClassSelect(cls.name)}
                  onDelete={() => {
                    const message = studentCount > 0
                      ? `⚠️ Delete "${cls.name}"?\n\nThis will also delete:\n• ${studentCount} student${studentCount !== 1 ? 's' : ''}\n• All attendance records\n\nThis cannot be undone!`
                      : `Are you sure you want to delete "${cls.name}"?`;
                    
                    if (confirm(message)) {
                      deleteClassMutation.mutate(cls.id);
                    }
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
