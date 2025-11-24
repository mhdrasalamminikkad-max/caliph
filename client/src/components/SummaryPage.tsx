import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prayers, type Class, type Student } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AttendanceRecord } from "@/lib/backendApi";

interface SummaryPageProps {
  onBack: () => void;
}

export default function SummaryPage({ onBack }: SummaryPageProps) {
  const [selectedTab, setSelectedTab] = useState<"daily" | "weekly" | "monthly" | "custom">("monthly");
  const [selectedDailyDate, setSelectedDailyDate] = useState(new Date().toISOString().split("T")[0]);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [expandedPrayers, setExpandedPrayers] = useState<Set<string>>(new Set());

  // Calculate date ranges
  const getDateRange = () => {
    const today = new Date();
    let startDate: string, endDate: string;

    switch (selectedTab) {
      case "daily":
        startDate = endDate = selectedDailyDate;
        break;
      case "weekly":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        startDate = weekStart.toISOString().split("T")[0];
        endDate = today.toISOString().split("T")[0];
        break;
      case "monthly":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
        endDate = today.toISOString().split("T")[0];
        break;
      case "custom":
        startDate = customStartDate || today.toISOString().split("T")[0];
        endDate = customEndDate || today.toISOString().split("T")[0];
        break;
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { getClasses } = await import("@/lib/backendApi");
      return getClasses();
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: async () => {
      const { getStudents } = await import("@/lib/backendApi");
      return getStudents();
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  const { data: allAttendance = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", startDate, endDate],
    queryFn: async () => {
      const { getAttendance } = await import("@/lib/backendApi");
      const records = await getAttendance();
      return records.filter(record => {
        const recordDate = new Date(record.date).toISOString().split("T")[0];
        return recordDate >= startDate && recordDate <= endDate;
      });
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Calculate prayer-wise summary
  const prayerSummary = prayers.map(prayer => {
    const prayerAttendance = allAttendance.filter(a => a.prayer === prayer);
    const present = prayerAttendance.filter(a => a.status === "present").length;
    const absent = prayerAttendance.filter(a => a.status === "absent").length;
    return { prayer, present, absent, total: present + absent };
  });

  // Calculate class-wise summary
  const classSummary = classes.map(cls => {
    const classAttendance = allAttendance.filter(a => a.className === cls.name);
    const present = classAttendance.filter(a => a.status === "present").length;
    const total = classAttendance.length;
    return { className: cls.name, present, total };
  });

  // Calculate student-wise summary
  const studentSummary = students
    .map(student => {
      const studentAttendance = allAttendance.filter(a => a.studentId === student.id);
      const present = studentAttendance.filter(a => a.status === "present").length;
      const absent = studentAttendance.filter(a => a.status === "absent").length;
      const total = studentAttendance.length;
      return {
        ...student,
        present,
        absent,
        total,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
        attendance: studentAttendance,
      };
    })
    // Only show students who have attendance records in this period
    .filter(student => student.total > 0);

  // Filter students by search query
  const filteredStudents = studentSummary.filter(student =>
    student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    student.className.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  // Calculate prayer-wise absent students for All Class Summary
  const prayerAbsentStudents = prayers.map(prayer => {
    const absentRecords = allAttendance.filter(
      a => a.prayer === prayer && a.status === "absent"
    );
    return {
      prayer,
      absentStudents: absentRecords.map(record => ({
        name: record.studentName,
        className: record.className,
        date: record.date,
        reason: record.reason
      }))
    };
  });

  const togglePrayer = (prayer: string) => {
    const newExpanded = new Set(expandedPrayers);
    if (newExpanded.has(prayer)) {
      newExpanded.delete(prayer);
    } else {
      newExpanded.add(prayer);
    }
    setExpandedPrayers(newExpanded);
  };

  // Generate All Class Summary PDF
  const generateAllClassSummaryPDF = () => {
    const doc = new jsPDF();
    const currentDate = new Date();
    const periodLabel = selectedTab === "daily" 
      ? `Daily - ${new Date(selectedDailyDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
      : selectedTab === "weekly" 
        ? "Weekly"
        : selectedTab === "monthly"
          ? new Date(startDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })
          : `${new Date(startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(0, 200, 83);
    doc.text("ALL CLASS SUMMARY", 105, 30, { align: "center" });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Prayer-wise Absent Students", 105, 40, { align: "center" });
    
    doc.setFontSize(14);
    doc.text(`Report Period: ${periodLabel}`, 105, 50, { align: "center" });
    doc.text(`Generated: ${currentDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, 105, 58, { align: "center" });
    
    // Summary statistics
    const totalAbsent = allAttendance.filter(a => a.status === "absent").length;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Absent Records: ${totalAbsent}`, 14, 75);
    
    let currentY = 90;

    // Generate table for each prayer
    prayerAbsentStudents.forEach((prayerData, index) => {
      // Check if we need a new page
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      // Prayer header
      doc.setFontSize(16);
      doc.setTextColor(0, 200, 83);
      doc.text(`${prayerData.prayer} - ${prayerData.absentStudents.length} Absent`, 14, currentY);
      currentY += 10;

      if (prayerData.absentStudents.length === 0) {
        doc.setFontSize(11);
        doc.setTextColor(0, 150, 0);
        doc.text("No absent students", 14, currentY);
        currentY += 15;
      } else {
        // Create table data
        const tableData = prayerData.absentStudents.map((student, idx) => [
          (idx + 1).toString(),
          student.name,
          student.className,
          new Date(student.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          student.reason || "-"
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [["#", "Student Name", "Class", "Date", "Reason"]],
          body: tableData,
          theme: "striped",
          headStyles: { 
            fillColor: [220, 38, 38], 
            fontSize: 10, 
            fontStyle: "bold",
            textColor: [255, 255, 255]
          },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 45 },
            2: { cellWidth: 30 },
            3: { cellWidth: 35 },
            4: { cellWidth: 60 },
          },
          margin: { left: 14 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount} - Caliph Attendance System`,
        105,
        285,
        { align: "center" }
      );
    }

    doc.save(`All_Class_Summary_${periodLabel.replace(/\s/g, "_")}_${currentDate.toISOString().split("T")[0]}.pdf`);
  };

  // Generate Comprehensive Monthly Report for Director
  const generateMonthlyDirectorReport = () => {
    const doc = new jsPDF();
    const currentDate = new Date();
    const monthName = new Date(startDate).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    
    // Header/Title Page
    doc.setFontSize(24);
    doc.setTextColor(0, 200, 83);
    doc.text("MONTHLY ATTENDANCE REPORT", 105, 30, { align: "center" });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Caliph Attendance System", 105, 40, { align: "center" });
    
    doc.setFontSize(14);
    doc.text(`Report Period: ${monthName}`, 105, 50, { align: "center" });
    doc.text(`Generated: ${currentDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, 105, 58, { align: "center" });
    
    // Executive Summary
    const totalRecords = allAttendance.length;
    const totalPresent = allAttendance.filter(a => a.status === "present").length;
    const totalAbsent = allAttendance.filter(a => a.status === "absent").length;
    const overallPercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;
    
    doc.setFontSize(16);
    doc.setTextColor(0, 200, 83);
    doc.text("EXECUTIVE SUMMARY", 14, 75);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Classes: ${classes.length}`, 14, 85);
    doc.text(`Total Students: ${students.length}`, 14, 92);
    doc.text(`Total Attendance Records: ${totalRecords}`, 14, 99);
    doc.text(`Total Present: ${totalPresent} (${overallPercentage}%)`, 14, 106);
    doc.text(`Total Absent: ${totalAbsent}`, 14, 113);
    
    // Prayer-wise Detailed Summary
    doc.setFontSize(16);
    doc.setTextColor(0, 200, 83);
    doc.text("PRAYER-WISE ATTENDANCE", 14, 130);
    
    const prayerData = prayerSummary.map(p => [
      p.prayer,
      p.present.toString(),
      p.absent.toString(),
      p.total.toString(),
      p.total > 0 ? `${Math.round((p.present / p.total) * 100)}%` : "0%"
    ]);

    autoTable(doc, {
      startY: 135,
      head: [["Prayer", "Present", "Absent", "Total", "Attendance %"]],
      body: prayerData,
      theme: "striped",
      headStyles: { fillColor: [0, 200, 83], fontSize: 11, fontStyle: "bold" },
      styles: { fontSize: 10 },
    });

    // Class-wise Performance
    let currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setTextColor(0, 200, 83);
    doc.text("CLASS-WISE PERFORMANCE", 14, currentY);
    
    const classData = classSummary.map(c => [
      c.className,
      c.present.toString(),
      c.total.toString(),
      c.total > 0 ? `${Math.round((c.present / c.total) * 100)}%` : "0%"
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [["Class Name", "Total Present", "Total Records", "Attendance %"]],
      body: classData,
      theme: "striped",
      headStyles: { fillColor: [0, 200, 83], fontSize: 11, fontStyle: "bold" },
      styles: { fontSize: 10 },
    });

    // Student Performance - New Page
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 200, 83);
    doc.text("STUDENT ATTENDANCE DETAILS", 14, 20);
    
    const studentData = studentSummary
      .sort((a, b) => b.percentage - a.percentage) // Sort by attendance percentage
      .map((s, index) => [
        (index + 1).toString(),
        s.name,
        s.className,
        s.present.toString(),
        s.total.toString(),
        `${s.percentage}%`
      ]);

    autoTable(doc, {
      startY: 25,
      head: [["#", "Student Name", "Class", "Present", "Total", "Attendance %"]],
      body: studentData,
      theme: "striped",
      headStyles: { fillColor: [0, 200, 83], fontSize: 11, fontStyle: "bold" },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 },
      },
    });

    // Top Performers
    currentY = (doc as any).lastAutoTable.finalY + 15;
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(0, 200, 83);
    doc.text("TOP 10 STUDENTS (By Attendance %)", 14, currentY);
    
    const topStudents = [...studentSummary]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10)
      .map((s, index) => [
        (index + 1).toString(),
        s.name,
        s.className,
        `${s.percentage}%`
      ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [["Rank", "Student Name", "Class", "Attendance %"]],
      body: topStudents,
      theme: "grid",
      headStyles: { fillColor: [0, 200, 83], fontSize: 10, fontStyle: "bold" },
      styles: { fontSize: 9 },
    });

    // Students Needing Attention (Below 80%)
    currentY = (doc as any).lastAutoTable.finalY + 15;
    const lowAttendanceStudents = studentSummary
      .filter(s => s.percentage < 80 && s.total > 0)
      .sort((a, b) => a.percentage - b.percentage)
      .map(s => [
        s.name,
        s.className,
        `${s.percentage}%`,
        `${s.present}/${s.total}`
      ]);

    if (lowAttendanceStudents.length > 0) {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(255, 0, 0);
      doc.text("STUDENTS NEEDING ATTENTION (Below 80%)", 14, currentY);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Student Name", "Class", "Attendance %", "Present/Total"]],
        body: lowAttendanceStudents,
        theme: "grid",
        headStyles: { fillColor: [255, 100, 100], fontSize: 10, fontStyle: "bold" },
        styles: { fontSize: 9 },
      });
    }

    // Footer on last page
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
      doc.text("Caliph Attendance System - Confidential Report", 105, 285, { align: "center" });
    }

    // Save PDF
    const filename = `Monthly_Attendance_Report_${monthName.replace(" ", "_")}.pdf`;
    doc.save(filename);
  };

  // Generate Comprehensive Weekly Report for Director
  const generateWeeklyDirectorReport = () => {
    const doc = new jsPDF();
    const currentDate = new Date();
    const weekStart = new Date(startDate);
    const weekEnd = new Date(endDate);
    const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    
    // Header/Title Page
    doc.setFontSize(24);
    doc.setTextColor(0, 200, 83);
    doc.text("WEEKLY ATTENDANCE REPORT", 105, 30, { align: "center" });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Caliph Attendance System", 105, 40, { align: "center" });
    
    doc.setFontSize(14);
    doc.text(`Report Period: ${weekLabel}`, 105, 50, { align: "center" });
    doc.text(`Generated: ${currentDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, 105, 58, { align: "center" });
    
    // Executive Summary
    const totalRecords = allAttendance.length;
    const totalPresent = allAttendance.filter(a => a.status === "present").length;
    const totalAbsent = allAttendance.filter(a => a.status === "absent").length;
    const overallPercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;
    
    doc.setFontSize(16);
    doc.setTextColor(0, 200, 83);
    doc.text("EXECUTIVE SUMMARY", 14, 75);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Classes: ${classes.length}`, 14, 85);
    doc.text(`Total Students: ${students.length}`, 14, 92);
    doc.text(`Total Attendance Records: ${totalRecords}`, 14, 99);
    doc.text(`Total Present: ${totalPresent} (${overallPercentage}%)`, 14, 106);
    doc.text(`Total Absent: ${totalAbsent}`, 14, 113);
    
    // Prayer-wise Detailed Summary
    doc.setFontSize(16);
    doc.setTextColor(0, 200, 83);
    doc.text("PRAYER-WISE ATTENDANCE", 14, 130);
    
    const prayerData = prayerSummary.map(p => [
      p.prayer,
      p.present.toString(),
      p.absent.toString(),
      p.total.toString(),
      p.total > 0 ? `${Math.round((p.present / p.total) * 100)}%` : "0%"
    ]);

    autoTable(doc, {
      startY: 135,
      head: [["Prayer", "Present", "Absent", "Total", "Attendance %"]],
      body: prayerData,
      theme: "striped",
      headStyles: { fillColor: [0, 200, 83], fontSize: 11, fontStyle: "bold" },
      styles: { fontSize: 10 },
    });

    // Class-wise Performance
    let currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setTextColor(0, 200, 83);
    doc.text("CLASS-WISE PERFORMANCE", 14, currentY);
    
    const classData = classSummary.map(c => [
      c.className,
      c.present.toString(),
      c.total.toString(),
      c.total > 0 ? `${Math.round((c.present / c.total) * 100)}%` : "0%"
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [["Class Name", "Total Present", "Total Records", "Attendance %"]],
      body: classData,
      theme: "striped",
      headStyles: { fillColor: [0, 200, 83], fontSize: 11, fontStyle: "bold" },
      styles: { fontSize: 10 },
    });

    // Student Performance - New Page
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(0, 200, 83);
    doc.text("STUDENT ATTENDANCE DETAILS", 14, 20);
    
    const studentData = studentSummary
      .sort((a, b) => b.percentage - a.percentage)
      .map((s, index) => [
        (index + 1).toString(),
        s.name,
        s.className,
        s.present.toString(),
        s.total.toString(),
        `${s.percentage}%`
      ]);

    autoTable(doc, {
      startY: 25,
      head: [["#", "Student Name", "Class", "Present", "Total", "Attendance %"]],
      body: studentData,
      theme: "striped",
      headStyles: { fillColor: [0, 200, 83], fontSize: 11, fontStyle: "bold" },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 },
      },
    });

    // Top Performers
    currentY = (doc as any).lastAutoTable.finalY + 15;
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(0, 200, 83);
    doc.text("TOP 10 STUDENTS (By Attendance %)", 14, currentY);
    
    const topStudents = [...studentSummary]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10)
      .map((s, index) => [
        (index + 1).toString(),
        s.name,
        s.className,
        `${s.percentage}%`
      ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [["Rank", "Student Name", "Class", "Attendance %"]],
      body: topStudents,
      theme: "grid",
      headStyles: { fillColor: [0, 200, 83], fontSize: 10, fontStyle: "bold" },
      styles: { fontSize: 9 },
    });

    // Students Needing Attention (Below 80%)
    currentY = (doc as any).lastAutoTable.finalY + 15;
    const lowAttendanceStudents = studentSummary
      .filter(s => s.percentage < 80 && s.total > 0)
      .sort((a, b) => a.percentage - b.percentage)
      .map(s => [
        s.name,
        s.className,
        `${s.percentage}%`,
        `${s.present}/${s.total}`
      ]);

    if (lowAttendanceStudents.length > 0) {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(255, 0, 0);
      doc.text("STUDENTS NEEDING ATTENTION (Below 80%)", 14, currentY);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Student Name", "Class", "Attendance %", "Present/Total"]],
        body: lowAttendanceStudents,
        theme: "grid",
        headStyles: { fillColor: [255, 100, 100], fontSize: 10, fontStyle: "bold" },
        styles: { fontSize: 9 },
      });
    }

    // Footer on all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
      doc.text("Caliph Attendance System - Confidential Report", 105, 285, { align: "center" });
    }

    // Save PDF
    const filename = `Weekly_Attendance_Report_${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}_to_${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).replace(/\//g, "-")}.pdf`;
    doc.save(filename);
  };

  // Generate Standard PDF Report
  const generatePDF = () => {
    // If it's monthly or weekly view, generate the comprehensive director report
    if (selectedTab === "monthly") {
      generateMonthlyDirectorReport();
      return;
    }
    
    if (selectedTab === "weekly") {
      generateWeeklyDirectorReport();
      return;
    }

    // Otherwise, generate standard report
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 200, 83);
    doc.text("Caliph Attendance Report", 105, 20, { align: "center" });
    
    // Date Range
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Period: ${startDate} to ${endDate}`, 105, 30, { align: "center" });
    
    // Prayer Summary
    doc.setFontSize(14);
    doc.setTextColor(0, 200, 83);
    doc.text("Prayer-wise Summary", 14, 45);
    
    const prayerData = prayerSummary.map(p => [
      p.prayer,
      p.present.toString(),
      p.absent.toString(),
      p.total.toString(),
      p.total > 0 ? `${Math.round((p.present / p.total) * 100)}%` : "0%"
    ]);

    autoTable(doc, {
      startY: 50,
      head: [["Prayer", "Present", "Absent", "Total", "Attendance %"]],
      body: prayerData,
      theme: "grid",
      headStyles: { fillColor: [0, 200, 83] },
    });

    // Class Summary
    const finalY1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor(0, 200, 83);
    doc.text("Class-wise Summary", 14, finalY1);

    const classData = classSummary.map(c => [
      c.className,
      c.present.toString(),
      c.total.toString(),
      c.total > 0 ? `${Math.round((c.present / c.total) * 100)}%` : "0%"
    ]);

    autoTable(doc, {
      startY: finalY1 + 5,
      head: [["Class", "Present", "Total", "Attendance %"]],
      body: classData,
      theme: "grid",
      headStyles: { fillColor: [0, 200, 83] },
    });

    // Student Summary
    const finalY2 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor(0, 200, 83);
    doc.text("Student-wise Summary", 14, finalY2);

    const studentData = studentSummary.map(s => [
      s.name,
      s.className,
      s.present.toString(),
      s.total.toString(),
      `${s.percentage}%`
    ]);

    autoTable(doc, {
      startY: finalY2 + 5,
      head: [["Student", "Class", "Present", "Total", "Attendance %"]],
      body: studentData,
      theme: "grid",
      headStyles: { fillColor: [0, 200, 83] },
    });

    // Save PDF
    const filename = `attendance_report_${startDate}_to_${endDate}.pdf`;
    doc.save(filename);
  };

  // Generate Student Detail PDF
  const generateStudentPDF = (student: typeof studentSummary[0]) => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 200, 83);
    doc.text("Student Attendance Report", 105, 20, { align: "center" });
    
    // Student Info
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Student: ${student.name}`, 14, 35);
    doc.text(`Class: ${student.className}`, 14, 42);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 49);
    doc.text(`Overall Attendance: ${student.percentage}%`, 14, 56);
    
    // Attendance Details
    const studentAttendance = allAttendance.filter(a => a.studentId === student.id);
    const attendanceData = studentAttendance.map(a => [
      a.date,
      a.prayer,
      a.status,
      a.reason || "-"
    ]);

    autoTable(doc, {
      startY: 65,
      head: [["Date", "Prayer", "Status", "Reason"]],
      body: attendanceData,
      theme: "grid",
      headStyles: { fillColor: [0, 200, 83] },
    });

    doc.save(`${student.name}_attendance_${startDate}_to_${endDate}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-green-400 to-teal-500 dark:from-emerald-900 dark:via-green-800 dark:to-teal-900 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full opacity-30 blur-md animate-float"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-blue-300 to-teal-400 rounded-3xl opacity-25 blur-md animate-float-delayed"></div>
      </div>

      <div className="sticky top-0 z-50 bg-white/30 dark:bg-gray-900/30 backdrop-blur-3xl border-b border-white/50 dark:border-white/20 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/20 flex-shrink-0"
          >
            <span className="material-icons text-xl sm:text-2xl">arrow_back</span>
          </Button>
          <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white drop-shadow-lg flex-1 text-center px-2">
            Attendance Summary
          </h2>
          <Button
            onClick={generatePDF}
            className="bg-white/95 hover:bg-white text-emerald-600 hover:text-emerald-700 shadow-lg font-bold rounded-xl sm:rounded-2xl flex-shrink-0 px-3 sm:px-4"
          >
            <span className="material-icons text-base sm:text-lg sm:mr-2">download</span>
            <span className="hidden sm:inline">
              {selectedTab === "monthly" 
                ? "Download Monthly Report" 
                : selectedTab === "weekly" 
                  ? "Download Weekly Report" 
                  : "Download PDF"}
            </span>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 relative z-10">
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/30 backdrop-blur-xl border-2 border-white/60 rounded-xl sm:rounded-2xl p-1 sm:p-2">
            <TabsTrigger value="daily" className="rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-600">Daily</TabsTrigger>
            <TabsTrigger value="weekly" className="rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-600">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-600">Monthly</TabsTrigger>
            <TabsTrigger value="custom" className="rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-600">Custom</TabsTrigger>
          </TabsList>

          {/* Custom Date Range Picker */}
          {selectedTab === "custom" && (
            <Card className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 backdrop-blur-2xl border-4 border-emerald-300 dark:border-emerald-600 rounded-2xl sm:rounded-3xl">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-icons text-emerald-600">date_range</span>
                Select Custom Date Range
              </h3>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-end">
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="rounded-lg sm:rounded-xl border-2 border-emerald-300 focus:border-emerald-500 font-semibold text-base"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="rounded-lg sm:rounded-xl border-2 border-emerald-300 focus:border-emerald-500 font-semibold text-base"
                  />
                </div>
              </div>
              {(!customStartDate || !customEndDate) && (
                <div className="mt-3 text-xs sm:text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <span className="material-icons text-sm">info</span>
                  <span>Please select both start and end dates to view the report</span>
                </div>
              )}
            </Card>
          )}

          <TabsContent value={selectedTab} className="space-y-6 mt-6">
            {/* Date Display/Picker */}
            {selectedTab === "daily" ? (
              <Card className="p-4 sm:p-6 bg-white/90 backdrop-blur-2xl border-4 border-white/60 rounded-3xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <span className="material-icons text-3xl text-emerald-600">calendar_today</span>
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Select Date to View</label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <Input
                        type="date"
                        value={selectedDailyDate}
                        onChange={(e) => setSelectedDailyDate(e.target.value)}
                        className="rounded-xl border-2 font-bold text-base sm:text-lg flex-1"
                      />
                      <Button
                        onClick={() => setSelectedDailyDate(new Date().toISOString().split("T")[0])}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl whitespace-nowrap"
                      >
                        <span className="material-icons mr-2">today</span>
                        Today
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-4 bg-white/90 backdrop-blur-2xl border-4 border-white/60 rounded-3xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <span className="material-icons text-xl sm:text-2xl text-emerald-600">calendar_today</span>
                  <div className="flex-1">
                    <div className="text-base sm:text-lg font-bold text-gray-900 break-words">
                      {startDate && new Date(startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      {startDate && endDate && startDate !== endDate && (
                        <>
                          <span className="mx-2">→</span>
                          {new Date(endDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </>
                      )}
                    </div>
                    {selectedTab === "custom" && (
                      <div className="text-xs sm:text-sm text-gray-600 mt-1">
                        {customStartDate || customEndDate ? (
                          <>Custom Range: {customStartDate || "Start"} to {customEndDate || "End"}</>
                        ) : (
                          "Please select start and end dates above"
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Prayer Summary */}
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white drop-shadow-lg mb-3 sm:mb-4">Prayer Attendance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {prayerSummary.map(({ prayer, present, absent, total }) => (
                  <Card key={prayer} className="p-4 sm:p-6 bg-white/90 backdrop-blur-2xl border-2 sm:border-4 border-white/60 rounded-2xl sm:rounded-3xl hover:scale-105 transition-all">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h4 className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900">{prayer}</h4>
                      <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-600">
                        {present}/{total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-2 sm:mb-3">
                      <div
                        className="bg-emerald-500 h-2 sm:h-3 rounded-full transition-all"
                        style={{ width: `${total > 0 ? (present / total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-gray-700">
                      <span className="flex items-center gap-1">
                        <span className="material-icons text-emerald-500 text-sm">check_circle</span>
                        {present} present
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-icons text-red-500 text-sm">cancel</span>
                        {absent} absent
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* All Class Summary - Prayer-wise Absent Students */}
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white drop-shadow-lg flex items-center gap-2" data-testid="heading-all-class-summary">
                  <span className="material-icons text-2xl sm:text-3xl">summarize</span>
                  Attendance Summary
                </h3>
                <Button
                  onClick={generateAllClassSummaryPDF}
                  className="bg-white/90 hover:bg-white text-emerald-600 font-bold rounded-xl sm:rounded-2xl border-2 border-white/60 backdrop-blur-xl"
                  data-testid="button-download-all-class-summary"
                >
                  <span className="material-icons mr-2 text-lg sm:text-xl">download</span>
                  <span className="text-sm sm:text-base">All Class Summary</span>
                </Button>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {prayerAbsentStudents.map(({ prayer, absentStudents }) => (
                  <Card
                    key={prayer}
                    className="overflow-hidden bg-white/90 backdrop-blur-2xl border-2 sm:border-4 border-white/60 rounded-2xl sm:rounded-3xl"
                    data-testid={`card-prayer-${prayer.toLowerCase()}`}
                  >
                    <button
                      onClick={() => togglePrayer(prayer)}
                      className="w-full p-4 sm:p-6 flex items-center justify-between hover-elevate active-elevate-2 transition-all text-left"
                      data-testid={`button-toggle-${prayer.toLowerCase()}`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="material-icons text-2xl sm:text-3xl text-emerald-600">mosque</span>
                        <div>
                          <h4 className="text-lg sm:text-xl md:text-2xl font-extrabold text-gray-900">
                            {prayer}
                          </h4>
                          <p className="text-xs sm:text-sm font-semibold text-gray-600">
                            {absentStudents.length} {absentStudents.length === 1 ? 'student' : 'students'} absent
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-red-100 px-3 sm:px-4 py-2 rounded-xl">
                          <span className="text-xl sm:text-2xl font-extrabold text-red-600">
                            {absentStudents.length}
                          </span>
                        </div>
                        <span className={`material-icons text-2xl sm:text-3xl text-gray-600 transition-transform ${expandedPrayers.has(prayer) ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </div>
                    </button>

                    {expandedPrayers.has(prayer) && (
                      <div className="border-t-2 border-gray-200 bg-gray-50/50 p-4 sm:p-6">
                        {absentStudents.length === 0 ? (
                          <div className="text-center py-6 text-gray-500 font-semibold flex flex-col items-center gap-2">
                            <span className="material-icons text-4xl text-emerald-500">check_circle</span>
                            <p>No absent students for {prayer}</p>
                          </div>
                        ) : (
                          <div className="space-y-2 sm:space-y-3">
                            {absentStudents.map((student, index) => (
                              <div
                                key={`${student.name}-${student.className}-${index}`}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white rounded-xl border-2 border-red-100 hover-elevate"
                                data-testid={`item-absent-student-${index}`}
                              >
                                <div className="flex items-start gap-3 flex-1 mb-2 sm:mb-0">
                                  <span className="material-icons text-red-500 text-xl sm:text-2xl">person_off</span>
                                  <div className="flex-1">
                                    <h5 className="text-base sm:text-lg font-extrabold text-gray-900" data-testid={`text-student-name-${index}`}>
                                      {student.name}
                                    </h5>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-gray-600">
                                        <span className="material-icons text-sm">school</span>
                                        <span data-testid={`text-class-name-${index}`}>Class: {student.className}</span>
                                      </span>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-xs sm:text-sm font-semibold text-gray-500">
                                        {new Date(student.date).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric"
                                        })}
                                      </span>
                                    </div>
                                    {student.reason && (
                                      <div className="mt-2 text-xs sm:text-sm font-semibold text-gray-700 italic bg-amber-50 px-3 py-1 rounded-lg inline-block">
                                        "{student.reason}"
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-8 sm:ml-0">
                                  <span className="px-3 py-1 rounded-full font-bold text-xs sm:text-sm bg-red-100 text-red-700">
                                    ABSENT
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Class Summary */}
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white drop-shadow-lg mb-3 sm:mb-4">Class Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {classSummary.map(({ className, present, total }) => (
                  <Card key={className} className="p-4 sm:p-6 bg-white/90 backdrop-blur-2xl border-2 sm:border-4 border-white/60 rounded-2xl sm:rounded-3xl hover:scale-105 transition-all">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <span className="material-icons text-emerald-600 text-2xl sm:text-3xl">school</span>
                      <h4 className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900">{className}</h4>
                    </div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 mb-2">
                      {total > 0 ? Math.round((present / total) * 100) : 0}%
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-700">
                      {present}/{total} attendance records
                    </p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Student Reports */}
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white drop-shadow-lg">Student Reports</h3>
                <div className="flex items-center gap-2 bg-white/90 backdrop-blur-2xl rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 border-2 border-white/60 w-full sm:w-auto">
                  <span className="material-icons text-gray-600 text-lg sm:text-xl">search</span>
                  <Input
                    type="text"
                    placeholder="Search students..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base font-semibold"
                  />
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <Card className="p-12 bg-white/90 backdrop-blur-2xl border-4 border-white/60 rounded-3xl text-center">
                  <span className="material-icons text-6xl text-gray-400 mb-4">person_search</span>
                  <p className="text-xl font-bold text-gray-600">
                    {studentSearchQuery ? "No students found" : "No attendance records in this period"}
                  </p>
                  <p className="text-sm font-semibold text-gray-500 mt-2">
                    {studentSearchQuery 
                      ? "Try searching with a different name or class" 
                      : "Students will appear here once attendance is recorded"}
                  </p>
            </Card>
              ) : selectedStudent ? (
                // Individual Student Detail View
                <Card className="p-8 bg-white/90 backdrop-blur-2xl border-4 border-white/60 rounded-3xl">
                  <div className="flex items-center justify-between mb-6">
                    <Button
                      onClick={() => setSelectedStudent(null)}
                      variant="ghost"
                      className="text-emerald-600 hover:text-emerald-700 font-bold"
                    >
                      <span className="material-icons mr-2">arrow_back</span>
                      Back to All Students
                    </Button>
                    <Button
                      onClick={() => {
                        const student = filteredStudents.find(s => s.id === selectedStudent.id);
                        if (student) generateStudentPDF(student);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl"
                    >
                      <span className="material-icons mr-2">download</span>
                      Download PDF
                    </Button>
                  </div>

                  <div className="flex items-center gap-6 mb-8 pb-6 border-b-2 border-gray-200">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-4xl font-bold">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-3xl font-extrabold text-gray-900 mb-2">{selectedStudent.name}</h4>
                      <p className="text-lg font-semibold text-gray-600 mb-3">Class: {selectedStudent.className}</p>
                      <div className="flex gap-4">
                        <div className="bg-emerald-50 px-4 py-2 rounded-xl">
                          <span className="text-sm font-semibold text-emerald-700">Overall Attendance</span>
                          <div className="text-2xl font-extrabold text-emerald-600">
                            {filteredStudents.find(s => s.id === selectedStudent.id)?.percentage || 0}%
                          </div>
                        </div>
                        <div className="bg-blue-50 px-4 py-2 rounded-xl">
                          <span className="text-sm font-semibold text-blue-700">Total Records</span>
                          <div className="text-2xl font-extrabold text-blue-600">
                            {filteredStudents.find(s => s.id === selectedStudent.id)?.total || 0}
                          </div>
                        </div>
                        <div className="bg-green-50 px-4 py-2 rounded-xl">
                          <span className="text-sm font-semibold text-green-700">Present</span>
                          <div className="text-2xl font-extrabold text-green-600">
                            {filteredStudents.find(s => s.id === selectedStudent.id)?.present || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Details Table */}
                  <div>
                    <h5 className="text-xl font-extrabold text-gray-900 mb-4">Attendance History</h5>
                    {filteredStudents.find(s => s.id === selectedStudent.id)?.attendance.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 font-semibold">
                        No attendance records for this period
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredStudents
                          .find(s => s.id === selectedStudent.id)
                          ?.attendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((att, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <span className={`material-icons text-2xl ${att.status === "present" ? "text-emerald-500" : "text-red-500"}`}>
                                  {att.status === "present" ? "check_circle" : "cancel"}
                                </span>
                                <div>
                                  <div className="font-bold text-gray-900">
                                    {new Date(att.date).toLocaleDateString("en-US", {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric"
                                    })}
                                  </div>
                                  <div className="text-sm font-semibold text-gray-600">{att.prayer}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span
                                  className={`px-4 py-1 rounded-full font-bold text-sm ${
                                    att.status === "present"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {att.status.toUpperCase()}
                                </span>
                                {att.reason && (
                                  <div className="max-w-xs">
                                    <span className="text-sm font-semibold text-gray-700 italic">"{att.reason}"</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                // Student List View
                <div className="grid grid-cols-1 gap-3">
                  {filteredStudents.map((student) => (
                    <Card
                      key={student.id}
                      className="p-6 bg-white/90 backdrop-blur-2xl border-4 border-white/60 rounded-3xl hover:border-emerald-400 transition-all cursor-pointer group"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xl font-extrabold text-gray-900 group-hover:text-emerald-600 transition-colors">
                              {student.name}
                            </h4>
                            <p className="text-sm font-semibold text-gray-600">{student.className}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-4xl font-extrabold text-emerald-600">{student.percentage}%</div>
                            <div className="text-sm font-semibold text-gray-600 flex items-center gap-2 justify-center mt-1">
                              <span className="flex items-center gap-1">
                                <span className="material-icons text-emerald-500 text-sm">check_circle</span>
                                {student.present}
                              </span>
                              <span className="text-gray-400">|</span>
                              <span className="flex items-center gap-1">
                                <span className="material-icons text-red-500 text-sm">cancel</span>
                                {student.absent}
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-gray-500 mt-1">
                              of {student.total} total
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                generateStudentPDF(student);
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl"
                              size="sm"
                            >
                              <span className="material-icons mr-1 text-sm">download</span>
                              PDF
                            </Button>
                            <span className="text-xs font-semibold text-gray-500 text-center">Click for details</span>
                          </div>
                        </div>
                      </div>
            </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
