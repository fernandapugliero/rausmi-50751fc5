import { useState } from "react";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { FilterChips } from "@/components/FilterChips";
import { ActivityCard } from "@/components/ActivityCard";
import { EmptyState } from "@/components/EmptyState";
import { LocationFilter } from "@/components/LocationFilter";
import { searchActivities } from "@/lib/activity-queries";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { AuthDialog } from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import type { SearchFilters } from "@/lib/types";

interface ActivityResultsProps {
  defaultTimeRange: SearchFilters["timeRange"];
  title: string;
}

const ActivityResults = ({ defaultTimeRange, title }: ActivityResultsProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialCustomDate = searchParams.get("cd") ? new Date(searchParams.get("cd")!) : undefined;

  const [filters, setFilters] = useState<SearchFilters>(() => ({
    timeRange: defaultTimeRange,
    customDate: initialCustomDate,
  }));
  const [customDate, setCustomDate] = useState<Date | undefined>(initialCustomDate);
  const [isLocating, setIsLocating] = useState(false);
  const [activeLocation, setActiveLocation] = useState<string>();
  const { toggle, isBookmarked, showAuthDialog, setShowAuthDialog } = useBookmarks();
  const { user, signOut } = useAuth();

  const { data: activities, isLoading } = useQuery({
    queryKey: ["activities", filters],
    queryFn: () => searchActivities(filters),
  });

  const handleTimeRange = (timeRange: SearchFilters["timeRange"]) => {
    if (timeRange === "now") navigate("/jetzt");
    else if (timeRange === "today") navigate("/heute");
    else if (timeRange === "tomorrow") navigate("/morgen");
  };

  const handleNearMe = (lat: number, lng: number) => {
    setIsLocating(false);
    setActiveLocation("In der Nähe");
    setFilters((f) => ({ ...f, nearLat: lat, nearLng: lng, locationQuery: undefined, district: undefined }));
  };

  const handleSearchLocation = (query: string) => {
    setActiveLocation(query);
    setFilters((f) => ({ ...f, locationQuery: query, nearLat: undefined, nearLng: undefined, district: undefined }));
  };

  const handleCustomDate = (date: Date | undefined) => {
    setCustomDate(date);
    if (date) {
      navigate(`/datum?cd=${date.toISOString()}`);
    }
  };

  const timeLabels: Record<string, string> = {
    now: "Jetzt verfügbar",
    today: "Heute",
    tomorrow: "Morgen",
    custom: customDate ? format(customDate, "EEEE, dd. MMMM", { locale: de }) : "Ergebnisse",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 pb-10">
        <header className="px-5 pt-8 pb-2 flex items-center justify-between max-w-3xl mx-auto w-full">
          <Link to="/">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
              <span className="text-2xl">🟠</span>
              Rausmi
            </h1>
          </Link>
          {user ? (
            <button
              onClick={signOut}
              className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Abmelden
            </button>
          ) : (
            <button
              onClick={() => setShowAuthDialog(true)}
              className="text-sm text-primary font-semibold hover:underline transition-colors"
            >
              Anmelden
            </button>
          )}
        </header>

        <div className="px-5 space-y-8 max-w-3xl mx-auto">
          {/* Compact header */}
          <section className="pt-2">
            <h2 className="font-display font-bold text-2xl leading-tight text-foreground">
              Was machen mit{" "}
              <span className="hero-highlight">Kindern</span>?
            </h2>
          </section>

          {/* Time range tabs */}
          <section className="flex gap-2 overflow-x-auto -mx-5 px-5 scrollbar-hide pb-1">
            {(["now", "today", "tomorrow"] as const).map((key) => (
              <button
                key={key}
                className={`filter-chip ${filters.timeRange === key ? "active" : ""}`}
                onClick={() => handleTimeRange(key)}
              >
                {({ now: "Jetzt", today: "Heute", tomorrow: "Morgen" } as const)[key]}
              </button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <button className={`filter-chip ${filters.timeRange === "custom" ? "active" : ""}`}>
                  {customDate ? format(customDate, "dd. MMM", { locale: de }) : "Datum"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDate}
                  onSelect={handleCustomDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </section>

          {/* Location */}
          <section>
            <LocationFilter
              onNearMe={handleNearMe}
              onSearchLocation={handleSearchLocation}
              isLocating={isLocating}
              activeLocation={activeLocation}
            />
          </section>

          {/* Filters */}
          <section>
            <FilterChips filters={filters} onChange={(f) => setFilters(f)} />
          </section>

          {/* Results */}
          <section>
            {activities && activities.length > 0 && (
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg">
                  {timeLabels[filters.timeRange]}
                </h2>
                <span className="text-sm text-muted-foreground font-medium">
                  {activities.length} {activities.length === 1 ? "Ergebnis" : "Ergebnisse"}
                </span>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activities.map((activity, i) => (
                  <div
                    key={activity.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <ActivityCard
                      activity={activity}
                      isBookmarked={isBookmarked(activity.id)}
                      onToggleBookmark={toggle}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </section>
        </div>
        <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      </div>
      <Footer />
    </div>
  );
};

export default ActivityResults;
