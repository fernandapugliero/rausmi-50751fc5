import { useState, useMemo, useEffect } from "react";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, ChevronDown, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
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
import { TimeRangeSlider } from "@/components/TimeRangeSlider";

interface ActivityResultsProps {
  defaultTimeRange: SearchFilters["timeRange"];
  title: string;
}

const ActivityResults = ({ defaultTimeRange, title }: ActivityResultsProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const cdParam = searchParams.get("cd");
  const initialCustomDate = cdParam ? new Date(cdParam) : undefined;

  const [filters, setFilters] = useState<SearchFilters>(() => ({
    timeRange: defaultTimeRange,
    customDate: initialCustomDate,
  }));
  const [customDate, setCustomDate] = useState<Date | undefined>(initialCustomDate);
  const [isLocating, setIsLocating] = useState(false);
  const [activeLocation, setActiveLocation] = useState<string>();
  const [searchQuery, setSearchQuery] = useState("");
  const [showRunning, setShowRunning] = useState(true);
  const [showStarting, setShowStarting] = useState(true);
  const { toggle, isBookmarked, showAuthDialog, setShowAuthDialog } = useBookmarks();
  const { user } = useAuth();
  const [ageAutoApplied, setAgeAutoApplied] = useState(false);

  // Pre-filter by youngest child's age when the user is logged in and has profile data.
  useEffect(() => {
    if (!user || ageAutoApplied) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("children_ages")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const ages = (data?.children_ages ?? []) as number[];
      if (!ages.length) {
        setAgeAutoApplied(true);
        return;
      }
      const youngest = Math.min(...ages);
      const ageGroup =
        youngest < 1 ? "0-1" : youngest < 3 ? "1-3" : "3+";
      setFilters((f) => (f.ageGroup ? f : { ...f, ageGroup }));
      setAgeAutoApplied(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, ageAutoApplied]);


  // Time-of-day range slider (everything except "now")
  const showTimeSlider = defaultTimeRange !== "now";
  // Initial "from" defaults to the current half-hour only when the target date is today.
  // We compute this once per (defaultTimeRange, cdParam) change — not per render — so dragging
  // the slider never causes a reset.
  const initialFromMinute = useMemo(() => {
    if (defaultTimeRange !== "today") return 0;
    const now = new Date();
    return Math.floor((now.getHours() * 60 + now.getMinutes()) / 30) * 30;
  }, [defaultTimeRange, cdParam]);
  const [hourRange, setHourRange] = useState<[number, number]>([initialFromMinute, 1440]);
  useEffect(() => {
    setHourRange([initialFromMinute, 1440]);
  }, [initialFromMinute]);


  // Sync filters when route/defaultTimeRange or ?cd= changes (without remounting)
  useEffect(() => {
    const newCustom = cdParam ? new Date(cdParam) : undefined;
    setCustomDate(newCustom);
    setFilters((f) => ({
      ...f,
      timeRange: defaultTimeRange,
      customDate: defaultTimeRange === "custom" ? newCustom : undefined,
    }));
  }, [defaultTimeRange, cdParam]);

  const { data: rawActivities, isLoading } = useQuery({
    queryKey: ["activities", filters],
    queryFn: () => searchActivities(filters),
  });

  const activities = useMemo(() => {
    if (!rawActivities) return rawActivities;
    const q = searchQuery.trim().toLowerCase();
    let list = rawActivities;
    if (q) {
      list = list.filter((a) =>
        [a.title, a.description, a.location_name, a.district]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }
    if (showTimeSlider) {
      const [from, to] = hourRange;
      list = list.filter((a) => {
        const d = new Date(a.start_time);
        const mins = d.getHours() * 60 + d.getMinutes();
        return mins >= from && mins <= to;
      });
    }
    return list;
  }, [rawActivities, searchQuery, showTimeSlider, hourRange]);

  // For /jetzt, split into "already running" vs "starting soon"
  const { running, starting } = useMemo(() => {
    if (!activities || filters.timeRange !== "now") {
      return { running: [], starting: [] };
    }
    const now = Date.now();
    const running: typeof activities = [];
    const starting: typeof activities = [];
    for (const a of activities) {
      if (new Date(a.start_time).getTime() <= now) running.push(a);
      else starting.push(a);
    }
    return { running, starting };
  }, [activities, filters.timeRange]);



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
            <Link
              to="/konto"
              className="text-sm text-primary font-semibold hover:underline transition-colors"
            >
              Mein Konto
            </Link>
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

          {/* Time-of-day slider (Heute / Morgen) */}
          {showTimeSlider && (
            <section>
              <TimeRangeSlider
                value={hourRange}
                onValueChange={setHourRange}
                min={0}
                max={1440}
                step={30}
                label="Zeitfenster"
              />
            </section>
          )}

          {/* Search bar */}
          <section>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Suchen…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl bg-card border-border h-10"
              />
            </div>
          </section>

          {/* Results */}
          <section>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : !activities || activities.length === 0 ? (
              <EmptyState />
            ) : filters.timeRange === "now" ? (
              <div className="space-y-6">
                {running.length > 0 && (
                  <CollapsibleSection
                    label="Läuft gerade"
                    count={running.length}
                    open={showRunning}
                    onToggle={() => setShowRunning((v) => !v)}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {running.map((activity, i) => (
                        <div
                          key={activity.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${i * 60}ms` }}
                        >
                          <ActivityCard
                            activity={activity}
                            isBookmarked={isBookmarked(activity.id)}
                            onToggleBookmark={toggle}
                          />
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}
                {starting.length > 0 && (
                  <CollapsibleSection
                    label="Beginnt bald"
                    count={starting.length}
                    open={showStarting}
                    onToggle={() => setShowStarting((v) => !v)}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {starting.map((activity, i) => (
                        <div
                          key={activity.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${i * 60}ms` }}
                        >
                          <ActivityCard
                            activity={activity}
                            isBookmarked={isBookmarked(activity.id)}
                            onToggleBookmark={toggle}
                          />
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}
              </div>
            ) : (
              (() => {
                const saved = activities.filter((a) => isBookmarked(a.id));
                const others = activities.filter((a) => !isBookmarked(a.id));
                return (
                  <div className="space-y-8">
                    {saved.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <h2 className="font-display font-bold text-lg text-foreground">
                            Gespeichert
                          </h2>
                          <span className="text-sm text-muted-foreground font-medium">
                            ({saved.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {saved.map((activity, i) => (
                            <div
                              key={activity.id}
                              className="animate-fade-in"
                              style={{ animationDelay: `${i * 60}ms` }}
                            >
                              <ActivityCard
                                activity={activity}
                                isBookmarked={true}
                                onToggleBookmark={toggle}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display font-bold text-lg">
                          {timeLabels[filters.timeRange]}
                        </h2>
                        <span className="text-sm text-muted-foreground font-medium">
                          {others.length} {others.length === 1 ? "Ergebnis" : "Ergebnisse"}
                        </span>
                      </div>
                      {others.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center space-y-3">
                          <p className="text-3xl">🧸</p>
                          <p className="text-sm text-foreground font-medium">
                            Hier ist gerade wenig los.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Probier ein anderes Zeitfenster oder schau bei den Kindercafés vorbei.
                          </p>
                          <div className="flex flex-wrap justify-center gap-2 pt-1">
                            <a
                              href="/"
                              className="text-xs font-semibold rounded-full bg-primary/10 text-primary px-3 py-1.5 hover:bg-primary/20 transition-colors"
                            >
                              Kindercafés ansehen →
                            </a>
                            <a
                              href="/magazin"
                              className="text-xs font-semibold rounded-full bg-muted text-foreground px-3 py-1.5 hover:bg-muted/70 transition-colors"
                            >
                              Ideen im Magazin
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {others.map((activity, i) => (
                            <div
                              key={activity.id}
                              className="animate-fade-in"
                              style={{ animationDelay: `${i * 80}ms` }}
                            >
                              <ActivityCard
                                activity={activity}
                                isBookmarked={false}
                                onToggleBookmark={toggle}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}

          </section>
        </div>
        <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      </div>
      <Footer />
    </div>
  );
};

interface CollapsibleSectionProps {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection = ({ label, count, open, onToggle, children }: CollapsibleSectionProps) => (
  <div>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="w-full flex items-center justify-between mb-4 group"
    >
      <div className="flex items-baseline gap-2">
        <h2 className="font-display font-bold text-lg text-foreground">{label}</h2>
        <span className="text-sm text-muted-foreground font-medium">({count})</span>
      </div>
      <ChevronDown
        className={cn(
          "w-5 h-5 text-muted-foreground transition-transform duration-200 group-hover:text-foreground",
          !open && "-rotate-90"
        )}
      />
    </button>
    {open && <div className="animate-fade-in">{children}</div>}
  </div>
);

export default ActivityResults;

