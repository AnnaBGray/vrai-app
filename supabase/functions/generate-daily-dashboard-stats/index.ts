import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date();
  const startOfToday = new Date(today.toDateString());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const endOfYesterday = new Date(startOfToday);

  const { count: totalToday } = await supabase
    .from("authentication_requests")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfToday.toISOString())
    .lt("created_at", endOfToday.toISOString());

  const { count: processedToday } = await supabase
    .from("authentication_requests")
    .select("*", { count: "exact", head: true })
    .in("status", ["Authenticated", "Rejected"])
    .gte("created_at", startOfToday.toISOString())
    .lt("created_at", endOfToday.toISOString());

  const { count: pendingReviewToday } = await supabase
    .from("authentication_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "Pending Review");

  const { data: activeUserRows } = await supabase
    .from("authentication_requests")
    .select("user_id")
    .gte("created_at", startOfToday.toISOString())
    .lt("created_at", endOfToday.toISOString());

  const uniqueUsers = new Set(activeUserRows?.map((row) => row.user_id));
  const activeUsersToday = uniqueUsers.size;

  const { error } = await supabase.from("daily_dashboard_stats").upsert({
    date: startOfToday.toISOString().split("T")[0],
    total_submissions: totalToday || 0,
    pending_review: pendingReviewToday || 0,
    processed_today: processedToday || 0,
    active_users: activeUsersToday || 0,
  });

  if (error) {
    return new Response(`Error inserting stats: ${error.message}`, { status: 500 });
  }

  return new Response("Daily dashboard stats generated successfully", { status: 200 });
});
