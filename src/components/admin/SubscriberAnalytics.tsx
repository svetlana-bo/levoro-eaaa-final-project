import { useMemo, useState } from "react";
import PinnedQueryWidgets from "./PinnedQueryWidgets";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserX, TrendingUp, Percent, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { startOfDay, startOfWeek, startOfMonth, format, subDays } from "date-fns";
import { useSystemQuery } from "@/hooks/useSystemQuery";

type TimeRange = "daily" | "weekly" | "monthly";

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="rounded-full bg-primary/10 p-3"><Icon className="h-5 w-5 text-primary" /></div>
        <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div>
      </CardContent>
    </Card>
  );
}

export default function SubscriberAnalytics() {
  // Seed system queries so they appear in SQL Studio for editing
  useSystemQuery({
    key: "subscriber-analytics:stats",
    title: "Subscriber Stats",
    defaultSql: `SELECT
  COUNT(*) FILTER (WHERE is_active = true) as active_subscribers,
  COUNT(*) FILTER (WHERE is_active = false) as unsubscribed,
  COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days') as new_last_30_days,
  CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE is_active = false)::numeric / COUNT(*) * 100), 1) ELSE 0 END as unsubscribe_rate
FROM newsletter_subscribers`,
    targetPage: "subscriber-analytics",
  });

  useSystemQuery({
    key: "subscriber-analytics:trend",
    title: "Subscriber Trend (Daily)",
    defaultSql: `SELECT date_trunc('day', created_at)::date as date, COUNT(*) as subscribed,
  COUNT(*) FILTER (WHERE is_active = false) as unsubscribed
FROM newsletter_subscribers
WHERE created_at >= now() - interval '30 days'
GROUP BY date ORDER BY date`,
    defaultViz: { chartType: "line", xColumn: "date", yColumns: ["subscribed", "unsubscribed"] },
    targetPage: "subscriber-analytics",
  });

  useSystemQuery({
    key: "subscriber-analytics:unsub-sources",
    title: "Unsubscribes by Source",
    defaultSql: `SELECT unsubscribe_source as source, COUNT(*) as count
FROM newsletter_subscribers
WHERE unsubscribe_source IS NOT NULL
GROUP BY unsubscribe_source
ORDER BY count DESC`,
    targetPage: "subscriber-analytics",
  });

  const [timeRange, setTimeRange] = useState<TimeRange>("daily");

  const { data: subscribers = [], isLoading } = useQuery({
    queryKey: ["subscriber-analytics"],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.from("newsletter_subscribers" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const stats = useMemo(() => {
    const active = subscribers.filter((s: any) => s.is_active !== false).length;
    const unsubscribed = subscribers.filter((s: any) => s.is_active === false).length;
    const total = subscribers.length;
    const thirtyDaysAgo = subDays(new Date(), 30);
    const newThisMonth = subscribers.filter((s: any) => new Date(s.created_at) >= thirtyDaysAgo).length;
    const unsubRate = total > 0 ? ((unsubscribed / total) * 100).toFixed(1) : "0";
    return { active, unsubscribed, newThisMonth, unsubRate };
  }, [subscribers]);

  const trendData = useMemo(() => {
    const bucketFn = timeRange === "daily" ? startOfDay : timeRange === "weekly" ? startOfWeek : startOfMonth;
    const formatFn = timeRange === "daily" ? "MMM d" : timeRange === "weekly" ? "MMM d" : "MMM yyyy";
    const lookback = timeRange === "daily" ? 30 : timeRange === "weekly" ? 12 * 7 : 365;
    const cutoff = subDays(new Date(), lookback);

    const buckets: Record<string, { subscribed: number; unsubscribed: number }> = {};

    subscribers.forEach((s: any) => {
      const created = new Date(s.created_at);
      if (created >= cutoff) {
        const key = bucketFn(created).toISOString();
        if (!buckets[key]) buckets[key] = { subscribed: 0, unsubscribed: 0 };
        buckets[key].subscribed++;
      }
      if (s.unsubscribed_at) {
        const unsub = new Date(s.unsubscribed_at);
        if (unsub >= cutoff) {
          const key = bucketFn(unsub).toISOString();
          if (!buckets[key]) buckets[key] = { subscribed: 0, unsubscribed: 0 };
          buckets[key].unsubscribed++;
        }
      }
    });

    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date: format(new Date(date), formatFn),
        ...vals,
      }));
  }, [subscribers, timeRange]);

  const unsubSources = useMemo(() => {
    const map: Record<string, number> = {};
    subscribers.forEach((s: any) => {
      if (s.unsubscribe_source) {
        map[s.unsubscribe_source] = (map[s.unsubscribe_source] || 0) + 1;
      }
    });
    return Object.entries(map)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  }, [subscribers]);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Subscriber Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active Subscribers" value={stats.active} />
        <StatCard icon={UserX} label="Unsubscribed" value={stats.unsubscribed} />
        <StatCard icon={TrendingUp} label="New (30 days)" value={stats.newThisMonth} />
        <StatCard icon={Percent} label="Unsubscribe Rate" value={`${stats.unsubRate}%`} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Subscriber Trends</CardTitle>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList><TabsTrigger value="daily">Daily</TabsTrigger><TabsTrigger value="weekly">Weekly</TabsTrigger><TabsTrigger value="monthly">Monthly</TabsTrigger></TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {trendData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No data for this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                <Legend />
                <Line type="monotone" dataKey="subscribed" name="New Subscribers" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="unsubscribed" name="Unsubscribes" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Unsubscribes by Email Source</CardTitle></CardHeader>
        <CardContent>
          {unsubSources.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No unsubscribe attribution data yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email / Template</TableHead>
                  <TableHead className="text-right">Unsubscribes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unsubSources.map((row) => (
                  <TableRow key={row.source}>
                    <TableCell>{row.source}</TableCell>
                    <TableCell className="text-right font-medium">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <PinnedQueryWidgets pageName="subscriber-analytics" />
    </div>
  );
}
