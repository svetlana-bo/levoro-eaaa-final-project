import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await adminClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify caller is admin
    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { targetUserId, mode } = await req.json();

    if (!targetUserId || !mode || !["soft", "hard"].includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid request. Provide targetUserId and mode (soft|hard)." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Prevent self-deletion
    if (targetUserId === user.id) {
      return new Response(JSON.stringify({ error: "Cannot delete your own account." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (mode === "soft") {
      // Soft delete: ban the user in auth (disables login) but keep all data
      const { error: banError } = await adminClient.auth.admin.updateUserById(targetUserId, {
        ban_duration: "876600h", // ~100 years
      });
      if (banError) throw banError;

      return new Response(JSON.stringify({ success: true, message: "User has been disabled. All data retained." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "hard") {
      // Hard delete: remove all user data then delete auth user
      // Order matters due to foreign keys - delete child records first

      // 1. Delete student notes
      await adminClient.from("student_notes").delete().eq("student_id", targetUserId);

      // 2. Delete lesson progress
      await adminClient.from("lesson_progress").delete().eq("student_id", targetUserId);

      // 3. Delete enrollments
      await adminClient.from("enrollments").delete().eq("student_id", targetUserId);

      // 4. Delete course reviews
      await adminClient.from("course_reviews").delete().eq("student_id", targetUserId);

      // 5. Delete transactions
      await adminClient.from("transactions").delete().eq("user_id", targetUserId);

      // 6. Delete consent log
      await adminClient.from("consent_log").delete().eq("user_id", targetUserId);

      // 7. Delete course instructors (additional instructor assignments)
      await adminClient.from("course_instructors").delete().eq("user_id", targetUserId);

      // 8. Handle courses owned by this user - delete associated data then courses
      const { data: ownedCourses } = await adminClient.from("courses").select("id").eq("instructor_id", targetUserId);
      if (ownedCourses && ownedCourses.length > 0) {
        const courseIds = ownedCourses.map((c) => c.id);
        
        // Delete course sub-resources
        for (const courseId of courseIds) {
          // Delete enrollments for these courses
          await adminClient.from("enrollments").delete().eq("course_id", courseId);
          // Delete course reviews
          await adminClient.from("course_reviews").delete().eq("course_id", courseId);
          // Delete student notes for these courses
          await adminClient.from("student_notes").delete().eq("course_id", courseId);
          // Delete recommended courses entries
          await adminClient.from("recommended_courses").delete().eq("course_id", courseId);
          // Delete course categories
          await adminClient.from("course_categories").delete().eq("course_id", courseId);
          // Delete course subcategories
          await adminClient.from("course_subcategories").delete().eq("course_id", courseId);
          // Delete course instructors
          await adminClient.from("course_instructors").delete().eq("course_id", courseId);
          // Delete lessons (and their files, progress)
          const { data: lessons } = await adminClient.from("lessons").select("id").eq("course_id", courseId);
          if (lessons && lessons.length > 0) {
            const lessonIds = lessons.map((l) => l.id);
            for (const lessonId of lessonIds) {
              await adminClient.from("lesson_files").delete().eq("lesson_id", lessonId);
              await adminClient.from("lesson_progress").delete().eq("lesson_id", lessonId);
            }
            await adminClient.from("lessons").delete().eq("course_id", courseId);
          }
          // Delete modules
          await adminClient.from("modules").delete().eq("course_id", courseId);
          // Delete transactions for this course
          await adminClient.from("transactions").delete().eq("course_id", courseId);
        }
        // Delete the courses themselves
        await adminClient.from("courses").delete().eq("instructor_id", targetUserId);
      }

      // 9. Delete user roles
      await adminClient.from("user_roles").delete().eq("user_id", targetUserId);

      // 10. Delete profile
      await adminClient.from("profiles").delete().eq("id", targetUserId);

      // 11. Delete SQL database files from storage
      const { data: sqlFiles } = await adminClient.storage.from("sql-databases").list(targetUserId);
      if (sqlFiles && sqlFiles.length > 0) {
        await adminClient.storage.from("sql-databases").remove(sqlFiles.map((f) => `${targetUserId}/${f.name}`));
      }

      // 12. Finally delete the auth user
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId);
      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true, message: "User and all associated data permanently deleted." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("delete-user error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
