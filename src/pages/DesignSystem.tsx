import PageLayout from "@/components/PageLayout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Pencil, KeyRound, UserX, Mail, Trash2, Search, Shield, Users, Plus, FileText, CheckSquare, MapPin, Upload } from "lucide-react";

const values = [
  { title: "Calm", desc: "No streaks, no urgency, no chasing. Learning happens at the learner's pace, not the platform's." },
  { title: "Warm", desc: "Human and considered. Surfaces feel hand-made, not mass-produced. Copy speaks to a person, not a segment." },
  { title: "Professional", desc: "Editorial quality. Content is built by educators and subject specialists, and the design carries that credibility." },
  { title: "Empowering", desc: "We assume capability. Defaults are strong; we do not hand-hold or condescend past the point of usefulness." },
  { title: "Grounded", desc: "Considered over flashy. Depth over hype. We trust the work to speak before reaching for embellishment." },
];

const voiceAttributes = [
  { title: "Calm and grounded", desc: "Reassuring, never alarming. We trust the learner's pace." },
  { title: "Empowering", desc: "We assume capability. We do not condescend or hand-hold past usefulness." },
  { title: "Creative and insightful", desc: "We surface fresh framings. Considered, not gimmicky." },
  { title: "Innovative", desc: "We use new tools where they serve the learner, not for novelty." },
  { title: "Professional, yet warm", desc: "Polished without being stiff. Editorial without being cold." },
];

const rejectList = [
  "Streaks, daily counters, or gamified urgency",
  "Notifications that imply guilt or falling behind",
  "Hidden costs or upgrade pressure surfaced after sign-up",
  "Generic template starting points that flatten the brand",
  "Engagement metrics confused with learning outcomes",
  'Hustle-coded copy ("Crush your goals", "Unlock your potential")',
];

const brandSwatches = [
  { name: "Warm Gold", token: "--gold / --secondary", hex: "#D3AF37", className: "bg-secondary", textLight: false },
  { name: "Soft Apricot", token: "--apricot", hex: "#F8C989", className: "bg-apricot", textLight: true },
  { name: "Cream Blush", token: "--gold-light", hex: "#F8E2C3", className: "bg-[hsl(var(--gold-light))]", textLight: true },
  { name: "Levoro Black", token: "--foreground", hex: "#212121", className: "bg-foreground", textLight: false },
  { name: "Deep Navy", token: "--navy / --primary", hex: "#1F3A60", className: "bg-primary", textLight: false },
  { name: "Slate Blue", token: "--slate-blue", hex: "#5C7292", className: "bg-slate-blue", textLight: false },
  { name: "Cool Mist", token: "--cool-mist", hex: "#8DA2BF", className: "bg-cool-mist", textLight: false },
];

const neutralSwatches = [
  { name: "White · cards", token: "--card", hex: "#FFFFFF", className: "bg-card border-b border-border", textLight: true },
  { name: "Warm off-white", token: "--background", hex: "#FAFAF7", className: "bg-background", textLight: true },
  { name: "Muted surface", token: "--muted", hex: "#F2F0EA", className: "bg-muted", textLight: true },
  { name: "Border", token: "--border", hex: "#E8E5DC", className: "bg-border", textLight: true },
  { name: "Body secondary", token: "--muted-foreground", hex: "#545454", className: "bg-[hsl(var(--muted-foreground))]", textLight: false },
];

const semanticSwatches = [
  { name: "Success", token: "--success", hex: "#3F7D5B", className: "bg-success", textLight: false },
  { name: "Warning · uses gold", token: "--warning", hex: "#D3AF37", className: "bg-warning", textLight: false },
  { name: "Destructive", token: "--destructive", hex: "#B85C5C", className: "bg-destructive", textLight: false },
];

const typeScale = [
  { sample: "Freedom to grow, space to thrive", meta: "48px · Bold · --text-4xl", cls: "text-5xl font-bold leading-tight" },
  { sample: "Levoro Academy", meta: "36px · Bold · --text-3xl", cls: "text-4xl font-bold leading-tight" },
  { sample: "Calm, considered learning", meta: "28px · Bold · --text-2xl", cls: "text-[28px] font-bold leading-tight" },
  { sample: "Designed by educators", meta: "22px · Medium · --text-xl", cls: "text-[22px] font-medium leading-tight" },
  { sample: "Section heading", meta: "18px · Medium · --text-lg", cls: "text-lg font-medium" },
  { sample: "Levoro Academy is built for adults who want to grow without being chased.", meta: "16px · Regular · --text-base", cls: "text-base leading-relaxed" },
  { sample: "Supporting text and table content sits at 14px regular.", meta: "14px · Regular · --text-sm", cls: "text-sm text-muted-foreground" },
  { sample: "EYEBROW LABEL", meta: "12px · Medium · 0.08em tracking", cls: "text-xs uppercase tracking-[0.08em] text-muted-foreground font-medium" },
];

const spaceTokens = [
  { name: "--space-1", px: 4 },
  { name: "--space-2", px: 8 },
  { name: "--space-3", px: 12 },
  { name: "--space-4", px: 16 },
  { name: "--space-5", px: 24 },
  { name: "--space-6", px: 32 },
  { name: "--space-7", px: 48 },
  { name: "--space-8", px: 64 },
];

const Section = ({ eyebrow, title, lede, children }: { eyebrow: string; title: string; lede?: string; children: React.ReactNode }) => (
  <section className="bg-card border border-border rounded-xl p-6 md:p-8 mb-6">
    <div className="mb-6">
      <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2">{eyebrow}</div>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-3">{title}</h2>
      {lede && <p className="text-muted-foreground max-w-[720px]">{lede}</p>}
    </div>
    {children}
  </section>
);

const Swatch = ({ name, token, hex, className, textLight }: { name: string; token: string; hex: string; className: string; textLight: boolean }) => (
  <div className="border border-border rounded-md overflow-hidden bg-card">
    <div className={`h-24 flex items-end p-3 text-sm font-medium ${textLight ? "text-foreground" : "text-primary-foreground"} ${className}`}>
      {name}
    </div>
    <div className="px-4 py-3 border-t border-border">
      <div className="text-sm font-medium text-foreground">{name}</div>
      <code className="text-xs text-muted-foreground block font-mono">{token}</code>
      <code className="text-xs text-muted-foreground block font-mono">{hex}</code>
    </div>
  </div>
);

const DesignSystem = () => {
  return (
    <PageLayout>
      <SEOHead
        title="Design System"
        description="Levoro Academy brand tokens, components, and patterns — the single source of truth for the design system."
        canonicalPath="/design-system"
        pageId="design-system"
      />

      <div className="max-w-[1180px] mx-auto px-5 py-12 md:py-16">
        {/* Hero */}
        <div className="mesh-gradient rounded-2xl px-6 md:px-12 py-16 md:py-24 mb-8 overflow-hidden">
          <div className="max-w-[720px]">
            <div className="text-lg md:text-xl text-primary/85 mb-3">
              Freedom to grow, <span className="text-highlight">space to thrive</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mb-4">
              Levoro Academy<br />Design System
            </h1>
            <p className="text-sm text-muted-foreground mt-6">
              Brand tokens, components, and patterns — v2.0
            </p>
          </div>
        </div>

        {/* 01 Brand values */}
        <Section
          eyebrow="01 · Brand values"
          title="What Levoro stands for"
          lede="Five values anchor every product decision. They informed the brand before the platform existed, and they continue to guide design choices today. When a decision feels unclear, return to these."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {values.map((v) => (
              <div key={v.title} className="border border-border rounded-md p-4">
                <div className="font-medium text-foreground mb-2">{v.title}</div>
                <div className="text-sm text-muted-foreground">{v.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 02 Voice */}
        <Section
          eyebrow="02 · Voice and principles"
          title="How Levoro speaks"
          lede="Voice translates the values into how Levoro communicates. Each voice attribute is one expression of a value in copy, microcopy, and surface tone."
        >
          <h3 className="text-lg font-medium text-foreground mb-3">Voice attributes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {voiceAttributes.map((v) => (
              <div key={v.title} className="border border-border rounded-md p-4">
                <div className="font-medium text-foreground mb-2">{v.title}</div>
                <div className="text-sm text-muted-foreground">{v.desc}</div>
              </div>
            ))}
          </div>

          <div className="bg-muted rounded-md p-5">
            <h4 className="font-medium text-foreground mb-3">What Levoro does not do</h4>
            <ul className="space-y-2">
              {rejectList.map((item) => (
                <li key={item} className="text-sm text-muted-foreground pl-6 relative">
                  <span className="absolute left-0 text-destructive font-bold">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* 03 Color */}
        <Section
          eyebrow="03 · Color"
          title="Brand palette"
          lede="Seven canonical brand colors plus neutrals and semantic states. The brand is anchored by Deep Navy as the primary action color and Levoro Black for body text. Warm Gold is reserved for attention and state."
        >
          <h3 className="text-lg font-medium text-foreground mb-3">Brand colors</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {brandSwatches.map((s) => <Swatch key={s.name} {...s} />)}
          </div>

          <div className="bg-secondary/10 border-l-[3px] border-secondary rounded-r-md p-4 mb-6 text-sm text-foreground">
            <strong className="font-medium">Gold is reserved for attention.</strong> Use Warm Gold for focus rings, draft and subscription status pills, category tags, and warning state. Use it sparingly as a button fill — Levoro's primary action color is Deep Navy. When in doubt, default to navy for actions and reserve gold for "look here" moments.
          </div>

          <h3 className="text-lg font-medium text-foreground mb-3">Neutrals</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {neutralSwatches.map((s) => <Swatch key={s.name} {...s} />)}
          </div>

          <h3 className="text-lg font-medium text-foreground mb-3">Semantic</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {semanticSwatches.map((s) => <Swatch key={s.name} {...s} />)}
          </div>
        </Section>

        {/* 04 Mesh gradient */}
        <Section
          eyebrow="04 · Mesh gradient"
          title="Brand signature"
          lede="The mesh gradient is Levoro's signature brand element. It combines Slate Blue and Soft Apricot over the warm off-white background. Use it for hero moments, course covers, onboarding, and empty states."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Animated mesh", cls: "mesh-gradient", token: ".mesh-gradient" },
              { name: "Static mesh", cls: "mesh-gradient-static", token: ".mesh-gradient-static" },
              { name: "Static mesh · alt", cls: "mesh-gradient-static-alt", token: ".mesh-gradient-static-alt" },
            ].map((m) => (
              <div key={m.name} className="border border-border rounded-md overflow-hidden">
                <div className={`h-36 ${m.cls}`} />
                <div className="px-4 py-3 border-t border-border">
                  <div className="text-sm font-medium text-foreground">{m.name}</div>
                  <code className="text-xs text-muted-foreground font-mono">{m.token}</code>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 05 Text highlight */}
        <Section
          eyebrow="05 · Text highlight"
          title="Marker underline"
          lede="For headline emphasis, Levoro uses a gold marker-style highlight applied to single words or short phrases. Used in hero headlines and editorial moments — not in body copy."
        >
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-baseline gap-3 md:gap-6 py-3 border-b border-border">
              <div className="flex-1 text-2xl font-bold text-foreground">
                Traditional training <span className="text-highlight">rarely</span> sticks
              </div>
              <code className="text-xs text-muted-foreground font-mono min-w-[200px]">.text-highlight</code>
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline gap-3 md:gap-6 py-3">
              <div className="flex-1 text-2xl font-bold text-foreground">
                Three ways to work <span className="text-highlight">with Levoro</span>
              </div>
              <code className="text-xs text-muted-foreground font-mono min-w-[200px]">.text-highlight</code>
            </div>
          </div>
        </Section>

        {/* 06 Typography */}
        <Section
          eyebrow="06 · Typography"
          title="Neulis Sans"
          lede="Neulis Sans is the brand typeface. Two weights — Regular (400) and Bold (700) — to keep the type voice consistent. Use Bold for headings and emphasis, Regular for body and standard UI."
        >
          <div className="divide-y divide-border">
            {typeScale.map((t, i) => (
              <div key={i} className="flex flex-col md:flex-row md:items-baseline gap-3 md:gap-6 py-4">
                <div className={`flex-1 text-foreground ${t.cls}`}>{t.sample}</div>
                <code className="text-xs text-muted-foreground font-mono min-w-[220px] whitespace-pre-line">{t.meta}</code>
              </div>
            ))}
          </div>
        </Section>

        {/* 07 Spacing */}
        <Section
          eyebrow="07 · Spacing"
          title="4px scale"
          lede="Spacing is built on a 4px base. Use named tokens rather than raw pixel values."
        >
          <div className="space-y-2">
            {spaceTokens.map((s) => (
              <div key={s.name} className="flex items-center gap-4 py-1">
                <code className="text-xs text-muted-foreground font-mono min-w-[140px]">{s.name} · {s.px}px</code>
                <div className="bg-[hsl(var(--cool-mist))] h-5 rounded-sm" style={{ width: s.px }} />
              </div>
            ))}
          </div>
        </Section>

        {/* 08 Radius */}
        <Section
          eyebrow="08 · Border radius"
          title="Soft, never pillowy"
          lede="Three radius sizes plus a pill. Primary buttons and badges use the pill. Cards and inputs use medium. Decorative blocks use large."
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: "Small", token: "--radius-sm · 6px", cls: "rounded-md" },
              { name: "Medium", token: "--radius-md · 12px", cls: "rounded-xl" },
              { name: "Large", token: "--radius-lg · 20px", cls: "rounded-[20px]" },
              { name: "Pill", token: "--radius-pill", cls: "rounded-full aspect-[2/1]" },
            ].map((r) => (
              <div key={r.name} className={`bg-muted border border-border aspect-square flex flex-col items-center justify-center gap-2 text-foreground text-sm ${r.cls}`}>
                <div>{r.name}</div>
                <code className="text-xs text-muted-foreground font-mono">{r.token}</code>
              </div>
            ))}
          </div>
        </Section>

        {/* 09 Buttons */}
        <Section
          eyebrow="09 · Buttons"
          title="Action surfaces"
          lede="Buttons inherit from the shadcn variant system. Primary uses Deep Navy; gold fills are reserved for attention moments."
        >
          <div className="space-y-6">
            <div>
              <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground mb-3">Variants</div>
              <div className="flex flex-wrap gap-3 items-center">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground mb-3">Sizes</div>
              <div className="flex flex-wrap gap-3 items-center">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground mb-3">Bordered icon buttons</div>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="outline" size="icon" className="rounded-full" aria-label="Edit">
                  <Pencil />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full text-destructive hover:text-destructive" aria-label="Delete">
                  <Trash2 />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Visible border at rest. Use for standalone actions outside dense rows.</p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground mb-3">Naked icon buttons (ghost hover)</div>
              <p className="text-sm text-muted-foreground mb-3">For action icons inside data tables, dropdowns, and tight action rows. No border at rest; a muted background appears on hover. Destructive actions tint red on hover.</p>
              <div className="inline-flex flex-wrap gap-2 items-center bg-card border border-border rounded-md px-3 py-2">
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Send email">
                  <Mail />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Edit">
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Reset password">
                  <KeyRound />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:text-destructive hover:bg-destructive/10" aria-label="Remove user">
                  <UserX />
                </Button>
              </div>
            </div>
          </div>
        </Section>

        {/* 10 Form inputs */}
        <Section
          eyebrow="10 · Form inputs"
          title="Inputs and labels"
          lede="Form fields use the medium radius, the card background, and the focus ring token for accessible focus states."
        >
          <div className="max-w-sm space-y-4">
            <div>
              <Label htmlFor="ds-email">Email address</Label>
              <Input id="ds-email" type="email" placeholder="you@example.com" className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">We will never share your email.</p>
            </div>
            <div>
              <Label htmlFor="ds-name">Display name</Label>
              <Input id="ds-name" placeholder="Your name" className="mt-2" />
            </div>
          </div>
        </Section>

        {/* 11 Status pills */}
        <Section
          eyebrow="11 · Status"
          title="Pills and tags"
          lede="Small status indicators reuse the semantic palette. Subscription and category tags use Warm Gold; states map to success / warning / destructive."
        >
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-success/15 text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />Active
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-secondary/20 text-[hsl(43_60%_32%)]">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />Pending
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-destructive/15 text-destructive">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />At risk
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-blue/15 text-slate-blue">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />Complete
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary text-primary">
              Subscription
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary/20 text-[hsl(43_60%_32%)]">
              Category tag
            </span>
          </div>
        </Section>

        {/* 12 Navigation */}
        <Section
          eyebrow="12 · Navigation"
          title="Top nav and sidebar"
          lede="The top navigation sits on a light surface with the brand wordmark left, pill search centred, links and avatar right. The admin sidebar is always dark navy regardless of theme."
        >
          <div className="space-y-8">
            <div>
              <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground mb-3">Top navigation (public)</div>
              <nav className="flex items-center gap-6 bg-card border border-border rounded-md px-5 py-3">
                <div className="text-lg font-bold text-foreground">Levoro</div>
                <a href="#" className="relative text-sm font-medium text-foreground after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-[2px] after:bg-secondary after:rounded-full">
                  Explore Courses
                </a>
                <div className="flex-1 max-w-xs relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="What do you want to learn today?"
                    className="w-full h-9 pl-9 pr-4 rounded-full bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
                <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">Teach on Levoro</a>
                <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground">For Businesses</a>
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-sm font-semibold">S</div>
              </nav>
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground mb-3">Admin sidebar (always dark)</div>
              <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 border border-border rounded-md overflow-hidden">
                <nav className="bg-primary text-primary-foreground p-4 space-y-1">
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
                    <Shield className="size-4" />
                    <span className="text-sm font-semibold">Admin Dashboard</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.1em] text-primary-foreground/50 mt-2 mb-1 px-2">User management</div>
                  <a href="#" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-primary-foreground/80 hover:bg-white/5">
                    <Users className="size-4" /> Manage
                  </a>
                  <a href="#" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-primary-foreground/80 hover:bg-white/5">
                    <Plus className="size-4" /> Create
                  </a>
                  <a href="#" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm bg-white/10 text-primary-foreground">
                    <Mail className="size-4" /> Subscribers
                  </a>
                  <div className="text-[10px] uppercase tracking-[0.1em] text-primary-foreground/50 mt-3 mb-1 px-2">Course management</div>
                  <a href="#" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-primary-foreground/80 hover:bg-white/5">
                    <FileText className="size-4" /> Draft Courses
                  </a>
                  <a href="#" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-primary-foreground/80 hover:bg-white/5">
                    <CheckSquare className="size-4" /> Course Approvals
                  </a>
                  <a href="#" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-primary-foreground ring-2 ring-secondary">
                    <CheckSquare className="size-4" /> Published Courses
                  </a>
                  <a href="#" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-primary-foreground/80 hover:bg-white/5">
                    <MapPin className="size-4" /> Hotspot Icons
                  </a>
                  <a href="#" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-primary-foreground/80 hover:bg-white/5">
                    <Upload className="size-4" /> Import Course
                  </a>
                </nav>
                <div className="bg-card p-6">
                  <h3 className="text-base font-bold text-foreground mb-2">Dashboard area</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The active sidebar item can show two states: a solid <code className="text-xs bg-muted px-1.5 py-0.5 rounded">bg-white/10</code> fill for the standard active state (Subscribers above), or a gold <code className="text-xs bg-muted px-1.5 py-0.5 rounded">ring-2 ring-secondary</code> for the "currently editing" state (Published Courses).
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                    The sidebar stays dark navy in both light and dark mode — it is the operational anchor and does not invert with theme.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 13 Content cards */}
        <Section
          eyebrow="13 · Content cards"
          title="Course and tier cards"
          lede="Course cards (B2C) use the static mesh on the cover and scale subtly on hover. Tier cards (B2B) use a coloured top stripe — gold for Tier 1, apricot for Tier 2, navy for Tier 3."
        >
          <div className="space-y-8">
            <div>
              <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground mb-3">Course card (B2C)</div>
              <div className="group max-w-sm rounded-xl overflow-hidden border border-border bg-card transition-shadow hover:shadow-lg">
                <div className="h-40 mesh-gradient-static overflow-hidden">
                  <div className="w-full h-full transition-transform duration-500 group-hover:scale-[1.06]" />
                </div>
                <div className="p-5">
                  <div className="font-bold text-foreground leading-tight mb-1">Strategic thinking for product teams</div>
                  <div className="text-sm text-muted-foreground mb-4">8 lessons · 4 hours · Self-paced</div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary text-primary">Subscription</span>
                    <Button size="sm">Enrol</Button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground mb-3">Tier cards (B2B)</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  {
                    stripe: "bg-secondary",
                    tag: "Employee Learning Benefit",
                    title: "Give your team unlimited access to expert-led courses.",
                    body: "Your employees get continuous access to the full Levoro Academy library covering leadership, communication, career development, AI, and modern workplace skills.",
                    goodFor: "Companies that want to offer learning as an employee benefit without building anything from scratch.",
                    cta: "Explore the library",
                  },
                  {
                    stripe: "bg-apricot",
                    tag: "Internal Training Digitalization",
                    title: "Turn your internal knowledge into structured digital learning.",
                    body: "Most organizations have valuable expertise locked inside slides, documents, and people's heads. We transform your existing training materials into high-quality digital learning.",
                    goodFor: "Companies that want to preserve internal expertise and make it accessible to every team member.",
                    cta: "Tell us about your materials",
                  },
                  {
                    stripe: "bg-primary",
                    tag: "LMS — Branded Learning Platform",
                    title: "Your own learning platform, powered by Levoro.",
                    body: "For organizations that want full ownership of their learning environment. We provide a fully branded platform where you can host your own internal courses.",
                    goodFor: "Growing companies and enterprises building a long-term internal learning culture.",
                    cta: "Talk about platform needs",
                  },
                ].map((t) => (
                  <Card key={t.tag} className="p-0 overflow-hidden flex flex-col">
                    <div className={`h-1 w-full ${t.stripe}`} />
                    <div className="p-6 flex flex-col gap-4 flex-1">
                      <span className="inline-flex self-start items-center px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground">{t.tag}</span>
                      <h3 className="text-lg font-bold text-foreground leading-tight">{t.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{t.body}</p>
                      <div className="bg-muted border-l-[3px] border-secondary rounded-r-md p-3">
                        <div className="text-xs uppercase tracking-[0.06em] text-muted-foreground mb-1">Good for</div>
                        <div className="text-sm text-foreground italic">{t.goodFor}</div>
                      </div>
                      <Button className="mt-auto">{t.cta}</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* 14 Data tables */}
        <Section
          eyebrow="14 · Data tables"
          title="User management table"
          lede="Tables use the muted background for the header row, sentence case for the data, and pill statuses. The Actions column sits right-aligned with naked ghost icons."
        >
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Department</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Account status</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Activity</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { initials: "EH", name: "Elin Hansen", email: "elin.hansen@org.com", dept: "Product", status: "Active", statusCls: "bg-success/15 text-success", activity: "Today", actions: ["edit", "key", "remove"] },
                  { initials: "JK", name: "Jakob Kristensen", email: "jakob.k@org.com", dept: "Operations", status: "Pending", statusCls: "bg-secondary/20 text-[hsl(43_60%_32%)]", activity: "2 days ago", actions: ["mail", "edit", "remove"] },
                  { initials: "MS", name: "Maria Sørensen", email: "maria.s@org.com", dept: "Engineering", status: "At risk", statusCls: "bg-destructive/15 text-destructive", activity: "3 weeks ago", actions: ["edit", "key", "remove"] },
                  { initials: "TL", name: "Tobias Lund", email: "tobias.l@org.com", dept: "Sales", status: "Complete", statusCls: "bg-slate-blue/15 text-slate-blue", activity: "Last week", actions: ["edit", "remove"] },
                ].map((row) => (
                  <tr key={row.email}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[hsl(var(--cool-mist))] text-primary flex items-center justify-center text-xs font-bold">{row.initials}</span>
                        <div>
                          <div className="font-medium text-foreground">{row.name}</div>
                          <div className="text-xs text-muted-foreground">{row.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{row.dept}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${row.statusCls}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />{row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.activity}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {row.actions.includes("mail") && <Button variant="ghost" size="icon" aria-label="Send invite"><Mail /></Button>}
                      {row.actions.includes("edit") && <Button variant="ghost" size="icon" aria-label="Edit"><Pencil /></Button>}
                      {row.actions.includes("key") && <Button variant="ghost" size="icon" aria-label="Reset password"><KeyRound /></Button>}
                      {row.actions.includes("remove") && <Button variant="ghost" size="icon" aria-label="Remove user" className="text-destructive hover:bg-destructive/10 hover:text-destructive"><UserX /></Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 15 Glass card */}
        <Section
          eyebrow="15 · Glass card"
          title="Card on mesh"
          lede="The glass card uses 70% card opacity with a backdrop blur. Used when a card sits over the mesh gradient and needs to read clearly without obscuring the brand surface beneath. Use sparingly."
        >
          <div className="mesh-gradient-static rounded-xl p-8 md:p-12 flex items-center justify-center">
            <div className="max-w-sm w-full bg-card/70 backdrop-blur-md border border-border/50 rounded-xl p-6 shadow-lg">
              <div className="font-bold text-foreground mb-2">Glass card pattern</div>
              <div className="text-sm text-muted-foreground">Sits over the mesh gradient with backdrop blur. Use for onboarding moments and signature surfaces only.</div>
            </div>
          </div>
        </Section>

        {/* 16 Empty state */}
        <Section
          eyebrow="16 · Empty state"
          title="When there's nothing yet"
          lede="Empty states are calm and instructive. They name what is missing, explain why, and offer one concrete next step. Never use guilt-coded copy."
        >
          <div className="border border-dashed border-border rounded-xl p-10 text-center flex flex-col items-center gap-3">
            <div className="text-lg font-bold text-foreground">No reports yet</div>
            <div className="text-sm text-muted-foreground max-w-md">Reports start to appear once your team has learning activity. Create a course or invite users to get started.</div>
            <Button className="mt-2">Invite users</Button>
          </div>
        </Section>

        {/* 17 Responsive */}
        <Section
          eyebrow="17 · Responsive"
          title="Mobile to desktop"
          lede="The platform follows Tailwind defaults plus a few project-specific patterns. The boundary between mobile and desktop is md: (768px), used by useIsMobile() to trigger sheet-based mobile navigation."
        >
          <h3 className="text-base font-bold text-foreground mb-3">Breakpoints</h3>
          <div className="overflow-x-auto border border-border rounded-lg mb-8">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Token</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Min width</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Used for</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground" style={{ width: "30%" }}>Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { name: "(default)", min: "< 640px", use: "Mobile — single column, sheet nav, vertical hero", width: 18, active: false },
                  { name: "sm:", min: "≥ 640px", use: "Large mobile / small tablet", width: 32, active: false },
                  { name: "md:", min: "≥ 768px", use: "Mobile/desktop boundary. Sheet nav swaps to inline links, sidebar pins, grids go 2-column.", width: 48, active: true },
                  { name: "lg:", min: "≥ 1024px", use: "Standard desktop — 3-column card grids, wider section padding", width: 68, active: false },
                  { name: "xl:", min: "≥ 1280px", use: "Large desktop — denser layouts, 4-column lists", width: 84, active: false },
                  { name: "2xl:", min: "≥ 1536px", use: "Ultra-wide — rarely needed; max-width caps usually kick in", width: 100, active: false },
                ].map((bp) => (
                  <tr key={bp.name} className={bp.active ? "bg-secondary/10" : ""}>
                    <td className="px-4 py-3 font-mono text-foreground">{bp.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{bp.min}</td>
                    <td className="px-4 py-3 text-foreground">{bp.use}</td>
                    <td className="px-4 py-3"><div className="h-2 rounded-full bg-primary" style={{ width: `${bp.width}%` }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-base font-bold text-foreground mb-2">Typography scaling</h3>
          <p className="text-sm text-muted-foreground mb-3">Discrete jumps at <code>md:</code> and <code>lg:</code>. No fluid clamp() typography.</p>
          <pre className="bg-muted rounded-md p-4 text-xs font-mono overflow-x-auto mb-6 text-foreground">{`// Hero headlines
text-4xl md:text-5xl lg:text-6xl xl:text-7xl

// Section titles
text-3xl md:text-4xl lg:text-5xl

// Body / lead paragraphs
text-base md:text-lg

// Small print stays the same
text-sm`}</pre>

          <h3 className="text-base font-bold text-foreground mb-2">Spacing scaling</h3>
          <pre className="bg-muted rounded-md p-4 text-xs font-mono overflow-x-auto mb-6 text-foreground">{`// Section padding
py-12 md:py-20 lg:py-28
px-4 md:px-6 lg:px-8

// Gaps in grids
gap-4 md:gap-6 lg:gap-8`}</pre>

          <h3 className="text-base font-bold text-foreground mb-3">Layout patterns</h3>
          <div className="space-y-2 mb-6">
            {[
              { label: "Card grids", code: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" },
              { label: "Dense list grids", code: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" },
              { label: "Container wrapper", code: "max-w-7xl mx-auto px-4" },
              { label: "Hero split (image + text)", code: "flex-col md:flex-row" },
              { label: "Desktop-only element", code: "hidden md:block" },
              { label: "Mobile-only element", code: "md:hidden" },
            ].map((p) => (
              <div key={p.label} className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
                <div className="text-sm text-muted-foreground">{p.label}</div>
                <code className="bg-muted rounded-md px-3 py-2 text-xs font-mono text-foreground">{p.code}</code>
              </div>
            ))}
          </div>

          <div className="space-y-4 text-sm text-muted-foreground mb-6">
            <div>
              <h4 className="font-bold text-foreground mb-1">Navbar behaviour</h4>
              <p>Height is locked at <code>--navbar-height: 5rem</code> (80px) on all viewport sizes. Below <code>md:</code>, inline navigation links are hidden and replaced by a Sheet-based mobile menu.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-1">Sidebar behaviour</h4>
              <p>The dark navy sidebar auto-collapses to a Sheet/drawer below <code>md:</code>. On desktop it stays pinned to the left of the content area.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-1">Touch targets</h4>
              <p>Default button height is 40px (<code>h-10</code>) with <code>h-12</code> for the large variant. Pill buttons keep the same size across breakpoints.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-1">Motion</h4>
              <p>A global <code>prefers-reduced-motion</code> override in <code>index.css</code> disables animations for accessibility — applies on all viewports.</p>
            </div>
          </div>

          <div className="bg-secondary/10 border border-secondary/30 rounded-md p-4 text-sm">
            <strong className="text-foreground">Not yet standardized.</strong>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
              <li>No fluid <code>clamp()</code> typography utilities — scaling is done with discrete breakpoint classes</li>
              <li>No container queries</li>
              <li>No formal "mobile-first vs desktop-first" rule (codebase follows Tailwind's mobile-first convention by default)</li>
              <li>No max-width tokens beyond ad-hoc <code>max-w-7xl</code> / <code>max-w-4xl</code> / <code>max-w-2xl</code></li>
            </ul>
          </div>
        </Section>

        {/* 18 Usage */}
        <Section
          eyebrow="18 · Usage"
          title="When to use what"
          lede="Simple rules that govern most surface-level decisions."
        >
          <h3 className="text-base font-bold text-foreground mb-2">Mesh as brand moment</h3>
          <p className="text-sm text-muted-foreground mb-6">The mesh gradient signals <em>brand moments</em> — places where the platform's identity should be felt clearly. Most operational surfaces (dashboards, tables, forms) use the warm off-white background instead, keeping the brand signature reserved for surfaces where it earns its place.</p>

          <h3 className="text-base font-bold text-foreground mb-3">Color usage by surface</h3>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Surface</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Treatment</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Primary token</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Public hero, signup, onboarding", "Animated mesh", ".mesh-gradient"],
                  ["Course card covers", "Static mesh", ".mesh-gradient-static-alt"],
                  ["Internal admin sidebar", "Always dark navy fill", "--sidebar-background"],
                  ["Primary actions", "Deep Navy pill button", "--primary"],
                  ["Focus rings, draft and subscription badges", "Warm Gold (attention-only)", "--gold / --ring"],
                  ["Headline emphasis", "Gold marker underline", ".text-highlight"],
                  ["Body text", "Levoro Black on warm off-white", "--foreground on --background"],
                ].map(([surface, treatment, token]) => (
                  <tr key={surface}>
                    <td className="px-4 py-3 text-foreground">{surface}</td>
                    <td className="px-4 py-3 text-muted-foreground">{treatment}</td>
                    <td className="px-4 py-3"><code className="text-xs font-mono text-foreground">{token}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </PageLayout>
  );
};

export default DesignSystem;
