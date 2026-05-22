import { AdminEditableImage } from "@/components/AdminEditableImage";

export default function LevoroStoryArticle() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto">

      {/* Section 1 — Why Levoro exists? */}
      <section className="grid md:grid-cols-2 gap-8 items-stretch">
        <div className="space-y-4 text-left">
          <h2 className="text-2xl font-bold tracking-tight">Why Levoro exists?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Levoro was born from a quiet but powerful question: What if adult learning could feel calm, clear, and deeply human?
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We've all experienced learning environments that are rushed, overwhelming, or disconnected from real life. At Levoro, we aim to create a unique space where people can learn with intention, not pressure.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Where growth is meaningful, not performative. Learning, for us, isn't about "more." It's about becoming more of who you already are.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            And that starts with how learning is designed, taught, and supported.
          </p>
        </div>
        <div className="rounded-xl overflow-hidden min-h-[200px] h-full bg-muted">
          <AdminEditableImage
            imageKey="kb-story-s1"
            alt="Why Levoro exists"
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            fallback={<div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-muted-foreground text-base">Section image</div>}
          />
        </div>
      </section>

      {/* Section 2 — Who we serve? */}
      <section className="grid md:grid-cols-2 gap-8 items-stretch">
        <div className="rounded-xl overflow-hidden min-h-[200px] h-full bg-muted">
          <AdminEditableImage
            imageKey="kb-story-s2"
            alt="Who we serve"
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            fallback={<div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-muted-foreground text-base">Section image</div>}
          />
        </div>
        <div className="space-y-4 text-left">
          <h2 className="text-2xl font-bold tracking-tight">Who we serve?</h2>
          <p className="text-muted-foreground leading-relaxed">
            We create learning experiences for conscious adults who are curious, self-aware, and juggling real life.
          </p>
          <p className="text-muted-foreground leading-relaxed font-medium">Our learners include:</p>
          <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc pl-5">
            <li>Career changers who want to transition into new fields</li>
            <li>Working professionals navigating growth, leadership, or burnout</li>
            <li>Lifelong learners who love to grow and explore</li>
            <li>Internal L&D leaders who want quality content</li>
            <li>Corporate teams seeking training that's human and applicable</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            They're not here to collect certificates. They're here to learn practically, purposefully, and sustainably.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            And they're looking for instructors who respect their time, speak their language, and guide them without the noise.
          </p>
        </div>
      </section>

      {/* Section 3 — What we believe in? */}
      <section className="space-y-6 text-left">
        <h2 className="text-2xl font-bold tracking-tight">What we believe in?</h2>
        <p className="text-muted-foreground leading-relaxed">
          We design and teach with a few simple but powerful principles:
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              title: "Calm over chaos",
              text: "Learning should ground you, not overwhelm you. We design for clarity, focus, and flow using microlearning, modular structure, and reflection to create space for growth.",
            },
            {
              title: "Clarity over complexity",
              text: "We remove jargon, not depth. We simplify without watering down, and we aim for communication that makes complex ideas feel accessible, relevant, and empowering.",
            },
            {
              title: "Practicality with purpose",
              text: "Every lesson is designed to be applicable, grounded in real life, and rooted in either research or well-established, fact-checked knowledge. We don't do vague theory or filler content. Instead, we focus on building skills, insights, and action in formats that support attention, energy, and momentum.",
            },
            {
              title: "Learner-centered growth",
              text: "We design learning that respects the learner's context, whether they're switching careers, leading teams, or learning for themselves. We value reflection, autonomy, and engagement, and we create interactive lessons that invite curiosity, not just passive consumption.",
            },
          ].map((card) => (
            <div key={card.title} className="rounded-xl border bg-card p-6 space-y-2">
              <h3 className="font-semibold text-lg">{card.title}</h3>
              <p className="text-muted-foreground text-base leading-relaxed">{card.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
