import { useState, useEffect, ReactNode } from "react";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaUpload } from "@/components/MediaUpload";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface AdminEditableImageProps {
  imageKey: string;
  defaultSrc?: string;
  alt: string;
  className?: string;
  fallback?: ReactNode;
  containerClassName?: string;
}

// Module-level cache so AdminEditableImage doesn't flash its fallback
// on every route change while the Supabase fetch is in flight.
const overrideCache = new Map<string, { url: string | null; alt: string | null }>();

export function AdminEditableImage({
  imageKey,
  defaultSrc,
  alt,
  className = "",
  fallback,
  containerClassName = "",
}: AdminEditableImageProps) {
  const { role } = useRole();
  const isAdmin = role === "admin" || role === "webadmin";
  const cached = overrideCache.get(imageKey);
  const [overrideUrl, setOverrideUrl] = useState<string | null>(cached?.url ?? null);
  const [overrideAlt, setOverrideAlt] = useState<string | null>(cached?.alt ?? null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (overrideCache.has(imageKey)) {
      const c = overrideCache.get(imageKey)!;
      setOverrideUrl(c.url);
      setOverrideAlt(c.alt);
      return;
    }
    supabase
      .from("site_images" as any)
      .select("value, alt_text")
      .eq("image_key", imageKey)
      .maybeSingle()
      .then(({ data }: any) => {
        const url = data?.value ?? null;
        const altText = data?.alt_text ?? null;
        overrideCache.set(imageKey, { url, alt: altText });
        if (url) setOverrideUrl(url);
        if (altText) setOverrideAlt(altText);
      });
  }, [imageKey]);

  const imgSrc = overrideUrl || defaultSrc;
  const imgAlt = overrideAlt || alt;

  const handleSave = async () => {
    if (!tempUrl.trim()) return;
    setSaving(true);
    try {
      // Try update first, then insert
      const { data: existing } = await (supabase as any)
        .from("site_images")
        .select("id")
        .eq("image_key", imageKey)
        .maybeSingle();

      if (existing) {
        await (supabase as any)
          .from("site_images")
          .update({ value: tempUrl.trim(), updated_at: new Date().toISOString() })
          .eq("image_key", imageKey);
      } else {
        await (supabase as any)
          .from("site_images")
          .insert({ image_key: imageKey, value: tempUrl.trim() });
      }
      const newUrl = tempUrl.trim();
      overrideCache.set(imageKey, { url: newUrl, alt: overrideAlt });
      setOverrideUrl(newUrl);
      setDialogOpen(false);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const openDialog = (e?: React.MouseEvent | React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setTempUrl(imgSrc || "");
    setDialogOpen(true);
  };

  const content = imgSrc ? (
    <img src={imgSrc} alt={imgAlt} className={className} />
  ) : (
    fallback || null
  );

  return (
    <>
      <div className={`relative ${isAdmin ? "inline-block group" : ""} ${containerClassName}`}>
        {content}
        {isAdmin && (
          <button
            type="button"
            onClick={openDialog}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            aria-label={`Edit image: ${imageKey}`}
            className="absolute -top-2 -right-2 z-10 bg-white shadow-md rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white border border-border"
          >
            <Pencil className="h-3 w-3 text-black" />
          </button>
        )}
      </div>
      {isAdmin && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent
            className="sm:max-w-lg"
            onClick={(e) => e.stopPropagation()}
            onPointerDownCapture={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <DialogHeader>
              <DialogTitle>Edit Image: {imageKey}</DialogTitle>
            </DialogHeader>
            <MediaUpload
              value={tempUrl}
              onChange={setTempUrl}
              accept="image/*"
              label="Upload or paste an image URL"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !tempUrl.trim()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
