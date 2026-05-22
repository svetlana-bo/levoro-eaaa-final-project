import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, Circle, ArrowLeft, ChevronDown, ChevronRight, ChevronLeft, Award, FileDown, Download, Info, Home, Lock } from "lucide-react";
import { toast } from "sonner";
import { BlockRenderer } from "@/components/lesson-player/BlockRenderer";
import { NotesButton, TextSelectionPopover } from "@/components/lesson-player/NotesSystem";
import { AudioPlayer } from "@/components/lesson-player/AudioPlayer";
import { parseBlocks } from "@/components/lesson-editor/types";
import { stripHtml } from "@/lib/sanitize";
import GlobalNavbar from "@/components/GlobalNavbar";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CourseCompletionDialog } from "@/components/CourseCompletionDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useRole } from "@/hooks/useRole";

function CourseSidebar({ lessons, modules, currentLessonId, onSelectLesson, isLessonCompleted, isLessonUnlocked }: {
  lessons: any[];
  modules: any[];
  currentLessonId: string | null;
  onSelectLesson: (id: string) => void;
  isLessonCompleted: (id: string) => boolean;
  isLessonUnlocked: (id: string) => boolean;
}) {
  const { state, isMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  const [openModules, setOpenModules] = useState<Set<string>>(new Set(modules.map((m: any) => m.id)));

  const toggleModule = (id: string) => {
    setOpenModules(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const moduleLessons = new Map<string | null, any[]>();
  for (const l of lessons) {
    const key = l.module_id || null;
    if (!moduleLessons.has(key)) moduleLessons.set(key, []);
    moduleLessons.get(key)!.push(l);
  }

  const renderLesson = (lesson: any, index: number) => {
    const completed = isLessonCompleted(lesson.id);
    const isActive = currentLessonId === lesson.id;
    const unlocked = isLessonUnlocked(lesson.id);
    const button = (
      <button
        key={lesson.id}
        onClick={() => unlocked && onSelectLesson(lesson.id)}
        disabled={!unlocked}
        className={`w-full text-left p-2.5 rounded-lg transition-colors text-sm ${
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border border-transparent"
            : unlocked
              ? "hover:bg-sidebar-accent/50 border border-transparent"
              : "border border-transparent opacity-50 cursor-not-allowed"
        }`}
      >
        <div className="flex items-start gap-2">
          {completed
            ? <CheckCircle className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
            : !unlocked
              ? <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              : <Circle className="h-4 w-4 text-primary-foreground shrink-0 mt-0.5" />}

          {!collapsed && <span className="break-words">{stripHtml(lesson.title)}</span>}
        </div>
      </button>
    );
    if (!unlocked && !collapsed) {
      return (
        <TooltipProvider key={lesson.id} delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>{button}</div>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Complete the previous lesson to unlock
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return button;
  };

  const unmoduledLessons = moduleLessons.get(null) || [];
  let globalIndex = 0;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent className="space-y-1 px-2">
            {modules.length > 0 ? (
              <>
                {modules.map((mod: any) => {
                  const modLessons = moduleLessons.get(mod.id) || [];
                  const startIndex = globalIndex;
                  globalIndex += modLessons.length;
                  return (
                    <Collapsible key={mod.id} open={openModules.has(mod.id)} onOpenChange={() => toggleModule(mod.id)}>
                      <CollapsibleTrigger className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-primary-foreground/10 text-sm font-semibold text-primary-foreground text-left">
                        {openModules.has(mod.id) ? <ChevronDown className="h-3.5 w-3.5 shrink-0 mt-0.5" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                        {!collapsed && (
                          <span className="line-clamp-2 flex-1 min-w-0 flex items-start gap-1.5 text-left">
                            {mod.title}
                            {mod.description && (
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-[250px] text-xs">
                                    {mod.description}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </span>
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-2 space-y-0.5">
                        {modLessons.map((l: any, i: number) => renderLesson(l, startIndex + i))}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
                {unmoduledLessons.length > 0 && (
                  <div className="space-y-0.5 pt-2">
                    {!collapsed && <p className="text-xs text-muted-foreground px-2 pb-1 uppercase tracking-wider">Other Lessons</p>}
                    {unmoduledLessons.map((l: any) => {
                      const idx = globalIndex++;
                      return renderLesson(l, idx);
                    })}
                  </div>
                )}
              </>
            ) : (
              lessons.map((lesson: any, index: number) => renderLesson(lesson, index))
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const CoursePlayer = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const { role, roleLoading } = useRole();
  const canBypassGating = !roleLoading && (role === "admin" || role === "webadmin" || role === "instructor");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const lessonParam = searchParams.get("lesson");
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(lessonParam);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionTriggered, setCompletionTriggered] = useState(false);

  // Read student preference for sidebar default
  const [sidebarDefault] = useState<boolean>(() => {
    try {
      const pref = localStorage.getItem("levoro_sidebar_default");
      return pref === null ? true : pref === "open";
    } catch { return true; }
  });

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").eq("id", courseId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["course-lessons", courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("*").eq("course_id", courseId!).order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["course-modules", courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from("modules").select("*").eq("course_id", courseId!).order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", user?.id, courseId],
    queryFn: async () => {
      const { data } = await supabase
        .from("enrollments")
        .select("completed_at")
        .eq("student_id", user!.id)
        .eq("course_id", courseId!)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!courseId,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["lesson-progress", user?.id, courseId],
    queryFn: async () => {
      const lessonIds = lessons.map(l => l.id);
      const { data, error } = await supabase.from("lesson_progress").select("*").eq("student_id", user!.id).in("lesson_id", lessonIds);
      if (error) throw error;
      return data;
    },
    enabled: !!user && lessons.length > 0,
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const existing = progress.find(p => p.lesson_id === lessonId);
      if (existing) {
        const { error } = await supabase.from("lesson_progress").update({ is_completed: true, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lesson_progress").insert({ student_id: user!.id, lesson_id: lessonId, is_completed: true, completed_at: new Date().toISOString() });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-progress"] });
      queryClient.invalidateQueries({ queryKey: ["student-stats"] });
      queryClient.invalidateQueries({ queryKey: ["enrolled-courses"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isLessonCompleted = (lessonId: string) => progress.some(p => p.lesson_id === lessonId && p.is_completed);

  const isLessonUnlocked = useCallback((lessonId: string) => {
    if (canBypassGating) return true;
    if (enrollment?.completed_at) return true;
    const idx = lessons.findIndex(l => l.id === lessonId);
    if (idx <= 0) return true;
    return progress.some(p => p.lesson_id === lessons[idx - 1].id && p.is_completed);
  }, [lessons, progress, enrollment?.completed_at, canBypassGating]);

  // Sync selectedLessonId to URL and handle initial load from param
  const selectLesson = useCallback((id: string | null) => {
    if (id && !canBypassGating && !enrollment?.completed_at) {
      const idx = lessons.findIndex(l => l.id === id);
      if (idx > 0) {
        const prevDone = progress.some(p => p.lesson_id === lessons[idx - 1].id && p.is_completed);
        if (!prevDone) {
          toast.error("Complete the previous lesson first");
          return;
        }
      }
    }
    setSelectedLessonId(id);
    if (id) {
      setSearchParams(prev => { prev.set("lesson", id); return prev; }, { replace: true });
      window.scrollTo({ top: 0, left: 0 });
    }
  }, [setSearchParams, lessons, progress, enrollment?.completed_at, canBypassGating]);

  // When lessons load and we have a param, use it (if unlocked); otherwise fall back to last unlocked lesson
  useEffect(() => {
    if (lessons.length > 0 && !selectedLessonId) {
      const fromParam = lessonParam && lessons.find(l => l.id === lessonParam);
      if (fromParam) {
        const idx = lessons.findIndex(l => l.id === fromParam.id);
        const unlocked = canBypassGating || idx <= 0 || progress.some(p => p.lesson_id === lessons[idx - 1].id && p.is_completed);
        if (unlocked) {
          setSelectedLessonId(fromParam.id);
        } else {
          let target = lessons[0].id;
          for (let i = 0; i < lessons.length; i++) {
            const done = progress.some(p => p.lesson_id === lessons[i].id && p.is_completed);
            if (done && i + 1 < lessons.length) target = lessons[i + 1].id;
            else if (!done) break;
          }
          setSelectedLessonId(target);
          setSearchParams(prev => { prev.set("lesson", target); return prev; }, { replace: true });
        }
      }
    }
  }, [lessons, lessonParam, selectedLessonId, progress, setSearchParams, canBypassGating]);

  const currentLesson = lessons.find(l => l.id === selectedLessonId) || lessons[0];
  const completedCount = lessons.filter(l => isLessonCompleted(l.id)).length;
  const progressPercentage = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  // Navigation helpers
  const currentIndex = currentLesson ? lessons.findIndex(l => l.id === currentLesson.id) : -1;
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  // Exercise files for current lesson
  const { data: lessonFiles = [] } = useQuery({
    queryKey: ["lesson-files", currentLesson?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("lesson_files" as any).select("*").eq("lesson_id", currentLesson!.id).order("created_at", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!currentLesson?.id,
  });

  const { data: profile } = useQuery({
    queryKey: ["user-profile-name", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("first_name, last_name").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: existingReview } = useQuery({
    queryKey: ["course-review-mine", courseId, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("course_reviews").select("id").eq("course_id", courseId!).eq("student_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user && !!courseId,
  });

  // Auto-mark enrollment as completed when all lessons done (skip for admins/instructors previewing)
  useEffect(() => {
    if (canBypassGating) return;
    if (progressPercentage === 100 && lessons.length > 0 && !completionTriggered) {
      setCompletionTriggered(true);
      // Update enrollment completed_at
      if (courseId && user) {
        supabase.from("enrollments")
          .update({ completed_at: new Date().toISOString() })
          .eq("course_id", courseId)
          .eq("student_id", user.id)
          .is("completed_at", null)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["enrolled-courses"] });
          });
        // Show completion dialog if no review yet
        if (!existingReview) {
          setShowCompletionDialog(true);
        }
        // Check if course has SQL exercises and notify about 30-day retention
        const hasSqlExercises = lessons.some(l => {
          try {
            const blocks = JSON.parse(typeof l.content_blocks === "string" ? l.content_blocks : JSON.stringify(l.content_blocks || []));
            return blocks.some((b: any) => b.type === "sqlExercise" && b.persistentDb);
          } catch { return false; }
        });
        if (hasSqlExercises) {
          toast.info("Your SQL queries have been saved to Notes. Practice databases will be deleted 30 days after completion.", { duration: 8000 });
        }
      }
    }
  }, [progressPercentage, lessons.length, completionTriggered, courseId, user, existingReview, lessons]);

  const studentName = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "Student";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GlobalNavbar hideOnScroll />
      <SidebarProvider defaultOpen={sidebarDefault}>
        <div className="flex-1 flex w-full">
          <CourseSidebar
            lessons={lessons}
            modules={modules}
            currentLessonId={currentLesson?.id || null}
            onSelectLesson={selectLesson}
            isLessonCompleted={isLessonCompleted}
            isLessonUnlocked={isLessonUnlocked}
          />
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top bar */}
            <header className="h-12 flex items-center border-b border-border px-4 bg-card shrink-0">
              <SidebarTrigger className="mr-3" />
              <Button variant="ghost" size="sm" onClick={() => navigate("/my-courses")} className="gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> My Courses
              </Button>
              <span className="text-muted-foreground/40 mx-1">|</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/courses/${courseId}`)} className="gap-1 text-xs text-muted-foreground hover:text-foreground min-w-0 shrink">
                    <Home className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{course?.title || "Course Home"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{course?.title || "Course Home"}</TooltipContent>
              </Tooltip>
              <div className="ml-auto flex items-center gap-3 shrink-0 pl-3">
                {progressPercentage === 100 && (
                  <Button variant="hero" size="sm" className="gap-1 text-xs" onClick={() => setShowCompletionDialog(true)}>
                    <Award className="h-3.5 w-3.5" /> {(course as any)?.certificate_enabled ? "Certificate & Review" : "Review"}
                  </Button>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{completedCount}/{lessons.length}</span>
                  <Progress value={progressPercentage} className="w-24 h-2 bg-muted [&>div]:bg-secondary" />
                  <span className="font-medium text-secondary">{progressPercentage}%</span>
                </div>
              </div>
            </header>

            {/* Main content */}
            <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full">
              {currentLesson ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-end">
                    <div className="flex items-center gap-2">
                      {lessonFiles.length > 0 && (
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5">
                              <FileDown className="h-4 w-4" /> Exercise Files
                            </Button>
                          </SheetTrigger>
                          <SheetContent>
                            <SheetHeader>
                              <SheetTitle>Exercise Files</SheetTitle>
                            </SheetHeader>
                            <div className="mt-4 space-y-2">
                              {lessonFiles.map((file: any) => (
                                <a
                                  key={file.id}
                                  href={file.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                                >
                                  <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                                    {file.file_size > 0 && (
                                      <p className="text-xs text-muted-foreground">
                                        {file.file_size > 1048576
                                          ? `${(file.file_size / 1048576).toFixed(1)} MB`
                                          : `${Math.round(file.file_size / 1024)} KB`}
                                      </p>
                                    )}
                                  </div>
                                </a>
                              ))}
                            </div>
                          </SheetContent>
                        </Sheet>
                      )}
                      {courseId && (
                        <NotesButton courseId={courseId} lessonId={currentLesson.id} lessonTitle={stripHtml(currentLesson.title)} />
                      )}
                    </div>
                  </div>
                  {currentLesson.video_url && (
                    <div className="aspect-video bg-muted rounded-xl overflow-hidden border border-border">
                      <iframe src={currentLesson.video_url} className="w-full h-full" allowFullScreen title={stripHtml(currentLesson.title)} />
                    </div>
                  )}
                  {(currentLesson as any).audio_url && (
                    <AudioPlayer src={(currentLesson as any).audio_url} title={stripHtml(currentLesson.title)} />
                  )}
                  <BlockRenderer key={currentLesson.id} blocks={parseBlocks(currentLesson)} courseId={courseId} lessonId={currentLesson.id} />
                  <Separator className="bg-border" />
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => prevLesson && selectLesson(prevLesson.id)}
                      disabled={!prevLesson}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <div className="min-w-[200px] flex justify-center">
                      {isLessonCompleted(currentLesson.id) ? (
                        <div
                          key="completed"
                          className="flex items-center gap-2 text-secondary animate-fade-in"
                        >
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Completed</span>
                        </div>
                      ) : (
                        <Button
                          key="mark"
                          onClick={() => markCompleteMutation.mutate(currentLesson.id)}
                          disabled={markCompleteMutation.isPending}
                          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground animate-fade-in"
                        >
                          <CheckCircle className="h-4 w-4" /> {markCompleteMutation.isPending ? "Marking..." : "Mark as Complete"}
                        </Button>
                      )}
                    </div>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0}>
                            <Button
                              variant={isLessonCompleted(currentLesson.id) && nextLesson ? "default" : "outline"}
                              size="sm"
                              onClick={() => nextLesson && isLessonCompleted(currentLesson.id) && selectLesson(nextLesson.id)}
                              disabled={!nextLesson || !isLessonCompleted(currentLesson.id)}
                              className="gap-1 transition-all duration-300"
                            >
                              Next <ChevronRight className="h-4 w-4" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {nextLesson && !isLessonCompleted(currentLesson.id) && (
                          <TooltipContent side="top" className="text-xs">
                            Mark this lesson complete to unlock the next one
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">Select a lesson to begin</p>
                </div>
              )}
            </main>
          </div>
        </div>
      </SidebarProvider>
      {courseId && currentLesson && (
        <TextSelectionPopover courseId={courseId} lessonId={currentLesson.id} />
      )}
      {courseId && course && (
        <CourseCompletionDialog
          open={showCompletionDialog}
          onOpenChange={setShowCompletionDialog}
          courseId={courseId}
          courseTitle={course.title}
          studentName={studentName}
          certificateEnabled={(course as any).certificate_enabled || false}
        />
      )}
    </div>
  );
};

export default CoursePlayer;
