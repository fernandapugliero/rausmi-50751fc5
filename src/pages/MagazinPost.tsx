import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, CloudRain } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

// Simple in-file post store. Set `published: true` and remove `noindex` when ready.
const POSTS: Record<
  string,
  {
    title: string;
    tag: string;
    date: string;
    published: boolean;
    excerpt: string;
    body: React.ReactNode;
  }
> = {
  "was-tun-wenn-es-regnet-berlin": {
    title: "Was tun mit Kindern, wenn's in Berlin regnet?",
    tag: "Bei Regen",
    date: "Entwurf · 2025",
    published: false,
    excerpt:
      "Indoor-Spielplätze, Museen, Bibliotheken und andere trockene Ideen für den nächsten Regentag.",
    body: (
      <>
        <p>
          Berlin und Regen – eine feste Beziehung, besonders zwischen Oktober und März.
          Damit dir mit Kindern nicht die Decke auf den Kopf fällt, haben wir eine kurze
          Liste mit erprobten Ideen für Regentage gesammelt.
        </p>
        <h2>1. Indoor-Spielplätze</h2>
        <p>
          Klassiker für Kinder von etwa 1–8 Jahren. In Neukölln und Kreuzberg gibt es
          mehrere Optionen mit Café-Bereich für Eltern.
        </p>
        <h2>2. Kindercafés mit Spielecke</h2>
        <p>
          Kleine, gemütliche Ecken zum Toben und Kaffee trinken. Rausmi listet aktuell
          die besten Cafés in Neukölln und Prenzlauer Berg – siehe Startseite.
        </p>
        <h2>3. Bibliotheken & Vorlesestunden</h2>
        <p>
          Kostenlos, warm und meistens sehr entspannt. Viele Berliner Stadtbibliotheken
          bieten regelmäßige Vorlesestunden auf Deutsch (und manchmal Englisch/Türkisch).
        </p>
        <h2>4. Museen für Kinder</h2>
        <p>
          MACHmit! Museum, Labyrinth Kindermuseum und das Naturkundemuseum sind bei
          schlechtem Wetter besonders lohnend.
        </p>
        <p className="text-sm text-muted-foreground italic mt-8">
          Entwurf – dieser Text wird noch redigiert.
        </p>
      </>
    ),
  },
};

const MagazinPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? POSTS[slug] : undefined;

  if (!post) return <Navigate to="/magazin" replace />;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={`${post.title} – Rausmi Magazin`}
        description={post.excerpt}
        path={`/magazin/${slug}`}
        noindex={!post.published}
      />
      <div className="flex-1 pb-10">
        <header className="px-5 pt-8 pb-2 max-w-2xl mx-auto w-full">
          <Link
            to="/magazin"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Magazin
          </Link>
        </header>

        <article className="px-5 max-w-2xl mx-auto pt-4 space-y-6">
          <header className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              {post.tag} · {post.date}
            </p>
            <h1 className="font-display font-bold text-3xl md:text-4xl leading-tight">
              {post.title}
            </h1>
          </header>

          <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-display prose-headings:font-bold prose-h2:text-xl prose-h2:mt-8 prose-p:text-foreground/90">
            {post.body}
          </div>

          {!post.published && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
              <strong>Entwurf.</strong> Dieser Beitrag ist noch nicht öffentlich indexiert.
            </div>
          )}
        </article>
      </div>
      <Footer />
    </div>
  );
};

export default MagazinPost;
