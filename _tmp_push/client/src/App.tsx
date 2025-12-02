import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import HomePage from "@/components/HomePage";
import ClassSelection from "@/components/ClassSelection";
import AttendanceList from "@/components/AttendanceList";
import SummaryPage from "@/components/SummaryPage";
import ClassOverview from "@/components/ClassOverview";
import StudentReport from "@/components/StudentReport";
import LoginPage from "@/components/LoginPage";
import OtherAttendance from "@/components/OtherAttendance";
import OtherSummaryPage from "@/components/OtherSummaryPage";
import SyncStatusIndicator from "@/components/SyncStatusIndicator";
import { Prayer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { initializeSyncListeners } from "@/lib/hybridStorage";
import { initializeMobileStorage } from "@/lib/mobileStorage";
import { initializeSeedData } from "@/lib/offlineApi";
import { connectWebSocket, disconnectWebSocket, isWebSocketConnected } from "@/lib/websocketClient";

type View = 
  | { type: "home" }
  | { type: "class-selection"; prayer: Prayer }
  | { type: "attendance"; prayer: Prayer; className: string }
  | { type: "summary" }
  | { type: "class-overview" }
  | { type: "student-report" }
  | { type: "manage-students"; className: string }
  | { type: "other-attendance" }
  | { type: "other-summary" };

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [view, setView] = useState<View>({ type: "home" });

  // Check authentication on mount
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    setIsAuthenticated(authStatus === "true");
    setIsCheckingAuth(false);
  }, []);

  // Initialize mobile storage and hybrid storage sync listeners
  useEffect(() => {
    console.log("🚀 Initializing Mobile Storage & Hybrid Storage");
    
    // Initialize mobile storage cleanup and quota checking
    initializeMobileStorage();
    
    // Initialize backend sync and storage
    const updateCallback = () => {
      // This callback is triggered when data updates
      // Invalidate ALL related queries for INSTANT updates
      console.log("🔄 Data update detected - refreshing UI");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["class-students"] });
      queryClient.invalidateQueries({ queryKey: ["other-attendance"] });
    };
    
    // Initialize seed data (only if empty)
    initializeSeedData().then(() => {
      console.log("✅ Seed data initialization complete");
    }).catch(err => {
      console.warn("⚠️ Seed data initialization failed (non-critical):", err);
    });
    
    // Initialize attendance sync listeners (uses backend API)
    initializeSyncListeners(updateCallback);
    
    // Connect to WebSocket for real-time updates
    connectWebSocket(
      () => {
        console.log('✅ Real-time sync connected');
        // Refresh data when connected
        updateCallback();
      },
      () => {
        console.warn('⚠️ Real-time sync disconnected');
      }
    );
    
    // Mobile-specific: Handle visibility change (when app is reopened)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("📱 App reopened - checking storage and sync status");
        // Re-check storage availability on mobile
        initializeMobileStorage();
        // Reconnect WebSocket if disconnected
        if (!isWebSocketConnected()) {
          connectWebSocket(
            () => {
              console.log('✅ Real-time sync reconnected');
              updateCallback();
            },
            () => {
              console.warn('⚠️ Real-time sync reconnection failed');
            }
          );
        }
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Mobile-specific: Handle page focus (when switching back to app)
    const handleFocus = () => {
      console.log("📱 App focused - refreshing storage check");
      initializeMobileStorage();
    };
    
    window.addEventListener("focus", handleFocus);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      disconnectWebSocket();
    };
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
    setView({ type: "home" });
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-green-400 to-teal-500 flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LoginPage onLogin={handleLogin} />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  const renderView = () => {
    switch (view.type) {
      case "home":
        return (
          <div className="relative pb-20 sm:pb-0">
            <div className="absolute top-4 right-4 z-10 hidden sm:flex gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setView({ type: "summary" })}
                className="gap-1 sm:gap-2 text-white border-white/60 hover:bg-white/20 backdrop-blur-sm"
              >
                <span className="material-icons text-base sm:text-lg">assessment</span>
                Summary
              </Button>
              <Button
                variant="outline"
                onClick={() => setView({ type: "class-overview" })}
                className="gap-1 sm:gap-2 text-white border-white/60 hover:bg-white/20 backdrop-blur-sm"
              >
                <span className="material-icons text-base sm:text-lg">school</span>
                Classes
              </Button>
              <Button
                variant="outline"
                onClick={() => setView({ type: "student-report" })}
                className="gap-1 sm:gap-2 text-white border-white/60 hover:bg-white/20 backdrop-blur-sm"
              >
                <span className="material-icons text-base sm:text-lg">person</span>
                Students
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="gap-1 sm:gap-2 text-white border-white/60 hover:bg-white/20 backdrop-blur-sm"
              >
                <span className="material-icons text-base sm:text-lg">logout</span>
                Logout
              </Button>
            </div>
            <HomePage 
              onPrayerSelect={(prayer) => setView({ type: "class-selection", prayer })} 
              onObjectivesClick={() => setView({ type: "other-attendance" })}
            />
          </div>
        );
      
      case "class-selection":
        return (
          <ClassSelection
            prayer={view.prayer}
            onClassSelect={(className) => 
              setView({ type: "attendance", prayer: view.prayer, className })
            }
            onBack={() => setView({ type: "home" })}
          />
        );
      
      case "attendance":
        return (
          <AttendanceList
            prayer={view.prayer}
            className={view.className}
            onBack={() => setView({ type: "class-selection", prayer: view.prayer })}
          />
        );
      
      case "summary":
        return (
          <div className="pb-20 sm:pb-0">
            <SummaryPage onBack={() => setView({ type: "home" })} />
          </div>
        );
      
      case "class-overview":
        return (
          <div className="pb-20 sm:pb-0">
            <ClassOverview 
              onBack={() => setView({ type: "home" })} 
              onClassClick={(className) => setView({ type: "manage-students", className })}
            />
          </div>
        );
      
      case "student-report":
        return (
          <div className="pb-20 sm:pb-0">
            <StudentReport onBack={() => setView({ type: "home" })} />
          </div>
        );
      
      case "manage-students":
        return (
          <AttendanceList
            prayer="Dhuhr"
            className={view.className}
            onBack={() => setView({ type: "class-overview" })}
          />
        );
      
      case "other-attendance":
        return (
          <OtherAttendance
            onBack={() => setView({ type: "home" })}
            onViewSummary={() => setView({ type: "other-summary" })}
          />
        );
      
      case "other-summary":
        return (
          <OtherSummaryPage
            onBack={() => setView({ type: "other-attendance" })}
          />
        );
      
      default:
        return <HomePage 
          onPrayerSelect={(prayer) => setView({ type: "class-selection", prayer })} 
          onObjectivesClick={() => setView({ type: "other-attendance" })}
        />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {renderView()}
        
        {/* Bottom Navigation - Mobile Only (Show on main views) */}
        {(view.type === "home" || view.type === "summary" || view.type === "class-overview" || view.type === "student-report") && (
          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-emerald-200/50 dark:border-emerald-800/50 shadow-[0_-10px_30px_-10px_rgba(0,200,83,0.3)]">
              <div className="max-w-4xl mx-auto px-2 py-2">
                <div className="grid grid-cols-4 gap-1">
                  {/* Home Button */}
                  <button
                    onClick={() => setView({ type: "home" })}
                    className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-lg transition-all duration-300 touch-manipulation ${
                      view.type === "home"
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-105"
                        : "bg-transparent text-emerald-700 dark:text-emerald-300 active:bg-emerald-50 dark:active:bg-emerald-900/30"
                    }`}
                  >
                    <span className={`text-xl ${view.type === "home" ? "material-icons" : "material-icons-outlined"}`}>
                      home
                    </span>
                    <span className="text-[10px] font-semibold">Home</span>
                  </button>

                  {/* Summary Button */}
                  <button
                    onClick={() => setView({ type: "summary" })}
                    className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-lg transition-all duration-300 touch-manipulation ${
                      view.type === "summary"
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-105"
                        : "bg-transparent text-emerald-700 dark:text-emerald-300 active:bg-emerald-50 dark:active:bg-emerald-900/30"
                    }`}
                  >
                    <span className={`text-xl ${view.type === "summary" ? "material-icons" : "material-icons-outlined"}`}>
                      assessment
                    </span>
                    <span className="text-[10px] font-semibold">Summary</span>
                  </button>

                  {/* Class Overview Button */}
                  <button
                    onClick={() => setView({ type: "class-overview" })}
                    className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-lg transition-all duration-300 touch-manipulation ${
                      view.type === "class-overview"
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-105"
                        : "bg-transparent text-emerald-700 dark:text-emerald-300 active:bg-emerald-50 dark:active:bg-emerald-900/30"
                    }`}
                  >
                    <span className={`text-xl ${view.type === "class-overview" ? "material-icons" : "material-icons-outlined"}`}>
                      school
                    </span>
                    <span className="text-[10px] font-semibold">Classes</span>
                  </button>

                  {/* Student Report Button */}
                  <button
                    onClick={() => setView({ type: "student-report" })}
                    className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-lg transition-all duration-300 touch-manipulation ${
                      view.type === "student-report"
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-105"
                        : "bg-transparent text-emerald-700 dark:text-emerald-300 active:bg-emerald-50 dark:active:bg-emerald-900/30"
                    }`}
                  >
                    <span className={`text-xl ${view.type === "student-report" ? "material-icons" : "material-icons-outlined"}`}>
                      person
                    </span>
                    <span className="text-[10px] font-semibold">Students</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Sync Status Indicator - Hidden (automatic background sync only) */}
        {/* {isAuthenticated && <SyncStatusIndicator />} */}
        
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
