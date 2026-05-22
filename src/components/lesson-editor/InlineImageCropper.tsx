import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface InlineImageCropperProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropped: (url: string) => void;
}

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function InlineImageCropper({ open, onClose, imageUrl, onCropped }: InlineImageCropperProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, crop: { x: 0, y: 0, w: 0, h: 0 } });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCrop(null);
  }, [imageUrl]);

  const onImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
    setDisplaySize({ w: img.clientWidth, h: img.clientHeight });
    imgRef.current = img;
  }, []);

  const getRelativePos = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(displaySize.w, e.clientX - rect.left)),
      y: Math.max(0, Math.min(displaySize.h, e.clientY - rect.top)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (resizing) return;
    e.preventDefault();
    const pos = getRelativePos(e);

    // Check if clicking inside existing crop to drag it
    if (crop && pos.x >= crop.x && pos.x <= crop.x + crop.w && pos.y >= crop.y && pos.y <= crop.y + crop.h) {
      setDragging(true);
      setDragStart({ x: pos.x - crop.x, y: pos.y - crop.y });
      return;
    }

    // Start new crop
    setDrawing(true);
    setDrawStart(pos);
    setCrop({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (drawing) {
      const pos = getRelativePos(e);
      const x = Math.min(drawStart.x, pos.x);
      const y = Math.min(drawStart.y, pos.y);
      const w = Math.abs(pos.x - drawStart.x);
      const h = Math.abs(pos.y - drawStart.y);
      setCrop({ x, y, w, h });
    } else if (dragging && crop) {
      const pos = getRelativePos(e);
      const newX = Math.max(0, Math.min(displaySize.w - crop.w, pos.x - dragStart.x));
      const newY = Math.max(0, Math.min(displaySize.h - crop.h, pos.y - dragStart.y));
      setCrop({ ...crop, x: newX, y: newY });
    } else if (resizing && crop) {
      const pos = getRelativePos(e);
      const dx = pos.x - resizeStart.x;
      const dy = pos.y - resizeStart.y;
      const rc = resizeStart.crop;
      let newCrop = { ...rc };

      if (resizing.includes("e")) newCrop.w = Math.max(20, Math.min(displaySize.w - rc.x, rc.w + dx));
      if (resizing.includes("s")) newCrop.h = Math.max(20, Math.min(displaySize.h - rc.y, rc.h + dy));
      if (resizing.includes("w")) {
        const shift = Math.min(dx, rc.w - 20);
        newCrop.x = rc.x + shift;
        newCrop.w = rc.w - shift;
      }
      if (resizing.includes("n")) {
        const shift = Math.min(dy, rc.h - 20);
        newCrop.y = rc.y + shift;
        newCrop.h = rc.h - shift;
      }
      setCrop(newCrop);
    }
  }, [drawing, dragging, resizing, drawStart, dragStart, crop, displaySize, resizeStart]);

  const handleMouseUp = () => {
    setDrawing(false);
    setDragging(false);
    setResizing(null);
    // Remove tiny accidental crops
    if (crop && crop.w < 10 && crop.h < 10) setCrop(null);
  };

  const startResize = (handle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!crop) return;
    setResizing(handle);
    const pos = getRelativePos(e);
    setResizeStart({ x: pos.x, y: pos.y, crop: { ...crop } });
  };

  const handleCrop = async () => {
    if (!crop || !imgRef.current || !user || !displaySize.w) return;
    setSaving(true);
    try {
      const scaleX = imgNatural.w / displaySize.w;
      const scaleY = imgNatural.h / displaySize.h;
      const sx = crop.x * scaleX;
      const sy = crop.y * scaleY;
      const sw = crop.w * scaleX;
      const sh = crop.h * scaleY;

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(sw);
      canvas.height = Math.round(sh);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.9));
      const path = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from("course-media").upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("course-media").getPublicUrl(path);
      onCropped(publicUrl);
      toast.success("Image cropped!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to crop image");
    } finally {
      setSaving(false);
    }
  };

  const handles = ["nw", "ne", "sw", "se", "n", "s", "e", "w"];
  const handleCursors: Record<string, string> = {
    nw: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize", se: "nwse-resize",
    n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
  };
  const getHandlePos = (h: string): React.CSSProperties => {
    if (!crop) return {};
    const size = 10;
    const half = size / 2;
    const positions: Record<string, React.CSSProperties> = {
      nw: { left: crop.x - half, top: crop.y - half },
      ne: { left: crop.x + crop.w - half, top: crop.y - half },
      sw: { left: crop.x - half, top: crop.y + crop.h - half },
      se: { left: crop.x + crop.w - half, top: crop.y + crop.h - half },
      n: { left: crop.x + crop.w / 2 - half, top: crop.y - half },
      s: { left: crop.x + crop.w / 2 - half, top: crop.y + crop.h - half },
      e: { left: crop.x + crop.w - half, top: crop.y + crop.h / 2 - half },
      w: { left: crop.x - half, top: crop.y + crop.h / 2 - half },
    };
    return positions[h] || {};
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div
            ref={containerRef}
            className="relative inline-block select-none cursor-crosshair mx-auto"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ display: "flex", justifyContent: "center" }}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Crop source"
                crossOrigin="anonymous"
                onLoad={onImgLoad}
                draggable={false}
                className="max-w-full max-h-[60vh] rounded-lg"
                style={{ display: "block" }}
              />
            )}
            {/* Overlay outside crop */}
            {crop && crop.w > 0 && crop.h > 0 && (
              <>
                {/* Dark overlay using clip-path to cut out the crop rect */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    clipPath: `polygon(
                      0% 0%, 100% 0%, 100% 100%, 0% 100%,
                      0% ${crop.y}px,
                      ${crop.x}px ${crop.y}px,
                      ${crop.x}px ${crop.y + crop.h}px,
                      ${crop.x + crop.w}px ${crop.y + crop.h}px,
                      ${crop.x + crop.w}px ${crop.y}px,
                      0% ${crop.y}px
                    )`,
                  }}
                />
                {/* Crop border */}
                <div
                  className="absolute border-2 border-white pointer-events-none"
                  style={{
                    left: crop.x,
                    top: crop.y,
                    width: crop.w,
                    height: crop.h,
                  }}
                />
                {/* Grid lines */}
                <div className="absolute border border-dashed border-white/40 pointer-events-none"
                  style={{ left: crop.x + crop.w / 3, top: crop.y, width: 0, height: crop.h }}
                />
                <div className="absolute border border-dashed border-white/40 pointer-events-none"
                  style={{ left: crop.x + (2 * crop.w) / 3, top: crop.y, width: 0, height: crop.h }}
                />
                <div className="absolute border border-dashed border-white/40 pointer-events-none"
                  style={{ left: crop.x, top: crop.y + crop.h / 3, width: crop.w, height: 0 }}
                />
                <div className="absolute border border-dashed border-white/40 pointer-events-none"
                  style={{ left: crop.x, top: crop.y + (2 * crop.h) / 3, width: crop.w, height: 0 }}
                />
                {/* Resize handles */}
                {handles.map((h) => (
                  <div
                    key={h}
                    className="absolute bg-white border border-gray-400 rounded-sm"
                    style={{
                      ...getHandlePos(h),
                      width: 10,
                      height: 10,
                      cursor: handleCursors[h],
                      zIndex: 30,
                      pointerEvents: "auto",
                    }}
                    onMouseDown={(e) => startResize(h, e)}
                  />
                ))}
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Click and drag to select crop area · Drag corners to adjust
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleCrop} disabled={saving || !crop || (crop.w < 10 || crop.h < 10)}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Apply Crop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
