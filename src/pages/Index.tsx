import { useState } from "react";
import { Footer } from "@/components/Footer";
import { Bookmark, Plus, ExternalLink } from "lucide-react";
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

          {/* Ad banner: FixMyDiaper */}
          <section>
            <a
              href="https://fixmydiaper.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block overflow-hidden rounded-3xl border border-border/60 hover:shadow-lg transition-all"
            >
              <img
                src={fixMyDiaperBanner}
                alt="Wickeltisch in Berlin finden"
                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                width={1280}
                height={512}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/10" />
              <div className="absolute inset-0 flex items-center justify-between px-5">
                <div className="min-w-0 max-w-[65%]">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-primary/80 mb-1">
                    Anzeige · FixMyDiaper
                  </p>
                  <h3 className="font-display font-bold text-base text-foreground leading-tight">
                    Wickeltisch in der Nähe finden
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    Jetzt entdecken
                    <ExternalLink className="w-3 h-3" />
                  </p>
                </div>
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
