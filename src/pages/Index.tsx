import { useState } from "react";
import fixmydiaperMap from "@/assets/fixmydiaper-map.jpg.asset.json";
import { Footer } from "@/components/Footer";
import { Bookmark, Plus, ArrowUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { QuickActions } from "@/components/QuickActions";
import { KindercafeCarousel } from "@/components/KindercafeCarousel";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { AuthDialog } from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import type { SearchFilters } from "@/lib/types";


const Index = () => {
  const navigate = useNavigate();
  const { showAuthDialog, setShowAuthDialog } = useBookmarks();
  const { user } = useAuth();

  const handleQuickAction = (timeRange: SearchFilters["timeRange"]) => {
    if (timeRange === "now") navigate("/jetzt");
    else if (timeRange === "today") navigate("/heute");
    else if (timeRange === "tomorrow") navigate("/morgen");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 pb-10">
        <header className="px-5 pt-8 pb-2 flex items-center justify-between max-w-3xl mx-auto w-full">
          <Link to="/">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
              <span className="text-2xl">🟠</span>
              <span>Rausmi</span>
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
          {/* Hero */}
          <section className="pt-6 pb-2 text-center space-y-2">
            <h2 className="font-display font-bold text-4xl md:text-5xl leading-[1.15] text-foreground tracking-tight">
              Was du <span className="hero-highlight">jetzt</span> mit Kindern in Berlin<span className="text-primary align-super text-2xl">*</span> machen kannst.
            </h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold uppercase tracking-wide text-[11px] text-primary/80 mr-1.5">Beta</span>
              *aktuell nur in Neukölln verfügbar
            </p>
          </section>



          {/* Quick Actions + Datum */}
          <section className="space-y-3">
            <QuickActions onSelect={handleQuickAction} />

            {/* Datum auswählen — navigates to /datum */}
            <button
              className="quick-action-btn w-full"
              onClick={() => navigate("/datum")}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                </div>
                <div className="text-left">
                  <span className="font-display font-semibold text-base text-card-foreground block">
                    Datum auswählen
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Wähle ein Datum
                  </span>
                </div>
              </div>
            </button>
          </section>

          {/* Kindercafé carousel */}
          <KindercafeCarousel />

          {/* CTA: Sign up to save */}
          {!user && (
            <section
              className="relative rounded-2xl border border-primary/20 bg-card p-5 cursor-pointer group hover:border-primary/40 transition-all"
              onClick={() => setShowAuthDialog(true)}
            >
              <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-primary" />
              <div className="flex items-center gap-4 pl-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-primary tracking-wide uppercase">
                    Nie wieder verpassen
                  </p>
                  <h3 className="font-display font-bold text-base text-card-foreground leading-snug mt-1">
                    Speichere Aktivitäten und erhalte Erinnerungen.
                  </h3>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Kostenlos · Kein Spam
                  </p>
                </div>
                <div className="shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bookmark className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
            </section>
          )}

          {/* CTAs: Submit activity + event */}
          <section className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/aktivitaet-einreichen")}
              className="group relative flex flex-col justify-between text-left rounded-[2rem] bg-card border-2 border-primary/15 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/60 hover:-translate-y-1 active:scale-[0.98]"
            >
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-primary">Mitmachen</p>
                <h3 className="font-display font-bold text-base text-card-foreground leading-snug mt-1.5">
                  Aktivität<br />vorschlagen
                </h3>
              </div>
              <div className="mt-8 flex justify-end">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25 transition-transform group-hover:scale-110">
                  <Plus className="w-5 h-5" strokeWidth={3} />
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/event-einreichen")}
              className="group relative flex flex-col justify-between text-left rounded-[2rem] bg-card border-2 border-accent/25 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-accent hover:-translate-y-1 active:scale-[0.98]"
            >
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-accent-foreground/70">Community</p>
                <h3 className="font-display font-bold text-base text-card-foreground leading-snug mt-1.5">
                  Event<br />einreichen
                </h3>
              </div>
              <div className="mt-8 flex justify-end">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground shadow-lg shadow-accent/30 transition-transform group-hover:scale-110">
                  <Plus className="w-5 h-5" strokeWidth={3} />
                </div>
              </div>
            </button>
          </section>


          {/* Ad banner: FixMyDiaper */}
          <section>
            <a
              href="https://fixmydiaper.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-[175px] w-full overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm transition-all hover:shadow-lg active:scale-[0.99]"
            >
              {/* Content */}
              <div className="flex flex-1 flex-col justify-center p-5 pr-3">
                <span className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Anzeige · FixMyDiaper
                </span>
                <h3 className="font-display text-xl font-bold leading-tight text-foreground">
                  Hast du Wickel gesagt?
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-snug">
                  Finde Wickeltische in deiner Nähe.
                </p>
              </div>

              {/* Map image with pins */}
              <div className="relative w-[150px] shrink-0 overflow-hidden">
                <img
                  src={fixmydiaperMap.url}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* soft blend into card */}
                <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-card to-transparent" />
              </div>
            </a>
          </section>




          {/* Newsletter signup */}
          <NewsletterSignup />
        </div>
        <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
