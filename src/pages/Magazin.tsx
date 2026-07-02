import { Link } from "react-router-dom";
import { ArrowUpRight, CloudRain, Sparkles, Coffee } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

const posts = [
  {
    slug: "was-tun-wenn-es-regnet-berlin",
    title: "Was tun mit Kindern, wenn's in Berlin regnet?",
    excerpt:
      "Indoor-Spielplätze, Museen, Bibliotheken und andere trockene Ideen für den nächsten Regentag.",
    icon: CloudRain,
    tag: "Bei Regen",
    date: "2026",
  },
  {
    slug: "indoor-spielplaetze-berlin",
    title: "Die besten Indoor-Spielplätze in Berlin",
    excerpt:
      "Wo Kinder in Berlin bei jedem Wetter toben können – unsere Übersicht der beliebtesten Indoor-Spielplätze.",
    icon: Sparkles,
    tag: "Indoor",
    date: "2026",
  },
  {
    slug: "kindercafes-neukoelln-favoriten",
    title: "Kindercafés in Neukölln: unsere Favoriten",
    excerpt:
      "Kaffee für Eltern, Spielecke für Kinder – die schönsten Kindercafés in Neukölln im Überblick.",
    icon: Coffee,
    tag: "Neukölln",
    date: "2026",
  },
];

const Magazin = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Magazin – Rausmi"
        description="Getestete Ideen und Empfehlungen für Familien in Berlin."
        path="/magazin"
      />
      <div className="flex-1 pb-10">

        <div className="px-5 space-y-8 max-w-3xl mx-auto pt-4">
          <section className="text-center space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Magazin</p>
            <h1 className="font-display font-bold text-4xl leading-tight">
              Getestet, kuratiert, kinderfreundlich.
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              Redaktionelle Beiträge zu Berliner Familien-Alltag – von echten Eltern für echte Eltern.
            </p>
          </section>

          <section className="grid gap-4">
            {posts.map((p) => {
              const Icon = p.icon;
              return (
                <Link
                  key={p.slug}
                  to={`/magazin/${p.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold tracking-widest uppercase text-primary">
                      {p.tag} · {p.date}
                    </p>
                    <h3 className="font-display font-bold text-base text-card-foreground mt-1">
                      {p.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {p.excerpt}
                    </p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              );
            })}
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Magazin;
