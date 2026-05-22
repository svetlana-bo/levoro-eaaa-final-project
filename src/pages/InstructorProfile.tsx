import SEOHead from "@/components/SEOHead";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/PageLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Users, BookOpen, Linkedin, ExternalLink, Globe, ArrowRight } from "lucide-react";
import { getDisplayName, getDisplayInitials } from "@/lib/displayName";

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_free: boolean | null;
  price_eur: number | null;
  access_type: string | null;
};

const CourseGrid = ({
  courses,
  heading,
  subtitle,
  byLine,
  hideIfEmpty = false,
}: {
  courses: CourseRow[];
  heading: string;
  subtitle?: string;
  byLine?: string;
  hideIfEmpty?: boolean;
}) => {
  if (hideIfEmpty && courses.length === 0) return null;
  return (
    <section className="py-16 bg-background">
      <div className="max-w-[1000px] mx-auto px-5">
        <h2 className="text-2xl font-bold mb-2">{heading}</h2>
        {subtitle && <p className="text-muted-foreground mb-8">{subtitle}</p>}
        {!subtitle && <div className="mb-8" />}
        {courses.length === 0 ? (
          <p className="text-muted-foreground">No published courses yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Link key={course.id} to={`/courses/${course.id}`} className="group">
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  {course.thumbnail_url && (
                    <div className="h-40 overflow-hidden">
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{course.title}</CardTitle>
                    {byLine && <p className="text-sm text-muted-foreground mt-1">by {byLine}</p>}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {course.is_free ? (
                        <Badge variant="secondary">Free</Badge>
                      ) : (
                        <Badge variant="default">{course.access_type === "subscription" ? "Subscription" : `€${course.price_eur}`}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const CompanyView = ({ companyId }: { companyId: string }) => {
  const { data: company } = useQuery({
    queryKey: ["company-public-profile", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_companies")
        .select("id, name, logo_url, bio, linkedin_url, website_url")
        .eq("id", companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["company-members", companyId],
    queryFn: async () => {
      const { data: memberRows, error } = await supabase
        .from("instructor_company_members")
        .select("user_id")
        .eq("company_id", companyId);
      if (error) throw error;
      const ids = (memberRows || []).map((m: any) => m.user_id);
      if (ids.length === 0) return [] as Array<{ id: string; first_name: string | null; last_name: string | null; company_name: string | null; instructor_type: "individual" | "company" | null; avatar_url: string | null; bio: string | null }>;
      const { data: profiles, error: pErr } = await supabase
        .from("instructor_public_profiles" as any)
        .select("id, first_name, last_name, company_name, instructor_type, avatar_url, bio")
        .in("id", ids);
      if (pErr) throw pErr;
      return (profiles || []) as any[];
    },
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["company-public-courses", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, thumbnail_url, is_free, price_eur, access_type")
        .eq("owner_type", "company")
        .eq("owner_id", companyId)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as CourseRow[];
    },
  });

  if (!company) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const initials = (company.name || "Co").trim().slice(0, 2).toUpperCase();

  return (
    <>
      <SEOHead
        title={`${company.name} – Instructor`}
        description={company.bio?.substring(0, 155) || `Learn from ${company.name} on Levoro Academy.`}
        canonicalPath={`/instructor/${companyId}`}
      />
      {/* Hero */}
      <section className="bg-primary py-16">
        <div className="max-w-[1000px] mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <Avatar className="h-28 w-28 border-4 border-secondary/30">
              <AvatarImage src={company.logo_url || undefined} alt={company.name} />
              <AvatarFallback className="text-2xl bg-secondary text-secondary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left space-y-3">
              <h1 className="text-3xl lg:text-4xl font-bold text-primary-foreground">{company.name}</h1>
              {company.bio && (
                <p className="text-primary-foreground/70 text-lg max-w-xl">{company.bio}</p>
              )}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-primary-foreground/60">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" /> {courses.length} Course{courses.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {members.length} Instructor{members.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1">
                {company.linkedin_url && (
                  <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-secondary transition-colors">
                    <Linkedin className="h-4 w-4" /> LinkedIn <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {company.website_url && (
                  <a href={company.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-secondary transition-colors">
                    <Globe className="h-4 w-4" /> Website <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the instructors */}
      {members.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="max-w-[1000px] mx-auto px-5">
            <h2 className="text-2xl font-bold mb-2">Meet the instructors</h2>
            <p className="text-muted-foreground mb-8">The team behind {company.name}'s courses.</p>
            <div className="grid md:grid-cols-2 gap-6">
              {members.map((m) => {
                const name = getDisplayName(m);
                const memberInitials = getDisplayInitials(m);
                return (
                  <Link key={m.id} to={`/instructor/${m.id}`} className="group">
                    <Card className="hover:shadow-lg transition-shadow h-full">
                      <CardContent className="p-5 flex items-start gap-4">
                        <Avatar className="h-14 w-14 shrink-0">
                          <AvatarImage src={m.avatar_url || undefined} alt={name} />
                          <AvatarFallback>{memberInitials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-semibold group-hover:text-primary transition-colors">{name}</div>
                          {m.bio && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{m.bio}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <CourseGrid courses={courses} heading={`Courses by ${company.name}`} />
    </>
  );
};

const InstructorProfile = () => {
  const { instructorId } = useParams<{ instructorId: string }>();

  // Check if id matches a company first
  const { data: companyMatch, isLoading: companyLoading } = useQuery({
    queryKey: ["company-id-check", instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_companies")
        .select("id")
        .eq("id", instructorId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!instructorId,
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["instructor-public-profile", instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_public_profiles" as any)
        .select("id, first_name, last_name, company_name, instructor_type, avatar_url, bio, linkedin_url, category_names")
        .eq("id", instructorId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as { id: string; first_name: string | null; last_name: string | null; company_name: string | null; instructor_type: "individual" | "company" | null; avatar_url: string | null; bio: string | null; linkedin_url: string | null; category_names: string[] | null } | null;
    },
    enabled: !!instructorId && !companyMatch && !companyLoading,
  });

  // Company membership (if instructor belongs to a company)
  const { data: membership } = useQuery({
    queryKey: ["instructor-company-membership", instructorId],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("instructor_company_members")
        .select("company_id")
        .eq("user_id", instructorId!)
        .limit(1);
      if (error) throw error;
      const companyId = rows?.[0]?.company_id;
      if (!companyId) return null;
      const { data: company, error: cErr } = await supabase
        .from("instructor_companies")
        .select("id, name, logo_url")
        .eq("id", companyId)
        .maybeSingle();
      if (cErr) throw cErr;
      return company;
    },
    enabled: !!instructorId && !!profile,
  });

  const { data: personalCourses = [] } = useQuery({
    queryKey: ["instructor-personal-courses", instructorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, thumbnail_url, is_free, price_eur, access_type, owner_type")
        .eq("instructor_id", instructorId!)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data || []) as any[]).filter(c => c.owner_type !== "company") as CourseRow[];
    },
    enabled: !!instructorId && !!profile,
  });

  const { data: companyCourses = [] } = useQuery({
    queryKey: ["instructor-company-courses", instructorId, membership?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, thumbnail_url, is_free, price_eur, access_type")
        .eq("owner_type", "company")
        .eq("owner_id", membership!.id)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as CourseRow[];
    },
    enabled: !!membership?.id,
  });

  const courses = [...companyCourses, ...personalCourses];

  const { data: stats } = useQuery({
    queryKey: ["instructor-public-stats", instructorId, courses.map(c => c.id).join(",")],
    queryFn: async () => {
      const courseIds = courses.map(c => c.id);
      if (courseIds.length === 0) return { totalStudents: 0, averageRating: 0, reviewCount: 0 };

      const { count: totalStudents } = await supabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .in("course_id", courseIds);

      const { data: reviews } = await supabase
        .from("course_reviews")
        .select("rating")
        .in("course_id", courseIds)
        .eq("is_approved", true);

      const reviewCount = reviews?.length || 0;
      const averageRating = reviewCount > 0
        ? reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

      return { totalStudents: totalStudents || 0, averageRating, reviewCount };
    },
    enabled: courses.length > 0,
  });

  if (companyLoading || (!companyMatch && profileLoading)) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageLayout>
    );
  }

  if (companyMatch) {
    return (
      <PageLayout>
        <CompanyView companyId={companyMatch.id} />
      </PageLayout>
    );
  }

  if (!profile) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <h2 className="text-2xl font-bold">Instructor not found</h2>
          <Button variant="hero" asChild>
            <Link to="/courses">Browse Courses</Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  const instructorName = getDisplayName(profile);
  const initials = getDisplayInitials(profile);

  return (
    <PageLayout>
      <SEOHead
        title={`${instructorName} – Instructor`}
        description={profile?.bio?.substring(0, 155) || `Learn from ${instructorName} on Levoro Academy.`}
        canonicalPath={`/instructor/${instructorId}`}
      />
      {/* Hero */}
      <section className="bg-primary py-16">
        <div className="max-w-[1000px] mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <Avatar className="h-28 w-28 border-4 border-secondary/30">
              <AvatarImage src={profile.avatar_url || undefined} alt={instructorName} />
              <AvatarFallback className="text-2xl bg-secondary text-secondary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left space-y-3">
              <h1 className="text-3xl lg:text-4xl font-bold text-primary-foreground">
                {instructorName}
              </h1>
              {profile.bio && (
                <p className="text-primary-foreground/70 text-lg max-w-xl">{profile.bio}</p>
              )}
              {profile.category_names && profile.category_names.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
                  {profile.category_names.map(name => (
                    <Badge key={name} variant="secondary" className="text-xs">{name}</Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-primary-foreground/60">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" /> {courses.length} Course{courses.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {stats?.totalStudents || 0} Student{(stats?.totalStudents || 0) !== 1 ? "s" : ""}
                </span>
                {(stats?.reviewCount || 0) > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-secondary text-secondary" /> {stats!.averageRating.toFixed(1)} ({stats!.reviewCount} review{stats!.reviewCount !== 1 ? "s" : ""})
                  </span>
                )}
              </div>
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-secondary transition-colors"
                >
                  <Linkedin className="h-4 w-4" /> LinkedIn Profile <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {membership && (
                <div className="pt-1">
                  <div className="inline-flex flex-wrap items-center gap-3 rounded-full bg-primary-foreground/10 px-4 py-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={membership.logo_url || undefined} alt={membership.name} />
                      <AvatarFallback className="text-[10px]">{membership.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-primary-foreground">
                      Instructor at <span className="font-semibold">{membership.name}</span>
                    </span>
                    <span className="text-primary-foreground/40">·</span>
                    <Link
                      to={`/instructor/${membership.id}`}
                      className="inline-flex items-center gap-1 text-sm text-primary-foreground/90 hover:text-secondary underline-offset-4 underline transition-colors"
                    >
                      View company <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {membership ? (
        <>
          <CourseGrid
            courses={companyCourses}
            heading={`Courses with ${membership.name}`}
            subtitle={`Courses ${profile.first_name || instructorName} teaches as part of ${membership.name}'s curriculum.`}
            byLine={membership.name}
          />
          <CourseGrid
            courses={personalCourses}
            heading="Personal courses"
            subtitle={`Courses created by ${profile.first_name || instructorName} independently.`}
            byLine={instructorName}
          />
        </>
      ) : (
        <CourseGrid courses={personalCourses} heading={`Courses by ${instructorName}`} />
      )}
    </PageLayout>
  );
};

export default InstructorProfile;
