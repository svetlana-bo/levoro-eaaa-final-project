import SEOHead from "@/components/SEOHead";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { COUNTRIES } from "@/lib/countries";
import { LogIn, Loader2 } from "lucide-react";

const CompleteAccount = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const [checking, setChecking] = useState(true);
  const [accountExists, setAccountExists] = useState(false);
  const [detectedEmail, setDetectedEmail] = useState<string | null>(null);
  const [existsError, setExistsError] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("check-checkout-account", {
          body: { session_id: sessionId },
        });
        if (cancelled) return;
        if (error) throw error;
        setDetectedEmail(data?.email ?? null);
        setAccountExists(!!data?.account_exists);
      } catch (e) {
        // Fail open — show the form
        console.error("check-checkout-account failed", e);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-muted">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Invalid session. Please try subscribing again from the{" "}
              <a href="/memberships" className="text-primary underline">memberships page</a>.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const goToLogin = () => {
    const params = new URLSearchParams({ from: "checkout" });
    if (detectedEmail) params.set("email", detectedEmail);
    navigate(`/login?${params.toString()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!country) {
      toast({ title: "Country required", description: "Please select your country.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setExistsError(false);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/complete-registration`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ session_id: sessionId, first_name: firstName, last_name: lastName, country, password, marketing_opt_in: marketingOptIn }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        if (/already exists/i.test(data.error || "")) {
          setExistsError(true);
          setDetectedEmail((prev) => prev || null);
          return;
        }
        throw new Error(data.error || "Registration failed");
      }

      // Auto sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: data.email, password });
      if (signInError) {
        toast({ title: "Account created!", description: "Please log in with your email and password." });
        navigate("/login");
        return;
      }

      toast({ title: "Welcome to Levoro Academy!", description: "Your account is ready and your subscription is active." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted">
      <SEOHead title="Complete Your Account" description="Set up your Levoro Academy account after subscribing." canonicalPath="/complete-account" pageId="complete-account" />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <span className="text-xl font-extrabold text-primary">Levoro Academy</span>
          <CardTitle className="text-2xl">
            {accountExists ? "You already have an account" : "Complete your account"}
          </CardTitle>
          <CardDescription>
            {accountExists
              ? "Your payment was successful. Log in to access your subscription."
              : "Your payment was successful! Set up your account details below."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checking ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Verifying payment…
            </div>
          ) : accountExists ? (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/40 p-4 text-sm">
                <p className="text-muted-foreground">Your subscription is linked to</p>
                <p className="font-medium text-foreground break-all">{detectedEmail}</p>
              </div>
              <Button type="button" className="w-full" onClick={goToLogin}>
                <LogIn className="h-4 w-4 mr-2" />
                Log in to your account
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Not you?{" "}
                <Link to="/contact-support" className="text-primary hover:underline">Contact support</Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
                <Select value={country} onValueChange={setCountry} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <div className="flex items-start gap-2 pt-1">
                <Checkbox
                  id="marketing-opt-in"
                  checked={marketingOptIn}
                  onCheckedChange={(v) => setMarketingOptIn(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="marketing-opt-in" className="text-sm font-normal leading-snug cursor-pointer">
                  Email me product updates, learning tips, and occasional offers from Levoro Academy. You can unsubscribe at any time.
                </Label>
              </div>

              {existsError && (
                <Alert>
                  <AlertDescription className="space-y-3">
                    <p>An account with this email already exists. Log in to access your subscription.</p>
                    <Button type="button" size="sm" onClick={goToLogin} className="w-full">
                      <LogIn className="h-4 w-4 mr-2" />
                      Log in instead
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading || !country}>
                {loading ? "Creating account…" : "Complete setup"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteAccount;
