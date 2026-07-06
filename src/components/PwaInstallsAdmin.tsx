import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Smartphone } from "lucide-react";

type InstallEvent = {
  id: string;
  event_type: string;
  platform: string | null;
  created_at: string;
};

export function PwaInstallsAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ["pwa-install-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pwa_install_events")
        .select("id, event_type, platform, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as InstallEvent[];
    },
  });

  if (isLoading) {
    return <div className="h-40 rounded-2xl bg-muted animate-pulse" />;
  }

  const events = data ?? [];
  const count = (type: string) => events.filter((e) => e.event_type === type).length;
  const byPlatform = (type: string) => {
    const map: Record<string, number> = {};
    events
      .filter((e) => e.event_type === type)
      .forEach((e) => {
        const p = e.platform ?? "unknown";
        map[p] = (map[p] ?? 0) + 1;
      });
    return map;
  };

  const stats = [
    { label: "Installiert (Android/Desktop)", value: count("installed"), detail: byPlatform("installed") },
    { label: "Standalone-Öffnungen", value: count("standalone_open"), detail: byPlatform("standalone_open") },
    { label: "Install-Prompt gezeigt", value: count("prompt_shown"), detail: byPlatform("prompt_shown") },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">PWA-Installationen</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          iOS zeigt kein Install-Event – „Standalone-Öffnungen" zählt jedes Öffnen der installierten App
          (einmal pro Session, alle Plattformen).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border p-3">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
              {Object.keys(s.detail).length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground space-x-2">
                  {Object.entries(s.detail).map(([p, n]) => (
                    <span key={p}>
                      {p}: <span className="font-medium text-foreground">{n}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 border border-border">
        <h3 className="font-semibold mb-3 text-sm">Letzte Events</h3>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Events erfasst.</p>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {events.slice(0, 100).map((e) => (
              <div key={e.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{e.event_type}</span>
                  <span className="text-muted-foreground">{e.platform ?? "—"}</span>
                </div>
                <span className="text-muted-foreground">
                  {new Date(e.created_at).toLocaleString("de-DE")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
