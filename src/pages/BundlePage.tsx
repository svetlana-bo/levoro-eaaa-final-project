import SEOHead from "@/components/SEOHead";
import PageLayout from "@/components/PageLayout";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Package } from "lucide-react";
import { safeHtml } from "@/lib/sanitize";
import { useCurrency } from "@/hooks/useCurrency";

const BundlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { formatPrice } = useCurrency();

  const { data: bundle, isLoading } = useQuery({
    queryKey: ["bundle", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bundles" as any)
        .select("*")
        .eq("slug", slug!)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!slug,
  });

  const { data: bundleCourses = [] } = useQuery({
    queryKey: ["bundle-courses", bundle?.id],
    queryFn: async () => {
      const { data: bcs, error } = await supabase
        .from("bundle_courses" as any)
        .select("*")
        .eq("bundle_id", bundle!.id);
      if (error) throw error;
      if (!bcs || bcs.length === 0) return [];
      const courseIds = (bcs as any[]).map((bc: any) => bc.course_id);
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, description, thumbnail_url")
        .in("id", courseIds);
      return courses || [];
    },
    enabled: !!bundle?.id,
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageLayout>
    );
  }

  if (!bundle) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <h2 className="text-2xl font-bold">Bundle not found</h2>
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
        title={bundle.meta_title || bundle.title}
        description={bundle.meta_description || bundle.description?.substring(0, 155) || undefined}
        canonicalPath={`/bundles/${slug}`}
      />

      {/* Hero */}
      <section className="bg-primary py-16 lg:py-24">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <Package className="h-3.5 w-3.5" /> Course Bundle
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-4">
              {bundle.title}
            </h1>
            {bundle.description && (
              <p className="text-lg text-primary-foreground/80 mb-6">
                {bundle.description}
              </p>
            )}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-primary-foreground">
                {formatPrice(bundle.price_eur, bundle.id)}
              </span>
              <Badge variant="secondary">{bundleCourses.length} courses included</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Included Courses */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Courses Included
          </h2>
          {bundleCourses.length === 0 ? (
            <p className="text-muted-foreground">No courses added to this bundle yet.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bundleCourses.map((course: any) => (
                <Link key={course.id} to={`/courses/${course.id}`} className="group">
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    {course.thumbnail_url && (
                      <div className="aspect-video overflow-hidden">
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
                      {course.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{course.description.replace(/<[^>]*>/g, "").substring(0, 120)}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Custom Content */}
      {bundle.page_content && (
        <section className="py-12 bg-muted/30">
          <div className="max-w-[800px] mx-auto px-5 prose prose-lg" dangerouslySetInnerHTML={safeHtml(bundle.page_content)} />
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="max-w-[800px] mx-auto px-5 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            Get all {bundleCourses.length} courses for one price
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-6">
            {formatPrice(bundle.price_eur, bundle.id)} — lifetime access to the complete bundle
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/memberships">Get Started</Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
};

export default BundlePage;
