import { AdminEditableImage } from "@/components/AdminEditableImage";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Layers, FileText, Headphones, Sparkles, CheckCircle2, MousePointerClick } from "lucide-react";

export default function PracticalGuideArticle() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto">

      {/* Section 1 — Quick start */}
      <section className="grid md:grid-cols-2 gap-8 items-stretch">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">A quick-start, made for Levoro</h2>
          <p className="text-muted-foreground leading-relaxed">
            Creating a course on Levoro is meant to feel calm and structured, not technical or overwhelming.
            This guide walks you through the essentials so you can move from idea to a published, learner-ready
            course without second-guessing every step.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            You don't need to be a designer or a developer. The Levoro course builder handles the structure
            so you can focus on the content and the learning experience.
          </p>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium text-primary mb-1">Before you start</p>
            <p className="text-sm text-muted-foreground">
              Have your title, a short description, a thumbnail image, and a rough outline of modules
              and lessons ready. Everything else can be added or refined as you go.
            </p>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden min-h-[240px] h-full bg-muted">
          <AdminEditableImage
            imageKey="kb-practical-s1"
            alt="Practical guide to creating courses on Levoro"
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            fallback={
              <div className="w-full h-full bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-primary/40" />
              </div>
            }
          />
        </div>
      </section>

      {/* Section 2 — Core elements */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">The core elements of a Levoro course</h2>
          <p className="text-muted-foreground leading-relaxed">
            Every Levoro course is built from a small, predictable set of pieces. Once you understand them,
            the rest is just arrangement.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              icon: BookOpen,
              title: "Course",
              desc: "The top-level container. Holds the title, description, thumbnail, price/access type, and SEO metadata.",
            },
            {
              icon: Layers,
              title: "Modules",
              desc: "Logical groupings of lessons. Use them to break a long course into clear sections (e.g. 'Getting started', 'Practice', 'Going deeper').",
            },
            {
              icon: FileText,
              title: "Lessons",
              desc: "Where the actual learning lives. Each lesson is built from content blocks: text, images, video, audio, files, and interactive exercises.",
            },
            {
              icon: Sparkles,
              title: "Interactive blocks",
              desc: "Quizzes, reflections, drag-and-drop, hotspots, branching scenarios, SQL practice, and more — added inline as part of a lesson.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — Step-by-step accordion */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Three steps from blank canvas to live course</h2>
          <p className="text-muted-foreground leading-relaxed">
            Open each step to see what happens at that stage and what to keep an eye on.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          <AccordionItem value="step-1" className="rounded-xl border bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">1</span>
                <span className="font-semibold">Add your materials</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3 pt-2">
              <p>
                In the course builder, start by creating your course shell: title, short description, thumbnail (use the
                built-in 16:9 cropper), and access type (subscription, free, or paid).
              </p>
              <p>Then add modules and start filling lessons with content blocks. Each lesson supports:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Rich text (headings, paragraphs, lists, quotes, links, embedded images)</li>
                <li>Video and audio (uploaded to your secure media library)</li>
                <li>Downloadable files (PDFs, worksheets, slides)</li>
                <li>Interactive exercise blocks</li>
              </ul>
              <p className="text-sm italic">
                Tip: aim for at least ~1,500 characters of text per lesson — the editor will gently flag lessons that
                feel too thin.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-2" className="rounded-xl border bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">2</span>
                <span className="font-semibold">Test &amp; review</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3 pt-2">
              <p>
                Use the <span className="font-medium text-foreground">Preview</span> button to walk through the course
                exactly as a learner would. Check:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Module and lesson order makes sense</li>
                <li>Videos and audio play correctly and are clearly audible</li>
                <li>Exercises behave as expected and feedback is helpful</li>
                <li>Text is free of typos and reads at a calm, natural pace</li>
              </ul>
              <p>
                When you're ready, save your draft and click{" "}
                <span className="font-medium text-foreground">Submit for Review</span>. An admin will check the course
                against quality standards before it goes live.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="step-3" className="rounded-xl border bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">3</span>
                <span className="font-semibold">Make it interactive</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3 pt-2">
              <p>
                A great Levoro course isn't just read or watched — it's done. Use interactive blocks to give learners
                regular moments to pause, reflect, or apply.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Multiple Choice and True/False for light recall</li>
                <li>Open Reflection prompts for journaling-style moments</li>
                <li>Drag &amp; Drop, Matching, Ordering for active organization</li>
                <li>Hotspots and Image Sliders for visual exploration</li>
                <li>Branching Scenarios for decision-based practice</li>
                <li>SQL Practice for hands-on technical learning</li>
              </ul>
              <p className="text-sm italic">
                Aim for at least one interactive moment per lesson — it dramatically improves retention.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Section 4 — Pro tip */}
      <section>
        <div className="rounded-xl border-2 border-accent/30 bg-accent/5 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-accent-foreground" />
            <h3 className="text-lg font-bold">Pro tip: build in small drafts</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            You don't have to build a course in one sitting. The editor auto-saves drafts locally and to the
            database, so you can step away and come back anytime. Create a rough skeleton first (modules + empty
            lessons), then fill the lessons in waves. It's faster, calmer, and produces better courses.
          </p>
          <div className="flex items-start gap-2 text-sm text-muted-foreground pt-2">
            <MousePointerClick className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <p>
              For more on lesson-level craft (length, flow, reflection), see the{" "}
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("kb:navigate", {
                      detail: { articleId: "099e619d-bf17-4fd2-95d2-0fed97b5b737" },
                    })
                  )
                }
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Microlearning and Adult Learning Principles
              </button>{" "}
              article.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5 — Audio note */}
      <section className="rounded-xl border bg-card p-6 flex items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
          <Headphones className="h-5 w-5 text-secondary-foreground" />
        </div>
        <div className="space-y-2">
          <p className="font-semibold">Need help with the details?</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For platform-specific questions (uploading media, setting prices, scheduling publication, certificates),
            check the in-builder tooltips and the rest of the Knowledge Base. For visual and audio quality
            standards, see the <span className="font-medium text-foreground">Levoro Quality Standards</span> article.
          </p>
        </div>
      </section>
    </div>
  );
}
