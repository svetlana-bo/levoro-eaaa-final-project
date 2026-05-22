import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/lesson-editor/RichTextEditor";
import { InlineTitleEditor } from "@/components/lesson-editor/InlineTitleEditor";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem,
  SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BookOpen, PlusCircle, Users, LogOut, Trash2, GripVertical, ChevronRight, ChevronLeft, ChevronDown, Save, Send, Pencil, Eye, FolderPlus, ArchiveRestore, Linkedin, Upload, FileDown, X, Award, ArrowLeft, Info, BarChart3, Crop } from "lucide-react";
import { safeHtml, stripHtml } from "@/lib/sanitize";
import { AlertTriangle } from "lucide-react";

const MIN_LESSON_CHARS = 1500;

function LessonCharCounter({ blocks }: { blocks: ContentBlock[] }) {
  const charCount = blocks
    .filter((b) => b.type === "text")
    .reduce((sum, b) => sum + stripHtml((b as any).html).length, 0);
  const isLow = charCount < MIN_LESSON_CHARS;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${isLow ? "text-amber-600" : "text-muted-foreground"}`}>
      {isLow && <AlertTriangle className="h-3.5 w-3.5" />}
      {charCount.toLocaleString()} / {MIN_LESSON_CHARS.toLocaleString()} chars
    </span>
  );
}
import { Switch } from "@/components/ui/switch";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRole } from "@/hooks/useRole";
import { toast } from "sonner";
import { useLocalStorageDraft, CourseDraft } from "@/hooks/useLocalStorageDraft";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import GlobalNavbar from "@/components/GlobalNavbar";
import { BlockEditor } from "@/components/lesson-editor/BlockEditor";
import { ContentBlock, parseBlocks, blocksToLegacy } from "@/components/lesson-editor/types";
import { MediaUpload } from "@/components/MediaUpload";
import { ThumbnailCropper } from "@/components/ThumbnailCropper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MicrolearningArticle from "@/components/kb/MicrolearningArticle";
import LevoroStoryArticle from "@/components/kb/LevoroStoryArticle";
import BrandToneArticle from "@/components/kb/BrandToneArticle";
import PracticalGuideArticle from "@/components/kb/PracticalGuideArticle";
import QualityStandardsArticle from "@/components/kb/QualityStandardsArticle";
import PaymentReportingArticle from "@/components/kb/PaymentReportingArticle";
import CollaborationVisibilityArticle from "@/components/kb/CollaborationVisibilityArticle";
import VisibilityReachArticle from "@/components/kb/VisibilityReachArticle";
import LetsStartCreatingArticle from "@/components/kb/LetsStartCreatingArticle";
import WhiteboardAnimationsArticle from "@/components/kb/WhiteboardAnimationsArticle";
import MarketYourCourseArticle from "@/components/kb/MarketYourCourseArticle";
import CourseAnalytics from "@/components/instructor/CourseAnalytics";
import { InstructorContextProvider, useInstructorContext } from "@/hooks/useInstructorContext";
import { InstructorContextSwitcher } from "@/components/instructor/InstructorContextSwitcher";
import { CompanyProfileEditor } from "@/components/instructor/CompanyProfileEditor";
import { Building2 } from "lucide-react";

function InstructorProfileEditor({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["instructor-profile-edit", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("first_name, last_name, bio, avatar_url, linkedin_url").eq("id", userId).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile && !loaded) {
      setBio((profile as any).bio || "");
      setAvatarUrl((profile as any).avatar_url || "");
      setLinkedinUrl((profile as any).linkedin_url || "");
      setLoaded(true);
    }
  }, [profile, loaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({
        bio, avatar_url: avatarUrl || null, linkedin_url: linkedinUrl || null,
      } as any).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated!");
      queryClient.invalidateQueries({ queryKey: ["instructor-profile-edit"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const name = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Instructor" : "Instructor";
  const initials = profile ? `${(profile.first_name || "")[0] || ""}${(profile.last_name || "")[0] || ""}`.toUpperCase() : "IN";

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Public Profile</CardTitle>
          <CardDescription>This information is visible on your public instructor page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-xl bg-secondary text-secondary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-lg">{name}</p>
              <MediaUpload value={avatarUrl} onChange={setAvatarUrl} accept="image/*" placeholder="Upload profile picture..." />
              {avatarUrl && (
                <Button type="button" variant="outline" size="sm" onClick={() => setCropOpen(true)}>
                  <Crop className="mr-2 h-3 w-3" /> Adjust position / zoom
                </Button>
              )}
            </div>
          </div>
          {avatarUrl && (
            <ThumbnailCropper
              open={cropOpen}
              onClose={() => setCropOpen(false)}
              imageUrl={avatarUrl}
              aspectRatio={1}
              onCropped={(url) => setAvatarUrl(url)}
            />
          )}
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell students about yourself, your expertise, and teaching style..." rows={5} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn URL</Label>
            <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/your-profile" />
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" /> {saveMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

type InstructorView = "courses" | "builder" | "knowledge-base" | "kb-article" | "students" | "manage-lessons" | "profile" | "analytics";
type BuilderStep = "details" | "curriculum";

const INSTRUCTOR_VIEWS: InstructorView[] = ["courses", "builder", "knowledge-base", "kb-article", "students", "manage-lessons", "profile", "analytics"];
const isInstructorView = (value: string | null): value is InstructorView =>
  !!value && INSTRUCTOR_VIEWS.includes(value as InstructorView);

interface ModuleDraft {
  id: string;
  title: string;
  description?: string;
  order_index: number;
}

interface LessonDraft {
  id: string;
  title: string;
  video_url: string;
  audio_url: string;
  order_index: number;
  contentBlocks: ContentBlock[];
  module_id?: string | null;
}

const navItems = [
  { title: "My Courses", view: "courses" as const, icon: BookOpen },
  { title: "Create Course", view: "builder" as const, icon: PlusCircle },
  { title: "Course Analytics", view: "analytics" as const, icon: BarChart3 },
  { title: "Knowledge Base", view: "knowledge-base" as const, icon: Info, hasSubmenu: true },
  { title: "Students", view: "students" as const, icon: Users },
  { title: "My Profile", view: "profile" as const, icon: Pencil },
];

function InstructorSidebar({ activeView, setActiveView, tryChangeView, onSelectKbArticle, selectedKbArticleId }: { activeView: InstructorView; setActiveView: (v: InstructorView) => void; tryChangeView?: (v: InstructorView) => void; onSelectKbArticle: (id: string) => void; selectedKbArticleId: string | null }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const kbActive = activeView === "knowledge-base" || activeView === "kb-article";
  const [hovered, setHovered] = useState(false);
  const [clickPinned, setClickPinned] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset click-pin when navigating away from KB
  useEffect(() => { if (!kbActive) setClickPinned(false); }, [kbActive]);

  const kbOpen = kbActive || hovered || clickPinned;

  const onEnter = () => {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
    setHovered(true);
  };
  const onLeave = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setHovered(false), 150);
  };

  const { data: kbArticles = [] } = useQuery({
    queryKey: ["kb-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_base_articles" as any)
        .select("id, title, sort_order, content, content_type, custom_key")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const handleNav = (v: InstructorView) => tryChangeView ? tryChangeView(v) : setActiveView(v);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-sidebar-primary shrink-0" />
          {!collapsed && <span className="font-bold text-lg font-sans">Instructor Dashboard</span>}
        </div>
        <InstructorContextSwitcher />
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                if (item.hasSubmenu && !collapsed) {
                  return (
                    <SidebarMenuItem
                      key={item.title}
                      onMouseEnter={onEnter}
                      onMouseLeave={onLeave}
                    >
                      <Collapsible open={kbOpen}>
                        <SidebarMenuButton
                          onClick={() => { handleNav(item.view); setClickPinned((p) => !p); }}
                          className={kbActive ? "bg-sidebar-accent text-sidebar-primary font-medium" : "hover:bg-sidebar-accent/50"}
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          <span className="flex-1 text-left">{item.title}</span>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${kbOpen ? "rotate-180" : ""}`} />
                        </SidebarMenuButton>
                        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                          {kbArticles.length > 0 && (
                            <SidebarMenuSub>
                              {kbArticles.map((a: any, idx: number) => (
                                <SidebarMenuSubItem key={a.id}>
                                  <SidebarMenuSubButton
                                    onClick={() => onSelectKbArticle(a.id)}
                                    isActive={activeView === "kb-article" && selectedKbArticleId === a.id}
                                    className="cursor-pointer h-auto py-1.5 items-start !overflow-visible [&>span:last-child]:!whitespace-normal [&>span:last-child]:!overflow-visible"
                                  >
                                    <span className="text-sidebar-foreground tabular-nums w-5 shrink-0 text-right pr-1">{idx + 1}.</span>
                                    <span className="leading-snug text-left">{a.title}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                  );
                }
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => handleNav(item.view)}
                      className={activeView === item.view ? "bg-sidebar-accent text-sidebar-primary font-medium" : "hover:bg-sidebar-accent/50"}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const statusColors: Record<string, string> = { draft: "secondary", pending_review: "outline", published: "default" };

function LessonFilesManager({ lessonId }: { lessonId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: files = [] } = useQuery({
    queryKey: ["lesson-files", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase.from("lesson_files" as any).select("*").eq("lesson_id", lessonId).order("created_at", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

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
      await supabase.from("lesson_files" as any).insert({ lesson_id: lessonId, file_name: file.name, file_url: publicUrl, file_size: file.size } as any);
      queryClient.invalidateQueries({ queryKey: ["lesson-files", lessonId] });
      toast.success("File uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (fileId: string) => {
    await supabase.from("lesson_files" as any).delete().eq("id", fileId);
    queryClient.invalidateQueries({ queryKey: ["lesson-files", lessonId] });
    toast.success("File removed");
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2"><FileDown className="h-4 w-4" /> Exercise Files</Label>
      <p className="text-xs text-muted-foreground">Upload files (PDF, documents, etc.) that students can download</p>
      {files.map((f: any) => (
        <div key={f.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
          <FileDown className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm flex-1 truncate">{f.file_name}</span>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(f.id)} className="h-6 w-6 p-0"><X className="h-3 w-3 text-destructive" /></Button>
        </div>
      ))}
      <input ref={fileRef} type="file" accept="*" className="hidden" onChange={handleUpload} />
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1">
        <Upload className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload File"}
      </Button>
    </div>
  );
}

function KbArticleCards({ articles, onSelectArticle, excludeId }: { articles: any[]; onSelectArticle: (id: string) => void; excludeId?: string }) {
  const filtered = excludeId ? articles.filter((a: any) => a.id !== excludeId) : articles;
  if (filtered.length === 0) return null;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map((a: any) => {
        const idx = articles.findIndex((x: any) => x.id === a.id);
        return (
          <button
            key={a.id}
            onClick={() => onSelectArticle(a.id)}
            className="group text-left rounded-xl border bg-card p-5 hover:shadow-md hover:border-primary/30 transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium group-hover:text-primary transition-colors">{a.title}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function KbGradientBanner({ number, title, subtitle, onSubtitleChange, id }: { number: number; title: string; subtitle?: string; onSubtitleChange?: (val: string) => void; id?: string }) {
  const { role } = useRole();
  const isAdmin = role === "admin" || role === "webadmin";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subtitle || "");

  return (
    <div
      id={id}
      className="relative rounded-2xl overflow-hidden py-10 md:py-14 text-center"
    >
      <div className="max-w-[680px] mx-auto px-6">
        <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary text-xl font-bold mb-4">
          {number}
        </span>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-lg text-muted-foreground italic mt-3">{subtitle}</p>
        )}
        {isAdmin && onSubtitleChange && !subtitle && !editing && (
          <button onClick={() => setEditing(true)} className="mt-3 text-sm text-primary hover:underline">+ Add subtitle</button>
        )}
        {isAdmin && onSubtitleChange && editing && !subtitle && (
          <div className="mt-3 flex items-center gap-2 max-w-md mx-auto">
            <input className="flex-1 border rounded px-3 py-1.5 text-sm" placeholder="Enter subtitle…" value={draft} onChange={e => setDraft(e.target.value)} />
            <button className="text-sm font-medium text-primary" onClick={() => { if (draft.trim()) { onSubtitleChange(draft.trim()); setEditing(false); } }}>Save</button>
            <button className="text-sm text-muted-foreground" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

function KnowledgeBaseView({ onSelectArticle }: { onSelectArticle: (id: string) => void }) {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["kb-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_base_articles" as any)
        .select("id, title, sort_order, content, content_type, custom_key")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const firstArticle = articles.length > 0 ? articles[0] : null;

  const handleSelectArticle = (id: string) => {
    if (firstArticle && id === firstArticle.id) {
      const el = document.getElementById("kb-article-1-header");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    onSelectArticle(id);
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden p-8 md:p-12 text-center"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--secondary) / 0.12) 50%, hsl(var(--accent) / 0.08) 100%)",
        }}>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Knowledge Base</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Everything you need to know about creating great courses on Levoro Academy.
        </p>
      </div>

      {/* Articles grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">What you'll explore here</h2>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : articles.length === 0 ? (
          <p className="text-muted-foreground">No articles available yet.</p>
        ) : (
          <KbArticleCards articles={articles} onSelectArticle={handleSelectArticle} />
        )}
      </div>

      {/* Inline Article 1 content */}
      {firstArticle && (firstArticle.content || firstArticle.content_type === 'custom') && (
        <div className="space-y-6">
          <KbGradientBanner number={1} title={firstArticle.title} subtitle={firstArticle.custom_key === 'microlearning' ? "How to create learning that sticks, without overwhelming adult learners" : firstArticle.custom_key === 'brand-tone' ? "So your course feels like Levoro, not just content, but connection…" : undefined} id="kb-article-1-header" />
          {firstArticle.content_type === 'custom' && firstArticle.custom_key === 'microlearning' ? (
            <MicrolearningArticle />
          ) : firstArticle.content_type === 'custom' && firstArticle.custom_key === 'levoro-story' ? (
            <LevoroStoryArticle />
          ) : firstArticle.content_type === 'custom' && firstArticle.custom_key === 'brand-tone' ? (
            <BrandToneArticle />
          ) : firstArticle.content_type === 'custom' && firstArticle.custom_key === 'practical-guide' ? (
            <PracticalGuideArticle />
          ) : firstArticle.content_type === 'custom' && firstArticle.custom_key === 'quality-standards' ? (
            <QualityStandardsArticle />
          ) : firstArticle.content_type === 'custom' && firstArticle.custom_key === 'payment-reporting' ? (
            <PaymentReportingArticle />
          ) : firstArticle.content_type === 'custom' && firstArticle.custom_key === 'collaboration-visibility' ? (
            <CollaborationVisibilityArticle />
          ) : firstArticle.content_type === 'custom' && firstArticle.custom_key === 'visibility-reach' ? (
            <VisibilityReachArticle />
          ) : firstArticle.content_type === 'custom' && firstArticle.custom_key === 'lets-start-creating' ? (
            <LetsStartCreatingArticle />
          ) : firstArticle.content_type === 'custom' && firstArticle.custom_key === 'whiteboard-animations' ? (
            <WhiteboardAnimationsArticle />
          ) : firstArticle.content_type === 'custom' && firstArticle.custom_key === 'market-your-course' ? (
            <MarketYourCourseArticle />
          ) : (
            <div className="prose max-w-none" dangerouslySetInnerHTML={safeHtml(firstArticle.content)} />
          )}

          {/* Explore More at bottom of inline Article 1 */}
          {articles.length > 1 && (
            <div className="space-y-4 pt-8 border-t">
              <h2 className="text-2xl font-bold tracking-tight text-center">Explore More</h2>
              <KbArticleCards articles={articles} onSelectArticle={handleSelectArticle} excludeId={firstArticle.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KbArticleView({ articleId, onBack, onSelectArticle }: { articleId: string; onBack: () => void; onSelectArticle: (id: string) => void }) {
  const { data: article, isLoading } = useQuery({
    queryKey: ["kb-article", articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_base_articles" as any)
        .select("*")
        .eq("id", articleId)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: allArticles = [] } = useQuery({
    queryKey: ["kb-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_base_articles" as any)
        .select("id, title, sort_order")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (!article) return <p className="text-muted-foreground">Article not found.</p>;

  const articleIndex = allArticles.findIndex((a: any) => a.id === articleId);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Back to Knowledge Base
      </Button>
      <KbGradientBanner number={articleIndex >= 0 ? articleIndex + 1 : article.sort_order + 1} title={article.title} subtitle={article.custom_key === 'microlearning' ? "How to create learning that sticks, without overwhelming adult learners" : article.custom_key === 'brand-tone' ? "So your course feels like Levoro, not just content, but connection…" : undefined} />
      {article.content_type === 'custom' && article.custom_key === 'microlearning' ? (
        <MicrolearningArticle />
      ) : article.content_type === 'custom' && article.custom_key === 'levoro-story' ? (
        <LevoroStoryArticle />
      ) : article.content_type === 'custom' && article.custom_key === 'brand-tone' ? (
        <BrandToneArticle />
      ) : article.content_type === 'custom' && article.custom_key === 'practical-guide' ? (
        <PracticalGuideArticle />
      ) : article.content_type === 'custom' && article.custom_key === 'quality-standards' ? (
        <QualityStandardsArticle />
      ) : article.content_type === 'custom' && article.custom_key === 'payment-reporting' ? (
        <PaymentReportingArticle />
      ) : article.content_type === 'custom' && article.custom_key === 'collaboration-visibility' ? (
        <CollaborationVisibilityArticle />
      ) : article.content_type === 'custom' && article.custom_key === 'visibility-reach' ? (
        <VisibilityReachArticle />
      ) : article.content_type === 'custom' && article.custom_key === 'lets-start-creating' ? (
        <LetsStartCreatingArticle />
      ) : article.content_type === 'custom' && article.custom_key === 'whiteboard-animations' ? (
        <WhiteboardAnimationsArticle />
      ) : article.content_type === 'custom' && article.custom_key === 'market-your-course' ? (
        <MarketYourCourseArticle />
      ) : (
        <div className="prose max-w-none" dangerouslySetInnerHTML={safeHtml(article.content)} />
      )}

      {/* Explore More */}
      {allArticles.length > 1 && (
        <div className="space-y-4 pt-8 border-t">
          <h2 className="text-2xl font-bold tracking-tight text-center">Explore More</h2>
          <KbArticleCards articles={allArticles} onSelectArticle={onSelectArticle} excludeId={articleId} />
        </div>
      )}
    </div>
  );
}

const InstructorDashboard = () => {

  const { user, signOut } = useAuth();
  const { role } = useRole();
  const isAdmin = role === "admin";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { saveDraft, loadDraft, clearDraft } = useLocalStorageDraft();
  const { mode, companyId, companyName, isMember, setMode } = useInstructorContext();

  const initialViewParam = searchParams.get("tab");
  const initialView = isInstructorView(initialViewParam) ? initialViewParam : "courses";
  const initialCourseParam = searchParams.get("course");

  const [activeView, setActiveViewState] = useState<InstructorView>(initialView);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    initialView === "manage-lessons" ? initialCourseParam : null
  );
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [builderStep, setBuilderStep] = useState<BuilderStep>("details");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [certificateEnabled, setCertificateEnabled] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawThumbnailUrl, setRawThumbnailUrl] = useState("");
  const [previewVideoUrl, setPreviewVideoUrl] = useState("");
  const [courseDetails, setCourseDetails] = useState<any>({
    what_you_learn: [],
    target_audience: "",
    materials_included: [],
    requirements: "",
    show_requirements: false,
    custom_features: [],
  });
  const [lessonDrafts, setLessonDrafts] = useState<LessonDraft[]>([]);
  const [moduleDrafts, setModuleDrafts] = useState<ModuleDraft[]>([]);
  const [showNavGuard, setShowNavGuard] = useState(false);
  const [pendingView, setPendingView] = useState<InstructorView | null>(null);
  const [submitConfirmCourseId, setSubmitConfirmCourseId] = useState<string | null>(null);
  const [submitFromBuilder, setSubmitFromBuilder] = useState(false);
  const [selectedKbArticleId, setSelectedKbArticleId] = useState<string | null>(null);

  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState("");
  const [newLessonAudioUrl, setNewLessonAudioUrl] = useState("");
  const [newLessonBlocks, setNewLessonBlocks] = useState<ContentBlock[]>([]);
  const [newLessonModuleId, setNewLessonModuleId] = useState<string | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonVideoUrl, setEditLessonVideoUrl] = useState("");
   const [editLessonAudioUrl, setEditLessonAudioUrl] = useState("");
   const [editLessonModuleId, setEditLessonModuleId] = useState<string | null>(null);
  const [editLessonBlocks, setEditLessonBlocks] = useState<ContentBlock[]>([]);

  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleDescription, setNewModuleDescription] = useState("");
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [showAddModuleForm, setShowAddModuleForm] = useState(false);
  const [showAddLessonForm, setShowAddLessonForm] = useState(false);
  const [editingExistingModuleId, setEditingExistingModuleId] = useState<string | null>(null);
  const [editExistingModuleTitle, setEditExistingModuleTitle] = useState("");
  const [editExistingModuleDescription, setEditExistingModuleDescription] = useState("");
  const setActiveView = useCallback((view: InstructorView, courseId?: string | null) => {
    setActiveViewState(view);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", view);

    if (view === "manage-lessons") {
      const nextCourseId = courseId ?? selectedCourseId ?? null;
      setSelectedCourseId(nextCourseId);
      if (nextCourseId) nextParams.set("course", nextCourseId);
      else nextParams.delete("course");
    } else {
      nextParams.delete("course");
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, selectedCourseId, setSearchParams]);

  const isDirty = useMemo(() => {
    if (activeView === "builder") {
      if (editingCourseId) return true;
      return (
        title.trim() !== "" ||
        description.trim() !== "" ||
        lessonDrafts.length > 0 ||
        moduleDrafts.length > 0 ||
        newLessonTitle.trim() !== "" ||
        newLessonVideoUrl.trim() !== "" ||
        newLessonBlocks.length > 0 ||
        !!newLessonModuleId
      );
    }

    if (activeView === "manage-lessons" && editingLessonId) {
      return (
        editLessonTitle.trim() !== "" ||
        editLessonVideoUrl.trim() !== "" ||
        editLessonBlocks.length > 0
      );
    }

    return false;
  }, [
    activeView,
    editingCourseId,
    title,
    description,
    lessonDrafts,
    moduleDrafts,
    newLessonTitle,
    newLessonVideoUrl,
    newLessonBlocks,
    newLessonModuleId,
    editingLessonId,
    editLessonTitle,
    editLessonVideoUrl,
    editLessonBlocks,
  ]);

  useNavigationGuard(isDirty);

  const persistDraftSnapshot = useCallback(() => {
    if (!isDirty) return;

    saveDraft({
      title,
      description,
      thumbnailUrl,
      previewVideoUrl,
      courseDetails,
      lessonDrafts: lessonDrafts.map((l) => ({
        id: l.id,
        title: l.title,
        video_url: l.video_url,
        audio_url: l.audio_url,
        order_index: l.order_index,
        contentBlocks: l.contentBlocks,
        module_id: l.module_id || null,
      })),
      moduleDrafts,
      inProgressLesson: {
        title: newLessonTitle,
        video_url: newLessonVideoUrl,
        audio_url: newLessonAudioUrl,
        contentBlocks: newLessonBlocks,
        module_id: newLessonModuleId,
        editingDraftId,
      },
      editingLesson: editingLessonId
        ? {
            lessonId: editingLessonId,
            courseId: selectedCourseId,
            title: editLessonTitle,
            video_url: editLessonVideoUrl,
            audio_url: editLessonAudioUrl,
            contentBlocks: editLessonBlocks,
          }
        : null,
      activeView,
      selectedCourseId,
      builderStep,
      editingCourseId,
    });
  }, [
    isDirty,
    saveDraft,
    title,
    description,
    thumbnailUrl,
    previewVideoUrl,
    courseDetails,
    lessonDrafts,
    moduleDrafts,
    newLessonTitle,
    newLessonVideoUrl,
    newLessonBlocks,
    newLessonModuleId,
    editingDraftId,
    editingLessonId,
    selectedCourseId,
    editLessonTitle,
    editLessonVideoUrl,
    editLessonBlocks,
    activeView,
    builderStep,
    editingCourseId,
  ]);

  useEffect(() => {
    persistDraftSnapshot();
  }, [persistDraftSnapshot]);

  useEffect(() => {
    if (!isDirty) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistDraftSnapshot();
      }
    };

    window.addEventListener("blur", persistDraftSnapshot);
    window.addEventListener("pagehide", persistDraftSnapshot);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", persistDraftSnapshot);
      window.removeEventListener("pagehide", persistDraftSnapshot);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isDirty, persistDraftSnapshot]);

  useEffect(() => {
    const draft = loadDraft();
    if (!draft || editingCourseId) return;

    setTitle(draft.title || "");
    setDescription(draft.description || "");
    setThumbnailUrl(draft.thumbnailUrl || "");
    setPreviewVideoUrl(draft.previewVideoUrl || "");
    if (draft.courseDetails) {
      setCourseDetails(draft.courseDetails);
    }
    setLessonDrafts((draft.lessonDrafts || []).map((l) => ({
      id: l.id,
      title: l.title,
      video_url: l.video_url,
      audio_url: (l as any).audio_url || "",
      order_index: l.order_index,
      contentBlocks: l.contentBlocks || parseBlocks({ content: l.content, exercises: l.exercises }),
      module_id: l.module_id || null,
    })));
    setModuleDrafts((draft.moduleDrafts || []) as ModuleDraft[]);
    setBuilderStep("details");
    setEditingCourseId(draft.editingCourseId);

    setNewLessonTitle(draft.inProgressLesson?.title || "");
    setNewLessonVideoUrl(draft.inProgressLesson?.video_url || "");
    setNewLessonAudioUrl((draft.inProgressLesson as any)?.audio_url || "");
    setNewLessonBlocks((draft.inProgressLesson?.contentBlocks || []) as ContentBlock[]);
    setNewLessonModuleId(draft.inProgressLesson?.module_id || null);
    setEditingDraftId(draft.inProgressLesson?.editingDraftId || null);

    const tabFromUrl = searchParams.get("tab");
    if (!isInstructorView(tabFromUrl)) {
      const restoredView = isInstructorView(draft.activeView || null)
        ? draft.activeView
        : (draft.title || draft.lessonDrafts?.length || draft.inProgressLesson?.title ? "builder" : "courses");
      setActiveView(restoredView, draft.selectedCourseId || null);
    }

    const shouldRestoreLessonEditor =
      (isInstructorView(tabFromUrl) && tabFromUrl === "manage-lessons") ||
      (!isInstructorView(tabFromUrl) && draft.activeView === "manage-lessons");

    if (shouldRestoreLessonEditor && draft.editingLesson) {
      setSelectedCourseId(draft.editingLesson.courseId || draft.selectedCourseId || null);
      setEditingLessonId(draft.editingLesson.lessonId);
      setEditLessonTitle(draft.editingLesson.title || "");
      setEditLessonVideoUrl(draft.editingLesson.video_url || "");
      setEditLessonAudioUrl(draft.editingLesson.audio_url || "");
      setEditLessonBlocks((draft.editingLesson.contentBlocks || []) as ContentBlock[]);
    }
  }, []);

  useEffect(() => {
    if (isInstructorView(searchParams.get("tab"))) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", activeView);
    if (activeView === "manage-lessons" && selectedCourseId) {
      nextParams.set("course", selectedCourseId);
    } else {
      nextParams.delete("course");
    }
    setSearchParams(nextParams, { replace: true });
  }, [activeView, selectedCourseId, searchParams, setSearchParams]);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (!isInstructorView(tabFromUrl) || tabFromUrl === activeView) return;
    setActiveViewState(tabFromUrl);
  }, [searchParams, activeView]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.articleId) {
        setSelectedKbArticleId(detail.articleId);
        setActiveView("kb-article");
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }
    };
    window.addEventListener("kb:navigate", handler);
    return () => window.removeEventListener("kb:navigate", handler);
  }, [setActiveView]);

  useEffect(() => {
    if (activeView === "kb-article" && selectedKbArticleId) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }, [activeView, selectedKbArticleId]);

  useEffect(() => {
    if (activeView !== "manage-lessons") return;
    const courseFromUrl = searchParams.get("course");
    if (courseFromUrl !== selectedCourseId) {
      setSelectedCourseId(courseFromUrl);
    }
  }, [activeView, searchParams, selectedCourseId]);

  // Handle admin editing via query param
  const [adminEditLoaded, setAdminEditLoaded] = useState(false);
  useEffect(() => {
    const editCourseId = searchParams.get("editCourse");
    if (editCourseId && !adminEditLoaded) {
      setAdminEditLoaded(true);
      startEditCourse(editCourseId);

      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("editCourse");
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, adminEditLoaded, setSearchParams]);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["instructor-courses", user?.id, mode, companyId],
    queryFn: async () => {
      let q = supabase.from("courses").select("*").order("created_at", { ascending: false });
      if (mode === "company" && companyId) {
        q = q.eq("owner_type", "company").eq("owner_id", companyId);
      } else {
        // Personal: courses this user owns (legacy rows have owner_type='user' or null owner_id)
        q = q.eq("instructor_id", user!.id).neq("owner_type", "company");
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  const { data: lessons = [], refetch: refetchLessons } = useQuery({
    queryKey: ["course-lessons", selectedCourseId],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("*").eq("course_id", selectedCourseId!).order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCourseId,
    refetchOnWindowFocus: false,
  });

  const { data: existingModules = [], refetch: refetchModules } = useQuery({
    queryKey: ["course-modules-manage", selectedCourseId],
    queryFn: async () => {
      const { data, error } = await supabase.from("modules").select("*").eq("course_id", selectedCourseId!).order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCourseId,
    refetchOnWindowFocus: false,
  });

  const [expandedManageModules, setExpandedManageModules] = useState<Set<string>>(new Set());

  const resetBuilder = () => {
    setTitle(""); setDescription(""); setThumbnailUrl(""); setPreviewVideoUrl(""); setCertificateEnabled(false);
    setCourseDetails({ what_you_learn: [], target_audience: "", materials_included: [], requirements: "", show_requirements: false, custom_features: [] });
    setLessonDrafts([]); setModuleDrafts([]); setBuilderStep("details"); setEditingCourseId(null);
    setNewLessonTitle(""); setNewLessonVideoUrl(""); setNewLessonAudioUrl(""); setNewLessonBlocks([]); setNewLessonModuleId(null);
    setEditingDraftId(null); setNewModuleTitle(""); setNewModuleDescription(""); setEditingModuleId(null); clearDraft();
  };

  const tryChangeView = (v: InstructorView) => {
    if (isDirty && v !== activeView) { setPendingView(v); setShowNavGuard(true); }
    else { resetBuilder(); setEditingLessonId(null); setActiveView(v); }
  };

  const saveCourse = useMutation({
    mutationFn: async ({ status }: { status: "draft" | "pending_review"; openManageLessons?: boolean }) => {
      const courseData: any = { title, description, thumbnail_url: thumbnailUrl || null, preview_video_url: previewVideoUrl || null, status, course_details: courseDetails, certificate_enabled: certificateEnabled };
      let courseId: string;
      if (editingCourseId) {
        const { error } = await supabase.from("courses").update(courseData).eq("id", editingCourseId);
        if (error) throw error;
        courseId = editingCourseId;
      } else {
        const ownerFields = mode === "company" && companyId
          ? { owner_type: "company", owner_id: companyId }
          : { owner_type: "user", owner_id: user!.id };
        const { data, error } = await supabase.from("courses").insert({ ...courseData, ...ownerFields, instructor_id: user!.id }).select("id").single();
        if (error) throw error;
        courseId = data.id;
      }

      // Save modules
      await supabase.from("modules").delete().eq("course_id", courseId);
      if (moduleDrafts.length > 0) {
        const { error: me } = await supabase.from("modules").insert(
          moduleDrafts.map((m, idx) => ({ id: m.id, course_id: courseId, title: m.title, description: m.description || null, order_index: idx }))
        );
        if (me) throw me;
      }

      // Save lessons
      await supabase.from("lessons").delete().eq("course_id", courseId);
      if (lessonDrafts.length > 0) {
        const { error: le } = await supabase.from("lessons").insert(
          lessonDrafts.map((l, idx) => {
            const legacy = blocksToLegacy(l.contentBlocks);
            return {
              course_id: courseId, title: l.title, video_url: l.video_url || null,
              audio_url: l.audio_url || null,
              content: legacy.content, exercises: legacy.exercises,
              content_blocks: JSON.stringify(l.contentBlocks), order_index: idx,
              module_id: l.module_id || null,
            } as any;
          })
        );
        if (le) throw le;
      }
      return { courseId, status };
    },
    onSuccess: ({ courseId }, { status, openManageLessons }) => {
      toast.success(status === "draft" ? "Course saved as draft!" : "Course submitted for review!");

      if (openManageLessons) {
        setEditingCourseId(courseId);
        setActiveView("manage-lessons", courseId);
        setShowAddModuleForm(false);
        setShowAddLessonForm(false);
        queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
        queryClient.invalidateQueries({ queryKey: ["course-lessons", courseId] });
        queryClient.invalidateQueries({ queryKey: ["course-modules-manage", courseId] });
        return;
      }

      resetBuilder();
      if (isAdmin) {
        navigate("/admin");
      } else {
        setActiveView("courses");
      }
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-draft-courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-published-courses"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const moveToDraft = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase.from("courses").update({ status: "draft" as any, is_published: false }).eq("id", courseId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Course moved to draft!"); queryClient.invalidateQueries({ queryKey: ["instructor-courses"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const submitForReview = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase.from("courses").update({ status: "pending_review" as any }).eq("id", courseId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Course submitted for review!"); queryClient.invalidateQueries({ queryKey: ["instructor-courses"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteLesson = useMutation({
    mutationFn: async (lessonId: string) => { const { error } = await supabase.from("lessons").delete().eq("id", lessonId); if (error) throw error; },
    onSuccess: () => { toast.success("Lesson deleted"); refetchLessons(); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteModule = useMutation({
    mutationFn: async (moduleId: string) => {
      // Unassign lessons from this module first
      await supabase.from("lessons").update({ module_id: null } as any).eq("module_id", moduleId);
      const { error } = await supabase.from("modules").delete().eq("id", moduleId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Module deleted"); refetchModules(); refetchLessons(); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateModule = useMutation({
    mutationFn: async ({ moduleId, title, description }: { moduleId: string; title: string; description: string }) => {
      const { error } = await supabase.from("modules").update({ title, description: description || null } as any).eq("id", moduleId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Module updated"); setEditingExistingModuleId(null); refetchModules(); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateLesson = useMutation({
    mutationFn: async ({ lessonId, title, video_url, audio_url, contentBlocks, module_id }: { lessonId: string; title: string; video_url: string; audio_url: string; contentBlocks: ContentBlock[]; module_id?: string | null }) => {
      const legacy = blocksToLegacy(contentBlocks);
      const { error } = await supabase.from("lessons").update({
        title, video_url: video_url || null, audio_url: audio_url || null, content: legacy.content, exercises: legacy.exercises, content_blocks: JSON.stringify(contentBlocks),
        module_id: module_id !== undefined ? (module_id || null) : undefined,
      } as any).eq("id", lessonId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Lesson updated!"); setEditingLessonId(null); refetchLessons(); },
    onError: (e: any) => toast.error(e.message),
  });

  const addModuleToCourse = useMutation({
    mutationFn: async ({ title, description }: { title: string; description: string }) => {
      if (!selectedCourseId) throw new Error("No course selected");
      const { error } = await supabase.from("modules").insert({
        course_id: selectedCourseId,
        title,
        description: description || null,
        order_index: existingModules.length,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Module added");
      setNewModuleTitle("");
      setNewModuleDescription("");
      setShowAddModuleForm(false);
      refetchModules();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addLessonToCourse = useMutation({
    mutationFn: async ({
      title: lessonTitle,
      videoUrl,
      audioUrl,
      moduleId,
      contentBlocks,
    }: {
      title: string;
      videoUrl: string;
      audioUrl: string;
      moduleId: string | null;
      contentBlocks: ContentBlock[];
    }) => {
      if (!selectedCourseId) throw new Error("No course selected");
      const legacy = blocksToLegacy(contentBlocks);
      const { error } = await supabase.from("lessons").insert({
        course_id: selectedCourseId,
        title: lessonTitle,
        video_url: videoUrl || null,
        audio_url: audioUrl || null,
        content: legacy.content,
        exercises: legacy.exercises,
        content_blocks: JSON.stringify(contentBlocks),
        order_index: lessons.length,
        module_id: moduleId,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lesson added");
      setNewLessonTitle("");
      setNewLessonVideoUrl("");
      setNewLessonAudioUrl("");
      setNewLessonBlocks([]);
      setNewLessonModuleId(null);
      setShowAddLessonForm(false);
      refetchLessons();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reorderModules = async (nextModules: any[]) => {
    await Promise.all(
      nextModules.map((mod: any, idx: number) =>
        supabase.from("modules").update({ order_index: idx } as any).eq("id", mod.id)
      )
    );
    await refetchModules();
  };

  const moveModule = async (moduleId: string, dir: "up" | "down") => {
    const ordered = [...existingModules].sort((a: any, b: any) => a.order_index - b.order_index);
    const currentIndex = ordered.findIndex((m: any) => m.id === moduleId);
    const targetIndex = dir === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) return;

    [ordered[currentIndex], ordered[targetIndex]] = [ordered[targetIndex], ordered[currentIndex]];
    await reorderModules(ordered);
    toast.success("Module order updated");
  };

  const moveLessonWithinGroup = async (lessonId: string, dir: "up" | "down") => {
    const lesson = lessons.find((l: any) => l.id === lessonId);
    if (!lesson) return;

    const siblings = lessons
      .filter((l: any) => (l.module_id || null) === (lesson.module_id || null))
      .sort((a: any, b: any) => a.order_index - b.order_index);

    const currentIndex = siblings.findIndex((l: any) => l.id === lessonId);
    const targetIndex = dir === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= siblings.length) return;

    const targetLesson = siblings[targetIndex];
    const currentOrder = lesson.order_index;
    const targetOrder = targetLesson.order_index;

    await Promise.all([
      supabase.from("lessons").update({ order_index: targetOrder } as any).eq("id", lesson.id),
      supabase.from("lessons").update({ order_index: currentOrder } as any).eq("id", targetLesson.id),
    ]);

    await refetchLessons();
    toast.success("Lesson order updated");
  };

  const handleLogout = async () => { await signOut(); navigate("/"); };

  const addModuleDraft = () => {
    if (!newModuleTitle.trim()) return;
    if (editingModuleId) {
      setModuleDrafts(moduleDrafts.map(m => m.id === editingModuleId ? { ...m, title: newModuleTitle, description: newModuleDescription } : m));
      setEditingModuleId(null);
    } else {
      setModuleDrafts([...moduleDrafts, { id: crypto.randomUUID(), title: newModuleTitle, description: newModuleDescription, order_index: moduleDrafts.length }]);
    }
    setNewModuleTitle("");
    setNewModuleDescription("");
  };

  const startEditModule = (mod: ModuleDraft) => {
    setEditingModuleId(mod.id);
    setNewModuleTitle(mod.title);
    setNewModuleDescription(mod.description || "");
  };

  const cancelEditModule = () => {
    setEditingModuleId(null);
    setNewModuleTitle("");
    setNewModuleDescription("");
  };

  const removeModuleDraft = (id: string) => {
    setModuleDrafts(moduleDrafts.filter(m => m.id !== id));
    setLessonDrafts(lessonDrafts.map(l => l.module_id === id ? { ...l, module_id: null } : l));
  };

  const addLessonDraft = () => {
    if (!newLessonTitle.trim()) return;
    setLessonDrafts([...lessonDrafts, { id: crypto.randomUUID(), title: newLessonTitle, video_url: newLessonVideoUrl, audio_url: newLessonAudioUrl, order_index: lessonDrafts.length, contentBlocks: newLessonBlocks, module_id: newLessonModuleId }]);
    setNewLessonTitle(""); setNewLessonVideoUrl(""); setNewLessonAudioUrl(""); setNewLessonBlocks([]); setNewLessonModuleId(null);
  };

  const removeLessonDraft = (id: string) => setLessonDrafts(lessonDrafts.filter(l => l.id !== id));
  const moveLessonDraft = (index: number, dir: "up" | "down") => {
    const ni = dir === "up" ? index - 1 : index + 1;
    if (ni < 0 || ni >= lessonDrafts.length) return;
    const n = [...lessonDrafts]; [n[index], n[ni]] = [n[ni], n[index]]; setLessonDrafts(n);
  };

  const startEditCourse = async (courseId: string) => {
    // Try local list first, then fetch from DB (needed for admin editing other instructors' courses)
    let course = courses.find((c: any) => c.id === courseId);
    if (!course) {
      const { data } = await supabase.from("courses").select("*").eq("id", courseId).single();
      if (!data) { toast.error("Course not found"); return; }
      course = data;
    }
    // Block editing for pending_review courses (instructors only, admins can still edit)
    if (course.status === "pending_review" && !isAdmin) {
      toast.error("This course is pending review and cannot be edited. Move it to draft first.");
      return;
    }
    setEditingCourseId(courseId); setTitle(course.title); setDescription(course.description || "");
    setThumbnailUrl(course.thumbnail_url || ""); setPreviewVideoUrl((course as any).preview_video_url || "");
    setCertificateEnabled((course as any).certificate_enabled || false);
    setCourseDetails((course as any).course_details || { what_you_learn: [], target_audience: "", materials_included: [], requirements: "", show_requirements: false, custom_features: [] });

    // Load modules
    const { data: existingModules } = await supabase.from("modules").select("*").eq("course_id", courseId).order("order_index", { ascending: true });
    if (existingModules) {
      setModuleDrafts(existingModules.map((m: any) => ({ id: m.id, title: m.title, description: m.description || "", order_index: m.order_index })));
    }

    const { data: existingLessons } = await supabase.from("lessons").select("*").eq("course_id", courseId).order("order_index", { ascending: true });
    if (existingLessons) {
      setLessonDrafts(existingLessons.map((l: any) => ({
        id: l.id, title: l.title, video_url: l.video_url || "", audio_url: l.audio_url || "", order_index: l.order_index,
        contentBlocks: parseBlocks(l), module_id: (l as any).module_id || null,
      })));
    }
    setBuilderStep("details"); setActiveView("builder");
  };

  const startEditLesson = (lesson: any) => {
    setEditingLessonId(lesson.id); setEditLessonTitle(lesson.title);
    setEditLessonVideoUrl(lesson.video_url || ""); setEditLessonAudioUrl(lesson.audio_url || ""); setEditLessonBlocks(parseBlocks(lesson));
    setEditLessonModuleId(lesson.module_id || null);
  };

  const startEditDraft = (draft: LessonDraft) => {
    setEditingDraftId(draft.id); setNewLessonTitle(draft.title);
    setNewLessonVideoUrl(draft.video_url); setNewLessonAudioUrl(draft.audio_url); setNewLessonBlocks([...draft.contentBlocks]);
    setNewLessonModuleId(draft.module_id || null);
  };

  const saveEditedDraft = () => {
    if (!editingDraftId || !newLessonTitle.trim()) return;
    setLessonDrafts(lessonDrafts.map(l => l.id === editingDraftId ? { ...l, title: newLessonTitle, video_url: newLessonVideoUrl, audio_url: newLessonAudioUrl, contentBlocks: newLessonBlocks, module_id: newLessonModuleId } : l));
    setEditingDraftId(null); setNewLessonTitle(""); setNewLessonVideoUrl(""); setNewLessonAudioUrl(""); setNewLessonBlocks([]); setNewLessonModuleId(null);
  };

  const cancelEditDraft = () => {
    setEditingDraftId(null); setNewLessonTitle(""); setNewLessonVideoUrl(""); setNewLessonAudioUrl(""); setNewLessonBlocks([]); setNewLessonModuleId(null);
  };

  const openPreview = (courseId: string) => {
    window.open(`/courses/${courseId}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalNavbar hideOnScroll={false} />
      <SidebarProvider>
        <div className="flex-1 flex w-full dashboard-sidebar-offset">
          <InstructorSidebar activeView={activeView} setActiveView={tryChangeView} onSelectKbArticle={(id) => { setSelectedKbArticleId(id); tryChangeView("kb-article"); }} selectedKbArticleId={selectedKbArticleId} />
          <div className="flex-1 flex flex-col">
            <header className="h-14 flex items-center border-b px-4 bg-card">
              <SidebarTrigger className="mr-4" />
              <span className="text-sm text-muted-foreground">Instructor Portal</span>
              {isMember && mode === "company" && companyName && (
                <div className="ml-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Viewing as <span className="font-medium text-foreground">{companyName}</span></span>
                  <button onClick={() => setMode("personal")} className="underline hover:text-foreground">Switch to personal</button>
                </div>
              )}
              <div className="ml-auto">
                <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            </header>
            <main className="flex-1 p-6 md:p-8">
              {activeView === "courses" && (
                <div className="space-y-6">
                  <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
                  {isLoading ? <p className="text-muted-foreground">Loading...</p> : courses.length === 0 ? <p className="text-muted-foreground">No courses yet.</p> : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {courses.map((c: any) => (
                        <Card key={c.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Course #{c.display_id}</div>
                                <CardTitle className="text-base">{c.title}</CardTitle>
                              </div>
                              <Badge variant={statusColors[c.status] as any}>{c.status.replace("_", " ")}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <p className="text-sm text-muted-foreground">{c.description || "No description"}</p>
                            <div className="flex gap-2 flex-wrap">
                              {(c.status !== "pending_review" || isAdmin) && (
                                <>
                                  <Button variant="outline" size="sm" className="flex-1" onClick={() => startEditCourse(c.id)}>Edit Course</Button>
                                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setActiveView("manage-lessons", c.id)}>Manage Lessons</Button>
                                </>
                              )}
                              <Button variant="outline" size="sm" onClick={() => openPreview(c.id)} className="gap-1"><Eye className="h-3.5 w-3.5" /> Preview</Button>
                              {c.status === "draft" && (
                                <Button variant="default" size="sm" onClick={() => setSubmitConfirmCourseId(c.id)} disabled={submitForReview.isPending} className="gap-1">
                                  <Send className="h-3.5 w-3.5" /> Submit for Review
                                </Button>
                              )}
                              {(c.status === "published" || c.status === "pending_review") && (
                                <Button variant="outline" size="sm" onClick={() => moveToDraft.mutate(c.id)} disabled={moveToDraft.isPending} className="gap-1">
                                  <ArchiveRestore className="h-3.5 w-3.5" /> Draft
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeView === "builder" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">{editingCourseId ? "Edit Course" : "Create Course"}</h1>
                    <p className="text-sm text-muted-foreground">Use Manage Lessons to update modules and lessons.</p>
                  </div>

                  {builderStep === "details" && (
                    <Card>
                      <CardHeader><CardTitle>Course Details</CardTitle><CardDescription>Basic information about your course</CardDescription></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="title">Course Title *</Label><InlineTitleEditor value={title} onChange={setTitle} placeholder="e.g., Introduction to Web Development" /></div>
                        <div className="space-y-2"><Label htmlFor="description">Description</Label><RichTextEditor value={description} onChange={setDescription} placeholder="Describe what students will learn..." /></div>
                        <div className="space-y-2">
                          <Label>Thumbnail</Label>
                          <MediaUpload value={thumbnailUrl} onChange={(url) => {
                            if (url && url.startsWith("http")) {
                              setRawThumbnailUrl(url);
                              setCropperOpen(true);
                            } else {
                              setThumbnailUrl(url);
                            }
                          }} accept="image/*" placeholder="Image URL or upload..." />
                          {thumbnailUrl && (
                            <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => { setRawThumbnailUrl(thumbnailUrl); setCropperOpen(true); }}>
                              <Pencil className="h-3 w-3 mr-1" /> Adjust Crop
                            </Button>
                          )}
                          <ThumbnailCropper
                            open={cropperOpen}
                            onClose={() => setCropperOpen(false)}
                            imageUrl={rawThumbnailUrl}
                            onCropped={(url) => setThumbnailUrl(url)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Preview Video</Label>
                          <MediaUpload value={previewVideoUrl} onChange={setPreviewVideoUrl} accept="video/*" placeholder="Video URL or upload..." />
                          <p className="text-xs text-muted-foreground">Video shown on the course preview page</p>
                        </div>

                        {/* Course Details Sections */}
                        <div className="space-y-4 border-t border-border pt-4">
                          <h3 className="font-semibold text-base">Course Card Details</h3>
                          <p className="text-xs text-muted-foreground">These sections appear on the course preview page sidebar</p>

                          {/* What Will I Learn */}
                          <div className="space-y-2">
                            <Label>What Will I Learn</Label>
                            <p className="text-xs text-muted-foreground">Bullet list of key learning outcomes</p>
                            {(courseDetails.what_you_learn || []).map((item: string, i: number) => (
                              <div key={i} className="flex gap-2 items-start">
                                <div className="flex-1">
                                  <InlineTitleEditor value={item} onChange={(html) => {
                                    const updated = [...(courseDetails.what_you_learn || [])];
                                    updated[i] = html;
                                    setCourseDetails({ ...courseDetails, what_you_learn: updated });
                                  }} placeholder="Learning outcome..." />
                                </div>
                                <Button variant="ghost" size="sm" className="mt-1" onClick={() => {
                                  const updated = (courseDetails.what_you_learn || []).filter((_: any, j: number) => j !== i);
                                  setCourseDetails({ ...courseDetails, what_you_learn: updated });
                                }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => setCourseDetails({ ...courseDetails, what_you_learn: [...(courseDetails.what_you_learn || []), ""] })} className="gap-1">
                              <PlusCircle className="h-3.5 w-3.5" /> Add Item
                            </Button>
                          </div>

                          {/* Target Audience */}
                          <div className="space-y-2">
                            <Label>Target Audience</Label>
                            <p className="text-xs text-muted-foreground">Description of who the course is designed for</p>
                            <RichTextEditor value={courseDetails.target_audience || ""} onChange={(html) => setCourseDetails({ ...courseDetails, target_audience: html })} placeholder="This course is ideal for..." />
                          </div>

                          {/* Materials Included */}
                          <div className="space-y-2">
                            <Label>Materials Included</Label>
                            <p className="text-xs text-muted-foreground">List of resources included in the course</p>
                            {(courseDetails.materials_included || []).map((item: string, i: number) => (
                              <div key={i} className="flex gap-2 items-start">
                                <div className="flex-1">
                                  <InlineTitleEditor value={item} onChange={(html) => {
                                    const updated = [...(courseDetails.materials_included || [])];
                                    updated[i] = html;
                                    setCourseDetails({ ...courseDetails, materials_included: updated });
                                  }} placeholder="Resource..." />
                                </div>
                                <Button variant="ghost" size="sm" className="mt-1" onClick={() => {
                                  const updated = (courseDetails.materials_included || []).filter((_: any, j: number) => j !== i);
                                  setCourseDetails({ ...courseDetails, materials_included: updated });
                                }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => setCourseDetails({ ...courseDetails, materials_included: [...(courseDetails.materials_included || []), ""] })} className="gap-1">
                              <PlusCircle className="h-3.5 w-3.5" /> Add Item
                            </Button>
                          </div>

                          {/* Requirements (optional) */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label>Requirements</Label>
                              <span className="text-xs text-muted-foreground">(optional)</span>
                              <label className="ml-auto flex items-center gap-1.5 text-xs cursor-pointer">
                                <input type="checkbox" checked={courseDetails.show_requirements || false} onChange={(e) => setCourseDetails({ ...courseDetails, show_requirements: e.target.checked })} className="rounded" />
                                Show section
                              </label>
                            </div>
                            {courseDetails.show_requirements && (
                              <RichTextEditor value={courseDetails.requirements || ""} onChange={(html) => setCourseDetails({ ...courseDetails, requirements: html })} placeholder="Prerequisites for learners..." />
                            )}
                          </div>

                          {/* Course Duration */}
                          <div className="space-y-2">
                            <Label>Course Duration</Label>
                            <p className="text-xs text-muted-foreground">Override the auto-calculated duration (e.g., "2h 30min", "6 weeks")</p>
                            <Input
                              value={courseDetails.duration || ""}
                              onChange={(e) => setCourseDetails({ ...courseDetails, duration: e.target.value })}
                              placeholder={`~${Math.max(1, Math.round(lessonDrafts.length * 0.25))}h (auto)`}
                            />
                          </div>

                          {/* Certificate Toggle (Admin only) */}
                          {isAdmin && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label className="flex items-center gap-1.5"><Award className="h-4 w-4 text-secondary" /> Certificate of Completion</Label>
                                  <p className="text-xs text-muted-foreground">Enable certificate download for students who complete this course</p>
                                </div>
                                <Switch checked={certificateEnabled} onCheckedChange={setCertificateEnabled} />
                              </div>
                            </div>
                          )}

                          {/* Custom features (free form) */}
                          <div className="space-y-2">
                            <Label>Additional Features</Label>
                            <p className="text-xs text-muted-foreground">Custom items shown on the course card (e.g., "Certificate of completion")</p>
                            {(courseDetails.custom_features || []).map((item: string, i: number) => (
                              <div key={i} className="flex gap-2 items-start">
                                <div className="flex-1">
                                  <InlineTitleEditor value={item} onChange={(html) => {
                                    const updated = [...(courseDetails.custom_features || [])];
                                    updated[i] = html;
                                    setCourseDetails({ ...courseDetails, custom_features: updated });
                                  }} placeholder="Feature..." />
                                </div>
                                <Button variant="ghost" size="sm" className="mt-1" onClick={() => {
                                  const updated = (courseDetails.custom_features || []).filter((_: any, j: number) => j !== i);
                                  setCourseDetails({ ...courseDetails, custom_features: updated });
                                }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => setCourseDetails({ ...courseDetails, custom_features: [...(courseDetails.custom_features || []), ""] })} className="gap-1">
                              <PlusCircle className="h-3.5 w-3.5" /> Add Item
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => saveCourse.mutate({ status: "draft" })} disabled={!title.trim() || saveCourse.isPending}>
                            <Save className="mr-2 h-4 w-4" /> Save Draft
                          </Button>
                          <Button
                            onClick={() => {
                              if (editingCourseId) {
                                setActiveView("manage-lessons", editingCourseId);
                                return;
                              }
                              saveCourse.mutate({ status: "draft", openManageLessons: true });
                            }}
                            disabled={!title.trim() || saveCourse.isPending}
                          >
                            Manage Lessons <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {builderStep === "curriculum" && (
                    <div className="space-y-4">
                      {/* Modules */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2"><FolderPlus className="h-5 w-5" /> Modules (Optional)</CardTitle>
                          <CardDescription>Organize your lessons into modules for better structure</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <InlineTitleEditor value={newModuleTitle} onChange={setNewModuleTitle} placeholder="Module title..." />
                              <Button variant="secondary" size="sm" onClick={addModuleDraft} disabled={!newModuleTitle.trim()} className="mt-2">
                                {editingModuleId ? "Save" : "Add Module"}
                              </Button>
                              {editingModuleId && (
                                <Button variant="outline" size="sm" onClick={cancelEditModule} className="mt-2">Cancel</Button>
                              )}
                            </div>
                            <Input
                              value={newModuleDescription}
                              onChange={(e) => setNewModuleDescription(e.target.value)}
                              placeholder="Module description (optional)..."
                              className="text-sm"
                            />
                          </div>
                          {moduleDrafts.map((mod, i) => (
                            <div key={mod.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <span className="text-sm font-medium">{i + 1}. {mod.title}</span>
                                {mod.description && <p className="text-xs text-muted-foreground">{mod.description}</p>}
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => startEditModule(mod)}><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => removeModuleDraft(mod.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Add / Edit Lesson */}
                      <Card>
                        <CardHeader>
                          <CardTitle>{editingDraftId ? "Edit Lesson" : "Add Lesson"}</CardTitle>
                          <CardDescription>Build your course curriculum with text, images, and interactive exercises</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2"><Label>Lesson Title *</Label><InlineTitleEditor value={newLessonTitle} onChange={setNewLessonTitle} placeholder="e.g., Getting Started" /></div>
                          <div className="space-y-2"><Label>Video URL</Label><Input placeholder="https://youtube.com/..." value={newLessonVideoUrl} onChange={(e) => setNewLessonVideoUrl(e.target.value)} /></div>
                          <div className="space-y-2">
                            <Label>Audio File</Label>
                            <MediaUpload value={newLessonAudioUrl} onChange={setNewLessonAudioUrl} accept="audio/*" placeholder="Audio URL or upload..." />
                          </div>
                          {moduleDrafts.length > 0 && (
                            <div className="space-y-2">
                              <Label>Module</Label>
                              <select className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                                value={newLessonModuleId || ""} onChange={(e) => setNewLessonModuleId(e.target.value || null)}>
                                <option value="">No module</option>
                                {moduleDrafts.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                              </select>
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Lesson Content</Label>
                            <BlockEditor blocks={newLessonBlocks} onChange={setNewLessonBlocks} />
                          </div>
                          {editingDraftId ? (
                            <div className="flex items-center gap-3">
                              <Button onClick={saveEditedDraft} disabled={!newLessonTitle.trim()} variant="secondary">Save Changes</Button>
                              <Button onClick={cancelEditDraft} variant="outline">Cancel</Button>
                              <LessonCharCounter blocks={newLessonBlocks} />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Button onClick={addLessonDraft} disabled={!newLessonTitle.trim()} variant="secondary">Add Lesson</Button>
                              <LessonCharCounter blocks={newLessonBlocks} />
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {lessonDrafts.length > 0 && (
                        <Card>
                          <CardHeader><CardTitle>Curriculum ({lessonDrafts.length} lessons)</CardTitle></CardHeader>
                          <CardContent className="space-y-2">
                            {lessonDrafts.map((lesson, index) => {
                              const mod = moduleDrafts.find(m => m.id === lesson.module_id);
                              return (
                                <div key={lesson.id} className="flex items-center gap-2 p-3 rounded-md border bg-muted/30">
                                  <div className="flex flex-col gap-1">
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveLessonDraft(index, "up")} disabled={index === 0}><ChevronLeft className="h-4 w-4 rotate-90" /></Button>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveLessonDraft(index, "down")} disabled={index === lessonDrafts.length - 1}><ChevronRight className="h-4 w-4 rotate-90" /></Button>
                                  </div>
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{index + 1}. {lesson.title}</p>
                                    {mod && <p className="text-xs text-primary">{mod.title}</p>}
                                    {lesson.contentBlocks.length > 0 && <p className="text-xs text-secondary">{lesson.contentBlocks.length} block(s)</p>}
                                    {lesson.video_url && <p className="text-xs text-muted-foreground truncate">{lesson.video_url}</p>}
                                  </div>
                                  <Button variant="ghost" size="sm" onClick={() => startEditDraft(lesson)}><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                                  <Button variant="ghost" size="sm" onClick={() => removeLessonDraft(lesson.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      )}

                      <div className="flex items-center justify-between pt-4">
                        <Button variant="outline" onClick={() => setBuilderStep("details")}><ChevronLeft className="mr-2 h-4 w-4" /> Back</Button>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => saveCourse.mutate({ status: "draft" })} disabled={!title.trim() || saveCourse.isPending}><Save className="mr-2 h-4 w-4" />Save Draft</Button>
                          <Button onClick={() => { setSubmitFromBuilder(true); setSubmitConfirmCourseId("builder"); }} disabled={!title.trim() || saveCourse.isPending}><Send className="mr-2 h-4 w-4" />Submit for Review</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeView === "knowledge-base" && (
                <KnowledgeBaseView onSelectArticle={(id: string) => { setSelectedKbArticleId(id); setActiveView("kb-article"); }} />
              )}

              {activeView === "kb-article" && selectedKbArticleId && (
                <KbArticleView articleId={selectedKbArticleId} onBack={() => setActiveView("knowledge-base")} onSelectArticle={(id: string) => { setSelectedKbArticleId(id); }} />
              )}

              {activeView === "students" && (
                <div className="space-y-6">
                  <h1 className="text-3xl font-bold tracking-tight">Students</h1>
                  <p className="text-muted-foreground">Student enrollment tracking coming soon.</p>
                </div>
              )}

              {activeView === "profile" && (
                mode === "company" && companyId
                  ? <CompanyProfileEditor companyId={companyId} />
                  : <InstructorProfileEditor userId={user!.id} />
              )}

              {activeView === "analytics" && <CourseAnalytics />}

              {activeView === "manage-lessons" && selectedCourseId && (() => {
                const orderedModules = [...existingModules].sort((a: any, b: any) => a.order_index - b.order_index);

                const renderLessonCard = (lesson: any, index: number, totalInGroup: number) => (
                  <Card key={lesson.id}>
                    {editingLessonId === lesson.id ? (
                      <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2"><Label>Lesson Title *</Label><InlineTitleEditor value={editLessonTitle} onChange={setEditLessonTitle} placeholder="Lesson title" /></div>
                        <div className="space-y-2"><Label>Video URL</Label><Input value={editLessonVideoUrl} onChange={(e) => setEditLessonVideoUrl(e.target.value)} /></div>
                        <div className="space-y-2">
                          <Label>Audio File</Label>
                          <MediaUpload value={editLessonAudioUrl} onChange={setEditLessonAudioUrl} accept="audio/*" placeholder="Audio URL or upload..." />
                        </div>
                        {orderedModules.length > 0 && (
                          <div className="space-y-2">
                            <Label>Assign to Module</Label>
                            <select className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background" value={editLessonModuleId || ""} onChange={(e) => setEditLessonModuleId(e.target.value || null)}>
                              <option value="">No module</option>
                              {orderedModules.map((mod: any) => <option key={mod.id} value={mod.id}>{mod.title}</option>)}
                            </select>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Lesson Content</Label>
                          <BlockEditor blocks={editLessonBlocks} onChange={setEditLessonBlocks} />
                        </div>
                        <LessonFilesManager lessonId={lesson.id} />
                        <div className="flex items-center gap-3">
                          <Button onClick={() => updateLesson.mutate({ lessonId: lesson.id, title: editLessonTitle, video_url: editLessonVideoUrl, audio_url: editLessonAudioUrl, contentBlocks: editLessonBlocks, module_id: editLessonModuleId })} disabled={!editLessonTitle.trim() || updateLesson.isPending} size="sm">
                            <Save className="mr-2 h-4 w-4" /> Save
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditingLessonId(null)}>Cancel</Button>
                          <Button variant="outline" size="sm" onClick={() => window.open(`/course/${selectedCourseId}?lesson=${lesson.id}`, "_blank", "noopener,noreferrer")} className="gap-1"><Eye className="h-3.5 w-3.5" /> Preview</Button>
                          <LessonCharCounter blocks={editLessonBlocks} />
                        </div>
                      </CardContent>
                    ) : (
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{lesson.order_index + 1}. {lesson.title}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">{lesson.content ? stripHtml(lesson.content).substring(0, 150) || "No content" : "No content"}</CardDescription>
                          </div>
                          <div className="flex gap-1 items-center">
                            <div className="flex flex-col gap-1">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveLessonWithinGroup(lesson.id, "up")} disabled={index === 0}><ChevronLeft className="h-4 w-4 rotate-90" /></Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveLessonWithinGroup(lesson.id, "down")} disabled={index === totalInGroup - 1}><ChevronRight className="h-4 w-4 rotate-90" /></Button>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => startEditLesson(lesson)}><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => window.open(`/course/${selectedCourseId}?lesson=${lesson.id}`, "_blank", "noopener,noreferrer")}><Eye className="h-4 w-4 text-muted-foreground" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteLesson.mutate(lesson.id)} disabled={deleteLesson.isPending}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </div>
                      </CardHeader>
                    )}
                  </Card>
                );

                return (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-bold tracking-tight">Manage Lessons</h1>
                        <p className="text-muted-foreground mt-1">{courses.find((c: any) => c.id === selectedCourseId)?.title}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setShowAddModuleForm((prev) => !prev)}><FolderPlus className="mr-2 h-4 w-4" />Add Module</Button>
                        <Button variant="secondary" onClick={() => setShowAddLessonForm((prev) => !prev)}><PlusCircle className="mr-2 h-4 w-4" />Add Lesson</Button>
                        <Button variant="outline" onClick={() => setActiveView("courses")}>Back to Courses</Button>
                      </div>
                    </div>

                    {showAddModuleForm && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Add New Module</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <Label>Module Title *</Label>
                            <Input value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} placeholder="Module title" />
                          </div>
                          <div className="space-y-2">
                            <Label>Module Description</Label>
                            <Input value={newModuleDescription} onChange={(e) => setNewModuleDescription(e.target.value)} placeholder="Optional description" />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowAddModuleForm(false)}>Cancel</Button>
                            <Button onClick={() => addModuleToCourse.mutate({ title: newModuleTitle, description: newModuleDescription })} disabled={!newModuleTitle.trim() || addModuleToCourse.isPending}>
                              <Save className="mr-2 h-4 w-4" /> Save Module
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {showAddLessonForm && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Add New Lesson</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2"><Label>Lesson Title *</Label><Input value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} placeholder="Lesson title" /></div>
                          <div className="space-y-2"><Label>Video URL</Label><Input value={newLessonVideoUrl} onChange={(e) => setNewLessonVideoUrl(e.target.value)} placeholder="https://..." /></div>
                          <div className="space-y-2">
                            <Label>Audio File</Label>
                            <MediaUpload value={newLessonAudioUrl} onChange={setNewLessonAudioUrl} accept="audio/*" placeholder="Audio URL or upload..." />
                          </div>
                          <div className="space-y-2">
                            <Label>Assign to Module</Label>
                            <select className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background" value={newLessonModuleId || ""} onChange={(e) => setNewLessonModuleId(e.target.value || null)}>
                              <option value="">No module</option>
                              {orderedModules.map((mod: any) => <option key={mod.id} value={mod.id}>{mod.title}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Lesson Content</Label>
                            <BlockEditor blocks={newLessonBlocks} onChange={setNewLessonBlocks} />
                          </div>
                          <div className="flex items-center gap-3 justify-end">
                            <LessonCharCounter blocks={newLessonBlocks} />
                            <Button variant="outline" onClick={() => setShowAddLessonForm(false)}>Cancel</Button>
                            <Button
                              onClick={() => addLessonToCourse.mutate({
                                title: newLessonTitle,
                                videoUrl: newLessonVideoUrl,
                                audioUrl: newLessonAudioUrl,
                                moduleId: newLessonModuleId,
                                contentBlocks: newLessonBlocks,
                              })}
                              disabled={!newLessonTitle.trim() || addLessonToCourse.isPending}
                            >
                              <Save className="mr-2 h-4 w-4" /> Save Lesson
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="space-y-4">
                      {orderedModules.length > 0 && (
                        <div className="space-y-3">
                          {orderedModules.map((mod: any, moduleIndex: number) => {
                            const moduleLessons = lessons
                              .filter((l: any) => l.module_id === mod.id)
                              .sort((a: any, b: any) => a.order_index - b.order_index);
                            const isExpanded = expandedManageModules.has(mod.id);
                            return (
                              <div key={mod.id} className="border border-border rounded-xl overflow-hidden">
                                {editingExistingModuleId === mod.id ? (
                                  <div className="p-4 bg-muted/30 space-y-3">
                                    <div className="space-y-2">
                                      <Label>Module Title *</Label>
                                      <Input value={editExistingModuleTitle} onChange={(e) => setEditExistingModuleTitle(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Module Description</Label>
                                      <Input value={editExistingModuleDescription} onChange={(e) => setEditExistingModuleDescription(e.target.value)} placeholder="Optional description" />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                      <Button variant="outline" size="sm" onClick={() => setEditingExistingModuleId(null)}>Cancel</Button>
                                      <Button size="sm" onClick={() => updateModule.mutate({ moduleId: mod.id, title: editExistingModuleTitle, description: editExistingModuleDescription })} disabled={!editExistingModuleTitle.trim() || updateModule.isPending}>
                                        <Save className="mr-2 h-4 w-4" /> Save
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                <>
                                <button
                                  onClick={() => setExpandedManageModules(prev => { const n = new Set(prev); n.has(mod.id) ? n.delete(mod.id) : n.add(mod.id); return n; })}
                                  className="w-full flex items-center gap-3 p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                                >
                                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                  <div className="flex-1">
                                    <p className="font-semibold text-foreground">{mod.title}</p>
                                    {mod.description && <p className="text-xs text-muted-foreground">{mod.description}</p>}
                                  </div>
                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => moveModule(mod.id, "up")} disabled={moduleIndex === 0}><ChevronLeft className="h-4 w-4 rotate-90" /></Button>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => moveModule(mod.id, "down")} disabled={moduleIndex === orderedModules.length - 1}><ChevronRight className="h-4 w-4 rotate-90" /></Button>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditingExistingModuleId(mod.id); setEditExistingModuleTitle(mod.title); setEditExistingModuleDescription(mod.description || ""); }}><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => deleteModule.mutate(mod.id)} disabled={deleteModule.isPending}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                  </div>
                                  <span className="text-xs text-muted-foreground">{moduleLessons.length} lesson{moduleLessons.length !== 1 ? "s" : ""}</span>
                                </button>
                                </>
                                )}
                                {isExpanded && editingExistingModuleId !== mod.id && (
                                  <div className="p-3 space-y-2">
                                    {moduleLessons.length === 0
                                      ? <p className="text-sm text-muted-foreground p-2">No lessons in this module.</p>
                                      : moduleLessons.map((lesson: any, index: number) => renderLessonCard(lesson, index, moduleLessons.length))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {(() => {
                        const unmoduled = lessons
                          .filter((l: any) => !l.module_id)
                          .sort((a: any, b: any) => a.order_index - b.order_index);
                        if (unmoduled.length === 0 && orderedModules.length > 0) return null;
                        if (unmoduled.length === 0 && orderedModules.length === 0) return <p className="text-muted-foreground">No lessons yet.</p>;
                        return (
                          <div className="space-y-2">
                            {orderedModules.length > 0 && <h3 className="text-sm font-medium text-muted-foreground">Unassigned Lessons</h3>}
                            {unmoduled.map((lesson: any, index: number) => renderLessonCard(lesson, index, unmoduled.length))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })()}
            </main>
          </div>
        </div>

        <AlertDialog open={!!submitConfirmCourseId} onOpenChange={(open) => { if (!open) { setSubmitConfirmCourseId(null); setSubmitFromBuilder(false); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit for Review?</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to submit this course for review? You won't be able to edit it while it's pending review.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                if (submitFromBuilder) {
                  saveCourse.mutate({ status: "pending_review" });
                } else if (submitConfirmCourseId) {
                  submitForReview.mutate(submitConfirmCourseId);
                }
                setSubmitConfirmCourseId(null);
                setSubmitFromBuilder(false);
              }}>Submit</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showNavGuard} onOpenChange={setShowNavGuard}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>You have unsaved changes. Are you sure you want to leave?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Stay</AlertDialogCancel>
              <AlertDialogAction onClick={() => { resetBuilder(); setEditingLessonId(null); if (pendingView) { setActiveView(pendingView); setPendingView(null); } setShowNavGuard(false); }}>Leave</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarProvider>
    </div>
  );
};

const InstructorDashboardWithContext = () => (
  <InstructorContextProvider>
    <InstructorDashboard />
  </InstructorContextProvider>
);

export default InstructorDashboardWithContext;
