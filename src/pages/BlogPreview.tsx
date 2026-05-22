import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/PageLayout";
import SEOHead from "@/components/SEOHead";
import { BlockRenderer } from "@/components/lesson-player/BlockRenderer";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

function slugifyHeading(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function decodeHtmlEntities(text: string): string {
  const doc = new DOMParser().parseFromString(text, "text/html");
  return doc.body.textContent || "";
}

interface TocItem { id: string; text: string; level: number; }

function extractHeadings(blocks: any[]): TocItem[] {
  const headings: TocItem[] = [];
  for (const block of blocks) {
    if (block.type === "splitScreen") {
      if (block.left) headings.push(...extractHeadings([block.left]));
      if (block.right) headings.push(...extractHeadings([block.right]));
      continue;
    }
    if (block.type !== "text" || !block.html) continue;
    const regex = /<(h[2-4])[^>]*>([\s\S]*?)<\/\1>/gi;
    let match;
    while ((match = regex.exec(block.html)) !== null) {
      const text = decodeHtmlEntities(match[2].replace(/<[^>]*>/g, "").trim());
      if (!text) continue;
      headings.push({ id: slugifyHeading(text), text, level: parseInt(match[1][1]) });
    }
  }
  return headings;
}

function injectHeadingIds(html: string): string {
  return html.replace(/<(h[2-4])([^>]*?)>([\s\S]*?)<\/\1>/gi, (_, tag, attrs, inner) => {
    const text = inner.replace(/<[^>]*>/g, "").trim();
    const id = slugifyHeading(text);
    return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
  });
}

function BlogTableOfContents({ headings }: { headings: TocItem[] }) {
  if (headings.length === 0) return null;
  return (
    <nav className="border rounded-xl p-5 mb-10 bg-muted/30">
      <p className="font-semibold text-primary mb-3">Table of Contents</p>
      <ul className="space-y-1.5 text-sm">
        {headings.map((h, i) => (
          <li key={i} style={{ paddingLeft: `${(h.level - 2) * 16}px` }}>
            <a href={`#${h.id}`} className="text-primary hover:underline">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const BlogPreview = () => {
  const { id } = useParams<{ id: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post-preview", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts" as any)
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  const blocks = post ? (() => {
    const raw = post.content_blocks;
    if (!raw) return [];
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  })() : [];

  const headings = useMemo(() => post?.show_toc ? extractHeadings(blocks) : [], [blocks, post?.show_toc]);

  const processedBlocks = useMemo(() => {
    if (!post?.show_toc) return blocks;
    const injectIds = (b: any): any => {
      if (b.type === "splitScreen") {
        return { ...b, left: b.left ? injectIds(b.left) : b.left, right: b.right ? injectIds(b.right) : b.right };
      }
      return b.type === "text" && b.html ? { ...b, html: injectHeadingIds(b.html) } : b;
    };
    return blocks.map(injectIds);
  }, [blocks, post?.show_toc]);

  return (
    <PageLayout>
      <SEOHead title="Preview — Blog Post" description="" noIndex />

      <div className="bg-yellow-100 border-b border-yellow-300 text-yellow-900 text-center py-2 text-sm font-medium">
        ⚠️ Preview Mode — This post is not published yet
      </div>

      <article className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-5">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : !post ? (
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-primary mb-2">Post not found</h1>
              <Link to="/admin?tab=blog" className="text-secondary hover:underline">← Back to admin</Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col items-start gap-3">
                <Link to="/admin?tab=blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" /> Back to Admin
                </Link>

                {post.category && (
                  <Badge variant="outline">{post.category}</Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">{post.title}</h1>

              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-8">
                {post.author_name && <span>{post.author_name}</span>}
                {post.author_name && post.published_at && <span>·</span>}
                {post.published_at && (
                  <span>{new Date(post.published_at).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                )}
              </div>

              {post.thumbnail_url && (
                <img src={post.thumbnail_url} alt={post.title} className="w-full rounded-xl mb-10 object-cover max-h-[400px]" />
              )}

              {post.introduction && (
                <div
                  className="prose prose-lg max-w-none prose-headings:text-primary prose-a:text-primary prose-a:underline mb-10"
                  dangerouslySetInnerHTML={{ __html: post.introduction }}
                />
              )}

              {post.show_toc && <BlogTableOfContents headings={headings} />}

              <div className="prose prose-lg max-w-none prose-headings:text-primary prose-a:text-primary prose-a:underline">
                <BlockRenderer blocks={processedBlocks} />
              </div>
            </>
          )}
        </div>
      </article>
    </PageLayout>
  );
};

export default BlogPreview;
