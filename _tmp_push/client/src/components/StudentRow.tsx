import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface StudentRowProps {
  studentId: string;
  studentName: string;
  rollNumber?: string;
  initialStatus?: "present" | "absent" | null;
  initialReason?: string;
  onStatusChange: (status: "present" | "absent", reason?: string) => void;
  onDelete?: () => void;
}

export default function StudentRow({
  studentId,
  studentName,
  rollNumber,
  initialStatus = "present",
  initialReason = "",
  onStatusChange,
  onDelete,
}: StudentRowProps) {
  const [status, setStatus] = useState<"present" | "absent" | null>(initialStatus);
  const [reason, setReason] = useState(initialReason);
  const [showReason, setShowReason] = useState(initialStatus === "absent");

  // Update when parent changes the status (e.g., from Quick Absent)
  useEffect(() => {
    setStatus(initialStatus);
    setReason(initialReason);
    setShowReason(initialStatus === "absent");
  }, [initialStatus, initialReason]);

  const handlePresent = () => {
    setStatus("present");
    setShowReason(false);
    setReason("");
    onStatusChange("present");
  };

  const handleAbsent = () => {
    setStatus("absent");
    setShowReason(true);
    // Save immediately, even without reason
    onStatusChange("absent", reason || "");
  };

  const handleReasonChange = (value: string) => {
    setReason(value);
    if (status === "absent") {
      onStatusChange("absent", value);
    }
  };

  return (
    <div className="mx-2 sm:mx-3 md:mx-4 my-2 sm:my-2.5 md:my-3 bg-white/90 dark:bg-white/10 backdrop-blur-2xl border-2 border-white/60 hover:border-white/90 rounded-xl sm:rounded-2xl group hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] active:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden touch-manipulation">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between min-h-[auto] sm:min-h-[80px] px-3 sm:px-4 md:px-6 py-3 sm:py-4 gap-3 sm:gap-4">
        <div className="flex items-center gap-3 flex-1">
          {rollNumber && (
            <span className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold text-sm sm:text-base rounded-lg shrink-0">
              {rollNumber}
            </span>
          )}
          <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white" data-testid={`text-student-name-${studentId}`}>
            {studentName}
          </span>
        </div>
        <div className="flex items-center gap-2 justify-end">
          {onDelete && (
            <button
              className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-red-500 h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-lg hover:bg-red-50/50 dark:hover:bg-red-950/30 touch-manipulation"
              onClick={onDelete}
              aria-label="Delete student"
            >
              <span className="material-icons text-lg sm:text-xl">delete_outline</span>
            </button>
          )}
          <Button
            variant={status === "present" ? "default" : "outline"}
            size="default"
            onClick={handlePresent}
            data-testid={`button-present-${studentId}`}
            className={status === "present" 
              ? "bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-md hover:shadow-lg active:shadow-md font-bold rounded-lg sm:rounded-xl transition-all duration-200 sm:duration-300 transform hover:scale-[1.02] active:scale-100 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 touch-manipulation" 
              : "border-2 border-gray-300 hover:border-emerald-500 active:border-emerald-600 hover:text-emerald-600 active:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 font-semibold rounded-lg sm:rounded-xl transition-all duration-200 sm:duration-300 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 touch-manipulation"}
          >
            <span className="material-icons text-base sm:text-lg mr-1">check</span>
            <span className="hidden xs:inline sm:inline">Present</span>
            <span className="xs:hidden">P</span>
          </Button>
          <Button
            variant={status === "absent" ? "destructive" : "outline"}
            size="default"
            onClick={handleAbsent}
            data-testid={`button-absent-${studentId}`}
            className={status === "absent"
              ? "bg-red-500 hover:bg-red-600 active:bg-red-700 shadow-md hover:shadow-lg active:shadow-md font-bold rounded-lg sm:rounded-xl transition-all duration-200 sm:duration-300 transform hover:scale-[1.02] active:scale-100 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 touch-manipulation"
              : "border-2 border-gray-300 hover:border-red-500 active:border-red-600 hover:text-red-600 active:text-red-700 hover:bg-red-50 active:bg-red-100 font-semibold rounded-lg sm:rounded-xl transition-all duration-200 sm:duration-300 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 touch-manipulation"}
          >
            <span className="material-icons text-base sm:text-lg mr-1">close</span>
            <span className="hidden xs:inline sm:inline">Absent</span>
            <span className="xs:hidden">A</span>
          </Button>
        </div>
      </div>
      {showReason && (
        <div className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4" style={{ visibility: showReason ? "visible" : "hidden" }}>
          <Textarea
            placeholder="Enter reason for absence..."
            value={reason}
            onChange={(e) => handleReasonChange(e.target.value)}
            className="resize-none h-16 sm:h-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-gray-300 focus:border-red-500 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base touch-manipulation"
            data-testid={`input-reason-${studentId}`}
          />
        </div>
      )}
    </div>
  );
}
