import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const EmailPreferences = () => {
  const { user } = useAuth();
  const email = user?.email || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!email) return;
    (async () => {
      const { data } = await supabase
        .from("newsletter_subscribers")
        .select("is_active")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();
      // If no row exists, treat as subscribed (default state for active accounts)
      setIsSubscribed(data ? !!data.is_active : true);
      setLoading(false);
    })();
  }, [email]);

  const callAction = async (action: "unsubscribe" | "resubscribe") => {
    if (!email) return;
    setSubmitting(true);
    try {
      const url = `${SUPABASE_URL}/functions/v1/handle-unsubscribe?confirm=1&action=${action}&email=${encodeURIComponent(email)}&source=dashboard`;
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) throw new Error("Request failed");
      setIsSubscribed(action === "resubscribe");
      toast.success(action === "unsubscribe" ? "You've been unsubscribed" : "Welcome back!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Preferences</h1>
          <p className="text-muted-foreground mt-1">Manage which emails you receive from Levoro Academy.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" /> Marketing emails
            </CardTitle>
            <CardDescription>
              Product updates, new courses, tips, and special offers sent to{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center text-muted-foreground text-base">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading your preferences...
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                  {isSubscribed ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-slate-blue shrink-0" />
                      <div>
                        <p className="font-medium">You're subscribed</p>
                        <p className="text-sm text-muted-foreground">You're currently receiving marketing emails.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium">You're unsubscribed</p>
                        <p className="text-sm text-muted-foreground">You won't receive marketing emails.</p>
                      </div>
                    </>
                  )}
                </div>

                {isSubscribed ? (
                  <Button onClick={() => callAction("unsubscribe")} disabled={submitting} variant="outline">
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Unsubscribe from marketing emails
                  </Button>
                ) : (
                  <Button onClick={() => callAction("resubscribe")} disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Resubscribe
                  </Button>
                )}

                <p className="text-xs text-muted-foreground pt-2">
                  Note: You'll still receive essential account emails (password resets, receipts, course updates).
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EmailPreferences;
