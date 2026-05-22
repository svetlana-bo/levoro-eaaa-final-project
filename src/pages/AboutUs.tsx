import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Monitor, Globe, Heart, BarChart3, Clock } from "lucide-react";
import founderImg from "@/assets/founder-portrait.jpg";
import learner1Img from "@/assets/about-learner-1.jpg";
import learner2Img from "@/assets/about-learner-2.jpg";
import { AdminEditableImage } from "@/components/AdminEditableImage";

const tabs = ["Our Promise", "Our Mission", "Why Us?", "Our Story", "Our Team"];

const AboutUs = () => {
  const location = useLocation();
  const sustainabilityRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("Our Promise");

  useEffect(() => {
    if (location.hash === "#sustainability" && sustainabilityRef.current) {
      setTimeout(() => {
        sustainabilityRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, [location.hash]);

  return (
    <PageLayout>
      <SEOHead title="About Us" description="Learn about Levoro Academy's mission to make professional education accessible, science-based, and effective for busy professionals worldwide." canonicalPath="/about" pageId="about" />
      {/* Hero Section */}
      <section className="mesh-gradient relative py-24 md:py-32 overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="opacity-0 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-6">
                Levoro Academy is not just a learning platform, it's a growth space.
              </h1>
              <p className="text-muted-foreground text-lg mb-4">
                We help conscious adults grow personally and professionally, in their careers, business, and life.
              </p>
              <p className="text-muted-foreground text-lg mb-8">
                We believe that <strong className="text-foreground">everyone has the potential</strong> and when learning is practical, flexible, and empowering, it becomes a real tool for <strong className="text-foreground">transformation</strong>.
              </p>
              <Button asChild className="uppercase tracking-widest font-bold">
                <Link to="/memberships">Start Your Journey</Link>
              </Button>
            </div>
            <div className="space-y-4 opacity-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              {["Learn at your own pace", "Apply skills immediately", "Experience progress that feels achievable"].map((item) => (
                <div key={item} className="flex items-center gap-3 bg-card rounded-xl px-6 py-4 shadow-sm border border-border">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-foreground font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="py-10 border-b border-border">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex flex-wrap justify-center gap-3">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  const el = document.getElementById(tab.toLowerCase().replace(/[^a-z]/g, "-"));
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`px-6 py-3 rounded-full border text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Our Promise - Vision & Mission Cards */}
      <section id="our-promise" className="py-20">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 gap-8">
            <div className="bg-card rounded-2xl border border-border overflow-hidden grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  We envision a world where personal and professional growth is accessible to everyone.
                </h2>
                <p className="text-muted-foreground mb-4">
                  Regardless of their location, background or schedule. At Levoro, we believe every adult has the potential to grow with confidence and clarity, if given access to high-quality, practical, and flexible learning.
                </p>
                <p className="text-muted-foreground">
                  Our goal is to make learning a smooth, empowering journey – one that opens new doors, builds self-trust, and helps individuals and teams reach their next level.
                </p>
              </div>
              <AdminEditableImage imageKey="about-learner-1" defaultSrc={learner1Img} alt="Learner working outdoors" containerClassName="!block w-full h-full min-h-[280px]" className="w-full h-full min-h-[280px] object-cover" />

            </div>
            <div className="bg-card rounded-2xl border border-border overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_1.1fr]">
              <AdminEditableImage imageKey="about-learner-2" defaultSrc={learner2Img} alt="Team collaboration" containerClassName="!block w-full h-full min-h-[280px]" className="w-full h-full min-h-[280px] object-cover" />

              <div className="p-8 md:p-10 flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Levoro supports progress that feels doable, not overwhelming.
                </h2>
                <p className="text-muted-foreground mb-4">
                  Levoro offers practical, real-life learning designed for conscious adults. Our self-paced micro-courses are grounded in adult learning principles – bite-sized, flexible, and packed with clarity.
                </p>
                <p className="text-muted-foreground">
                  Through relatable examples, actionable tasks, and thoughtful structure, we help learners build skills they can apply immediately – in their work, business, and everyday growth journey.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section id="why-us-" className="py-20 bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12">Why choose Levoro?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            {[
              { icon: BarChart3, title: "Practical & effective learning", desc: "Not just theory – but real skills you can use right away.", color: "text-slate-blue" },
              { icon: Monitor, title: "Modern & flexible approach", desc: "Engaging tasks and a clear path that supports your progress.", color: "text-slate-blue" },
              { icon: Clock, title: "Learn on your own terms", desc: "Anytime. Anywhere. Your pace, your rules.", color: "text-slate-blue" },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-card rounded-2xl p-8 border border-border text-center">
                <Icon className={`h-10 w-10 mx-auto mb-4 ${color}`} />
                <h3 className="font-bold text-foreground text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-base text-left">{desc}</p>
              </div>
            ))}
          </div>
          <Button asChild className="uppercase tracking-widest font-bold">
            <Link to="/memberships">Pick Your Plan and Start Learning</Link>
          </Button>
        </div>
      </section>

      {/* Our Story */}
      <section id="our-story" className="py-20">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden max-w-md mx-auto md:mx-0">
              <AdminEditableImage imageKey="about-founder" defaultSrc={founderImg} alt="Levoro founder" className="w-full h-auto" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">How Levoro began?</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Levoro was born from a simple but powerful belief: meaningful growth should be accessible, flexible, and empowering – not overwhelming.</p>
                <p>After over a decade working across Europe in learning and development roles – from coaching leaders and designing onboarding programs, to supporting international teams and adult learners – our founder saw the same challenge again and again: busy professionals craving progress, but drowning in overcomplicated content or burned out by hustle culture.</p>
                <p>So, she created Levoro – a calm, focused learning space built for real life. A space where knowledge isn't just consumed, but applied. Where confidence grows gradually. Where adults can learn with clarity and self-trust.</p>
                <p>We combine academic insight, international experience, and coaching methodology to design courses that are not only effective but truly empowering.</p>
                <p>Because when people grow in ways that feel right for them, the results last.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Levoro Name Origin */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Levoro comes from level + oro</h2>
              <p className="text-muted-foreground text-lg">
                Which means "gold" in Latin. It reflects our mission to help people grow steadily and sustainably – not just to reach the top, but to do it with clarity, quality, and purpose. Learning that's truly worth your time – and your gold.
              </p>
            </div>
            <div className="justify-center flex items-start md:justify-center">
              <div className="w-64 h-64 rounded-2xl bg-gradient-to-br from-secondary/30 via-secondary/10 to-primary/5 flex items-center justify-center p-8">
                <AdminEditableImage
                  imageKey="navbar-logo"
                  alt="Levoro Academy Logo"
                  className="max-h-full max-w-full object-contain"
                  fallback={
                    <span className="font-bold text-4xl text-primary italic leading-tight text-center">
                      levoro<br /><span className="text-lg not-italic font-normal tracking-widest">academy</span>
                    </span>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section id="our-team" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-60" />
        <div className="max-w-[1200px] mx-auto px-5 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-6">
                Our team is made up of passionate, purpose-driven educators.
              </h2>
              <p className="text-muted-foreground">
                At Levoro, we are united by a deep commitment to meaningful learning. Our instructors are skilled mentors, practitioners, and experts who:
              </p>
            </div>
            <div className="space-y-4">
              {["Teach from experience, not just from slides", "Support every learner with clarity and compassion", "Create learning environments that feel empowering"].map((item) => (
                <div key={item} className="flex items-center gap-3 bg-card rounded-xl px-6 py-4 shadow-sm border border-border">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-foreground font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Join Our Team CTA */}
      <section className="py-20">
        <div className="max-w-[800px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Join our team!</h2>
          <p className="text-muted-foreground text-lg mb-2">
            Are you an experienced professional who wants to create meaningful impact through teaching?
          </p>
          <p className="text-muted-foreground text-lg mb-8">
            Levoro Academy is looking for inspiring educators who want to help others grow and make real change.
          </p>
          <Button asChild className="uppercase tracking-widest font-bold">
            <Link to="/teach">Explore How You Can Teach With Us</Link>
          </Button>
        </div>
      </section>

      {/* Sustainability Section */}
      <section ref={sustainabilityRef} id="sustainability" className="py-20 bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-sm text-muted-foreground uppercase tracking-widest mb-2">Sustainability & Responsibility Statement</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Levoro's Commitment to Thoughtful Growth</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card rounded-2xl p-8 border border-border text-center">
              <Monitor className="h-10 w-10 mx-auto mb-4 text-slate-blue" />
              <h3 className="font-bold text-foreground text-lg mb-3">Digital-first, low-impact</h3>
              <p className="text-muted-foreground text-base text-left">
                Levoro operates fully online. That means no shipping, no packaging waste, no paper materials.
              </p>
              <p className="text-muted-foreground mt-3 text-base text-left">
                We consciously choose partners and service providers who prioritize energy efficiency, sustainable practices, and lower-emission operations. We don't just build a business, we build it responsibly.
              </p>
            </div>
            <div className="bg-card rounded-2xl p-8 border border-border text-center">
              <Globe className="h-10 w-10 mx-auto mb-4 text-slate-blue" />
              <h3 className="font-bold text-foreground text-lg mb-3">Learning designed for real life</h3>
              <p className="text-muted-foreground text-base text-left">
                Every learner who applies your teaching at work, in life, or in personal growth becomes part of your legacy. Levoro learners are driven, aware, and ready for meaningful development.
              </p>
            </div>
            <div className="bg-card rounded-2xl p-8 border border-border text-center">
              <Heart className="h-10 w-10 mx-auto mb-4 text-slate-blue" />
              <h3 className="font-bold text-foreground text-lg mb-3">A platform with the purpose</h3>
              <p className="text-muted-foreground text-base text-left">
                We hold ourselves to high standards when it comes to transparency, accessibility, and data privacy.
              </p>
              <p className="text-muted-foreground mt-3 text-base text-left">
                We're continually improving our user experience so that our platform works for everyone, especially those with additional needs or barriers to learning.
              </p>
              <p className="text-muted-foreground mt-3 text-base text-left">
                We're not here to ride the latest trend or push hustle culture. We're here to build something steady, supportive, and sustainable – for our learners, our team, and the world we're part of.
              </p>
            </div>
            <div className="bg-primary rounded-2xl p-8 text-center flex flex-col justify-center">
              <h3 className="font-bold text-primary-foreground text-lg mb-3">
                At Levoro, growth means more than success. It means clarity, care, and long-term impact.
              </h3>
              <p className="text-primary-foreground/80 mb-6 text-base text-left">
                That's why we build our platform with the intention of being clear, ethical, and human-centered from the ground up.
              </p>
              <Button variant="outlineOnDark" asChild className="uppercase tracking-widest font-bold mx-auto">
                <Link to="/teach">Learn More and Become an Instructor</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default AboutUs;
