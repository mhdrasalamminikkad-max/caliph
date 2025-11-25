import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Class } from "@shared/schema";

export default function ClassManagement() {
  const { toast } = useToast();
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [className, setClassName] = useState("");

  const { data: classes, isLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const createClassMutation = useMutation({
    mutationFn: (name: string) => apiRequest("/api/classes", "POST", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({ title: "Success", description: "Class added successfully" });
      setIsAddClassOpen(false);
      setClassName("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add class", variant: "destructive" });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/classes/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({ title: "Success", description: "Class deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete class", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!className.trim()) {
      toast({ title: "Error", description: "Class name is required", variant: "destructive" });
      return;
    }
    createClassMutation.mutate(className);
  };

  const handleDelete = (cls: Class) => {
    if (confirm(`Are you sure you want to delete "${cls.name}"? This will also delete all students and attendance records for this class.`)) {
      deleteClassMutation.mutate(cls.id);
    }
  };

  return (
    <Card data-testid="card-class-management">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Class Management</CardTitle>
            <CardDescription>Add and manage classes</CardDescription>
          </div>
          <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-class">
                <Plus className="w-4 h-4 mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-add-class">
              <DialogHeader>
                <DialogTitle>Add New Class</DialogTitle>
                <DialogDescription>Add a new class to the system</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="className">Class Name *</Label>
                  <Input
                    id="className"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="e.g., Class 1, Grade 5, etc."
                    data-testid="input-class-name"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddClassOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={createClassMutation.isPending} data-testid="button-submit-class">
                    {createClassMutation.isPending ? "Adding..." : "Add Class"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading classes...</div>
        ) : !classes || classes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No classes found. Click "Add Class" to add your first class.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((cls) => (
                <TableRow key={cls.id} data-testid={`row-class-${cls.id}`}>
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {cls.createdAt ? new Date(cls.createdAt).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleDelete(cls)} disabled={deleteClassMutation.isPending} data-testid={`button-delete-class-${cls.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
