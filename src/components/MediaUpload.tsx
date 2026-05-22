import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FolderOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StorageBrowser } from "@/components/StorageBrowser";

interface MediaUploadProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
  placeholder?: string;
}

export function MediaUpload({ value, onChange, accept = "image/*,video/*", label, placeholder = "https://example.com/media..." }: MediaUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("course-media").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("course-media").getPublicUrl(path);
      onChange(publicUrl);
      toast.success("File uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-xs text-muted-foreground">{label}</p>}
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleUpload} />
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="shrink-0 gap-1">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "..." : "Upload"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setBrowseOpen(true)} className="shrink-0 gap-1">
          <FolderOpen className="h-4 w-4" />
          Browse
        </Button>
      </div>
      {value && accept.includes("image") && (
        <img src={value} alt="Preview" className="max-h-24 rounded-md object-cover" />
      )}
      <StorageBrowser
        open={browseOpen}
        onClose={() => setBrowseOpen(false)}
        onSelect={(url) => { onChange(url); toast.success("File selected!"); }}
        accept={accept}
      />
    </div>
  );
}
