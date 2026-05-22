import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail_url: string | null;
  category: string;
  author_name: string;
  published_at: string | null;
}

const Blog = () => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts" as any)
        .select("id, title, slug, excerpt, thumbnail_url, category, author_name, published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) as BlogPost[];
    },
  });

  return (
    <PageLayout>
      <SEOHead
        title="Blog"
        description="Insights, tips, and stories about professional learning, career development, and the science behind effective micro-learning."
        canonicalPath="/blog"
        pageId="blog"
      />

      {/* Hero section with gradient matching the screenshot */}
      <section className="mesh-gradient py-20 md:py-28">
        <div className="max-w-[1200px] mx-auto px-5">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-5">Levoro Blog</h1>
          <p className="max-w-[750px] text-base md:text-lg text-foreground/80 leading-relaxed">
            Welcome to the Levoro Blog – a space for thoughtful growth, bold clarity and{" "}
            <strong>lifelong learning</strong>. Here you'll find{" "}
            <strong>actionable tips</strong>, <strong>expert insights</strong>, and{" "}
            <strong>inspiring stories</strong> to support your journey in personal development,
            career direction, and mindful entrepreneurship. Whether you're building your own path
            or exploring new ways to grow, our blog is here to help you do it with purpose.
          </p>
        </div>
      </section>

      {/* Blog post grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-5">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">No blog posts yet. Check back soon!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    {post.thumbnail_url ? (
                      <img
                        src={post.thumbnail_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-base">
                        No image
                      </div>
                    )}
                    {post.category && (
                      <Badge className="absolute top-3 right-3 bg-background/90 text-foreground border shadow-sm text-xs">
                        {post.category.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h2 className="text-lg font-bold text-primary mb-2 line-clamp-2 group-hover:text-secondary transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-4 mb-4 flex-1">
                        {post.excerpt}
                      </p>
                    )}
                    <p className="text-xs font-semibold text-primary tracking-wide uppercase">
                      READ MORE »
                    </p>
                    {(post.author_name || post.published_at) && (
                      <div className="mt-4 pt-3 border-t text-xs text-muted-foreground flex items-center gap-2">
                        {post.author_name && <span>{post.author_name}</span>}
                        {post.author_name && post.published_at && <span>·</span>}
                        {post.published_at && (
                          <span>{new Date(post.published_at).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default Blog;
