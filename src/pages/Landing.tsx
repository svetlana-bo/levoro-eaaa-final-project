import SEOHead from "@/components/SEOHead";
import { safeHtml } from "@/lib/sanitize";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, XCircle, Star, ChevronRight, BookOpen, Globe, FlaskConical, Users, MessageCircle } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMembershipPlans, getBillingLabel, getSaveLabel } from "@/hooks/useMembershipPlans";
import { useCurrency } from "@/hooks/useCurrency";
import { useState } from "react";
import { toast } from "sonner";
import estoniaGlobe from "@/assets/estonia-globe.webp";
import PricingCards from "@/components/PricingCards";

const highlights = [
  "~5-minute lessons grounded in learning science",
  "Expert-led, curated courses",
  "No exams. No pressure.",
  "Built for real skill adoption",
];

const trustBadges = [
  { Icon: BookOpen, text: "Built on adult learning science" },
  { Icon: Globe, text: "Global learners" },
  { Icon: FlaskConical, text: "Research-informed design" },
  { Icon: Users, text: "Expert instructors" },
  { Icon: MessageCircle, text: "Used by professionals worldwide" },
];

const problemCards = [
  { title: "Too long", desc: "Long videos and dense content overwhelm busy adults and rarely translate into action." },
  { title: "No reflection", desc: "Without time to process and apply, learning doesn't stick." },
  { title: "No application", desc: "Theory-heavy courses that don't connect to real work or life." },
  { title: "Trust gap", desc: "Open marketplaces create content overload with inconsistent quality." },
  { title: "One-size-fits-all", desc: "Most platforms ignore how differently adults learn, focus, and retain." },
];

const differentiators = [
  { title: "Microlearning", desc: "Short lessons engineered for retention and real-world use." },
  { title: "Expert-led & curated", desc: "No open marketplace. Every course is vetted." },
  { title: "Real-world tools", desc: "Templates, prompts, and frameworks you can use immediately." },
  { title: "Built for different ways of learning", desc: "Flexible formats, pacing, and tools suitable for diverse and neurodiverse adults." },
  { title: "Reflection-based learning", desc: "Built for skill adoption, not passive consumption." },
];

const membershipFeatures = [
  "Unlimited Access",
  "Interactive exercises and reflection tools",
  "Certificates that reflect real skills",
  "New courses added regularly",
  "Self-paced, no deadlines",
];

const testimonials = [
  {
    name: "Daniel", role: "Key Account Manager",
    text: `"<em>My experience</em> learning on the Levoro platform <strong>was superb</strong>. The first thing I noticed was how easy it is to navigate. <em>Everything is laid out very clearly</em>, so finding what you need is simple, unlike on some major competitor platforms, where it's easy to get lost. I also think the color palette works really well; it creates a relaxed and calming atmosphere. In my opinion, <strong>everyone should give Levoro Academy a try</strong> because <em>it feels fresh, modern,</em> and different from other options out there."`,
  },
  {
    name: "Karmen", role: "Marketing Specialist",
    text: `"My learning experience with Levoro has been <strong>very positive</strong> so far, as <strong>it felt really intuitive and engaging.</strong> Clear structure made it applicable to my life situations, both in my career growth and personal development. Flexible format also suited me well, <em>allowing me to learn at my own pace</em> while still <strong>feeling guided and motivated.</strong> Would definitely recommend Levoro for self-development and learning!"`,
  },
  {
    name: "Alar", role: "Senior Specialist",
    text: `"Learning on the Levoro platform has been genuinely positive and highly accessible. <strong>The format's exceptional clarity</strong> and <strong>flexibility</strong> allowed me to easily integrate the learning into my life <strong>without feeling overwhelmed</strong> by a fixed schedule. This made the experience uniquely valuable, providing me with practical knowledge that I believe will definitely help me in my future career pursuits. <strong>I wholeheartedly recommend Levoro</strong> to anyone seeking an engaging, effective, and user-friendly way to learn new skills."`,
  },
];

const scienceCards = [
  { title: "Expert Instructors", desc: "We work with vetted practitioners, educators, and specialists. Every course is selected for real-world relevance, not marketplace volume." },
  { title: "Science-Backed Design", desc: "Microlearning, spaced repetition, and reflection tools help you remember and apply what you learn, not just finish a course." },
  { title: "Built for Retention", desc: "Short lessons, practical tools, and structured pathways make it easier to stay consistent and finish what you start." },
];

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: plans = [] } = useMembershipPlans();
  const { formatPrice, getPrice } = useCurrency();
  const monthlyPlan = plans.find(p => p.id === "monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

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

  // Recently added courses (newest first)
  const { data: recentCourses = [] } = useQuery({
    queryKey: ["landing-recent-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, thumbnail_url, is_free, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  // Recommended courses (admin-curated)
  const { data: recommendedCourses = [] } = useQuery({
    queryKey: ["landing-recommended-courses"],
    queryFn: async () => {
      const { data: recs, error: recErr } = await supabase
        .from("recommended_courses" as any)
        .select("course_id, sort_order")
        .order("sort_order", { ascending: true });
      if (recErr) throw recErr;
      if (!recs || recs.length === 0) return [];
      const courseIds = (recs as any[]).map((r: any) => r.course_id);
      const { data: courses, error: cErr } = await supabase
        .from("courses")
        .select("id, title, thumbnail_url, is_free")
        .eq("status", "published")
        .in("id", courseIds);
      if (cErr) throw cErr;
      // Sort by recommended order
      return courseIds
        .map((cid: string) => (courses || []).find((c: any) => c.id === cid))
        .filter(Boolean);
    },
  });

  // Free courses (newest first)
  const { data: freeCourses = [] } = useQuery({
    queryKey: ["landing-free-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, thumbnail_url, is_free, created_at")
        .eq("status", "published")
        .eq("is_free", true)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  // Partners
  const { data: partners = [] } = useQuery({
    queryKey: ["landing-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const CourseCard = ({ course }: { course: any }) => (
    <Link
      to={`/courses/${course.id}`}
      className="group relative block rounded-2xl overflow-hidden aspect-[4/3] bg-primary shadow-md hover:shadow-xl transition-shadow"
    >
      {course.thumbnail_url ? (
        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p className="text-primary-foreground font-bold text-sm leading-snug">
          {course.title}
        </p>
      </div>
    </Link>
  );

  return (
    <PageLayout>
      <SEOHead
        title="Expert-Led Micro-Courses for Busy Professionals"
        description="Master new skills in just 5 minutes a day with Levoro Academy's science-based micro-courses. Expert-led, interactive learning designed for professionals."
        canonicalPath="/"
        pageId="home"
      />
      {/* Hero */}
      <section className="mesh-gradient py-24 md:py-36 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="opacity-0 animate-fade-in">
              <h1 className="text-3xl md:text-[2.8rem] font-extrabold tracking-tight leading-tight text-primary mb-6">
                We don't just deliver knowledge. We design real-world change.
              </h1>
              <p className="text-foreground/70 text-base mb-2">
                In just <strong>10 minutes a day</strong>, you'll build real-world skills for career and life through <strong>science-backed microlearning</strong> designed for the modern adult.
              </p>
              <p className="text-foreground/70 text-base mb-8">
                <strong>One membership</strong> gets you full access to entire learning library.
              </p>
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/memberships">Start Learning with Levoro</Link>
                </Button>
                <Button variant="ghost" size="lg" asChild className="gap-1 text-foreground/70 hover:text-foreground">
                  <Link to="/business">For Teams <ChevronRight className="h-4 w-4" /></Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Choose monthly, quarterly, or annual billing</p>
            </div>
            <div className="space-y-3 opacity-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              {highlights.map((h) => (
                <div key={h} className="bg-card/80 rounded-xl border border-border/50 px-5 py-4 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-slate-blue shrink-0" />
                  <span className="text-foreground text-base">{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-10">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {trustBadges.map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-card rounded-2xl shadow-sm px-5 py-4">
                <Icon className="h-6 w-6 text-slate-blue shrink-0" />
                <span className="text-sm md:text-base font-medium text-foreground leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why most learning doesn't lead to real change */}
      <section className="py-20 md:py-28 bg-background">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary">
              Why most online learning doesn't lead to <span className="text-highlight">real change</span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Most platforms are built for an "average learner" who doesn't exist, ignoring real schedules, cognitive load, and how adults actually learn.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {problemCards.map((c) => (
              <div key={c.title} className="bg-muted/50 rounded-xl p-5 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-foreground/70 shrink-0" />
                  <h3 className="font-bold text-foreground text-base">{c.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed text-sm">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Levoro is built differently */}
      <section className="py-20 md:py-28 mesh-gradient">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary">
              Levoro is built <span className="text-highlight">differently</span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Every part of the platform is designed around evidence-based adult learning principles.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {differentiators.map((c) => (
              <div key={c.title} className="bg-card/80 rounded-xl p-5 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-slate-blue shrink-0" />
                  <h3 className="font-bold text-foreground text-base">{c.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed text-sm">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore course library */}
      <section className="py-20 md:py-28 bg-background">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary">
              Explore the Levoro learning library
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Courses designed to support your professional and personal growth — all included in one membership.
            </p>
          </div>

          {/* Recently added */}
          {recentCourses.length > 0 && (
            <div className="mb-14">
              <h3 className="text-xl font-bold text-foreground mb-6">Recently added</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {recentCourses.map((c: any) => <CourseCard key={c.id} course={c} />)}
              </div>
              <Link to="/courses" className="inline-flex items-center gap-1 font-medium text-foreground mt-4 hover:text-primary transition-colors text-base">
                Browse All Courses <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {/* Recommended */}
          {recommendedCourses.length > 0 && (
            <div className="mb-14">
              <h3 className="text-xl font-bold text-foreground mb-6">Recommended for you</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {recommendedCourses.map((c: any) => <CourseCard key={c.id} course={c} />)}
              </div>
            </div>
          )}

          {/* Free */}
          {freeCourses.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-foreground mb-6">Try for free</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {freeCourses.map((c: any) => <CourseCard key={c.id} course={c} />)}
              </div>
              <Link to="/courses" className="inline-flex items-center gap-1 font-medium text-foreground mt-4 hover:text-primary transition-colors text-base">
                Browse All Courses <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* All your learning for less than €1 a day */}
      <section className="py-20 mesh-gradient">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-4">
                All your learning,<br />for less than €1 a day.
              </h2>
              <p className="text-foreground/70 mb-8 text-base">
                Expert-led courses designed for real-world skill adoption — structured, practical, and grounded in learning science.
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border/50 p-8">
              <h3 className="text-xl font-bold text-primary mb-6">Levoro Membership</h3>
              <div className="space-y-4 text-base">
                {membershipFeatures.map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-slate-blue shrink-0" />
                    <span className="font-medium text-foreground text-base">{f}</span>
                  </div>
                ))}
              </div>
              <Button variant="hero" size="lg" className="mt-8" asChild>
                <Link to="/memberships">Join Now!</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      {partners.length > 0 && (
        <section className="py-16 bg-background border-t border-border/30">
          <div className="max-w-[1200px] mx-auto px-5 text-center">
            <p className="font-bold text-foreground text-base mb-8">
              Supported by a growing network of educators, organisations, and partners
            </p>
          </div>
          <div className="w-full overflow-x-auto">
            <div className="flex gap-6 px-5 w-max mx-auto">
              {partners.map((p: any) => (
                <a
                  key={p.id}
                  href={p.website_url || "#"}
                  target={p.website_url ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="bg-card rounded-xl border border-border/50 p-0 flex items-center justify-center h-[100px] w-[100px] shrink-0 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {p.logo_url ? (
                    <img src={p.logo_url} alt={p.name} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">{p.name}</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-20 md:py-28 bg-background">
        <div className="max-w-[1200px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-3">
            Trusted by <span className="font-extrabold">professionals</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
            Most platforms are built for an "average learner" who doesn't exist, ignoring real schedules, cognitive load, and how adults actually learn.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={t.name} className={`bg-card rounded-2xl border border-border/50 border-t-4 ${['border-t-secondary','border-t-apricot','border-t-primary'][i % 3]} p-6 text-left`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-base">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed italic" dangerouslySetInnerHTML={safeHtml(t.text)} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built on learning science */}
      <section className="py-20 mesh-gradient">
        <div className="max-w-[1100px] mx-auto px-5">
          <div className="bg-card rounded-2xl border border-border/50 p-10 md:p-14 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary mb-3">
              Built on <span className="text-highlight">learning science.</span> Led by <span className="text-highlight">real experts.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
              Levoro is designed around how adults actually learn, so you don't just consume content, you apply it.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-10">
              {scienceCards.map((c) => (
                <div key={c.title} className="bg-muted/30 rounded-xl p-5 text-left border border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-slate-blue shrink-0" />
                    <h3 className="font-bold text-foreground text-base">{c.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm">{c.desc}</p>
                </div>
              ))}
            </div>
            <Button variant="hero" size="lg" asChild>
              <Link to="/memberships">Start Learning with Levoro</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing */}
      {plans.length > 0 && (
        <section id="pricing" className="py-20 md:py-28 bg-background">
          <div className="max-w-[1200px] mx-auto px-5 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-3">
              Unlimited Growth. <span className="text-highlight">One Membership.</span>
            </h2>
            <p className="text-foreground/70 mb-2">Choose the plan that fits your pace.</p>
            <p className="text-foreground font-bold mb-14">Cancel anytime. Full access immediately.</p>
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
      )}

      {/* Founded in Estonia */}
      <section className="py-16 bg-background">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="rounded-2xl border border-border/50 p-10 md:p-14 bg-[radial-gradient(ellipse_40%_70%_at_center,#FAEEDA_0%,#FCF6E8_35%,#FFFFFF_70%)]">
            <div className="grid md:grid-cols-[1fr_auto_1fr] gap-8 md:gap-12 items-center">
              <div>
                <h3 className="text-xl font-bold text-primary mb-2">Founded in Estonia</h3>
                <h4 className="text-lg font-bold text-primary mb-4">Designed for learners worldwide</h4>
                <p className="text-foreground/70 mb-3 text-base">
                  Learning shouldn't depend on having more time, more focus, or more energy than real life allows.
                </p>
                <p className="text-foreground/70 text-base">
                  Levoro Academy was created to design learning that actually works for adults, structured, science-based, and built for real-world skill adoption.
                </p>
              </div>
              <div className="flex justify-center order-first md:order-none">
                <img
                  src={estoniaGlobe}
                  alt="Estonia highlighted on a globe of Europe"
                  className="w-48 md:w-56 lg:w-64 h-auto"
                  loading="lazy"
                />
              </div>
              <div>
                <p className="text-foreground font-bold mb-3 text-base">
                  Our courses are designed for different learning styles, paces, and life situations, making meaningful growth accessible to a wide range of learners, including neurodiverse adults.
                </p>
                <p className="text-foreground/70 mb-4 text-base">
                  We believe progress happens in small, consistent moments. And the right learning system can turn those moments into real growth.
                </p>
                <Link to="/teach" className="inline-flex items-center gap-1 font-bold text-foreground hover:text-primary transition-colors text-base">
                  Learn about our story <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Landing;
