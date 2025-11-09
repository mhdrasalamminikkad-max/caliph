import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface StudentReportProps {
  onBack: () => void;
}

export default function StudentReport({ onBack }: StudentReportProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

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

  const { data: attendance = [] } = useQuery({
    queryKey: ["attendance"],
    queryFn: async () => {
      // TODO: Replace with backend API call when implementing new backend
      // const { fetchFromFirestore } = await import("@/lib/hybridStorage");
      // const data = await fetchFromFirestore();
      const { getLocalAttendance } = await import("@/lib/hybridStorage");
      const data = getLocalAttendance();
      console.log("📚 Loaded attendance records for StudentReport:", data.length);
      return data;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data - INSTANT SYNC
  });

  const filteredStudents = students.filter((student: any) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStudentStats = (studentId: string) => {
    const studentAttendance = attendance.filter((a: any) => a.studentId === studentId);
    const totalRecords = studentAttendance.length;
    const presentCount = studentAttendance.filter((a: any) => a.status === "present").length;
    const absentCount = studentAttendance.filter((a: any) => a.status === "absent").length;
    const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : "0.0";
    
    console.log(`📊 Student ${studentId} stats:`, { totalRecords, presentCount, absentCount, attendanceRate });
    
    return { totalRecords, presentCount, absentCount, attendanceRate };
  };

  const generateStudentPDF = (student: any) => {
    const doc = new jsPDF();
    const stats = getStudentStats(student.id);
    const studentAttendance = attendance
      .filter((a: any) => a.studentId === student.id)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Header
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("Student Attendance Report", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 30, { align: "center" });

    // Student Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text(`Student: ${student.name}`, 20, 55);
    doc.setFontSize(12);
    doc.text(`Class: ${student.className}`, 20, 65);

    // Stats boxes
    const statsY = 80;
    doc.setFillColor(240, 253, 244);
    doc.rect(20, statsY, 50, 25, "F");
    doc.setFontSize(10);
    doc.text("Total Records", 45, statsY + 8, { align: "center" });
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text(stats.totalRecords.toString(), 45, statsY + 20, { align: "center" });

    doc.setFillColor(220, 252, 231);
    doc.rect(75, statsY, 50, 25, "F");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Present", 100, statsY + 8, { align: "center" });
    doc.setFontSize(16);
    doc.setTextColor(34, 197, 94);
    doc.text(stats.presentCount.toString(), 100, statsY + 20, { align: "center" });

    doc.setFillColor(254, 226, 226);
    doc.rect(130, statsY, 50, 25, "F");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Absent", 155, statsY + 8, { align: "center" });
    doc.setFontSize(16);
    doc.setTextColor(239, 68, 68);
    doc.text(stats.absentCount.toString(), 155, statsY + 20, { align: "center" });

    // Attendance Rate
    doc.setFillColor(16, 185, 129);
    doc.rect(20, statsY + 30, 170, 15, "F");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(`Attendance Rate: ${stats.attendanceRate}%`, 105, statsY + 40, { align: "center" });

    // Attendance History Table
    const tableData = studentAttendance.slice(0, 50).map((record: any) => [
      new Date(record.date).toLocaleDateString(),
      record.prayer,
      record.status === "present" ? "✓ Present" : "✗ Absent",
      record.reason || "-",
    ]);

    autoTable(doc, {
      startY: statsY + 55,
      head: [["Date", "Prayer", "Status", "Reason"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 30 },
        2: { cellWidth: 35 },
        3: { cellWidth: 'auto' },
      },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      styles: { fontSize: 9 },
    });

    doc.save(`${student.name}_Attendance_Report.pdf`);
  };

  if (selectedStudent) {
    const stats = getStudentStats(selectedStudent.id);
    const studentAttendance = attendance
      .filter((a: any) => a.studentId === selectedStudent.id)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-green-400 to-teal-500 dark:from-emerald-900 dark:via-green-800 dark:to-teal-900 p-4 sm:p-6 md:p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl rotate-12 opacity-40 blur-sm animate-float"></div>
          <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full opacity-30 blur-sm animate-float-delayed"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10 space-y-6">
          {/* Header */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border-2 border-white/40 shadow-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedStudent(null)}
                className="flex gap-2 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
              >
                <span className="material-icons">arrow_back</span>
                <span className="hidden sm:inline">Back to List</span>
              </Button>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-700 dark:text-emerald-300 text-center flex-1">
                {selectedStudent.name}
              </h1>
              <Button
                onClick={() => generateStudentPDF(selectedStudent)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
              >
                <span className="material-icons">download</span>
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
            <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
              Class: {selectedStudent.className}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white/90 backdrop-blur-xl border-2 border-white/40">
              <CardContent className="pt-6 text-center">
                <span className="material-icons text-4xl text-emerald-600 mb-2">assignment</span>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-3xl font-bold text-emerald-700">{stats.totalRecords}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/90 backdrop-blur-xl border-2 border-white/40">
              <CardContent className="pt-6 text-center">
                <span className="material-icons text-4xl text-green-600 mb-2">check_circle</span>
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-3xl font-bold text-green-700">{stats.presentCount}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/90 backdrop-blur-xl border-2 border-white/40">
              <CardContent className="pt-6 text-center">
                <span className="material-icons text-4xl text-red-600 mb-2">cancel</span>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-3xl font-bold text-red-700">{stats.absentCount}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/90 backdrop-blur-xl border-2 border-white/40">
              <CardContent className="pt-6 text-center">
                <span className="material-icons text-4xl text-blue-600 mb-2">percent</span>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-3xl font-bold text-blue-700">{stats.attendanceRate || "0.0"}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance History */}
          <Card className="bg-white/90 backdrop-blur-xl border-2 border-white/40">
            <CardHeader>
              <CardTitle className="text-xl text-emerald-700">Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {studentAttendance.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No attendance records yet</p>
                ) : (
                  studentAttendance.map((record: any) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`material-icons text-2xl ${
                            record.status === "present" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {record.status === "present" ? "check_circle" : "cancel"}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {new Date(record.date).toLocaleDateString()} - {record.prayer}
                          </p>
                          {record.reason && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Reason: {record.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          record.status === "present"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {record.status === "present" ? "Present" : "Absent"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-green-400 to-teal-500 dark:from-emerald-900 dark:via-green-800 dark:to-teal-900 p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl rotate-12 opacity-40 blur-sm animate-float"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full opacity-30 blur-sm animate-float-delayed"></div>
        <div className="absolute bottom-32 left-1/4 w-24 h-24 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl -rotate-12 opacity-35 blur-sm animate-float"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl sm:rounded-[2rem] border-2 border-white/40 shadow-2xl p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="hidden sm:flex gap-2 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
            >
              <span className="material-icons">arrow_back</span>
              Back
            </Button>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-700 dark:text-emerald-300">
              Student Reports
            </h1>
            <div className="w-20 sm:w-24"></div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <Input
              type="text"
              placeholder="Search by student name or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80 border-emerald-200 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Students List */}
        {studentsLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-emerald-500"></div>
            <p className="mt-4 text-white text-lg font-semibold">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-xl border-2 border-white/40 shadow-xl">
            <CardContent className="py-12 text-center">
              <span className="material-icons text-6xl text-gray-400 mb-4">person_search</span>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {searchQuery ? "No students found matching your search" : "No students available"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredStudents.map((student: any) => {
              const stats = getStudentStats(student.id);
              return (
                <Card
                  key={student.id}
                  className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl border-2 border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 hover:-translate-y-1"
                  onClick={() => setSelectedStudent(student)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg sm:text-xl text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                      <span className="material-icons">person</span>
                      {student.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Class: {student.className}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Attendance Rate
                      </span>
                      <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                        {stats.attendanceRate || "0.0"}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                        <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                          {stats.totalRecords || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Present</p>
                        <p className="text-lg font-bold text-green-600">{stats.presentCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Absent</p>
                        <p className="text-lg font-bold text-red-600">{stats.absentCount || 0}</p>
                      </div>
                    </div>
                    {stats.totalRecords === 0 && (
                      <p className="text-xs text-center text-gray-500 italic mt-2">
                        No attendance recorded yet
                      </p>
                    )}
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

