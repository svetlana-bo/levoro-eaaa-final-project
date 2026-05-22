import { AdminEditableImage } from "@/components/AdminEditableImage";
import { Button } from "@/components/ui/button";
import { Eye, Type, UserCircle2, LifeBuoy, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LetsStartCreatingArticle() {
  const navigate = useNavigate();

  const tips = [
    {
      icon: Eye,
      title: "Check your course preview before publishing",
      body: "Walk through your course as a learner would. Open the preview, read every slide, click every interaction. Small fixes at this stage make a big difference once your course is live.",
    },
    {
      icon: Type,
      title: "Use clear titles and descriptions to attract the right learners",
      body: "Titles and descriptions are how learners find you. Be specific about what they'll learn, who it's for, and what they'll be able to do by the end. Clarity attracts the people who'll get the most value from your work.",
    },
    {
      icon: UserCircle2,
      title: "Keep your profile updated for credibility and trust",
      body: "Your profile is often the first thing a learner sees. A current photo, a thoughtful bio, and a link to your work help build the trust that turns a curious visitor into an engaged learner.",
    },
    {
      icon: LifeBuoy,
      title: "Reach out to your Levoro contact if you hit a roadblock",
      body: "Our Partner & Business Success Specialists are here to support you every step of the way. As certified adult educators, they can help ensure your content resonates with Levoro learners, aligning with their needs, goals, and learning styles. They're also here to guide you through technical questions or connect you with the right resources, so your courses make the most significant possible impact.",
    },
  ];

  return (
    <div className="space-y-12 max-w-4xl mx-auto">

      {/* Intro */}
      <section className="grid md:grid-cols-2 gap-8 items-stretch">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">You're ready — let's begin</h2>
          <p className="text-muted-foreground leading-relaxed">
            You've explored the Levoro story, our brand voice, our pedagogy, and the practical
            guidelines that shape every course on the platform. Now comes the most exciting part:
            building something of your own.
          </p>
          <p className="text-foreground leading-relaxed font-medium">
            Here are a few tips to help you start strong and keep momentum as you create.
          </p>
        </div>
        <div className="rounded-xl overflow-hidden min-h-[240px] h-full bg-muted">
          <AdminEditableImage
            imageKey="kb-start-s1"
            alt="Let's start creating your first Levoro course"
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            fallback={
              <div className="w-full h-full bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
                <Sparkles className="h-16 w-16 text-primary/40" />
              </div>
            }
          />
        </div>
      </section>

      {/* Quick Overview */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Quick overview</h2>

        <div className="space-y-4">
          {tips.map((tip, i) => {
            const Icon = tip.icon;
            return (
              <div
                key={i}
                className="rounded-2xl border bg-card p-6 md:p-7 flex items-center gap-5 w-full"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-lg">
                    <span className="text-primary mr-2">{i + 1}.</span>
                    {tip.title}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tip.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Belief callout */}
      <section className="rounded-2xl p-8 md:p-10 bg-gradient-to-br from-secondary/40 via-accent/20 to-primary/15 border space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          At Levoro, we believe that truly great learning blends authenticity with excellence.
        </h2>
        <p className="text-foreground/80 leading-relaxed">
          Authenticity, because every instructor brings a story, a voice, and a perspective that
          can't be replicated. Excellence, because learners trust us to deliver experiences that
          are clear, well-crafted, and genuinely useful.
        </p>
        <p className="text-foreground/80 leading-relaxed">
          You don't have to choose between the two. The best Levoro courses come from instructors
          who lean into who they are while holding themselves to a high standard of craft.
        </p>
        <p className="text-foreground/80 leading-relaxed">
          So take your time, trust your expertise, and remember: the learner on the other side is
          counting on you to show up as your real, capable self. That's what makes a Levoro course
          unforgettable.
        </p>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4">
        <Button
          size="lg"
          className="gap-2"
          onClick={() => navigate("/instructor?tab=courses")}
        >
          Create your first course <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-sm text-muted-foreground">
          We can't wait to see what you build.
        </p>
      </section>
    </div>
  );
}
