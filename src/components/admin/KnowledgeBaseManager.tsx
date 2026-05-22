import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/lesson-editor/RichTextEditor";
import { MediaUpload } from "@/components/MediaUpload";
import { Trash2, Pencil, Plus, ArrowLeft, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface KbArticle {
  id: string;
  title: string;
  content: string;
  sort_order: number;
  is_published: boolean;
  content_type: string;
  custom_key: string | null;
  created_at: string;
  updated_at: string;
}

const CUSTOM_ARTICLE_IMAGES: Record<string, { imageKey: string; label: string; accept?: string }[]> = {
  'levoro-story': [
    { imageKey: 'kb-story-s1', label: 'Why Levoro exists' },
    { imageKey: 'kb-story-s2', label: 'Who we serve' },
  ],
  'brand-tone': [
    { imageKey: 'kb-brand-tone-s1', label: 'Tone overview' },
    { imageKey: 'kb-brand-tone-s4', label: 'Closing image' },
  ],
  'microlearning': [
    { imageKey: 'kb-microlearning-s1', label: 'Intro' },
    { imageKey: 'kb-microlearning-s3', label: 'Adult learning principles' },
    { imageKey: 'kb-microlearning-s5', label: 'Reflection' },
  ],
  'practical-guide': [
    { imageKey: 'kb-practical-s1', label: 'Hero / quick-start image' },
  ],
  'quality-standards': [
    { imageKey: 'kb-quality-s1', label: 'Design & Slides' },
    { imageKey: 'kb-quality-s4', label: 'Accessibility' },
  ],
  'payment-reporting': [
    { imageKey: 'kb-payment-s1', label: 'Hero / overview image' },
  ],
  'collaboration-visibility': [
    { imageKey: 'kb-collab-s1', label: 'Opportunities image' },
  ],
  'visibility-reach': [
    { imageKey: 'kb-visibility-s1', label: 'Hero / overview image' },
  ],
  'lets-start-creating': [
    { imageKey: 'kb-start-s1', label: 'Hero / intro image' },
  ],
  'whiteboard-animations': [
    { imageKey: 'kb-whiteboard-video', label: 'Hero video URL (YouTube, Vimeo, or direct .mp4/.webm)', accept: 'video/*,image/*' },
    { imageKey: 'kb-whiteboard-s2', label: 'Script writing section image' },
    { imageKey: 'kb-whiteboard-sample-pdf', label: 'Sample of Script — PDF URL', accept: 'application/pdf' },
    { imageKey: 'kb-whiteboard-template-docx', label: 'Video Script Template — DOCX URL', accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword' },
  ],
  'market-your-course': [
    { imageKey: 'kb-market-course-pdf', label: 'Marketing guide — PDF URL', accept: 'application/pdf' },
  ],
};

export default function KnowledgeBaseManager() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<KbArticle | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(true);
  const [articleToDelete, setArticleToDelete] = useState<KbArticle | null>(null);
  const [imageData, setImageData] = useState<Record<string, { value: string; alt_text: string }>>({});
  const [savedData, setSavedData] = useState<Record<string, { value: string; alt_text: string }>>({});

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin-kb-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_base_articles" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as unknown as KbArticle[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await (supabase.from("knowledge_base_articles" as any) as any)
          .update({ title, content, sort_order: sortOrder, is_published: isPublished, updated_at: new Date().toISOString() })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("knowledge_base_articles" as any) as any)
          .insert({ title, content, sort_order: sortOrder, is_published: isPublished });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-kb-articles"] });
      queryClient.invalidateQueries({ queryKey: ["kb-articles"] });
      toast.success(editing ? "Article updated" : "Article created");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("knowledge_base_articles" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-kb-articles"] });
      queryClient.invalidateQueries({ queryKey: ["kb-articles"] });
      toast.success("Article deleted");
      setArticleToDelete(null);
    },
    onError: (e: any) => { toast.error(e.message); setArticleToDelete(null); },
  });

  const resetForm = () => {
    setEditing(null);
    setCreating(false);
    setTitle("");
    setContent("");
    setSortOrder(0);
    setIsPublished(true);
    setImageData({});
    setSavedData({});
  };

  const loadImageData = async (customKey: string) => {
    const slots = CUSTOM_ARTICLE_IMAGES[customKey];
    if (!slots) return;
    const keys = slots.map(s => s.imageKey);
    const { data } = await (supabase as any)
      .from("site_images")
      .select("image_key, value, alt_text")
      .in("image_key", keys);
    if (data) {
      const map: Record<string, { value: string; alt_text: string }> = {};
      for (const row of data) {
        map[row.image_key] = { value: row.value, alt_text: row.alt_text || "" };
      }
      setImageData(map);
      setSavedData(map);
    }
  };

  const saveImage = async (imageKey: string, value: string, altText: string) => {
    const { data: existing } = await (supabase as any)
      .from("site_images")
      .select("id")
      .eq("image_key", imageKey)
      .maybeSingle();

    if (existing) {
      await (supabase as any)
        .from("site_images")
        .update({ value, alt_text: altText, updated_at: new Date().toISOString() })
        .eq("image_key", imageKey);
    } else {
      await (supabase as any)
        .from("site_images")
        .insert({ image_key: imageKey, value, alt_text: altText });
    }
    setSavedData(prev => ({ ...prev, [imageKey]: { value, alt_text: altText } }));
    toast.success("Image saved");
  };

  const startEdit = (a: KbArticle) => {
    setEditing(a);
    setCreating(true);
    setTitle(a.title);
    setContent(a.content);
    setSortOrder(a.sort_order);
    setIsPublished(a.is_published);
    setImageData({});
    setSavedData({});
    if (a.content_type === 'custom' && a.custom_key) {
      loadImageData(a.custom_key);
    }
  };

  if (creating) {
    const isCustom = editing?.content_type === 'custom';
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={resetForm}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h2 className="text-xl font-semibold">{editing ? "Edit Article" : "New Article"}</h2>
          {editing && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto gap-1"
              onClick={() => {
                const url = `/instructor?view=kb-article&articleId=${editing.id}`;
                window.open(url, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4" /> Preview
            </Button>
          )}
        </div>

        <div className="space-y-4 max-w-3xl">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              <Label>Published</Label>
            </div>
          </div>

          {isCustom ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
                This article uses a custom layout. You can edit the title and settings above, but the content is managed in code.
              </div>
              {editing?.custom_key && CUSTOM_ARTICLE_IMAGES[editing.custom_key] && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Article Images</Label>
                  {CUSTOM_ARTICLE_IMAGES[editing.custom_key].map((slot) => (
                    <div key={slot.imageKey} className="rounded-lg border p-4 space-y-3">
                      <p className="text-sm font-medium">{slot.label}</p>
                      <MediaUpload
                        value={imageData[slot.imageKey]?.value || ""}
                        onChange={(url) => {
                          setImageData(prev => ({
                            ...prev,
                            [slot.imageKey]: { value: url, alt_text: prev[slot.imageKey]?.alt_text || "" }
                          }));
                        }}
                        accept={slot.accept || "image/*"}
                        label="Image URL"
                      />
                      {!slot.accept || slot.accept.includes("image") ? (
                        <div className="space-y-1">
                          <Label className="text-xs">Alt text (SEO)</Label>
                          <Input
                            placeholder="Descriptive alt text for this image..."
                            value={imageData[slot.imageKey]?.alt_text || ""}
                            onChange={(e) => {
                              setImageData(prev => ({
                                ...prev,
                                [slot.imageKey]: { value: prev[slot.imageKey]?.value || "", alt_text: e.target.value }
                              }));
                            }}
                          />
                        </div>
                      ) : null}
                      {(() => {
                        const cur = imageData[slot.imageKey];
                        const saved = savedData[slot.imageKey];
                        const hasValue = !!cur?.value;
                        const isSaved = hasValue && saved && saved.value === cur.value && (saved.alt_text || "") === (cur.alt_text || "");
                        return (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (cur?.value) saveImage(slot.imageKey, cur.value, cur.alt_text);
                            }}
                            disabled={!hasValue || isSaved}
                          >
                            {isSaved ? (
                              <><Check className="h-4 w-4 mr-1" /> Saved</>
                            ) : (
                              slot.accept ? "Save File" : "Save file"
                            )}
                          </Button>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Content</Label>
              <RichTextEditor value={content} onChange={setContent} placeholder="Write article content..." />
            </div>
          )}

          <Button onClick={() => save.mutate()} disabled={!title.trim() || save.isPending}>
            {save.isPending ? "Saving..." : "Save Article"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Knowledge Base Articles</h2>
        <Button onClick={() => { resetForm(); setCreating(true); setSortOrder(articles.length); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Article
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : articles.length === 0 ? (
        <p className="text-muted-foreground">No articles yet.</p>
      ) : (
        <div className="space-y-2">
          {articles.map((a) => (
            <Card key={a.id} className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => startEdit(a)}>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  Order: {a.sort_order} · {a.is_published ? "Published" : "Draft"}{a.content_type === 'custom' ? ` · Custom (${a.custom_key})` : ''}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); startEdit(a); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setArticleToDelete(a); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!articleToDelete} onOpenChange={(open) => { if (!open) setArticleToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the article "{articleToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => articleToDelete && remove.mutate(articleToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
