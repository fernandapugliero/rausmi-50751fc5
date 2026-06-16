import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const REPORT_ISSUES = [
  { value: "late", label: "Aktivität hat verspätet begonnen" },
  { value: "did_not_happen", label: "Aktivität hat nicht stattgefunden" },
  { value: "no_longer_exists", label: "Aktivität existiert nicht mehr" },
  { value: "wrong_info", label: "Informationen sind falsch" },
  { value: "other", label: "Sonstiges" },
] as const;

export const reportIssueValues = REPORT_ISSUES.map((i) => i.value) as [string, ...string[]];

export const reportSchema = z.object({
  activity_id: z.string().min(1),
  activity_title: z.string().max(500).optional().nullable(),
  activity_source_url: z.string().max(2000).optional().nullable(),
  reporter_role: z.enum(["visitor", "organizer"]),
  issues: z.array(z.enum(reportIssueValues)).min(1, "Bitte wähle mindestens einen Grund"),
  comment: z.string().trim().max(1000).optional().nullable(),
});

export type ReportInput = z.infer<typeof reportSchema>;

export async function submitActivityReport(input: ReportInput) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Bitte anmelden");
  const parsed = reportSchema.parse(input);
  const { error } = await supabase.from("activity_reports").insert({
    activity_id: parsed.activity_id,
    activity_title: parsed.activity_title ?? null,
    activity_source_url: parsed.activity_source_url ?? null,
    reporter_user_id: auth.user.id,
    reporter_role: parsed.reporter_role,
    issues: parsed.issues,
    comment: parsed.comment?.trim() || null,
  });
  if (error) throw error;
}

export type ReportStatus = "open" | "resolved" | "dismissed";

export interface ActivityReport {
  id: string;
  activity_id: string;
  activity_title: string | null;
  activity_source_url: string | null;
  reporter_user_id: string;
  reporter_role: "visitor" | "organizer";
  issues: string[];
  comment: string | null;
  status: ReportStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function listReports(status: ReportStatus): Promise<ActivityReport[]> {
  const { data, error } = await supabase
    .from("activity_reports")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ActivityReport[]) ?? [];
}

export async function setReportStatus(id: string, status: ReportStatus) {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("activity_reports")
    .update({
      status,
      resolved_by: status === "open" ? null : auth.user?.id ?? null,
      resolved_at: status === "open" ? null : new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

/** Unpublishes the activity (sets is_approved=false). Crawler re-inserts as pending on next run, never auto-relive. */
export async function hideActivityViaOverride(activityId: string, _note?: string) {
  const baseId = activityId.split("__")[0];
  const { error } = await supabase
    .from("activities")
    .update({ is_approved: false })
    .eq("id", baseId);
  if (error) throw error;
}

export function issueLabel(value: string): string {
  return REPORT_ISSUES.find((i) => i.value === value)?.label ?? value;
}
