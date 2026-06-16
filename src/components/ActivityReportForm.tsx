import { useState } from "react";
import { ChevronDown, Flag, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { AuthDialog } from "@/components/AuthDialog";
import { REPORT_ISSUES, submitActivityReport, reportSchema } from "@/lib/reports";
import { toast } from "sonner";

interface Props {
  activityId: string;
  activityTitle?: string | null;
  activitySourceUrl?: string | null;
}

export function ActivityReportForm({ activityId, activityTitle, activitySourceUrl }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [role, setRole] = useState<"visitor" | "organizer">("visitor");
  const [issues, setIssues] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleIssue = (value: string) => {
    setIssues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const reset = () => {
    setIssues([]);
    setComment("");
    setRole("visitor");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuth(true);
      return;
    }
    const parsed = reportSchema.safeParse({
      activity_id: activityId,
      activity_title: activityTitle ?? null,
      activity_source_url: activitySourceUrl ?? null,
      reporter_role: role,
      issues,
      comment: comment || null,
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Ungültige Eingabe";
      toast.error(first);
      return;
    }
    setSubmitting(true);
    try {
      await submitActivityReport(parsed.data);
      toast.success("Danke für dein Feedback!");
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Senden");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2.5">
            <Flag className="w-4 h-4 text-primary" />
            <span className="text-sm font-display font-semibold">Etwas zu dieser Aktivität melden</span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="px-5 pb-5 pt-1 border-t border-border">
            {!user ? (
              <div className="py-2 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Bitte melde dich an, um etwas zu melden.
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full gap-1.5"
                  onClick={() => setShowAuth(true)}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Anmelden
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 pt-3">
                <fieldset className="space-y-2">
                  <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Ich bin…
                  </legend>
                  <div className="flex gap-2">
                    {([
                      { v: "visitor", l: "Besucher:in" },
                      { v: "organizer", l: "Veranstalter:in" },
                    ] as const).map((opt) => (
                      <label
                        key={opt.v}
                        className={`flex-1 cursor-pointer text-center text-sm rounded-full px-3 py-2 border transition-colors ${
                          role === opt.v
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="reporter_role"
                          value={opt.v}
                          checked={role === opt.v}
                          onChange={() => setRole(opt.v)}
                          className="sr-only"
                        />
                        {opt.l}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="space-y-2">
                  <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Was ist los?
                  </legend>
                  <div className="flex flex-col gap-1.5">
                    {REPORT_ISSUES.map((issue) => {
                      const checked = issues.includes(issue.value);
                      return (
                        <label
                          key={issue.value}
                          className={`flex items-center gap-2.5 cursor-pointer text-sm rounded-xl px-3 py-2 border transition-colors ${
                            checked
                              ? "bg-primary/5 border-primary/40"
                              : "bg-background border-border hover:border-primary/30"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleIssue(issue.value)}
                            className="h-4 w-4 rounded border-border accent-primary"
                          />
                          <span>{issue.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="space-y-1.5">
                  <label htmlFor="report-comment" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                    Kommentar <span className="normal-case font-normal">(optional)</span>
                  </label>
                  <Textarea
                    id="report-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="Was sollten wir wissen?"
                    className="rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground text-right">{comment.length}/1000</p>
                </div>

                <Button
                  type="submit"
                  className="rounded-full w-full"
                  disabled={submitting || issues.length === 0}
                >
                  {submitting ? "Senden…" : "Melden"}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
    </>
  );
}
