import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { Activity, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

/**
 * Overview card shown at the top of the Admin page.
 * Answers the "what's going on in the background?" question:
 * - How many activities are live vs. pending?
 * - When did the crawler last run?
 * - How many sources are healthy / broken / manual?
 */
export const AdminStatusCard = () => {
  const { data } = useQuery({
    queryKey: ["admin-status"],
    queryFn: async () => {
      const [sourcesRes, runsRes, actsRes, reportsRes] = await Promise.all([
        supabase.from("sources").select("id, is_active, crawl_mode"),
        supabase
          .from("source_runs")
          .select("source_id, status, started_at")
          .order("started_at", { ascending: false })
          .limit(200),
        supabase.from("activities").select("is_approved"),
        supabase.from("activity_reports").select("status"),
      ]);

      const sources = sourcesRes.data ?? [];
      const runs = runsRes.data ?? [];
      const activities = actsRes.data ?? [];
      const reports = reportsRes.data ?? [];

      // Latest run per source
      const latestBySource = new Map<string, { status: string; started_at: string }>();
      for (const r of runs) {
        if (!latestBySource.has(r.source_id)) latestBySource.set(r.source_id, r);
      }
      const autoSources = sources.filter((s) => s.is_active && s.crawl_mode !== "manual");
      let healthy = 0;
      let broken = 0;
      let stale = 0;
      const now = Date.now();
      for (const s of autoSources) {
        const l = latestBySource.get(s.id);
        if (!l) {
          stale++;
        } else if (l.status === "failed") {
          broken++;
        } else if (l.status === "success" && now - new Date(l.started_at).getTime() < 10 * 86400000) {
          healthy++;
        } else {
          stale++;
        }
      }

      const lastRun = runs[0]?.started_at ?? null;

      return {
        pending: activities.filter((a) => !a.is_approved).length,
        approved: activities.filter((a) => a.is_approved).length,
        openReports: reports.filter((r) => r.status === "open").length,
        totalSources: sources.length,
        autoSources: autoSources.length,
        manualSources: sources.filter((s) => s.crawl_mode === "manual").length,
        healthy,
        broken,
        stale,
        lastRun,
      };
    },
  });

  if (!data) {
    return <div className="h-32 rounded-2xl bg-muted animate-pulse" />;
  }

  return (
    <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-sm">Übersicht</h2>
        <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {data.lastRun
            ? `Letzter Crawl vor ${formatDistanceToNow(new Date(data.lastRun), { locale: de })}`
            : "Noch nie gecrawlt"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Live" value={data.approved} tone="green" icon={<CheckCircle2 className="w-3.5 h-3.5" />} />
        <Stat
          label="Ausstehend"
          value={data.pending}
          tone={data.pending > 0 ? "amber" : "gray"}
          icon={<Clock className="w-3.5 h-3.5" />}
        />
        <Stat
          label="Offene Reports"
          value={data.openReports}
          tone={data.openReports > 0 ? "red" : "gray"}
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
        />
        <Stat label="Versteckt" value={data.hidden} tone="gray" icon={<Activity className="w-3.5 h-3.5" />} />
      </div>

      <div className="border-t border-border/50 pt-2 text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
        <span>
          <b className="text-foreground">{data.totalSources}</b> Quellen ({data.autoSources} auto · {data.manualSources} manuell)
        </span>
        <span className="text-emerald-600">● {data.healthy} ok</span>
        <span className="text-amber-600">● {data.stale} veraltet</span>
        <span className="text-red-600">● {data.broken} fehlerhaft</span>
      </div>
      {data.lastRun && (
        <p className="text-[10px] text-muted-foreground">
          Wöchentlicher Cron läuft montags 06:00 UTC. Letzter Lauf: {format(new Date(data.lastRun), "dd.MM. HH:mm", { locale: de })}.
        </p>
      )}
    </div>
  );
};

const Stat = ({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "green" | "amber" | "red" | "gray";
  icon: React.ReactNode;
}) => {
  const toneClass = {
    green: "text-emerald-600 bg-emerald-500/10",
    amber: "text-amber-600 bg-amber-500/10",
    red: "text-red-600 bg-red-500/10",
    gray: "text-muted-foreground bg-muted",
  }[tone];
  return (
    <div className="rounded-xl border border-border/60 p-2.5">
      <div className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${toneClass}`}>
        {icon}
        {label}
      </div>
      <div className="text-2xl font-display font-bold mt-1 leading-none">{value}</div>
    </div>
  );
};
