import { useParams, Navigate, Link } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

// Simple in-file post store. Set `published: true` and it goes live + indexable.
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
    date: "2026",
    published: true,
    excerpt:
      "Indoor-Spielplätze, Museen, Bibliotheken und andere trockene Ideen für den nächsten Regentag in Berlin.",
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
          mehrere Optionen mit Café-Bereich für Eltern – perfekt, um sich selbst
          aufzuwärmen, während die Kinder toben.
        </p>

        <h2>2. Kindercafés mit Spielecke</h2>
        <p>
          Kleine, gemütliche Ecken zum Toben und Kaffee trinken. Rausmi listet aktuell
          die besten Cafés in Neukölln und Prenzlauer Berg – siehe Startseite.
        </p>

        <h2>3. Bibliotheken & Vorlesestunden</h2>
        <p>
          Kostenlos, warm und meistens sehr entspannt. Viele Berliner Stadtbibliotheken
          bieten regelmäßige Vorlesestunden auf Deutsch (und manchmal Englisch oder
          Türkisch) an.
        </p>

        <h2>4. Museen für Kinder</h2>
        <p>
          Das MACHmit! Museum, das Labyrinth Kindermuseum und das Naturkundemuseum sind
          bei schlechtem Wetter besonders lohnend – interaktiv, überdacht und mit
          genügend Platz zum Entdecken.
        </p>

        <h2>5. Schwimmen im Hallenbad</h2>
        <p>
          Wenn draußen alles grau ist, wirkt ein Nachmittag im warmen Wasser Wunder.
          Viele Berliner Hallenbäder haben separate Kleinkinderbereiche mit flachem
          Wasser.
        </p>
      </>
    ),
  },

  "indoor-spielplaetze-berlin": {
    title: "Die besten Indoor-Spielplätze in Berlin",
    tag: "Indoor",
    date: "2026",
    published: true,
    excerpt:
      "Wo Kinder in Berlin bei jedem Wetter toben können – unsere Übersicht der beliebtesten Indoor-Spielplätze.",
    body: (
      <>
        <p>
          Indoor-Spielplätze sind die Rettung für jeden Berliner Regentag. Ob Klettern,
          Rutschen oder Bällebad – hier eine Übersicht der Optionen, die bei Familien
          besonders beliebt sind.
        </p>

        <h2>Für Kleinkinder (1–3 Jahre)</h2>
        <p>
          Kleinere, ruhigere Spielorte funktionieren am besten. Viele Kindercafés in
          Neukölln und Prenzlauer Berg bieten geschützte Spielecken mit weichen
          Matten, kleinen Rutschen und altersgerechtem Spielzeug.
        </p>

        <h2>Für Kindergartenkinder (3–6 Jahre)</h2>
        <p>
          Ab diesem Alter darf es größer werden: Kletterlandschaften, Trampoline und
          Bällebäder stehen hoch im Kurs. Achte auf Öffnungszeiten unter der Woche –
          vormittags ist es meist deutlich ruhiger als am Wochenende.
        </p>

        <h2>Für Schulkinder (6+ Jahre)</h2>
        <p>
          Größere Hallen mit Klettergerüsten, Fußballkäfigen oder Trampolinparks
          bieten Platz zum Austoben. Viele Locations liegen etwas außerhalb – eine
          gute Ausrede für einen kleinen Ausflug am Wochenende.
        </p>

        <h2>Tipps für den Besuch</h2>
        <p>
          Rutschsocken nicht vergessen – sie sind fast überall Pflicht. Getränke und
          Snacks sind meist vor Ort erhältlich, aber oft teuer. Und: Wochentags nach
          der Kita ist es entspannter als samstags um 14 Uhr.
        </p>

        <p className="text-sm text-muted-foreground italic mt-8">
          Aktuelle Öffnungszeiten und laufende Angebote findest du direkt in unserer
          Aktivitätensuche auf der Startseite.
        </p>
      </>
    ),
  },

  "kindercafes-neukoelln-favoriten": {
    title: "Kindercafés in Neukölln: unsere Favoriten",
    tag: "Neukölln",
    date: "2026",
    published: true,
    excerpt:
      "Kaffee für Eltern, Spielecke für Kinder – die schönsten Kindercafés in Neukölln im Überblick.",
    body: (
      <>
        <p>
          Neukölln hat sich in den letzten Jahren zu einem der familienfreundlichsten
          Bezirke Berlins entwickelt. Zwischen Hermannplatz und Rixdorf gibt es
          inzwischen eine ganze Reihe Cafés, in denen Eltern in Ruhe einen Kaffee
          trinken können, während die Kinder in der Spielecke beschäftigt sind.
        </p>

        <h2>Was ein gutes Kindercafé ausmacht</h2>
        <p>
          Aus Elternsicht: guter Kaffee, freundliches Personal, gemütliche Atmosphäre.
          Aus Kindersicht: eine übersichtliche Spielecke, altersgemischtes Spielzeug
          und genug Platz zum Bewegen ohne dass sofort jemand ausgebremst wird.
        </p>

        <h2>Unsere Empfehlungen in Neukölln</h2>
        <p>
          Wir haben aktuell mehrere Cafés im Bezirk kuratiert – von der klassischen
          Frühstücksadresse mit Spielecke bis zum modernen Café mit ruhiger
          Rückzugsecke für Familien. Die vollständige Liste mit Adressen, Fotos und
          Öffnungszeiten findest du direkt auf der Startseite.
        </p>

        <h2>Tipps aus dem Alltag</h2>
        <p>
          Vormittags unter der Woche ist die beste Zeit für einen entspannten Besuch.
          Samstag und Sonntag zwischen 10 und 12 Uhr sind viele Cafés voll –
          Reservierung lohnt sich, wenn angeboten. Und: die meisten Cafés haben einen
          Wickeltisch, aber nicht alle. Wenn du das brauchst, ruf im Zweifel kurz an
          oder schau in unsere Wickeltisch-Karte.
        </p>

        <p className="text-sm text-muted-foreground italic mt-8">
          Alle Cafés mit Spielecke findest du im Karussell auf der Startseite unter
          „Kindercafés mit Spielecke".
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
          <Link to="/" aria-label="Rausmi Startseite">
            <div className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
              <span className="text-2xl">🟠</span>
              <span>Rausmi</span>
            </div>
          </Link>
        </header>

        <div className="flex-1 pb-10 pt-4">


        <article className="px-5 max-w-2xl mx-auto pt-4 space-y-6">
          <header className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              {post.tag} · {post.date}
            </p>
            <h1 className="font-display font-bold text-3xl md:text-4xl leading-tight">
              {post.title}
            </h1>
          </header>

          <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-display prose-headings:font-bold prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3 prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:my-5">
            {post.body}
          </div>
        </article>
      </div>
      <Footer />
    </div>
  );
};

export default MagazinPost;
