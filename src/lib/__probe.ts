import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function probe() {
  const supabase = await createServerSupabaseClient();
  const a = await supabase.from("profiles").select("onboarding_step").eq("id", "x").maybeSingle();
  if (a.data) { console.log(a.data.onboarding_step); }
  const c = await supabase.from("profiles").select("*").eq("id", "x").maybeSingle();
  if (c.data) { console.log(c.data.email); }
}
