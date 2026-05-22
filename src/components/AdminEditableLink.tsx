import { useState, useEffect, ReactNode } from "react";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface AdminEditableLinkProps {
  linkKey: string;
  defaultHref: string;
  children: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

export function AdminEditableLink({
  linkKey,
  defaultHref,
  children,
  className = "",
  target,
  rel,
}: AdminEditableLinkProps) {
  const { role } = useRole();
  const isAdmin = role === "admin" || role === "webadmin";
  const [overrideUrl, setOverrideUrl] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("site_images" as any)
      .select("value")
      .eq("image_key", linkKey)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.value) setOverrideUrl(data.value);
      });
  }, [linkKey]);

  const href = overrideUrl || defaultHref;

  const handleSave = async () => {
    if (!editUrl.trim()) return;
    setSaving(true);
    try {
      const { data: existing } = await (supabase as any)
        .from("site_images")
        .select("id")
        .eq("image_key", linkKey)
        .maybeSingle();

      if (existing) {
        await (supabase as any)
          .from("site_images")
          .update({ value: editUrl.trim(), updated_at: new Date().toISOString() })
          .eq("image_key", linkKey);
      } else {
        await (supabase as any)
          .from("site_images")
          .insert({ image_key: linkKey, value: editUrl.trim() });
      }
      setOverrideUrl(editUrl.trim());
      setOpen(false);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <a href={href} target={target} rel={rel} className={className}>
        {children}
      </a>
    );
  }

  return (
    <div className="relative group inline-flex">
      <a href={href} target={target} rel={rel} className={className} onClick={(e) => e.preventDefault()}>
        {children}
      </a>
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) setEditUrl(href); }}>
        <PopoverTrigger asChild>
          <button className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
            <Pencil className="h-3 w-3 text-black" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <p className="text-xs text-muted-foreground mb-2">Edit link: {linkKey}</p>
          <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://..." />
          <div className="flex justify-end gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "..." : "Save"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
