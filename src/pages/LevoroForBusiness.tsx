import SEOHead from "@/components/SEOHead";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ArrowRight, Globe, BarChart3, Layers, BookOpen, FileCheck, MonitorCheck } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { AdminEditableImage } from "@/components/AdminEditableImage";
import { supabase } from "@/integrations/supabase/client";

const LevoroForBusiness = () => {
  const [formData, setFormData] = useState({
    fullName: "", email: "", company: "", website: "", teamSize: "2-10", contactTime: "", consent: false,
    interests: { teamAccess: false, digitalise: false, lmsBranded: false, other: false },
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.company) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!formData.consent) {
      toast.error("Please accept the privacy policy.");
      return;
    }
    setSubmitting(true);
    try {
      const interestLabels: string[] = [];
      if (formData.interests.teamAccess) interestLabels.push("Team access to Levoro library");
      if (formData.interests.digitalise) interestLabels.push("Digitalising internal training");
      if (formData.interests.lmsBranded) interestLabels.push("Branded LMS platform");
      if (formData.interests.other) interestLabels.push("Other");

      const messageLines = [
        `Company: ${formData.company}`,
        formData.website && `Website: ${formData.website}`,
        `Team size: ${formData.teamSize}`,
        interestLabels.length && `Interests: ${interestLabels.join(", ")}`,
        formData.contactTime && `Preferred contact time: ${formData.contactTime}`,
      ].filter(Boolean).join("\n");

      const { data, error } = await supabase.functions.invoke("submit-contact-form", {
        body: {
          source_page: "business",
          sender_name: formData.fullName,
          sender_email: formData.email,
          subject: `Business inquiry: ${formData.company}`,
          message: messageLines || "No additional details provided.",
          metadata: {
            company: formData.company,
            website: formData.website,
            team_size: formData.teamSize,
            interests: interestLabels,
            preferred_contact_time: formData.contactTime,
          },
          category_slug: "general",
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error(typeof (data as any).error === "string" ? (data as any).error : "Submission failed");
      toast.success("Thank you! We'll be in touch within 1–2 business days.");
      setFormData({ fullName: "", email: "", company: "", website: "", teamSize: "2-10", contactTime: "", consent: false, interests: { teamAccess: false, digitalise: false, lmsBranded: false, other: false } });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <SEOHead title="Levoro for Business" description="Upskill your team with Levoro Academy's corporate learning solutions. Science-based micro-courses tailored for professional development." canonicalPath="/business" pageId="business" />
      {/* Hero */}
      <section className="mesh-gradient py-20 md:py-28">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="opacity-0 animate-fade-in">
              <h1 className="text-3xl md:text-[2.75rem] font-extrabold text-primary leading-tight mb-6">
                Learning that actually works for your team
              </h1>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Give your people continuous access to expert-led skill development or let us build your entire learning infrastructure. Three ways to work with Levoro.
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="#contact-form">
                  Tell Us About Your Team
                </a>
              </Button>
              <p className="text-muted-foreground text-base mt-4">No commitment. Just a short conversation to explore how Levoro can support your organisation.</p>
            </div>
            <div className="space-y-4 opacity-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              {[
                "Unlimited access to Levoro Academy courses for your employees",
                "Expert-led learning that your team can apply immediately",
                "Support to digitalise your company's internal training materials",
              ].map((text) => (
                <div key={text} className="bg-card rounded-xl px-6 py-4 border border-border/50 flex items-center gap-3 shadow-sm">
                  <CheckCircle aria-hidden="true" className="h-5 w-5 text-slate-blue shrink-0" />
                  <span className="text-foreground text-base">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-border/50 bg-card">
        <div className="max-w-[1200px] mx-auto px-5 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: <Globe aria-hidden="true" className="h-6 w-6 text-primary" />, text: <>Learners from <strong>15+</strong> countries</> },
              { icon: <BarChart3 aria-hidden="true" className="h-6 w-6 text-primary" />, text: <><strong>30+</strong> expert instructors</> },
              { icon: <Layers aria-hidden="true" className="h-6 w-6 text-primary" />, text: <>Built on <strong>adult learning science</strong></> },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-4 bg-muted/30 rounded-xl px-6 py-5">
                {s.icon}
                <span className="text-foreground text-base">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Traditional vs Modern */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">
              Traditional training <span className="text-highlight">rarely</span> sticks
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Many organisations invest in training, yet the real impact often stays limited.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-card rounded-xl p-8 border border-border/50">
              <h3 className="font-bold text-lg mb-5 text-foreground">Why traditional training struggles</h3>
              <ul className="space-y-3">
                {["Workshops are expensive and difficult to schedule", "Conferences take employees away from their daily work", "Internal training materials sit unused in slides and documents", "One-size-fits-all formats leave most learners disengaged"].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-muted-foreground text-base">
                    <XCircle aria-hidden="true" className="h-4 w-4 text-foreground/70 mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card rounded-xl p-8 border border-secondary/30 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 mesh-gradient opacity-20" />
              <div className="relative">
                <h3 className="font-bold text-lg mb-5 text-foreground">What actually works instead</h3>
                <ul className="space-y-3">
                  {["Continuous learning, not one-off events", "Practical skills employees can apply the same day", "Learning designed for how adults actually think and retain", "Flexible access — not tied to a calendar or a classroom"].map((t) => (
                    <li key={t} className="flex items-start gap-3 text-foreground text-base">
                      <CheckCircle aria-hidden="true" className="h-4 w-4 text-slate-blue mt-0.5 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-foreground text-base font-bold">Levoro was built to solve exactly this.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smarter solution */}
      <section className="py-16 md:py-20 bg-card">
        <div className="max-w-[1200px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            A smarter learning solution for your organisation
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Levoro combines expert-led learning with tools that help organisations turn internal knowledge into structured digital learning.
          </p>
        </div>
      </section>

      {/* Three ways to work with Levoro */}
      <section className="mesh-gradient-static py-16 md:py-20">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">
              Three ways to work <span className="text-highlight">with Levoro</span>
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto mt-4">
              Whether you need a ready-made learning benefit for your team, help with digitalizing internal knowledge, or a fully branded learning platform of your own, Levoro has a solution that fits where you are right now.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 md:grid-rows-[auto_auto_1fr_auto_auto]">
            {[
              {
                icon: <BookOpen aria-hidden="true" className="h-5 w-5 text-primary" />,
                iconBg: "",
                accent: "border-t-secondary",
                goodForBg: "bg-secondary/10 border-l-secondary",
                tag: "Employee Learning Benefit",
                heading: "Give your team unlimited access to expert-led courses.",
                body: "Your employees get continuous access to the full Levoro Academy library covering leadership, communication, career development, AI, and modern workplace skills, and more. Lessons are short, structured, and designed for real-world application, so learning fits into real workdays rather than disrupting them.",
                goodFor: "Companies that want to offer learning as an employee benefit without building anything from scratch.",
                cta: "Explore the course library",
                href: "/courses",
                interestKey: null as null | "teamAccess" | "digitalise" | "lmsBranded",
              },
              {
                icon: <FileCheck aria-hidden="true" className="h-5 w-5 text-primary" />,
                iconBg: "",
                accent: "border-t-apricot",
                goodForBg: "bg-apricot/15 border-l-apricot",
                tag: "Internal Training Digitalization",
                heading: "Turn your internal knowledge into structured digital learning.",
                body: "Most organizations have valuable expertise locked inside slides, documents, and people's heads. We transform your existing training materials into high-quality digital learning experiences — structured using adult learning principles, designed for modern learners, and built to be reused and scaled across your organization.",
                goodFor: "Companies that want to preserve internal expertise and make it accessible to every team member, on demand.",
                cta: "Tell us about your training materials",
                href: "#contact-form",
                interestKey: "digitalise" as const,
              },
              {
                icon: <MonitorCheck aria-hidden="true" className="h-5 w-5 text-primary" />,
                iconBg: "",
                accent: "border-t-primary",
                goodForBg: "bg-primary/5 border-l-primary",
                tag: "LMS — Branded Learning Platform",
                heading: "Your own learning platform, powered by Levoro.",
                body: "For organizations that want full ownership of their learning environment. We provide a fully branded platform where you can host your own internal courses alongside curated Levoro content, manage users, track learning progress, and scale internal knowledge across your entire organization, all under your brand.",
                goodFor: "Growing companies and enterprises building a long-term internal learning culture.",
                cta: "Let's talk about your platform needs",
                href: "#contact-form",
                interestKey: "lmsBranded" as const,
              },
            ].map((card, idx) => {
              const handleCtaClick = () => {
                if (card.interestKey) {
                  setFormData((prev) => ({
                    ...prev,
                    interests: { ...prev.interests, [card.interestKey!]: true },
                  }));
                }
              };
              const ButtonInner = (
                <>
                  {card.cta}
                </>
              );
              const btnClass = idx === 0 ? "w-full text-xs gap-1" : "w-auto px-6 text-xs gap-1";
              const btnWrapperClass = idx === 0 ? "" : "flex justify-center";
              return (
                <div
                  key={card.tag}
                  className={`bg-card rounded-xl border border-border/50 border-t-4 ${card.accent} shadow-sm p-6 flex flex-col md:grid md:row-span-5 md:grid-rows-subgrid`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center">
                      {card.icon}
                    </div>
                    <span className="bg-muted text-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">{card.heading}</h3>
                  <p className="text-muted-foreground text-base leading-snug mb-3">{card.body}</p>
                  <div className={`${card.goodForBg} border-l-4 rounded-md px-3 py-2 mb-3`}>
                    <p className="text-xs font-bold tracking-wider uppercase text-foreground mb-0.5">Good for</p>
                    <p className="text-foreground text-base italic">{card.goodFor}</p>
                  </div>
                  <div className={btnWrapperClass}>
                    {card.href.startsWith("#") ? (
                      <Button variant="hero" size="lg" className={btnClass} asChild>
                        <a href={card.href} onClick={handleCtaClick}>{ButtonInner}</a>
                      </Button>
                    ) : (
                      <Button variant="hero" size="lg" className={btnClass} asChild>
                        <Link to={card.href}>{ButtonInner}</Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What organisations gain */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-12 items-stretch">
            <div className="relative md:h-full">
              <AdminEditableImage
                imageKey="business-organisations-image"
                alt="What organisations gain with Levoro"
                className="w-full h-full rounded-2xl object-cover"
                containerClassName="h-80 md:absolute md:inset-0 md:h-auto rounded-2xl overflow-hidden"
                fallback={
                  <div className="h-80 md:h-full bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center w-full">
                    <span aria-hidden="true" className="text-6xl opacity-30">🎓</span>
                  </div>
                }
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-8">
                What organisations <span className="text-highlight">gain</span> with Levoro
              </h2>
              <div className="space-y-4">
                {[
                  { title: "Continuous learning culture", desc: "Create a culture where employees can continuously develop their skills without leaving their workflow or waiting for the next training event." },
                  { title: "Built for teams of any size", desc: "Levoro works for teams of 5 or 5000 — and grows with you as your organization scales." },
                  { title: "Scalable internal knowledge", desc: "Transform your company's expertise into structured digital learning that can be reused, shared, and scaled across the organisation." },
                  { title: "Flexible for growing teams", desc: "Levoro works equally well for small teams and growing organisations, making it easy to expand learning as your company grows." },
                ].map((b) => (
                  <div key={b.title} className="bg-card rounded-xl px-6 py-5 border border-border/50 shadow-sm">
                    <div className="flex items-start gap-3">
                      <CheckCircle aria-hidden="true" className="h-5 w-5 text-slate-blue mt-0.5 shrink-0" />
                      <div className="text-base">
                        <h3 className="font-bold mb-1 text-base">{b.title}</h3>
                        <p className="text-muted-foreground text-base">{b.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who it works for */}
      <section className="mesh-gradient-static-alt py-16 md:py-20">
        <div className="max-w-[900px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-10">
            Who Levoro works <span className="text-highlight">best</span> for
          </h2>
          <div className="space-y-4">
            {[
              { title: "Companies that want their own learning platform", desc: "Organizations ready to take ownership of their learning infrastructure, fully branded, fully theirs." },
              { title: "Companies building a modern learning culture", desc: "Teams moving beyond occasional workshops toward ongoing learning." },
              { title: "Teams that need flexible professional development", desc: "Organisations looking for practical learning without expensive training programmes or long-term commitments." },
              { title: "Companies looking to digitalise internal knowledge", desc: "Organisations that want to turn internal expertise, training, and materials into structured digital learning." },
            ].map((item) => (
              <div key={item.title} className="bg-card/80 rounded-xl px-6 py-5 border border-border/50 text-left">
                <div className="flex items-start gap-3">
                  <CheckCircle aria-hidden="true" className="h-5 w-5 text-slate-blue mt-0.5 shrink-0" />
                  <div className="text-base">
                    <h3 className="font-bold mb-1 text-base">{item.title}</h3>
                    <p className="text-muted-foreground text-base">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <a href="#contact-form" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-secondary transition-colors mt-8">
            See if Levoro fits your team <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-[1200px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-12">
            How working with Levoro <span className="text-highlight">looks</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: 1, title: "Initial conversation", desc: "We learn about your organisation, your team, and your development goals." },
              { step: 2, title: "Exploring the possibilities", desc: "Together, we explore how Levoro's learning library and digital learning solutions could support your team." },
              { step: 3, title: "Getting started", desc: "Your team gains access to Levoro, your content is digitized, or your platform is set up. We stay involved to make sure it lands well." },
            ].map((s) => (
              <div key={s.step} className="bg-muted/30 rounded-xl p-8 border border-border/50">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-bold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-base">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning principles */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Built differently — by design</h2>
              <p className="text-muted-foreground mb-8 text-base">
                Levoro Academy is designed using research-informed adult learning principles. Every course is built to drive real skill adoption instead of just content consumption.
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="#contact-form">Tell Us About Your Team</a>
              </Button>
            </div>
            <div className="bg-card rounded-xl p-8 border border-border/50 shadow-sm">
              <h3 className="font-bold text-lg mb-5">Courses combine:</h3>
              <ul className="space-y-3">
                {[
                  { bold: "Short learning sessions", rest: " that fit into real workdays" },
                  { bold: "Reflection-based learning", rest: " that strengthens understanding" },
                  { bold: "Expert-led content", rest: " from experienced professionals" },
                  { bold: "Practical tools and frameworks", rest: " that can be applied immediately" },
                ].map((item) => (
                  <li key={item.bold} className="flex items-start gap-3 text-sm">
                    <CheckCircle aria-hidden="true" className="h-4 w-4 text-slate-blue mt-0.5 shrink-0" />
                    <span><strong>{item.bold}</strong>{item.rest}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground text-base mt-5">
                The goal is not just learning, but <strong>the adoption of real skills in everyday work.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expert instructors */}
      <section className="py-16 md:py-20 bg-muted/20">
        <div className="max-w-[1200px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
            Expert instructors <span className="text-highlight">from around the world</span>
          </h2>
          <p className="text-muted-foreground mb-8 text-base">Courses are created by professionals with experience in:</p>
          <div className="flex flex-wrap justify-center gap-4">
            {["Leadership", "Psychology", "Business strategy", "Communication", "AI and modern workplace skills"].map((s) => (
              <div key={s} className="bg-card rounded-xl px-5 py-3 border border-border/50 flex items-center gap-2 shadow-sm">
                <CheckCircle aria-hidden="true" className="h-4 w-4 text-slate-blue" />
                <span className="text-base">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="mesh-gradient py-16 md:py-20">
        <div className="max-w-[800px] mx-auto px-5">
          <div className="bg-card rounded-2xl p-8 md:p-12 shadow-lg border border-border/50">
            <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-2">Tell us about your team's learning goals</h2>
            <p className="text-center text-muted-foreground text-base mb-2">
              Share a few details about your organisation and your learning needs. We'll review your request and get back to you to discuss how Levoro could support your team.
            </p>
            <p className="text-center text-foreground text-base font-bold mb-8">Takes less than a minute to complete.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="biz-fullname" className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Full Name <span className="text-destructive" aria-label="required">*</span></Label>
                  <Input id="biz-fullname" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="biz-email" className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Business Email Address <span className="text-destructive" aria-label="required">*</span></Label>
                  <Input id="biz-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
              </div>
              <div>
                <Label htmlFor="biz-company" className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Company Name <span className="text-destructive" aria-label="required">*</span></Label>
                <Input id="biz-company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="biz-website" className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Company Website</Label>
                <Input id="biz-website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="biz-team-size" className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Team Size <span className="text-destructive" aria-label="required">*</span></Label>
                <Select value={formData.teamSize} onValueChange={(v) => setFormData({ ...formData, teamSize: v })}>
                  <SelectTrigger id="biz-team-size"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2-10">2–10</SelectItem>
                    <SelectItem value="11-50">11–50</SelectItem>
                    <SelectItem value="51-200">51–200</SelectItem>
                    <SelectItem value="200+">200+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span id="biz-interests-label" className="block text-xs font-bold tracking-wider text-muted-foreground uppercase">What are you interested in?</span>
                <div role="group" aria-labelledby="biz-interests-label" className="space-y-2 mt-2">
                  {[
                    { key: "teamAccess" as const, label: "Team access to the Levoro learning library" },
                    { key: "digitalise" as const, label: "Digitalising internal training and knowledge" },
                    { key: "lmsBranded" as const, label: "A branded learning platform (LMS)" },
                    { key: "other" as const, label: "Other" },
                  ].map((opt) => {
                    const id = `biz-interest-${opt.key}`;
                    return (
                      <div key={opt.key} className="flex items-center gap-2">
                        <Checkbox
                          id={id}
                          checked={formData.interests[opt.key]}
                          onCheckedChange={(v) => setFormData({ ...formData, interests: { ...formData.interests, [opt.key]: !!v } })}
                        />
                        <Label htmlFor={id} className="text-base font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label htmlFor="biz-contact-time" className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Preferred time to be contacted (your time zone)</Label>
                <Textarea id="biz-contact-time" value={formData.contactTime} onChange={(e) => setFormData({ ...formData, contactTime: e.target.value })} rows={2} />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="biz-consent" checked={formData.consent} onCheckedChange={(v) => setFormData({ ...formData, consent: !!v })} />
                <Label htmlFor="biz-consent" className="text-muted-foreground text-base font-normal cursor-pointer">
                  I have read and I consent to Levoro Academy's <Link to="/privacy" className="text-primary underline underline-offset-2">privacy policy</Link>.
                </Label>
              </div>
              <div className="text-center">
                <Button variant="hero" size="lg" type="submit" disabled={submitting} aria-busy={submitting}>
                  {submitting ? "Submitting…" : "Submit request"}
                </Button>
                <p className="text-muted-foreground text-base mt-3">We usually respond within 1–2 business days.</p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default LevoroForBusiness;
