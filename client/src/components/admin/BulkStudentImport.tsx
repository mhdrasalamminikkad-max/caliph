import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import type { Class } from "@shared/schema";

interface StudentRow {
  name: string;
  rollNumber?: string;
  className: string;
}

export default function BulkStudentImport() {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const { data: classes } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (studentData: StudentRow[]) => 
      apiRequest("/api/students/bulk", "POST", { students: studentData }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ 
        title: "Success", 
        description: `${data.created} students imported successfully` 
      });
      // Reset form
      setFile(null);
      setStudents([]);
      setSelectedClass("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to import students", 
        variant: "destructive" 
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        
        // Read first sheet
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        // Validate and parse data
        const validationErrors: string[] = [];
        const parsedStudents: StudentRow[] = [];

        // Skip header row, process data rows
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          // Skip empty rows
          if (!row || row.length === 0 || !row[0]) continue;

          const name = row[0]?.toString().trim();
          const rollNumber = row[1]?.toString().trim();
          const className = row[2]?.toString().trim();

          if (!name) {
            validationErrors.push(`Row ${i + 1}: Student name is required`);
            continue;
          }

          if (!className && !selectedClass) {
            validationErrors.push(`Row ${i + 1}: Class is required (either in Excel or selected above)`);
            continue;
          }

          parsedStudents.push({
            name,
            rollNumber: rollNumber || undefined,
            className: className || selectedClass,
          });
        }

        setStudents(parsedStudents);
        setErrors(validationErrors);

        if (parsedStudents.length > 0) {
          toast({
            title: "File Parsed",
            description: `Found ${parsedStudents.length} student(s) ready to import`,
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to parse Excel file. Please check the format.",
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = () => {
    if (students.length === 0) {
      toast({
        title: "Error",
        description: "No students to import",
        variant: "destructive",
      });
      return;
    }

    bulkCreateMutation.mutate(students);
  };

  const handleRemoveStudent = (index: number) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const downloadTemplate = () => {
    // Create template Excel file
    const template = [
      ["Name", "Roll Number", "Class"],
      ["John Doe", "001", "Class 1"],
      ["Jane Smith", "002", "Class 1"],
      ["Ahmed Ali", "003", "Class 2"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student_import_template.xlsx");
  };

  return (
    <Card data-testid="card-bulk-import">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Bulk Student Import
        </CardTitle>
        <CardDescription>
          Import multiple students from an Excel file. Download the template to see the required format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Excel Format:</strong> Column A = Name (required), Column B = Roll Number (optional), Column C = Class (required if not selected below)
          </AlertDescription>
        </Alert>

        {/* Download Template */}
        <div>
          <Button
            variant="outline"
            onClick={downloadTemplate}
            data-testid="button-download-template"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* Default Class Selection */}
        <div className="space-y-2">
          <Label htmlFor="defaultClass">Default Class (Optional)</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger data-testid="select-default-class">
              <SelectValue placeholder="Select default class for all students" />
            </SelectTrigger>
            <SelectContent>
              {classes?.map((cls) => (
                <SelectItem key={cls.id} value={cls.name}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            If selected, all students without a class in the Excel will use this class
          </p>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="excelFile">Upload Excel File</Label>
          <Input
            id="excelFile"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            data-testid="input-excel-file"
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name}
            </p>
          )}
        </div>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Validation Errors:</strong>
              <ul className="list-disc list-inside mt-2">
                {errors.slice(0, 5).map((error, i) => (
                  <li key={i} className="text-sm">{error}</li>
                ))}
                {errors.length > 5 && (
                  <li className="text-sm">... and {errors.length - 5} more errors</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Preview Table */}
        {students.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Preview ({students.length} students)</Label>
              <Button
                onClick={handleImport}
                disabled={bulkCreateMutation.isPending}
                data-testid="button-import-students"
              >
                <Upload className="w-4 h-4 mr-2" />
                {bulkCreateMutation.isPending ? "Importing..." : `Import ${students.length} Students`}
              </Button>
            </div>
            <div className="border rounded-md max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="w-20">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => (
                    <TableRow key={index} data-testid={`row-preview-${index}`}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.rollNumber || "-"}</TableCell>
                      <TableCell>{student.className}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStudent(index)}
                          data-testid={`button-remove-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Success State */}
        {students.length === 0 && file && errors.length === 0 && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              No students found in the file. Make sure your Excel file has data starting from row 2.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
