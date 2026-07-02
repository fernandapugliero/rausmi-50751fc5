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
                    Babyfreundliche Orte mit Wickeltisch in deiner Nähe.
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
              <div className="relative w-[150px] shrink-0 overflow-hidden" style={{ backgroundColor: "#e8ebe0" }}>
                {/* park / green area */}
                <div className="absolute" style={{ left: "55%", top: "-10%", width: "80%", height: "55%", backgroundColor: "#d4e0c4", borderRadius: "40% 30% 45% 25%" }} />
                {/* water */}
                <div className="absolute" style={{ left: "-10%", bottom: "-15%", width: "80%", height: "45%", backgroundColor: "#b8d4e0", borderRadius: "30% 55% 20% 40%" }} />
                {/* streets */}
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 150 170" aria-hidden="true">
                  <line x1="-10" y1="60" x2="160" y2="90" stroke="#f0c674" strokeWidth="6" />
                  <line x1="40" y1="-10" x2="80" y2="180" stroke="#f0c674" strokeWidth="6" />
                  <line x1="120" y1="-10" x2="80" y2="180" stroke="#f0c674" strokeWidth="4" />
                  <line x1="-10" y1="120" x2="160" y2="140" stroke="#ffffff" strokeWidth="3" />
                </svg>

                {/* map pins (droplet) */}
                {[
                  { x: 62, y: 40, size: 18 },
                  { x: 105, y: 55, size: 20 },
                  { x: 70, y: 95, size: 16 },
                  { x: 115, y: 100, size: 18 },
                  { x: 55, y: 130, size: 16 },
                ].map((p, i) => (
                  <svg
                    key={i}
                    className="absolute drop-shadow-sm"
                    style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 2 C7.6 2 4 5.6 4 10 c0 6 8 12 8 12 s8-6 8-12 c0-4.4-3.6-8-8-8 z"
                      fill="#2563eb"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <circle cx="12" cy="10" r="2.6" fill="#ffffff" />
                  </svg>
                ))}

                {/* "you are here" ring pin */}
                <div
                  className="absolute rounded-full border-[3px] border-[#2563eb] bg-white"
                  style={{ left: 88, top: 68, width: 14, height: 14 }}
                  aria-hidden="true"
                />

                {/* soft blend into card */}
                <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-card to-transparent" />
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
