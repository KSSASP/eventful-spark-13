import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: string;
}

const CountdownTimer = ({ targetDate }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setExpired(true); return; }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (expired) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>Event has started</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 rounded-lg bg-primary/5 px-4 py-2.5">
      <Clock className="h-4 w-4 text-primary" />
      {[
        { val: timeLeft.days, label: "D" },
        { val: timeLeft.hours, label: "H" },
        { val: timeLeft.minutes, label: "M" },
        { val: timeLeft.seconds, label: "S" },
      ].map((u) => (
        <div key={u.label} className="flex items-baseline gap-0.5 text-center">
          <span className="font-display text-lg font-bold text-primary">{String(u.val).padStart(2, "0")}</span>
          <span className="text-[10px] font-medium text-muted-foreground">{u.label}</span>
        </div>
      ))}
    </div>
  );
};

export default CountdownTimer;
