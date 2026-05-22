import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CurrencyInfo {
  country: string;
  currencyCode: string;
  currencySymbol: string;
  rate: number;
}

interface CurrencyPrice {
  plan_id: string;
  currency_code: string;
  price: number;
}

export function useCurrency() {
  const { data: currencyInfo } = useQuery<CurrencyInfo>({
    queryKey: ["currency-info"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-currency-info");
        if (error) {
          console.error("Currency info edge function error:", error);
          throw error;
        }
        console.log("Currency info response:", data);
        return data as CurrencyInfo;
      } catch (e) {
        console.error("Currency detection failed, defaulting to EUR:", e);
        return { country: "XX", currencyCode: "EUR", currencySymbol: "€", rate: 1 };
      }
    },
    staleTime: 3600000, // 1 hour
    retry: 1,
  });

  const currencyCode = currencyInfo?.currencyCode || "EUR";

  const { data: currencyPrices = [] } = useQuery<CurrencyPrice[]>({
    queryKey: ["currency-prices", currencyCode],
    queryFn: async () => {
      if (currencyCode === "EUR") return [];
      const { data, error } = await supabase
        .from("currency_prices" as any)
        .select("plan_id, currency_code, price")
        .eq("currency_code", currencyCode);
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: currencyCode !== "EUR",
    staleTime: 3600000,
  });

  const symbol = currencyInfo?.currencySymbol || "€";
  const rate = currencyInfo?.rate || 1;
  const country = currencyInfo?.country || "XX";

  /**
   * Format a EUR price in the user's local currency.
   * If planId is provided and admin set a fixed price for that plan+currency, use it.
   * Otherwise convert from EUR using live rate.
   * Falls back to EUR if currency is EUR.
   */
  const formatPrice = (eurAmount: number, planId?: string): string => {
    if (currencyCode === "EUR") {
      return `€${eurAmount.toFixed(2).replace(/\.00$/, "")}`;
    }

    // Check for admin-set fixed price
    if (planId) {
      const fixed = currencyPrices.find(
        (p) => p.plan_id === planId && p.currency_code === currencyCode
      );
      if (fixed) {
        return `${symbol}${Number(fixed.price).toFixed(2).replace(/\.00$/, "")}`;
      }
    }

    // Convert using exchange rate
    const converted = eurAmount * rate;
    // For JPY, KRW, etc. — no decimals
    const noDecimalCurrencies = ["JPY", "KRW", "HUF", "IDR", "CLP", "VND"];
    if (noDecimalCurrencies.includes(currencyCode)) {
      return `${symbol}${Math.round(converted)}`;
    }
    return `${symbol}${converted.toFixed(2).replace(/\.00$/, "")}`;
  };

  /**
   * Get the raw converted/fixed price number (for calculations like total billing).
   */
  const getPrice = (eurAmount: number, planId?: string): number => {
    if (currencyCode === "EUR") return eurAmount;
    if (planId) {
      const fixed = currencyPrices.find(
        (p) => p.plan_id === planId && p.currency_code === currencyCode
      );
      if (fixed) return Number(fixed.price);
    }
    return eurAmount * rate;
  };

  return {
    currencyCode,
    currencySymbol: symbol,
    rate,
    country,
    formatPrice,
    getPrice,
    isEur: currencyCode === "EUR",
  };
}
