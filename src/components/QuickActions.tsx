import { Zap, Sun, Sunrise } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { SearchFilters } from "@/lib/types";
import {
  fetchJetztActivities,
  fetchHeuteActivities,
  fetchMorgenActivities,
} from "@/lib/activity-queries";

interface QuickActionsProps {
  onSelect: (timeRange: SearchFilters["timeRange"]) => void;
}

export function QuickActions({ onSelect }: QuickActionsProps) {
  const { data: jetzt } = useQuery({
    queryKey: ["count-jetzt"],
    queryFn: () => fetchJetztActivities(),
    staleTime: 5 * 60 * 1000,
  });
  const { data: heute } = useQuery({
    queryKey: ["count-heute"],
    queryFn: () => fetchHeuteActivities(),
    staleTime: 5 * 60 * 1000,
  });
  const { data: morgen } = useQuery({
    queryKey: ["count-morgen"],
    queryFn: () => fetchMorgenActivities(),
    staleTime: 5 * 60 * 1000,
  });

  const jetztCount = jetzt?.length ?? 0;
  const heuteCount = heute?.length ?? 0;
  const morgenCount = morgen?.length ?? 0;

  const actions = [
    {
      key: "now" as const,
      label: "Jetzt",
      sublabel: `${jetztCount} ${jetztCount === 1 ? "Aktivität" : "Aktivitäten"} in den nächsten 3 Stunden`,
      icon: Zap,
      gradient: "from-primary to-primary/80",
      textColor: "text-primary-foreground",
    },
    {
      key: "today" as const,
      label: "Heute",
      sublabel: `${heuteCount} ${heuteCount === 1 ? "Aktivität" : "Aktivitäten"} heute`,
      icon: Sun,
      gradient: "from-secondary to-secondary/80",
      textColor: "text-secondary-foreground",
    },
    {
      key: "tomorrow" as const,
      label: "Morgen",
      sublabel: `${morgenCount} ${morgenCount === 1 ? "Aktivität" : "Aktivitäten"} morgen`,
      icon: Sunrise,
      gradient: "from-accent to-accent/80",
      textColor: "text-accent-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {actions.map((action) => (
        <button
          key={action.key}
          className={`w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r ${action.gradient} ${action.textColor} transition-all duration-200 active:scale-[0.97] hover:scale-[1.02]`}
          style={{ boxShadow: "var(--shadow-hero)" }}
          onClick={() => onSelect(action.key)}
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <action.icon className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="font-display font-bold text-lg block leading-tight">
              {action.label}
            </span>
            <span className="text-sm opacity-90">{action.sublabel}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
