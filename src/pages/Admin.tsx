import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Trash2, Eye, EyeOff, Settings, Database, Flag, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { approveActivity, deleteActivity } from "@/lib/activity-queries";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/EmptyState";
import { CrawlerOverridesAdmin } from "@/components/CrawlerOverridesAdmin";
import { SourcesAdmin } from "@/components/SourcesAdmin";
import { ReportsAdmin } from "@/components/ReportsAdmin";
import { NewsletterAdmin } from "@/components/NewsletterAdmin";
import { AuthDialog } from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Tab = "pending" | "approved" | "sources" | "crawler" | "reports" | "newsletter";


const Admin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("pending");
  const { user, loading: authLoading } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  // Check if user has admin role
  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user,
  });

  const { data: activities, isLoading } = useQuery({
    queryKey: ["admin-activities"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_activities");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  const approveMutation = useMutation({
    mutationFn: approveActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-activities"] });
      toast.success("Aktivität freigegeben");
    },
    onError: (e) => toast.error(`Fehler: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-activities"] });
      toast.success("Aktivität gelöscht");
    },
    onError: (e) => toast.error(`Fehler: ${e.message}`),
  });

  const filtered = activities?.filter((a) =>
    tab === "approved" ? a.is_approved : !a.is_approved
  );

  // Loading state
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse mx-auto" />
          <p className="text-sm text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-5">
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="font-display text-xl font-bold">Admin-Bereich</h1>
          <p className="text-sm text-muted-foreground">
            Bitte melde dich an, um den Admin-Bereich zu nutzen.
          </p>
          <Button className="rounded-full" onClick={() => setShowAuthDialog(true)}>
            Anmelden
          </Button>
          <Button variant="ghost" className="rounded-full" onClick={() => navigate("/")}>
            Zurück zur Startseite
          </Button>
        </div>
        <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-5">
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="font-display text-xl font-bold">Kein Zugriff</h1>
          <p className="text-sm text-muted-foreground">
            Du hast keine Admin-Berechtigung.
          </p>
          <Button variant="outline" className="rounded-full" onClick={() => navigate("/")}>
            Zurück zur Startseite
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8 bg-muted/30">
      <header className="px-5 pt-6 pb-4 flex items-center gap-3 bg-card border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-display text-xl font-bold">Admin</h1>
          <p className="text-xs text-muted-foreground">Events verwalten</p>
        </div>
      </header>

      <div className="px-5 py-4 space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={tab === "pending" ? "default" : "outline"}
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => setTab("pending")}
          >
            <EyeOff className="w-3.5 h-3.5" />
            Ausstehend
          </Button>
          <Button
            variant={tab === "approved" ? "default" : "outline"}
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => setTab("approved")}
          >
            <Eye className="w-3.5 h-3.5" />
            Freigegeben
          </Button>
          <Button
            variant={tab === "sources" ? "default" : "outline"}
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => setTab("sources")}
          >
            <Database className="w-3.5 h-3.5" />
            Quellen
          </Button>
          <Button
            variant={tab === "crawler" ? "default" : "outline"}
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => setTab("crawler")}
          >
            <Settings className="w-3.5 h-3.5" />
            Crawler-Daten
          </Button>
          <Button
            variant={tab === "reports" ? "default" : "outline"}
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => setTab("reports")}
          >
            <Flag className="w-3.5 h-3.5" />
            Reports
          </Button>
          <Button
            variant={tab === "newsletter" ? "default" : "outline"}
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => setTab("newsletter")}
          >
            <Mail className="w-3.5 h-3.5" />
            Newsletter
          </Button>
        </div>

        {tab === "sources" ? (
          <SourcesAdmin />
        ) : tab === "crawler" ? (
          <CrawlerOverridesAdmin />
        ) : tab === "reports" ? (
          <ReportsAdmin />
        ) : tab === "newsletter" ? (
          <NewsletterAdmin />

        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((activity) => {
              const isDuplicate = !!(activity as { duplicate_of_activity_id?: string | null }).duplicate_of_activity_id;
              const original = isDuplicate
                ? activities?.find((x) => x.id === (activity as { duplicate_of_activity_id?: string }).duplicate_of_activity_id)
                : null;
              const isCommunity = !activity.source_id && (!!activity.submitter_email || !!activity.submitted_by || activity.source === "user-submission");
              return (
              <div
                key={activity.id}
                className="bg-card rounded-2xl p-4 border border-border space-y-2"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-semibold text-sm flex items-center gap-1.5 flex-wrap">
                      {activity.title}
                      {isCommunity && (
                        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/5">
                          Community
                        </Badge>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.location_name} · {activity.district}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.start_time), "dd. MMM yyyy HH:mm", { locale: de })}
                    </p>
                    {isCommunity && (activity.submitter_name || activity.submitter_email) && (
                      <p className="text-[11px] text-primary/80 mt-1">
                        Eingereicht von: {activity.submitter_name || "—"}
                        {activity.submitter_email && ` · ${activity.submitter_email}`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge variant={activity.is_approved ? "default" : "secondary"}>
                      {activity.is_approved ? "Live" : "Ausstehend"}
                    </Badge>
                    {isDuplicate && (
                      <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600">
                        Duplikat
                      </Badge>
                    )}
                  </div>
                </div>

                {isDuplicate && original && (
                  <div className="text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-amber-700 dark:text-amber-400">
                    Möglicherweise Duplikat von „{original.title}" ({format(new Date(original.start_time), "EEE HH:mm", { locale: de })})
                  </div>
                )}

                {activity.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {activity.description}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  {!activity.is_approved && (
                    <Button
                      size="sm"
                      className="rounded-full gap-1.5"
                      onClick={() => approveMutation.mutate(activity.id)}
                      disabled={approveMutation.isPending}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Freigeben
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => deleteMutation.mutate(activity.id)}
                    disabled={deleteMutation.isPending}
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
          <EmptyState
            title={tab === "approved" ? "Keine freigegebenen Events" : "Keine ausstehenden Events"}
            description={
              tab === "approved"
                ? "Freigegebene Events erscheinen hier"
                : "Importierte Events werden hier zur Überprüfung angezeigt"
            }
          />
        )}
      </div>
    </div>
  );
};

export default Admin;
