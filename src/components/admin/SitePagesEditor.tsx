import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Pencil, Save, X, Eye, Search, Globe } from "lucide-react";
import { safeHtml } from "@/lib/sanitize";

const CONTENT_PAGE_IDS = [
  { id: "privacy", label: "Privacy Policy", path: "/privacy" },
  { id: "terms", label: "Terms and Conditions", path: "/terms" },
  { id: "accessibility", label: "Accessibility Statement", path: "/accessibility" },
];

const SEO_PAGE_IDS = [
  { id: "home", label: "Home", path: "/" },
  { id: "about", label: "About Us", path: "/about" },
  { id: "courses", label: "Browse Courses", path: "/courses" },
  { id: "memberships", label: "Memberships & Pricing", path: "/memberships" },
  { id: "business", label: "Levoro for Business", path: "/business" },
  { id: "teach", label: "Teach on Levoro", path: "/teach" },
  { id: "faq", label: "FAQ", path: "/faq" },
  { id: "blog", label: "Blog", path: "/blog" },
  { id: "contact", label: "Contact Support", path: "/contact" },
  { id: "partnerships", label: "Partnerships", path: "/partnerships" },
  { id: "signup", label: "Sign Up", path: "/signup" },
  { id: "privacy", label: "Privacy Policy", path: "/privacy" },
  { id: "terms", label: "Terms and Conditions", path: "/terms" },
  { id: "accessibility", label: "Accessibility Statement", path: "/accessibility" },
  { id: "design-system", label: "Design System", path: "/design-system" },
];

const SITE_URL = "https://levoro.academy";

const SnippetPreview = ({ title, url, description }: { title: string; url: string; description: string }) => (
  <div className="border border-border rounded-lg p-4 bg-background space-y-1 max-w-[600px]">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Search className="h-3 w-3" />
      Google Search Preview
    </div>
    <p className="text-sm text-[hsl(var(--primary))] truncate">{title || "Page Title | Levoro Academy"}</p>
    <p className="text-xs text-green-700 dark:text-green-400 truncate">{url}</p>
    <p className="text-xs text-muted-foreground line-clamp-2">{description || "No description set. A default will be used."}</p>
  </div>
);

const SitePagesEditor = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editMetaTitle, setEditMetaTitle] = useState("");
  const [editMetaDesc, setEditMetaDesc] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [seoEditingId, setSeoEditingId] = useState<string | null>(null);
  const [seoMetaTitle, setSeoMetaTitle] = useState("");
  const [seoMetaDesc, setSeoMetaDesc] = useState("");

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["admin-site-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_pages")
        .select("*");
      if (error) throw error;
      return data as any[];
    },
  });

  const updatePage = useMutation({
    mutationFn: async ({ id, content, meta_title, meta_description }: { id: string; content?: string; meta_title: string; meta_description: string }) => {
      const updateData: any = {
        meta_title: meta_title || null,
        meta_description: meta_description || null,
        updated_at: new Date().toISOString(),
      };
      if (content !== undefined) updateData.content = content;

      const { error } = await supabase
        .from("site_pages")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-pages"] });
      queryClient.invalidateQueries({ queryKey: ["site-page"] });
      queryClient.invalidateQueries({ queryKey: ["page-seo"] });
      toast.success("Page updated successfully");
      setEditingId(null);
      setSeoEditingId(null);
    },
    onError: () => toast.error("Failed to update page"),
  });

  const startEditing = (id: string) => {
    const page = pages.find((p: any) => p.id === id);
    setEditContent(page?.content || "");
    setEditMetaTitle(page?.meta_title || "");
    setEditMetaDesc(page?.meta_description || "");
    setEditingId(id);
    setPreviewId(null);
  };

  const startSeoEditing = (id: string) => {
    const page = pages.find((p: any) => p.id === id);
    setSeoMetaTitle(page?.meta_title || "");
    setSeoMetaDesc(page?.meta_description || "");
    setSeoEditingId(id);
  };

  if (isLoading) {
    return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Site Pages & SEO</h2>
      <p className="text-muted-foreground text-base">Manage page content and SEO metadata for all pages across the site.</p>

      <Tabs defaultValue="seo" className="w-full">
        <TabsList>
          <TabsTrigger value="seo" className="gap-1.5"><Globe className="h-4 w-4" /> SEO Settings</TabsTrigger>
          <TabsTrigger value="content" className="gap-1.5"><Pencil className="h-4 w-4" /> Content Pages</TabsTrigger>
        </TabsList>

        {/* SEO Settings Tab */}
        <TabsContent value="seo" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">Edit the meta title and description for any page. These override the hardcoded defaults and appear in search engine results.</p>
          
          {SEO_PAGE_IDS.map(({ id, label, path }) => {
            const page = pages.find((p: any) => p.id === id);
            const isEditing = seoEditingId === id;
            const hasOverride = !!(page?.meta_title || page?.meta_description);

            return (
              <Card key={id} className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground truncate">{SITE_URL}{path}</p>
                    </div>
                    {hasOverride && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium shrink-0">Custom</span>
                    )}
                  </div>
                  {!isEditing && (
                    <Button variant="ghost" size="sm" className="gap-1 shrink-0" onClick={() => startSeoEditing(id)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                  )}
                </div>

                {isEditing && (
                  <CardContent className="border-t border-border pt-4 space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Meta Title <span className="ml-1 text-xs">({seoMetaTitle.length}/60)</span>
                      </Label>
                      <Input
                        value={seoMetaTitle}
                        onChange={(e) => setSeoMetaTitle(e.target.value)}
                        placeholder={`${label} | Levoro Academy`}
                        maxLength={70}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Recommended: under 60 characters. Leave empty for default.</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Meta Description <span className="ml-1 text-xs">({seoMetaDesc.length}/155)</span>
                      </Label>
                      <Textarea
                        value={seoMetaDesc}
                        onChange={(e) => setSeoMetaDesc(e.target.value)}
                        placeholder="A concise summary of this page for search engines..."
                        className="min-h-[60px] text-sm"
                        maxLength={200}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Recommended: 120–155 characters. Leave empty for default.</p>
                    </div>
                    <SnippetPreview
                      title={seoMetaTitle || `${label} | Levoro Academy`}
                      url={`${SITE_URL}${path}`}
                      description={seoMetaDesc}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="gap-1" onClick={() => updatePage.mutate({ id, meta_title: seoMetaTitle, meta_description: seoMetaDesc })} disabled={updatePage.isPending}>
                        <Save className="h-4 w-4" /> Save
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => setSeoEditingId(null)}>
                        <X className="h-4 w-4" /> Cancel
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </TabsContent>

        {/* Content Pages Tab */}
        <TabsContent value="content" className="space-y-6 mt-4">
          <p className="text-sm text-muted-foreground">Edit the HTML content and SEO metadata of legal and informational pages.</p>

          {CONTENT_PAGE_IDS.map(({ id, label, path }) => {
            const page = pages.find((p: any) => p.id === id);
            const isEditing = editingId === id;
            const isPreviewing = previewId === id;

            return (
              <Card key={id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-lg">{label}</CardTitle>
                  <div className="flex gap-2">
                    {!isEditing && (
                      <>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => setPreviewId(isPreviewing ? null : id)}>
                          <Eye className="h-4 w-4" /> {isPreviewing ? "Hide Preview" : "Preview"}
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => startEditing(id)}>
                          <Pencil className="h-4 w-4" /> Edit
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <Search className="h-4 w-4" /> SEO Settings
                        </h3>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Meta Title <span className="ml-1 text-xs">({editMetaTitle.length}/60)</span>
                          </Label>
                          <Input
                            value={editMetaTitle}
                            onChange={(e) => setEditMetaTitle(e.target.value)}
                            placeholder={`${label} | Levoro Academy`}
                            maxLength={70}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Recommended: under 60 characters. Leave empty for default.</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Meta Description <span className="ml-1 text-xs">({editMetaDesc.length}/155)</span>
                          </Label>
                          <Textarea
                            value={editMetaDesc}
                            onChange={(e) => setEditMetaDesc(e.target.value)}
                            placeholder="A concise summary of this page for search engines..."
                            className="min-h-[60px] text-sm"
                            maxLength={200}
                          />
                          <p className="text-xs text-muted-foreground mt-1">Recommended: 120–155 characters. Leave empty for default.</p>
                        </div>
                        <SnippetPreview
                          title={editMetaTitle || `${label} | Levoro Academy`}
                          url={`${SITE_URL}${path}`}
                          description={editMetaDesc}
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">HTML Content</Label>
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[400px] font-mono text-xs"
                          placeholder="Enter HTML content..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="gap-1" onClick={() => updatePage.mutate({ id, content: editContent, meta_title: editMetaTitle, meta_description: editMetaDesc })} disabled={updatePage.isPending}>
                          <Save className="h-4 w-4" /> Save
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : isPreviewing ? (
                    <div className="border border-border rounded-lg p-6 bg-background">
                      <div
                        className="prose prose-sm max-w-none prose-headings:text-primary prose-a:text-secondary"
                        dangerouslySetInnerHTML={safeHtml(page?.content || "")}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {page?.content ? `${page.content.replace(/<[^>]*>/g, "").substring(0, 150)}...` : "No content yet. Click Edit to add content."}
                      </p>
                      {(page?.meta_title || page?.meta_description) && (
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {page.meta_title && <p><strong>SEO Title:</strong> {page.meta_title}</p>}
                          {page.meta_description && <p><strong>SEO Desc:</strong> {page.meta_description}</p>}
                        </div>
                      )}
                    </div>
                  )}
                  {page?.updated_at && (
                    <p className="text-xs text-muted-foreground mt-3">Last updated: {new Date(page.updated_at).toLocaleString()}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SitePagesEditor;
