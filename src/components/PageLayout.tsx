import { ReactNode, useState } from "react";
import GlobalNavbar from "@/components/GlobalNavbar";
import { Link } from "react-router-dom";
import { Instagram, Linkedin, Youtube, Facebook, Mail, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PopupRenderer from "@/components/PopupRenderer";
import { AdminEditableImage } from "@/components/AdminEditableImage";
import { AdminEditableLink } from "@/components/AdminEditableLink";

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.97a8.27 8.27 0 004.76 1.5V7.04a4.84 4.84 0 01-1-.35z"/>
  </svg>
);

const PageLayout = ({ children }: { children: ReactNode }) => {
  const [newsletterName, setNewsletterName] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async () => {
    const email = newsletterEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("newsletter_subscribers" as any).upsert(
        { email, name: newsletterName.trim() } as any,
        { onConflict: "email" }
      );
      if (error) throw error;
      toast.success("Thanks for subscribing!");
      setNewsletterName("");
      setNewsletterEmail("");
    } catch (e: any) {
      toast.error("Subscription failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GlobalNavbar />
      <PopupRenderer />
      <main className="flex-1">{children}</main>
      <footer className="bg-primary py-16">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <AdminEditableImage
                imageKey="footer-logo"
                alt="Levoro Academy Logo"
                className="h-[76px] w-auto object-contain mx-0 px-[2px] py-0"
                fallback={
                  <span className="font-bold text-xl text-primary-foreground italic leading-tight block">
                    levoro<br /><span className="text-sm not-italic font-normal tracking-widest">academy</span>
                  </span>
                }
              />
              <div className="flex items-center gap-3 mt-5 text-primary-foreground">
                <AdminEditableLink linkKey="footer-instagram" defaultHref="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[hsl(var(--footer-link-hover))] focus-visible:text-[hsl(var(--footer-link-hover))] transition-colors"><Instagram className="h-5 w-5" /></AdminEditableLink>
                <AdminEditableLink linkKey="footer-linkedin" defaultHref="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[hsl(var(--footer-link-hover))] focus-visible:text-[hsl(var(--footer-link-hover))] transition-colors"><Linkedin className="h-5 w-5" /></AdminEditableLink>
                <AdminEditableLink linkKey="footer-tiktok" defaultHref="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-[hsl(var(--footer-link-hover))] focus-visible:text-[hsl(var(--footer-link-hover))] transition-colors"><TikTokIcon /></AdminEditableLink>
                <AdminEditableLink linkKey="footer-youtube" defaultHref="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-[hsl(var(--footer-link-hover))] focus-visible:text-[hsl(var(--footer-link-hover))] transition-colors"><Youtube className="h-5 w-5" /></AdminEditableLink>
                <AdminEditableLink linkKey="footer-facebook" defaultHref="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-[hsl(var(--footer-link-hover))] focus-visible:text-[hsl(var(--footer-link-hover))] transition-colors"><Facebook className="h-5 w-5" /></AdminEditableLink>
              </div>
              <p className="text-primary-foreground text-sm mt-4 flex items-center gap-2">
                <Mail className="h-4 w-4" /> hello@levoroacademy.com
              </p>
            </div>
            <div>
              <h4 className="font-bold text-primary-foreground mb-4 text-sm tracking-wider">Explore</h4>
              <div className="space-y-2">
                <Link to="/memberships" className="block text-sm text-primary-foreground hover:text-[hsl(var(--footer-link-hover))] focus-visible:text-[hsl(var(--footer-link-hover))] transition-colors">Memberships</Link>
                <Link to="/partnerships" className="block text-sm text-primary-foreground hover:text-[hsl(var(--footer-link-hover))] focus-visible:text-[hsl(var(--footer-link-hover))] transition-colors">Partnerships</Link>
                <Link to="/courses" className="block text-sm text-primary-foreground hover:text-[hsl(var(--footer-link-hover))] focus-visible:text-[hsl(var(--footer-link-hover))] transition-colors">Our Courses</Link>
                <Link to="/blog" className="block text-sm text-primary-foreground hover:text-[hsl(var(--footer-link-hover))] focus-visible:text-[hsl(var(--footer-link-hover))] transition-colors">Blog</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-primary-foreground mb-4 text-sm tracking-wider">About Levoro Academy</h4>
              <div className="space-y-2">
                <Link to="/about" className="block text-sm text-primary-foreground hover:text-[hsl(var(--footer-link-hover))] focus-visible:text-[hsl(var(--footer-link-hover))] transition-colors">About Us</Link>
                <Link to="/teach" className="block text-sm text-primary-foreground hover:text-[hsl(var(--footer-link-hover))] focus-visible:text-[hsl(var(--footer-link-hover))] transition-colors">Teach on Levoro</Link>
                <Link to="/business" className="block text-sm text-primary-foreground hover:text-[hsl(var(--footer-link-hover))] focus-visible:text-[hsl(var(--footer-link-hover))] transition-colors">For Businesses</Link>
                <Link to="/faq" className="block text-sm text-primary-foreground hover:text-[hsl(var(--footer-link-hover))] focus-visible:text-[hsl(var(--footer-link-hover))] transition-colors">FAQ</Link>
                <Link to="/contact" className="block text-sm text-primary-foreground hover:text-[hsl(var(--footer-link-hover))] focus-visible:text-[hsl(var(--footer-link-hover))] transition-colors">Contact Support</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-primary-foreground mb-4 text-sm tracking-wider">More Information</h4>
              <div className="space-y-2">
                <Link to="/sustainability" className="block text-sm text-primary-foreground hover:text-[hsl(var(--footer-link-hover))] focus-visible:text-[hsl(var(--footer-link-hover))] transition-colors">Sustainability & Responsibility</Link>
                <Link to="/accessibility" className="block text-sm text-primary-foreground hover:text-[hsl(var(--footer-link-hover))] focus-visible:text-[hsl(var(--footer-link-hover))] transition-colors">Accessibility Statement</Link>
                <Link to="/terms" className="block text-sm text-primary-foreground hover:text-[hsl(var(--footer-link-hover))] focus-visible:text-[hsl(var(--footer-link-hover))] transition-colors">Terms and Conditions</Link>
                <Link to="/privacy" className="block text-sm text-primary-foreground hover:text-[hsl(var(--footer-link-hover))] focus-visible:text-[hsl(var(--footer-link-hover))] transition-colors">Privacy Policy</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-primary-foreground/10 pt-10 mb-10">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-primary-foreground">Monthly insights for real growth</h3>
              <p className="text-sm text-primary-foreground">Practical ideas on learning, skills, and modern work.</p>
              <p className="text-primary-foreground/90 mt-1 text-sm">By entering your details you automatically consent to our privacy policy.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-end justify-center gap-3 max-w-2xl mx-auto">
              <div className="w-full sm:w-auto sm:flex-1">
                <label className="text-xs text-primary-foreground uppercase tracking-wider font-medium">Name</label>
                <Input value={newsletterName} onChange={(e) => setNewsletterName(e.target.value)} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/30 mt-1" />
              </div>
              <div className="w-full sm:w-auto sm:flex-1">
                <label className="text-xs text-primary-foreground uppercase tracking-wider font-medium">Email</label>
                <Input value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/30 mt-1" />
              </div>
              <Button variant="outlineOnDark" className="w-full sm:w-auto" onClick={handleNewsletterSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "JOIN"}
              </Button>
            </div>
          </div>

          <div className="border-t border-primary-foreground/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button variant="outlineOnDark" size="sm" className="uppercase tracking-widest text-xs font-bold" asChild>
              <Link to="/memberships">Join Now!</Link>
            </Button>
            <p className="text-xs text-primary-foreground/90">
              Levoro Academy © 2026 All Rights Reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PageLayout;
