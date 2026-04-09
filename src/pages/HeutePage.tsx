import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityCard } from "@/components/ActivityCard";
import { EmptyState } from "@/components/EmptyState";
import { fetchHeuteActivities } from "@/lib/activity-queries";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { Footer } from "@/components/Footer";

export default function HeutePage() {
  const { toggle, isBookmarked } = useBookmarks();

  const { data: activities, isLoading } = useQuery({
    queryKey: ["heute"],
    queryFn: () => fetchHeuteActivities(),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 pb-10">
        <header className="px-5 pt-6 pb-4 flex items-center gap-3 max-w-3xl mx-auto w-full">
          <Button variant="ghost" size="icon" className="rounded-full -ml-2" asChild>
            <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <Link to="/" className="font-display font-semibold text-sm text-muted-foreground hover:text-primary transition-colors">
            🟠 Rausmi
          </Link>
        </header>

        <div className="px-5 space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="font-display font-bold text-2xl text-foreground">Heute</h1>
            {activities && (
              <span className="text-sm text-muted-foreground font-medium">
                {activities.length} {activities.length === 1 ? "Aktivität" : "Aktivitäten"}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map((a, i) => (
                <div key={a.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <ActivityCard activity={a} isBookmarked={isBookmarked(a.id)} onToggleBookmark={toggle} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
