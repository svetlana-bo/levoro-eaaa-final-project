import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Film, FileIcon, Check, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface StorageBrowserProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  accept?: string;
}

interface StorageFile {
  name: string;
  path: string;
  publicUrl: string;
  isImage: boolean;
  isVideo: boolean;
  updatedAt: string;
}

export function StorageBrowser({ open, onClose, onSelect, accept = "image/*,video/*" }: StorageBrowserProps) {
  const { user } = useAuth();
  const { role } = useRole();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const isAdmin = role === "admin" || role === "webadmin";

  const isImageExt = (name: string) => /\.(jpe?g|png|gif|webp|svg|bmp|ico)$/i.test(name);
  const isVideoExt = (name: string) => /\.(mp4|webm|mov|avi|mkv)$/i.test(name);
  const isPdfExt = (name: string) => /\.pdf$/i.test(name);
  const isDocExt = (name: string) => /\.(docx?|odt|rtf)$/i.test(name);

  const loadFiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allFiles: StorageFile[] = [];

      if (isAdmin) {
        const { data: folders, error: foldersError } = await supabase.storage.from("course-media").list("", { limit: 100 });
        if (foldersError) throw foldersError;
        const folderNames = (folders || []).filter(f => f.id === null || !f.name.includes(".")).map(f => f.name);

        await Promise.all(
          folderNames.map(async (folder) => {
            const { data: folderFiles } = await supabase.storage.from("course-media").list(folder, { limit: 500, sortBy: { column: "created_at", order: "desc" } });
            if (folderFiles) {
              for (const file of folderFiles) {
                if (!file.name || file.id === null) continue;
                const path = `${folder}/${file.name}`;
                const { data: { publicUrl } } = supabase.storage.from("course-media").getPublicUrl(path);
                allFiles.push({
                  name: file.name,
                  path,
                  publicUrl,
                  isImage: isImageExt(file.name),
                  isVideo: isVideoExt(file.name),
                  updatedAt: file.updated_at || file.created_at || "",
                });
              }
            }
          })
        );
      } else {
        const userFolder = user.id;
        const { data: folderFiles } = await supabase.storage.from("course-media").list(userFolder, { limit: 500, sortBy: { column: "created_at", order: "desc" } });
        if (folderFiles) {
          for (const file of folderFiles) {
            if (!file.name || file.id === null) continue;
            const path = `${userFolder}/${file.name}`;
            const { data: { publicUrl } } = supabase.storage.from("course-media").getPublicUrl(path);
            allFiles.push({
              name: file.name,
              path,
              publicUrl,
              isImage: isImageExt(file.name),
              isVideo: isVideoExt(file.name),
              updatedAt: file.updated_at || file.created_at || "",
            });
          }
        }
      }

      allFiles.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

      const acceptsImages = accept.includes("image");
      const acceptsVideo = accept.includes("video");
      const acceptsPdf = accept.includes("pdf");
      const acceptsDoc = accept.includes("word") || accept.includes("officedocument") || accept.includes("msword");
      const acceptsAny = !acceptsImages && !acceptsVideo && !acceptsPdf && !acceptsDoc;
      const filtered = allFiles.filter(f => {
        if (acceptsAny) return true;
        if (acceptsImages && f.isImage) return true;
        if (acceptsVideo && f.isVideo) return true;
        if (acceptsPdf && isPdfExt(f.name)) return true;
        if (acceptsDoc && isDocExt(f.name)) return true;
        return false;
      });

      setFiles(filtered);
    } catch (err: any) {
      console.error("Failed to load storage files:", err);
    } finally {
      setLoading(false);
    }
  }, [accept, user, isAdmin]);

  useEffect(() => {
    if (open) {
      setSelected(null);
      setSearch("");
      loadFiles();
    }
  }, [open, loadFiles]);

  const filtered = search
    ? files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onPointerDownCapture={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" /> Browse Uploaded Files
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div
          className="flex-1 min-h-0 max-h-[50vh] overflow-y-auto overscroll-contain pr-1"
          style={{ WebkitOverflowScrolling: "touch" }}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-base">
              {search ? "No files match your search" : "No uploaded files found"}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 p-1 sm:grid-cols-4">
              {filtered.map((file) => (
                <button
                  key={file.path}
                  onClick={() => setSelected(file.publicUrl)}
                  className={cn(
                    "relative aspect-square items-center justify-center overflow-hidden rounded-lg border-2 bg-muted/50 transition-all hover:border-primary/50",
                    selected === file.publicUrl ? "border-primary ring-2 ring-primary/20" : "border-transparent"
                  )}
                >
                  {file.isImage ? (
                    <img src={file.publicUrl} alt={file.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : file.isVideo ? (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Film className="h-8 w-8" />
                      <span className="max-w-full truncate px-1 text-[10px]">{file.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <FileIcon className="h-8 w-8" />
                      <span className="max-w-full truncate px-1 text-[10px]">{file.name}</span>
                    </div>
                  )}
                  {selected === file.publicUrl && (
                    <div className="absolute top-1 right-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-1 py-0.5 text-[9px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {file.name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleConfirm} disabled={!selected}>
            Use Selected
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
