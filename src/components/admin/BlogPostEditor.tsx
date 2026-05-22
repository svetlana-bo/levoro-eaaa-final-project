import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BlockEditor } from "@/components/lesson-editor/BlockEditor";
import { ContentBlock } from "@/components/lesson-editor/types";
import { MediaUpload } from "@/components/MediaUpload";
import { RichTextEditor } from "@/components/lesson-editor/RichTextEditor";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import { toast } from "sonner";
import { ArrowLeft, Eye, CalendarIcon } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const BLOG_DRAFT_KEY = "levoro-blog-post-draft";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content_blocks: any;
  thumbnail_url: string | null;
  category: string;
  author_name: string;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  published_at: string | null;
  scheduled_publish_at: string | null;
  introduction: string | null;
  show_toc: boolean;
  created_at: string;
  updated_at: string;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface BlogDraft {
  postId: string | null;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  authorName: string;
  thumbnailUrl: string;
  metaTitle: string;
  metaDescription: string;
  isPublished: boolean;
  scheduledPublishAt: string | null;
  introduction: string;
  showToc: boolean;
  blocks: ContentBlock[];
  autoSlug: boolean;
}

function saveDraft(draft: BlogDraft) {
  try { localStorage.setItem(BLOG_DRAFT_KEY, JSON.stringify(draft)); } catch {}
}

function loadDraft(): BlogDraft | null {
  try {
    const raw = localStorage.getItem(BLOG_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearDraft() {
  localStorage.removeItem(BLOG_DRAFT_KEY);
}

export default function BlogPostEditor({ post, onBack }: { post: BlogPost | null; onBack: () => void }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isNew = !post;
  const savedRef = useRef(false);

  // Try to restore draft for this post
  const existingDraft = useRef(loadDraft()).current;
  const shouldRestore = existingDraft && existingDraft.postId === (post?.id || null);

  const [title, setTitle] = useState(shouldRestore ? existingDraft!.title : post?.title || "");
  const [slug, setSlug] = useState(shouldRestore ? existingDraft!.slug : post?.slug || "");
  const [excerpt, setExcerpt] = useState(shouldRestore ? existingDraft!.excerpt : post?.excerpt || "");
  const [category, setCategory] = useState(shouldRestore ? existingDraft!.category : post?.category || "");
  const [authorName, setAuthorName] = useState(shouldRestore ? existingDraft!.authorName : post?.author_name || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(shouldRestore ? existingDraft!.thumbnailUrl : post?.thumbnail_url || "");
  const [metaTitle, setMetaTitle] = useState(shouldRestore ? existingDraft!.metaTitle : post?.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(shouldRestore ? existingDraft!.metaDescription : post?.meta_description || "");
  const [isPublished, setIsPublished] = useState(shouldRestore ? existingDraft!.isPublished : post?.is_published || false);
  const [scheduledPublishAt, setScheduledPublishAt] = useState<string | null>(
    shouldRestore ? existingDraft!.scheduledPublishAt : (post as any)?.scheduled_publish_at || null
  );
  const [introduction, setIntroduction] = useState(shouldRestore ? existingDraft!.introduction || "" : (post as any)?.introduction || "");
  const [showToc, setShowToc] = useState(shouldRestore ? existingDraft!.showToc || false : (post as any)?.show_toc || false);
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => {
    if (shouldRestore) return existingDraft!.blocks;
    if (post?.content_blocks) {
      const raw = post.content_blocks;
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  });
  const [autoSlug, setAutoSlug] = useState(shouldRestore ? existingDraft!.autoSlug : isNew);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isDirty, setIsDirty] = useState(shouldRestore ? true : false);

  // Track changes
  const markDirty = useCallback(() => setIsDirty(true), []);

  // Navigation guard for browser close/refresh
  useNavigationGuard(isDirty);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!isDirty) return;
    const draft: BlogDraft = {
      postId: post?.id || null, title, slug, excerpt, category, authorName,
      thumbnailUrl, metaTitle, metaDescription, isPublished, scheduledPublishAt,
      introduction, showToc, blocks, autoSlug,
    };
    saveDraft(draft);
  }, [title, slug, excerpt, category, authorName, thumbnailUrl, metaTitle, metaDescription, isPublished, scheduledPublishAt, introduction, showToc, blocks, autoSlug, isDirty, post?.id]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug) setSlug(slugify(val));
    markDirty();
  };

  const handleBack = () => {
    if (isDirty) {
      setShowLeaveDialog(true);
    } else {
      clearDraft();
      onBack();
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title,
        slug: slug || slugify(title),
        excerpt,
        content_blocks: JSON.stringify(blocks),
        thumbnail_url: thumbnailUrl || null,
        category,
        author_name: authorName,
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        is_published: isPublished,
        scheduled_publish_at: scheduledPublishAt || null,
        introduction: introduction || null,
        show_toc: showToc,
        published_at: isPublished
          ? (scheduledPublishAt || post?.published_at || new Date().toISOString())
          : post?.published_at || null,
        updated_at: new Date().toISOString(),
      };

      if (isNew) {
        const { error } = await supabase.from("blog_posts" as any).insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts" as any).update(payload).eq("id", post.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      savedRef.current = true;
      setIsDirty(false);
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success(isNew ? "Blog post created" : "Blog post saved");
      if (isNew) onBack();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const previewUrl = post?.id ? `/blog/preview/${post.id}` : null;

  return (
    <div className="space-y-6">
      {/* Leave confirmation dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your draft will be preserved and restored when you return.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onBack(); }}>
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h2 className="text-xl font-bold text-primary">{isNew ? "New Blog Post" : "Edit Blog Post"}</h2>
        {isDirty && <span className="text-xs text-muted-foreground">(unsaved changes)</span>}
        <div className="ml-auto flex items-center gap-2">
          {previewUrl && (
            <Button variant="outline" size="sm" onClick={() => navigate(previewUrl)}>
              <Eye className="h-4 w-4 mr-1" /> Preview
            </Button>
          )}
          <Button onClick={() => save.mutate()} disabled={!title.trim() || save.isPending}>
            {save.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Content</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Blog post title" />
              </div>
              <div>
                <Label>Excerpt</Label>
                <Textarea value={excerpt} onChange={(e) => { setExcerpt(e.target.value); markDirty(); }} placeholder="Short summary shown on blog listing..." rows={3} />
                <p className="text-xs text-muted-foreground mt-1">Shown on the blog listing page. Falls back to Meta Description for SEO if no Meta Description is set.</p>
              </div>
              <div>
                <Label>Introduction</Label>
                <p className="text-xs text-muted-foreground mb-2">Displayed before the main content and Table of Contents.</p>
                <div className="max-w-4xl mx-auto border-x border-dashed border-muted-foreground/20 px-4">
                  <RichTextEditor value={introduction} onChange={(v) => { setIntroduction(v); markDirty(); }} placeholder="Write an introduction..." />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Content Blocks</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">Content area matches published width (896px)</p>
              <div className="max-w-4xl mx-auto border-x border-dashed border-muted-foreground/20 px-4">
                <BlockEditor blocks={blocks} onChange={(b) => { setBlocks(b); markDirty(); }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Published</Label>
                <Switch checked={isPublished} onCheckedChange={(v) => { setIsPublished(v); markDirty(); }} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Table of Contents</Label>
                <Switch checked={showToc} onCheckedChange={(v) => { setShowToc(v); markDirty(); }} />
              </div>

              {/* Publish date */}
              <div>
                <Label>Publish Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !scheduledPublishAt && !post?.published_at && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledPublishAt
                        ? format(new Date(scheduledPublishAt), "dd/MM/yyyy")
                        : post?.published_at
                          ? format(new Date(post.published_at), "dd/MM/yyyy")
                          : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledPublishAt ? new Date(scheduledPublishAt) : post?.published_at ? new Date(post.published_at) : undefined}
                      onSelect={(date) => { setScheduledPublishAt(date ? date.toISOString() : null); markDirty(); }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {scheduledPublishAt && (
                  <div className="flex gap-1 mt-1">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setScheduledPublishAt(null); markDirty(); }}>
                      Clear date
                    </Button>
                  </div>
                )}
                {!scheduledPublishAt && post?.published_at && (
                  <p className="text-xs text-muted-foreground mt-1">Currently: {format(new Date(post.published_at), "dd/MM/yyyy")}</p>
                )}
              </div>

              <div>
                <Label>Category</Label>
                <Input value={category} onChange={(e) => { setCategory(e.target.value); markDirty(); }} placeholder="e.g. Education, Career" />
              </div>
              <div>
                <Label>Author Name</Label>
                <Input value={authorName} onChange={(e) => { setAuthorName(e.target.value); markDirty(); }} placeholder="Author name" />
              </div>
              <div>
                <Label>Thumbnail</Label>
                <MediaUpload value={thumbnailUrl} onChange={(v) => { setThumbnailUrl(v); markDirty(); }} accept="image/*" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">SEO</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) => { setSlug(e.target.value); setAutoSlug(false); markDirty(); }} placeholder="blog-post-slug" />
              </div>
              <div>
                <Label>Meta Title</Label>
                <Input value={metaTitle} onChange={(e) => { setMetaTitle(e.target.value); markDirty(); }} placeholder={title || "Blog post title"} />
              </div>
              <div>
                <Label>Meta Description</Label>
                <Textarea value={metaDescription} onChange={(e) => { setMetaDescription(e.target.value); markDirty(); }} placeholder="SEO description..." rows={3} />
                <p className="text-xs text-muted-foreground mt-1">Overrides the excerpt for search engine results.</p>
              </div>
              <div className="border rounded-md p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Google Preview</p>
                <p className="text-sm text-[#1a0dab] truncate">{metaTitle || title || "Blog Post Title"} | Levoro Academy</p>
                <p className="text-xs text-[#006621] truncate">levoro.academy/blog/{slug || "post-slug"}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{metaDescription || excerpt || "Blog post description..."}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
