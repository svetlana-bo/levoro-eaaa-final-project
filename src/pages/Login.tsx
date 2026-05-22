import SEOHead from "@/components/SEOHead";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { AdminEditableImage } from "@/components/AdminEditableImage";
import { MailCheck } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const fromCheckout = searchParams.get("from") === "checkout";
  const prefilledEmail = searchParams.get("email") || "";
  const { toast } = useToast();
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const initialPendingEmail = (location.state as { pendingVerificationEmail?: string } | null)?.pendingVerificationEmail || "";
  const [pendingEmail, setPendingEmail] = useState<string>(initialPendingEmail);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleResend = async (targetEmail: string) => {
    if (!targetEmail) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: targetEmail,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    setResending(false);
    if (error) {
      toast({ title: "Couldn't resend email", description: error.message, variant: "destructive" });
      return;
    }
    setPendingEmail(targetEmail);
    setResendCooldown(60);
    toast({ title: "Verification email sent", description: `We sent a new confirmation link to ${targetEmail}.` });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("not confirmed") || msg.includes("email_not_confirmed")) {
        setPendingEmail(email);
      } else {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      }
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ last_login: new Date().toISOString() }).eq("id", user.id);
    }

    navigate("/dashboard");
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 mesh-gradient">
      <SEOHead title="Log In" description="Log in to your Levoro Academy account to continue learning." canonicalPath="/login" noIndex />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-2">
            <AdminEditableImage
              imageKey="navbar-logo"
              alt="Levoro Academy Logo"
              className="h-10 w-auto object-contain"
              fallback={
                <span className="flex items-center gap-2">
                  <span className="text-xl font-extrabold tracking-tight text-primary">
                    Levoro Academy
                  </span>
                  <span className="h-2 w-2 rounded-full bg-secondary" />
                </span>
              }
            />
          </Link>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {fromCheckout && (
            <div className="mb-6 rounded-md border border-primary/30 bg-primary/5 p-4 text-sm">
              <p className="font-semibold text-foreground">Payment successful</p>
              <p className="text-muted-foreground mt-1">
                Log in to access your subscription.
              </p>
            </div>
          )}
          {pendingEmail && (
            <div className="mb-6 rounded-md border-2 border-gold/60 bg-gold/10 p-4">
              <div className="flex items-start gap-3">
                <MailCheck className="h-5 w-5 text-gold mt-0.5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Verify your email</p>
                  <p className="text-xs text-muted-foreground">
                    We sent a confirmation link to <span className="font-medium text-foreground">{pendingEmail}</span>. Click it to activate your account, then log in.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-gold text-secondary-foreground hover:bg-gold/90 border-transparent"
                      disabled={resending || resendCooldown > 0}
                      onClick={() => handleResend(pendingEmail)}
                    >
                      {resending
                        ? "Sending…"
                        : resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : "Resend verification email"}
                    </Button>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                      onClick={() => setPendingEmail("")}
                    >
                      Use a different email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <PasswordInput id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in…" : "Log in"}
            </Button>
          </form>

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground uppercase">
              or continue with
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full" onClick={() => handleOAuth("google")}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleOAuth("apple")}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
