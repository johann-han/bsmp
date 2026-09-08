import type { Database } from "./database.types";
import { supabase } from "./supabase";

export type TeachingPlan = Database["public"]["Tables"]["teaching_plans"]["Row"];
export type TeachingPlanInput = Omit<TeachingPlan, "created_at" | "updated_at" | "user_id"> & { user_id?: string };

export async function findTeachingPlans(studyId: string): Promise<readonly TeachingPlan[]> {
    const { data, error } = await supabase
        .from("teaching_plans")
        .select("*")
        .eq("study_id", studyId)
        .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as TeachingPlan[];
}

export async function saveTeachingPlan(input: TeachingPlanInput): Promise<TeachingPlan> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error("A signed-in Supabase user is required for teaching-plan persistence.");

    const row = {
        ...input,
        user_id: userData.user.id,
        updated_at: new Date().toISOString(),
    } satisfies Database["public"]["Tables"]["teaching_plans"]["Insert"];

    const { data, error } = await supabase
        .from("teaching_plans")
        .upsert(row)
        .select("*")
        .single();
    if (error) throw error;
    return data as TeachingPlan;
}
