import { AdminEditableImage } from "@/components/AdminEditableImage";
import { Video, Mic, Palette, Accessibility, Check, X } from "lucide-react";

const BRAND_COLORS = [
  { name: "Navy (Primary)", hsl: "213 52% 25%", className: "bg-primary" },
  { name: "Navy Dark", hsl: "213 52% 17%", className: "bg-[hsl(var(--navy-dark))]" },
  { name: "Gold (Accent)", hsl: "43 66% 52%", className: "bg-accent" },
  { name: "Gold Light", hsl: "35 84% 87%", className: "bg-[hsl(var(--gold-light))]" },
  { name: "Background", hsl: "40 14% 98%", className: "bg-background border" },
  { name: "Muted", hsl: "40 10% 94%", className: "bg-muted border" },
];

export default function QualityStandardsArticle() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto">

      {/* Intro */}
      <section className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          Levoro courses share a calm, consistent feel. Following these quality standards keeps your course
          aligned with the platform's voice and visual language — and gives learners a smoother, more focused
          experience.
        </p>
      </section>

      {/* Section 1 — Video & Audio */}
      <section className="rounded-2xl bg-gradient-to-br from-primary to-[hsl(var(--navy-dark))] text-primary-foreground p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
            <Video className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Video &amp; Audio Quality</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-semibold">
              <Video className="h-4 w-4" /> Video
            </div>
            <ul className="space-y-2 text-sm text-primary-foreground/85">
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-0.5 text-secondary" /> Minimum 1080p resolution (HD)</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-0.5 text-secondary" /> Stable framing — tripod or steady mount, no shaky handheld</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-0.5 text-secondary" /> Even, soft lighting on the speaker — avoid harsh shadows and backlighting</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-0.5 text-secondary" /> Calm, uncluttered background</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-0.5 text-secondary" /> Keep clips short — ideally 2–4 minutes per lesson</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 font-semibold">
              <Mic className="h-4 w-4" /> Audio
            </div>
            <ul className="space-y-2 text-sm text-primary-foreground/85">
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-0.5 text-secondary" /> Use an external microphone whenever possible</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-0.5 text-secondary" /> Record in a quiet space — minimize echo and background noise</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-0.5 text-secondary" /> Speak at a calm, measured pace</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-0.5 text-secondary" /> Normalize audio levels so volume stays consistent across lessons</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-0.5 text-secondary" /> Export as MP3 or AAC for audio-only, MP4 (H.264) for video</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2 — Design & Slides */}
      <section className="grid md:grid-cols-2 gap-8 items-stretch">
        <div className="rounded-xl overflow-hidden min-h-[240px] h-full bg-muted order-last md:order-first">
          <AdminEditableImage
            imageKey="kb-quality-s1"
            alt="Design and slides guidelines"
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            fallback={
              <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/15 flex items-center justify-center">
                <Palette className="h-16 w-16 text-primary/40" />
              </div>
            }
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Design &amp; Slides Guidelines</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Slides and on-screen visuals should feel as calm and intentional as the rest of the platform.
            Less is almost always more.
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-1 text-primary" /> One key idea per slide</li>
            <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-1 text-primary" /> Generous white space — don't fill every corner</li>
            <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-1 text-primary" /> Consistent typography and alignment across slides</li>
            <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-1 text-primary" /> Use Levoro's brand colors (see palette below) instead of bright random ones</li>
            <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-1 text-primary" /> 16:9 aspect ratio for full-screen visuals</li>
            <li className="flex gap-2"><X className="h-4 w-4 shrink-0 mt-1 text-destructive" /> Avoid cluttered stock images, hard gradients, or animated GIFs</li>
          </ul>
        </div>
      </section>

      {/* Section 3 — Color & Font */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Levoro Color &amp; Font Guidelines</h2>
        <p className="text-muted-foreground leading-relaxed">
          When you create slides, downloadable PDFs, or thumbnails, please follow Levoro's brand palette and
          typography. It keeps everything visually consistent and professional.
        </p>

        {/* Fonts */}
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <p className="font-semibold">Typography — Neulis Sans</p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Headings — Semi Bold</p>
              <p className="font-heading font-bold text-3xl leading-tight">Aa Bb Cc</p>
              <p className="font-heading font-bold text-lg">The quick brown fox</p>
              <p className="text-xs text-muted-foreground">Use for course titles, section headings, and emphasis.</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Body — Regular</p>
              <p className="font-body text-3xl leading-tight">Aa Bb Cc</p>
              <p className="font-body text-base">The quick brown fox jumps over the lazy dog.</p>
              <p className="text-xs text-muted-foreground">Use for paragraphs, lesson text, and captions.</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground border-t pt-4">
            If Neulis Sans isn't available in your slide tool, fall back to <span className="font-medium">Inter</span>{" "}
            (body) or <span className="font-medium">Space Grotesk</span> (headings).
          </p>
        </div>

        {/* Colors */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <p className="font-semibold">Brand Color Palette</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {BRAND_COLORS.map((c) => (
              <div key={c.name} className="space-y-2">
                <div className={`${c.className} rounded-lg h-20 w-full`} aria-label={c.name} />
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">hsl({c.hsl})</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground pt-2 border-t">
            Use <span className="font-medium">Navy</span> as your dominant color, <span className="font-medium">Gold</span>{" "}
            sparingly for accents and highlights, and the warm neutrals for backgrounds and surfaces.
          </p>
        </div>
      </section>

      {/* Section 4 — Accessibility */}
      <section className="grid md:grid-cols-2 gap-8 items-stretch">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Accessibility className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Accessibility &amp; Inclusiveness</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            A Levoro course should be welcoming to as many learners as possible. A few small habits go a long way.
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-1 text-primary" /> Add captions or transcripts to videos when possible</li>
            <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-1 text-primary" /> Write descriptive alt text for every image</li>
            <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-1 text-primary" /> Keep text contrast strong — dark text on light backgrounds (or vice versa)</li>
            <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-1 text-primary" /> Use plain, inclusive language — avoid idioms that don't translate well</li>
            <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-1 text-primary" /> Don't rely on color alone to convey meaning</li>
            <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-1 text-primary" /> Address learners respectfully and assume a wide range of backgrounds</li>
          </ul>
          <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
            Accessibility isn't an extra step — it's part of teaching well.
          </blockquote>
        </div>
        <div className="rounded-xl overflow-hidden min-h-[240px] h-full bg-muted">
          <AdminEditableImage
            imageKey="kb-quality-s4"
            alt="Accessibility and inclusiveness in Levoro courses"
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            fallback={
              <div className="w-full h-full bg-gradient-to-br from-secondary/15 to-primary/15 flex items-center justify-center">
                <Accessibility className="h-16 w-16 text-primary/40" />
              </div>
            }
          />
        </div>
      </section>
    </div>
  );
}
