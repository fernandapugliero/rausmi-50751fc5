import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { Zap, Sun, Sunrise, Bookmark, Plus, ExternalLink } from "lucide-react";
import { KindercafeCarousel } from "@/components/KindercafeCarousel";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { AuthDialog } from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const { showAuthDialog, setShowAuthDialog } = useBookmarks();
  const { user, signOut } = useAuth();

  const actions = [
    {
      to: "/jetzt",
      label: "Jetzt",
      sublabel: "Aktivitäten in den nächsten 3 Stunden",
      icon: Zap,
      gradient: "from-primary to-primary/80",
      textColor: "text-primary-foreground",
    },
    {
      to: "/heute",
      label: "Heute",
      sublabel: "Alle Aktivitäten heute",
      icon: Sun,
      gradient: "from-secondary to-secondary/80",
      textColor: "text-secondary-foreground",
    },
    {
      to: "/morgen",
      label: "Morgen",
      sublabel: "Alle Aktivitäten morgen",
      icon: Sunrise,
      gradient: "from-accent to-accent/80",
      textColor: "text-accent-foreground",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 pb-10">
        <header className="px-5 pt-8 pb-2 flex items-center justify-between max-w-3xl mx-auto w-full">
          <Link to="/">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
              <span className="text-2xl">🟠</span> Rausmi
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
          {/* Hero */}
          <section className="pt-6 pb-2 text-center">
            <h2 className="font-display font-bold text-4xl md:text-5xl leading-[1.15] text-foreground tracking-tight">
              Was du <span className="hero-highlight">jetzt</span> mit Kindern in Berlin machen kannst.
            </h2>
          </section>

          {/* 3 Navigation Buttons */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {actions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r ${action.gradient} ${action.textColor} transition-all duration-200 active:scale-[0.97] hover:scale-[1.02]`}
                style={{ boxShadow: "var(--shadow-hero)" }}
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="font-display font-bold text-lg block leading-tight">{action.label}</span>
                  <span className="text-sm opacity-90">{action.sublabel}</span>
                </div>
              </Link>
            ))}
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
                  <p className="text-[13px] font-semibold text-primary tracking-wide uppercase">Nie wieder verpassen</p>
                  <h3 className="font-display font-bold text-base text-card-foreground leading-snug mt-1">
                    Speichere Aktivitäten und erhalte Erinnerungen.
                  </h3>
                  <p className="text-[13px] text-muted-foreground mt-1">Kostenlos · Kein Spam</p>
                </div>
                <div className="shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bookmark className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
            </section>
          )}

          {/* CTA: Submit activity */}
          <section
            className="relative rounded-2xl border border-primary/20 bg-card p-5 cursor-pointer group hover:border-primary/40 transition-all"
            onClick={() => navigate("/aktivitaet-einreichen")}
          >
            <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-primary" />
            <div className="flex items-center gap-4 pl-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-primary tracking-wide uppercase">Mitmachen</p>
                <h3 className="font-display font-bold text-base text-card-foreground leading-snug mt-1">
                  Neue Aktivität einreichen oder Korrektur vorschlagen?
                </h3>
                <p className="text-[13px] text-muted-foreground mt-1">Hilf dem Rausmi zu wachsen und mehr Familien zu erreichen</p>
              </div>
              <div className="shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
          </section>

          {/* CTA: Submit event */}
          <section
            className="relative rounded-2xl border border-accent/30 bg-card p-5 cursor-pointer group hover:border-accent/50 transition-all"
            onClick={() => navigate("/event-einreichen")}
          >
            <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-accent" />
            <div className="flex items-center gap-4 pl-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-accent tracking-wide uppercase">Community</p>
                <h3 className="font-display font-bold text-base text-card-foreground leading-snug mt-1">
                  Kennst du ein tolles Event? Reiche es ein!
                </h3>
                <p className="text-[13px] text-muted-foreground mt-1">Wir prüfen und veröffentlichen es</p>
              </div>
              <div className="shrink-0 w-10 h-10 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-accent-foreground" />
              </div>
            </div>
          </section>

          {/* Ad banner */}
          <section>
            <a href="https://fixmydiaper.com" target="_blank" rel="noopener noreferrer"
              className="relative block rounded-2xl border border-border/60 bg-muted/30 p-4 group hover:bg-muted/50 transition-all">
              <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest mb-2">Anzeige</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-sm text-foreground/80 leading-snug">Wickeltisch in der Nähe finden?</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Restaurants, Cafés und öffentliche Orte mit Wickelmöglichkeit in Berlin</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
              </div>
            </a>
          </section>

          {/* Newsletter */}
          <NewsletterSignup />
        </div>
        <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
