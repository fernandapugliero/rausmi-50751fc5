import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, MapPin, ExternalLink, Baby, Tag, Bookmark, Repeat, Star, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAllActivities } from "@/lib/activity-queries";
import { formatActivityTime, getRelativeTimeLabel, getAgeLabel, getRecurringDayLabel } from "@/lib/utils";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AuthDialog } from "@/components/AuthDialog";
import { ActivityReportForm } from "@/components/ActivityReportForm";
import { ActivityReviewForm } from "@/components/ActivityReviewForm";
import { ActivityReviewsList } from "@/components/ActivityReviewsList";
import { SEO } from "@/components/SEO";

const ActivityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggle, isBookmarked, showAuthDialog, setShowAuthDialog } = useBookmarks();
  const { user } = useAuth();

  const { data: activity, isLoading } = useQuery({
    queryKey: ["activity", id],
    queryFn: async () => {
      const all = await fetchAllActivities();
      // Match by exact id or by id prefix (occurrence ids have __suffix)
      return all.find((a) => a.id === id || a.id.startsWith(id + "__")) ?? null;
    },
    enabled: !!id,
  });

  // Log view for logged-in users (uses the underlying DB row id, not the occurrence id)
  useEffect(() => {
    if (!user || !activity) return;
    const rowId = activity.id.split("__")[0];
    void supabase
      .from("user_activity_views")
      .upsert(
        { user_id: user.id, activity_id: rowId, viewed_at: new Date().toISOString() },
        { onConflict: "user_id,activity_id" }
      );
  }, [user, activity]);


  if (isLoading) {
    return (
      <div className="min-h-screen px-5 pt-6">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse mb-6" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 rounded-xl bg-muted animate-pulse" />
          <div className="h-4 w-full rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-2/3 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="text-center">
          <h2 className="font-display font-semibold text-lg mb-2">Aktivität nicht gefunden</h2>
          <Button variant="outline" className="rounded-full" onClick={() => navigate("/")}>
            Zurück
          </Button>
        </div>
      </div>
    );
  }

  const startTime = new Date(activity.start_time);
  const endTime = activity.end_time ? new Date(activity.end_time) : null;
  const { label: statusLabel, type: statusType } = getRelativeTimeLabel(startTime, endTime);
  const bookmarked = isBookmarked(activity.id);

  const ageDisplay = activity._ageLabel
    || (activity.age_groups.length > 0
      ? activity.age_groups.map(getAgeLabel).join(", ")
      : null);

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: activity.title,
    description: activity.description || `${activity.title} in ${activity.district}, Berlin.`,
    startDate: activity.start_time,
    ...(activity.end_time ? { endDate: activity.end_time } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: activity.location_name,
      address: {
        "@type": "PostalAddress",
        streetAddress: activity.address || undefined,
        addressLocality: activity.district || "Berlin",
        addressRegion: "Berlin",
        addressCountry: "DE",
      },
    },
    ...(activity.is_free
      ? { offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", availability: "https://schema.org/InStock" } }
      : activity.price_info
        ? { offers: { "@type": "Offer", price: activity.price_info, priceCurrency: "EUR" } }
        : {}),
    organizer: { "@type": "Organization", name: activity.location_name },
    ...(activity.source_url ? { url: activity.source_url } : {}),
  };

  const seoDesc =
    (activity.description?.slice(0, 155) ||
      `${activity.title} – Aktivität für Kinder in ${activity.district || "Berlin"}.`);

  return (
    <div className="min-h-screen pb-10">
      <SEO
        title={`${activity.title} – ${activity.district || "Berlin"} | Rausmi`}
        description={seoDesc}
        path={`/activity/${activity.id}`}
        type="article"
        jsonLd={eventJsonLd}
      />
      <header className="px-5 pt-8 pb-4 flex items-center justify-between">
        <Link
          to="/"
          className="font-display font-bold text-2xl tracking-tight text-foreground flex items-center gap-1.5"
        >
          <span>🟠</span>
          <span>Rausmi</span>
        </Link>
        <button
          onClick={() => toggle(activity.id)}
          className={`flex items-center gap-1.5 text-sm font-semibold rounded-full px-3 py-2 transition-all ${
            bookmarked
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
          }`}
        >
          <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`} />
          {bookmarked ? "Gemerkt" : "Merken"}
        </button>
      </header>

      <div className="px-5 space-y-6 max-w-3xl mx-auto">
        {/* Status + Sponsored badges */}
        <div className="flex flex-wrap gap-2">
          {statusLabel && (
            <span className={statusType === "live" ? "chip chip-live" : "chip chip-soon"}>
              {statusLabel}
            </span>
          )}
          {activity._sponsored && (
            <span className="chip bg-accent/15 text-accent font-bold flex items-center gap-1">
              <Star className="w-3 h-3" />
              Sponsored
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-display font-bold text-2xl leading-tight text-foreground">
          {activity.title}
        </h1>

        {/* Description */}
        {activity.description && (
          <p className="text-base text-muted-foreground leading-relaxed">
            {activity.description}
          </p>
        )}

        {/* Info card */}
        <div className="space-y-4 bg-card rounded-2xl p-5 border border-border" style={{ boxShadow: "var(--shadow-card)" }}>
          {/* Time */}
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary shrink-0" />
            <span className="text-sm font-medium">{formatActivityTime(startTime, endTime)}</span>
          </div>

          {/* Recurrence */}
          {activity.recurring && (activity.recurrence_rule || activity._dayOfWeek) && (
            <div className="flex items-center gap-3">
              <Repeat className="w-5 h-5 text-accent shrink-0" />
              <span className="text-sm font-medium">
                {getRecurringDayLabel(activity.recurrence_rule, activity._dayOfWeek)}
              </span>
            </div>
          )}

          {/* Venue + Address */}
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary shrink-0" />
            <div>
              <span className="text-sm block font-medium">{activity.location_name}</span>
              {activity.address && (
                <span className="text-xs text-muted-foreground">{activity.address}</span>
              )}
            </div>
          </div>

          {/* District */}
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground/50 shrink-0" />
            <span className="text-sm text-muted-foreground">{activity.district}</span>
          </div>

          {/* Age */}
          {ageDisplay && (
            <div className="flex items-center gap-3">
              <Baby className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm">{ageDisplay}</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-primary shrink-0" />
            <span className="text-sm">
              {activity.is_free ? "Kostenlos" : activity.price_info || "Kostenpflichtig"}
            </span>
          </div>

          {/* Registration */}
          {activity.registration_required && (
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-destructive shrink-0" />
              <span className="text-sm font-medium text-destructive">Anmeldung erforderlich</span>
            </div>
          )}
        </div>

        {/* Registration link */}
        {activity._registrationLink && (
          <a
            href={activity._registrationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Zur Anmeldung
          </a>
        )}

        {/* Source link */}
        {activity.source_url && (() => {
          const isPdf = /\.pdf(\?|#|$)/i.test(activity.source_url);
          return (
            <a
              href={activity.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
            >
              {isPdf ? <FileText className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
              {isPdf ? "Quelle als PDF öffnen" : "Originalquelle ansehen"}
            </a>
          );
        })()}

        {/* Reviews list */}
        <ActivityReviewsList activityId={activity.id} />

        {/* Review form */}
        <ActivityReviewForm
          activityId={activity.id}
          activityTitle={activity.title}
        />

        {/* Report form */}
        <ActivityReportForm
          activityId={activity.id}
          activityTitle={activity.title}
          activitySourceUrl={activity.source_url}
        />




        {/* Verified metadata */}
        {activity._verifiedAt && (
          <p className="text-xs text-muted-foreground/60">
            Verifiziert am {new Date(activity._verifiedAt).toLocaleDateString("de-DE")}
          </p>
        )}
      </div>
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  );
};

export default ActivityDetail;
