import { Prayer } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface PrayerButtonProps {
  prayer: Prayer;
  onClick: () => void;
}

const prayerIcons: Record<Prayer, string> = {
  Fajr: "wb_twilight",
  Dhuhr: "wb_sunny",
  Asr: "access_time",
  Maghrib: "brightness_3",
  Isha: "nightlight",
};

const prayerTimes: Record<Prayer, string> = {
  Fajr: "Before sunrise",
  Dhuhr: "Midday",
  Asr: "Afternoon",
  Maghrib: "Sunset",
  Isha: "Night",
};

export default function PrayerButton({ prayer, onClick }: PrayerButtonProps) {
  return (
    <Button
      variant="default"
      className="group relative flex flex-col items-center justify-center min-h-[110px] sm:min-h-[140px] md:min-h-[160px] w-full gap-2 sm:gap-4 md:gap-5 px-3 py-4 sm:px-8 sm:py-8 md:px-10 md:py-10 rounded-xl sm:rounded-[1.75rem] md:rounded-[2rem] bg-white/95 dark:bg-white/10 backdrop-blur-2xl border-2 border-white/40 hover:border-white/60 active:border-white/70 text-emerald-700 dark:text-white shadow-[0_8px_20px_-8px_rgba(0,200,83,0.3)] hover:shadow-[0_20px_50px_-10px_rgba(0,200,83,0.5)] active:shadow-[0_8px_20px_-8px_rgba(0,200,83,0.4)] transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2 active:translate-y-0 hover:scale-[1.01] sm:hover:scale-[1.02] active:scale-[0.98] before:absolute before:inset-0 before:rounded-xl sm:before:rounded-[1.75rem] md:before:rounded-[2rem] before:bg-gradient-to-br before:from-emerald-400/20 before:via-green-300/10 before:to-teal-400/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 touch-manipulation"
      onClick={onClick}
      data-testid={`button-prayer-${prayer.toLowerCase()}`}
    >
      <span className="material-icons text-3xl sm:text-6xl md:text-7xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 drop-shadow-lg z-10 text-emerald-600 dark:text-emerald-300">
        {prayerIcons[prayer]}
      </span>
      <div className="flex flex-col items-center gap-0.5 sm:gap-1.5 md:gap-2 z-10">
        <span className="text-base sm:text-2xl md:text-3xl font-bold sm:font-extrabold tracking-tight">{prayer}</span>
        <span className="text-xs sm:text-base md:text-lg font-medium sm:font-semibold opacity-70 sm:opacity-80">{prayerTimes[prayer]}</span>
      </div>
    </Button>
  );
}
