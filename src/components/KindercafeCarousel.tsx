import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MapPin, Coffee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import kindercafePlaceholder from "@/assets/kindercafe-placeholder.jpg";

interface Kindercafe {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  district: string;
  image_url: string | null;
  features: string[];
  is_sponsored: boolean;
  google_maps_url: string | null;
}

export function KindercafeCarousel() {
  const navigate = useNavigate();

  const { data: cafes, isLoading } = useQuery({
    queryKey: ["kindercafes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kindercafes")
        .select("*")
        .eq("is_approved", true)
        .order("is_sponsored", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Kindercafe[];
    },
  });

  if (isLoading) {
    return (
      <section className="space-y-3">
        <h2 className="font-display font-bold text-lg text-foreground">
          Cafés mit Spielecke
        </h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-5 px-5">
          {[1, 2].map((i) => (
            <div key={i} className="w-[300px] h-[420px] shrink-0 rounded-[32px] bg-muted animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!cafes || cafes.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display font-bold text-lg text-foreground tracking-tight">
          Cafés mit Spielecke
        </h2>
        <button
          onClick={() => navigate("/kindercafe-einreichen")}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Café eintragen
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2 snap-x snap-mandatory">
        {cafes.map((cafe) => (
          <button
            key={cafe.id}
            onClick={() => navigate(`/kindercafe/${cafe.id}`)}
            className="relative flex-none w-[300px] h-[420px] rounded-[32px] overflow-hidden snap-center group text-left transition-transform active:scale-[0.98]"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            {/* Photo — softened to match site palette */}
            <img
              src={cafe.image_url || kindercafePlaceholder}
              alt={`Spielecke bei ${cafe.name}`}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ filter: "saturate(0.82) contrast(0.94) brightness(0.98)" }}
              loading="lazy"
            />

            {/* Warm brand tint — unifies photo with site palette */}
            <div
              className="absolute inset-0 mix-blend-multiply pointer-events-none"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.10), hsl(var(--accent) / 0.08))" }}
            />
            {/* Paper grain / softening layer */}
            <div className="absolute inset-0 bg-[hsl(var(--background))]/10 mix-blend-soft-light pointer-events-none" />

            {/* Gradient overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

            {/* Sponsored badge */}
            {cafe.is_sponsored && (
              <span className="absolute top-5 left-5 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
                Empfohlen
              </span>
            )}

            {/* Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-1.5 text-white/85 mb-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  {cafe.district}
                </span>
              </div>

              <h3 className="font-display text-2xl font-bold text-white mb-3 tracking-tight leading-tight">
                {cafe.name}
              </h3>

              {cafe.features.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {cafe.features.slice(0, 3).map((f) => (
                    <span
                      key={f}
                      className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-[11px] font-medium px-3 py-1 rounded-full"
                    >
                      {f}
                    </span>
                  ))}
                  {cafe.features.length > 3 && (
                    <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white/80 text-[11px] font-medium px-3 py-1 rounded-full">
                      +{cafe.features.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}

        {/* CTA card */}
        <button
          onClick={() => navigate("/kindercafe-einreichen")}
          className="flex-none w-[300px] h-[420px] rounded-[32px] border-2 border-dashed border-primary/25 bg-primary/5 flex flex-col items-center justify-center p-8 snap-center hover:border-primary/50 hover:bg-primary/10 transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Coffee className="w-6 h-6 text-primary" />
          </div>
          <p className="font-display font-bold text-base text-center text-card-foreground">
            Kennst du ein Café mit Spielecke?
          </p>
          <p className="text-xs text-muted-foreground text-center mt-1.5">
            Trage es hier ein!
          </p>
        </button>
      </div>
    </section>
  );
}
