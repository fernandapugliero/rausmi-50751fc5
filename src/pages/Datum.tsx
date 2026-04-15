import { useState } from "react";
import { Footer } from "@/components/Footer";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { AuthDialog } from "@/components/AuthDialog";
import ActivityResults from "./ActivityResults";

const Datum = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cdParam = searchParams.get("cd");
  const { user, signOut } = useAuth();
  const { showAuthDialog, setShowAuthDialog } = useBookmarks();

  if (cdParam) {
    return <ActivityResults defaultTimeRange="custom" title="Datum" />;
  }

  // No date selected yet — show calendar picker
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      navigate(`/datum?cd=${date.toISOString()}`, { replace: true });
    }
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
            <button onClick={signOut} className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors">
              Abmelden
            </button>
          ) : (
            <button onClick={() => setShowAuthDialog(true)} className="text-sm text-primary font-semibold hover:underline transition-colors">
              Anmelden
            </button>
          )}
        </header>

        <div className="px-5 space-y-8 max-w-3xl mx-auto">
          <section className="pt-6 text-center">
            <h2 className="font-display font-bold text-2xl text-foreground">Datum auswählen</h2>
            <p className="text-sm text-muted-foreground mt-2">Wähle ein Datum, um Aktivitäten zu sehen</p>
          </section>

          <section className="flex justify-center">
            <Calendar
              mode="single"
              onSelect={handleSelect}
              initialFocus
              className={cn("p-3 pointer-events-auto rounded-2xl border")}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            />
          </section>
        </div>
        <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      </div>
      <Footer />
    </div>
  );
};

export default Datum;
