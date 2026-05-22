import { Label } from "@/components/ui/label";
import { MediaUpload } from "@/components/MediaUpload";
import { ImageIcon } from "lucide-react";

interface ExerciseImageFieldProps {
  imageUrl?: string;
  onChange: (url: string) => void;
}

export function ExerciseImageField({ imageUrl, onChange }: ExerciseImageFieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground flex items-center gap-1">
        <ImageIcon className="h-3 w-3" /> Exercise header image (optional)
      </Label>
      <MediaUpload
        value={imageUrl || ""}
        onChange={onChange}
        accept="image/*"
        placeholder="Image URL or upload..."
      />
    </div>
  );
}
