import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { getClasses, getStudents } from "@/lib/offlineApi";
// TODO: Replace with backend API call when implementing new backend
// import { fetchFromFirestore, getLocalAttendanceByDateRange } from "@/lib/hybridStorage";
import { getLocalAttendanceByDateRange } from "@/lib/hybridStorage";
import type { Class, Student } from "@shared/schema";
import type { AttendanceRecord } from "@/lib/hybridStorage";

interface OtherSummaryPageProps {
  onBack: () => void;
}

export default function OtherSummaryPage({ onBack }: OtherSummaryPageProps) {
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null);

  const { data: classes = [] } = useQuery<Class[]>({
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

  const { data: students = [] } = useQuery<Student[]>({
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

  const { data: allAttendance = [] } = useQuery<AttendanceRecord[]>({
    queryKey: ["other-attendance", startDate, endDate],
    queryFn: async () => {
      // TODO: Replace with backend API call when implementing new backend
      // await fetchFromFirestore(startDate, endDate);
      return getLocalAttendanceByDateRange(startDate, endDate);
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data - INSTANT SYNC
  });

  // Filter only "Other" tracking records (those with reasons)
  const otherRecords = allAttendance.filter(a => a.prayer === "Other" && a.reason);

  // Get unique objectives/reasons
  const objectives = Array.from(new Set(otherRecords.map(r => r.reason!))).filter(Boolean);

  // Calculate objective-wise summary
  const objectiveSummary = objectives.map(objective => {
    const objectiveRecords = otherRecords.filter(r => r.reason === objective);
    const present = objectiveRecords.filter(r => r.status === "present").length;
    const total = objectiveRecords.length;
    return { 
      objective, 
      present, 
      total,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0
    };
  }).sort((a, b) => b.present - a.present);

  // Calculate class-wise summary for objectives
  const classSummary = classes.map(cls => {
    const classRecords = otherRecords.filter(r => r.className === cls.name);
    const present = classRecords.filter(r => r.status === "present").length;
    const total = classRecords.length;
    return { 
      className: cls.name, 
      present, 
      total,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0
    };
  }).filter(c => c.total > 0);

  // Calculate student-wise summary for objectives
  const studentSummary = students
    .map(student => {
      const studentRecords = otherRecords.filter(r => r.studentId === student.id);
      const present = studentRecords.filter(r => r.status === "present").length;
      const total = studentRecords.length;
      return {
        ...student,
        present,
        total,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
        records: studentRecords
      };
    })
    .filter(s => s.total > 0)
    .sort((a, b) => b.percentage - a.percentage);

  const totalRecords = otherRecords.length;
  const totalPresent = otherRecords.filter(r => r.status === "present").length;
  const overallPercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

  // Get detailed records for selected objective
  const selectedObjectiveRecords = selectedObjective 
    ? otherRecords.filter(r => r.reason === selectedObjective)
    : [];

  // Group records by student for the selected objective
  const studentDetailsForObjective = selectedObjective
    ? students
        .map(student => {
          const studentRecords = selectedObjectiveRecords.filter(r => r.studentId === student.id);
          const present = studentRecords.filter(r => r.status === "present").length;
          const total = studentRecords.length;
          return {
            ...student,
            present,
            total,
            percentage: total > 0 ? Math.round((present / total) * 100) : 0,
            records: studentRecords
          };
        })
        .filter(s => s.total > 0)
        .sort((a, b) => b.percentage - a.percentage)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500 via-orange-400 to-yellow-500 dark:from-amber-900 dark:via-orange-800 dark:to-yellow-900 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full opacity-30 blur-md animate-float"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-orange-300 to-red-400 rounded-3xl opacity-25 blur-md animate-float-delayed"></div>
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
            Other Tracking Summary
          </h2>
          <div className="w-10 sm:w-12"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 relative z-10">
        {/* Date Range Selector */}
        <Card className="p-4 sm:p-6 bg-white/90 backdrop-blur-2xl border-4 border-white/60 rounded-2xl sm:rounded-3xl mb-6">
          <h3 className="text-base sm:text-lg font-extrabold text-gray-800 mb-4 flex items-center gap-2">
            <span className="material-icons text-amber-600">date_range</span>
            Select Date Range
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-end">
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg sm:rounded-xl border-2 border-amber-300 focus:border-amber-500 font-semibold"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg sm:rounded-xl border-2 border-amber-300 focus:border-amber-500 font-semibold"
              />
            </div>
            <Button
              onClick={() => {
                setStartDate(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
                setEndDate(new Date().toISOString().split('T')[0]);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              <span className="material-icons mr-2 text-sm">refresh</span>
              Last 30 Days
            </Button>
          </div>
        </Card>

        {/* Overall Stats */}
        <Card className="p-6 bg-white/90 backdrop-blur-2xl border-4 border-white/60 rounded-3xl mb-6">
          <h3 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
            <span className="material-icons text-amber-600">assessment</span>
            Overall Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
              <div className="text-3xl font-extrabold text-amber-600">{totalRecords}</div>
              <div className="text-sm font-semibold text-gray-700">Total Records</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
              <div className="text-3xl font-extrabold text-emerald-600">{totalPresent}</div>
              <div className="text-sm font-semibold text-gray-700">Compliant</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
              <div className="text-3xl font-extrabold text-blue-600">{objectives.length}</div>
              <div className="text-sm font-semibold text-gray-700">Objectives</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
              <div className="text-3xl font-extrabold text-purple-600">{overallPercentage}%</div>
              <div className="text-sm font-semibold text-gray-700">Compliance Rate</div>
            </div>
          </div>
        </Card>

        {otherRecords.length === 0 ? (
          <Card className="p-12 bg-white/90 backdrop-blur-2xl border-4 border-white/60 rounded-3xl text-center">
            <span className="material-icons text-6xl text-gray-400 mb-4">folder_open</span>
            <h3 className="text-xl font-bold text-gray-600 mb-2">No Other Tracking Data</h3>
            <p className="text-sm text-gray-500">No objective tracking records found for the selected date range</p>
          </Card>
        ) : selectedObjective ? (
          /* Detailed view for selected objective */
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedObjective(null)}
                className="bg-white/90 hover:bg-white text-amber-600 border-2 border-amber-400"
              >
                <span className="material-icons mr-2">arrow_back</span>
                Back to All Objectives
              </Button>
              <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white drop-shadow-lg">
                📋 {selectedObjective} - Detailed View
              </h3>
            </div>

            {/* Summary for this objective */}
            <Card className="p-6 bg-white/90 backdrop-blur-2xl border-4 border-amber-300 rounded-3xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
                  <div className="text-3xl font-extrabold text-amber-600">{selectedObjectiveRecords.length}</div>
                  <div className="text-sm font-semibold text-gray-700">Total Records</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <div className="text-3xl font-extrabold text-emerald-600">
                    {selectedObjectiveRecords.filter(r => r.status === "present").length}
                  </div>
                  <div className="text-sm font-semibold text-gray-700">Compliant</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                  <div className="text-3xl font-extrabold text-blue-600">
                    {studentDetailsForObjective.length}
                  </div>
                  <div className="text-sm font-semibold text-gray-700">Students</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                  <div className="text-3xl font-extrabold text-purple-600">
                    {selectedObjectiveRecords.length > 0 ? Math.round((selectedObjectiveRecords.filter(r => r.status === "present").length / selectedObjectiveRecords.length) * 100) : 0}%
                  </div>
                  <div className="text-sm font-semibold text-gray-700">Compliance Rate</div>
                </div>
              </div>
            </Card>

            {/* Student Details */}
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white drop-shadow-lg mb-4">
                👥 Student Details
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {studentDetailsForObjective.map((student) => (
                  <Card
                    key={student.id}
                    className="p-4 sm:p-6 bg-white/90 backdrop-blur-2xl border-2 border-white/60 rounded-2xl hover:border-amber-400 transition-all"
                  >
                    <div className="flex flex-col gap-4">
                      {/* Student Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-lg sm:text-xl font-extrabold text-gray-900">
                              {student.name}
                            </h4>
                            <div className="flex items-center gap-3 text-sm font-semibold text-gray-600">
                              <span className="flex items-center gap-1">
                                <span className="material-icons text-sm">school</span>
                                {student.className}
                              </span>
                              {student.rollNumber && (
                                <span className="flex items-center gap-1">
                                  <span className="material-icons text-sm">badge</span>
                                  Roll: {student.rollNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
                            {student.percentage}%
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-600">
                            {student.present}/{student.total}
                          </div>
                        </div>
                      </div>

                      {/* Records Timeline */}
                      <div className="border-t pt-3">
                        <p className="text-xs sm:text-sm font-bold text-gray-700 mb-2">
                          📅 Record History:
                        </p>
                        <div className="space-y-2">
                          {student.records.map((record, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${
                                record.status === "present"
                                  ? "bg-green-50 border border-green-200"
                                  : "bg-red-50 border border-red-200"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`material-icons text-lg ${
                                  record.status === "present" ? "text-green-600" : "text-red-600"
                                }`}>
                                  {record.status === "present" ? "check_circle" : "cancel"}
                                </span>
                                <div>
                                  <div className="text-xs sm:text-sm font-bold text-gray-900">
                                    {new Date(record.date).toLocaleDateString("en-US", {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric"
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {record.reason}
                                  </div>
                                </div>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                record.status === "present"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}>
                                {record.status === "present" ? "✓ Compliant" : "✗ Not Compliant"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Objective Summary */}
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white drop-shadow-lg mb-3 sm:mb-4">
                📋 Objective-wise Compliance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {objectiveSummary.map(({ objective, present, total, percentage }) => (
                  <Card 
                    key={objective} 
                    className="p-4 sm:p-6 bg-white/90 backdrop-blur-2xl border-2 sm:border-4 border-white/60 hover:border-amber-400 rounded-2xl sm:rounded-3xl hover:scale-105 transition-all cursor-pointer"
                    onClick={() => setSelectedObjective(objective)}
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h4 className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900">{objective}</h4>
                      <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-amber-600">
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-2 sm:mb-3">
                      <div
                        className="bg-amber-500 h-2 sm:h-3 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-gray-700">
                      <span className="flex items-center gap-1">
                        <span className="material-icons text-emerald-500 text-sm">check_circle</span>
                        {present} compliant
                      </span>
                      <span className="text-gray-500">{total} total</span>
                    </div>
                    <div className="mt-3 text-center text-xs text-amber-600 font-bold flex items-center justify-center gap-1">
                      <span className="material-icons text-sm">touch_app</span>
                      Click to view details
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Class Summary */}
            {classSummary.length > 0 && (
              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white drop-shadow-lg mb-3 sm:mb-4">
                  🏫 Class-wise Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {classSummary.map(({ className, present, total, percentage }) => (
                    <Card key={className} className="p-4 sm:p-6 bg-white/90 backdrop-blur-2xl border-2 sm:border-4 border-white/60 rounded-2xl sm:rounded-3xl hover:scale-105 transition-all">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <span className="material-icons text-amber-600 text-2xl sm:text-3xl">school</span>
                        <h4 className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900">{className}</h4>
                      </div>
                      <div className="text-3xl sm:text-4xl font-extrabold text-amber-600 mb-2">
                        {percentage}%
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-700">
                        {present}/{total} records compliant
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Student Summary */}
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white drop-shadow-lg mb-3 sm:mb-4">
                👤 Student Performance
              </h3>
              {studentSummary.length === 0 ? (
                <Card className="p-8 bg-white/90 backdrop-blur-2xl border-4 border-white/60 rounded-3xl text-center">
                  <p className="text-gray-600">No student data available</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {studentSummary.slice(0, 20).map((student) => (
                    <Card
                      key={student.id}
                      className="p-6 bg-white/90 backdrop-blur-2xl border-4 border-white/60 rounded-3xl hover:border-amber-400 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xl font-extrabold text-gray-900">
                              {student.name}
                            </h4>
                            <p className="text-sm font-semibold text-gray-600">{student.className}</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-4xl font-extrabold text-amber-600">{student.percentage}%</div>
                          <div className="text-sm font-semibold text-gray-600">
                            {student.present}/{student.total} compliant
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

