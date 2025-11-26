import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getClasses, getStudentsByClass } from "@/lib/offlineApi";
import { saveAttendanceBatch } from "@/lib/hybridStorage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Class, Student } from "@shared/schema";

interface OtherAttendanceProps {
  onBack: () => void;
  onViewSummary?: () => void;
}

// Storage key for custom reasons
const CUSTOM_REASONS_KEY = 'caliph_custom_reasons';

interface CustomReason {
  id: string;
  name: string;
  icon: string;
}

// Predefined reasons/objectives for "Other" attendance (empty - all custom)
const DEFAULT_REASONS: CustomReason[] = [];

function getCustomReasons(): CustomReason[] {
  try {
    const stored = localStorage.getItem(CUSTOM_REASONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCustomReason(name: string, icon: string = "label"): CustomReason {
  const custom = getCustomReasons();
  const newReason: CustomReason = {
    id: `custom-${Date.now()}`,
    name: name.trim(),
    icon
  };
  custom.push(newReason);
  localStorage.setItem(CUSTOM_REASONS_KEY, JSON.stringify(custom));
  return newReason;
}

function deleteCustomReason(id: string): void {
  const custom = getCustomReasons();
  const filtered = custom.filter(reason => reason.id !== id);
  localStorage.setItem(CUSTOM_REASONS_KEY, JSON.stringify(filtered));
}

export default function OtherAttendance({ onBack, onViewSummary }: OtherAttendanceProps) {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [customReasons, setCustomReasons] = useState<CustomReason[]>([]);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [rollNumbers, setRollNumbers] = useState<string>("");
  const [newReasonName, setNewReasonName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load custom reasons
  useEffect(() => {
    const loadedReasons = getCustomReasons();
    setCustomReasons(loadedReasons);
    // Set first reason as selected if available
    if (loadedReasons.length > 0 && !selectedReason) {
      setSelectedReason(loadedReasons[0].id);
    }
  }, []);

  // All reasons combined
  const allReasons = [...DEFAULT_REASONS, ...customReasons];

  const today = new Date().toLocaleDateString("en-US", { 
    weekday: "long", 
    month: "short", 
    day: "numeric" 
  });

  const dateForApi = new Date().toISOString().split('T')[0];

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
    queryKey: ["students", selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      // TODO: Replace with backend API call when implementing new backend
      // const { fetchStudentsFromFirestore } = await import("@/lib/firebaseSync");
      // await fetchStudentsFromFirestore();
      const { getStudentsByClass } = await import("@/lib/offlineApi");
      return getStudentsByClass(selectedClass);
    },
    enabled: !!selectedClass,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data - INSTANT SYNC
  });

  // Auto-select first class
  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0].name);
    }
  }, [classes, selectedClass]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClass) {
        throw new Error("Please select a class");
      }

      if (!selectedReason) {
        throw new Error("Please select a tracking reason");
      }

      if (!rollNumbers.trim()) {
        throw new Error("Please enter roll numbers or student names");
      }

      // Parse roll numbers or names
      const entries = rollNumbers
        .split(/[\s,]+/)
        .map(r => r.trim())
        .filter(r => r.length > 0);

      if (entries.length === 0) {
        throw new Error("Please enter roll numbers or student names");
      }

      // Find students by roll numbers or names (case-insensitive, exact match)
      const presentStudents = students.filter(s => {
        // Check by roll number (exact match)
        if (s.rollNumber && entries.includes(s.rollNumber)) {
          return true;
        }
        
        // Check by name (case-insensitive, exact match only)
        const studentNameLower = s.name.toLowerCase().trim();
        return entries.some(entry => {
          const entryLower = entry.toLowerCase().trim();
          return studentNameLower === entryLower;
        });
      });

      if (presentStudents.length === 0) {
        throw new Error("No students found matching the entered roll numbers or names");
      }

      // Get selected reason name
      const reasonObj = allReasons.find(r => r.id === selectedReason);
      const reasonName = reasonObj?.name || "Other";

      // Create attendance records (all present)
      const attendanceRecords = presentStudents.map(student => ({
        id: `${student.id}-${dateForApi}-Other-${selectedReason}`,
        studentId: student.id,
        studentName: student.name,
        className: selectedClass,
        prayer: "Other",
        date: dateForApi,
        status: "present" as const,
        reason: reasonName, // Store the reason name
        timestamp: new Date().toISOString(),
        synced: false
      }));

      saveAttendanceBatch(attendanceRecords);
      return presentStudents.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      const reasonName = allReasons.find(r => r.id === selectedReason)?.name;
      toast({
        title: "✅ Saved!",
        description: `${reasonName}: ${count} student(s) marked`,
      });
      setRollNumbers("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const totalStudents = students.length;
  const studentsWithRolls = students.filter(s => s.rollNumber).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500 via-orange-400 to-yellow-500 dark:from-amber-900 dark:via-orange-800 dark:to-yellow-900 relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-16 left-16 w-36 h-36 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full opacity-25 blur-lg animate-float"></div>
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
                {allReasons.find(r => r.id === selectedReason)?.name || "Other"}
              </h2>
              <p className="text-xs sm:text-sm md:text-base font-semibold text-white/80 drop-shadow-md">{today}</p>
            </div>
            <div className="w-10 sm:w-12 flex items-center justify-end">
              {onViewSummary && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onViewSummary}
                  className="text-white hover:bg-white/20 active:bg-white/30 backdrop-blur-sm h-10 w-10 sm:h-12 sm:w-12 touch-manipulation"
                  title="View Summary"
                >
                  <span className="material-icons text-xl sm:text-2xl">assessment</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 relative z-10 min-h-screen pb-32">
        {classes.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl p-8 shadow-xl border-2 border-white/60">
              <span className="material-icons text-6xl text-amber-600 mb-4">school</span>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Classes Found</h3>
              <p className="text-gray-600 dark:text-gray-400">Please create a class first from the Classes page</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Reason/Objective Selection */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border-2 border-white/60">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-gray-800 dark:text-white font-bold text-lg">
                  <span className="material-icons text-amber-600">task_alt</span>
                  What are you tracking?
                </label>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-amber-600 border-amber-300 hover:bg-amber-50">
                      <span className="material-icons text-sm mr-1">add</span>
                      Add Custom
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Custom Reason</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Reason Name</label>
                        <Input
                          placeholder="e.g., Prayer Beads Brought, Socks Worn"
                          value={newReasonName}
                          onChange={(e) => setNewReasonName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newReasonName.trim()) {
                              const newReason = saveCustomReason(newReasonName);
                              setCustomReasons([...customReasons, newReason]);
                              setSelectedReason(newReason.id);
                              setNewReasonName("");
                              setDialogOpen(false);
                              toast({
                                title: "Added!",
                                description: `"${newReason.name}" added to others`,
                              });
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            if (newReasonName.trim()) {
                              const newReason = saveCustomReason(newReasonName);
                              setCustomReasons([...customReasons, newReason]);
                              setSelectedReason(newReason.id);
                              setNewReasonName("");
                              setDialogOpen(false);
                              toast({
                                title: "Added!",
                                description: `"${newReason.name}" added to others`,
                              });
                            }
                          }}
                          disabled={!newReasonName.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {allReasons.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-icons text-6xl text-amber-400 mb-3">add_circle_outline</span>
                  <p className="text-gray-600 dark:text-gray-400 font-semibold">
                    No tracking reasons yet. Click "Add Custom" to create one!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {allReasons.map(reason => {
                    const isCustom = reason.id.startsWith('custom-');
                    return (
                      <div key={reason.id} className="relative group">
                        <button
                          onClick={() => setSelectedReason(reason.id)}
                          className={`w-full flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            selectedReason === reason.id
                              ? 'bg-amber-500 border-amber-600 text-white shadow-lg scale-105'
                              : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-amber-400'
                          }`}
                        >
                          <span className="material-icons text-2xl">{reason.icon}</span>
                          <span className="text-xs font-semibold text-center">{reason.name}</span>
                        </button>
                        {isCustom && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete "${reason.name}"?`)) {
                                deleteCustomReason(reason.id);
                                const updatedReasons = getCustomReasons();
                                setCustomReasons(updatedReasons);
                                // Select first available reason or empty string if none
                                if (selectedReason === reason.id) {
                                  setSelectedReason(updatedReasons.length > 0 ? updatedReasons[0].id : "");
                                }
                                toast({
                                  title: "Deleted",
                                  description: `"${reason.name}" removed`,
                                });
                              }
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            title="Delete custom reason"
                          >
                            <span className="material-icons text-sm">close</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Class Selection */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border-2 border-white/60">
              <label className="flex items-center gap-2 text-gray-800 dark:text-white font-bold text-lg mb-3">
                <span className="material-icons text-amber-600">school</span>
                Select Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setRollNumbers(""); // Clear roll numbers when class changes
                }}
                className="w-full bg-white dark:bg-gray-900 border-2 border-amber-300 dark:border-amber-600 rounded-xl p-4 text-lg font-semibold text-gray-800 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 transition-all"
              >
                {classes.map(cls => (
                  <option key={cls.id} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>
              
              {selectedClass && (
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <span className="material-icons text-xs">people</span>
                    <span className="font-semibold">{totalStudents} students</span>
                  </div>
                  {studentsWithRolls > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="material-icons text-xs">badge</span>
                      <span className="font-semibold">{studentsWithRolls} with roll numbers</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Students List Helper */}
            {selectedClass && students.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 backdrop-blur-md rounded-2xl p-4 shadow-xl border-2 border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-gray-800 dark:text-white font-bold text-base">
                    <span className="material-icons text-blue-600">people</span>
                    Students in {selectedClass} (Click to copy)
                  </label>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{students.length} students</span>
                </div>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => {
                        const currentEntries = rollNumbers.trim() ? rollNumbers.split(/[\s,]+/).map(r => r.trim()).filter(r => r.length > 0) : [];
                        const entryToAdd = student.rollNumber || student.name;
                        if (!currentEntries.includes(entryToAdd)) {
                          setRollNumbers(rollNumbers ? `${rollNumbers}, ${entryToAdd}` : entryToAdd);
                        } else {
                          setRollNumbers(rollNumbers);
                        }
                        toast({
                          title: "Added!",
                          description: `${student.name} added to input`,
                        });
                      }}
                      className="bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800/40 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 transition-all hover:scale-105 cursor-pointer"
                      title={`Click to add: ${student.name}${student.rollNumber ? ` (${student.rollNumber})` : ''}`}
                    >
                      {student.rollNumber && (
                        <span className="bg-blue-200 dark:bg-blue-700 px-1.5 rounded font-bold mr-1">
                          {student.rollNumber}
                        </span>
                      )}
                      {student.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  💡 Click any student above to add them to the input field
                </p>
              </div>
            )}

            {/* Roll Number or Name Input */}
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border-2 border-white/60">
              <label className="flex items-center gap-2 text-gray-800 dark:text-white font-bold text-lg mb-3">
                <span className="material-icons text-amber-600">badge</span>
                Enter Roll Numbers or Names ({allReasons.find(r => r.id === selectedReason)?.name})
              </label>
              
              <textarea
                value={rollNumbers}
                onChange={(e) => setRollNumbers(e.target.value)}
                placeholder={`Enter roll numbers OR exact student names for ${allReasons.find(r => r.id === selectedReason)?.name.toLowerCase()}&#10;Examples:&#10;• Roll numbers: 1, 2, 3 or 1 2 3&#10;• Exact names: Ahmed Ali, Fatima Hassan, Mohammed Ibrahim&#10;• Mixed: 1, Ahmed Ali, 3, Fatima Hassan&#10;&#10;These students will be marked as PRESENT for this tracking`}
                className="w-full bg-white dark:bg-gray-900 border-2 border-amber-300 dark:border-amber-600 rounded-xl p-4 text-lg font-mono text-gray-800 dark:text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50 transition-all resize-none"
                rows={8}
              />
              
              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="material-icons text-xs mt-0.5">info</span>
                  <div>
                    <p className="font-semibold">💡 How it works:</p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      <li>Tracking: <strong>{allReasons.find(r => r.id === selectedReason)?.name}</strong></li>
                      <li>Enter <strong>roll numbers OR exact student names</strong> (full name required)</li>
                      <li>You can mix roll numbers and names: <code>1, Ahmed Ali, 3, Fatima Hassan</code></li>
                      <li>Separate entries with spaces, commas, or new lines</li>
                      <li>Names must match <strong>exactly</strong> (case-insensitive, but full name needed)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            {selectedClass && rollNumbers.trim() && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 backdrop-blur-md rounded-2xl p-6 shadow-xl border-2 border-emerald-300 dark:border-emerald-600">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-icons text-emerald-600">preview</span>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">Preview</h3>
                </div>
                
                {(() => {
                  const entries = rollNumbers
                    .split(/[\s,]+/)
                    .map(r => r.trim())
                    .filter(r => r.length > 0);
                  
                  // Find matching students by roll number or name (exact match)
                  const matchingStudents = students.filter(s => {
                    // Check by roll number (exact match)
                    if (s.rollNumber && entries.includes(s.rollNumber)) {
                      return true;
                    }
                    
                    // Check by name (case-insensitive, exact match only)
                    const studentNameLower = s.name.toLowerCase().trim();
                    return entries.some(entry => {
                      const entryLower = entry.toLowerCase().trim();
                      return studentNameLower === entryLower;
                    });
                  });
                  
                  // Find entries that didn't match anything
                  const notFound = entries.filter(entry => {
                    const entryLower = entry.toLowerCase().trim();
                    return !students.some(s => {
                      // Check by roll number (exact match)
                      if (s.rollNumber === entry) return true;
                      
                      // Check by name (case-insensitive, exact match only)
                      const studentNameLower = s.name.toLowerCase().trim();
                      return studentNameLower === entryLower;
                    });
                  });

                  return (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                          <span className="material-icons">{allReasons.find(r => r.id === selectedReason)?.icon}</span>
                          <span className="font-bold text-lg">Tracking: {allReasons.find(r => r.id === selectedReason)?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                          <span className="material-icons">check_circle</span>
                          <span className="font-bold text-lg">{matchingStudents.length} students will be marked</span>
                        </div>
                      </div>
                      
                      {matchingStudents.length > 0 && (
                        <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Students to be marked:</p>
                          <div className="flex flex-wrap gap-2">
                            {matchingStudents.map(student => (
                              <div key={student.id} className="bg-emerald-100 dark:bg-emerald-800 px-3 py-1 rounded-full text-sm font-semibold text-emerald-800 dark:text-emerald-100">
                                {student.name} {student.rollNumber && `(${student.rollNumber})`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {notFound.length > 0 && (
                        <div className="bg-red-100 dark:bg-red-900/30 rounded-xl p-3 border border-red-300 dark:border-red-700">
                          <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">⚠️ Not found:</p>
                          <div className="flex flex-wrap gap-2">
                            {notFound.map((entry, idx) => (
                              <span key={idx} className="bg-red-200 dark:bg-red-800 px-2 py-1 rounded text-xs font-mono text-red-800 dark:text-red-200">
                                {entry}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit Button */}
      {classes.length > 0 && allReasons.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/30 dark:bg-gray-900/30 backdrop-blur-3xl border-t border-white/50 dark:border-white/20 p-4 sm:p-6 md:p-8 shadow-[0_-10px_40px_-10px_rgba(255,165,0,0.3)] z-50 safe-bottom">
          <div className="max-w-4xl mx-auto">
            <Button 
              className="w-full bg-white/95 hover:bg-white active:bg-white/90 text-amber-600 hover:text-amber-700 active:text-amber-800 shadow-[0_10px_30px_-8px_rgba(255,165,0,0.5)] hover:shadow-[0_15px_40px_-8px_rgba(255,165,0,0.6)] active:shadow-[0_8px_25px_-6px_rgba(255,165,0,0.4)] transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 hover:scale-[1.01] active:scale-[0.99] text-base sm:text-lg md:text-xl font-extrabold py-4 sm:py-6 md:py-8 rounded-2xl sm:rounded-[1.75rem] md:rounded-[2rem] border-2 sm:border-3 md:border-4 border-white/60 hover:border-white active:border-white/80 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed" 
              size="lg"
              onClick={() => submitMutation.mutate()}
              disabled={!selectedClass || !selectedReason || !rollNumbers.trim() || submitMutation.isPending}
            >
              <span className="material-icons mr-2 sm:mr-3 text-2xl sm:text-3xl">
                {submitMutation.isPending ? "done_all" : "check_circle"}
              </span>
              <span className="hidden sm:inline">
                {submitMutation.isPending ? "Submitting..." : "Submit Attendance"}
              </span>
              <span className="sm:hidden">
                {submitMutation.isPending ? "Submitting..." : "Submit"}
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

