import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getStudentsByClass } from "@/lib/offlineApi";
import { getObjectives, saveObjectiveBatch, type Objective, type ObjectiveRecord } from "@/lib/objectivesApi";
import type { Student } from "@shared/schema";

interface ObjectiveTrackingProps {
  className: string;
  onBack: () => void;
}

export default function ObjectiveTracking({ className, onBack }: ObjectiveTrackingProps) {
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [records, setRecords] = useState<Record<string, "yes" | "no">>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date().toLocaleDateString("en-US", { 
    weekday: "long", 
    month: "short", 
    day: "numeric" 
  });

  const dateForApi = new Date().toISOString().split('T')[0];

  const { data: objectives = [] } = useQuery<Objective[]>({
    queryKey: ["objectives"],
    queryFn: () => Promise.resolve(getObjectives()),
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["students", className],
    queryFn: async () => {
      // TODO: Replace with backend API call when implementing new backend
      // const { fetchStudentsFromFirestore } = await import("@/lib/firebaseSync");
      // await fetchStudentsFromFirestore();
      const { getStudentsByClass } = await import("@/lib/offlineApi");
      return getStudentsByClass(className);
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data - INSTANT SYNC
  });

  // Select first objective by default
  useEffect(() => {
    if (objectives.length > 0 && !selectedObjective) {
      setSelectedObjective(objectives[0]);
    }
  }, [objectives, selectedObjective]);

  // Initialize all students as "yes" (following the objective)
  useEffect(() => {
    if (students.length > 0) {
      setRecords(prev => {
        const initial = { ...prev };
        students.forEach(student => {
          if (!initial[student.id]) {
            initial[student.id] = "yes";
          }
        });
        return initial;
      });
    }
  }, [students]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedObjective) return;

      const objectiveRecords: ObjectiveRecord[] = students.map(student => ({
        id: `${student.id}-${dateForApi}-${selectedObjective.id}`,
        objectiveId: selectedObjective.id,
        objectiveName: selectedObjective.name,
        studentId: student.id,
        studentName: student.name,
        className,
        date: dateForApi,
        status: records[student.id] || "yes",
        timestamp: new Date().toISOString()
      }));

      saveObjectiveBatch(objectiveRecords);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objective-records"] });
      toast({
        title: "✅ Saved!",
        description: `${selectedObjective?.name} tracking recorded`,
      });
      onBack();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleStatus = (studentId: string) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: prev[studentId] === "yes" ? "no" : "yes"
    }));
  };

  const yesCount = Object.values(records).filter(r => r === "yes").length;
  const noCount = students.length - yesCount;

  if (!selectedObjective) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-500 via-orange-400 to-yellow-500 flex items-center justify-center p-4">
        <div className="text-white text-xl font-bold">Loading objectives...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500 via-orange-400 to-yellow-500 dark:from-amber-900 dark:via-orange-800 dark:to-yellow-900 relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-16 left-16 w-36 h-36 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full opacity-25 blur-lg animate-float"></div>
        <div className="absolute bottom-24 right-24 w-44 h-44 bg-gradient-to-br from-orange-300 to-red-400 rounded-3xl opacity-20 blur-lg animate-float-delayed"></div>
      </div>
      
      <div className="sticky top-0 z-50 bg-white/30 dark:bg-gray-900/30 backdrop-blur-3xl border-b border-white/50 dark:border-white/20 shadow-[0_10px_40px_-10px_rgba(255,165,0,0.3)]">
        <div className="max-w-4xl mx-auto p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/20 active:bg-white/30 backdrop-blur-sm h-10 w-10 sm:h-12 sm:w-12 touch-manipulation"
            >
              <span className="material-icons text-xl sm:text-2xl">arrow_back</span>
            </Button>
            <div className="flex flex-col items-center flex-1 px-2 sm:px-4">
              <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-white drop-shadow-lg text-center">
                {selectedObjective.name} - {className}
              </h2>
              <p className="text-xs sm:text-sm md:text-base font-semibold text-white/80 drop-shadow-md">{today}</p>
            </div>
            <div className="w-10 sm:w-12"></div>
          </div>

          {/* Objective Selector */}
          <div className="mb-3">
            <select
              value={selectedObjective.id}
              onChange={(e) => {
                const obj = objectives.find(o => o.id === e.target.value);
                if (obj) setSelectedObjective(obj);
              }}
              className="w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl border-2 border-white/60 p-3 font-bold text-gray-800 dark:text-white"
            >
              {objectives.map(obj => (
                <option key={obj.id} value={obj.id}>
                  {obj.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base">
            <span className="material-icons text-white text-lg sm:text-xl drop-shadow-md">task_alt</span>
            <span className="font-bold text-white drop-shadow-md">
              {yesCount} ✓ / {noCount} ✗
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pb-32 sm:pb-36 md:pb-40 relative z-10 min-h-screen p-4">
        {students.length === 0 ? (
          <div className="text-center py-12 text-white font-bold text-lg">
            No students in this class
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {students.map((student) => {
              const status = records[student.id] || "yes";
              const isYes = status === "yes";

              return (
                <div
                  key={student.id}
                  onClick={() => toggleStatus(student.id)}
                  className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 ${
                    isYes 
                      ? 'border-green-400 hover:border-green-500' 
                      : 'border-red-400 hover:border-red-500'
                  } touch-manipulation active:scale-[0.98]`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold ${
                        isYes ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        <span className="material-icons">
                          {isYes ? 'check' : 'close'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">
                          {student.name}
                        </h3>
                        {student.rollNumber && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                            Roll: {student.rollNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                      isYes 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {isYes ? '✓ Yes' : '✗ No'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {students.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/30 dark:bg-gray-900/30 backdrop-blur-3xl border-t border-white/50 dark:border-white/20 p-4 sm:p-6 md:p-8 shadow-[0_-10px_40px_-10px_rgba(255,165,0,0.3)] z-50 safe-bottom">
          <div className="max-w-4xl mx-auto">
            <Button 
              className="w-full bg-white/95 hover:bg-white active:bg-white/90 text-amber-600 hover:text-amber-700 active:text-amber-800 shadow-[0_10px_30px_-8px_rgba(255,165,0,0.5)] hover:shadow-[0_15px_40px_-8px_rgba(255,165,0,0.6)] active:shadow-[0_8px_25px_-6px_rgba(255,165,0,0.4)] transition-all duration-300 sm:duration-400 md:duration-500 transform hover:-translate-y-1 active:translate-y-0 hover:scale-[1.01] active:scale-[0.99] text-base sm:text-lg md:text-xl font-extrabold py-4 sm:py-6 md:py-8 rounded-2xl sm:rounded-[1.75rem] md:rounded-[2rem] border-2 sm:border-3 md:border-4 border-white/60 hover:border-white active:border-white/80 touch-manipulation" 
              size="lg"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
            >
              <span className="material-icons mr-2 sm:mr-3 text-2xl sm:text-3xl">
                {submitMutation.isPending ? "done_all" : "check_circle"}
              </span>
              <span className="hidden sm:inline">{submitMutation.isPending ? "Saving..." : "Submit Records"}</span>
              <span className="sm:hidden">{submitMutation.isPending ? "Saving..." : "Submit"}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


