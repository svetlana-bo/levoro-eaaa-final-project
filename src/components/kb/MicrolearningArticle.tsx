import { AdminEditableImage } from "@/components/AdminEditableImage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function MicrolearningArticle() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto">

      {/* Section 1 — Intro */}
      <section className="grid md:grid-cols-2 gap-8 items-stretch">
        <div className="rounded-xl overflow-hidden min-h-[200px] h-full bg-muted">
          <AdminEditableImage
            imageKey="kb-microlearning-s1"
            alt="Microlearning illustration"
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            fallback={<div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-muted-foreground text-base">Section image</div>}
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">What is Microlearning and Why We Use It at Levoro</h2>
          <p className="text-muted-foreground leading-relaxed">
            At Levoro, we don't believe in overwhelming learners with 60-minute monologues or info dumps. Instead, we design for microlearning — short, focused learning units that fit into real life.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            But let's be clear: Microlearning is not just "shorter" learning. It's smarter, more intentional learning. So what's the difference between microlearning and a learning bite?
          </p>
        </div>
      </section>

      {/* Table 1 — Microlearning vs Learning Bite */}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Term</TableHead>
              <TableHead className="font-semibold">Meaning</TableHead>
              <TableHead className="font-semibold">Use at Levoro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Microlearning</TableCell>
              <TableCell>A short, focused lesson designed around one clear outcome, typically 1–2 key ideas, structured with intro, content, and takeaway.</TableCell>
              <TableCell>Used as the building blocks of every Levoro course or module.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Learning Bite</TableCell>
              <TableCell>A very quick standalone insight, often a quote, prompt, or mini-example that takes &lt;30 sec to consume.</TableCell>
              <TableCell>Used as bonus inspiration, nudges or recap points. Often on the learner dashboard.</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Section 2 — Guidelines */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Microlearning Format Guidelines (Levoro-style)</h2>
        <p className="text-muted-foreground leading-relaxed">
          To keep learning light, focused, and easy to absorb, follow these guidelines:
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Length</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li><span className="font-medium">2–4 minute video or audio segments</span> — Just enough to deliver one or two clear ideas without overwhelming the learner.</li>
              <li><span className="font-medium">Text-based lessons</span> — Should fit within 1–2 desktop scrolls — aim for concise, readable content that feels manageable.</li>
              <li><span className="font-medium">Avoid going over 5 minutes</span> — Unless the content truly requires a deeper dive (e.g., advanced or complex modules).</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Content Focus</h3>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Up to 2 key ideas per lesson</li>
              <li>Include one small action, tool, or reflection prompt</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Flow</h3>
            <p className="text-muted-foreground">Why this matters → Key idea/tool → Example → Action or reflection</p>
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          Remember: Adult learners don't want more information. They want meaningful progress that they can feel in just a few minutes.
        </p>
        <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
          "Teach like you're giving them a mental breath of fresh air, not another thing to process."
        </blockquote>
      </section>

      {/* Section 3 — Principles */}
      <section className="grid md:grid-cols-2 gap-8 items-stretch">
        <div className="rounded-xl overflow-hidden min-h-[240px] h-full bg-muted">
          <AdminEditableImage
            imageKey="kb-microlearning-s3"
            alt="Adult learning principles"
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            fallback={<div className="w-full h-full bg-gradient-to-br from-secondary/10 to-primary/10 flex items-center justify-center text-muted-foreground text-base">Section image</div>}
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">The 5 Principles of Adult Learning (Malcolm Knowles)</h2>
          <p className="text-muted-foreground leading-relaxed">
            Let's demystify andragogy: it's just about how adults learn best.
          </p>
          <p className="text-muted-foreground leading-relaxed">Here's what to keep in mind when designing your course:</p>
          <div className="space-y-4">
            {[
              {
                label: "Adults are self-directed",
                arrow: "Give them choices, not hand-holding.",
                tip: "Use phrases like \"Pick the one that fits you best\" or \"Pause here and reflect\".",
              },
              {
                label: "They bring life experience",
                arrow: "Don't assume they're starting from zero.",
                tip: "Offer prompts like \"Think back to a time when…\" to connect theory to real life.",
              },
              {
                label: "They learn when it's practical (and applicable)",
                arrow: "If it's not useful, they'll tune out.",
                tip: "Always show how something is relevant (\"Use this technique next time you…\").",
              },
              {
                label: "They need to see the why",
                arrow: "Start with purpose before diving into content.",
                tip: "Open each lesson with: \"Here's why this matters for your work/life.\"",
              },
              {
                label: "They learn best when respected",
                arrow: "Talk with them, not at them.",
                tip: "Use a calm, conversational tone that honors their time and energy.",
              },
            ].map((p) => (
              <div key={p.label}>
                <span className="font-semibold">{p.label}</span>
                <p className="text-sm text-muted-foreground">→ {p.arrow}</p>
                <p className="text-sm text-muted-foreground italic">{p.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — Course Structure */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">How to Structure a Course for Adult Learners (Levoro-style)</h2>

        {/* Step 1 */}
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h3 className="text-lg font-bold">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold mr-2">1</span>
            Start with meaning, not just content
          </h3>
          <p className="text-muted-foreground">Help the learner understand why this matters.</p>
          <p className="text-muted-foreground">Use a question or a real-life scenario: "Ever felt like ___?" or "What would change if you could ___?"</p>
          <p className="text-muted-foreground">This makes the learning feel personal from the start.</p>
        </div>

        {/* Step 2 */}
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h3 className="text-lg font-bold">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold mr-2">2</span>
            One theme per lesson, not a content dump
          </h3>
          <p className="text-muted-foreground">Each lesson should center around one focused idea, whether that's a concept, a mindset shift, a framework, or a practical tool.</p>
          <p className="text-muted-foreground">You can include a few related insights, as long as they support the same learning goal. Keep it short, relevant, and easy to apply.</p>
          <div className="rounded-lg bg-primary/5 p-4 space-y-2">
            <p className="text-sm font-medium">Pro tip:</p>
            <p className="text-sm text-muted-foreground">Text-based lessons should typically stay within ~3000 characters (or slightly more/less depending on the depth), ideally fitting into 1–2 desktop scrolls.</p>
            <p className="text-sm text-muted-foreground">This helps learners stay engaged, avoid overwhelm, and return to the material easily when needed.</p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h3 className="text-lg font-bold">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold mr-2">3</span>
            Weave in reflection prompts inside your lesson
          </h3>
          <p className="text-muted-foreground">Adult learners don't just want information; they want to make sense of it.</p>
          <p className="text-muted-foreground">That's where coaching-style reflection prompts come in.</p>
          <p className="text-muted-foreground">Add 1–2 simple guiding questions directly into the lesson flow to invite a mental pause and meaning-making:</p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 italic">
            <li>"When was the last time this came up for you?"</li>
            <li>"What's getting in the way of applying this?"</li>
            <li>"What's one thing you could try differently?"</li>
          </ul>
          <p className="text-muted-foreground text-base">These are light nudges, not heavy journaling moments — just enough to trigger self-awareness and deeper learning.</p>
        </div>

        {/* Step 4 */}
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h3 className="text-lg font-bold">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold mr-2">4</span>
            Use interactive reflection &amp; knowledge check-ins between lessons
          </h3>
          <p className="text-muted-foreground">Learning doesn't stick by just reading or scrolling; it sticks through processing.</p>
          <p className="text-muted-foreground">That's why after each lesson, you have the option to add a separate interactive block, which allows learners to pause, reflect, or apply.</p>
          <p className="text-muted-foreground">After each lesson, you can either:</p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            <li>Test knowledge lightly to strengthen recall</li>
            <li>Or better yet, create a moment of reflection to help learners connect the dots</li>
          </ul>
          <div className="rounded-lg bg-primary/5 p-4">
            <p className="text-sm font-medium">Fact: Research indicates that incorporating short reflections can increase retention by up to 23%.</p>
          </div>
          <p className="text-muted-foreground italic text-sm">It's not about passing a quiz. It's about turning insight into action.</p>
          <p className="text-muted-foreground font-medium">What could you add?</p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>True/False or Multiple Choice to recap essentials</li>
            <li>Open-ended reflection to help learners link content to their experience</li>
            <li>Matching or ordering tasks to structure ideas and organize understanding</li>
            <li>Image-based prompts for more emotional or visual learners</li>
            <li>Fill-in-the-blank to anchor core terms or steps</li>
          </ul>
          <p className="text-muted-foreground text-base italic">Use it to create awareness, not pressure. Think of these as mini-moments of meaning, not exams.</p>
        </div>

        {/* Step 5 */}
        <div className="rounded-xl border bg-card p-6 space-y-3">
          <h3 className="text-lg font-bold">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold mr-2">5</span>
            Wrap with clarity, not clutter
          </h3>
          <p className="text-muted-foreground">Close the lesson with a simple recap or "If you remember one thing…" moment.</p>
          <p className="text-muted-foreground">Then offer a light next step, such as:</p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 italic">
            <li>"Try this technique once this week."</li>
            <li>"Observe your reaction in ___ situation"</li>
            <li>"Share this insight with someone else."</li>
          </ul>
        </div>

        {/* Bonus tips */}
        <div className="rounded-xl border-2 border-accent/30 bg-accent/5 p-6 space-y-3">
          <h3 className="text-lg font-bold">Bonus tips for adult-first course design:</h3>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2">
            <li><span className="font-medium">Skip the fluff</span> – no need for "Welcome to this lesson" if it adds no value.</li>
            <li><span className="font-medium">Respect time</span> – adults often multitask; keep your content scannable and actionable.</li>
            <li><span className="font-medium">Space matters</span> – don't overload a single screen. Let ideas breathe.</li>
            <li><span className="font-medium">Don't force completion</span> – some people will drop in and out. That's okay.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            Levoro learners are bright, busy, and deeply human. Let's meet them with respect, simplicity, and real-world learning they can feel.
          </p>
        </div>
      </section>

      {/* Section 5 — Reflection */}
      <section className="grid md:grid-cols-2 gap-8 items-stretch">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">How to Use Reflection and Application</h2>
          <p className="text-muted-foreground leading-relaxed">
            Reflection opens the door, but application brings it to life.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Adult learners don't just want to "know" something. They want to try it, feel it, and see what shifts.
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2">
            <li>Short "pause and reflect" journaling prompts (e.g., "How might this look in your day-to-day?")</li>
            <li>Simple self-check questions ("Where have you seen this pattern before?")</li>
            <li>Real-life mini-scenarios they can relate to</li>
            <li>Tiny actions or experiments they can try this week</li>
            <li>Downloadable templates, planners, or checklists for practical use</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            You're not just giving information — you're guiding transformation, one step at a time.
          </p>
          <p className="text-muted-foreground leading-relaxed">Let it feel supportive, not overwhelming.</p>
          <p className="text-muted-foreground leading-relaxed font-medium italic">
            Small prompts. Real impact. That's the Levoro way!
          </p>
        </div>
        <div className="rounded-xl overflow-hidden min-h-[200px] h-full bg-muted">
          <AdminEditableImage
            imageKey="kb-microlearning-s5"
            alt="Reflection and application"
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            fallback={<div className="w-full h-full bg-gradient-to-br from-accent/10 to-secondary/10 flex items-center justify-center text-muted-foreground text-base">Section image</div>}
          />
        </div>
      </section>

      {/* Section 6 — Learning Styles Table */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Different Learning Styles: Keep It Blended</h2>
        <p className="text-muted-foreground leading-relaxed">
          We all process info differently. Good news? You don't need to reinvent the wheel — mix it up:
        </p>
        <p className="text-muted-foreground leading-relaxed text-sm italic">
          Every lesson doesn't need to include all styles, but aim to support at least 2–3 consistently.
        </p>
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Style</TableHead>
                <TableHead className="font-semibold">What They Need</TableHead>
                <TableHead className="font-semibold">How You Can Support</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Visual</TableCell>
                <TableCell>Diagrams, mindmaps, layout</TableCell>
                <TableCell>Use slides, flowcharts, metaphors</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Auditory</TableCell>
                <TableCell>Spoken examples, tone &amp; rhythm</TableCell>
                <TableCell>Speak clearly, vary your intonation, use analogies</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Reading/Writing</TableCell>
                <TableCell>Notes, checklists, summaries</TableCell>
                <TableCell>Include transcripts, PDFs, summaries</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Kinesthetic / Practical</TableCell>
                <TableCell>Doing, testing, engaging</TableCell>
                <TableCell>Include quick activities, self-assessments, try-it-now steps</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Section 7 — Final Reminder */}
      <section className="rounded-xl border-2 border-primary/20 bg-primary/5 p-8 space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-center">Final Reminder</h2>
        <p className="text-muted-foreground leading-relaxed text-left">
          Adult learners are not blank slates.<br />
          They're brilliant, busy people looking for clarity, not clutter. Your job?
        </p>
        <ul className="list-none text-center text-muted-foreground space-y-1 text-base">
          <li className="text-left">Respect their time</li>
          <li className="text-left">Honor their pace</li>
          <li className="text-left">Teach with calm confidence</li>
          <li className="text-left">Offer depth, not pressure</li>
        </ul>
        <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
          "Design each lesson like it's a conversation — not a performance."
        </blockquote>
        <p className="text-muted-foreground leading-relaxed text-center font-medium">
          That's where the magic happens.
        </p>
      </section>
    </div>
  );
}
