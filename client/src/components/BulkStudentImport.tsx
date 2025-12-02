import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createStudent } from "@/lib/offlineApi";
import * as XLSX from "xlsx";

interface BulkStudentImportProps {
  className: string;
  onSuccess?: () => void;
}

export default function BulkStudentImport({ className, onSuccess }: BulkStudentImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv", // .csv
    ];
    
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an Excel file (.xlsx, .xls) or CSV file (.csv)",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Read file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      
      // Get first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: "" // Default value for empty cells
      }) as any[][];

      if (jsonData.length === 0) {
        throw new Error("File is empty");
      }

      // Parse header row (first row)
      const headerRow = jsonData[0] as string[];
      const nameIndex = headerRow.findIndex(
        (h) => h && typeof h === "string" && 
        (h.toLowerCase().includes("name") || h.toLowerCase().includes("student"))
      );
      const rollIndex = headerRow.findIndex(
        (h) => h && typeof h === "string" && 
        (h.toLowerCase().includes("roll") || h.toLowerCase().includes("number"))
      );

      if (nameIndex === -1) {
        throw new Error("Could not find 'Name' column in the Excel file. Please ensure the first row has a 'Name' column.");
      }

      // Process data rows (skip header)
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const name = row[nameIndex]?.toString().trim();
        const rollNumber = rollIndex !== -1 ? row[rollIndex]?.toString().trim() : undefined;

        if (!name || name === "") {
          continue; // Skip empty rows
        }

        try {
          await createStudent(name, className, rollNumber || undefined);
          successCount++;
          console.log(`✅ Imported student: ${name}`);
        } catch (error: any) {
          errorCount++;
          const errorMsg = error.message || "Unknown error";
          errors.push(`${name}: ${errorMsg}`);
          
          // Log but don't stop processing
          console.warn(`❌ Failed to import student "${name}":`, errorMsg);
        }
      }

      // Show results
      if (successCount > 0) {
        toast({
          title: "✅ Import Successful!",
          description: `Imported ${successCount} student(s)${errorCount > 0 ? `. ${errorCount} error(s) occurred.` : ""}`,
        });
        
        console.log(`✅ Bulk import complete: ${successCount} students imported for class "${className}"`);
        
        // Call onSuccess callback to refresh the UI
        if (onSuccess) {
          console.log('Calling onSuccess callback to refresh student list...');
          onSuccess();
        }
      } else {
        toast({
          title: "⚠️ Import Failed",
          description: errorCount > 0 
            ? `No students were imported. Errors: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? "..." : ""}`
            : "No valid student data found in the file.",
          variant: "destructive",
        });
      }

      // Show detailed errors if any
      if (errors.length > 0 && errors.length <= 5) {
        console.warn("Import errors:", errors);
      }

    } catch (error: any) {
      console.error("Error importing file:", error);
      toast({
        title: "❌ Import Failed",
        description: error.message || "An error occurred while processing the file. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        type="file"
        accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
        onChange={handleFileUpload}
        disabled={isProcessing}
        style={{ display: "none" }}
        id="bulk-import-file-input"
        ref={fileInputRef}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="bg-white/95 hover:bg-white active:bg-white/90 text-emerald-600 hover:text-emerald-700 font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
        variant="outline"
      >
        <span className="material-icons mr-2">upload_file</span>
        {isProcessing ? "Processing..." : "Import from Excel"}
      </Button>
      <p className="text-xs text-white/70 text-center px-2">
        Excel format: First row should have "Name" and optionally "Roll Number" columns
      </p>
    </div>
  );
}

