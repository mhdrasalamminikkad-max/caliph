import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Student, Class } from "@shared/schema";
import { prayers } from "@shared/schema";

export default function BackdatedAttendance() {
  const { toast } = useToast();
  const [date, setDate] = useState("");
  const [prayer, setPrayer] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [attendanceData, setAttendanceData] = useState<Record<string, { status: string; reason: string }>>({});

  const { data: classes } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: selectedClass ? [`/api/students/class/${selectedClass}`] : ["no-class"],
    enabled: !!selectedClass,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/attendance", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    },
  });

  const handleSubmit = async () => {
    if (!date || !prayer || !selectedClass) {
      toast({ title: "Error", description: "Please select date, prayer, and class", variant: "destructive" });
      return;
    }

    const studentsToMark = students?.filter(s => attendanceData[s.id]);
    if (!studentsToMark || studentsToMark.length === 0) {
      toast({ title: "Error", description: "Please mark attendance for at least one student", variant: "destructive" });
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const student of studentsToMark) {
      const data = attendanceData[student.id];
      try {
        await markAttendanceMutation.mutateAsync({
          studentId: student.id,
          studentName: student.name,
          className: selectedClass,
          prayer,
          date,
          status: data.status,
          reason: data.reason || undefined,
        });
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    if (errorCount === 0) {
      toast({ title: "Success", description: `Added attendance for ${successCount} students` });
      setAttendanceData({});
      setDate("");
      setPrayer("");
      setSelectedClass("");
    } else {
      toast({
        title: "Partial Success",
        description: `Added ${successCount} records, ${errorCount} failed`,
        variant: errorCount > successCount ? "destructive" : "default",
      });
    }
  };

  const toggleStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      setAttendanceData(prev => ({ ...prev, [studentId]: { status: "Absent", reason: "" } }));
    } else {
      const newData = { ...attendanceData };
      delete newData[studentId];
      setAttendanceData(newData);
    }
  };

  const updateStatus = (studentId: string, status: string) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const updateReason = (studentId: string, reason: string) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: { ...prev[studentId], reason } }));
  };

  return (
    <Card data-testid="card-backdated-attendance">
      <CardHeader>
        <CardTitle>Add Previous Attendance</CardTitle>
        <CardDescription>Add attendance records for past dates when teachers forgot to mark attendance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                data-testid="input-backdated-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prayer">Prayer *</Label>
              <Select value={prayer} onValueChange={setPrayer}>
                <SelectTrigger data-testid="select-backdated-prayer">
                  <SelectValue placeholder="Select prayer" />
                </SelectTrigger>
                <SelectContent>
                  {prayers.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger data-testid="select-backdated-class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedClass && students && students.length > 0 && (
            <div className="space-y-3">
              <Label>Mark Students</Label>
              <div className="border rounded-md p-4 space-y-3 max-h-[400px] overflow-y-auto">
                {students.map((student) => (
                  <div key={student.id} className="flex items-start gap-4 p-3 rounded-md border" data-testid={`student-row-${student.id}`}>
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={!!attendanceData[student.id]}
                      onCheckedChange={(checked) => toggleStudent(student.id, checked as boolean)}
                      data-testid={`checkbox-student-${student.id}`}
                    />
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`student-${student.id}`} className="cursor-pointer font-medium">
                        {student.name} {student.rollNumber && `(${student.rollNumber})`}
                      </Label>
                      {attendanceData[student.id] && (
                        <div className="space-y-2 pl-1">
                          <Select value={attendanceData[student.id].status} onValueChange={(value) => updateStatus(student.id, value)}>
                            <SelectTrigger className="w-[150px]" data-testid={`select-status-${student.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Present">Present</SelectItem>
                              <SelectItem value="Absent">Absent</SelectItem>
                            </SelectContent>
                          </Select>
                          {attendanceData[student.id].status === "Absent" && (
                            <Input
                              value={attendanceData[student.id].reason}
                              onChange={(e) => updateReason(student.id, e.target.value)}
                              placeholder="Reason for absence (optional)"
                              data-testid={`input-reason-${student.id}`}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={markAttendanceMutation.isPending || !date || !prayer || !selectedClass || Object.keys(attendanceData).length === 0} data-testid="button-submit-backdated">
              <Save className="w-4 h-4 mr-2" />
              {markAttendanceMutation.isPending ? "Saving..." : "Save Attendance Records"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
