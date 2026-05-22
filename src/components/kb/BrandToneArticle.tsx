import { AdminEditableImage } from "@/components/AdminEditableImage";
import { Check, X, Quote, Target, BookOpen, GraduationCap, MessageCircle, Sprout } from "lucide-react";

export default function BrandToneArticle() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto">

      {/* Section 1 – Tone Overview */}
      <section className="space-y-6">
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          <div className="space-y-4">
            <p className="text-base leading-relaxed">
              Levoro's tone is <strong>friendly, clear and calm</strong>.
            </p>
            <p className="text-base leading-relaxed">
              Levoro speaks like a wise friend, grounded, respectful, and honest.
            </p>
            <p className="text-base leading-relaxed">
              We're never shouting, never pressuring, never pretending life is perfect.
            </p>

            <div className="space-y-2 pt-2">
              <p className="font-semibold">We write and speak with:</p>
              <ul className="space-y-2">
                {[
                  ["Calm energy", "not hype"],
                  ["Clarity", "not jargon"],
                  ["Confidence", "without ego"],
                  ["Encouragement", "without hustle"],
                ].map(([bold, rest]) => (
                  <li key={bold} className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <span><strong>{bold}</strong> ({rest})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <AdminEditableImage
            imageKey="kb-brand-tone-s1"
            alt="Levoro brand tone"
            className="w-full h-full rounded-xl object-cover"
            containerClassName="w-full h-full min-h-[200px]"
            fallback={
              <div className="w-full h-full min-h-[200px] rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <span className="text-4xl">🌿</span>
              </div>
            }
          />
        </div>

        <div className="space-y-4">
          <p className="text-base leading-relaxed">
            We believe learning should feel spacious, not stressful, especially for adult learners juggling full lives.
          </p>
          <p className="text-base leading-relaxed">
            Levoro doesn't chase "massive success now!" energy.
          </p>
          <p className="text-base leading-relaxed">
            Instead, we guide learners through small, grounded shifts that build confidence and clarity.
          </p>
          <p className="text-base leading-relaxed">
            We don't believe in toxic productivity.
          </p>
          <p className="text-base leading-relaxed font-semibold">
            We believe in intentional progress, one focused step at a time.
          </p>
        </div>
      </section>

      {/* Section 2 – How to Write & Teach */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">How to Write & Teach in Levoro's Voice</h2>

        <p className="text-base">Think of your tone as:</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { Icon: Target, label: "Clear", desc: "like a good coach" },
            { Icon: BookOpen, label: "Calm", desc: "like a guided journal" },
            { Icon: GraduationCap, label: "Competent", desc: "like a trusted mentor" },
            { Icon: MessageCircle, label: "Friendly", desc: "like a thoughtful peer" },
          ].map(({ Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-4">
          <p className="font-semibold">Use language that is:</p>
          <ul className="space-y-1.5 pl-1">
            {[
              "Conversational, but respectful",
              "Simple, but not simplistic",
              "Motivating, but never forceful",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Good vs Bad examples */}
        <div className="space-y-3 pt-4">
          <p className="font-semibold">Examples:</p>
          <div className="space-y-3">
            {[
              [
                "Let's make it easier to focus.",
                "Become ultra productive now!",
              ],
              [
                "This tool helps you reflect and take action, gently.",
                "No excuses, take action now!",
              ],
            ].map(([good, bad], i) => (
              <div key={i} className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2 p-4 rounded-lg border border-success/30 bg-success/10">
                  <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <p className="text-sm italic">"{good}"</p>
                </div>
                <div className="flex items-start gap-2 p-4 rounded-lg border border-border bg-muted">
                  <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm italic">"{bad}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 – Do's and Don'ts */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Do's and Don'ts</h2>
        <div className="space-y-3">
          {[
            ["Use clear, simple, adult-centered language", "Don't use urgency or fear tactics (\"act now or miss out!\")"],
            ["Focus on clarity, rhythm, and intention", "Don't overwhelm with complex phrasing"],
            ["Encourage reflection (e.g., \"Take a moment to notice…\")", "Don't speak like a \"guru\" or sound preachy"],
            ["Offer practical takeaways that feel manageable", "Don't add fluff, hype, or fake positivity"],
            ["Normalize progress over perfection", "Don't promise fast transformation with no effort"],
            ["Acknowledge real-life constraints with empathy", null],
          ].map(([doItem, dontItem], i) => (
            <div key={i} className="grid sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-4 rounded-lg border border-success/30 bg-success/10">
                <Check className="h-5 w-5 text-success shrink-0" />
                <p className="text-sm">{doItem}</p>
              </div>
              {dontItem ? (
                <div className="flex items-center gap-2 p-4 rounded-lg border border-border bg-muted">
                  <X className="h-5 w-5 text-muted-foreground shrink-0" />
                  <p className="text-sm">{dontItem}</p>
                </div>
              ) : (
                <div />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Section 4 – Closing */}
      <section className="space-y-4">
        <div className="grid md:grid-cols-4 gap-8 items-center">
          <div className="md:col-span-1 flex justify-center">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sprout className="h-10 w-10 text-primary" />
            </div>
          </div>
          <div className="md:col-span-3 space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Let your learners feel safe to grow</h2>
            <p className="text-base leading-relaxed">
              Remember that at Levoro, we don't talk <em>at</em> people. We walk <em>with</em> them — one clear, thoughtful, doable step at a time.
            </p>
            <p className="text-base leading-relaxed">
              Let your words breathe. Let your tone hold space.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5 – Cheat Phrases */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Here are some cheat phrases you can use:</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            "What if learning didn't feel like pressure, but like clarity?",
            "You don't need to do more; you just need to feel more grounded.",
            "Progress is still progress even if it's gentle.",
            "Learning that fits your life, not the other way around.",
            "This isn't about big leaps. It's about small shifts that build over time.",
          ].map((phrase) => (
            <div key={phrase} className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Quote className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm italic leading-relaxed">"{phrase}"</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
