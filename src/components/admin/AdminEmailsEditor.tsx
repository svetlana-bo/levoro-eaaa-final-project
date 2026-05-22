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
import { Slider } from "@/components/ui/slider";
import { RichTextEditor, type RichTextEditorHandle } from "@/components/lesson-editor/RichTextEditor";
import { MediaUpload } from "@/components/MediaUpload";
import { Eye, Save, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import EmailPreviewDialog from "./EmailPreviewDialog";

type EmailType = "invite" | "reset" | "welcome" | "verify";

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

export default function AdminEmailsEditor() {
  const queryClient = useQueryClient();
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [activeTab, setActiveTab] = useState<EmailType>("invite");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<any>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ header: true, body: true, footer: false });

  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const { data: settings, isLoading } = useQuery({
    queryKey: ["email-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("email_settings" as any).select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const displayed = localSettings || settings;

  const saveMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!displayed?.id) return;
      const { error } = await supabase.from("email_settings" as any).update({ ...updates, updated_at: new Date().toISOString() } as any).eq("id", displayed.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-settings"] });
      setLocalSettings(null);
      toast.success("Email settings saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex items-center gap-2 p-8"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>;
  if (!displayed) return <p className="p-8 text-muted-foreground">No email settings found.</p>;

  const update = (field: string, value: any) => {
    setLocalSettings((prev: any) => ({ ...(prev || settings), [field]: value }));
  };

  const getHeaderConfig = (type: EmailType): HeaderConfig => {
    const raw = displayed[`${type}_header_config`];
    return raw ? { ...DEFAULT_HEADER, ...raw } : { ...DEFAULT_HEADER };
  };

  const getFooterConfig = (type: EmailType): FooterConfig => {
    const raw = displayed[`${type}_footer_config`];
    return raw ? { ...DEFAULT_FOOTER, ...raw } : { ...DEFAULT_FOOTER };
  };

  const updateHeaderConfig = (type: EmailType, patch: Partial<HeaderConfig>) => {
    const current = getHeaderConfig(type);
    update(`${type}_header_config`, { ...current, ...patch });
  };

  const updateFooterConfig = (type: EmailType, patch: Partial<FooterConfig>) => {
    const current = getFooterConfig(type);
    update(`${type}_footer_config`, { ...current, ...patch });
  };

  const updateFooterSocial = (type: EmailType, platform: string, url: string) => {
    const fc = getFooterConfig(type);
    const links = [...(fc.socialLinks || [])];
    const idx = links.findIndex(s => s.platform === platform);
    if (idx >= 0) links[idx] = { platform, url };
    else links.push({ platform, url });
    updateFooterConfig(type, { socialLinks: links });
  };

  const handleSave = () => {
    const d = localSettings || settings;
    saveMutation.mutate({
      sender_name: d.sender_name,
      sender_email: d.sender_email,
      invite_subject: d.invite_subject, invite_heading: d.invite_heading, invite_body: d.invite_body,
      invite_header_config: d.invite_header_config, invite_footer_config: d.invite_footer_config, invite_preheader: d.invite_preheader,
      reset_subject: d.reset_subject, reset_heading: d.reset_heading, reset_body: d.reset_body,
      reset_header_config: d.reset_header_config, reset_footer_config: d.reset_footer_config, reset_preheader: d.reset_preheader,
      welcome_subject: d.welcome_subject, welcome_heading: d.welcome_heading, welcome_body: d.welcome_body,
      welcome_header_config: d.welcome_header_config, welcome_footer_config: d.welcome_footer_config, welcome_preheader: d.welcome_preheader,
      verify_subject: d.verify_subject, verify_heading: d.verify_heading, verify_body: d.verify_body,
      verify_header_config: d.verify_header_config, verify_footer_config: d.verify_footer_config, verify_preheader: d.verify_preheader,
    });
  };

  const currentSubject = displayed[`${activeTab}_subject`] || "";
  const currentHeading = displayed[`${activeTab}_heading`] || "";
  const currentBody = displayed[`${activeTab}_body`] || "";
  const currentPreheader = displayed[`${activeTab}_preheader`] || "";
  const currentHeaderConfig = getHeaderConfig(activeTab);
  const currentFooterConfig = getFooterConfig(activeTab);

  const handleInsertVariable = (tag: string) => {
    if (editorRef.current) {
      editorRef.current.insertText(tag);
    } else {
      const field = `${activeTab}_body`;
      update(field, (displayed[field] || "") + tag);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Sender Settings</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Sender Name</Label>
            <Input value={displayed.sender_name || ""} onChange={(e) => update("sender_name", e.target.value)} />
          </div>
          <div>
            <Label>Sender Email</Label>
            <Input value={displayed.sender_email || ""} onChange={(e) => update("sender_email", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Email Templates</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setPreviewOpen(true)}>
                <Eye className="h-4 w-4" /> Preview
              </Button>
              <Button size="sm" className="gap-1" onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EmailType)}>
            <TabsList>
              <TabsTrigger value="invite">Invite Email</TabsTrigger>
              <TabsTrigger value="reset">Password Reset</TabsTrigger>
              <TabsTrigger value="welcome">Welcome Email</TabsTrigger>
              <TabsTrigger value="verify">Email Verification</TabsTrigger>
            </TabsList>
            {(["invite", "reset", "welcome", "verify"] as EmailType[]).map((type) => {
              const hc = getHeaderConfig(type);
              const fc = getFooterConfig(type);
              return (
                <TabsContent key={type} value={type} className="space-y-4 mt-4">
                  {/* Subject & Preheader */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Subject</Label>
                      <Input value={displayed[`${type}_subject`] || ""} onChange={(e) => update(`${type}_subject`, e.target.value)} />
                    </div>
                    <div>
                      <Label>Preheader <span className="text-xs text-muted-foreground">(inbox preview text)</span></Label>
                      <Input value={displayed[`${type}_preheader`] || ""} onChange={(e) => update(`${type}_preheader`, e.target.value)} />
                    </div>
                  </div>

                  {/* Header Section */}
                  <Collapsible open={openSections.header} onOpenChange={() => toggleSection("header")}>
                    <CollapsibleTrigger className="flex items-center gap-2 font-semibold text-sm w-full py-2">
                      {openSections.header ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      Header
                      <Switch
                        checked={hc.showHeader}
                        onCheckedChange={(v) => updateHeaderConfig(type, { showHeader: v })}
                        onClick={(e) => e.stopPropagation()}
                        className="ml-auto"
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pl-6 pt-2">
                      <div>
                        <Label>Heading Text</Label>
                        <Input value={displayed[`${type}_heading`] || ""} onChange={(e) => update(`${type}_heading`, e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Background Color</Label>
                          <div className="flex gap-2 items-center">
                            <input type="color" value={hc.bgColor} onChange={(e) => updateHeaderConfig(type, { bgColor: e.target.value })} className="w-10 h-8 rounded border cursor-pointer" />
                            <Input value={hc.bgColor} onChange={(e) => updateHeaderConfig(type, { bgColor: e.target.value })} className="flex-1" />
                          </div>
                        </div>
                        <div>
                          <Label>Text Color</Label>
                          <div className="flex gap-2 items-center">
                            <input type="color" value={hc.textColor} onChange={(e) => updateHeaderConfig(type, { textColor: e.target.value })} className="w-10 h-8 rounded border cursor-pointer" />
                            <Input value={hc.textColor} onChange={(e) => updateHeaderConfig(type, { textColor: e.target.value })} className="flex-1" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label>Background Image</Label>
                        <div className="flex gap-2 items-center">
                          <MediaUpload value={hc.bgImageUrl || ""} onChange={(url) => updateHeaderConfig(type, { bgImageUrl: url })} accept="image/*" placeholder="Paste URL or upload" />
                        </div>
                      </div>
                      <div>
                        <Label>Header Height: {hc.headerHeight}px</Label>
                        <Slider value={[hc.headerHeight]} onValueChange={([v]) => updateHeaderConfig(type, { headerHeight: v })} min={60} max={400} step={10} />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Body Section */}
                  <Collapsible open={openSections.body} onOpenChange={() => toggleSection("body")}>
                    <CollapsibleTrigger className="flex items-center gap-2 font-semibold text-sm w-full py-2">
                      {openSections.body ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      Body
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-2">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs text-muted-foreground">Insert variable:</span>
                        {MERGE_VARIABLES.map(v => (
                          <button
                            key={v.tag}
                            type="button"
                            onClick={() => handleInsertVariable(v.tag)}
                            className="px-2 py-0.5 text-xs rounded-full border border-border bg-muted hover:bg-accent transition-colors"
                          >
                            {v.tag} <span className="text-muted-foreground ml-0.5">{v.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="mx-auto" style={{ maxWidth: 600 }}>
                        <div className="border rounded-lg overflow-hidden" style={{ padding: "0 28px" }}>
                          <RichTextEditor ref={editorRef} value={displayed[`${type}_body`] || ""} onChange={(html) => update(`${type}_body`, html)} />
                        </div>
                      </div>
                      {type === "invite" && (
                        <div className="flex items-center gap-2 p-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-800">
                          <span>ℹ️</span>
                          <span>A <strong>"Set Up Your Account"</strong> button will be automatically added to this email.</span>
                        </div>
                      )}
                      {type === "reset" && (
                        <div className="flex items-center gap-2 p-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-800">
                          <span>ℹ️</span>
                          <span>A <strong>"Reset Your Password"</strong> button will be automatically added to this email.</span>
                        </div>
                      )}
                      {type === "verify" && (
                        <div className="flex items-center gap-2 p-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-800">
                          <span>ℹ️</span>
                          <span>A <strong>"Confirm Email"</strong> button will be automatically added. Sent on signup when email confirmation is enabled in Supabase.</span>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Footer Section */}
                  <Collapsible open={openSections.footer} onOpenChange={() => toggleSection("footer")}>
                    <CollapsibleTrigger className="flex items-center gap-2 font-semibold text-sm w-full py-2">
                      {openSections.footer ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      Footer
                      <Switch
                        checked={fc.showFooter}
                        onCheckedChange={(v) => updateFooterConfig(type, { showFooter: v })}
                        onClick={(e) => e.stopPropagation()}
                        className="ml-auto"
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pl-6 pt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Background Color</Label>
                          <div className="flex gap-2 items-center">
                            <input type="color" value={fc.bgColor} onChange={(e) => updateFooterConfig(type, { bgColor: e.target.value })} className="w-10 h-8 rounded border cursor-pointer" />
                            <Input value={fc.bgColor} onChange={(e) => updateFooterConfig(type, { bgColor: e.target.value })} className="flex-1" />
                          </div>
                        </div>
                        <div>
                          <Label>Text Color</Label>
                          <div className="flex gap-2 items-center">
                            <input type="color" value={fc.textColor} onChange={(e) => updateFooterConfig(type, { textColor: e.target.value })} className="w-10 h-8 rounded border cursor-pointer" />
                            <Input value={fc.textColor} onChange={(e) => updateFooterConfig(type, { textColor: e.target.value })} className="flex-1" />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Company Name</Label>
                          <Input value={fc.companyName || ""} onChange={(e) => updateFooterConfig(type, { companyName: e.target.value })} />
                        </div>
                        <div>
                          <Label>Contact Email</Label>
                          <Input value={fc.contactEmail || ""} onChange={(e) => updateFooterConfig(type, { contactEmail: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <Label>Unsubscribe Text</Label>
                        <Input value={fc.unsubscribeText || ""} onChange={(e) => updateFooterConfig(type, { unsubscribeText: e.target.value })} />
                      </div>
                      <div>
                        <Label className="font-medium text-sm mb-2 block">Social Links</Label>
                        <div className="space-y-2">
                          {SOCIAL_PLATFORMS.map((platform) => {
                            const link = (fc.socialLinks || []).find(s => s.platform === platform);
                            return (
                              <div key={platform} className="flex items-center gap-2">
                                <span className="w-24 capitalize text-sm">{platform}</span>
                                <Input
                                  value={link?.url || ""}
                                  onChange={(e) => updateFooterSocial(type, platform, e.target.value)}
                                  placeholder={`https://${platform}.com/...`}
                                  className="flex-1"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      <EmailPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        subject={currentSubject}
        headerText={currentHeading}
        preheader={currentPreheader}
        body={currentBody}
        senderName={displayed.sender_name}
        senderEmail={displayed.sender_email}
        headerConfig={currentHeaderConfig}
        footerConfig={currentFooterConfig}
      />
    </div>
  );
}
