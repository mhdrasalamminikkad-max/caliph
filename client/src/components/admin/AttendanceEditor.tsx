import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Pencil, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Attendance, Student } from "@shared/schema";
import { prayers } from "@shared/schema";

export default function AttendanceEditor() {
  const { toast } = useToast();
  const [searchDate, setSearchDate] = useState("");
  const [searchPrayer, setSearchPrayer] = useState("");
  const [searchStudent, setSearchStudent] = useState("");
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [editFormData, setEditFormData] = useState({ status: "", reason: "" });

  const { data: allAttendance, isLoading } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: string; reason?: string } }) =>
      apiRequest(`/api/attendance/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({ title: "Success", description: "Attendance updated successfully" });
      setEditingAttendance(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update attendance", variant: "destructive" });
    },
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/attendance/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({ title: "Success", description: "Attendance record deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete attendance", variant: "destructive" });
    },
  });

  const filteredAttendance = allAttendance?.filter((att) => {
    if (searchDate && att.date !== searchDate) return false;
    if (searchPrayer && att.prayer !== searchPrayer) return false;
    if (searchStudent && !att.studentName.toLowerCase().includes(searchStudent.toLowerCase())) return false;
    return true;
  });

  const handleEdit = (attendance: Attendance) => {
    setEditingAttendance(attendance);
    setEditFormData({ status: attendance.status, reason: attendance.reason || "" });
  };

  const handleUpdate = () => {
    if (!editingAttendance) return;
    updateAttendanceMutation.mutate({
      id: editingAttendance.id,
      data: { status: editFormData.status, reason: editFormData.reason || undefined },
    });
  };

  const handleDelete = (attendance: Attendance) => {
    if (confirm(`Are you sure you want to delete this attendance record for ${attendance.studentName}?`)) {
      deleteAttendanceMutation.mutate(attendance.id);
    }
  };

  return (
    <div className="space-y-4">
      <Card data-testid="card-attendance-editor">
        <CardHeader>
          <CardTitle>Edit Attendance Records</CardTitle>
          <CardDescription>Search for and modify existing attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="searchDate">Date</Label>
                <Input
                  id="searchDate"
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  data-testid="input-search-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="searchPrayer">Prayer</Label>
                <Select value={searchPrayer || "all"} onValueChange={(value) => setSearchPrayer(value === "all" ? "" : value)}>
                  <SelectTrigger data-testid="select-search-prayer">
                    <SelectValue placeholder="All prayers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All prayers</SelectItem>
                    {prayers.map((prayer) => (
                      <SelectItem key={prayer} value={prayer}>
                        {prayer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="searchStudent">Student Name</Label>
                <Input
                  id="searchStudent"
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  placeholder="Search by name..."
                  data-testid="input-search-student"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading attendance records...</div>
            ) : !filteredAttendance || filteredAttendance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchDate || searchPrayer || searchStudent
                  ? "No attendance records match your search criteria."
                  : "No attendance records found."}
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Prayer</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendance.map((att) => (
                      <TableRow key={att.id} data-testid={`row-attendance-${att.id}`}>
                        <TableCell>{new Date(att.date).toLocaleDateString()}</TableCell>
                        <TableCell>{att.prayer}</TableCell>
                        <TableCell>{att.studentName}</TableCell>
                        <TableCell>{att.className}</TableCell>
                        <TableCell>
                          <Badge variant={att.status.toLowerCase() === "present" ? "default" : "destructive"}>
                            {att.status.charAt(0).toUpperCase() + att.status.slice(1).toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{att.reason || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(att)} data-testid={`button-edit-attendance-${att.id}`}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(att)} disabled={deleteAttendanceMutation.isPending} data-testid={`button-delete-attendance-${att.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingAttendance} onOpenChange={(open) => !open && setEditingAttendance(null)}>
        <DialogContent data-testid="dialog-edit-attendance">
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Editing attendance for {editingAttendance?.studentName} on {editingAttendance && new Date(editingAttendance.date).toLocaleDateString()} ({editingAttendance?.prayer})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="editStatus">Status</Label>
              <Select value={editFormData.status} onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}>
                <SelectTrigger data-testid="select-edit-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Present">Present</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editReason">Reason (Optional)</Label>
              <Input
                id="editReason"
                value={editFormData.reason}
                onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
                placeholder="Reason for absence..."
                data-testid="input-edit-reason"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingAttendance(null)} data-testid="button-cancel-edit">
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateAttendanceMutation.isPending} data-testid="button-save-attendance">
                {updateAttendanceMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
