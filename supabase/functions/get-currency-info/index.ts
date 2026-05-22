import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Country to currency mapping
const COUNTRY_CURRENCY: Record<string, string> = {
  US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", JP: "JPY", CH: "CHF",
  SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN", CZ: "CZK", HU: "HUF",
  RO: "RON", BG: "BGN", HR: "EUR", IN: "INR", BR: "BRL", MX: "MXN",
  KR: "KRW", CN: "CNY", HK: "HKD", SG: "SGD", NZ: "NZD", ZA: "ZAR",
  TH: "THB", MY: "MYR", PH: "PHP", ID: "IDR", TR: "TRY", IL: "ILS",
  AE: "AED", SA: "SAR", EG: "EGP", NG: "NGN", KE: "KES", TW: "TWD", NC: "XPF", PF: "XPF", WF: "XPF",
  // EU countries default to EUR
  AT: "EUR", BE: "EUR", CY: "EUR", EE: "EUR", FI: "EUR", FR: "EUR",
  DE: "EUR", GR: "EUR", IE: "EUR", IT: "EUR", LV: "EUR", LT: "EUR",
  LU: "EUR", MT: "EUR", NL: "EUR", PT: "EUR", SK: "EUR", SI: "EUR",
  ES: "EUR",
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", GBP: "£", EUR: "€", CAD: "C$", AUD: "A$", JPY: "¥",
  CHF: "CHF", SEK: "kr", NOK: "kr", DKK: "kr", PLN: "zł", CZK: "Kč",
  HUF: "Ft", RON: "lei", BGN: "лв", INR: "₹", BRL: "R$", MXN: "$",
  KRW: "₩", CNY: "¥", HKD: "HK$", SGD: "S$", NZD: "NZ$", ZAR: "R",
  THB: "฿", MYR: "RM", PHP: "₱", IDR: "Rp", TRY: "₺", ILS: "₪",
  AED: "د.إ", SAR: "﷼", EGP: "E£", NGN: "₦", KES: "KSh", TWD: "NT$", XPF: "CFP ",
};

// In-memory cache for exchange rates
let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 3600000; // 1 hour

async function getExchangeRates(): Promise<Record<string, number>> {
  if (cachedRates && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedRates;
  }
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/EUR");
    const data = await res.json();
    if (data.result === "success" && data.rates) {
      cachedRates = data.rates;
      cacheTimestamp = Date.now();
      return data.rates;
    }
  } catch (e) {
    console.error("Failed to fetch exchange rates:", e);
  }
  return { EUR: 1 };
}

function getClientIp(req: Request): string | null {
  // Supabase edge functions forward the real client IP in these headers
  const headers = [
    "x-real-ip",
    "x-forwarded-for",
    "cf-connecting-ip",
  ];
  for (const h of headers) {
    const val = req.headers.get(h);
    if (val) {
      // x-forwarded-for can be comma-separated; take the first
      return val.split(",")[0].trim();
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Detect country from client IP
    let country = "XX";
    const clientIp = getClientIp(req);
    console.log("Client IP detected:", clientIp);

    try {
      // Use the client IP if available, otherwise fall back to server IP detection
      const ipUrl = clientIp
        ? `https://ipapi.co/${clientIp}/json/`
        : "https://ipapi.co/json/";
      const ipRes = await fetch(ipUrl, {
        headers: { "User-Agent": "Levoro/1.0" },
      });
      const ipData = await ipRes.json();
      country = ipData.country_code || "XX";
      console.log("Detected country:", country, "from IP:", clientIp || "server");
    } catch (e) {
      console.error("Geolocation failed:", e);
    }

    const currencyCode = COUNTRY_CURRENCY[country] || "EUR";
    const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
    const rates = await getExchangeRates();
    const rate = rates[currencyCode] || 1;

    console.log("Returning currency:", currencyCode, "rate:", rate, "country:", country);

    return new Response(
      JSON.stringify({ country, currencyCode, currencySymbol, rate }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Currency info error:", error);
    return new Response(
      JSON.stringify({ country: "XX", currencyCode: "EUR", currencySymbol: "€", rate: 1 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
