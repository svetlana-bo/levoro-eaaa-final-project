import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ACCEPTED_TYPES = ["image/png", "image/svg+xml"];
const MAX_SIZE = 50 * 1024; // 50KB
const ICON_DIMENSIONS = { min: 24, max: 128 };

export default function HotspotIconsManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [newName, setNewName] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: icons = [], isLoading } = useQuery({
    queryKey: ["custom-hotspot-icons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_hotspot_icons" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_hotspot_icons" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-hotspot-icons"] });
      toast.success("Icon deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Only PNG or SVG files are allowed");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Icon must be under 50KB");
      return;
    }

    // Validate dimensions for PNG
    if (file.type === "image/png") {
      const valid = await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (img.width < ICON_DIMENSIONS.min || img.height < ICON_DIMENSIONS.min) {
            toast.error(`Icon must be at least ${ICON_DIMENSIONS.min}x${ICON_DIMENSIONS.min}px`);
            resolve(false);
          } else if (img.width > ICON_DIMENSIONS.max || img.height > ICON_DIMENSIONS.max) {
            toast.error(`Icon must be at most ${ICON_DIMENSIONS.max}x${ICON_DIMENSIONS.max}px`);
            resolve(false);
          } else if (Math.abs(img.width - img.height) > 8) {
            toast.error("Icon should be approximately square (1:1 ratio)");
            resolve(false);
          } else {
            resolve(true);
          }
        };
        img.onerror = () => resolve(false);
        img.src = URL.createObjectURL(file);
      });
      if (!valid) return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `hotspot-icons/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("course-media").upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("course-media").getPublicUrl(path);

      const { error: dbErr } = await supabase.from("custom_hotspot_icons" as any).insert({
        name: newName || file.name.replace(/\.[^.]+$/, ""),
        icon_url: publicUrl,
        sort_order: icons.length,
      });
      if (dbErr) throw dbErr;

      queryClient.invalidateQueries({ queryKey: ["custom-hotspot-icons"] });
      toast.success("Icon uploaded!");
      setNewName("");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Custom Hotspot Icons
          </CardTitle>
          <CardDescription>
            Upload custom icons for Image Hotspot exercises. These will be available to all instructors.
            Requirements: PNG or SVG, max 50KB, square (24–128px).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Icon name (optional)</Label>
              <Input
                placeholder="e.g. Star, Arrow, Warning..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <input ref={fileRef} type="file" accept=".png,.svg" className="hidden" onChange={handleUpload} />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Upload Icon"}
            </Button>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground text-base">Loading...</p>
          ) : icons.length === 0 ? (
            <p className="text-muted-foreground text-base">No custom icons yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {icons.map((icon: any) => (
                <Card key={icon.id} className="relative group">
                  <CardContent className="pt-4 pb-4 flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <img src={icon.icon_url} alt={icon.name} className="w-8 h-8 object-contain" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-full">{icon.name || "Unnamed"}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteMutation.mutate(icon.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
