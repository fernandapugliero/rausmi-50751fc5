import { useQuery } from "@tanstack/react-query";
import { Download, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

type Subscriber = {
  id: string;
  email: string;
  districts: string[] | null;
  confirmed_at: string | null;
  is_active: boolean;
  created_at: string;
};

export function NewsletterAdmin() {
  const { data: subs, isLoading } = useQuery({
    queryKey: ["admin-newsletter-subs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("id, email, districts, confirmed_at, is_active, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Subscriber[];
    },
  });

  const exportCSV = () => {
    if (!subs || subs.length === 0) {
      toast.info("Keine Einträge zum Exportieren");
      return;
    }
    const header = ["email", "districts", "is_active", "confirmed_at", "created_at"];
    const rows = subs.map((s) => [
      s.email,
      (s.districts ?? []).join("|"),
      s.is_active ? "true" : "false",
      s.confirmed_at ?? "",
      s.created_at,
    ]);
    const csv = [header, ...rows]
      .map((r) =>
        r
          .map((v) => {
            const str = String(v ?? "");
            return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
          })
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${subs.length} Einträge exportiert`);
  };

  const confirmed = subs?.filter((s) => s.confirmed_at).length ?? 0;
  const pending = subs?.filter((s) => !s.confirmed_at).length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">{subs?.length ?? 0}</span>
            <span className="text-muted-foreground">gesamt</span>
          </div>
          <Badge variant="secondary" className="rounded-full">{confirmed} bestätigt</Badge>
          <Badge variant="outline" className="rounded-full">{pending} ausstehend</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={exportCSV} className="rounded-full gap-1.5">
          <Download className="w-3.5 h-3.5" />
          CSV exportieren
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : !subs || subs.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          Noch keine Anmeldungen.
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {subs.map((s, idx) => (
            <div
              key={s.id}
              className={`p-3 flex items-center justify-between gap-3 ${
                idx > 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{s.email}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{format(new Date(s.created_at), "dd.MM.yyyy", { locale: de })}</span>
                  {s.districts && s.districts.length > 0 && (
                    <span>· {s.districts.join(", ")}</span>
                  )}
                </div>
              </div>
              {s.confirmed_at ? (
                <Badge variant="secondary" className="rounded-full text-[10px]">bestätigt</Badge>
              ) : (
                <Badge variant="outline" className="rounded-full text-[10px]">ausstehend</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
