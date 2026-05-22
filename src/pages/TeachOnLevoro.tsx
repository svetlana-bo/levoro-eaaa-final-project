import SEOHead from "@/components/SEOHead";
import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  CheckCircle, Globe, BarChart3, Layers, FileText, Monitor, Heart,
  Users, Laptop, ChevronRight, Linkedin, ChevronDown,
} from "lucide-react";

import handsLaptopImg from "@/assets/teach-hands-laptop.jpg";
import collaborationImg from "@/assets/teach-collaboration.jpg";
import { AdminEditableImage } from "@/components/AdminEditableImage";

const heroChecklist = [
  "Teach professionals who want practical skill development",
  "Turn your expertise into a structured online course",
  "Reach a global audience of motivated learners",
  "Be part of a curated platform for expert instructors",
];

const stats = [
  { icon: <Globe className="h-8 w-8 text-slate-blue" />, text: <>Learners from <strong>15+</strong> countries</> },
  { icon: <BarChart3 className="h-8 w-8 text-slate-blue" />, text: <><strong>30+</strong> expert instructors</> },
  { icon: <Layers className="h-8 w-8 text-slate-blue" />, text: <>Built on <strong>adult learning science</strong></> },
];

const whyCards = [
  { icon: <FileText className="h-8 w-8 text-slate-blue" />, title: "Your course, your brand", desc: "Your course reflects your expertise and identity. Your name, brand, voice, and professional perspective remain clearly represented on the Levoro platform." },
  { icon: <Monitor className="h-8 w-8 text-slate-blue" />, title: "Visibility in a high-trust learning environment", desc: "Levoro is a curated learning platform where instructors are presented as trusted experts. Courses are promoted through our platform, campaigns, and recommendations to relevant learners." },
  { icon: <Heart className="h-8 w-8 text-slate-blue" />, title: "Guided course development", desc: "Our team supports instructors in structuring their expertise into engaging courses based on modern adult learning principles, including microlearning and reflection-based learning." },
  { icon: <Laptop className="h-8 w-8 text-slate-blue" />, title: "Low technical barrier", desc: "You focus on sharing your expertise. We support the course structure, hosting, and learner experience so you can concentrate on creating valuable content." },
  { icon: <Users className="h-8 w-8 text-slate-blue" />, title: "Long-term earning potential", desc: "Levoro instructors participate in a revenue-share model. Once your course is part of the learning library, it can continue generating income over time." },
];

const teachingCards = [
  { title: "A collaborative approach", desc: "We work closely with instructors to shape courses that deliver real value to learners rather than simply publishing content." },
  { title: "Structured course development", desc: "Our team helps transform your expertise into a clear course structure aligned with Levoro's learning methodology." },
  { title: "Focus on meaningful learning", desc: "Courses are designed to help professionals apply what they learn in real-world situations." },
  { title: "Part of a global expert ecosystem", desc: "Levoro instructors become part of an international network of professionals who contribute to a growing learning platform." },
];

const expertiseAreas = [
  { label: "Business & Strategy", slug: "business-strategy" },
  { label: "Finance & Financial Literacy", slug: "finance" },
  { label: "Personal Effectiveness & Productivity", slug: "personal-effectiveness" },
  { label: "Career & Professional Development", slug: "career" },
  { label: "Leadership & Teamwork", slug: "leadership-teamwork" },
  { label: "Technology, Data & AI", slug: "technology-data-ai" },
  { label: "Design & Creative Thinking", slug: "design" },
  { label: "Marketing & Personal Branding", slug: "marketing-sales" },
  { label: "Workplace Skills & Communication", slug: "workplace-skills" },
];

const courseIncludes = [
  "short lessons (often under 5 minutes)",
  "practical examples and frameworks",
  "reflection questions that deepen understanding",
  "downloadable tools, templates, or exercises",
];

const collaborationPoints = [
  "We work closely with every instructor to shape their expertise into a clear, engaging learning experience.",
  "Levoro is not a platform for uploading large amounts of unstructured content. Each course is carefully developed in collaboration between the instructor and our team to ensure it delivers real value to learners.",
  "As an instructor, your course represents your professional expertise, so we encourage thoughtful preparation and meaningful contribution to the learning experience.",
  "Together, we transform your knowledge into a course that reflects both your expertise and Levoro's learning standards.",
];

const processSteps = [
  { num: 1, title: "Share your course idea", desc: "Tell us about your expertise and the course you would like to create by completing the instructor application form." },
  { num: 2, title: "Review and conversation", desc: "Our team reviews every application carefully and typically responds within 1–2 business days. If your topic fits the Levoro learning library, we may invite you to a short conversation to explore the course idea and ensure strong alignment with Levoro's learning philosophy and values." },
  { num: 3, title: "Course development", desc: "Once approved, we support you throughout the course creation process. This includes onboarding, guidance on structuring lessons based on Levoro's learning methodology, and feedback to help shape your course into a clear and engaging learning experience. Before publishing, our team reviews the course together with you to ensure it meets Levoro's quality standards." },
  { num: 4, title: "Launch", desc: "Once your course is ready, it becomes part of the Levoro learning library and is available to learners worldwide. We support course visibility through the platform and our communication channels, and we also encourage instructors to share their courses within their own professional networks. Together, this helps the course reach the right audience." },
];

const TeachOnLevoro = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({ fullName: "", email: "", courseTopic: "", linkedinUrl: "", experience: "" });
  const [consent, setConsent] = useState(false);
  const [showAllInstructors, setShowAllInstructors] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");

  const { data: instructors = [] } = useQuery({
    queryKey: ["teach-page-instructors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("instructor_public_profiles" as any)
        .select("id, first_name, last_name, avatar_url, country, linkedin_url, bio, category_ids");
      return (data as any[]) || [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["instructor-categories-public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("instructor_categories" as any)
        .select("id, name, sort_order")
        .order("sort_order");
      return (data as any[]) || [];
    },
  });

  const shuffledInstructors = useMemo(() => {
    return [...instructors].sort(() => Math.random() - 0.5);
  }, [instructors]);

  const visibleCategories = useMemo(() => {
    return categories.filter((c: any) =>
      instructors.some((i: any) => Array.isArray(i.category_ids) && i.category_ids.includes(c.id))
    );
  }, [categories, instructors]);

  useEffect(() => {
    if (activeCategoryId || visibleCategories.length === 0) return;
    const preferred = visibleCategories.find((c: any) =>
      typeof c.name === "string" && c.name.toLowerCase().includes("leadership")
    );
    setActiveCategoryId((preferred?.id ?? visibleCategories[0].id) as string);
  }, [visibleCategories, activeCategoryId]);

  const filteredInstructors = useMemo(() => {
    if (!activeCategoryId) return [];
    return shuffledInstructors.filter((i: any) =>
      Array.isArray(i.category_ids) && i.category_ids.includes(activeCategoryId)
    );
  }, [shuffledInstructors, activeCategoryId]);

  const visibleInstructors = showAllInstructors ? filteredInstructors : filteredInstructors.slice(0, 6);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) { toast.error("Please accept the privacy policy."); return; }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-contact-form", {
        body: {
          source_page: "teach",
          sender_name: formData.fullName,
          sender_email: formData.email,
          subject: `Instructor application: ${formData.courseTopic}`,
          message: formData.experience,
          metadata: {
            course_topic: formData.courseTopic,
            linkedin_url: formData.linkedinUrl,
          },
          category_slug: "general",
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error(typeof (data as any).error === "string" ? (data as any).error : "Submission failed");
      toast.success("Application submitted! We'll be in touch within 1–2 business days.");
      setFormData({ fullName: "", email: "", courseTopic: "", linkedinUrl: "", experience: "" });
      setConsent(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <SEOHead title="Teach on Levoro" description="Share your expertise with professionals worldwide. Join Levoro Academy as an instructor and create impactful micro-courses." canonicalPath="/teach" pageId="teach" />
      {/* ── Hero ── */}
      <section className="mesh-gradient py-20 md:py-28">
        <div className="max-w-[1200px] mx-auto px-5 grid md:grid-cols-2 gap-12 items-center">
          <div className="opacity-0 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-5 leading-tight font-sans">
              Teach what you know.<br />Help others grow.
            </h1>
            <p className="text-foreground/70 text-lg mb-3">
              Join Levoro Academy as an instructor and turn your expertise into a structured course designed for real-world learning. Reach professionals around the world through a curated learning platform.
            </p>
            <Button variant="hero" size="lg" className="mt-6" onClick={scrollToForm}>
              Share Your Course Idea
            </Button>
            <p className="text-sm text-muted-foreground mt-3">Tell us about your expertise and the course you would like to create.</p>
          </div>
          <div className="space-y-3 opacity-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            {heroChecklist.map(item => (
              <div key={item} className="flex items-center gap-3 bg-card rounded-lg px-5 py-4 border border-border/40 shadow-sm">
                <CheckCircle className="h-5 w-5 text-slate-blue shrink-0" />
                <span className="text-foreground font-medium text-base">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="py-10 bg-background">
        <div className="max-w-[1200px] mx-auto px-5 grid md:grid-cols-3 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-4 bg-card rounded-xl p-6 border border-border/40 shadow-sm">
              {s.icon}
              <span className="text-foreground">{s.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── A different kind of learning platform ── */}
      <section className="py-16 bg-background">
        <div className="max-w-[1200px] mx-auto px-5 grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-border/40 shadow-sm">
          <div className="bg-card p-10 md:p-14 flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              <span className="text-highlight">A different</span> kind of learning platform
            </h2>
            <p className="text-muted-foreground mb-3 text-base">Levoro Academy is not an open course marketplace.</p>
            <p className="text-muted-foreground mb-3 text-base">We work with a curated network of expert instructors who create courses designed for real-world skill development.</p>
            <p className="text-muted-foreground text-base">Our focus is not on publishing thousands of courses, but on building a high-quality learning library where every course is structured, practical, and designed to help adults apply what they learn.</p>
          </div>
          <div className="h-64 md:h-auto">
            <AdminEditableImage imageKey="teach-hands-laptop" defaultSrc={handsLaptopImg} alt="Professional typing on laptop" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto px-5 mt-6 grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-border/40 shadow-sm">
          <div className="h-64 md:h-auto order-2 md:order-1">
            <AdminEditableImage imageKey="teach-collaboration" defaultSrc={collaborationImg} alt="Instructors collaborating" className="w-full h-full object-cover" />
          </div>
          <div className="bg-card p-10 md:p-14 flex flex-col justify-center order-1 md:order-2">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Learners are at the centre of everything we build.
            </h2>
            <p className="text-muted-foreground mb-3 text-base">Every course is designed with the needs of modern professionals in mind, using learning formats that support focus, retention, and real-world application.</p>
            <p className="text-muted-foreground text-base">As an instructor, you become part of a growing global ecosystem of professionals who share knowledge that truly helps others grow.</p>
          </div>
        </div>
      </section>

      {/* ── Why experts choose to teach on Levoro ── */}
      <section className="py-20 bg-background">
        <div className="max-w-[1200px] mx-auto px-5 text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Why experts choose to teach on Levoro</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">Levoro instructors join a curated platform that supports meaningful learning, professional visibility, and long-term impact.</p>
        </div>
        <div className="max-w-[1200px] mx-auto px-5 grid md:grid-cols-3 gap-6">
          {whyCards.map(c => (
            <div key={c.title} className="bg-card rounded-xl p-8 border border-border/40 shadow-sm text-center">
              <div className="flex justify-center mb-4">{c.icon}</div>
              <h3 className="font-bold text-lg text-foreground mb-2">{c.title}</h3>
              <p className="text-muted-foreground text-base">{c.desc}</p>
            </div>
          ))}
          <div className="bg-gradient-to-br from-secondary/10 via-accent/10 to-primary/5 rounded-xl p-8 border border-secondary/30 shadow-sm flex flex-col items-center justify-center text-center mesh-gradient">
            <h3 className="font-bold text-lg text-foreground mb-4">Have an idea for a course?</h3>
            <Button variant="default" size="lg" onClick={scrollToForm}>Share Your Course Idea</Button>
          </div>
        </div>
      </section>

      {/* ── What it's like to teach on Levoro ── */}
      <section className="py-20 mesh-gradient">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              What it's like to teach on Levoro <span className="text-highlight">digital learning</span>
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">Teaching on Levoro is a collaborative process designed to help instructors turn their expertise into meaningful learning experiences.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {teachingCards.map(c => (
              <div key={c.title} className="bg-card/80 rounded-xl p-8 border border-border/40 shadow-sm">
                <h3 className="font-bold text-lg text-foreground mb-2">{c.title}</h3>
                <p className="text-muted-foreground text-base">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Is Levoro the right platform for you? ── */}
      <section className="py-20 bg-background">
        <div className="max-w-[1200px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Is Levoro the <span className="text-highlight">right</span> platform for you?
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto mb-3">We collaborate with professionals who have real experience in their field and want to share knowledge that helps others grow.</p>
          <p className="text-muted-foreground max-w-3xl mx-auto mb-10">Levoro instructors are not selected based on how many courses they can produce, but on the value their expertise can bring to learners.</p>

          <h3 className="text-2xl font-bold text-primary mb-6">Typical expertise areas include</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
            {expertiseAreas.map(area => (
              <Link
                key={area.slug}
                to={`/courses?category=${area.slug}`}
                className="flex items-center gap-3 bg-card rounded-lg px-5 py-4 border border-border/40 shadow-sm text-left hover:border-secondary hover:shadow-md transition"
              >
                <ChevronRight className="h-4 w-4 text-slate-blue shrink-0" />
                <span className="text-foreground font-medium text-base">{area.label}</span>
              </Link>
            ))}
          </div>
          <p className="text-muted-foreground italic">These are examples, not limitations. If your expertise helps professionals grow, we would love to hear your course idea.</p>
        </div>
      </section>

      {/* ── You don't need to be a professional educator ── */}
      <section className="py-16 mesh-gradient">
        <div className="max-w-[1200px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">You don't need to be a professional educator.</h2>
          <p className="text-muted-foreground mb-8">What matters most is:</p>
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {["Real-world experience", "Practical insights that others can apply", "The ability to explain ideas clearly"].map(item => (
              <div key={item} className="flex items-center gap-3 bg-card/80 rounded-lg px-5 py-4 border border-border/40 shadow-sm">
                <CheckCircle className="h-5 w-5 text-slate-blue shrink-0" />
                <span className="text-foreground font-medium text-base">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Instructor success matters ── */}
      <section className="py-16 bg-background text-center">
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Instructor success matters to us</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto mb-3">We work closely with every instructor to help shape their course into the strongest possible learning experience for our learners.</p>
          <p className="text-muted-foreground max-w-3xl mx-auto mb-8">Our goal is not simply to publish courses, but to help instructors create learning experiences that truly make a difference.</p>
          <h3 className="text-xl font-bold text-foreground mb-4">Interested in joining our instructor network?</h3>
          <Button variant="default" size="lg" onClick={scrollToForm}>Start Your Instructor Application</Button>
        </div>
      </section>

      {/* ── How teaching on Levoro works ── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-5 grid md:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden">
            <AdminEditableImage imageKey="teach-collaboration-2" defaultSrc={collaborationImg} alt="Two professionals collaborating" className="w-full h-auto object-cover" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">How teaching on Levoro works</h2>
            <p className="text-muted-foreground mb-3">Levoro courses are designed differently from traditional online courses.</p>
            <p className="text-muted-foreground mb-5">Instead of long lectures, courses are structured into short, focused learning sessions that help learners understand ideas quickly and apply them in real-world situations.</p>
            <p className="font-bold text-foreground mb-3">Courses typically include:</p>
            <div className="bg-card rounded-xl p-5 border border-border/40 shadow-sm space-y-2 mb-5">
              {courseIncludes.map(item => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-slate-blue shrink-0" />
                  <span className="text-muted-foreground text-base">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground">This structure helps learners retain knowledge and apply it in their work and daily lives.</p>
          </div>
        </div>
      </section>

      {/* ── Collaboration with our team ── */}
      <section className="py-20 mesh-gradient">
        <div className="max-w-[900px] mx-auto px-5">
          <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-10">
            Collaboration with <span className="text-highlight">our team</span>
          </h2>
          <div className="space-y-4">
            {collaborationPoints.map((point, i) => (
              <div key={i} className="bg-card/80 rounded-xl px-6 py-5 border border-border/40 shadow-sm flex items-start gap-4">
                <CheckCircle className="h-5 w-5 text-slate-blue shrink-0 mt-0.5" />
                <p className="text-foreground text-base">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How the process works ── */}
      <section className="py-20 bg-background">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">How the process works</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto mb-2">Becoming a Levoro instructor is a collaborative process designed to help turn your expertise into a meaningful learning experience.</p>
            <p className="font-bold text-foreground">Most instructors move from idea to course launch through a simple, guided process with our team.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mt-10">
            {processSteps.map(s => (
              <div key={s.num} className="bg-muted/40 rounded-xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-bold text-lg text-foreground mb-3">{s.title}</h3>
                <p className="text-muted-foreground text-base">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ready to teach CTA ── */}
      <section className="py-16 bg-background text-center">
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-3xl font-bold text-primary mb-6">Ready to teach on Levoro?</h2>
          <Button variant="default" size="lg" onClick={scrollToForm}>Start Your Instructor Application</Button>
        </div>
      </section>

      {/* ── Meet Levoro Instructors ── */}
      {shuffledInstructors.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="max-w-[1200px] mx-auto px-5">
            <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-10">Meet Levoro instructors</h2>

            {visibleCategories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-10 -mx-2 px-2 overflow-x-auto">
                {visibleCategories.map((cat: any) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => { setActiveCategoryId(cat.id); setShowAllInstructors(false); }}
                    className={`shrink-0 px-6 py-3 rounded-full border text-sm font-medium transition-all ${activeCategoryId === cat.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {filteredInstructors.length === 0 ? (
              <p className="text-center text-muted-foreground">No instructors in this category yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleInstructors.map(instructor => {
                  const name = `${instructor.first_name || ""} ${instructor.last_name || ""}`.trim() || "Instructor";
                  const initials = `${(instructor.first_name || "")[0] || ""}${(instructor.last_name || "")[0] || ""}`.toUpperCase();
                  return (
                    <Link
                      key={instructor.id}
                      to={`/instructor/${instructor.id}`}
                      className="group bg-card rounded-xl p-6 border border-border/40 shadow-sm hover:border-secondary hover:shadow-md transition flex items-center gap-5"
                    >
                      <Avatar className="h-20 w-20 border-2 border-secondary/20 shrink-0">
                        <AvatarImage src={instructor.avatar_url || undefined} alt={name} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-lg">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{name}</h3>
                        {instructor.country && <p className="text-muted-foreground text-base">Country: {instructor.country}</p>}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium text-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                            Read more <ChevronRight className="h-3 w-3" />
                          </span>
                          {instructor.linkedin_url && (
                            <Linkedin
                              className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors"
                              onClick={(e) => { e.preventDefault(); window.open(instructor.linkedin_url!, "_blank"); }}
                            />
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            {filteredInstructors.length > 6 && (
              <div className="text-center mt-8">
                <Button variant="outline" onClick={() => setShowAllInstructors(!showAllInstructors)}>
                  {showAllInstructors ? "Show less" : `Show all instructors (${filteredInstructors.length})`}
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showAllInstructors ? "rotate-180" : ""}`} />
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Application Form ── */}
      <section className="py-20 mesh-gradient" ref={formRef}>
        <div className="max-w-[800px] mx-auto px-5">
          <div className="bg-card rounded-2xl p-8 md:p-12 border border-border/40 shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-3">
              Share your expertise with the Levoro learning community
            </h2>
            <p className="text-muted-foreground text-center mb-2">If you have knowledge that could help professionals grow, we would love to hear your course idea.</p>
            <p className="text-muted-foreground text-center mb-2">Tell us a bit about your expertise and the topic you would like to teach. Our team reviews every application and will get back to you shortly.</p>
            <p className="font-bold text-foreground text-center mb-8">The application takes about 2 minutes to complete.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider">Full Name <span className="text-destructive">*</span></Label>
                  <Input required value={formData.fullName} onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider">Email <span className="text-destructive">*</span></Label>
                  <Input required type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider">What would you love to create a course about? <span className="text-destructive">*</span></Label>
                <Input required value={formData.courseTopic} onChange={e => setFormData(p => ({ ...p, courseTopic: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider">LinkedIn Profile URL</Label>
                <Input value={formData.linkedinUrl} onChange={e => setFormData(p => ({ ...p, linkedinUrl: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider">Describe yourself and your experience <span className="text-destructive">*</span></Label>
                <Textarea required rows={5} value={formData.experience} onChange={e => setFormData(p => ({ ...p, experience: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider">Add your CV or presentation of experience</Label>
                <Input type="file" className="mt-1" accept=".pdf,.doc,.docx,.ppt,.pptx" />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
                <label htmlFor="consent" className="text-sm text-muted-foreground">
                  I have read and I consent to Levoro Academy's{" "}
                  <Link to="/privacy" className="text-secondary hover:underline">privacy policy</Link>.
                </label>
              </div>
              <Button type="submit" variant="default" size="lg" disabled={submitting}>
                {submitting ? "Submitting…" : "Teach with Levoro"}
              </Button>
              <p className="text-sm text-muted-foreground text-center">We usually respond within 1–2 business days.</p>
            </form>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default TeachOnLevoro;
