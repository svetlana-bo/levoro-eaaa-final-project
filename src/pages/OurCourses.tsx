import { stripHtml } from "@/lib/sanitize";
import SEOHead from "@/components/SEOHead";
import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  BookOpen, CheckCircle, ArrowRight, Lock, Star,
  Crown, MessageCircle, TrendingUp, FolderKanban, Sparkles,
  BarChart3, Calculator, Monitor, Users, Rocket, ChevronLeft, ChevronRight,
  Clock, Award, FileText, Info, LayoutGrid, X,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const DURATION_BUCKETS: { id: string; label: string; min: number; max: number }[] = [
  { id: "0-1", label: "0–1 hour", min: 0, max: 1 },
  { id: "1-3", label: "1–3 hours", min: 1, max: 3 },
  { id: "3-5", label: "3–5 hours", min: 3, max: 5 },
  { id: "5-10", label: "5–10 hours", min: 5, max: 10 },
  { id: "10+", label: "10+ hours", min: 10, max: Infinity },
];

const parseDurationToHours = (raw: unknown): number | null => {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.toLowerCase();
  let hours = 0;
  let matched = false;
  const hMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:h(?:our|rs|r)?s?)\b/);
  if (hMatch) {
    hours += parseFloat(hMatch[1]);
    matched = true;
  }
  const mMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:m(?:in(?:ute)?s?)?)\b/);
  if (mMatch) {
    hours += parseFloat(mMatch[1]) / 60;
    matched = true;
  }
  if (!matched) {
    const num = s.match(/(\d+(?:\.\d+)?)/);
    if (num) hours = parseFloat(num[1]);
  }
  return hours > 0 ? hours : null;
};

const courseInBucket = (hours: number | null, bucketId: string): boolean => {
  if (hours === null) return false;
  const b = DURATION_BUCKETS.find((x) => x.id === bucketId);
  if (!b) return true;
  if (b.id === "10+") return hours >= 10;
  return hours >= b.min && hours < b.max;
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Crown, MessageCircle, TrendingUp, FolderKanban, Sparkles,
  BarChart3, Calculator, Monitor, Users, Rocket,
};

const OurCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const activeCategory = searchParams.get("category") || "all";
  const activeSubcategory = searchParams.get("subcategory") || null;
  const activeDuration = searchParams.get("duration") || "all";
  const [ctaDismissed, setCtaDismissed] = useState(
    typeof window !== "undefined" && sessionStorage.getItem("courses-cta-dismissed") === "1"
  );
  const dismissCta = () => {
    sessionStorage.setItem("courses-cta-dismissed", "1");
    setCtaDismissed(true);
  };

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["public-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["all-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: courseCategories = [] } = useQuery({
    queryKey: ["all-course-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("course_categories").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ["all-subcategories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subcategories").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: courseSubcategories = [] } = useQuery({
    queryKey: ["all-course-subcategories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("course_subcategories").select("*");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["user-profile-sub", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_end_date")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["user-enrollments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: approvedReviews = [] } = useQuery({
    queryKey: ["approved-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_reviews")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const studentIds = [...new Set(data.map((r: any) => r.student_id))];
      const courseIds = [...new Set(data.map((r: any) => r.course_id))];
      const [{ data: profiles }, { data: coursesData }] = await Promise.all([
        supabase.from("profiles").select("id, first_name, last_name").in("id", studentIds),
        supabase.from("courses").select("id, title").in("id", courseIds),
      ]);
      return data.map((r: any) => {
        const p = profiles?.find((p: any) => p.id === r.student_id);
        const c = coursesData?.find((c: any) => c.id === r.course_id);
        return {
          ...r,
          student_name: p ? `${p.first_name || ""}`.trim() || "Learner" : "Learner",
          course_title: c?.title || "Course",
        };
      });
    },
  });

  const isSubscribed = profile?.subscription_status === "active";
  const isEnrolled = (courseId: string) => enrollments.some((e) => e.course_id === courseId);

  const getAccessLabel = (course: any) => {
    if (course.is_free) return "Free";
    if (course.access_type === "subscription") return "Subscription";
    return `€${Number(course.price_eur).toFixed(2)}`;
  };

  // Determine if requested subcategory has any matching courses; if not, fall back to its parent category.
  const requestedSub = activeSubcategory
    ? subcategories.find((s: any) => s.slug === activeSubcategory)
    : null;
  const subcategoryHasCourses = requestedSub
    ? courseSubcategories.some((cs: any) => cs.subcategory_id === requestedSub.id)
    : true;
  const fallbackCategory =
    requestedSub && !subcategoryHasCourses
      ? categories.find((c: any) => c.id === requestedSub.category_id)
      : null;
  const usingSubcategoryFallback = Boolean(fallbackCategory);

  const matchesCategory = (course: any) => {
    if (requestedSub && !usingSubcategoryFallback) {
      return courseSubcategories.some(
        (cs: any) => cs.course_id === course.id && cs.subcategory_id === requestedSub.id,
      );
    }
    if (usingSubcategoryFallback && fallbackCategory) {
      return courseCategories.some(
        (cc: any) => cc.course_id === course.id && cc.category_id === fallbackCategory.id,
      );
    }
    if (activeCategory === "all") return true;
    const cat = categories.find((c: any) => c.slug === activeCategory);
    if (!cat) return true;
    return courseCategories.some((cc: any) => cc.course_id === course.id && cc.category_id === cat.id);
  };

  const courseHours = (course: any): number | null =>
    parseDurationToHours(course?.course_details?.duration);

  const matchesDuration = (course: any) => {
    if (activeDuration === "all") return true;
    return courseInBucket(courseHours(course), activeDuration);
  };

  const filteredCourses = courses.filter((c: any) => matchesCategory(c) && matchesDuration(c));

  const setCategory = (slug: string) => {
    if (slug === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", slug);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const setDuration = (id: string) => {
    if (id === "all") {
      searchParams.delete("duration");
    } else {
      searchParams.set("duration", id);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const durationCounts = DURATION_BUCKETS.map((b) => ({
    ...b,
    count: courses.filter((c: any) => matchesCategory(c) && courseInBucket(courseHours(c), b.id)).length,
  }));

  // Carousel
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselPage, setCarouselPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(approvedReviews.length / 3));

  const scrollToPage = (page: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("div")?.offsetWidth || 400;
    el.scrollTo({ left: page * cardWidth * 3 + page * 72, behavior: "smooth" });
    setCarouselPage(page);
  };

  const features = [
    { icon: BarChart3, label: "Unlimited Access" },
    { icon: Clock, label: "~5-minute lessons" },
    { icon: Award, label: "Completion certificates" },
    { icon: FileText, label: "Worksheets, templates & tools" },
  ];

  return (
    <PageLayout>
      {(() => {
        const activeCat = activeCategory !== "all" ? categories.find((c: any) => c.slug === activeCategory) : null;
        const seoTitle = activeCat?.meta_title || (activeCat ? `${activeCat.name} Courses` : "Browse Courses");
        const seoDesc = activeCat?.meta_description || "Explore Levoro Academy's full library of expert-led, science-based micro-courses across business, technology, leadership, and more.";
        return <SEOHead title={seoTitle} description={seoDesc} canonicalPath="/courses" pageId={activeCat ? undefined : "courses"} />;
      })()}
      {/* Compact page header */}
      {(() => {
        const activeCat = activeCategory !== "all" ? categories.find((c: any) => c.slug === activeCategory) : null;
        const activeSub = activeSubcategory ? subcategories.find((s: any) => s.slug === activeSubcategory) : null;
        const title = activeSub?.name || activeCat?.name || "All Courses";
        return (
          <section className="pt-8 pb-6">
            <div className="max-w-[1200px] mx-auto px-5">
              <Breadcrumb className="mb-3">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {activeCat || activeSub ? (
                      <BreadcrumbLink asChild><Link to="/courses">Courses</Link></BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>Courses</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {activeCat && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        {activeSub ? (
                          <BreadcrumbLink asChild>
                            <Link to={`/courses?category=${activeCat.slug}`}>{activeCat.name}</Link>
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{activeCat.name}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </>
                  )}
                  {activeSub && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{activeSub.name}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="text-3xl md:text-4xl font-extrabold text-primary">{title}</h1>
            </div>
          </section>
        );
      })()}

      {/* Value strip (top) - hidden for subscribers */}
      {!isSubscribed && (
        <section className="pt-2 pb-4 md:pb-5">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-card border border-border/50 rounded-xl px-5 py-4"
                >
                  <f.icon className="h-6 w-6 text-primary/60 shrink-0" />
                  <span className="text-sm font-medium text-foreground">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Course Catalog */}
      <section className="pt-2 pb-16">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:w-64 shrink-0 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <Accordion type="multiple" defaultValue={["categories"]} className="w-full">
                <AccordionItem value="categories" className="border-b">
                  <AccordionTrigger className="text-sm font-semibold text-muted-foreground uppercase tracking-wider hover:no-underline">
                    Categories
                  </AccordionTrigger>
                  <AccordionContent>
                    <nav className="space-y-1 pt-1">
                      <button
                        onClick={() => setCategory("all")}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeCategory === "all" ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted/60 text-foreground/80"
                        }`}
                      >
                        All Courses
                      </button>
                      {categories.map((cat: any) => {
                        const Icon = iconMap[cat.icon] || BookOpen;
                        const count = courseCategories.filter((cc: any) => cc.category_id === cat.id).length;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setCategory(cat.slug)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                              activeCategory === cat.slug ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted/60 text-foreground/80"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="flex-1 truncate">{cat.name}</span>
                            {count > 0 && <span className="text-xs opacity-60">{count}</span>}
                          </button>
                        );
                      })}
                    </nav>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="duration" className="border-b">
                  <AccordionTrigger className="text-sm font-semibold text-muted-foreground uppercase tracking-wider hover:no-underline">
                    Course duration
                  </AccordionTrigger>
                  <AccordionContent>
                    <nav className="space-y-1 pt-1">
                      <button
                        onClick={() => setDuration("all")}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeDuration === "all" ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted/60 text-foreground/80"
                        }`}
                      >
                        Any duration
                      </button>
                      {durationCounts.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setDuration(b.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                            activeDuration === b.id ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted/60 text-foreground/80"
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span className="flex-1 truncate">{b.label}</span>
                          {b.count > 0 && <span className="text-xs opacity-60">{b.count}</span>}
                        </button>
                      ))}
                    </nav>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </aside>

            {/* Main content */}
            <div className="flex-1 space-y-4">
              {usingSubcategoryFallback && fallbackCategory && requestedSub && (
                <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  No courses yet in <span className="font-medium text-foreground">{requestedSub.name}</span>.
                  Showing all courses in{" "}
                  <Link
                    to={`/courses?category=${fallbackCategory.slug}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {fallbackCategory.name}
                  </Link>{" "}
                  instead.
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""}
                {activeSubcategory && !usingSubcategoryFallback && ` in ${subcategories.find((s: any) => s.slug === activeSubcategory)?.name || activeSubcategory}`}
                {usingSubcategoryFallback && fallbackCategory && ` in ${fallbackCategory.name}`}
                {!activeSubcategory && activeCategory !== "all" && ` in ${categories.find((c: any) => c.slug === activeCategory)?.name || activeCategory}`}
                {activeDuration !== "all" && ` · ${DURATION_BUCKETS.find((b) => b.id === activeDuration)?.label}`}
              </p>

              {isLoading ? (
                <p className="text-muted-foreground text-center py-8">Loading courses...</p>
              ) : filteredCourses.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">No courses in this category yet.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCourses.map((course: any, i: number) => {
                    const enrolled = isEnrolled(course.id);
                    const hasAccess = user && (isSubscribed || course.is_free);
                    const courseCats = courseCategories
                      .filter((cc: any) => cc.course_id === course.id)
                      .map((cc: any) => categories.find((c: any) => c.id === cc.category_id))
                      .filter(Boolean);

                    return (
                      <div
                        key={course.id}
                        onClick={() => navigate(`/courses/${course.id}`)}
                        className="group bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer opacity-0 animate-slide-up"
                        style={{ animationDelay: `${0.05 + i * 0.06}s` }}
                      >
                        <div className="h-40 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden">
                          {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="h-10 w-10 text-primary/30" />
                          )}
                        </div>
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors break-words">
                              {course.title}
                            </h3>
                            <Badge variant={course.is_free ? "secondary" : "outline"} className="shrink-0 text-xs">
                              {getAccessLabel(course)}
                            </Badge>
                          </div>
                          {courseCats.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {courseCats.slice(0, 2).map((cat: any) => (
                                <span key={cat.id} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                  {cat.name}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {course.description ? stripHtml(course.description).substring(0, 200) || "No description available." : "No description available."}
                          </p>
                          {hasAccess && enrolled ? (
                            <div className="flex items-center gap-2 text-sm font-medium text-primary">
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                              Continue Learning
                              <ArrowRight className="h-3 w-3 ml-auto" />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Lock className="h-3.5 w-3.5" />
                              View Details
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Reviews Carousel - matches screenshot 2 */}
      {approvedReviews.length > 0 && (
        <section className="py-16 md:py-20 bg-card rounded-3xl mx-4 md:mx-8 mb-8">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-3">
                Trusted by <span className="italic text-secondary">professionals</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Most platforms are built for an "average learner" who doesn't exist,
                ignoring real schedules, cognitive load, and how adults actually learn.
              </p>
            </div>

            <div className="relative">
              <div
                ref={carouselRef}
                className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {approvedReviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="snap-start shrink-0 w-[calc(33.333%-16px)] min-w-[300px] bg-card rounded-xl border border-border/50 p-6 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${s <= review.rating ? "text-primary fill-primary" : "text-muted-foreground/30"}`}
                          />
                        ))}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{review.student_name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{review.course_title}</p>
                      </div>
                    </div>
                    <div className="border-l-2 border-border pl-4">
                      <p className="text-sm text-foreground/80 line-clamp-4">
                        "{review.review_text}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dot indicators */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => scrollToPage(i)}
                      className={`h-2.5 w-2.5 rounded-full transition-colors ${
                        i === carouselPage ? "bg-primary" : "bg-border"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA - matches screenshot 3 */}
      <section className="mesh-gradient py-16 md:py-24">
        <div className="max-w-[800px] mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-4">
            Explore the full Levoro library
          </h2>
          <p className="text-foreground/70 mb-8">
            All courses are included in one Levoro membership.<br />
            No extra payments per course.
          </p>

          <div className="bg-card/80 rounded-full px-6 py-3 inline-flex items-center gap-2 mb-8 border border-border/50">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm text-foreground font-medium">
              Not sure where to start? Your membership gives you unlimited access. Cancel anytime.
            </span>
          </div>

          <div className="block">
            <Button variant="default" size="lg" className="uppercase font-bold tracking-wide" asChild>
              <Link to="/memberships">Get Full Access</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Value props (reinforcement) - hidden for subscribers */}
      {!isSubscribed && (
        <section className="py-12 md:py-14 bg-muted/30">
          <div className="max-w-[1200px] mx-auto px-5">
            <h2 className="text-xl md:text-2xl font-bold text-primary text-center mb-6">
              Everything included in one membership
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-card border border-border/50 rounded-xl px-5 py-4"
                >
                  <f.icon className="h-6 w-6 text-primary/60 shrink-0" />
                  <span className="text-sm font-medium text-foreground">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sticky bottom CTA bar (non-subscribers) */}
      {!isSubscribed && !ctaDismissed && (
        <>
          <div aria-hidden className="h-14" />
          <div className="fixed bottom-0 left-0 right-0 z-40 h-14 bg-primary text-primary-foreground shadow-[0_-4px_12px_-4px_hsl(var(--primary)/0.3)]">
            <div className="max-w-[1200px] mx-auto px-5 h-full flex items-center justify-center relative">
              <p className="text-sm md:text-base font-medium text-center">
                Unlimited access to expert-led courses designed for real-world skills. Learn at your own pace. Cancel anytime. —{" "}
                <Link to="/memberships" className="underline underline-offset-2 font-semibold">
                  Get full access
                </Link>
              </p>
              <button
                onClick={dismissCta}
                aria-label="Dismiss"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-primary-foreground/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </PageLayout>
  );
};

export default OurCourses;
