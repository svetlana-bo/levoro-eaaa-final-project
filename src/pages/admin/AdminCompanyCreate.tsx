import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { TIER_DESCRIPTIONS } from "@/components/admin/TierPill";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const Schema = z.object({
  name: z.string().trim().min(1, "Required").max(200),
  domain: z.string().trim().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Must look like example.com"),
  primary_contact_email: z.string().trim().email("Invalid email").max(255),
  tier: z.enum(["tier_1", "tier_2", "tier_3"]),
  seat_count: z.number().int().min(1, "At least 1"),
  license_expires_at: z.string().min(1, "Required"),
  notes: z.string().max(2000).optional(),
});

function defaultExpiry() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export default function AdminCompanyCreate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    domain: "",
    primary_contact_email: "",
    tier: "tier_1" as "tier_1" | "tier_2" | "tier_3",
    seat_count: 50,
    license_expires_at: defaultExpiry(),
    notes: "",
  });

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const parsed = Schema.safeParse(form);
  const canSubmit = parsed.success && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = Schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) fieldErrors[issue.path.join(".")] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const expiryIso = new Date(result.data.license_expires_at).toISOString();
      const { data, error } = await supabase.functions.invoke("b2b-admin-create-company", {
        body: { ...result.data, license_expires_at: expiryIso },
      });
      if (error || !data?.id) {
        toast.error(error?.message ?? "Could not create company.");
        return;
      }
      toast.success("Company created.");
      navigate(`/admin/companies/${data.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <AdminBreadcrumb
        trail={[
          { label: "Levoro Admin" },
          { label: "Companies", to: "/admin/companies" },
          { label: "New" },
        ]}
      />
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Create company</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new B2B customer to the platform.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Identity</h2>
          <div className="mt-4 space-y-4">
            <Field label="Company name" error={errors.name}>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
            </Field>
            <Field label="Domain" error={errors.domain}>
              <Input value={form.domain} placeholder="example.com" onChange={(e) => update("domain", e.target.value)} />
            </Field>
            <Field label="Primary contact email" error={errors.primary_contact_email}>
              <Input
                type="email"
                value={form.primary_contact_email}
                onChange={(e) => update("primary_contact_email", e.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Subscription</h2>
          <div className="mt-4 space-y-4">
            <Field label="Tier">
              <RadioGroup
                value={form.tier}
                onValueChange={(v) => update("tier", v as typeof form.tier)}
                className="grid grid-cols-1 gap-2 md:grid-cols-3"
              >
                {(["tier_1", "tier_2", "tier_3"] as const).map((t) => (
                  <label
                    key={t}
                    className={cn(
                      "flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm",
                      form.tier === t
                        ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10"
                        : "border-border bg-background",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{t.replace("_", " ")}</span>
                      <RadioGroupItem value={t} className="sr-only" />
                    </div>
                    <span className="text-xs text-muted-foreground">{TIER_DESCRIPTIONS[t]}</span>
                  </label>
                ))}
              </RadioGroup>
            </Field>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Seat count" error={errors.seat_count}>
                <Input
                  type="number"
                  min={1}
                  value={form.seat_count}
                  onChange={(e) => update("seat_count", Math.max(1, Number(e.target.value) || 0))}
                />
              </Field>
              <Field label="License expires" error={errors.license_expires_at}>
                <Input
                  type="date"
                  value={form.license_expires_at}
                  onChange={(e) => update("license_expires_at", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notes</h2>
          <p className="mt-1 text-xs text-muted-foreground">Any internal notes about this customer.</p>
          <Textarea
            className="mt-3"
            rows={4}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </section>

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate("/admin/companies")}>
            Cancel
          </Button>
          <Button type="submit" className="rounded-full" disabled={!canSubmit}>
            {submitting ? "Creating…" : "Create company"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
