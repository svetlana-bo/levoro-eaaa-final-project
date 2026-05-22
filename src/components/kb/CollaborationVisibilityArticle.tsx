import { AdminEditableImage } from "@/components/AdminEditableImage";
import { MessageCircle, Video, PlayCircle, Flame, Sparkles, UserCheck } from "lucide-react";

const OPPORTUNITIES = [
  {
    icon: MessageCircle,
    title: "\"Ask Me Anything\" Sessions",
    desc: "Open, conversational sessions where learners can bring real questions to you. A great way to build trust, hear what your audience is wrestling with, and share insights in a relaxed format.",
  },
  {
    icon: Video,
    title: "Quarterly Live Sessions",
    desc: "Once per quarter, Levoro hosts a live event spotlighting selected instructors and topics. It's a chance to deepen the connection with your learners and reach new ones at the same time.",
  },
  {
    icon: PlayCircle,
    title: "On-Demand Mini-Masterclasses",
    desc: "Short, focused masterclasses (15–30 minutes) that complement your main course. They live on the platform, work as evergreen content, and help your work stay visible long after launch.",
  },
  {
    icon: Flame,
    title: "Fireside Chats with Experts",
    desc: "Twice a year, we organize informal fireside chats pairing instructors with respected voices in their field. Calm, candid conversations that resonate well with our community.",
  },
];

export default function CollaborationVisibilityArticle() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto">

      {/* Intro */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">You're never on your own</h2>
        <p className="text-muted-foreground leading-relaxed">
          Teaching on Levoro isn't a transactional relationship. From the moment you join, you have a
          dedicated point of contact at Levoro who knows your work, your audience, and your goals — and
          who will help you get the most out of the platform.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Beyond your courses themselves, we offer several visibility opportunities to amplify your work
          and bring it to more of the right learners.
        </p>
      </section>

      {/* Image + opportunities */}
      <section className="grid md:grid-cols-5 gap-8 items-stretch">
        <div className="md:col-span-2 rounded-xl overflow-hidden min-h-[280px] h-full bg-muted">
          <AdminEditableImage
            imageKey="kb-collab-s1"
            alt="Collaboration and visibility opportunities at Levoro"
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            fallback={
              <div className="w-full h-full bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
                <Sparkles className="h-16 w-16 text-primary/40" />
              </div>
            }
          />
        </div>
        <div className="md:col-span-3 space-y-4">
          {OPPORTUNITIES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Optional participation note */}
      <section className="rounded-xl border bg-card p-6 space-y-2">
        <p className="font-semibold">Always optional, never pressured</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          All visibility opportunities are entirely optional. If you'd rather focus on your core courses,
          that's completely fine. If you'd like to participate in some but not others, that's fine too.
          We'll only ever invite — never push.
        </p>
      </section>

      {/* Marketing co-creation closing */}
      <section className="rounded-2xl border-2 border-accent/30 bg-accent/5 p-6 flex items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
          <UserCheck className="h-5 w-5 text-accent-foreground" />
        </div>
        <div className="space-y-2">
          <p className="font-semibold">Co-create with our marketing team</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Whenever you participate in one of these opportunities, our marketing team works alongside you
            to plan, promote, and present it well — co-branded materials, scheduling, audience targeting,
            and post-event follow-ups. You bring the expertise; we handle the heavy lifting around it.
          </p>
        </div>
      </section>
    </div>
  );
}
