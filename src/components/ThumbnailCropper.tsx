import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ThumbnailCropperProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropped: (url: string) => void;
  aspectRatio?: number; // width / height, default 16/9
}

export function ThumbnailCropper({ open, onClose, imageUrl, onCropped, aspectRatio = 16 / 9 }: ThumbnailCropperProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });

  // Reset state when image changes
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [imageUrl]);

  const onImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
    imgRef.current = img;
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handleMouseUp = () => setDragging(false);

  // Clamp offset so image stays within bounds
  const getClampedOffset = useCallback(() => {
    if (!containerRef.current || !imgNatural.w) return offset;
    const container = containerRef.current.getBoundingClientRect();
    const containerW = container.width;
    const containerH = container.height;

    // Scaled image dimensions within the container
    const imgAspect = imgNatural.w / imgNatural.h;
    let displayW: number, displayH: number;
    if (imgAspect > aspectRatio) {
      // Image is wider — fit by height
      displayH = containerH * zoom;
      displayW = displayH * imgAspect;
    } else {
      // Image is taller — fit by width
      displayW = containerW * zoom;
      displayH = displayW / imgAspect;
    }

    const maxOffsetX = Math.max(0, (displayW - containerW) / 2);
    const maxOffsetY = Math.max(0, (displayH - containerH) / 2);

    return {
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, offset.x)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, offset.y)),
    };
  }, [offset, zoom, imgNatural, aspectRatio]);

  const clampedOffset = getClampedOffset();

  const handleCrop = async () => {
    if (!containerRef.current || !imgRef.current || !user) return;
    setSaving(true);

    try {
      const container = containerRef.current.getBoundingClientRect();
      const containerW = container.width;
      const containerH = container.height;
      const { w: natW, h: natH } = imgNatural;
      const imgAspect = natW / natH;

      let displayW: number, displayH: number;
      if (imgAspect > aspectRatio) {
        displayH = containerH * zoom;
        displayW = displayH * imgAspect;
      } else {
        displayW = containerW * zoom;
        displayH = displayW / imgAspect;
      }

      // The image is centered + offset within the container
      const imgLeft = (containerW - displayW) / 2 + clampedOffset.x;
      const imgTop = (containerH - displayH) / 2 + clampedOffset.y;

      // Visible region in display coordinates
      const visLeft = -imgLeft;
      const visTop = -imgTop;

      // Convert to natural pixel coordinates
      const scaleX = natW / displayW;
      const scaleY = natH / displayH;
      const sx = Math.max(0, visLeft * scaleX);
      const sy = Math.max(0, visTop * scaleY);
      const sw = Math.min(natW - sx, containerW * scaleX);
      const sh = Math.min(natH - sy, containerH * scaleY);

      // Draw to canvas
      const canvas = document.createElement("canvas");
      const outputW = Math.min(1280, sw);
      const outputH = outputW / aspectRatio;
      canvas.width = outputW;
      canvas.height = outputH;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, outputW, outputH);

      const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.9));
      const path = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from("course-media").upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("course-media").getPublicUrl(path);
      onCropped(publicUrl);
      toast.success("Thumbnail saved!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to crop thumbnail");
    } finally {
      setSaving(false);
    }
  };

  // Compute image style
  const imgAspect = imgNatural.w && imgNatural.h ? imgNatural.w / imgNatural.h : aspectRatio;
  const fitStyle: React.CSSProperties = imgAspect > aspectRatio
    ? { height: `${zoom * 100}%`, width: "auto" }
    : { width: `${zoom * 100}%`, height: "auto" };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adjust Thumbnail</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Crop area */}
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-lg border border-border bg-muted cursor-grab active:cursor-grabbing select-none"
            style={{ aspectRatio: `${aspectRatio}` }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Crop preview"
                crossOrigin="anonymous"
                onLoad={onImgLoad}
                draggable={false}
                className="absolute top-1/2 left-1/2 max-w-none pointer-events-none"
                style={{
                  ...fitStyle,
                  transform: `translate(calc(-50% + ${clampedOffset.x}px), calc(-50% + ${clampedOffset.y}px))`,
                }}
              />
            )}
            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none border border-dashed border-foreground/20" />
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-3 px-1">
            <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
            <Slider
              min={100}
              max={300}
              step={5}
              value={[zoom * 100]}
              onValueChange={([v]) => setZoom(v / 100)}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(zoom * 100)}%</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">Drag to reposition · Zoom to adjust framing</p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleCrop} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Apply Crop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
