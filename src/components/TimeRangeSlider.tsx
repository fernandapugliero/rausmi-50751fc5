import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface TimeRangeSliderProps {
  /** Minutes from 00:00 to 24:00 (0-1440) */
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  /** Minimum selectable minute (e.g. current hour for "today") */
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

function formatMinutes(m: number) {
  if (m >= 1440) return "24:00";
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function TimeRangeSlider({
  value,
  onValueChange,
  min = 0,
  max = 1440,
  step = 30,
  label = "Uhrzeit",
}: TimeRangeSliderProps) {
  const [from, to] = value;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="text-sm text-muted-foreground font-medium tabular-nums">
          {formatMinutes(from)} – {formatMinutes(to)}
        </span>
      </div>
      <SliderPrimitive.Root
        className={cn("relative flex w-full touch-none select-none items-center py-2")}
        min={min}
        max={max}
        step={step}
        minStepsBetweenThumbs={1}
        value={value}
        onValueChange={(v) => onValueChange([v[0], v[1]] as [number, number])}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label="Von"
          className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <SliderPrimitive.Thumb
          aria-label="Bis"
          className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </SliderPrimitive.Root>
    </div>
  );
}
