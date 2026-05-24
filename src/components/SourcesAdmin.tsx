import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Play, Power, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { BERLIN_DISTRICTS, type BerlinDistrict } from "@/lib/types";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export const SourcesAdmin = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState<string | null>(null);

  const { data: sources, isLoading } = useQuery({
    queryKey: ["admin-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sources")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: runsBySource } = useQuery({
    queryKey: ["admin-source-runs-latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("source_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const map: Record<string, typeof data[number]> = {};
      for (const r of data) {
        if (!map[r.source_id]) map[r.source_id] = r;
      }
      return map;
    },
  });

  const runExtraction = async (sourceId: string) => {
    setRunning(sourceId);
    try {
      const { data, error } = await supabase.functions.invoke("extract-source", {
        body: { source_id: sourceId },
      });
      if (error) throw error;
      const d = data as { found?: number; new?: number; updated?: number; error?: string };
      if (d.error) {
        toast.error(d.error);
      } else {
        toast.success(`${d.found ?? 0} gefunden — ${d.new ?? 0} neu, ${d.updated ?? 0} aktualisiert`);
      }
      qc.invalidateQueries({ queryKey: ["admin-sources"] });
      qc.invalidateQueries({ queryKey: ["admin-source-runs-latest"] });
      qc.invalidateQueries({ queryKey: ["admin-activities"] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Fehler";
      toast.error(msg);
    } finally {
      setRunning(null);
    }
  };

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("sources")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-sources"] }),
  });

  const deleteSource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Quelle gelöscht");
      qc.invalidateQueries({ queryKey: ["admin-sources"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Webseiten von Familienzentren, die wöchentlich per KI ausgelesen werden.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Quelle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Neue Quelle hinzufügen</DialogTitle>
            </DialogHeader>
            <SourceForm onDone={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : sources && sources.length > 0 ? (
        <div className="space-y-3">
          {sources.map((s) => {
            const latest = runsBySource?.[s.id];
            return (
              <div
                key={s.id}
                className="bg-card rounded-2xl p-4 border border-border space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                      {s.name}
                      {!s.is_active && (
                        <Badge variant="outline" className="text-[10px]">
                          inaktiv
                        </Badge>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground">{s.district}</p>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary inline-flex items-center gap-1 mt-1 break-all"
                    >
                      {s.url}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>

                {latest && (
                  <div className="text-xs text-muted-foreground border-t border-border/50 pt-2">
                    Letzter Lauf:{" "}
                    {format(new Date(latest.started_at), "dd.MM. HH:mm", { locale: de })} —{" "}
                    <Badge
                      variant={
                        latest.status === "success"
                          ? "default"
                          : latest.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {latest.status}
                    </Badge>{" "}
                    {latest.status === "success" && (
                      <span>
                        {latest.found_count} gefunden · {latest.new_count} neu ·{" "}
                        {latest.updated_count} aktualisiert
                      </span>
                    )}
                    {latest.error && (
                      <div className="text-destructive mt-1">{latest.error}</div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    className="rounded-full gap-1.5"
                    onClick={() => runExtraction(s.id)}
                    disabled={running === s.id}
                  >
                    {running === s.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    Jetzt ausführen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1.5"
                    onClick={() => toggleActive.mutate({ id: s.id, is_active: !s.is_active })}
                  >
                    <Power className="w-3.5 h-3.5" />
                    {s.is_active ? "Deaktivieren" : "Aktivieren"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm(`Quelle "${s.name}" löschen?`)) deleteSource.mutate(s.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Löschen
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Noch keine Quellen. Füge ein Familienzentrum hinzu, um zu starten.
        </div>
      )}
    </div>
  );
};

const SourceForm = ({ onDone }: { onDone: () => void }) => {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [district, setDistrict] = useState<BerlinDistrict | "">("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [extraUrls, setExtraUrls] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      if (!name || !url || !district) throw new Error("Name, URL und Bezirk sind Pflichtfelder.");
      const { error } = await supabase.from("sources").insert({
        name,
        url,
        district: district as BerlinDistrict,
        address: address || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        extra_urls: extraUrls
          ? extraUrls.split("\n").map((s) => s.trim()).filter(Boolean)
          : [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Quelle hinzugefügt");
      qc.invalidateQueries({ queryKey: ["admin-sources"] });
      onDone();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Fehler"),
  });

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. FaNN" />
      </div>
      <div>
        <Label htmlFor="url">Webseite *</Label>
        <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
      </div>
      <div>
        <Label>Bezirk *</Label>
        <Select value={district} onValueChange={(v) => setDistrict(v as BerlinDistrict)}>
          <SelectTrigger>
            <SelectValue placeholder="Bezirk wählen" />
          </SelectTrigger>
          <SelectContent>
            {BERLIN_DISTRICTS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="address">Adresse</Label>
        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="lat">Latitude</Label>
          <Input id="lat" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="52.4..." />
        </div>
        <div>
          <Label htmlFor="lng">Longitude</Label>
          <Input id="lng" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="13.4..." />
        </div>
      </div>
      <div>
        <Label htmlFor="extra">Zusätzliche URLs (optional, 1 pro Zeile)</Label>
        <Textarea
          id="extra"
          value={extraUrls}
          onChange={(e) => setExtraUrls(e.target.value)}
          rows={2}
          placeholder="https://.../programm.pdf"
        />
      </div>
      <Button
        className="w-full rounded-full"
        onClick={() => create.mutate()}
        disabled={create.isPending}
      >
        {create.isPending ? "Speichern..." : "Hinzufügen"}
      </Button>
    </div>
  );
};
