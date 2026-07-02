import { MapPin, Clock, Bookmark, Navigation, Repeat, Share2, Star, Link2, MessageCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Activity } from "@/lib/types";
import type { AirtableActivity } from "@/lib/airtable";
import { getRelativeTimeLabel, formatActivityTime, getAgeLabel, getCategoryIcon, getRecurringDayLabel } from "@/lib/utils";
import { formatDistance } from "@/lib/activity-queries";
import { toast } from "sonner";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface ActivityCardProps {
  activity: (Activity | AirtableActivity) & { _distance?: number | null; _ageLabel?: string | null; _sponsored?: boolean; _recurrenceType?: string | null; _dayOfWeek?: string | null; _sourceCreatedAt?: string };
  isBookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
}

export function ActivityCard({ activity, isBookmarked, onToggleBookmark }: ActivityCardProps) {
  const navigate = useNavigate();
  const startTime = new Date(activity.start_time);
  const endTime = activity.end_time ? new Date(activity.end_time) : null;
  const { label: statusLabel, type: statusType } = getRelativeTimeLabel(startTime, endTime);

  // "Neu": row created within last 7 days (uses source row created_at when available)
  const createdRef = (activity as { _sourceCreatedAt?: string })._sourceCreatedAt ?? activity.created_at;
  const isNew = createdRef ? (Date.now() - new Date(createdRef).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleBookmark?.(activity.id);
  };

  const shareUrl = `${(typeof window !== "undefined" && window.location.origin) || ""}/activity/${activity.id}`;
  const richShareText = [
    `🟠 ${activity.title}`,
    `📅 ${formatActivityTime(startTime, endTime)}`,
    `📍 ${activity.location_name}${activity.district ? `, ${activity.district}` : ""}`,
    activity.is_free ? "✨ Kostenlos" : (activity.price_info ? `💶 ${activity.price_info}` : ""),
    "",
    `👉 ${shareUrl}`,
    "",
    "Gefunden auf Rausmi – Aktivitäten mit Kindern in Berlin",
  ].filter(Boolean).join("\n");
  const shareText = `${activity.title} – ${activity.location_name}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(richShareText)}`;

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.share) {
        await navigator.share({ title: activity.title, text: richShareText, url: shareUrl });
      } else {
        throw new Error("not supported");
      }
    } catch {
      await navigator.clipboard.writeText(shareUrl);
      toast.info("Teilen nicht verfügbar – Link wurde kopiert!");
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link kopiert!");
    } catch {
      toast.error("Konnte Link nicht kopieren");
    }
  };


  return (
    <div
      className="card-activity cursor-pointer group"
      onClick={() => navigate(`/activity/${activity.id}`)}
      role="button"
      tabIndex={0}
    >
      {/* Color accent bar */}
      <div className={`h-1.5 ${statusType === "live" ? "bg-secondary" : statusType === "soon" ? "bg-accent" : "bg-primary/30"}`} />
      
      <div className="p-5 space-y-3">
        {/* Top row: status + actions */}
        <div className="flex items-center justify-between">
          <div>
            {statusLabel && (
              <span className={statusType === "live" ? "chip chip-live" : "chip chip-soon"}>
                {statusLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1.5 bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                  aria-label="Teilen"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-48 p-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-secondary" />
                  WhatsApp
                </a>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                >
                  <Link2 className="w-4 h-4 text-primary" />
                  Link kopieren
                </button>
                {typeof navigator !== "undefined" && "share" in navigator && (
                  <button
                    onClick={handleNativeShare}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                  >
                    <Share2 className="w-4 h-4 text-muted-foreground" />
                    Mehr…
                  </button>
                )}
              </PopoverContent>
            </Popover>
            {onToggleBookmark && (
              <button
                onClick={handleBookmark}
                className={`flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1.5 transition-all ${
                  isBookmarked
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                }`}
                aria-label={isBookmarked ? "Gespeichert" : "Merken"}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-current" : ""}`} />
                {isBookmarked ? "Gemerkt" : "Merken"}
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-lg leading-tight text-card-foreground group-hover:text-primary transition-colors">
          {activity.title}
        </h3>

        {/* Description */}
        {activity.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {activity.description}
          </p>
        )}

        {/* Time + recurring */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 shrink-0 text-primary" />
          <span className="font-medium">{formatActivityTime(startTime, endTime)}</span>
        </div>
        {activity.recurring && (activity.recurrence_rule || activity._dayOfWeek) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Repeat className="w-4 h-4 shrink-0 text-accent" />
            <span className="font-medium">{getRecurringDayLabel(activity.recurrence_rule, activity._dayOfWeek)}</span>
          </div>
        )}

        {/* Location + distance */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 shrink-0 text-primary" />
          <span className="truncate">{activity.location_name}</span>
          {activity._distance != null && (
            <span className="flex items-center gap-1 shrink-0 text-secondary font-semibold">
              <Navigation className="w-3.5 h-3.5" />
              {formatDistance(activity._distance)}
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className={activity.is_free ? "chip chip-free" : "chip chip-paid"}>
            {activity.is_free ? "Kostenlos" : activity.price_info || "Kostenpflichtig"}
          </span>
          <span className="chip chip-district">{activity.district}</span>
          {activity._ageLabel ? (
            <span className="chip chip-age">{activity._ageLabel}</span>
          ) : (
            Array.from(new Set(activity.age_groups.map((age) => getAgeLabel(age)))).map((label) => (
              <span key={label} className="chip chip-age">
                {label}
              </span>
            ))
          )}
          {activity._sponsored && (
            <span className="chip bg-accent/15 text-accent font-bold flex items-center gap-1">
              <Star className="w-3 h-3" />
              Sponsored
            </span>
          )}
          {activity.registration_required && (
            <span className="chip bg-destructive/15 text-destructive font-bold">
              Anmeldung nötig
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
