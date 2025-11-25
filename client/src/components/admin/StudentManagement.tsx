import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Pencil, Trash2, FileSpreadsheet } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BulkStudentImport from "./BulkStudentImport";
import type { Student, Class } from "@shared/schema";

export default function StudentManagement() {
  const { toast } = useToast();
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({ name: "", rollNumber: "", className: "" });

  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const createStudentMutation = useMutation({
    mutationFn: (studentData: typeof formData) => apiRequest("/api/students", "POST", studentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Success", description: "Student added successfully" });
      setIsAddStudentOpen(false);
      setFormData({ name: "", rollNumber: "", className: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add student", variant: "destructive" });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof formData> }) =>
      apiRequest(`/api/students/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Success", description: "Student updated successfully" });
      setEditingStudent(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update student", variant: "destructive" });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/students/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Success", description: "Student deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete student", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.className) {
      toast({ title: "Error", description: "Name and class are required", variant: "destructive" });
      return;
    }

    if (editingStudent) {
      updateStudentMutation.mutate({ id: editingStudent.id, data: formData });
    } else {
      createStudentMutation.mutate(formData);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({ name: student.name, rollNumber: student.rollNumber || "", className: student.className });
  };

  const handleDelete = (student: Student) => {
    if (confirm(`Are you sure you want to delete "${student.name}"? This will also delete all attendance records for this student.`)) {
      deleteStudentMutation.mutate(student.id);
    }
  };

  return (
    <div className="space-y-6" data-testid="student-management-container">
      <div>
        <h2 className="text-2xl font-bold">Student Management</h2>
        <p className="text-muted-foreground">Manage students individually or import in bulk from Excel</p>
      </div>

      <Tabs defaultValue="individual" className="w-full">
        <TabsList data-testid="tabs-student-management">
          <TabsTrigger value="individual" data-testid="tab-individual">
            <UserPlus className="w-4 h-4 mr-2" />
            Individual
          </TabsTrigger>
          <TabsTrigger value="bulk" data-testid="tab-bulk-import">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Bulk Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="mt-4">
          <Card data-testid="card-student-management">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student List</CardTitle>
                  <CardDescription>Add and edit student information</CardDescription>
                </div>
                <Dialog open={isAddStudentOpen || !!editingStudent} onOpenChange={(open) => {
                  setIsAddStudentOpen(open);
                  if (!open) {
                    setEditingStudent(null);
                    setFormData({ name: "", rollNumber: "", className: "" });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-student">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="dialog-student-form">
                    <DialogHeader>
                      <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
                      <DialogDescription>
                        {editingStudent ? "Update student information" : "Add a new student to the system"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Student name"
                          data-testid="input-student-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rollNumber">Roll Number</Label>
                        <Input
                          id="rollNumber"
                          value={formData.rollNumber}
                          onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                          placeholder="Optional roll number"
                          data-testid="input-roll-number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="className">Class *</Label>
                        <Select value={formData.className} onValueChange={(value) => setFormData({ ...formData, className: value })}>
                          <SelectTrigger data-testid="select-class">
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes?.map((cls) => (
                              <SelectItem key={cls.id} value={cls.name}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                          setIsAddStudentOpen(false);
                          setEditingStudent(null);
                          setFormData({ name: "", rollNumber: "", className: "" });
                        }} data-testid="button-cancel">
                          Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={createStudentMutation.isPending || updateStudentMutation.isPending} data-testid="button-submit-student">
                          {(createStudentMutation.isPending || updateStudentMutation.isPending) ? "Saving..." : (editingStudent ? "Update" : "Add Student")}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading students...</div>
              ) : !students || students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No students found. Click "Add Student" to add your first student.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.rollNumber || "-"}</TableCell>
                        <TableCell>{student.className}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(student)} data-testid={`button-edit-student-${student.id}`}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(student)} disabled={deleteStudentMutation.isPending} data-testid={`button-delete-student-${student.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="mt-4">
          <BulkStudentImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
