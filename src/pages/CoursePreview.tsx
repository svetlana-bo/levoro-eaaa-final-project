import SEOHead from "@/components/SEOHead";
import { safeHtml, stripHtml } from "@/lib/sanitize";
import { useParams, useNavigate, Link } from "react-router-dom";
import { BlockRenderer } from "@/components/lesson-player/BlockRenderer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock, Play, CheckCircle, Clock, BookOpen, Users, Star, ChevronDown, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMembershipPlans } from "@/hooks/useMembershipPlans";
import { useCurrency } from "@/hooks/useCurrency";
import { useRole } from "@/hooks/useRole";

// Strip inline font-size from all elements in a rich-text snippet so the
// course preview body sizing stays consistent regardless of authored spans.
const normalizeRichText = (html: string): string => {
  if (typeof window === "undefined" || !html) return html;
  try {
    const tpl = document.createElement("template");
    tpl.innerHTML = html;
    tpl.content.querySelectorAll<HTMLElement>("[style*='font-size']").forEach((el) => {
      el.style.removeProperty("font-size");
    });
    return tpl.innerHTML;
  } catch {
    return html;
  }
};

const CoursePreview = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, session, loading: authLoading } = useAuth();
  const { role } = useRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [previewLessonId, setPreviewLessonId] = useState<string | null>(null);
  const previewContentRef = useRef<HTMLDivElement | null>(null);

  const courseQuery = useQuery({
    queryKey: ["course-preview", courseId, session?.user?.id ?? "anon"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId && !authLoading,
  });
  const course = courseQuery.data;
  const isLoading = courseQuery.isLoading || courseQuery.isFetching;

  // Outline (id/title/order/module) — visible to anon for full curriculum preview
  const { data: lessons = [] } = useQuery({
    queryKey: ["course-lessons-outline", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_course_lesson_outline", { _course_id: courseId! });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!courseId,
  });

  // Full lesson rows (content/video) — gated by RLS; anon only sees the first lesson
  const { data: lessonsFull = [] } = useQuery({
    queryKey: ["course-lessons-full", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title, content, content_blocks, video_url")
        .eq("course_id", courseId!)
        .order("order_index");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!courseId,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["course-modules-preview", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("id, title, description, order_index")
        .eq("course_id", courseId!)
        .order("order_index");
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const { data: profile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_status, first_name, last_name")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["user-enrollment", courseId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", courseId!)
        .eq("student_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!courseId,
  });

  const { data: instructorProfile } = useQuery({
    queryKey: ["instructor-profile", course?.instructor_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("instructor_public_profiles" as any)
        .select("first_name, last_name, avatar_url, bio")
        .eq("id", course!.instructor_id)
        .maybeSingle();
      return data as unknown as { first_name: string | null; last_name: string | null; avatar_url: string | null; bio: string | null } | null;
    },
    enabled: !!course?.instructor_id,
  });

  const ownerCompanyId = (course as any)?.owner_type === "company" ? (course as any)?.owner_id : null;
  const { data: ownerCompany } = useQuery({
    queryKey: ["course-owner-company", ownerCompanyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("instructor_companies")
        .select("id, name, logo_url")
        .eq("id", ownerCompanyId!)
        .maybeSingle();
      return data as { id: string; name: string; logo_url: string | null } | null;
    },
    enabled: !!ownerCompanyId,
  });

  const { data: courseReviews = [] } = useQuery({
    queryKey: ["course-reviews-preview", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_reviews")
        .select("rating, review_text, created_at, student_id, reviewer_name, review_date, source")
        .eq("course_id", courseId!)
        .eq("is_approved", true)
        .order("review_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const averageRating = courseReviews.length > 0
    ? courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length
    : 0;

  const { data: plans = [] } = useMembershipPlans();
  const { formatPrice } = useCurrency();
  const cheapestPlan = plans.length > 0 ? plans.reduce((a, b) => a.price_eur < b.price_eur ? a : b) : null;

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("enrollments")
        .insert({ course_id: courseId!, student_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-enrollment"] });
      toast.success("Enrolled successfully!");
      navigate(`/course/${courseId}`);
    },
    onError: () => toast.error("Failed to enroll."),
  });

  const isSubscribed = profile?.subscription_status === "active";
  const isEnrolled = !!enrollment;
  const isFree = course?.is_free;
  const isSubscriptionCourse = course?.access_type === "subscription";
  const isOwner = !!user && !!course && course.instructor_id === user.id;
  const isPrivileged = isOwner || role === "admin" || role === "webadmin";

  const orderedLessonsForPreview = useMemo(() => {
    if (modules.length === 0) return lessons;

    const byModules = modules.flatMap((mod: any) =>
      lessons
        .filter((lesson: any) => lesson.module_id === mod.id)
        .sort((a: any, b: any) => a.order_index - b.order_index)
    );

    const unmoduled = lessons
      .filter((lesson: any) => !lesson.module_id)
      .sort((a: any, b: any) => a.order_index - b.order_index);

    return [...byModules, ...unmoduled];
  }, [lessons, modules]);

  // First lesson is always previewable if it exists
  const firstLesson = orderedLessonsForPreview.length > 0 ? orderedLessonsForPreview[0] : null;
  const isFirstLesson = (lessonId: string) => firstLesson?.id === lessonId;

  useEffect(() => {
    if (previewLessonId && previewContentRef.current) {
      previewContentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [previewLessonId]);

  const handleCTA = () => {
    if (isPrivileged) {
      navigate(`/course/${courseId}`);
      return;
    }
    if (!user) {
      navigate("/signup");
      return;
    }
    if (isFree) {
      if (isEnrolled) {
        navigate(`/course/${courseId}`);
      } else {
        enrollMutation.mutate();
      }
      return;
    }
    if (isSubscriptionCourse) {
      if (isSubscribed) {
        if (isEnrolled) {
          navigate(`/course/${courseId}`);
        } else {
          enrollMutation.mutate();
        }
      } else {
        navigate("/memberships");
      }
      return;
    }
    // One-off purchase
    navigate(`/course/${courseId}`);
  };

  const getCtaLabel = () => {
    if (isPrivileged) return "Open Course";
    if (!user) return "Join Membership to Access";
    if (isFree) return isEnrolled ? "Continue Learning" : "Start Learning Now";
    if (isSubscriptionCourse) {
      if (isSubscribed) return isEnrolled ? "Go to Course" : "Start Learning Now";
      return "Upgrade to Access";
    }
    return "Enroll Now";
  };

  const instructorName = instructorProfile
    ? `${instructorProfile.first_name || ""} ${instructorProfile.last_name || ""}`.trim() || "Levoro Instructor"
    : "Levoro Instructor";
  const isCompanyOwner = !!ownerCompany;
  const displayName = isCompanyOwner ? ownerCompany!.name : instructorName;
  const displayAvatar = isCompanyOwner ? ownerCompany!.logo_url : instructorProfile?.avatar_url;

  if (authLoading || isLoading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageLayout>
    );
  }

  if (!course) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <h2 className="text-2xl font-bold">Course not found</h2>
          <Button variant="hero" asChild>
            <Link to="/courses">Browse Courses</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <SEOHead
        title={(course as any)?.meta_title || course?.title}
        description={(course as any)?.meta_description || stripHtml(course?.description)?.substring(0, 155) || undefined}
        canonicalPath={`/courses/${courseId}`}
      />
      {/* Hero */}
      <section className="bg-primary py-16 lg:py-24">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid lg:grid-cols-3 gap-10 items-start">
            <div className="lg:col-span-2 space-y-6">
              <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-xs uppercase tracking-wider">
                {isFree ? "Free Course" : isSubscriptionCourse ? "Subscription" : formatPrice(course.price_eur)}
              </Badge>
              <h1 className="text-3xl lg:text-5xl font-bold text-primary-foreground leading-tight">
                {course.title}
              </h1>
              {course.description ? (
                <div className="text-primary-foreground/70 text-lg max-w-xl prose prose-invert prose-sm [&_p]:mt-0 [&_p]:mb-2 [&_img]:max-w-full [&_img]:rounded-lg [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" dangerouslySetInnerHTML={safeHtml(course.description)} />
              ) : (
                <p className="text-primary-foreground/70 text-lg max-w-xl">Master new skills with this comprehensive course.</p>
              )}
              <div className="flex flex-wrap items-center gap-6 text-sm text-primary-foreground/60">
                <Link to={`/instructor/${isCompanyOwner ? ownerCompany!.id : course.instructor_id}`} className="flex items-center gap-2 hover:text-secondary transition-colors">
                  {displayAvatar ? (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={displayAvatar} />
                      <AvatarFallback className="text-xs">{displayName[0]}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                  By {displayName}
                </Link>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" /> {lessons.length} Lessons
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {(course as any).course_details?.duration || `~${Math.max(1, Math.round(lessons.length * 0.25))}h`}
                </span>
                {courseReviews.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-secondary text-secondary" /> {averageRating.toFixed(1)} ({courseReviews.length})
                  </span>
                )}
              </div>

              {/* Thumbnail placeholder */}
              <div className="aspect-video bg-primary-foreground/10 rounded-2xl flex items-center justify-center border border-primary-foreground/10 overflow-hidden">
                {(course as any).preview_video_url ? (
                  <iframe src={(course as any).preview_video_url} className="w-full h-full" allowFullScreen title={course.title} />
                ) : course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-primary-foreground/30">
                    <Play className="h-16 w-16 mx-auto mb-2" />
                    <p className="text-sm">Course Trailer</p>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Sidebar Card */}
            <div className="lg:sticky lg:top-24">
              <Card className="border-0 shadow-2xl bg-card">
                <CardContent className="p-8 space-y-6">
                  <div>
                    {isPrivileged ? (
                      <>
                        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Full Access</p>
                        <p className="text-base text-foreground">You have full access as {isOwner ? "the instructor" : "an admin"}.</p>
                      </>
                    ) : isFree ? (
                      <p className="text-3xl font-extrabold text-foreground">Free</p>
                    ) : isSubscriptionCourse ? (
                      <>
                        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Subscription Required</p>
                        <p className="text-3xl font-extrabold text-foreground">From {cheapestPlan ? formatPrice(cheapestPlan.price_eur, cheapestPlan.id) : formatPrice(19.90)}<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                      </>
                    ) : (
                      <p className="text-3xl font-extrabold text-foreground">{formatPrice(course.price_eur)}</p>
                    )}
                  </div>

                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full text-base"
                    onClick={handleCTA}
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending ? "Enrolling..." : getCtaLabel()}
                  </Button>

                  {/* Dynamic course details */}
                  {(() => {
                    const details = (course as any).course_details;
                    const hasDetails = details && (
                      (details.what_you_learn?.length > 0) ||
                      details.target_audience ||
                      (details.materials_included?.length > 0) ||
                      (details.show_requirements && details.requirements) ||
                      (details.custom_features?.length > 0)
                    );

                    if (hasDetails) {
                      return (
                        <div className="space-y-4 break-words overflow-hidden course-card-details">
                          {details.custom_features?.filter(Boolean).length > 0 && (
                            <div className="space-y-2 text-sm text-foreground">
                             {details.custom_features.filter(Boolean).map((f: string, i: number) => (
                                <div key={i} className="flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-slate-blue shrink-0 mt-0.5" />
                                  <div className="break-words overflow-hidden min-w-0 flex-1 text-sm [&_*]:!text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" dangerouslySetInnerHTML={safeHtml(normalizeRichText(f))} />
                                </div>
                              ))}
                            </div>
                          )}
                          {details.what_you_learn?.filter(Boolean).length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-foreground mb-2">What You'll Learn</p>
                              <ul className="space-y-1.5 text-sm text-foreground">
                                {details.what_you_learn.filter(Boolean).map((item: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                     <CheckCircle className="h-4 w-4 text-slate-blue shrink-0 mt-0.5" />
                                     <div className="break-words overflow-hidden min-w-0 flex-1 text-sm [&_*]:!text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" dangerouslySetInnerHTML={safeHtml(normalizeRichText(item))} />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {details.target_audience && (
                            <div>
                              <p className="text-sm font-semibold text-foreground mb-1">Target Audience</p>
                              <div
                                className="text-sm text-foreground prose prose-sm max-w-none break-words overflow-hidden [--tw-prose-body:inherit] [--tw-prose-headings:inherit] [--tw-prose-bold:inherit] [--tw-prose-links:inherit] [&_*]:!text-sm [&_p]:mt-0 [&_p]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-none [&_ul]:pl-0 [&_ul]:space-y-1.5 [&_ul]:my-0 [&_li]:relative [&_li]:pl-6 [&_li]:my-0 [&_li]:before:content-[''] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-1 [&_li]:before:h-4 [&_li]:before:w-4 [&_li]:before:bg-no-repeat [&_li]:before:bg-contain [&_li]:before:bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2224%22%20height=%2224%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%23d4a82a%22%20stroke-width=%222%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Ccircle%20cx=%2212%22%20cy=%2212%22%20r=%2210%22/%3E%3Cpath%20d=%22m9%2012%202%202%204-4%22/%3E%3C/svg%3E')]"
                                dangerouslySetInnerHTML={safeHtml(normalizeRichText(details.target_audience))}
                              />
                            </div>
                          )}
                          {details.materials_included?.filter(Boolean).length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-foreground mb-2">Materials Included</p>
                              <ul className="space-y-1.5 text-sm text-foreground">
                                {details.materials_included.filter(Boolean).map((item: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-slate-blue shrink-0 mt-0.5" />
                                    <div className="break-words overflow-hidden min-w-0 flex-1 text-sm [&_*]:!text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" dangerouslySetInnerHTML={safeHtml(normalizeRichText(item))} />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {details.show_requirements && details.requirements && (
                            <div>
                              <p className="text-sm font-semibold text-foreground mb-1">Requirements</p>
                              <div className="text-sm text-foreground prose prose-sm max-w-none break-words overflow-hidden [--tw-prose-body:inherit] [--tw-prose-headings:inherit] [--tw-prose-bold:inherit] [--tw-prose-links:inherit] [&_*]:!text-sm [&_p]:mt-0 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" dangerouslySetInnerHTML={safeHtml(normalizeRichText(details.requirements))} />
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Fallback: show default items if no course_details set
                    return (
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-slate-blue" /> Full lifetime access
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-slate-blue" /> Certificate of completion
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-slate-blue" /> Downloadable resources
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-slate-blue" /> Mobile-friendly
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="py-20 bg-background">
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold mb-2">Course Curriculum</h2>
          <p className="text-muted-foreground mb-10">{lessons.length} lessons to master this topic</p>

          {(() => {
            const hasModules = modules.length > 0;
            const unmoduledLessons = lessons.filter((l: any) => !l.module_id);
            const toggleModule = (id: string) => setExpandedModules(prev => {
              const next = new Set(prev);
              next.has(id) ? next.delete(id) : next.add(id);
              return next;
            });

            const renderLesson = (lesson: any, index: number) => {
              const canPreview = isPrivileged || isFirstLesson(lesson.id);
              const isUnlocked = isPrivileged || isFree || (isSubscribed && isSubscriptionCourse) || canPreview;
              return (
                <div
                  key={lesson.id}
                  className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{stripHtml(lesson.title)}</p>
                    <p className="text-xs text-muted-foreground">~5 min</p>
                  </div>
                  {canPreview ? (
                    <Button
                      variant="goldOutline"
                      size="sm"
                      onClick={() => setPreviewLessonId(previewLessonId === lesson.id ? null : lesson.id)}
                    >
                      <Play className="h-3 w-3 mr-1" /> Preview
                    </Button>
                  ) : isUnlocked ? (
                    <CheckCircle className="h-5 w-5 text-slate-blue flex-shrink-0" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
                  )}
                </div>
              );
            };

            let globalIndex = 0;

            return (
              <div className="space-y-3">
                {hasModules ? (
                  <>
                    {modules.map((mod: any) => {
                       const moduleLessons = lessons
                         .filter((l: any) => l.module_id === mod.id)
                         .sort((a: any, b: any) => a.order_index - b.order_index);
                      const isExpanded = expandedModules.has(mod.id);
                      const startIndex = globalIndex;
                      globalIndex += moduleLessons.length;
                      return (
                        <div key={mod.id} className="border border-border rounded-xl overflow-hidden">
                          <button
                            onClick={() => toggleModule(mod.id)}
                            className="w-full flex items-center gap-3 p-5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                          >
                            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                            <div className="flex-1 flex items-center gap-2">
                              <p className="font-semibold text-foreground">{mod.title}</p>
                              {mod.description && (
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                                      <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[300px] text-sm">
                                      {mod.description}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{moduleLessons.length} lesson{moduleLessons.length !== 1 ? "s" : ""}</span>
                          </button>
                          {isExpanded && (
                            <div className="p-3 space-y-2">
                              {moduleLessons.map((lesson: any, i: number) => renderLesson(lesson, startIndex + i))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {unmoduledLessons.length > 0 && (
                      <div className="space-y-2">
                        {unmoduledLessons.map((lesson: any) => {
                          const idx = globalIndex++;
                          return renderLesson(lesson, idx);
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  lessons.map((lesson: any, i: number) => renderLesson(lesson, i))
                )}
              </div>
            );
          })()}

          {/* Preview content for selected lesson */}
          {previewLessonId && (() => {
            const previewLesson = lessonsFull.find((l: any) => l.id === previewLessonId);
            if (!previewLesson) return null;
            return (
             <div ref={previewContentRef} className="mt-6 p-8 rounded-2xl border border-secondary/30 bg-card animate-fade-in">
                <h3 className="text-xl font-bold mb-4">{stripHtml(previewLesson.title)}</h3>
                {previewLesson.video_url && (
                  <div className="aspect-video bg-muted rounded-xl overflow-hidden mb-4">
                    <iframe
                      src={previewLesson.video_url}
                      className="w-full h-full"
                      allowFullScreen
                      title={stripHtml(previewLesson.title)}
                    />
                  </div>
                )}
                {(previewLesson as any).content_blocks && Array.isArray((previewLesson as any).content_blocks) && (previewLesson as any).content_blocks.length > 0 ? (
                  <BlockRenderer blocks={(previewLesson as any).content_blocks} />
                ) : previewLesson.content ? (
                  <div className="prose prose-sm max-w-none text-muted-foreground [&_p]:mt-0 [&_p]:mb-2 [&_img]:max-w-full [&_img]:rounded-lg [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5" dangerouslySetInnerHTML={safeHtml(previewLesson.content)} />
                ) : null}
              </div>
            );
          })()}

          {lessons.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Curriculum is being prepared. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Reviews */}
      {courseReviews.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="max-w-[1200px] mx-auto px-5">
            <h2 className="text-2xl font-bold mb-2">Student Reviews</h2>
            <p className="text-muted-foreground mb-8">
              {averageRating.toFixed(1)} average rating from {courseReviews.length} review{courseReviews.length !== 1 ? "s" : ""}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {courseReviews.map((review: any, i: number) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-4 w-4 ${s <= review.rating ? "fill-secondary text-secondary" : "text-muted-foreground/20"}`} />
                      ))}
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-foreground">{review.review_text}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {(review as any).reviewer_name ? `${(review as any).reviewer_name} · ` : ""}
                      {new Date((review as any).review_date || review.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="py-16 mesh-gradient">
        <div className="max-w-[600px] mx-auto px-5 text-center space-y-6">
          <h2 className="text-3xl font-bold text-primary">
            Ready to start learning?
          </h2>
          <p className="text-muted-foreground">
            Join thousands of professionals building real-world skills with Levoro Academy.
          </p>
          <Button variant="hero" size="lg" onClick={handleCTA}>
            {getCtaLabel()}
          </Button>
        </div>
      </section>
    </PageLayout>
  );
};

export default CoursePreview;
