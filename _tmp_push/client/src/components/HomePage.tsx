import { Prayer, prayers } from "@shared/schema";
import PrayerButton from "./PrayerButton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { removeDuplicateStudents, clearAllData } from "@/lib/offlineApi";
// TODO: Replace with backend API call when implementing new backend
// import { forceSyncAllData } from "@/lib/firebaseSync";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";

// Logo path - use public folder path
const logoSrc = "/caliph_logo.png";

interface HomePageProps {
  onPrayerSelect: (prayer: Prayer) => void;
  onObjectivesClick?: () => void;
}

export default function HomePage({ onPrayerSelect, onObjectivesClick }: HomePageProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-green-400 to-teal-500 dark:from-emerald-900 dark:via-green-800 dark:to-teal-900 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden">
      {/* Decorative floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl rotate-12 opacity-40 blur-sm animate-float"></div>
        <div className="absolute top-20 sm:top-40 right-10 sm:right-20 w-24 sm:w-40 h-24 sm:h-40 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full opacity-30 blur-sm animate-float-delayed"></div>
        <div className="absolute bottom-16 sm:bottom-32 left-1/4 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl -rotate-12 opacity-35 blur-sm animate-float"></div>
        <div className="absolute top-1/3 right-1/4 w-20 sm:w-28 h-20 sm:h-28 bg-gradient-to-br from-green-300 to-emerald-400 rounded-full opacity-40 blur-sm animate-float-slow"></div>
      </div>
      
      <div className="w-full max-w-4xl flex flex-col items-center gap-6 sm:gap-8 md:gap-12 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-4 sm:gap-5 text-center">
          {/* Logo in white card */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-2xl">
            <img
              src={logoSrc}
              alt="Caliph Logo"
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain"
              data-testid="img-caliph-logo"
              onError={(e) => {
                // Fallback if image fails to load
                const target = e.target as HTMLImageElement;
                const parent = target.parentNode as HTMLElement;
                if (parent && !parent.querySelector('.logo-fallback')) {
                  target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'logo-fallback w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl md:text-3xl font-bold';
                  fallback.textContent = 'C';
                  parent.appendChild(fallback);
                }
              }}
              onLoad={() => {
                // Remove fallback if image loads successfully
                const fallback = document.querySelector('.logo-fallback');
                if (fallback) {
                  fallback.remove();
                }
              }}
            />
          </div>
          
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg tracking-tight">
              Caliph Attendance
            </h1>
          </div>
        </div>

        {/* Prayer Buttons Grid - Mobile: 3 in first row, 2 in second row */}
        <div className="w-full max-w-3xl space-y-6 sm:space-y-8">
          {/* Prayer Section */}
          <div>
            <h2 className="text-center text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4 drop-shadow-lg">
              📿 Daily Prayers
            </h2>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
              {/* First row: Fajr, Dhuhr, Asr */}
              {prayers.slice(0, 3).map((prayer) => (
                <PrayerButton
                  key={prayer}
                  prayer={prayer}
                  onClick={() => onPrayerSelect(prayer)}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto">
              {/* Second row: Maghrib, Isha */}
              {prayers.slice(3, 5).map((prayer) => (
                <PrayerButton
                  key={prayer}
                  prayer={prayer}
                  onClick={() => onPrayerSelect(prayer)}
                />
              ))}
            </div>
          </div>

          {/* Other Section - Others Tracking */}
          <div>
            <h2 className="text-center text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4 drop-shadow-lg">
              📚 Other Tracking
            </h2>
            <div className="max-w-md mx-auto">
              <button
                onClick={() => onObjectivesClick?.()}
                className="w-full bg-white/95 hover:bg-white backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_50px_-10px_rgba(0,0,0,0.4)] transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] border-2 sm:border-3 border-white/60 hover:border-amber-400 group touch-manipulation"
              >
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-6">
                    <span className="material-icons text-white text-3xl sm:text-4xl">
                      task_alt
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-gray-800 group-hover:text-amber-600 transition-colors">
                      Others
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 font-semibold">
                      Cap, Nails, Uniform & More
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Date Display */}
        <div className="text-center mt-4 sm:mt-6">
          <p className="text-sm sm:text-base text-emerald-800/80 dark:text-emerald-200/80 font-medium">
            {new Date().toLocaleDateString("en-US", { 
              weekday: "long", 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </p>
        </div>

        {/* Utility: Sync and Clean */}
        <div className="mt-6 flex flex-col gap-2 items-center">
          {/* TODO: Replace with backend sync button when implementing new backend */}
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              // TODO: Replace with backend API call
              // await forceSyncAllData();
            }}
            disabled={isProcessing}
            className="text-white/80 hover:text-white hover:bg-white/20 text-xs"
          >
            <span className="material-icons text-sm mr-1">
              {isProcessing ? "sync" : "cloud_upload"}
            </span>
            {isProcessing ? "Syncing..." : "Sync to Cloud"}
          </Button> */}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (isProcessing) return;
              setIsProcessing(true);
              try {
                const count = removeDuplicateStudents();
                if (count > 0) {
                  // Refresh data
                  queryClient.invalidateQueries({ queryKey: ["students"] });
                  queryClient.invalidateQueries({ queryKey: ["class-students"] });
                  toast({
                    title: "Duplicates Removed",
                    description: `Removed ${count} duplicate student(s) successfully.`,
                  });
                } else {
                  toast({
                    title: "No Duplicates",
                    description: "No duplicate students found in the system.",
                  });
                }
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to remove duplicates. Please try again.",
                  variant: "destructive",
                });
              } finally {
                setIsProcessing(false);
              }
            }}
            disabled={isProcessing}
            className="text-white/80 hover:text-white hover:bg-white/20 text-xs"
          >
            <span className="material-icons text-sm mr-1">
              {isProcessing ? "sync" : "cleaning_services"}
            </span>
            {isProcessing ? "Cleaning..." : "Clean Duplicates"}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (isProcessing) return;
              
              // Double confirmation before clearing all data
              const confirm1 = window.confirm("⚠️ WARNING: This will delete ALL local data!\n\nThis includes:\n• All classes\n• All students\n• All attendance records\n• All custom reasons\n\nThis cannot be undone!\n\nClick OK to continue, or Cancel to abort.");
              
              if (!confirm1) {
                return;
              }
              
              const confirm2 = window.confirm("⚠️ LAST CHANCE!\n\nAre you ABSOLUTELY SURE you want to delete ALL local storage data?\n\nThis action is IRREVERSIBLE!");
              
              if (!confirm2) {
                return;
              }
              
              setIsProcessing(true);
              
              try {
                clearAllData();
                
                // Invalidate all queries to refresh UI
                queryClient.invalidateQueries({ queryKey: ["classes"] });
                queryClient.invalidateQueries({ queryKey: ["students"] });
                queryClient.invalidateQueries({ queryKey: ["class-students"] });
                queryClient.invalidateQueries({ queryKey: ["attendance"] });
                queryClient.invalidateQueries({ queryKey: ["other-attendance"] });
                
                toast({
                  title: "✅ All Data Cleared",
                  description: "All local storage has been cleared. Refresh the page to see the changes.",
                });
                
                // Refresh page after 2 seconds
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to clear data. Please try again.",
                  variant: "destructive",
                });
              } finally {
                setIsProcessing(false);
              }
            }}
            disabled={isProcessing}
            className="text-white/80 hover:text-white hover:bg-red-500/30 text-xs"
          >
            <span className="material-icons text-sm mr-1">
              {isProcessing ? "delete" : "delete_forever"}
            </span>
            {isProcessing ? "Clearing..." : "Clear All Storage"}
          </Button>
        </div>
      </div>
    </div>
  );
}
