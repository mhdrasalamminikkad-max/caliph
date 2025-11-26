import { Card } from "@/components/ui/card";
import type { Student } from "@shared/schema";

interface ClassCardProps {
  className: string;
  studentCount: number;
  students?: Student[];
  onClick: () => void;
  onDelete?: () => void;
  lastMarked?: boolean;
}

export default function ClassCard({ className, studentCount, onClick, onDelete, lastMarked }: ClassCardProps) {
  return (
    <Card
      onClick={onClick}
      className="group relative p-6 sm:p-8 md:p-10 bg-white/90 dark:bg-white/10 backdrop-blur-3xl border-2 sm:border-3 md:border-4 border-white/60 hover:border-white/90 active:border-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)] active:shadow-[0_8px_25px_-8px_rgba(0,0,0,0.15)] transition-all duration-300 sm:duration-400 md:duration-500 ease-out transform hover:-translate-y-2 active:translate-y-0 hover:scale-[1.02] active:scale-[0.99] rounded-2xl sm:rounded-[1.75rem] md:rounded-[2rem] overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-emerald-400/10 before:via-green-300/5 before:to-teal-400/10 before:pointer-events-none before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 md:before:duration-500 touch-manipulation cursor-pointer"
      data-testid={`card-class-${className.toLowerCase().replace(" ", "-")}`}
    >
      {onDelete && (
        <button
          className="absolute top-3 right-3 sm:top-4 sm:right-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 text-gray-400 hover:text-red-500 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-red-50/50 dark:hover:bg-red-950/30 touch-manipulation z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete class"
        >
          <span className="material-icons text-lg sm:text-xl">delete_outline</span>
        </button>
      )}
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2 sm:gap-2.5 flex-1">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
            {className}
          </h3>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-200 flex items-center gap-1.5 sm:gap-2">
            <span className="material-icons text-base sm:text-lg md:text-xl text-emerald-600">people</span>
            <span className="font-semibold">{studentCount} students</span>
          </p>
          {lastMarked && (
            <div className="flex items-center gap-1 text-xs text-[#00C853] font-semibold bg-[#00C853]/10 px-3 py-1 rounded-full w-fit">
              <span className="material-icons text-sm">check_circle</span>
              <span>Marked today</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center gap-2 sm:gap-3">
          <span className="material-icons text-emerald-600 dark:text-emerald-400 text-4xl sm:text-5xl md:text-6xl transform group-hover:scale-110 sm:group-hover:scale-115 md:group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 md:duration-500 drop-shadow-lg">
            school
          </span>
        </div>
      </div>
    </Card>
  );
}
