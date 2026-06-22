import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { fetchActivityReviews } from "@/lib/reviews";

interface Props {
  activityId: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ActivityReviewsList({ activityId }: Props) {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["activity-reviews", activityId],
    queryFn: () => fetchActivityReviews(activityId),
  });

  if (isLoading || !reviews || reviews.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Bewertungen ({reviews.length})
      </h2>
      <ul className="space-y-3">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-border bg-card p-4 space-y-2"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-0.5" aria-label={`${r.rating} von 5 Sternen`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`w-4 h-4 ${
                      n <= r.rating ? "fill-primary text-primary" : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{r.comment}</p>
            {r.display_name && (
              <p className="text-xs text-muted-foreground">— {r.display_name}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
