import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Eye, EyeOff, Search } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import BlogPostEditor from "./BlogPostEditor";

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

export default function BlogEditor() {
  const queryClient = useQueryClient();
  const [editingPost, setEditingPost] = useState<BlogPost | null | "new">(null);
  const [search, setSearch] = useState("");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) as BlogPost[];
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Post deleted");
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      const update: any = { is_published: publish, updated_at: new Date().toISOString() };
      if (publish) update.published_at = new Date().toISOString();
      const { error } = await supabase.from("blog_posts" as any).update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Post updated");
    },
  });

  if (editingPost === "new") {
    return <BlogPostEditor post={null} onBack={() => setEditingPost(null)} />;
  }
  if (editingPost) {
    return <BlogPostEditor post={editingPost} onBack={() => setEditingPost(null)} />;
  }

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary">Blog Posts</h2>
        <Button onClick={() => setEditingPost("new")} className="gap-1">
          <Plus className="h-4 w-4" /> New Post
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts..." className="pl-9" />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No blog posts yet. Create your first one!</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((post) => (
            <Card key={post.id}>
              <CardContent className="flex items-center gap-4 py-3">
                {post.thumbnail_url && (
                  <img src={post.thumbnail_url} alt="" className="w-16 h-12 object-cover rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{post.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {post.category && <Badge variant="outline" className="text-xs">{post.category}</Badge>}
                    {post.author_name && <span>{post.author_name}</span>}
                    <span>{new Date(post.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                    {post.scheduled_publish_at && !post.is_published && (
                      <Badge variant="secondary" className="text-xs">Scheduled {new Date(post.scheduled_publish_at).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={post.is_published ? "default" : "secondary"}>
                    {post.is_published ? "Published" : "Draft"}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => togglePublish.mutate({ id: post.id, publish: !post.is_published })} title={post.is_published ? "Unpublish" : "Publish"}>
                    {post.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setEditingPost(post)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{post.title}"?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deletePost.mutate(post.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
