import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MediaUpload } from "@/components/MediaUpload";
import { ThumbnailCropper } from "@/components/ThumbnailCropper";
import { Linkedin, Save, Crop, Globe } from "lucide-react";
import { toast } from "sonner";

export function CompanyProfileEditor({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [country, setCountry] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);

  const { data: company } = useQuery({
    queryKey: ["instructor-company-edit", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instructor_companies")
        .select("id, name, bio, logo_url, linkedin_url, website_url, country")
        .eq("id", companyId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (company && !loaded) {
      setName(company.name || "");
      setBio((company as any).bio || "");
      setLogoUrl((company as any).logo_url || "");
      setLinkedinUrl((company as any).linkedin_url || "");
      setWebsiteUrl((company as any).website_url || "");
      setCountry((company as any).country || "");
      setLoaded(true);
    }
  }, [company, loaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("instructor_companies")
        .update({
          name,
          bio: bio || null,
          logo_url: logoUrl || null,
          linkedin_url: linkedinUrl || null,
          website_url: websiteUrl || null,
          country: country || null,
        } as any)
        .eq("id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Company profile updated!");
      queryClient.invalidateQueries({ queryKey: ["instructor-company-edit", companyId] });
      queryClient.invalidateQueries({ queryKey: ["instructor-public-profile"] });
      queryClient.invalidateQueries({ queryKey: ["admin-instructor-companies-list"] });
      queryClient.invalidateQueries({ queryKey: ["teach-page-instructors"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const initials = (name || "Co").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">Company Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Public Company Profile</CardTitle>
          <CardDescription>This information is visible on your public company page. Any member of the company can edit it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={logoUrl || undefined} />
              <AvatarFallback className="text-xl bg-secondary text-secondary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-lg">{name || "Company"}</p>
              <MediaUpload value={logoUrl} onChange={setLogoUrl} accept="image/*" placeholder="Upload company logo..." />
              {logoUrl && (
                <Button type="button" variant="outline" size="sm" onClick={() => setCropOpen(true)}>
                  <Crop className="mr-2 h-3 w-3" /> Adjust position / zoom
                </Button>
              )}
            </div>
          </div>
          {logoUrl && (
            <ThumbnailCropper
              open={cropOpen}
              onClose={() => setCropOpen(false)}
              imageUrl={logoUrl}
              aspectRatio={1}
              onCropped={(url) => setLogoUrl(url)}
            />
          )}
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Studio" />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell students about your company, its mission, and teaching approach..." rows={5} />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Italy" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Website</Label>
            <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn URL</Label>
            <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/company/your-company" />
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" /> {saveMutation.isPending ? "Saving..." : "Save Company Profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
