import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Check, EyeOff, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import {
  listReports,
  setReportStatus,
  hideActivityViaOverride,
  issueLabel,
  type ReportStatus,
} from "@/lib/reports";
import { EmptyState } from "@/components/EmptyState";

export function ReportsAdmin() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<ReportStatus>("open");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports", status],
    queryFn: () => listReports(status),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-reports"] });

  const statusMut = useMutation({
    mutationFn: ({ id, s }: { id: string; s: ReportStatus }) => setReportStatus(id, s),
    onSuccess: () => {
      invalidate();
      toast.success("Aktualisiert");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hideMut = useMutation({
    mutationFn: async ({ reportId, activityId, title }: { reportId: string; activityId: string; title: string | null }) => {
      await hideActivityViaOverride(activityId, `Hidden via report ${reportId}${title ? ` – ${title}` : ""}`);
      await setReportStatus(reportId, "resolved");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Aktivität ausgeblendet");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["open", "resolved", "dismissed"] as ReportStatus[]).map((s) => (
          <Button
            key={s}
            variant={status === s ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setStatus(s)}
          >
            {s === "open" ? "Offen" : s === "resolved" ? "Erledigt" : "Verworfen"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : reports && reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((r) => {
            const baseId = r.activity_id.split("__")[0];
            return (
              <div
                key={r.id}
                className="bg-card rounded-2xl p-4 border border-border space-y-3"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/activity/${baseId}`}
                      className="font-display font-semibold text-sm hover:text-primary transition-colors truncate block"
                    >
                      {r.activity_title || r.activity_id}
                    </Link>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {format(new Date(r.created_at), "dd. MMM yyyy HH:mm", { locale: de })} ·{" "}
                      {r.reporter_role === "organizer" ? "Veranstalter:in" : "Besucher:in"}
                    </p>
                  </div>
                  <Badge variant={r.status === "open" ? "secondary" : "outline"}>
                    {r.status === "open" ? "Offen" : r.status === "resolved" ? "Erledigt" : "Verworfen"}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {r.issues.map((i) => (
                    <span key={i} className="chip chip-soon">
                      {issueLabel(i)}
                    </span>
                  ))}
                </div>

                {r.comment && (
                  <p className="text-sm bg-muted/40 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
                    {r.comment}
                  </p>
                )}

                {r.activity_source_url && (
                  <a
                    href={r.activity_source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Quelle
                  </a>
                )}

                {r.status === "open" && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      className="rounded-full gap-1.5"
                      onClick={() => hideMut.mutate({ reportId: r.id, activityId: r.activity_id, title: r.activity_title })}
                      disabled={hideMut.isPending}
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      Aktivität ausblenden
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-1.5"
                      onClick={() => statusMut.mutate({ id: r.id, s: "resolved" })}
                      disabled={statusMut.isPending}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Erledigt
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-1.5 text-muted-foreground"
                      onClick={() => statusMut.mutate({ id: r.id, s: "dismissed" })}
                      disabled={statusMut.isPending}
                    >
                      <X className="w-3.5 h-3.5" />
                      Verwerfen
                    </Button>
                  </div>
                )}

                {r.status !== "open" && (
                  <div className="pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={() => statusMut.mutate({ id: r.id, s: "open" })}
                    >
                      Wieder öffnen
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Keine Reports"
          description={
            status === "open"
              ? "Neue Reports erscheinen hier"
              : status === "resolved"
              ? "Erledigte Reports erscheinen hier"
              : "Verworfene Reports erscheinen hier"
          }
        />
      )}
    </div>
  );
}
