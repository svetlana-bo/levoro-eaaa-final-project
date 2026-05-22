import SEOHead from "@/components/SEOHead";
import { AdminEditableImage } from "@/components/AdminEditableImage";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { COUNTRIES } from "@/lib/countries";

const CHECKBOX_COUNTRIES = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR",
  "HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK",
  "SI","ES","SE","GB","NO","IS","LI","BR","ZA","KR","JP"
]);

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { country: detectedCountry } = useCurrency();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const effectiveCountry = country || detectedCountry;
  const requiresCheckbox = !effectiveCountry || effectiveCountry === "XX" || CHECKBOX_COUNTRIES.has(effectiveCountry);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!country) {
      toast({ title: "Country required", description: "Please select your country.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords are identical.", variant: "destructive" });
      return;
    }
    if (requiresCheckbox && !consentChecked) {
      toast({ title: "Consent required", description: "Please agree to the Terms and Privacy Policy.", variant: "destructive" });
      return;
    }
    setLoading(true);

    const consentMethod = requiresCheckbox ? "checkbox" : "implicit";

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          first_name: firstName,
          last_name: lastName,
          consent_method: consentMethod,
          consent_country: country,
        },
      },
    });

    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Update profile with country after signup
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ country }).eq("id", user.id);
    }

    toast({ title: "Account created!", description: "Check your email to confirm your account, then log in." });
    navigate("/login", { state: { pendingVerificationEmail: email } });
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 mesh-gradient">
      <SEOHead title="Sign Up" description="Create your free Levoro Academy account and start learning with expert-led micro-courses." canonicalPath="/signup" pageId="signup" />
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
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Start your learning journey today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 mb-4">
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

          <div className="relative mb-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground uppercase">
              or sign up with email
            </span>
          </div>

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
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <PasswordInput id="confirmPassword" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
            </div>
            {requiresCheckbox ? (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="consent"
                  checked={consentChecked}
                  onCheckedChange={(checked) => setConsentChecked(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary font-medium hover:underline" target="_blank">Terms & Conditions</Link>
                  {" "}and{" "}
                  <Link to="/privacy" className="text-primary font-medium hover:underline" target="_blank">Privacy Policy</Link>.
                </label>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center">
                By signing up, you agree to our{" "}
                <Link to="/terms" className="text-primary font-medium hover:underline">Terms & Conditions</Link>
                {" "}and{" "}
                <Link to="/privacy" className="text-primary font-medium hover:underline">Privacy Policy</Link>.
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading || !country || (requiresCheckbox && !consentChecked)}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
