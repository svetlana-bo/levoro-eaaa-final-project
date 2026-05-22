import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { safeHtml } from "@/lib/sanitize";

interface Popup {
  id: string;
  type: string;
  heading: string;
  description: string;
  button_text: string;
  button_color: string;
  button_text_color: string;
  bg_color: string;
  text_color: string;
  bg_image_url: string | null;
  image_url: string | null;
  delay_seconds: number;
  target_pages: string[];
  promo_content_html: string;
  promo_link_url: string;
  input_border_color: string;
}

const PopupRenderer = () => {
  const location = useLocation();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [visiblePopupId, setVisiblePopupId] = useState<string | null>(null);
  const [newsletterName, setNewsletterName] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPopups = async () => {
      const { data } = await supabase
        .from("popups" as any)
        .select("*")
        .eq("is_active", true);
      if (data) setPopups(data as any);
    };
    fetchPopups();
  }, []);

  useEffect(() => {
    if (!popups.length) return;

    const matching = popups.filter((p) => {
      if (sessionStorage.getItem(`popup_dismissed_${p.id}`)) return false;
      if (!p.target_pages || p.target_pages.length === 0) return true;
      return p.target_pages.some((page) => location.pathname === page || location.pathname.startsWith(page + "/"));
    });

    if (!matching.length) {
      setVisiblePopupId(null);
      return;
    }

    const popup = matching[0];
    const timer = setTimeout(() => {
      setVisiblePopupId(popup.id);
    }, (popup.delay_seconds || 5) * 1000);

    return () => clearTimeout(timer);
  }, [popups, location.pathname]);

  const dismiss = (id: string) => {
    sessionStorage.setItem(`popup_dismissed_${id}`, "1");
    setVisiblePopupId(null);
  };

  const handleSubscribe = async (popupId: string) => {
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
      dismiss(popupId);
    } catch {
      toast.error("Subscription failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePopup = popups.find((p) => p.id === visiblePopupId);
  if (!activePopup) return null;

  const bgStyle: React.CSSProperties = {
    backgroundColor: activePopup.bg_color || "#FFFFFF",
    color: activePopup.text_color || "#1A1A2E",
    ...(activePopup.bg_image_url ? {
      backgroundImage: `url(${activePopup.bg_image_url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    } : {}),
  };

  const inputBorderColor = activePopup.input_border_color || "#D1D5DB";

  const ctaButton = (
    <Button
      className="rounded-full font-semibold"
      style={{ backgroundColor: activePopup.button_color, color: activePopup.button_text_color }}
    >
      {activePopup.button_text || "Learn More"}
    </Button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => dismiss(activePopup.id)}>
      <div
        className="relative w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
        style={bgStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => dismiss(activePopup.id)}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/10 transition-colors z-10"
          style={{ color: activePopup.text_color || "#1A1A2E" }}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8 space-y-4">
          {activePopup.image_url && (
            <div className="flex justify-center">
              <img src={activePopup.image_url} alt="" className="max-h-32 object-contain rounded-lg" />
            </div>
          )}

          {activePopup.heading && (
            <h2 className="text-2xl font-bold text-center" style={{ color: activePopup.text_color }}>{activePopup.heading}</h2>
          )}
          {activePopup.description && (
            <p className="text-center text-sm opacity-80" style={{ color: activePopup.text_color }}>{activePopup.description}</p>
          )}

          {activePopup.type === "subscriber" ? (
            <div className="space-y-3">
              <Input
                placeholder="Name"
                value={newsletterName}
                onChange={(e) => setNewsletterName(e.target.value)}
                className="bg-white/90 border text-foreground"
                style={{ borderColor: inputBorderColor }}
              />
              <Input
                placeholder="Email"
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="bg-white/90 border text-foreground"
                style={{ borderColor: inputBorderColor }}
              />
              <Button
                onClick={() => handleSubscribe(activePopup.id)}
                disabled={isSubmitting}
                className="w-full rounded-full font-semibold"
                style={{ backgroundColor: activePopup.button_color, color: activePopup.button_text_color }}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : activePopup.button_text || "Subscribe"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {activePopup.promo_content_html && (
                <div className="text-center text-sm" dangerouslySetInnerHTML={safeHtml(activePopup.promo_content_html)} />
              )}
              <div className="flex justify-center">
                {activePopup.promo_link_url ? (
                  <a href={activePopup.promo_link_url}>{ctaButton}</a>
                ) : (
                  ctaButton
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PopupRenderer;
