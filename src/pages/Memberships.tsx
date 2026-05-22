import SEOHead from "@/components/SEOHead";
import { safeHtml } from "@/lib/sanitize";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle, Globe, BarChart3, Layers, Star, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useMembershipPlans, getBillingLabel, getSaveLabel, getTotalPrice } from "@/hooks/useMembershipPlans";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { AdminEditableImage } from "@/components/AdminEditableImage";
import PricingCards from "@/components/PricingCards";


const steps = [
  { num: 1, title: "Join", desc: "Get instant access to the full platform." },
  { num: 2, title: "Learn in short sessions", desc: "Lessons designed to fit into real life." },
  { num: 3, title: "Apply immediately", desc: "Use tools, frameworks, and reflection exercises." },
  { num: 4, title: "Keep growing", desc: "New courses are added regularly." },
];

const learningPillars = [
  "Microlearning structure",
  "Reflection-based learning",
  "Expert-led courses",
];

const audienceItems = [
  "Professionals developing real-world skills",
  "Leaders and team managers",
  "Career changers and lifelong learners",
  "Anyone who wants structured growth without overwhelm",
];

const testimonials = [
  {
    name: "Martin", role: "Financial Analyst",
    text: `"Though I've only just started my first course on Levoro, I can already say the overall <strong>experience has been excellent.</strong> The course material is <strong>very well-built, easy to follow,</strong> and looks incredibly professional. I was drawn to Levoro early on because of the company's strong social media presence and its unique, effective approach to promoting learning, which I can confirm is <strong>more engaging than older methods</strong> I've used."`,
  },
  {
    name: "Maria", role: "Senior Product Specialist",
    text: `"Levoro has been such <strong>an incredible find</strong> for me: I've taken lots of courses over the years, and while I've completed quite a lot, I've also had to abandon a few. <strong>Levoro really bridges that gap for me</strong> and allows for a really nice balance for taking courses between my work and personal life. <strong>I also love the selection of courses</strong> they have on the website already."`,
  },
  {
    name: "Alar", role: "Senior Specialist",
    text: `"Learning on the Levoro platform has been genuinely positive and highly accessible. <strong>The format's exceptional clarity</strong> and <strong>flexibility</strong> allowed me to easily integrate the learning into my life <strong>without feeling overwhelmed</strong> by a fixed schedule. <strong>I wholeheartedly recommend Levoro</strong> to anyone seeking an engaging, effective, and user-friendly way to learn new skills."`,
  },
];

const Memberships = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: plans = [] } = useMembershipPlans();
  const { formatPrice, getPrice } = useCurrency();
  const monthlyPlan = plans.find(p => p.id === "monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Show success toast when returning from Stripe Checkout
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Your subscription is now active! Welcome to Levoro.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: faqItems = [] } = useQuery({
    queryKey: ["faq-items-memberships"],
    queryFn: async () => {
      const { data, error } = await supabase.from("faq_items").select("*").eq("is_active", true).order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const half = Math.ceil(faqItems.length / 2);

  const handleSubscribe = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const plan = plans.find(p => p.id === planId);
      const body = JSON.stringify({ planId, trialDays: plan?.trial_days || 0 });
      if (user) {
        const { data, error } = await supabase.functions.invoke("create-checkout", { body: { planId, trialDays: plan?.trial_days || 0 } });
        if (error) throw error;
        if (data?.url) { window.location.href = data.url; } else { throw new Error("No checkout URL returned"); }
      } else {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Checkout failed");
        if (data?.url) { window.location.href = data.url; } else { throw new Error("No checkout URL returned"); }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally { setLoadingPlan(null); }
  };

  return (
    <PageLayout>
      <SEOHead title="Memberships & Pricing" description="Unlock unlimited access to all Levoro Academy courses with flexible membership plans. Start learning with expert-led micro-courses today." canonicalPath="/memberships" pageId="memberships" />
      {/* Hero */}
      <section className="mesh-gradient py-24 md:py-32">
        <div className="max-w-[900px] mx-auto px-5 opacity-0 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-6 font-sans">
            Unlimited Growth. One Membership.
          </h1>
          <p className="text-foreground/70 text-lg mb-2">Short, expert-led lessons designed for real-world skill growth.</p>
          <p className="text-foreground/70 text-lg mb-8">Learn at your own pace. Apply what you learn.</p>
          <Button variant="hero" size="lg" className="uppercase tracking-widest font-bold" asChild>
            <a href="#pricing">Scroll to Pricing ⊕</a>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">Cancel anytime. Full access immediately.</p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-border/50 bg-card">
        <div className="max-w-[1200px] mx-auto px-5 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: <Globe className="h-6 w-6 text-primary/60" />, text: <>Learners from <strong>15+</strong> countries</> },
              { icon: <BarChart3 className="h-6 w-6 text-primary/60" />, text: <><strong>30+</strong> expert instructors</> },
              { icon: <Layers className="h-6 w-6 text-primary/60" />, text: <>Built on <strong>adult learning science</strong></> },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-4 bg-muted/30 rounded-xl px-6 py-5">
                {s.icon}
                <span className="text-base text-foreground/80">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Everything you need */}
      <section className="py-20">
        <div className="max-w-[800px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-4">
            Everything you need to <span className="text-highlight">keep growing.</span>
          </h2>
          <p className="text-foreground/70 mb-2">One membership gives you full access to the Levoro learning ecosystem.</p>
          <p className="text-foreground/70">Risk free subscription, <strong>cancel anytime.</strong></p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-muted/20">
        <div className="max-w-[1200px] mx-auto px-5">
          <PricingCards
            plans={plans}
            monthlyPlan={monthlyPlan}
            loadingPlan={loadingPlan}
            onSubscribe={handleSubscribe}
            formatPrice={formatPrice}
            getPrice={getPrice}
          />
        </div>
      </section>

      {/* Growth shouldn't be event-based */}
      <section className="py-20">
        <div className="max-w-[900px] mx-auto px-5">
          <div className="mesh-gradient rounded-2xl p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-6">Growth <span className="text-highlight">shouldn't</span> be event-based</h2>
            <p className="text-foreground/70 mb-2">Workshops end.</p>
            <p className="text-foreground/70 mb-2">Conferences last a day.</p>
            <p className="text-foreground/70 mb-6">Learning shouldn't.</p>
            <p className="text-foreground font-bold mb-2 text-lg">Levoro gives you continuous access to expert-led courses designed for real-world application.</p>
            <p className="text-foreground/70 mb-8">One membership. Continuous growth.</p>
            <Button variant="hero" size="lg" className="uppercase tracking-widest font-bold" asChild>
              <Link to="/signup">Start Learning Today</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How Levoro works */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-[1200px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-4">How Levoro works.</h2>
          <p className="text-foreground/70 max-w-2xl mx-auto mb-12">Most platforms are built for an "average learner" who doesn't exist.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {steps.map((s) => (
              <div
                key={s.num}
                className="bg-card rounded-2xl border border-border/60 p-8 text-center flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-bold mb-5">
                  {s.num}
                </div>
                <h4 className="font-bold text-foreground mb-2 text-lg">{s.title}</h4>
                <p className="text-muted-foreground text-base">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built on how adults learn */}
      <section className="py-20 mesh-gradient">
        <div className="max-w-[1200px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-4">Built on how adults <span className="text-highlight">actually</span> learn</h2>
          <p className="text-foreground/70 max-w-2xl mx-auto mb-10">Levoro courses are designed using evidence-based adult learning principles.</p>
          <div className="grid md:grid-cols-3 gap-4 max-w-[1000px] mx-auto mb-10">
            {learningPillars.map((p) => (
              <div key={p} className="flex items-center gap-2.5 bg-card rounded-xl border border-border/50 px-5 py-4">
                <CheckCircle className="h-4 w-4 text-slate-blue shrink-0" />
                <span className="text-base font-medium text-foreground">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for adults */}
      <section className="py-20">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AdminEditableImage
              imageKey="memberships-audience-image"
              alt="Built for adults who want real growth"
              className="w-full h-full object-cover rounded-2xl"
              containerClassName="h-80 rounded-2xl overflow-hidden"
              fallback={
                <div className="bg-muted/50 rounded-2xl h-80 flex items-center justify-center text-muted-foreground w-full">
                  <span className="text-sm">Image placeholder</span>
                </div>
              }
            />
            <div>
              <h2 className="text-3xl font-extrabold text-primary mb-4">Built for adults who want real growth</h2>
              <p className="text-foreground/70 mb-6">Levoro is designed for people who want to keep <strong>learning without putting life on pause.</strong></p>
              <div className="space-y-3">
                {audienceItems.map((item) => (
                  <div key={item} className="flex items-center gap-3 bg-card rounded-xl border border-border/50 px-5 py-4">
                    <CheckCircle className="h-4 w-4 text-slate-blue shrink-0" />
                    <span className="text-foreground text-base">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-4">Trusted by <span className="text-highlight">professionals</span></h2>
          <p className="text-foreground/70 max-w-2xl mx-auto mb-12">Real feedback from real learners.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={t.name} className={`bg-card rounded-2xl border border-border/50 border-t-4 ${['border-t-secondary','border-t-apricot','border-t-primary'][i % 3]} p-6 text-left`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}</div>
                  <div><p className="font-bold text-foreground text-base">{t.name}</p><p className="text-xs text-muted-foreground">{t.role}</p></div>
                </div>
                <p className="text-foreground/80 text-base leading-relaxed italic" dangerouslySetInnerHTML={safeHtml(t.text)} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 mesh-gradient">
        <div className="max-w-[1100px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-12">FAQ</h2>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            {[faqItems.slice(0, half), faqItems.slice(half)].map((col, ci) => (
              <div key={ci} className="space-y-4">
                {col.map((item: any) => (
                  <div key={item.id} className="bg-card rounded-xl border border-border/50 overflow-hidden">
                    <button onClick={() => setOpenFaqId(openFaqId === item.id ? null : item.id)} className="w-full flex items-center gap-3 px-5 py-4 text-left">
                      <ChevronDown className={`h-4 w-4 text-primary shrink-0 transition-transform duration-200 ${openFaqId === item.id ? "rotate-180" : ""}`} />
                      <span className="text-base font-medium text-foreground">{item.question}</span>
                    </button>
                    {openFaqId === item.id && (
                      <div className="px-5 pb-5 pt-0 pl-12"><p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p></div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-[800px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary italic mb-4">Start learning today</h2>
          <p className="text-foreground/70 mb-8">Join Levoro and get full access to every course, tool, and resource.</p>
          <Button variant="hero" size="lg" className="uppercase tracking-widest font-bold" asChild>
            <Link to="/signup">Get Full Access</Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
};

export default Memberships;
