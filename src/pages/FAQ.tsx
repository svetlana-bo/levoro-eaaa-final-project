import SEOHead from "@/components/SEOHead";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageLayout from "@/components/PageLayout";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const FAQ = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: faqItems = [] } = useQuery({
    queryKey: ["faq-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faq_items")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const half = Math.ceil(faqItems.length / 2);
  const leftCol = faqItems.slice(0, half);
  const rightCol = faqItems.slice(half);

  const FaqItem = ({ item }: { item: any }) => {
    const isOpen = openId === item.id;
    return (
      <div
        className="bg-card rounded-xl border border-border/50 overflow-hidden transition-all duration-200 hover:shadow-sm"
      >
        <button
          onClick={() => setOpenId(isOpen ? null : item.id)}
          className="w-full flex items-center gap-3 px-5 py-4 text-left"
        >
          <ChevronDown className={`h-4 w-4 text-primary shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          <span className="text-sm font-medium text-foreground">{item.question}</span>
        </button>
        {isOpen && (
          <div className="px-5 pb-5 pt-0 pl-12">
            <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <PageLayout>
      <SEOHead title="FAQ" description="Find answers to frequently asked questions about Levoro Academy's courses, memberships, pricing, and learning platform." canonicalPath="/faq" pageId="faq" />
      <section className="mesh-gradient py-24 md:py-32">
        <div className="max-w-[1200px] mx-auto px-5 text-center opacity-0 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary mb-4 font-sans">FAQ</h1>
          <p className="text-lg text-foreground/70 max-w-xl mx-auto">
            Everything you need to know about Levoro Academy.
          </p>
        </div>
      </section>

      <section className="py-20 max-w-[1100px] mx-auto px-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-4">
            {leftCol.map((item: any) => (
              <FaqItem key={item.id} item={item} />
            ))}
          </div>
          <div className="space-y-4">
            {rightCol.map((item: any) => (
              <FaqItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default FAQ;
