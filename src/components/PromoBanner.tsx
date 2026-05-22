import { safeHtml } from "@/lib/sanitize";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";

const PromoBanner = () => {
  const location = useLocation();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const { data: banners = [] } = useQuery({
    queryKey: ["active-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions" as any)
        .select("*")
        .eq("type", "banner")
        .eq("is_active", true);
      if (error) throw error;
      return data as any[];
    },
  });

  const visibleBanners = banners.filter((b: any) => {
    if (dismissed.includes(b.id)) return false;
    if (b.target_pages && b.target_pages.length > 0) {
      return b.target_pages.some((p: string) => location.pathname.startsWith(p));
    }
    return true;
  });

  if (visibleBanners.length === 0) return null;

  return (
    <>
      {visibleBanners.map((b: any) => (
        <div
          key={b.id}
          className="relative text-center py-2.5 px-8 text-sm font-medium animate-fade-in"
          style={{ backgroundColor: b.bg_color, color: b.text_color }}
        >
          <span dangerouslySetInnerHTML={safeHtml(b.content_html)} />
          <button
            onClick={() => setDismissed((d) => [...d, b.id])}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </>
  );
};

export default PromoBanner;
