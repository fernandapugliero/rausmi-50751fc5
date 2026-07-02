import { useState } from "react";
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
              className="relative text-left rounded-3xl bg-primary/10 p-5 pb-6 group active:scale-[0.98] transition-transform"
            >
              <p className="text-[10px] font-bold tracking-widest uppercase text-primary">Mitmachen</p>
              <h3 className="font-display font-bold text-base text-card-foreground leading-snug mt-2 pr-6">
                Aktivität vorschlagen
              </h3>
              <div className="absolute bottom-4 right-4 w-9 h-9 rounded-2xl bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
              </div>
            </button>

            <button
              onClick={() => navigate("/event-einreichen")}
              className="relative text-left rounded-3xl bg-accent/15 p-5 pb-6 group active:scale-[0.98] transition-transform"
            >
              <p className="text-[10px] font-bold tracking-widest uppercase text-accent-foreground/70">Community</p>
              <h3 className="font-display font-bold text-base text-card-foreground leading-snug mt-2 pr-6">
                Event einreichen
              </h3>
              <div className="absolute bottom-4 right-4 w-9 h-9 rounded-2xl bg-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-4 h-4 text-accent-foreground" strokeWidth={2.5} />
              </div>
            </button>
          </section>

          {/* Ad banner: FixMyDiaper — minimal card with pulsing blue map pins */}
          <section>
            <a
              href="https://fixmydiaper.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-[150px] w-full overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm transition-all hover:shadow-lg active:scale-[0.98]"
            >
              {/* Content */}
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Anzeige · FixMyDiaper
                  </span>
                  <h3 className="font-display text-lg font-bold leading-tight text-foreground">
                    Wickeltisch gesucht?
                  </h3>
                  <p className="mt-1 text-xs font-medium leading-snug text-muted-foreground">
                    Babyfreundliche Orte in deiner Nähe.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-foreground px-4 py-2 text-[11px] font-bold text-background">
                    Karte öffnen
                  </div>
                  {/* Safety-pin logo mark */}
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 15 L18 4 a2.5 2.5 0 0 1 3.5 3.5 L9 20 a3 3 0 1 1 -4.2 -4.2 Z" />
                    <circle cx="6.2" cy="17.8" r="1.6" />
                  </svg>
                </div>
              </div>

              {/* Map graphic */}
              <div className="relative w-[130px] shrink-0 overflow-hidden bg-muted/40">
                {/* subtle grid */}
                <svg className="absolute inset-0 h-full w-full opacity-20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <defs>
                    <pattern id="fmd-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#fmd-grid)" />
                </svg>

                {/* pulsing blue pins */}
                {[
                  { x: "32%", y: "26%", size: "h-2.5 w-2.5", delay: "0s" },
                  { x: "72%", y: "48%", size: "h-3 w-3", delay: "0.4s" },
                  { x: "48%", y: "74%", size: "h-2 w-2", delay: "0.8s" },
                  { x: "68%", y: "30%", size: "h-2.5 w-2.5", delay: "1.2s" },
                ].map((p, i) => (
                  <span
                    key={i}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${p.size}`}
                    style={{
                      left: p.x,
                      top: p.y,
                      backgroundColor: "#3b82f6",
                      boxShadow: "0 0 10px rgba(59,130,246,0.55)",
                      animation: `pulse 2.4s cubic-bezier(0.4,0,0.6,1) ${p.delay} infinite`,
                    }}
                    aria-hidden="true"
                  />
                ))}

                {/* soft blend into card */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-card to-transparent" />
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
