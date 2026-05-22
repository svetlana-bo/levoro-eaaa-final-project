import SEOHead from "@/components/SEOHead";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { AdminEditableImage } from "@/components/AdminEditableImage";

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 mesh-gradient">
      <SEOHead title="Forgot Password" description="Reset your Levoro Academy password." canonicalPath="/forgot-password" noIndex />
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
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>
            {sent
              ? "Check your email for a password reset link"
              : "Enter your email and we'll send you a reset link"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                If an account exists for <strong>{email}</strong>, you'll receive a password reset email shortly.
              </p>
              <Link to="/login" className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                <ArrowLeft className="h-4 w-4" /> Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary font-medium hover:underline">Back to login</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
