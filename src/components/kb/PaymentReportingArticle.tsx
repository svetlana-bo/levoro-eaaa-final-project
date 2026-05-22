import { AdminEditableImage } from "@/components/AdminEditableImage";
import { Wallet, Calendar, CheckCircle2, AlertCircle, Gift, UserCheck } from "lucide-react";

export default function PaymentReportingArticle() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto">

      {/* Intro */}
      <section className="grid md:grid-cols-2 gap-8 items-stretch">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">A clear, fair payment system</h2>
          <p className="text-muted-foreground leading-relaxed">
            At Levoro, we believe instructors should always know exactly how and when they get paid.
            No hidden fees, no fine print — just a simple revenue model designed to reward the value
            you bring to learners.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Here's how the payment and reporting system works, step by step.
          </p>
        </div>
        <div className="rounded-xl overflow-hidden min-h-[240px] h-full bg-muted">
          <AdminEditableImage
            imageKey="kb-payment-s1"
            alt="Payment and reporting system overview"
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
            fallback={
              <div className="w-full h-full bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
                <Wallet className="h-16 w-16 text-primary/40" />
              </div>
            }
          />
        </div>
      </section>

      {/* Revenue split */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Revenue split</h2>
        <p className="text-muted-foreground leading-relaxed">
          For every learner who completes your course, the revenue is shared transparently between
          you and Levoro.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
            <p className="text-5xl font-bold text-primary">60%</p>
            <p className="text-sm font-semibold mt-2">Goes to you</p>
            <p className="text-sm text-muted-foreground mt-1">The instructor — for the expertise and care you bring.</p>
          </div>
          <div className="rounded-2xl border bg-card p-6 text-center">
            <p className="text-5xl font-bold text-accent-foreground">40%</p>
            <p className="text-sm font-semibold mt-2">Stays with Levoro</p>
            <p className="text-sm text-muted-foreground mt-1">To cover platform, hosting, marketing, and support.</p>
          </div>
        </div>
      </section>

      {/* How payouts work */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">How payouts work</h2>

        <div className="rounded-xl border bg-card p-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="font-semibold">Monthly payouts on the 15th</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Earnings are calculated each month and paid out on the <span className="font-medium text-foreground">15th of the following month</span>.
              You'll receive a clear breakdown showing which courses generated revenue and how the split
              was applied.
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="font-semibold">The 50% completion rule</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Revenue is recognized when a learner completes <span className="font-medium text-foreground">at least 50% of your course</span>.
              This protects both sides: it ensures payouts reflect real engagement, not just sign-ups, and
              it incentivizes us to design courses learners actually finish.
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div className="space-y-2">
            <p className="font-semibold">The 7-day trial</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              New learners can join with a <span className="font-medium text-foreground">7-day free trial</span>. If they
              cancel before the trial ends, no revenue is generated for that subscription. Once the trial
              converts, the standard 60/40 split applies on every billing cycle they remain active.
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
            <Gift className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="space-y-2">
            <p className="font-semibold">Free courses</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Some courses are offered free as part of Levoro's broader mission — to make quality learning
              accessible. Free courses don't generate per-completion revenue, but they boost your visibility,
              build your reputation, and often lead learners to your paid courses.
            </p>
          </div>
        </div>
      </section>

      {/* Reporting */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Transparent reporting</h2>
        <p className="text-muted-foreground leading-relaxed">
          Inside your instructor dashboard, you'll always have access to clear, real-time analytics:
          enrolments, completion rates, revenue per course, and trends over time. Everything is laid
          out so you can see what's working — and where to focus next.
        </p>
      </section>

      {/* Closing — point of contact */}
      <section className="rounded-2xl border-2 border-accent/30 bg-accent/5 p-6 flex items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
          <UserCheck className="h-5 w-5 text-accent-foreground" />
        </div>
        <div className="space-y-2">
          <p className="font-semibold">A dedicated point of contact</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Questions about payments, reports, or your earnings? You'll always have a real person at
            Levoro to talk to. Reach out anytime — we're here to keep things clear, fair, and on time.
          </p>
        </div>
      </section>
    </div>
  );
}
