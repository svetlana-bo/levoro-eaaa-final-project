import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { MediaUpload } from "@/components/MediaUpload";
import { ThumbnailCropper } from "@/components/ThumbnailCropper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Linkedin, Save, Loader2, Crop, X, Plus, User as UserIcon, Building2, Globe, UserPlus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";



interface Props {
  userId: string | null;
  userRole?: string | null;
  company?: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Scope = "user" | "company";

export default function EditUserProfileDialog({ userId, userRole, company, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<Scope>("user");
  const [activeUserId, setActiveUserId] = useState<string | null>(userId);
  const [activeUserRole, setActiveUserRole] = useState<string | null | undefined>(userRole);
  const [pendingDeleteMember, setPendingDeleteMember] = useState<{ id: string; name: string } | null>(null);

  // user form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [instructorType, setInstructorType] = useState<"individual" | "company" | "company_member">("individual");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [memberRole, setMemberRole] = useState<"instructor" | "main_instructor">("instructor");
  const [initialCompanyId, setInitialCompanyId] = useState<string | null>(null);
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: "", country: "", website_url: "", linkedin_url: "", logo_url: "", bio: "" });
  const [creatingCompany, setCreatingCompany] = useState(false);

  // company form
  const [cName, setCName] = useState("");
  const [cBio, setCBio] = useState("");
  const [cLogo, setCLogo] = useState("");
  const [cLinkedin, setCLinkedin] = useState("");
  const [cWebsite, setCWebsite] = useState("");
  const [cCountry, setCCountry] = useState("");
  const [cLoaded, setCLoaded] = useState(false);
  const [cCropOpen, setCCropOpen] = useState(false);
  const [newInstructors, setNewInstructors] = useState<Array<{ first_name: string; last_name: string; email: string; country: string }>>([]);
  const [sendInvite, setSendInvite] = useState(true);
  const [addingInstructors, setAddingInstructors] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["admin-edit-profile", activeUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, company_name, instructor_type, bio, avatar_url, linkedin_url")
        .eq("id", activeUserId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!activeUserId && open && scope === "user",
  });

  const { data: companyData, isLoading: companyLoading } = useQuery({
    queryKey: ["admin-edit-company", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_companies")
        .select("name, bio, logo_url, linkedin_url, website_url, country")
        .eq("id", company!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!company?.id && open && scope === "company",
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ["instructor-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_categories" as any)
        .select("id, name, sort_order")
        .order("sort_order");
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  const { data: currentExpertise = [] } = useQuery({
    queryKey: ["instructor-expertise", activeUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_expertise" as any)
        .select("category_id")
        .eq("instructor_id", activeUserId!);
      if (error) throw error;
      return ((data as any[]) || []).map(r => r.category_id);
    },
    enabled: !!activeUserId && open && scope === "user",
  });

  const { data: companiesList = [] } = useQuery({
    queryKey: ["admin-instructor-companies-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_companies")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: open && scope === "user",
  });

  const { data: currentMembership } = useQuery({
    queryKey: ["admin-user-membership", activeUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_company_members")
        .select("id, company_id, member_role")
        .eq("user_id", activeUserId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!activeUserId && open && scope === "user",
  });

  const { data: companyMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ["admin-company-members", company?.id],
    queryFn: async () => {
      const { data: memberRows, error } = await supabase
        .from("instructor_company_members")
        .select("id, user_id, member_role, created_at")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const ids = (memberRows || []).map((m: any) => m.user_id);
      if (ids.length === 0) return [];
      const { data: profs, error: pErr } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", ids);
      if (pErr) throw pErr;
      const byId = new Map((profs || []).map((p: any) => [p.id, p]));
      return (memberRows || [])
        .map((m: any) => ({ ...m, profile: byId.get(m.user_id) || null }))
        .sort((a: any, b: any) => {
          if (a.member_role === "main_instructor" && b.member_role !== "main_instructor") return -1;
          if (b.member_role === "main_instructor" && a.member_role !== "main_instructor") return 1;
          return 0;
        });
    },
    enabled: !!company?.id && open && scope === "company",
  });

  useEffect(() => {
    if (profile && !loaded) {
      const p = profile as any;
      setFirstName(p.first_name || "");
      setLastName(p.last_name || "");
      setCompanyName(p.company_name || "");
      setInstructorType((p.instructor_type as any) || "individual");
      setBio(p.bio || "");
      setAvatarUrl(p.avatar_url || "");
      setLinkedinUrl(p.linkedin_url || "");
      setSelectedCategoryIds(currentExpertise);
      const m = currentMembership as any;
      setSelectedCompanyId(m?.company_id ?? null);
      setMemberRole((m?.member_role as any) || "instructor");
      setInitialCompanyId(m?.company_id ?? null);
      setLoaded(true);
    }
  }, [profile, loaded, currentExpertise, currentMembership]);

  useEffect(() => {
    if (companyData && !cLoaded) {
      const c = companyData as any;
      setCName(c.name || "");
      setCBio(c.bio || "");
      setCLogo(c.logo_url || "");
      setCLinkedin(c.linkedin_url || "");
      setCWebsite(c.website_url || "");
      setCCountry(c.country || "");
      setCLoaded(true);
    }
  }, [companyData, cLoaded]);

  useEffect(() => {
    if (!open) {
      setLoaded(false);
      setCLoaded(false);
      setScope("user");
      setNewInstructors([]);
      setSendInvite(true);
      setActiveUserId(userId);
      setActiveUserRole(userRole);
    }
  }, [open, userId, userRole]);

  // When opening or when the prop userId changes, sync active user
  useEffect(() => {
    if (open) {
      setActiveUserId(userId);
      setActiveUserRole(userRole);
    }
  }, [open, userId, userRole]);

  const isInstructor = activeUserRole === "instructor";

  const switchToEditMember = async (memberUserId: string) => {
    // Look up role for the selected member
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", memberUserId)
      .maybeSingle();
    setActiveUserId(memberUserId);
    setActiveUserRole((roleRow as any)?.role ?? "instructor");
    setLoaded(false);
    setScope("user");
  };

  const deleteMember = async (membershipId: string) => {
    const { error } = await supabase
      .from("instructor_company_members")
      .delete()
      .eq("id", membershipId);
    if (error) {
      toast.error(error.message || "Failed to remove instructor");
      return;
    }
    toast.success("Instructor removed from company");
    queryClient.invalidateQueries({ queryKey: ["admin-company-members", company?.id] });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    queryClient.invalidateQueries({ queryKey: ["admin-instructor-companies-with-main"] });
    queryClient.invalidateQueries({ queryKey: ["instructor-public-profile", company?.id] });
  };



  const saveMutation = useMutation({
    mutationFn: async () => {
      if (scope === "company" && company?.id) {
        const { error } = await supabase
          .from("instructor_companies")
          .update({
            name: cName || null,
            bio: cBio || null,
            logo_url: cLogo || null,
            linkedin_url: cLinkedin || null,
            website_url: cWebsite || null,
            country: cCountry || null,
          })
          .eq("id", company.id);
        if (error) throw error;
        return;
      }
      const isCompany = isInstructor && instructorType === "company";
      const isMember = isInstructor && instructorType === "company_member";
      if (isMember && !selectedCompanyId) {
        throw new Error("Please select a company for this instructor.");
      }
      const update: any = {
        bio: bio || null,
        avatar_url: avatarUrl || null,
        linkedin_url: linkedinUrl || null,
        first_name: isCompany ? null : (firstName || null),
        last_name: isCompany ? null : (lastName || null),
        company_name: isCompany ? (companyName || null) : null,
      };
      if (isInstructor) update.instructor_type = instructorType;
      const { error } = await supabase.from("profiles").update(update).eq("id", activeUserId!);
      if (error) throw error;

      if (isInstructor) {
        const toAdd = selectedCategoryIds.filter(id => !currentExpertise.includes(id));
        const toRemove = currentExpertise.filter(id => !selectedCategoryIds.includes(id));
        if (toRemove.length > 0) {
          const { error: delErr } = await supabase
            .from("instructor_expertise" as any)
            .delete()
            .eq("instructor_id", activeUserId!)
            .in("category_id", toRemove);
          if (delErr) throw delErr;
        }
        if (toAdd.length > 0) {
          const { error: insErr } = await supabase
            .from("instructor_expertise" as any)
            .insert(toAdd.map(category_id => ({ instructor_id: activeUserId!, category_id })));
          if (insErr) throw insErr;
        }

        // Membership sync
        if (isMember) {
          // Demote existing main if needed
          if (memberRole === "main_instructor") {
            const { data: existingMain } = await supabase
              .from("instructor_company_members")
              .select("id, user_id")
              .eq("company_id", selectedCompanyId!)
              .eq("member_role", "main_instructor")
              .maybeSingle();
            if (existingMain && (existingMain as any).user_id !== activeUserId) {
              await supabase
                .from("instructor_company_members")
                .update({ member_role: "instructor" })
                .eq("id", (existingMain as any).id);
              toast.info("Previous main instructor demoted to instructor.");
            }
          }
          // Replace this user's membership
          await supabase.from("instructor_company_members").delete().eq("user_id", activeUserId!);
          const { error: insErr } = await supabase
            .from("instructor_company_members")
            .insert({ user_id: activeUserId!, company_id: selectedCompanyId!, member_role: memberRole });
          if (insErr) throw insErr;
        } else {
          // Individual or company: clear any membership
          await supabase.from("instructor_company_members").delete().eq("user_id", activeUserId!);
        }
      }
    },
    onSuccess: () => {
      toast.success(scope === "company" ? "Company updated!" : "Profile updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-edit-profile", activeUserId] });
      queryClient.invalidateQueries({ queryKey: ["admin-edit-company", company?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-company-members", company?.id] });
      if (initialCompanyId) queryClient.invalidateQueries({ queryKey: ["admin-company-members", initialCompanyId] });
      if (selectedCompanyId) queryClient.invalidateQueries({ queryKey: ["admin-company-members", selectedCompanyId] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-membership", activeUserId] });
      queryClient.invalidateQueries({ queryKey: ["admin-instructor-companies-list"] });
      queryClient.invalidateQueries({ queryKey: ["instructor-public-profile", activeUserId] });
      queryClient.invalidateQueries({ queryKey: ["instructor-public-profile", company?.id] });
      if (initialCompanyId) queryClient.invalidateQueries({ queryKey: ["instructor-public-profile", initialCompanyId] });
      if (selectedCompanyId) queryClient.invalidateQueries({ queryKey: ["instructor-public-profile", selectedCompanyId] });
      queryClient.invalidateQueries({ queryKey: ["instructor-public-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["instructor-expertise", activeUserId] });
      queryClient.invalidateQueries({ queryKey: ["teach-page-instructors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-instructor-companies-with-main"] });
      // If editing a member (not original), stay open and return to company view
      if (activeUserId !== userId && company) {
        setScope("company");
        setActiveUserId(userId);
        setActiveUserRole(userRole);
        setLoaded(false);
      } else {
        onOpenChange(false);
      }
    },
    onError: (e: any) => toast.error(e.message || "Failed to save"),
  });

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setAddingCategory(true);
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const maxSort = allCategories.reduce((m: number, c: any) => Math.max(m, c.sort_order || 0), 0);
      const { data, error } = await supabase
        .from("instructor_categories" as any)
        .insert({ name, slug, sort_order: maxSort + 10 })
        .select("id")
        .single();
      if (error) throw error;
      setSelectedCategoryIds(prev => [...prev, (data as any).id]);
      setNewCategoryName("");
      queryClient.invalidateQueries({ queryKey: ["instructor-categories"] });
      toast.success("Category added");
    } catch (e: any) {
      toast.error(e.message || "Failed to add category");
    } finally {
      setAddingCategory(false);
    }
  };

  const initials = `${(firstName || companyName || "?")[0] || ""}${(lastName || "")[0] || ""}`.toUpperCase();
  const cInitials = (cName || "?").slice(0, 2).toUpperCase();
  const loading = scope === "company" ? companyLoading : isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{scope === "company" ? `Edit ${company?.name || "Company"}` : "Edit User Profile"}</DialogTitle>
          <DialogDescription>{scope === "company" ? "Update the public company profile." : "Update public profile information visible on the instructor page."}</DialogDescription>
        </DialogHeader>

        {company && (
          <div className="inline-flex rounded-md border border-border p-1 w-fit">
            <button
              type="button"
              onClick={() => setScope("user")}
              className={`text-xs px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors ${scope === "user" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <UserIcon className="h-3.5 w-3.5" /> Edit user
            </button>
            <button
              type="button"
              onClick={() => setScope("company")}
              className={`text-xs px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors ${scope === "company" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Building2 className="h-3.5 w-3.5" /> Edit {company.name}
            </button>
          </div>
        )}

        {company && activeUserId !== userId && scope === "user" && (
          <button
            type="button"
            onClick={() => { setActiveUserId(userId); setActiveUserRole(userRole); setLoaded(false); setScope("company"); }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground w-fit"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to {company.name}
          </button>
        )}

        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : scope === "company" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={cLogo || undefined} />
                <AvatarFallback className="text-xl bg-secondary text-secondary-foreground">{cInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <MediaUpload value={cLogo} onChange={setCLogo} accept="image/*" placeholder="Upload company logo..." />
                {cLogo && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setCCropOpen(true)}>
                    <Crop className="mr-2 h-3 w-3" /> Adjust position / zoom
                  </Button>
                )}
              </div>
            </div>
            {cLogo && (
              <ThumbnailCropper open={cCropOpen} onClose={() => setCCropOpen(false)} imageUrl={cLogo} aspectRatio={1} onCropped={(url) => setCLogo(url)} />
            )}
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={cName} onChange={(e) => setCName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={cBio} onChange={(e) => setCBio(e.target.value)} rows={5} placeholder="Short company bio..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn URL</Label>
                <Input value={cLinkedin} onChange={(e) => setCLinkedin(e.target.value)} placeholder="https://linkedin.com/company/..." />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Website URL</Label>
                <Input value={cWebsite} onChange={(e) => setCWebsite(e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={cCountry} onChange={(e) => setCCountry(e.target.value)} placeholder="Country" />
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <Label className="text-base">Current instructors</Label>
              {membersLoading ? (
                <div className="py-4 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
              ) : companyMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No instructors in this company yet.</p>
              ) : (
                <div className="space-y-2">
                  {companyMembers.map((m: any) => {
                    const p = m.profile;
                    const name = `${p?.first_name || ""} ${p?.last_name || ""}`.trim() || "Unnamed instructor";
                    const inits = `${(p?.first_name || "?")[0] || ""}${(p?.last_name || "")[0] || ""}`.toUpperCase();
                    const isMain = m.member_role === "main_instructor";
                    return (
                      <div key={m.id} className="flex items-center gap-3 rounded-md border border-border p-2">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={p?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">{inits || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{name}</div>
                          <div className="text-xs text-muted-foreground">{isMain ? "Main instructor" : "Instructor"}</div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => switchToEditMember(m.user_id)} aria-label="Edit instructor">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={isMain}
                          title={isMain ? "Promote another main instructor first." : "Remove from company"}
                          onClick={() => setPendingDeleteMember({ id: m.id, name })}
                          aria-label="Remove instructor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-base">Add instructors to this company</Label>
                {newInstructors.length === 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setNewInstructors([{ first_name: "", last_name: "", email: "", country: "" }])} className="gap-2">
                    <UserPlus className="h-4 w-4" /> Add instructor
                  </Button>
                )}
              </div>
              {newInstructors.length > 0 && (
                <div className="space-y-3">
                  {newInstructors.map((ins, idx) => (
                    <Card key={idx} className="bg-muted/20">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">Instructor {idx + 1}</div>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setNewInstructors(prev => prev.filter((_, i) => i !== idx))} aria-label="Remove">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label>First Name *</Label>
                            <Input value={ins.first_name} onChange={(e) => setNewInstructors(prev => prev.map((p, i) => i === idx ? { ...p, first_name: e.target.value } : p))} />
                          </div>
                          <div className="space-y-1">
                            <Label>Last Name *</Label>
                            <Input value={ins.last_name} onChange={(e) => setNewInstructors(prev => prev.map((p, i) => i === idx ? { ...p, last_name: e.target.value } : p))} />
                          </div>
                          <div className="space-y-1">
                            <Label>Email *</Label>
                            <Input type="email" value={ins.email} onChange={(e) => setNewInstructors(prev => prev.map((p, i) => i === idx ? { ...p, email: e.target.value } : p))} />
                          </div>
                          <div className="space-y-1">
                            <Label>Country *</Label>
                            <Input value={ins.country} onChange={(e) => setNewInstructors(prev => prev.map((p, i) => i === idx ? { ...p, country: e.target.value } : p))} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setNewInstructors(prev => [...prev, { first_name: "", last_name: "", email: "", country: "" }])} className="gap-2">
                    <Plus className="h-4 w-4" /> Add another instructor
                  </Button>
                  <div className="flex items-center gap-3 pt-1">
                    <Switch id="add-ins-send-invite" checked={sendInvite} onCheckedChange={setSendInvite} />
                    <Label htmlFor="add-ins-send-invite" className="cursor-pointer text-sm">Send setup email now</Label>
                  </div>
                  {(() => {
                    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    const allFilled = newInstructors.every(i => i.first_name.trim() && i.last_name.trim() && emailRe.test(i.email.trim()) && i.country.trim());
                    const emails = newInstructors.map(i => i.email.trim().toLowerCase());
                    const uniqueEmails = new Set(emails).size === emails.length;
                    const disabled = addingInstructors || !allFilled || !uniqueEmails;
                    return (
                      <Button
                        type="button"
                        disabled={disabled}
                        onClick={async () => {
                          if (!company?.id) return;
                          setAddingInstructors(true);
                          try {
                            const { data, error } = await supabase.functions.invoke("add-instructors-to-company", {
                              body: {
                                company_id: company.id,
                                instructors: newInstructors.map(i => ({
                                  first_name: i.first_name.trim(),
                                  last_name: i.last_name.trim(),
                                  email: i.email.trim(),
                                  country: i.country.trim(),
                                })),
                                send_invite: sendInvite,
                                redirect_url: window.location.origin,
                              },
                            });
                            if (error) throw error;
                            if (data?.error) throw new Error(data.error);
                            const results = data?.results || [];
                            const ok = results.filter((r: any) => r.success).length;
                            const fail = results.filter((r: any) => !r.success);
                            if (ok > 0) toast.success(`Added ${ok} instructor${ok > 1 ? "s" : ""} to ${company.name}`);
                            if (fail.length > 0) {
                              fail.forEach((r: any) => toast.error(`${r.email}: ${r.error}`));
                            }
                            setNewInstructors([]);
                            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                            queryClient.invalidateQueries({ queryKey: ["instructor-public-profile", company.id] });
                          } catch (e: any) {
                            toast.error(e.message || "Failed to add instructors");
                          } finally {
                            setAddingInstructors(false);
                          }
                        }}
                        className="gap-2"
                      >
                        {addingInstructors && <Loader2 className="h-4 w-4 animate-spin" />}
                        <UserPlus className="h-4 w-4" /> Add {newInstructors.length} instructor{newInstructors.length > 1 ? "s" : ""}
                      </Button>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-xl bg-secondary text-secondary-foreground">{initials || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <MediaUpload value={avatarUrl} onChange={setAvatarUrl} accept="image/*" placeholder="Upload profile picture..." />
                {avatarUrl && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setCropOpen(true)}>
                    <Crop className="mr-2 h-3 w-3" /> Adjust position / zoom
                  </Button>
                )}
              </div>
            </div>
            {avatarUrl && (
              <ThumbnailCropper
                open={cropOpen}
                onClose={() => setCropOpen(false)}
                imageUrl={avatarUrl}
                aspectRatio={1}
                onCropped={(url) => setAvatarUrl(url)}
              />
            )}

            {isInstructor && (
              <div className="space-y-2">
                <Label>Instructor Type</Label>
                <Select value={instructorType} onValueChange={(v) => setInstructorType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual instructor</SelectItem>
                    <SelectItem value="company">Company (own profile)</SelectItem>
                    <SelectItem value="company_member">Member of a company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {isInstructor && instructorType === "company" && (
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name" />
              </div>
            )}

            {isInstructor && instructorType === "company_member" && (
              <div className="space-y-3 rounded-md border border-border p-3 bg-muted/20">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Select
                    value={selectedCompanyId ?? "__none"}
                    onValueChange={(v) => {
                      if (v === "__create") { setCreateCompanyOpen(true); return; }
                      setSelectedCompanyId(v === "__none" ? null : v);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select a company..." /></SelectTrigger>
                    <SelectContent>
                      {companiesList.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                      <SelectItem value="__create">
                        <span className="inline-flex items-center gap-1.5 text-primary"><Plus className="h-3.5 w-3.5" /> Create new company</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Role in company</Label>
                  <Select value={memberRole} onValueChange={(v) => setMemberRole(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instructor">Instructor</SelectItem>
                      <SelectItem value="main_instructor">Main instructor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {isInstructor && instructorType !== "company" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
            )}

            {!isInstructor && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} placeholder="Short bio shown on the public instructor page..." />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn URL</Label>
              <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>

            {isInstructor && (
              <div className="space-y-2">
                <Label>Areas of expertise</Label>
                <p className="text-xs text-muted-foreground">Select one or more categories. These power the filter on the Teach on Levoro page.</p>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((cat: any) => {
                    const active = selectedCategoryIds.includes(cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-foreground border-border hover:bg-muted/70"}`}
                      >
                        {cat.name}
                        {active && <X className="inline-block h-3 w-3 ml-1.5 -mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Add new category..."
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddCategory} disabled={addingCategory || !newCategoryName.trim()}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || loading}>
            <Save className="mr-2 h-4 w-4" /> {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <AlertDialog open={!!pendingDeleteMember} onOpenChange={(o) => { if (!o) setPendingDeleteMember(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove instructor from company?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteMember?.name} will no longer be a member of {company?.name}. Their user account will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                const target = pendingDeleteMember;
                setPendingDeleteMember(null);
                if (target) await deleteMember(target.id);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={createCompanyOpen} onOpenChange={setCreateCompanyOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create company</DialogTitle>
            <DialogDescription>Add a new company so this instructor can be linked to it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={newCompany.name} onChange={(e) => setNewCompany(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <MediaUpload value={newCompany.logo_url} onChange={(v) => setNewCompany(p => ({ ...p, logo_url: v }))} accept="image/*" placeholder="Upload company logo..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Website URL</Label>
                <Input value={newCompany.website_url} onChange={(e) => setNewCompany(p => ({ ...p, website_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn URL</Label>
                <Input value={newCompany.linkedin_url} onChange={(e) => setNewCompany(p => ({ ...p, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/company/..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={newCompany.country} onChange={(e) => setNewCompany(p => ({ ...p, country: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={newCompany.bio} onChange={(e) => setNewCompany(p => ({ ...p, bio: e.target.value }))} rows={4} placeholder="Short company bio..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateCompanyOpen(false)}>Cancel</Button>
            <Button
              disabled={creatingCompany || !newCompany.name.trim()}
              onClick={async () => {
                setCreatingCompany(true);
                try {
                  const slug = newCompany.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                  const { data, error } = await supabase
                    .from("instructor_companies")
                    .insert({
                      name: newCompany.name.trim(),
                      slug: slug || null,
                      country: newCompany.country.trim() || null,
                      website_url: newCompany.website_url.trim() || null,
                      linkedin_url: newCompany.linkedin_url.trim() || null,
                      logo_url: newCompany.logo_url || null,
                      bio: newCompany.bio.trim() || null,
                    })
                    .select("id, name")
                    .single();
                  if (error) throw error;
                  toast.success("Company created");
                  queryClient.invalidateQueries({ queryKey: ["admin-instructor-companies-list"] });
                  queryClient.invalidateQueries({ queryKey: ["admin-instructor-companies-with-main"] });
                  setSelectedCompanyId((data as any).id);
                  setCreateCompanyOpen(false);
                  setNewCompany({ name: "", country: "", website_url: "", linkedin_url: "", logo_url: "", bio: "" });
                } catch (e: any) {
                  toast.error(e.message || "Failed to create company");
                } finally {
                  setCreatingCompany(false);
                }
              }}
            >
              {creatingCompany && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Plus className="h-4 w-4 mr-1" /> Create company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>

  );
}
