import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/PageLayout";
import { safeHtml } from "@/lib/sanitize";
import SEOHead from "@/components/SEOHead";

interface SitePageProps {
  pageId: string;
  fallbackTitle: string;
  canonicalPath?: string;
}

const SitePage = ({ pageId, fallbackTitle, canonicalPath }: SitePageProps) => {
  const { data: page, isLoading } = useQuery({
    queryKey: ["site-page", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_pages" as any)
        .select("*")
        .eq("id", pageId)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  return (
    <PageLayout>
      <SEOHead
        title={page?.meta_title || fallbackTitle}
        description={page?.meta_description}
        canonicalPath={canonicalPath}
      />
      <section className="py-24 md:py-32">
        <div className="max-w-[900px] mx-auto px-5">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : page?.content ? (
            <div
              className="prose prose-lg max-w-none prose-headings:text-primary prose-headings:font-bold prose-a:text-secondary prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={safeHtml(page.content)}
            />
          ) : (
            <>
              <h1 className="text-4xl font-bold text-primary mb-4">{fallbackTitle}</h1>
              <p className="text-muted-foreground">This page is under construction. Check back soon.</p>
            </>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default SitePage;
