import { useState, useMemo, useCallback } from "react";
import PinnedQueryWidgets from "./PinnedQueryWidgets";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  ComposableMap, Geographies, Geography, ZoomableGroup,
} from "react-simple-maps";
import {
  Users, Eye, CalendarIcon, Globe, TrendingUp, AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const PERIOD_OPTIONS = [
  { label: "Last 7 days", value: "7d", days: 7 },
  { label: "Last 14 days", value: "14d", days: 14 },
  { label: "Last 30 days", value: "30d", days: 30 },
  { label: "Last 90 days", value: "90d", days: 90 },
  { label: "Custom", value: "custom", days: 0 },
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
];

// ISO 3166-1 numeric → alpha-2 mapping for world-atlas TopoJSON
const NUM_TO_ALPHA2: Record<string, string> = {
  "4":"AF","8":"AL","12":"DZ","16":"AS","20":"AD","24":"AO","28":"AG","32":"AR","36":"AU","40":"AT",
  "44":"BS","48":"BH","50":"BD","51":"AM","56":"BE","60":"BM","64":"BT","68":"BO","70":"BA","72":"BW",
  "76":"BR","84":"BZ","90":"SB","96":"BN","100":"BG","104":"MM","108":"BI","112":"BY","116":"KH",
  "120":"CM","124":"CA","140":"CF","144":"LK","148":"TD","152":"CL","156":"CN","158":"TW","170":"CO",
  "174":"KM","178":"CG","180":"CD","184":"CK","188":"CR","191":"HR","192":"CU","196":"CY","203":"CZ",
  "204":"BJ","208":"DK","214":"DO","218":"EC","818":"EG","222":"SV","226":"GQ","231":"ET","232":"ER",
  "233":"EE","234":"FO","238":"FK","242":"FJ","246":"FI","250":"FR","254":"GF","258":"PF","262":"DJ",
  "266":"GA","268":"GE","270":"GM","275":"PS","276":"DE","288":"GH","296":"KI","300":"GR","304":"GL",
  "308":"GD","316":"GU","320":"GT","324":"GN","328":"GY","332":"HT","340":"HN","344":"HK","348":"HU",
  "352":"IS","356":"IN","360":"ID","364":"IR","368":"IQ","372":"IE","376":"IL","380":"IT","384":"CI",
  "388":"JM","392":"JP","398":"KZ","400":"JO","404":"KE","408":"KP","410":"KR","414":"KW","417":"KG",
  "418":"LA","422":"LB","426":"LS","428":"LV","430":"LR","434":"LY","438":"LI","440":"LT","442":"LU",
  "446":"MO","450":"MG","454":"MW","458":"MY","462":"MV","466":"ML","470":"MT","478":"MR","480":"MU",
  "484":"MX","492":"MC","496":"MN","498":"MD","499":"ME","504":"MA","508":"MZ","512":"OM","516":"NA",
  "520":"NR","524":"NP","528":"NL","540":"NC","554":"NZ","558":"NI","562":"NE","566":"NG","578":"NO",
  "586":"PK","591":"PA","598":"PG","600":"PY","604":"PE","608":"PH","616":"PL","620":"PT","630":"PR",
  "634":"QA","642":"RO","643":"RU","646":"RW","682":"SA","686":"SN","688":"RS","694":"SL","702":"SG",
  "703":"SK","704":"VN","705":"SI","706":"SO","710":"ZA","716":"ZW","724":"ES","728":"SS","729":"SD",
  "740":"SR","748":"SZ","752":"SE","756":"CH","760":"SY","762":"TJ","764":"TH","768":"TG","776":"TO",
  "780":"TT","784":"AE","788":"TN","792":"TR","795":"TM","800":"UG","804":"UA","807":"MK",
  "826":"GB","834":"TZ","840":"US","854":"BF","858":"UY","860":"UZ","862":"VE","887":"YE","894":"ZM",
};

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", DE: "Germany", FR: "France", CA: "Canada",
  AU: "Australia", IN: "India", BR: "Brazil", JP: "Japan", NL: "Netherlands",
  SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland", ES: "Spain",
  IT: "Italy", PT: "Portugal", PL: "Poland", AT: "Austria", CH: "Switzerland",
  BE: "Belgium", IE: "Ireland", NZ: "New Zealand", SG: "Singapore", KR: "South Korea",
  MX: "Mexico", AR: "Argentina", CL: "Chile", CO: "Colombia", ZA: "South Africa",
  AE: "UAE", SA: "Saudi Arabia", TR: "Turkey", RU: "Russia", CN: "China",
  HK: "Hong Kong", TW: "Taiwan", MY: "Malaysia", TH: "Thailand", PH: "Philippines",
  ID: "Indonesia", VN: "Vietnam", EG: "Egypt", NG: "Nigeria", KE: "Kenya",
  IL: "Israel", CZ: "Czech Republic", RO: "Romania", HU: "Hungary", GR: "Greece",
  UA: "Ukraine", HR: "Croatia", BG: "Bulgaria", SK: "Slovakia", LT: "Lithuania",
  LV: "Latvia", EE: "Estonia", IS: "Iceland", LU: "Luxembourg",
};

function countryName(code: string) {
  return COUNTRY_NAMES[code] || code;
}

// Parse HogQL results: columns + results arrays
function parseHogQLRows(data: any): Record<string, any>[] {
  if (!data?.columns || !data?.results) return [];
  return data.results.map((row: any[]) => {
    const obj: Record<string, any> = {};
    data.columns.forEach((col: string, i: number) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

// Check if response is an error payload from the edge function
function isErrorPayload(data: any): data is { error: string; source?: string } {
  return data && typeof data === "object" && "error" in data && typeof data.error === "string";
}

export default function WebsiteAnalytics() {
  const [period, setPeriod] = useState("30d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>(subDays(new Date(), 30));
  const [customTo, setCustomTo] = useState<Date | undefined>(new Date());

  const dateRange = useMemo(() => {
    if (period === "custom" && customFrom && customTo) {
      return {
        date_from: format(customFrom, "yyyy-MM-dd"),
        date_to: format(customTo, "yyyy-MM-dd"),
      };
    }
    const opt = PERIOD_OPTIONS.find((p) => p.value === period);
    return {
      date_from: `-${opt?.days || 30}d`,
      date_to: undefined,
    };
  }, [period, customFrom, customTo]);

  const fetchMetric = useCallback(
    async (metric: string) => {
      const { data, error } = await supabase.functions.invoke("get-site-analytics", {
        body: { metric, ...dateRange },
      });
      if (error) throw new Error(error.message || "Failed to fetch analytics");
      if (isErrorPayload(data)) throw new Error(data.error);
      return data;
    },
    [dateRange]
  );

  const { data: trendData, isLoading: trendLoading, error: trendError } = useQuery({
    queryKey: ["analytics-trend", dateRange],
    queryFn: () => fetchMetric("pageviews_trend"),
    staleTime: 60000,
    retry: 1,
  });

  const { data: countriesData, isLoading: countriesLoading, error: countriesError } = useQuery({
    queryKey: ["analytics-countries", dateRange],
    queryFn: () => fetchMetric("countries"),
    staleTime: 60000,
    retry: 1,
  });

  const { data: topPagesData, isLoading: pagesLoading } = useQuery({
    queryKey: ["analytics-pages", dateRange],
    queryFn: () => fetchMetric("top_pages"),
    staleTime: 60000,
    retry: 1,
  });

  const { data: referrersData, isLoading: referrersLoading } = useQuery({
    queryKey: ["analytics-referrers", dateRange],
    queryFn: () => fetchMetric("referrers"),
    staleTime: 60000,
    retry: 1,
  });

  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ["analytics-devices", dateRange],
    queryFn: () => fetchMetric("devices"),
    staleTime: 60000,
    retry: 1,
  });

  const { data: browsersData, isLoading: browsersLoading } = useQuery({
    queryKey: ["analytics-browsers", dateRange],
    queryFn: () => fetchMetric("browsers"),
    staleTime: 60000,
    retry: 1,
  });

  // Collect any errors for a top-level alert
  const firstError = trendError || countriesError;

  // Parse trend data from HogQL format
  const { kpis, trendChart } = useMemo(() => {
    const rows = parseHogQLRows(trendData);
    let totalPageviews = 0;
    let totalVisitors = 0;
    const chart = rows.map((r) => {
      const pv = Number(r.pageviews) || 0;
      const vis = Number(r.visitors) || 0;
      totalPageviews += pv;
      totalVisitors += vis;
      return {
        date: String(r.day).slice(0, 10),
        Pageviews: pv,
        Visitors: vis,
      };
    });
    return {
      kpis: { pageviews: totalPageviews, visitors: totalVisitors },
      trendChart: chart,
    };
  }, [trendData]);

  // Parse breakdown data
  const countries = useMemo(() => {
    return parseHogQLRows(countriesData).map((r) => ({
      name: String(r.country_code || ""),
      value: Number(r.visitors) || 0,
    }));
  }, [countriesData]);

  const topPages = useMemo(() => {
    return parseHogQLRows(topPagesData)
      .map((r) => {
        let name = String(r.url || "");
        try {
          name = new URL(name).pathname;
        } catch { /* keep as-is */ }
        return { name, value: Number(r.views) || 0 };
      })
      .slice(0, 15);
  }, [topPagesData]);

  const referrers = useMemo(() => {
    return parseHogQLRows(referrersData)
      .map((r) => ({
        name: String(r.referrer || ""),
        value: Number(r.views) || 0,
      }))
      .slice(0, 10);
  }, [referrersData]);

  const devices = useMemo(() => {
    return parseHogQLRows(devicesData).map((r) => ({
      name: String(r.device || ""),
      value: Number(r.visitors) || 0,
    }));
  }, [devicesData]);

  const browsers = useMemo(() => {
    return parseHogQLRows(browsersData)
      .map((r) => ({
        name: String(r.browser || ""),
        value: Number(r.visitors) || 0,
      }))
      .slice(0, 8);
  }, [browsersData]);

  const countryMax = useMemo(() => Math.max(...countries.map((c) => c.value), 1), [countries]);
  const countryMap = useMemo(() => {
    const m: Record<string, number> = {};
    countries.forEach((c) => (m[c.name] = c.value));
    return m;
  }, [countries]);

  const isLoading = trendLoading;

  return (
    <div className="space-y-6">
      {/* Header + Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Website Analytics</h2>
          <p className="text-sm text-muted-foreground">Traffic and engagement overview powered by PostHog</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {period === "custom" && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-[130px] text-left font-normal", !customFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {customFrom ? format(customFrom, "MMM dd") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground text-base">–</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-[130px] text-left font-normal", !customTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {customTo ? format(customTo, "MMM dd") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customTo} onSelect={setCustomTo} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {firstError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analytics Error</AlertTitle>
          <AlertDescription>
            {firstError instanceof Error ? firstError.message : "Failed to load analytics data. Please check your PostHog configuration."}
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Users} label="Unique Visitors" value={kpis.visitors} loading={isLoading} />
        <KPICard icon={Eye} label="Total Pageviews" value={kpis.pageviews} loading={isLoading} />
        <KPICard icon={TrendingUp} label="Pages / Visitor" value={kpis.visitors ? (kpis.pageviews / kpis.visitors).toFixed(1) : "–"} loading={isLoading} />
        <KPICard icon={Globe} label="Countries" value={countries.length} loading={countriesLoading} />
      </div>

      {/* Visitors Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visitors & Pageviews Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {trendLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : trendChart.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No pageview data for this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendChart}>
                <defs>
                  <linearGradient id="colorPV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend />
                <Area type="monotone" dataKey="Pageviews" stroke="hsl(var(--primary))" fill="url(#colorPV)" strokeWidth={2} />
                <Area type="monotone" dataKey="Visitors" stroke="#10b981" fill="url(#colorUV)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Map + Countries Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visitors by Country</CardTitle>
          </CardHeader>
          <CardContent>
            {countriesLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ComposableMap
                projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
                style={{ width: "100%", height: "auto" }}
              >
                <ZoomableGroup>
                  <Geographies geography={GEO_URL}>
                    {({ geographies }: { geographies: any[] }) =>
                      geographies.map((geo) => {
                        const iso = NUM_TO_ALPHA2[geo.id] || geo.properties?.ISO_A2 || "";
                        const count = countryMap[iso] || 0;
                        const intensity = count > 0 ? Math.min(count / countryMax, 1) : 0;
                        // SVG fill can't use CSS custom properties; use a green scale
                        const g = intensity > 0
                          ? `rgb(${Math.round(34 + (1 - intensity) * 180)}, ${Math.round(120 + intensity * 60)}, ${Math.round(80 + (1 - intensity) * 140)})`
                          : "#e5e7eb";
                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={g}
                            stroke="#d1d5db"
                            strokeWidth={0.5}
                            style={{
                              hover: { fill: "hsl(var(--primary))", outline: "none" },
                              pressed: { outline: "none" },
                              default: { outline: "none" },
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ZoomableGroup>
              </ComposableMap>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            {countriesLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {countries.slice(0, 15).map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                    <span className="text-sm font-medium flex-1 truncate">{countryName(c.name)}</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(c.value / (countries[0]?.value || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right">{c.value}</span>
                  </div>
                ))}
                {countries.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No country data available</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Devices + Browsers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            {devicesLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : devices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No device data available</p>
            ) : (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={devices} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {devices.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Browsers</CardTitle>
          </CardHeader>
          <CardContent>
            {browsersLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : browsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No browser data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={browsers} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" width={55} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Pages + Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {pagesLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {topPages.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                    <span className="text-sm flex-1 truncate font-mono">{p.name}</span>
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(p.value / (topPages[0]?.value || 1)) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right">{p.value}</span>
                  </div>
                ))}
                {topPages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No page data available</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            {referrersLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : referrers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No referrer data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={referrers} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" width={95} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      <PinnedQueryWidgets pageName="website-analytics" />
    </div>
  );
}

function KPICard({ icon: Icon, label, value, loading }: { icon: any; label: string; value: string | number; loading: boolean }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="rounded-lg bg-primary/10 p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="h-6 w-16 mt-1" />
          ) : (
            <p className="text-xl font-bold text-foreground">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
