import { useState } from "react";
import { ChevronDown, Star, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { AuthDialog } from "@/components/AuthDialog";
import { reviewSchema, submitActivityReview } from "@/lib/reviews";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  activityId: string;
  activityTitle?: string | null;
}

export function ActivityReviewForm({ activityId, activityTitle }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setRating(0);
    setComment("");
    setDisplayName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (rating < 1) {
      toast.error("Bitte vergib eine Bewertung");
      return;
    }
    const parsed = reviewSchema.safeParse({
      activity_id: activityId,
      activity_title: activityTitle ?? null,
      rating,
      comment,
      display_name: displayName,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Ungültige Eingabe");
      return;
    }
    setSubmitting(true);
    try {
      await submitActivityReview(parsed.data);
      toast.success("Danke für deine Bewertung!");
      reset();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["activity-reviews", activityId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Senden");
    } finally {
      setSubmitting(false);
    }
  };

  const active = hover || rating;

  return (
    <>
      <div
        className="rounded-2xl border border-border bg-card overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2.5">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-sm font-display font-semibold">Diese Aktivität bewerten</span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="px-5 pb-5 pt-1 border-t border-border">
            {!user ? (
              <div className="py-3 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Bitte melde dich an, um eine Bewertung abzugeben.
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
                    Deine Bewertung
                  </legend>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHover(n)}
                        onMouseLeave={() => setHover(0)}
                        className="p-1"
                        aria-label={`${n} Stern${n > 1 ? "e" : ""}`}
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            n <= active
                              ? "fill-primary text-primary"
                              : "text-muted-foreground/40"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="space-y-1.5">
                  <label htmlFor="review-comment" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                    Kommentar
                  </label>
                  <Textarea
                    id="review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={2000}
                    rows={3}
                    required
                    placeholder="Wie war dein Erlebnis?"
                    className="rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground text-right">{comment.length}/2000</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="review-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                    Name <span className="normal-case font-normal">(optional)</span>
                  </label>
                  <Input
                    id="review-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={80}
                    placeholder="Wie sollen wir dich nennen?"
                    className="rounded-xl"
                  />
                </div>

                <Button type="submit" className="rounded-full w-full" disabled={submitting}>
                  {submitting ? "Senden…" : "Bewertung senden"}
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
