import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, X, LogOut, ArrowLeft, Loader2, Pencil } from "lucide-react";
import { Footer } from "@/components/Footer";
import { ActivityCard } from "@/components/ActivityCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllActivities } from "@/lib/activity-queries";
import { toast } from "sonner";

const DISTRICT_OPTIONS = [
  { value: "kreuzberg", label: "Kreuzberg" },
  { value: "neukoelln", label: "Neukölln" },
  { value: "friedrichshain", label: "Friedrichshain" },
  { value: "mitte", label: "Mitte" },
  { value: "prenzlauerberg", label: "Prenzlauer Berg" },
] as const;

interface ProfileData {
  display_name: string;
  city: string;
  district: string;
  children_ages: number[];
}

const EMPTY_PROFILE: ProfileData = {
  display_name: "",
  city: "",
  district: "",
  children_ages: [],
};

const Konto = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { toggle, isBookmarked } = useBookmarks();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newAge, setNewAge] = useState<string>("");
  const [editing, setEditing] = useState(false);

  const isBerlin = profile.city.trim().toLowerCase() === "berlin";
  const hasProfileData =
    !!profile.display_name.trim() ||
    !!profile.city.trim() ||
    !!profile.district ||
    profile.children_ages.length > 0;
  const districtLabel = DISTRICT_OPTIONS.find((d) => d.value === profile.district)?.label;

  // Redirect if not logged in (once auth resolved)
  useEffect(() => {
    if (!authLoading && !user) navigate("/");
  }, [authLoading, user, navigate]);

  // Load profile
  useEffect(() => {
    if (!user) return;
    setLoadingProfile(true);
    supabase
      .from("profiles")
      .select("display_name, city, district, children_ages")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const next: ProfileData = {
          display_name: data?.display_name ?? "",
          city: data?.city ?? "",
          district: data?.district ?? "",
          children_ages: data?.children_ages ?? [],
        };
        setProfile(next);
        const hasAny =
          !!next.display_name.trim() ||
          !!next.city.trim() ||
          !!next.district ||
          next.children_ages.length > 0;
        setEditing(!hasAny);
        setLoadingProfile(false);
      });
  }, [user]);

  // Load all activities to resolve bookmarks
  const { data: allActivities } = useQuery({
    queryKey: ["all-activities-for-bookmarks"],
    queryFn: fetchAllActivities,
    enabled: !!user,
  });

  const bookmarkedActivities = useMemo(() => {
    if (!allActivities) return [];
    return allActivities.filter((a) => isBookmarked(a.id));
  }, [allActivities, isBookmarked]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name.trim() || null,
        city: profile.city.trim() || null,
        district: isBerlin ? profile.district || null : null,
        children_ages: profile.children_ages,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Speichern fehlgeschlagen");
      return;
    }
    toast.success("Profil gespeichert");
    setEditing(false);
  };

  const addChild = () => {
    const age = parseInt(newAge, 10);
    if (isNaN(age) || age < 0 || age > 18) {
      toast.error("Bitte ein gültiges Alter eingeben (0–18)");
      return;
    }
    setProfile((p) => ({ ...p, children_ages: [...p.children_ages, age] }));
    setNewAge("");
  };

  const removeChild = (idx: number) => {
    setProfile((p) => ({
      ...p,
      children_ages: p.children_ages.filter((_, i) => i !== idx),
    }));
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 pb-10">
        <header className="px-5 pt-8 pb-2 flex items-center justify-between max-w-3xl mx-auto w-full">
          <Link to="/">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
              <span className="text-2xl">🟠</span>
              Rausmi
            </h1>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </Link>
        </header>

        <div className="px-5 space-y-10 max-w-3xl mx-auto pt-4">
          {/* Title */}
          <section>
            <h2 className="font-display font-bold text-2xl leading-tight text-foreground">
              Mein <span className="hero-highlight">Konto</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {user.email}
            </p>
          </section>

          {/* Profile */}
          <section>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display font-bold text-lg">Profil</h3>
              {!loadingProfile && !editing && hasProfileData && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 text-sm text-primary font-semibold hover:underline"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Bearbeiten
                </button>
              )}
            </div>
            {(!hasProfileData || editing) && (
              <p className="text-sm text-muted-foreground mb-4">
                Optional – hilft uns, passende Events zu empfehlen.
              </p>
            )}

            {loadingProfile ? (
              <div className="h-32 rounded-2xl bg-muted animate-pulse" />
            ) : !editing && hasProfileData ? (
              <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
                {profile.display_name && (
                  <div className="flex justify-between gap-4">
                    <span className="text-sm text-muted-foreground">Name</span>
                    <span className="text-sm font-medium text-foreground text-right">
                      {profile.display_name}
                    </span>
                  </div>
                )}
                {profile.city && (
                  <div className="flex justify-between gap-4">
                    <span className="text-sm text-muted-foreground">Stadt</span>
                    <span className="text-sm font-medium text-foreground text-right">
                      {profile.city}
                    </span>
                  </div>
                )}
                {districtLabel && (
                  <div className="flex justify-between gap-4">
                    <span className="text-sm text-muted-foreground">Bezirk</span>
                    <span className="text-sm font-medium text-foreground text-right">
                      {districtLabel}
                    </span>
                  </div>
                )}
                {profile.children_ages.length > 0 && (
                  <div className="flex justify-between gap-4 items-start">
                    <span className="text-sm text-muted-foreground">Kinder</span>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {profile.children_ages.map((age, idx) => (
                        <span key={idx} className="chip chip-age">
                          {age} {age === 1 ? "Jahr" : "Jahre"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-5 rounded-2xl bg-card border border-border p-5">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Name</Label>
                  <Input
                    id="display_name"
                    placeholder="Wie sollen wir dich nennen?"
                    value={profile.display_name}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, display_name: e.target.value }))
                    }
                    className="rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Stadt</Label>
                  <Input
                    id="city"
                    placeholder="z.B. Berlin"
                    value={profile.city}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, city: e.target.value }))
                    }
                    className="rounded-xl h-11"
                  />
                </div>

                {isBerlin && (
                  <div className="space-y-2 animate-fade-in">
                    <Label>Bezirk</Label>
                    <div className="flex flex-wrap gap-2">
                      {DISTRICT_OPTIONS.map((d) => {
                        const active = profile.district === d.value;
                        return (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() =>
                              setProfile((p) => ({
                                ...p,
                                district: active ? "" : d.value,
                              }))
                            }
                            className={`filter-chip ${active ? "active" : ""}`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Kinder & Alter</Label>
                  {profile.children_ages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {profile.children_ages.map((age, idx) => (
                        <span
                          key={idx}
                          className="chip chip-age flex items-center gap-1.5"
                        >
                          {age} {age === 1 ? "Jahr" : "Jahre"}
                          <button
                            type="button"
                            onClick={() => removeChild(idx)}
                            className="hover:text-destructive"
                            aria-label="Entfernen"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={18}
                      placeholder="Alter"
                      value={newAge}
                      onChange={(e) => setNewAge(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addChild();
                        }
                      }}
                      className="rounded-xl h-11 w-32"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addChild}
                      className="rounded-xl h-11"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Kind hinzufügen
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded-xl h-11 font-semibold bg-primary text-primary-foreground"
                >
                  {saving ? "Speichert…" : "Profil speichern"}
                </Button>
              </div>
            )}
          </section>

          {/* Saved events */}
          <section>
            <h3 className="font-display font-bold text-lg mb-4">
              Gespeicherte Events{" "}
              <span className="text-sm text-muted-foreground font-medium">
                ({bookmarkedActivities.length})
              </span>
            </h3>
            {bookmarkedActivities.length === 0 ? (
              <div className="rounded-2xl bg-card border border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Du hast noch keine Events gespeichert.
                </p>
                <Link
                  to="/"
                  className="inline-block mt-3 text-sm text-primary font-semibold hover:underline"
                >
                  Events entdecken →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookmarkedActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    isBookmarked={true}
                    onToggleBookmark={toggle}
                  />
                ))}
              </div>
            )}
          </section>
              </div>
            )}
          </section>

          {/* Sign out */}
          <section className="pt-4">
            <button
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Abmelden
            </button>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Konto;
