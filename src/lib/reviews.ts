import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const reviewSchema = z.object({
  activity_id: z.string().min(1),
  activity_title: z.string().nullable().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1, "Bitte schreibe einen Kommentar").max(2000, "Höchstens 2000 Zeichen"),
  display_name: z
    .string()
    .trim()
    .max(80, "Höchstens 80 Zeichen")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .nullable(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export interface ActivityReview {
  id: string;
  activity_id: string;
  rating: number;
  comment: string;
  display_name: string | null;
  created_at: string;
}

// Normalize occurrence ids (id__suffix) to the base activity id
function baseId(activityId: string): string {
  const idx = activityId.indexOf("__");
  return idx === -1 ? activityId : activityId.slice(0, idx);
}

export async function submitActivityReview(input: ReviewInput) {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) throw new Error("Nicht angemeldet");

  const payload = {
    activity_id: baseId(input.activity_id),
    activity_title: input.activity_title ?? null,
    rating: input.rating,
    comment: input.comment,
    display_name: input.display_name ?? null,
    user_id: user.id,
  };

  const { error } = await (supabase.from("activity_reviews" as any) as any).insert(payload);
  if (error) throw error;
}

export async function fetchActivityReviews(activityId: string): Promise<ActivityReview[]> {
  const { data, error } = await (supabase.from("activity_reviews" as any) as any)
    .select("id, activity_id, rating, comment, display_name, created_at")
    .eq("activity_id", baseId(activityId))
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ActivityReview[];
}
