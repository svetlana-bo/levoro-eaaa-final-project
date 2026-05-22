import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  source_page: z.enum(["teach", "business", "general"]),
  sender_name: z.string().trim().min(1).max(200),
  sender_email: z.string().trim().email().max(255),
  subject: z.string().trim().max(300).optional().default(""),
  message: z.string().trim().min(1).max(5000),
  metadata: z.record(z.any()).optional().default({}),
  category_slug: z.string().trim().max(100).optional().default("general"),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { source_page, sender_name, sender_email, subject, message, metadata, category_slug } = parsed.data;

    // Resolve category by slug (default 'general'). Fallback to first category if not found.
    const { data: cat } = await admin
      .from("contact_categories")
      .select("id")
      .eq("slug", category_slug)
      .maybeSingle();

    let categoryId = cat?.id || null;
    if (!categoryId) {
      const { data: anyCat } = await admin.from("contact_categories").select("id").limit(1).maybeSingle();
      categoryId = anyCat?.id || null;
    }

    const finalSubject = subject || `New ${source_page} inquiry from ${sender_name}`;
    const now = new Date().toISOString();

    const { data: thread, error: threadErr } = await admin
      .from("contact_threads")
      .insert({
        category_id: categoryId,
        source_page,
        sender_name,
        sender_email,
        subject: finalSubject,
        metadata,
        is_read: false,
        is_archived: false,
        last_message_at: now,
      })
      .select("id")
      .single();

    if (threadErr || !thread) {
      return new Response(JSON.stringify({ error: threadErr?.message || "Failed to create thread" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: msgErr } = await admin.from("contact_messages").insert({
      thread_id: thread.id,
      direction: "inbound",
      body: message,
      sender_email,
      sender_name,
    });

    if (msgErr) {
      return new Response(JSON.stringify({ error: msgErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, thread_id: thread.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Unexpected error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
