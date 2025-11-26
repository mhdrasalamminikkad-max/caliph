import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ClearAttendanceData() {
  const { toast } = useToast();
  const [confirmStep, setConfirmStep] = useState(0);

  const clearAttendanceMutation = useMutation({
    mutationFn: () => apiRequest("/api/attendance", "DELETE"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({
        title: "Success",
        description: `${data.count} attendance records have been cleared. Classes and students remain intact.`,
      });
      setConfirmStep(0);
      
      // Also clear local storage attendance data
      localStorage.removeItem('caliph_attendance_local');
      localStorage.removeItem('caliph_attendance_sync_queue');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear attendance data",
        variant: "destructive",
      });
      setConfirmStep(0);
    },
  });

  const handleClearClick = () => {
    if (confirmStep === 0) {
      setConfirmStep(1);
    } else if (confirmStep === 1) {
      setConfirmStep(2);
    } else if (confirmStep === 2) {
      clearAttendanceMutation.mutate();
    }
  };

  const handleCancel = () => {
    setConfirmStep(0);
  };

  return (
    <Card data-testid="card-clear-attendance">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-destructive" />
          Clear All Attendance Data
        </CardTitle>
        <CardDescription>
          Remove all attendance records while keeping classes and students
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> This action will permanently delete all attendance records.
            Classes and students will NOT be affected and will remain in the system.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold mb-2">What will be deleted:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>All attendance records (present/absent markings)</li>
              <li>Attendance history for all dates and prayers</li>
              <li>Local storage attendance cache</li>
            </ul>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-semibold mb-2">What will be preserved:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>All classes</li>
              <li>All students</li>
              <li>User accounts</li>
              <li>Custom settings</li>
            </ul>
          </div>
        </div>

        {confirmStep > 0 && (
          <Alert>
            <AlertDescription>
              {confirmStep === 1 && (
                <p className="font-semibold">
                  ⚠️ Step 1/2: Are you sure you want to clear all attendance data?
                </p>
              )}
              {confirmStep === 2 && (
                <p className="font-semibold text-destructive">
                  ⚠️ Step 2/2: This is your last chance! Click "Clear All Attendance" again to confirm permanent deletion.
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 pt-2">
          {confirmStep === 0 ? (
            <Button
              variant="destructive"
              onClick={handleClearClick}
              disabled={clearAttendanceMutation.isPending}
              data-testid="button-start-clear"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Attendance Data
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={clearAttendanceMutation.isPending}
                data-testid="button-cancel-clear"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearClick}
                disabled={clearAttendanceMutation.isPending}
                data-testid="button-confirm-clear"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {clearAttendanceMutation.isPending
                  ? "Clearing..."
                  : confirmStep === 1
                  ? "Continue (1/2)"
                  : "Clear All Attendance (2/2)"}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
