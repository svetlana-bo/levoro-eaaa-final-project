import { useState, useEffect } from "react";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Pencil, Play } from "lucide-react";

interface AdminEditableVideoProps {
  videoKey: string;
  title?: string;
  className?: string;
}

function getEmbedUrl(url: string): { type: "iframe" | "video" | null; src: string } {
  if (!url) return { type: null, src: "" };

  // YouTube
  const yt =
    url.match(/youtube\.com\/watch\?v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?&]+)/) ||
    url.match(/youtube\.com\/embed\/([^?&]+)/);
  if (yt) return { type: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };

  // Vimeo
  const vimeo =
    url.match(/vimeo\.com\/(?:video\/)?(\d+)/) ||
    url.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (vimeo) return { type: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };

  // Direct file
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return { type: "video", src: url };

  // Fallback: assume iframe-compatible
  return { type: "iframe", src: url };
}

export function AdminEditableVideo({ videoKey, title = "Video", className = "" }: AdminEditableVideoProps) {
  const { role } = useRole();
  const isAdmin = role === "admin" || role === "webadmin";
  const [url, setUrl] = useState<string>("");
  const [editUrl, setEditUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("site_images" as any)
      .select("value")
      .eq("image_key", videoKey)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.value) setUrl(data.value);
      });
  }, [videoKey]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await (supabase as any)
        .from("site_images")
        .select("id")
        .eq("image_key", videoKey)
        .maybeSingle();
      const value = editUrl.trim();
      if (existing) {
        await (supabase as any)
          .from("site_images")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("image_key", videoKey);
      } else {
        await (supabase as any)
          .from("site_images")
          .insert({ image_key: videoKey, value });
      }
      setUrl(value);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const { type, src } = getEmbedUrl(url);

  const player = (
    <AspectRatio ratio={16 / 9} className={`overflow-hidden rounded-xl bg-muted ${className}`}>
      {type === "iframe" && src ? (
        <iframe
          src={src}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : type === "video" && src ? (
        <video src={src} controls className="w-full h-full object-cover" />
      ) : isAdmin ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 gap-2">
          <Play className="h-12 w-12 text-primary/50" />
          <p className="text-sm text-muted-foreground">No video added yet</p>
          <p className="text-xs text-muted-foreground">Click the pencil to add one</p>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
          <Play className="h-12 w-12 text-primary/40" />
        </div>
      )}
    </AspectRatio>
  );

  if (!isAdmin) return player;

  return (
    <div className="relative group">
      {player}
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) setEditUrl(url); }}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="absolute top-2 right-2 bg-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
            aria-label="Edit video URL"
          >
            <Pencil className="h-4 w-4 text-black" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-96">
          <p className="text-xs text-muted-foreground mb-2">
            Edit video URL: <span className="font-mono">{videoKey}</span>
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            Accepts YouTube, Vimeo, or direct .mp4/.webm links.
          </p>
          <Input
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
