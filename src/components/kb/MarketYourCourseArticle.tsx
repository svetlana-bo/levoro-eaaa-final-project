import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Download } from "lucide-react";

const DEFAULT_PDF = "/kb/how-to-market-your-course.pdf";

function useSiteValue(key: string, fallback: string) {
  const [value, setValue] = useState<string>(fallback);
  useEffect(() => {
    supabase
      .from("site_images" as any)
      .select("value")
      .eq("image_key", key)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.value) setValue(data.value);
      });
  }, [key]);
  return value;
}

export default function MarketYourCourseArticle() {
  const pdfUrl = useSiteValue("kb-market-course-pdf", DEFAULT_PDF);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5">
        <div>
          <h2 className="text-lg font-semibold">Marketing guide</h2>
          <p className="text-sm text-muted-foreground">
            Preview the full guide below or download a copy to read offline.
          </p>
        </div>
        {pdfUrl && (
          <Button asChild size="lg" className="gap-2">
            <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          </Button>
        )}
      </div>

      {pdfUrl ? (
        <div className="rounded-2xl border overflow-hidden bg-muted">
          <iframe
            src={`${pdfUrl}#view=FitH`}
            title="How to Market Your Course to Your Audience"
            className="w-full h-[85vh]"
          />
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
          The PDF will appear here once an admin uploads it.
        </div>
      )}
    </div>
  );
}
