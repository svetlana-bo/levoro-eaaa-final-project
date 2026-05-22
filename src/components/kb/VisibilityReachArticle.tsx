import { AdminEditableImage } from "@/components/AdminEditableImage";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Megaphone, Sparkles, Handshake, TrendingUp } from "lucide-react";

export default function VisibilityReachArticle() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto">

      {/* Intro */}
      <section className="grid md:grid-cols-2 gap-8 items-stretch">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Here's a quick overview</h2>
          <p className="text-muted-foreground leading-relaxed">
            Visibility on Levoro is a two-way effort. We work to put your courses in front of the right
            learners — and you can amplify that reach through your own channels and partnerships.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Below are the three main ways we help your work be seen, plus how we can collaborate
            to grow your audience together.
          </p>
        </div>
        <div className="rounded-xl overflow-hidden min-h-[240px] h-full bg-muted">
          <AdminEditableImage
            imageKey="kb-visibility-s1"
            alt="How to increase visibility and reach learners"
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            fallback={
              <div className="w-full h-full bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
                <TrendingUp className="h-16 w-16 text-primary/40" />
              </div>
            }
          />
        </div>
      </section>

      {/* Accordion */}
      <section className="space-y-6">
        <Accordion type="single" collapsible className="space-y-3">
          <AccordionItem value="promote" className="rounded-xl border bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Megaphone className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold">Promote your courses with Levoro</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3 pt-2">
              <p>
                Your courses will be featured on our platform, highlighted in targeted campaigns, and
                recommended to learners whose interests align with your topics. We tailor promotions so
                your work reaches the right audience at the right time.
              </p>
              <p>
                And remember, you also have the power to make your course visible by promoting it through
                your channels, amplifying its reach and impact even further.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="marketing" className="rounded-xl border bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold">Collaborate with our marketing team</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3 pt-2">
              <p>
                Our marketing team is at your disposal to brainstorm and create co-branded promotional
                materials you can share across your channels, helping you reach more learners, strengthen
                your brand, and amplify the impact of your work.
              </p>
              <p>
                When needed, we can also recommend the most effective strategies to boost your visibility
                and create a lasting impact with your audience.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="referral" className="rounded-xl border bg-card px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Handshake className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold">Leverage referral &amp; partnership opportunities</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed space-y-3 pt-2">
              <p>
                We're open to building affiliate-style partnerships where you can share your unique code
                and receive learner referrals back to you — whether that's directing learners who've
                completed your course to your offers, or featuring your work in our newsletters,
                campaigns, or other channels.
              </p>
              <p>
                Together, we can create referral and co-promotion opportunities that grow your reach and
                strengthen your connection with the learners who need you most.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}
