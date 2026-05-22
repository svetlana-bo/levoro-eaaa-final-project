import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require shared cron secret to prevent unauthenticated cleanup triggering.
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== cronSecret) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else {
    console.warn("CRON_SECRET not configured — endpoint is currently unauthenticated");
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find enrollments completed more than 30 days ago
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: completedEnrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select("student_id, course_id")
      .lt("completed_at", thirtyDaysAgo)
      .not("completed_at", "is", null);

    if (enrollError) throw enrollError;

    if (!completedEnrollments || completedEnrollments.length === 0) {
      return new Response(
        JSON.stringify({ message: "No databases to clean up", deleted: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get unique student IDs
    const studentIds = [...new Set(completedEnrollments.map((e) => e.student_id))];
    let totalDeleted = 0;

    for (const studentId of studentIds) {
      // List files in the student's folder
      const { data: files } = await supabase.storage
        .from("sql-databases")
        .list(studentId);

      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${studentId}/${f.name}`);
        const { error: deleteError } = await supabase.storage
          .from("sql-databases")
          .remove(filePaths);

        if (!deleteError) {
          totalDeleted += filePaths.length;
        }
      }
    }

    return new Response(
      JSON.stringify({ message: "Cleanup complete", deleted: totalDeleted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
