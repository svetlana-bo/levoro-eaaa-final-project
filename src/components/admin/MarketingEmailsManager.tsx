import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RichTextEditor, type RichTextEditorHandle } from "@/components/lesson-editor/RichTextEditor";
import { MediaUpload } from "@/components/MediaUpload";
import { Eye, Save, Trash2, Pencil, Loader2, ChevronDown, ChevronRight, Download, Upload, Plus, FolderOpen, Copy } from "lucide-react";
import { toast } from "sonner";
import EmailPreviewDialog from "./EmailPreviewDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import EmailFlowBuilder from "./EmailFlowBuilder";
import { EmailBlockEditor } from "./email-blocks/EmailBlockEditor";
import type { EmailBlock } from "./email-blocks/blockTypes";
import { blocksToEmailHtml } from "./email-blocks/serializeBlocks";

interface HeaderConfig {
  bgColor: string;
  bgImageUrl: string;
  textColor: string;
  showHeader: boolean;
  headerHeight: number;
}

interface FooterConfig {
  bgColor: string;
  textColor: string;
  companyName: string;
  contactEmail: string;
  socialLinks: { platform: string; url: string }[];
  showFooter: boolean;
  unsubscribeText: string;
  unsubscribeUrl: string;
}

const DEFAULT_HEADER: HeaderConfig = { bgColor: "#1a1a2e", bgImageUrl: "", textColor: "#ffffff", showHeader: true, headerHeight: 180 };
const DEFAULT_FOOTER: FooterConfig = { bgColor: "#1a1a2e", textColor: "#ffffff", companyName: "Levoro Academy", contactEmail: "info@levoroacademy.com", socialLinks: [], showFooter: true, unsubscribeText: "You received this email because you signed up on our website or made a purchase from us.", unsubscribeUrl: "" };
const SOCIAL_PLATFORMS = ["instagram", "facebook", "linkedin", "tiktok", "twitter", "youtube"] as const;

const MERGE_VARIABLES = [
  { tag: "{{first_name}}", label: "First Name" },
  { tag: "{{email}}", label: "Email" },
];

export default function MarketingEmailsManager() {
  const queryClient = useQueryClient();
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [tab, setTab] = useState("templates");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formPreheader, setFormPreheader] = useState("");
  const [formHeaderText, setFormHeaderText] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formBlocks, setFormBlocks] = useState<EmailBlock[]>([]);
  const [formHeader, setFormHeader] = useState<HeaderConfig>({ ...DEFAULT_HEADER });
  const [formFooter, setFormFooter] = useState<FooterConfig>({ ...DEFAULT_FOOTER });
  const [formGroupId, setFormGroupId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ header: true, body: true, footer: false });
  const [newGroupName, setNewGroupName] = useState("");
  const [inlineGroupName, setInlineGroupName] = useState("");
  const [showInlineGroupInput, setShowInlineGroupInput] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const sanitizeEmailHtml = (html: string) =>
    html.replace(/<a\b([^>]*)href=(['"])([^'"]+)\2([^>]*)>([\s\S]*?)<\/a>/gi, (_, before, quote, href, after, content) => {
      let fixedHref = String(href).trim();
      while (/^https?:\/\/https?:\/\//i.test(fixedHref)) fixedHref = fixedHref.replace(/^https?:\/\/(?=https?:\/\/)/i, "");
      fixedHref = fixedHref.replace(/^https\/\//i, "https://").replace(/^http\/\//i, "http://");
      if (fixedHref && !/^(https?:\/\/|mailto:|tel:|#)/i.test(fixedHref)) fixedHref = `https://${fixedHref}`;
      const fixedContent = String(content).replace(/\bhttps?:\/\/https?:\/\/[^\s<]+/gi, (url) => url.replace(/^https?:\/\/(?=https?:\/\/)/i, ""));
      return `<a${before}href=${quote}${fixedHref}${quote}${after}>${fixedContent}</a>`;
    });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["marketing-emails"],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketing_emails" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["email-groups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("email_groups" as any).select("*").order("sort_order");
      if (error) throw error;
      return data as any[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      // If using blocks, serialize to HTML; else fall back to formBody (legacy text-only)
      const hasBlocks = formBlocks.length > 0;
      const renderedBody = hasBlocks ? blocksToEmailHtml(formBlocks) : formBody;
      const sanitizedBody = sanitizeEmailHtml(renderedBody);
      const payload: any = {
        title: formTitle,
        subject: formSubject,
        preheader: formPreheader,
        header_text: formHeaderText,
        body: sanitizedBody,
        body_blocks: formBlocks,
        header_config: formHeader,
        footer_config: formFooter,
        group_id: formGroupId || null,
        buttons: [],
        updated_at: new Date().toISOString(),
      };
      if (editingId) {
        const { error } = await supabase.from("marketing_emails" as any).update(payload as any).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("marketing_emails" as any).insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-emails"] });
      toast.success(editingId ? "Template updated" : "Template created");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (t: any) => {
      const payload: any = {
        title: `${t.title} (Copy)`,
        subject: t.subject,
        preheader: t.preheader || "",
        header_text: t.header_text || "",
        body: t.body || "",
        body_blocks: t.body_blocks || [],
        header_config: t.header_config || DEFAULT_HEADER,
        footer_config: t.footer_config || DEFAULT_FOOTER,
        group_id: t.group_id || null,
        buttons: t.buttons || [],
      };
      const { error } = await supabase.from("marketing_emails" as any).insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-emails"] });
      toast.success("Template duplicated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_emails" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-emails"] });
      toast.success("Template deleted");
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from("email_groups" as any).insert({ name, sort_order: groups.length } as any).select().single();
      if (error) throw error;
      return data as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-groups"] });
      setNewGroupName("");
      toast.success("Group created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_groups" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-groups"] });
      toast.success("Group deleted");
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setFormTitle("");
    setFormSubject("");
    setFormPreheader("");
    setFormHeaderText("");
    setFormBody("");
    setFormBlocks([]);
    setFormHeader({ ...DEFAULT_HEADER });
    setFormFooter({ ...DEFAULT_FOOTER });
    setFormGroupId(null);
  };

  const startEdit = (t: any) => {
    setEditingId(t.id);
    setFormTitle(t.title);
    setFormSubject(t.subject);
    setFormPreheader(t.preheader || "");
    setFormHeaderText(t.header_text || "");
    const existingBlocks: EmailBlock[] = Array.isArray(t.body_blocks) ? t.body_blocks : [];
    if (existingBlocks.length > 0) {
      setFormBlocks(existingBlocks);
      setFormBody("");
    } else {
      // Legacy: convert existing body HTML to a single text block
      const legacyHtml = sanitizeEmailHtml(t.body || "");
      if (legacyHtml.trim()) {
        setFormBlocks([{ type: "text", id: crypto.randomUUID(), html: legacyHtml }]);
      } else {
        setFormBlocks([]);
      }
      setFormBody(legacyHtml);
    }
    setFormHeader({ ...DEFAULT_HEADER, ...(t.header_config || {}) });
    setFormFooter({ ...DEFAULT_FOOTER, ...(t.footer_config || {}) });
    setFormGroupId(t.group_id || null);
    setOpenSections({ header: true, body: true, footer: true });
  };

  const openPreview = (t: any) => {
    setPreviewData({
      subject: t.subject,
      headerText: t.header_text || "",
      preheader: t.preheader || "",
      body: sanitizeEmailHtml(t.body),
      headerConfig: { ...DEFAULT_HEADER, ...(t.header_config || {}) },
      footerConfig: { ...DEFAULT_FOOTER, ...(t.footer_config || {}) },
    });
    setPreviewOpen(true);
  };

  const updateFooterSocial = (platform: string, url: string) => {
    setFormFooter(prev => {
      const existing = prev.socialLinks.filter(s => s.platform !== platform);
      return { ...prev, socialLinks: [...existing, { platform, url }] };
    });
  };

  const getSocialUrl = (platform: string) => formFooter.socialLinks.find(s => s.platform === platform)?.url || "";

  const handleInsertVariable = (tag: string) => {
    if (editorRef.current) {
      editorRef.current.insertText(tag);
    } else {
      setFormBody(prev => prev + tag);
    }
  };

  const SectionHeader = ({ label, sectionKey, children }: { label: string; sectionKey: string; children?: React.ReactNode }) => (
    <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-left font-semibold text-sm" onClick={() => toggleSection(sectionKey)}>
      {openSections[sectionKey] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      {label}
      {children}
    </CollapsibleTrigger>
  );

  // Group templates for the list view
  const ungrouped = templates.filter((t: any) => !t.group_id);
  const grouped = groups.map((g: any) => ({
    ...g,
    templates: templates.filter((t: any) => t.group_id === g.id),
  }));

  const renderTemplateCard = (t: any) => (
    <Card key={t.id}>
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <p className="font-medium">{t.title}</p>
          <p className="text-sm text-muted-foreground">{t.subject}</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => openPreview(t)} title="Preview"><Eye className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => startEdit(t)} title="Edit"><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => duplicateMutation.mutate(t)} title="Duplicate" disabled={duplicateMutation.isPending}><Copy className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget({ id: t.id, title: t.title || "Untitled" })} title="Delete"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="flows">Automated Flows</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6 mt-4">
          {/* Group Management */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FolderOpen className="h-4 w-4" /> Email Groups</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="New group name..." className="h-8 text-sm flex-1" />
                <Button size="sm" className="h-8 gap-1" onClick={() => { if (newGroupName.trim()) createGroupMutation.mutate(newGroupName.trim()); }} disabled={!newGroupName.trim() || createGroupMutation.isPending}>
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              {groups.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {groups.map((g: any) => (
                    <div key={g.id} className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
                      <FolderOpen className="h-3 w-3" />
                      {g.name}
                      <button onClick={() => deleteGroupMutation.mutate(g.id)} className="ml-1 text-destructive hover:text-destructive/80">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingId ? "Edit Template" : "Create New Template"}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => {
                    const renderedBody = formBlocks.length > 0 ? blocksToEmailHtml(formBlocks) : formBody;
                    setPreviewData({ subject: formSubject, headerText: formHeaderText, preheader: formPreheader, body: sanitizeEmailHtml(renderedBody), headerConfig: formHeader, footerConfig: formFooter });
                    setPreviewOpen(true);
                  }} disabled={formBlocks.length === 0 && !formBody}>
                    <Eye className="h-4 w-4" /> Preview
                  </Button>
                  <Button size="sm" className="gap-1" onClick={() => {
                    const hasContent = formBlocks.length > 0 || !!formBody.trim();
                    if (!formTitle.trim() || !formSubject.trim() || !hasContent) {
                      toast.error("Title, subject, and at least one body block are required.");
                      return;
                    }
                    upsertMutation.mutate();
                  }} disabled={!formTitle.trim() || !formSubject.trim() || (formBlocks.length === 0 && !formBody.trim()) || upsertMutation.isPending}>
                    {upsertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {editingId ? "Update" : "Create"}
                  </Button>
                  {editingId && <Button variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title, Subject, Pre-header, Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Title (internal only)</Label><Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Welcome Series #1" /></div>
                <div><Label>Subject Line</Label><Input value={formSubject} onChange={(e) => setFormSubject(e.target.value)} placeholder="e.g. Welcome to Levoro!" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Pre-header <span className="text-muted-foreground text-xs">(preview text in inbox)</span></Label>
                  <Input value={formPreheader} onChange={(e) => setFormPreheader(e.target.value)} placeholder="Short preview text shown after subject..." />
                </div>
                <div>
                  <Label>Group</Label>
                  {showInlineGroupInput ? (
                    <div className="flex gap-2">
                      <Input
                        value={inlineGroupName}
                        onChange={e => setInlineGroupName(e.target.value)}
                        placeholder="Group name..."
                        className="h-10"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === "Enter" && inlineGroupName.trim()) {
                            createGroupMutation.mutate(inlineGroupName.trim(), {
                              onSuccess: (newGroup: any) => {
                                setFormGroupId(newGroup.id);
                                setInlineGroupName("");
                                setShowInlineGroupInput(false);
                              }
                            });
                          }
                          if (e.key === "Escape") { setShowInlineGroupInput(false); setInlineGroupName(""); }
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-10"
                        disabled={!inlineGroupName.trim() || createGroupMutation.isPending}
                        onClick={() => {
                          if (inlineGroupName.trim()) {
                            createGroupMutation.mutate(inlineGroupName.trim(), {
                              onSuccess: (newGroup: any) => {
                                setFormGroupId(newGroup.id);
                                setInlineGroupName("");
                                setShowInlineGroupInput(false);
                              }
                            });
                          }
                        }}
                      >
                        {createGroupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-10" onClick={() => { setShowInlineGroupInput(false); setInlineGroupName(""); }}>Cancel</Button>
                    </div>
                  ) : (
                    <Select value={formGroupId || "none"} onValueChange={v => {
                      if (v === "__create__") {
                        setShowInlineGroupInput(true);
                      } else {
                        setFormGroupId(v === "none" ? null : v);
                      }
                    }}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="No group" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No group</SelectItem>
                        {groups.map((g: any) => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                        <SelectItem value="__create__" className="text-primary font-medium">
                          <span className="flex items-center gap-1"><Plus className="h-3 w-3" /> Create new group...</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Header Section */}
              <Collapsible open={openSections.header}>
                <SectionHeader label="Header" sectionKey="header" />
                <CollapsibleContent className="space-y-3 pl-6 pb-3">
                  <div className="flex items-center gap-3">
                    <Label className="text-xs">Show Header</Label>
                    <Switch checked={formHeader.showHeader} onCheckedChange={(v) => setFormHeader(prev => ({ ...prev, showHeader: v }))} />
                  </div>
                  {formHeader.showHeader && (
                    <>
                      <div>
                        <Label className="text-xs">Header Text (optional — displayed on header image)</Label>
                        <Input value={formHeaderText} onChange={(e) => setFormHeaderText(e.target.value)} placeholder="Leave empty for no text overlay" className="h-8 text-xs" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Background Color</Label>
                          <div className="flex gap-2 items-center">
                            <input type="color" value={formHeader.bgColor} onChange={e => setFormHeader(prev => ({ ...prev, bgColor: e.target.value }))} className="h-8 w-10 rounded border cursor-pointer" />
                            <Input value={formHeader.bgColor} onChange={e => setFormHeader(prev => ({ ...prev, bgColor: e.target.value }))} className="flex-1 h-8 text-xs" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Text Color</Label>
                          <div className="flex gap-2 items-center">
                            <input type="color" value={formHeader.textColor} onChange={e => setFormHeader(prev => ({ ...prev, textColor: e.target.value }))} className="h-8 w-10 rounded border cursor-pointer" />
                            <Input value={formHeader.textColor} onChange={e => setFormHeader(prev => ({ ...prev, textColor: e.target.value }))} className="flex-1 h-8 text-xs" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Header Height: {formHeader.headerHeight}px</Label>
                        <Slider
                          value={[formHeader.headerHeight]}
                          onValueChange={([v]) => setFormHeader(prev => ({ ...prev, headerHeight: v }))}
                          min={60}
                          max={400}
                          step={10}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Background Image (optional)</Label>
                        <MediaUpload value={formHeader.bgImageUrl || ""} onChange={(url) => setFormHeader(prev => ({ ...prev, bgImageUrl: url }))} accept="image/*" />
                      </div>
                    </>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Body Section — block-based editor wrapped in 600px guide */}
              <Collapsible open={openSections.body}>
                <SectionHeader label="Body Content" sectionKey="body" />
                <CollapsibleContent className="pb-3 space-y-2">
                  <div className="relative mx-auto border-l border-r border-dashed border-muted-foreground/30" style={{ width: 600, maxWidth: '100%' }}>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground bg-background px-2">600px email width</div>
                    <div style={{ padding: '24px 20px' }}>
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className="text-xs text-muted-foreground">Insert variable into a text block:</span>
                        {MERGE_VARIABLES.map(v => (
                          <button
                            key={v.tag}
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(v.tag);
                              toast.success(`${v.tag} copied — paste into a text block`);
                            }}
                            className="px-2 py-0.5 text-xs rounded-full border border-border bg-muted hover:bg-accent transition-colors"
                            title="Click to copy"
                          >
                            {v.tag} <span className="text-muted-foreground ml-0.5">{v.label}</span>
                          </button>
                        ))}
                      </div>
                      <EmailBlockEditor blocks={formBlocks} onChange={setFormBlocks} />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Footer Section */}
              <Collapsible open={openSections.footer}>
                <div className="flex items-center justify-between">
                  <SectionHeader label="Footer" sectionKey="footer" />
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs h-7"
                      onClick={() => {
                        localStorage.setItem("levoro_footer_template", JSON.stringify(formFooter));
                        toast.success("Footer saved as template");
                      }}
                    >
                      <Download className="h-3 w-3" /> Save Footer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs h-7"
                      onClick={() => {
                        const saved = localStorage.getItem("levoro_footer_template");
                        if (saved) {
                          try {
                            const parsed = JSON.parse(saved);
                            setFormFooter({ ...DEFAULT_FOOTER, ...parsed });
                            toast.success("Footer template loaded");
                          } catch { toast.error("Invalid saved template"); }
                        } else {
                          toast.error("No saved footer template found");
                        }
                      }}
                    >
                      <Upload className="h-3 w-3" /> Load Footer
                    </Button>
                  </div>
                </div>
                <CollapsibleContent className="space-y-3 pl-6 pb-3">
                  <div className="flex items-center gap-3">
                    <Label className="text-xs">Show Footer</Label>
                    <Switch checked={formFooter.showFooter} onCheckedChange={(v) => setFormFooter(prev => ({ ...prev, showFooter: v }))} />
                  </div>
                  {formFooter.showFooter && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Background Color</Label>
                          <div className="flex gap-2 items-center">
                            <input type="color" value={formFooter.bgColor} onChange={e => setFormFooter(prev => ({ ...prev, bgColor: e.target.value }))} className="h-8 w-10 rounded border cursor-pointer" />
                            <Input value={formFooter.bgColor} onChange={e => setFormFooter(prev => ({ ...prev, bgColor: e.target.value }))} className="flex-1 h-8 text-xs" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Text Color</Label>
                          <div className="flex gap-2 items-center">
                            <input type="color" value={formFooter.textColor} onChange={e => setFormFooter(prev => ({ ...prev, textColor: e.target.value }))} className="h-8 w-10 rounded border cursor-pointer" />
                            <Input value={formFooter.textColor} onChange={e => setFormFooter(prev => ({ ...prev, textColor: e.target.value }))} className="flex-1 h-8 text-xs" />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Company Name</Label>
                          <Input value={formFooter.companyName} onChange={e => setFormFooter(prev => ({ ...prev, companyName: e.target.value }))} className="h-8 text-xs" />
                        </div>
                        <div>
                          <Label className="text-xs">Contact Email</Label>
                          <Input value={formFooter.contactEmail} onChange={e => setFormFooter(prev => ({ ...prev, contactEmail: e.target.value }))} className="h-8 text-xs" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Social Links</Label>
                        {SOCIAL_PLATFORMS.map(platform => (
                          <div key={platform} className="flex items-center gap-2">
                            <span className="text-xs capitalize w-20">{platform}</span>
                            <Input value={getSocialUrl(platform)} onChange={e => updateFooterSocial(platform, e.target.value)} placeholder={`https://${platform}.com/...`} className="h-8 text-xs flex-1" />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 pt-2 border-t border-border">
                        <Label className="text-xs font-medium">Unsubscribe Section</Label>
                        <div>
                          <Label className="text-xs">Message Text</Label>
                          <Textarea
                            value={formFooter.unsubscribeText}
                            onChange={e => setFormFooter(prev => ({ ...prev, unsubscribeText: e.target.value }))}
                            placeholder="You received this email because..."
                            className="text-xs min-h-[60px]"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Unsubscribe URL (leave empty for mailto fallback)</Label>
                          <Input
                            value={formFooter.unsubscribeUrl}
                            onChange={e => setFormFooter(prev => ({ ...prev, unsubscribeUrl: e.target.value }))}
                            placeholder="https://yourdomain.com/unsubscribe"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Templates list — organized by groups */}
          {isLoading ? (
            <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>
          ) : templates.length === 0 ? (
            <p className="text-muted-foreground text-base">No marketing email templates yet.</p>
          ) : (
            <div className="space-y-4">
              {/* Grouped templates */}
              {grouped.map((g: any) => g.templates.length > 0 && (
                <Collapsible key={g.id} defaultOpen>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 text-left font-semibold text-sm">
                    <FolderOpen className="h-4 w-4" />
                    {g.name}
                    <span className="text-xs text-muted-foreground font-normal">({g.templates.length})</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pl-6">
                    {g.templates.map((t: any) => renderTemplateCard(t))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {/* Ungrouped */}
              {ungrouped.length > 0 && (
                <div className="space-y-2">
                  {groups.length > 0 && <p className="text-xs text-muted-foreground font-semibold py-1">Ungrouped</p>}
                  {ungrouped.map((t: any) => renderTemplateCard(t))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="flows" className="mt-4">
          <EmailFlowBuilder />
        </TabsContent>
      </Tabs>

      <EmailPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        subject={previewData.subject || ""}
        headerText={previewData.headerText || ""}
        preheader={previewData.preheader || ""}
        body={previewData.body || ""}
        headerConfig={previewData.headerConfig}
        footerConfig={previewData.footerConfig}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete email template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.title}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
