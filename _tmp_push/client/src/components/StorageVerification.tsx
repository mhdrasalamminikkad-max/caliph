import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLocalAttendance, getSyncStatus, syncToFirestore } from "@/lib/hybridStorage";
import { getClasses, getStudents } from "@/lib/offlineApi";
// TODO: Replace with backend availability check when implementing new backend
// import { isFirebaseAvailable } from "@/lib/firebaseConfig";
import type { AttendanceRecord } from "@/lib/hybridStorage";

interface StorageVerificationProps {
  onBack: () => void;
}

export default function StorageVerification({ onBack }: StorageVerificationProps) {
  const [storageData, setStorageData] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkStorage = () => {
    setIsChecking(true);
    
    // Check LocalStorage data
    const attendance = getLocalAttendance();
    const classes = getClasses();
    const students = getStudents();
    const status = getSyncStatus();
    
    // TODO: Replace with backend availability check when implementing new backend
    // const firebaseAvailable = isFirebaseAvailable();
    const firebaseAvailable = false; // LocalStorage only - no backend
    
    // Check LocalStorage keys
    const localStorageKeys = {
      attendance: localStorage.getItem("caliph_attendance_local"),
      classes: localStorage.getItem("caliph_classes"),
      students: localStorage.getItem("caliph_students"),
      customReasons: localStorage.getItem("caliph_custom_reasons"),
      syncQueue: localStorage.getItem("caliph_attendance_sync_queue"),
      initialized: localStorage.getItem("caliph_initialized"),
    };
    
    // Calculate sizes
    const calculateSize = (data: string | null): string => {
      if (!data) return "0 KB";
      const bytes = new Blob([data]).size;
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };
    
    setStorageData({
      attendance: {
        count: attendance.length,
        data: attendance.slice(0, 5), // First 5 records
        totalSize: calculateSize(localStorageKeys.attendance),
        raw: localStorageKeys.attendance
      },
      classes: {
        count: classes.length,
        names: classes.map(c => c.name),
        totalSize: calculateSize(localStorageKeys.classes),
      },
      students: {
        count: students.length,
        sample: students.slice(0, 5), // First 5 students
        totalSize: calculateSize(localStorageKeys.students),
      },
      customReasons: {
        data: localStorageKeys.customReasons ? JSON.parse(localStorageKeys.customReasons) : [],
        totalSize: calculateSize(localStorageKeys.customReasons),
      },
      syncQueue: {
        count: localStorageKeys.syncQueue ? JSON.parse(localStorageKeys.syncQueue).length : 0,
        totalSize: calculateSize(localStorageKeys.syncQueue),
      },
      firebase: {
        available: firebaseAvailable,
        online: navigator.onLine,
      },
      sync: status,
      localStorageKeys: Object.keys(localStorage).filter(k => k.startsWith("caliph_")),
    });
    
    setIsChecking(false);
  };

  useEffect(() => {
    checkStorage();
  }, []);

  const handleTestSync = async () => {
    setIsChecking(true);
    try {
      await syncToFirestore();
      checkStorage(); // Refresh
    } catch (error) {
      console.error("Sync test failed:", error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-400 to-purple-500 dark:from-blue-900 dark:via-indigo-800 dark:to-purple-900 p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full opacity-30 blur-md animate-float"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-purple-300 to-pink-400 rounded-3xl opacity-25 blur-md animate-float-delayed"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <Card className="mb-6 p-6 bg-white/90 backdrop-blur-2xl border-4 border-white/60 rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                📦 Storage Verification
              </h1>
              <p className="text-sm text-gray-600">
                Check where your data is being stored
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={checkStorage} variant="outline" disabled={isChecking}>
                <span className="material-icons mr-2">refresh</span>
                Refresh
              </Button>
              <Button onClick={onBack} variant="ghost">
                <span className="material-icons mr-2">arrow_back</span>
                Back
              </Button>
            </div>
          </div>
        </Card>

        {!storageData ? (
          <Card className="p-12 text-center bg-white/90 backdrop-blur-2xl border-4 border-white/60 rounded-3xl">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Checking storage...</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Firebase Status */}
            <Card className="p-6 bg-white/90 backdrop-blur-2xl border-4 border-white/60 rounded-3xl">
              <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-icons text-blue-600">cloud</span>
                Firebase Status
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl ${storageData.firebase.available ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
                  <div className="text-sm font-semibold text-gray-700 mb-1">Firebase Available</div>
                  <div className={`text-2xl font-extrabold ${storageData.firebase.available ? 'text-green-600' : 'text-red-600'}`}>
                    {storageData.firebase.available ? '✅ Yes' : '❌ No'}
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${storageData.firebase.online ? 'bg-green-50 border-2 border-green-300' : 'bg-yellow-50 border-2 border-yellow-300'}`}>
                  <div className="text-sm font-semibold text-gray-700 mb-1">Online Status</div>
                  <div className={`text-2xl font-extrabold ${storageData.firebase.online ? 'text-green-600' : 'text-yellow-600'}`}>
                    {storageData.firebase.online ? '✅ Online' : '⚠️ Offline'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-300">
                  <div className="text-sm font-semibold text-gray-700 mb-1">Cloud Sync</div>
                  <div className="text-2xl font-extrabold text-blue-600">
                    {!storageData.firebase.available || !storageData.firebase.online ? '⏸️ Paused' : '🔄 Active'}
                  </div>
                </div>
              </div>
              {storageData.firebase.available && storageData.firebase.online && (
                <div className="mt-4">
                  <Button onClick={handleTestSync} disabled={isChecking} className="w-full">
                    <span className="material-icons mr-2">sync</span>
                    {isChecking ? 'Testing Sync...' : 'Test Cloud Sync'}
                  </Button>
                </div>
              )}
            </Card>

            {/* Sync Status */}
            <Card className="p-6 bg-white/90 backdrop-blur-2xl border-4 border-white/60 rounded-3xl">
              <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-icons text-green-600">sync</span>
                Sync Status
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                  <div className="text-sm font-semibold text-gray-700 mb-1">Total Records</div>
                  <div className="text-3xl font-extrabold text-blue-600">{storageData.sync.total}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                  <div className="text-sm font-semibold text-gray-700 mb-1">Synced to Cloud</div>
                  <div className="text-3xl font-extrabold text-green-600">{storageData.sync.synced}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
                  <div className="text-sm font-semibold text-gray-700 mb-1">Pending Sync</div>
                  <div className="text-3xl font-extrabold text-orange-600">{storageData.sync.pending}</div>
                </div>
              </div>
              {storageData.sync.pending > 0 && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    ⚠️ {storageData.sync.pending} record(s) waiting to sync. They will sync automatically within 1 minute.
                  </p>
                </div>
              )}
            </Card>

            {/* Attendance Data */}
            <Card className="p-6 bg-white/90 backdrop-blur-2xl border-4 border-white/60 rounded-3xl">
              <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-icons text-purple-600">event</span>
                Attendance Records
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Total Records:</span>
                  <span className="text-xl font-extrabold text-purple-600">{storageData.attendance.count}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Storage Size:</span>
                  <span className="text-xl font-extrabold text-purple-600">{storageData.attendance.totalSize}</span>
                </div>
                {storageData.attendance.count > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Sample Records (First 5):</p>
                    <div className="space-y-2">
                      {storageData.attendance.data.map((record: AttendanceRecord, idx: number) => (
                        <div key={idx} className="p-3 bg-white border border-purple-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-gray-900">{record.studentName}</div>
                              <div className="text-xs text-gray-600">{record.className} • {record.prayer} • {record.date}</div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${record.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {record.status}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className={`px-2 py-0.5 rounded ${record.synced ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {record.synced ? '✅ Synced' : '⏳ Pending'}
                            </span>
                            <span className="text-gray-500">ID: {record.id.substring(0, 20)}...</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Classes Data */}
            <Card className="p-6 bg-white/90 backdrop-blur-2xl border-4 border-white/60 rounded-3xl">
              <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-icons text-indigo-600">school</span>
                Classes Data
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Total Classes:</span>
                  <span className="text-xl font-extrabold text-indigo-600">{storageData.classes.count}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Storage Size:</span>
                  <span className="text-xl font-extrabold text-indigo-600">{storageData.classes.totalSize}</span>
                </div>
                {storageData.classes.count > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Class Names:</p>
                    <div className="flex flex-wrap gap-2">
                      {storageData.classes.names.map((name: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Students Data */}
            <Card className="p-6 bg-white/90 backdrop-blur-2xl border-4 border-white/60 rounded-3xl">
              <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-icons text-teal-600">people</span>
                Students Data
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Total Students:</span>
                  <span className="text-xl font-extrabold text-teal-600">{storageData.students.count}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Storage Size:</span>
                  <span className="text-xl font-extrabold text-teal-600">{storageData.students.totalSize}</span>
                </div>
                {storageData.students.count > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Sample Students (First 5):</p>
                    <div className="space-y-2">
                      {storageData.students.sample.map((student: any, idx: number) => (
                        <div key={idx} className="p-3 bg-white border border-teal-200 rounded-lg">
                          <div className="font-bold text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-600">{student.className} {student.rollNumber && `• Roll: ${student.rollNumber}`}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* LocalStorage Keys */}
            <Card className="p-6 bg-white/90 backdrop-blur-2xl border-4 border-white/60 rounded-3xl">
              <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-icons text-gray-600">storage</span>
                LocalStorage Keys
              </h2>
              <div className="space-y-2">
                {storageData.localStorageKeys.map((key: string) => {
                  const value = localStorage.getItem(key);
                  const size = value ? new Blob([value]).size : 0;
                  const sizeStr = size < 1024 ? `${size} B` : `${(size / 1024).toFixed(2)} KB`;
                  return (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <code className="text-sm font-mono text-gray-700">{key}</code>
                      <span className="text-sm font-semibold text-gray-600">{sizeStr}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

