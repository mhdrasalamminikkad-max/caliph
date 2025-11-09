import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AttendanceRecord } from "@/lib/hybridStorage";

interface ClassOverviewProps {
  onBack: () => void;
  onClassClick?: (className: string) => void;
}

export default function ClassOverview({ onBack, onClassClick }: ClassOverviewProps) {
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      // TODO: Replace with backend API call when implementing new backend
      // const { fetchClassesFromFirestore } = await import("@/lib/firebaseSync");
      // await fetchClassesFromFirestore();
      const { getClasses } = await import("@/lib/offlineApi");
      return getClasses();
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data - INSTANT SYNC
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      // TODO: Replace with backend API call when implementing new backend
      // const { fetchStudentsFromFirestore } = await import("@/lib/firebaseSync");
      // await fetchStudentsFromFirestore();
      const { getStudents } = await import("@/lib/offlineApi");
      return getStudents();
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data - INSTANT SYNC
  });

  const { data: attendance = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ["attendance"],
    queryFn: async () => {
      // TODO: Replace with backend API call when implementing new backend
      // const { fetchFromFirestore } = await import("@/lib/hybridStorage");
      // return await fetchFromFirestore();
      const { getLocalAttendance } = await import("@/lib/hybridStorage");
      return getLocalAttendance();
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data - INSTANT SYNC
  });

  const getClassStats = (className: string) => {
    const classStudents = students.filter((s: any) => s.className === className);
    const studentCount = classStudents.length;
    
    // Get today's attendance
    const today = new Date().toISOString().split("T")[0];
    const todayAttendance = attendance.filter((a: any) => {
      const attDate = new Date(a.date).toISOString().split("T")[0];
      return attDate === today && classStudents.some((s: any) => s.id === a.studentId);
    });
    
    const presentToday = todayAttendance.filter((a: any) => a.status === "present").length;
    const absentToday = todayAttendance.filter((a: any) => a.status === "absent").length;
    
    // Get all attendance for this class
    const classAttendance = attendance.filter((a: any) => 
      classStudents.some((s: any) => s.id === a.studentId)
    );
    
    const totalRecords = classAttendance.length;
    const totalPresent = classAttendance.filter((a: any) => a.status === "present").length;
    const totalAbsent = classAttendance.filter((a: any) => a.status === "absent").length;
    const attendancePercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;
    
    return { 
      studentCount, 
      presentToday, 
      absentToday,
      totalRecords,
      totalPresent,
      totalAbsent,
      attendancePercentage,
      classStudents,
      classAttendance
    };
  };

  const generateClassPDF = (className: string) => {
    const stats = getClassStats(className);
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("Class Attendance Report", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 30, { align: "center" });
    
    // Class Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text(`Class: ${className}`, 20, 55);
    doc.setFontSize(12);
    doc.text(`Total Students: ${stats.studentCount}`, 20, 65);
    
    // Stats boxes
    const statsY = 80;
    doc.setFillColor(240, 253, 244);
    doc.rect(20, statsY, 40, 25, "F");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Total Records", 40, statsY + 8, { align: "center" });
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text(stats.totalRecords.toString(), 40, statsY + 20, { align: "center" });
    
    doc.setFillColor(220, 252, 231);
    doc.rect(65, statsY, 40, 25, "F");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Present", 85, statsY + 8, { align: "center" });
    doc.setFontSize(16);
    doc.setTextColor(34, 197, 94);
    doc.text(stats.totalPresent.toString(), 85, statsY + 20, { align: "center" });
    
    doc.setFillColor(254, 226, 226);
    doc.rect(110, statsY, 40, 25, "F");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Absent", 130, statsY + 8, { align: "center" });
    doc.setFontSize(16);
    doc.setTextColor(239, 68, 68);
    doc.text(stats.totalAbsent.toString(), 130, statsY + 20, { align: "center" });
    
    doc.setFillColor(254, 249, 195);
    doc.rect(155, statsY, 40, 25, "F");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Rate", 175, statsY + 8, { align: "center" });
    doc.setFontSize(16);
    doc.setTextColor(234, 179, 8);
    doc.text(`${stats.attendancePercentage}%`, 175, statsY + 20, { align: "center" });
    
    // Students Table
    let yPos = statsY + 40;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Students List", 20, yPos);
    yPos += 10;
    
    const studentTableData = stats.classStudents.map((student: any) => {
      const studentAttendance = stats.classAttendance.filter((a: any) => a.studentId === student.id);
      const present = studentAttendance.filter((a: any) => a.status === "present").length;
      const total = studentAttendance.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      
      return [
        student.rollNumber || "-",
        student.name,
        total.toString(),
        present.toString(),
        (total - present).toString(),
        `${percentage}%`
      ];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [["Roll No", "Name", "Total", "Present", "Absent", "Rate %"]],
      body: studentTableData,
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 },
    });
    
    // Attendance Records Table (if there are records)
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;
    if (stats.classAttendance.length > 0) {
      doc.setFontSize(14);
      doc.text("Recent Attendance Records", 20, finalY + 10);
      
      const recentRecords = stats.classAttendance
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30)
        .map((record: any) => {
          const student = stats.classStudents.find((s: any) => s.id === record.studentId);
          return [
            new Date(record.date).toLocaleDateString(),
            record.prayer,
            student?.name || "Unknown",
            record.status === "present" ? "✓" : "✗"
          ];
        });
      
      autoTable(doc, {
        startY: finalY + 15,
        head: [["Date", "Prayer", "Student", "Status"]],
        body: recentRecords,
        theme: "striped",
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        styles: { fontSize: 8 },
        margin: { left: 20, right: 20 },
        pageBreak: "auto",
      });
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }
    
    doc.save(`${className}_Attendance_Report.pdf`);
  };

  const isLoading = classesLoading || studentsLoading || attendanceLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-green-400 to-teal-500 dark:from-emerald-900 dark:via-green-800 dark:to-teal-900 p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl rotate-12 opacity-40 blur-sm animate-float"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full opacity-30 blur-sm animate-float-delayed"></div>
        <div className="absolute bottom-32 left-1/4 w-24 h-24 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl -rotate-12 opacity-35 blur-sm animate-float"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl sm:rounded-[2rem] border-2 border-white/40 shadow-2xl p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              className="hidden sm:flex gap-2 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
            >
              <span className="material-icons">arrow_back</span>
              Back
            </Button>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-700 dark:text-emerald-300">
              Class Overview
            </h1>
            <div className="w-20 sm:w-24"></div>
          </div>
        </div>

        {/* Classes Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-emerald-500"></div>
            <p className="mt-4 text-white text-lg font-semibold">Loading classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-xl border-2 border-white/40 shadow-xl">
            <CardContent className="py-12 text-center">
              <span className="material-icons text-6xl text-gray-400 mb-4">school</span>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No classes available. Add a class to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {classes.map((classItem: any) => {
              const stats = getClassStats(classItem.name);
              return (
                <Card
                  key={classItem.id}
                  onClick={() => onClassClick?.(classItem.name)}
                  className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl border-2 border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-pointer"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl sm:text-2xl text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                      <span className="material-icons text-2xl sm:text-3xl">school</span>
                      {classItem.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Total Students */}
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-emerald-600 dark:text-emerald-400">group</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Total Students</span>
                      </div>
                      <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                        {stats.studentCount}
                      </span>
                    </div>

                    {/* Today's Attendance */}
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Today's Attendance</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Present</p>
                          <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.presentToday}</p>
                        </div>
                        <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-center">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Absent</p>
                          <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.absentToday}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClassClick?.(classItem.name);
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <span className="material-icons mr-2">group_add</span>
                        Manage
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          generateClassPDF(classItem.name);
                        }}
                        variant="outline"
                        className="flex-1 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                      >
                        <span className="material-icons mr-2">download</span>
                        PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

