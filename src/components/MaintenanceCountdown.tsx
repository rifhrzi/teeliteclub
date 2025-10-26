import { useEffect, useState } from "react";

const SEGMENTS = [
  { label: "Days", key: "days" },
  { label: "Hours", key: "hours" },
  { label: "Minutes", key: "minutes" },
  { label: "Seconds", key: "seconds" },
] as const;

type SegmentKey = typeof SEGMENTS[number]["key"];

const getTimeParts = (target: Date) => {
  const now = Date.now();
  const diff = Math.max(target.getTime() - now, 0);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
};

interface CountdownProps {
  target: string;
  tone?: "light" | "dark";
}

export const Countdown = ({ target, tone = "light" }: CountdownProps) => {
  const targetDate = new Date(target);
  const [timeLeft, setTimeLeft] = useState(() => getTimeParts(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeParts(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const primary = tone === "dark" ? "text-white" : "text-[#0A0A0A]";
  const secondary = tone === "dark" ? "text-white/70" : "text-[#6B7280]";

  
return (
  <div className={`flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-sm sm:text-base font-medium ${primary}`}>
    {SEGMENTS.map(({ label, key }, index) => {
      const value = timeLeft[key as SegmentKey].toString().padStart(2, "0");
      return (
        <span key={label} className="flex items-center gap-2 sm:gap-3 tracking-wide">
          <span className="flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-[24px] sm:text-[32px] font-semibold leading-none">{value}</span>
            <span className={`text-[10px] sm:text-[11px] uppercase tracking-[0.1em] ${secondary} font-medium`}>
              {label}
            </span>
          </span>
          {index < SEGMENTS.length - 1 && (
            <span className={`${secondary} text-xs sm:text-sm`}>|</span>
          )}
        </span>
      );
    })}
  </div>
);

};

export const MaintenanceCountdown = Countdown;
