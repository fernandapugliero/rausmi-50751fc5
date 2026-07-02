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


          {/* Ad banner: FixMyDiaper — brand card with mini OSM-style map */}
          <section>
            <a
              href="https://fixmydiaper.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-[170px] w-full overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-sm transition-all hover:shadow-lg active:scale-[0.99]"
            >
              {/* Content */}
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    {/* Safety-pin logo mark */}
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-foreground" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 15 L18 4 a2.5 2.5 0 0 1 3.5 3.5 L9 20 a3 3 0 1 1 -4.2 -4.2 Z" />
                      <circle cx="6.2" cy="17.8" r="1.6" />
                    </svg>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Anzeige · FixMyDiaper
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold leading-tight text-foreground">
                    Wickeltisch gesucht?
                  </h3>
                  <p className="mt-1 text-xs font-medium leading-snug text-muted-foreground">
                    Babyfreundliche Orte in deiner Nähe.
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[13px] font-bold text-foreground">
                  Karte öffnen
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17 L17 7 M9 7 h8 v8" />
                  </svg>
                </div>
              </div>

              {/* Mini OSM-style map */}
              <div className="relative w-[160px] shrink-0 overflow-hidden" style={{ backgroundColor: "#f2efe9" }}>
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 160 170"
                  preserveAspectRatio="xMidYMid slice"
                  aria-hidden="true"
                >
                  {/* park */}
                  <path d="M110 -10 Q160 20 155 60 Q150 85 120 80 Q95 75 100 40 Z" fill="#c8dcb0" />
                  {/* water */}
                  <path d="M-10 130 Q30 115 60 130 Q90 148 60 175 L-10 180 Z" fill="#aeceea" />
                  {/* building blocks */}
                  <g fill="#e7e2d6">
                    <rect x="12" y="18" width="26" height="20" rx="2" />
                    <rect x="12" y="46" width="18" height="22" rx="2" />
                    <rect x="55" y="90" width="22" height="18" rx="2" />
                    <rect x="85" y="95" width="26" height="22" rx="2" />
                    <rect x="120" y="105" width="28" height="18" rx="2" />
                  </g>
                  {/* street casings */}
                  <g stroke="#e6c37a" strokeLinecap="round" fill="none">
                    <path d="M-10 78 Q60 68 170 92" strokeWidth="9" />
                    <path d="M55 -10 Q68 60 62 180" strokeWidth="8" />
                    <path d="M130 -10 Q118 70 150 180" strokeWidth="7" />
                  </g>
                  {/* street fills */}
                  <g stroke="#ffffff" strokeLinecap="round" fill="none">
                    <path d="M-10 78 Q60 68 170 92" strokeWidth="5" />
                    <path d="M55 -10 Q68 60 62 180" strokeWidth="4.5" />
                    <path d="M130 -10 Q118 70 150 180" strokeWidth="3.5" />
                  </g>
                  <path d="M20 130 L110 145" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9" />
                </svg>

                {/* map pins (droplet) */}
                {[
                  { x: 40, y: 50, size: 18 },
                  { x: 92, y: 38, size: 20 },
                  { x: 118, y: 68, size: 17 },
                  { x: 72, y: 96, size: 18 },
                  { x: 104, y: 122, size: 16 },
                ].map((p, i) => (
                  <svg
                    key={i}
                    className="absolute drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.25)]"
                    style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 2 C7.6 2 4 5.6 4 10 c0 6 8 12 8 12 s8-6 8-12 c0-4.4-3.6-8-8-8 z"
                      fill="#2563eb"
                      stroke="#ffffff"
                      strokeWidth="1.6"
                    />
                    <circle cx="12" cy="10" r="2.6" fill="#ffffff" />
                  </svg>
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
