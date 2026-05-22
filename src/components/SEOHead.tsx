import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SITE_NAME = "Levoro Academy";
const DEFAULT_DESCRIPTION = "Levoro Academy offers expert-led, science-based micro-courses designed for busy professionals. Learn in ~5 minutes a day.";
const SITE_URL = "https://levoro.academy";
const OG_IMAGE = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d0c19324-cf24-4374-8058-ed4069cfc625/id-preview-8b5bd21f--39daf555-1bc6-4bcb-bf81-997baab75182.lovable.app-1773015595319.png";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogType?: string;
  noIndex?: boolean;
  pageId?: string;
}

const SEOHead = ({
  title,
  description,
  canonicalPath,
  ogType = "website",
  noIndex = false,
  pageId,
}: SEOHeadProps) => {
  const { data: seoOverride } = useQuery({
    queryKey: ["page-seo", pageId],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_pages")
        .select("meta_title, meta_description")
        .eq("id", pageId!)
        .single();
      return data;
    },
    enabled: !!pageId,
    staleTime: Infinity,
  });

  const effectiveTitle = seoOverride?.meta_title || title;
  const effectiveDescription = seoOverride?.meta_description || description;

  const fullTitle = effectiveTitle ? `${effectiveTitle} | ${SITE_NAME}` : SITE_NAME;
  const metaDescription = effectiveDescription || DEFAULT_DESCRIPTION;
  const canonicalUrl = canonicalPath ? `${SITE_URL}${canonicalPath}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={OG_IMAGE} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={OG_IMAGE} />

      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
};

export default SEOHead;
