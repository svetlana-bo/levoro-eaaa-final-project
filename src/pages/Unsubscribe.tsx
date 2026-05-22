import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const email = (params.get("email") || "").trim();
  const token = params.get("token") || "";
  const source = params.get("source") || "";

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<"unsubscribed" | "resubscribed" | null>(null);

  // Auto-confirm if ?auto=1 (legacy one-click)
  useEffect(() => {
    if (params.get("auto") === "1" && email) handleUnsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const callAction = async (action: "unsubscribe" | "resubscribe") => {
    setSubmitting(true);
    try {
      const url = `${SUPABASE_URL}/functions/v1/handle-unsubscribe?confirm=1&action=${action}&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&source=${encodeURIComponent(source)}`;
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) throw new Error("Request failed");
      setDone(action === "unsubscribe" ? "unsubscribed" : "resubscribed");
    } catch (e) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnsubscribe = () => callAction("unsubscribe");
  const handleResubscribe = () => callAction("resubscribe");

  if (!email) {
    return (
      <PageLayout>
        <SEOHead title="Manage email preferences" description="Manage your Levoro Academy email subscription." />
        <div className="container max-w-2xl py-20">
          <Card>
            <CardContent className="p-10 text-center">
              <h1 className="text-2xl font-semibold mb-3">Invalid link</h1>
              <p className="text-muted-foreground">This unsubscribe link is missing required information.</p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <SEOHead title="Manage email preferences" description="Manage your Levoro Academy email subscription." />
      <div className="container max-w-2xl py-20">
        <Card>
          <CardContent className="p-10">
            {done === "unsubscribed" ? (
              <div className="text-center space-y-4">
                <CheckCircle className="h-12 w-12 mx-auto text-slate-blue" />
                <h1 className="text-2xl font-semibold">You've been unsubscribed</h1>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">{email}</span> will no longer receive marketing emails from Levoro Academy.
                </p>
                <p className="text-sm text-muted-foreground pt-2">Changed your mind?</p>
                <Button variant="outline" onClick={handleResubscribe} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Resubscribe
                </Button>
              </div>
            ) : done === "resubscribed" ? (
              <div className="text-center space-y-4">
                <CheckCircle className="h-12 w-12 mx-auto text-slate-blue" />
                <h1 className="text-2xl font-semibold">Welcome back!</h1>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">{email}</span> is now subscribed to Levoro Academy emails again.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <Mail className="h-12 w-12 mx-auto text-primary" />
                  <h1 className="text-2xl font-semibold">Manage email preferences</h1>
                  <p className="text-muted-foreground">
                    You're managing preferences for <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <div>
                    <h2 className="font-semibold mb-1">Marketing emails</h2>
                    <p className="text-sm text-muted-foreground">
                      Product updates, new courses, tips, and special offers from Levoro Academy.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleUnsubscribe} disabled={submitting} className="flex-1">
                      {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Unsubscribe from all marketing emails
                    </Button>
                    <Button variant="outline" onClick={() => (window.location.href = "/")} className="flex-1">
                      Stay subscribed
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground pt-2">
                    Note: You'll still receive essential account emails (password resets, receipts, etc.).
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Unsubscribe;
