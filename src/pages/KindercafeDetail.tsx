import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Globe, Mail, ExternalLink, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import kindercafePlaceholder from "@/assets/kindercafe-placeholder.jpg";


const KindercafeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: cafe, isLoading } = useQuery({
    queryKey: ["kindercafe", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kindercafes")
        .select("*")
        .eq("id", id!)
        .eq("is_approved", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const isClosed = cafe ? /vorübergehend geschlossen|temporarily closed/i.test(cafe.description ?? "") : false;

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="h-[60vh] w-full bg-muted animate-pulse" />
        <div className="px-5 pt-6 space-y-4">
          <div className="h-8 w-3/4 rounded-xl bg-muted animate-pulse" />
          <div className="h-4 w-full rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="text-center">
          <h2 className="font-display font-semibold text-lg mb-2">Café nicht gefunden</h2>
          <Button variant="outline" className="rounded-full" onClick={() => navigate("/")}>
            Zurück
          </Button>
        </div>
      </div>
    );
  }

  const mapsUrl =
    cafe.google_maps_url ||
    (cafe.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${cafe.name} ${cafe.address}`
        )}`
      : null);

  return (
    <div className="min-h-screen pb-28 bg-background">
      {/* Immersive hero */}
      <div className="relative w-full h-[70vh] min-h-[420px] max-h-[720px] overflow-hidden">
        <img
          src={cafe.image_url || kindercafePlaceholder}
          alt={cafe.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {/* Floating header — matches ActivityDetail pattern */}
        <header className="absolute top-0 inset-x-0 px-5 pt-6 pb-4 flex items-center justify-between z-10">
          <Link
            to="/"
            className="font-display font-bold text-2xl tracking-tight text-white drop-shadow-md flex items-center gap-1.5"
          >
            <span>🟠</span>
            <span>Rausmi</span>
          </Link>
          {cafe.is_sponsored && !isClosed && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white px-2.5 py-1 rounded-full">
              <Sparkles className="w-3 h-3" />
              Empfohlen
            </span>
          )}
          {isClosed && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-black/75 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/20">
              <AlertTriangle className="w-3 h-3" />
              Vorübergehend geschlossen
            </span>
          )}
        </header>

        {/* Title block */}
        <div className="absolute bottom-0 inset-x-0 px-5 pb-7 z-10">
          <div className="max-w-3xl mx-auto space-y-3">
            {cafe.district && (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full">
                <MapPin className="w-3 h-3" />
                {cafe.district}
              </div>
            )}
            <h1 className="font-display font-bold text-4xl sm:text-5xl leading-[1.05] text-white drop-shadow-lg">
              {cafe.name}
            </h1>
            {cafe.features && cafe.features.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {cafe.features.slice(0, 4).map((f: string) => (
                  <span
                    key={f}
                    className="text-[11px] font-medium text-white bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-8 max-w-3xl mx-auto space-y-8">
        {cafe.description && (
          <p className="text-base leading-relaxed text-foreground/90">
            {cafe.description}
          </p>
        )}

        {isClosed && (
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 flex items-start gap-3">
            <div className="w-9 h-9 shrink-0 rounded-full bg-black/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <div className="font-semibold text-sm">Vorübergehend geschlossen</div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Dieses Café ist aktuell nicht geöffnet. Bitte prüfe vor einem Besuch die Website oder Social-Media-Kanäle des Betriebs.
              </p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="grid gap-2">
          {cafe.address && (
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border">
              <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                  Adresse
                </div>
                <div className="text-sm font-medium">{cafe.address}</div>
              </div>
            </div>
          )}

          {cafe.website_url && (
            <a
              href={cafe.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors group"
            >
              <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                  Website
                </div>
                <div className="text-sm font-medium text-primary truncate">
                  {cafe.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          )}

          {cafe.contact_email && (
            <a
              href={`mailto:${cafe.contact_email}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors"
            >
              <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                  Kontakt
                </div>
                <div className="text-sm font-medium text-primary truncate">{cafe.contact_email}</div>
              </div>
            </a>
          )}
        </div>

        {/* All features */}
        {cafe.features && cafe.features.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Ausstattung
            </h2>
            <div className="flex flex-wrap gap-2">
              {cafe.features.map((f: string) => (
                <span key={f} className="chip chip-age">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      {mapsUrl && !isClosed && (
        <div className="fixed bottom-0 inset-x-0 px-5 pb-5 pt-4 bg-gradient-to-t from-background via-background to-transparent z-20">
          <div className="max-w-3xl mx-auto">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-12 rounded-full bg-foreground text-background font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity"
            >
              <MapPin className="w-4 h-4" />
              Route in Google Maps öffnen
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default KindercafeDetail;
