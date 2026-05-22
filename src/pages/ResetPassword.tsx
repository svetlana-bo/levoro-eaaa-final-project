import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/PasswordInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { AdminEditableImage } from "@/components/AdminEditableImage";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInvite, setIsInvite] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=invite') || hash.includes('type=magiclink')) {
      setIsInvite(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        if (session) {
          setSessionReady(true);
          setCheckingSession(false);
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
      setCheckingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords are identical.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ newPassword: password }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      toast({ title: "Password updated!", description: isInvite ? "Your account is ready. Welcome!" : "You can now log in with your new password." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 mesh-gradient">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-2">
            <AdminEditableImage
              imageKey="navbar-logo"
              alt="Levoro Academy Logo"
              className="h-10 w-auto object-contain"
              fallback={
                <span className="flex items-center gap-2">
                  <span className="text-xl font-extrabold tracking-tight text-primary">Levoro Academy</span>
                  <span className="h-2 w-2 rounded-full bg-secondary" />
                </span>
              }
            />
          </Link>
          {sessionReady ? (
            <>
              <CardTitle className="text-2xl">{isInvite ? "Welcome! Set your password" : "Set new password"}</CardTitle>
              <CardDescription>{isInvite ? "Create a password to get started with your account" : "Enter your new password below"}</CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl">Link expired</CardTitle>
              <CardDescription>This link has already been used or has expired. Please request a new one.</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {sessionReady ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating…" : "Update password"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Button asChild className="w-full">
                <Link to="/forgot-password">Request new reset link</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Back to login</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
