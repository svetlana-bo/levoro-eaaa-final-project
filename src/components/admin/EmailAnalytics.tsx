import { useState, useMemo } from "react";
import PinnedQueryWidgets from "./PinnedQueryWidgets";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Eye, MousePointerClick, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, subWeeks, subMonths, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { useSystemQuery } from "@/hooks/useSystemQuery";

type TimeRange = "daily" | "weekly" | "monthly";

export default function EmailAnalytics() {
  // Seed system queries so they appear in SQL Studio for editing
  useSystemQuery({
    key: "email-analytics:stats",
    title: "Email Stats Overview",
    defaultSql: `SELECT
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE is_opened) as total_opened,
  COUNT(*) FILTER (WHERE is_clicked) as total_clicked,
  CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE is_opened)::numeric / COUNT(*) * 100), 1) ELSE 0 END as open_rate,
  CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE is_clicked)::numeric / COUNT(*) * 100), 1) ELSE 0 END as click_rate
FROM marketing_email_sends`,
    targetPage: "email-analytics",
  });

  useSystemQuery({
    key: "email-analytics:trend",
    title: "Email Sends Trend (Daily)",
    defaultSql: `SELECT date_trunc('day', created_at)::date as date,
  COUNT(*) as sent,
  COUNT(*) FILTER (WHERE is_opened) as opened,
  COUNT(*) FILTER (WHERE is_clicked) as clicked
FROM marketing_email_sends
WHERE created_at >= now() - interval '30 days'
GROUP BY date ORDER BY date`,
    defaultViz: { chartType: "line", xColumn: "date", yColumns: ["sent", "opened", "clicked"] },
    targetPage: "email-analytics",
  });

  useSystemQuery({
    key: "email-analytics:template-breakdown",
    title: "Per-Template Performance",
    defaultSql: `SELECT template_name,
  COUNT(*) as sent,
  COUNT(*) FILTER (WHERE is_opened) as opened,
  COUNT(*) FILTER (WHERE is_clicked) as clicked,
  CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE is_opened)::numeric / COUNT(*) * 100), 1) ELSE 0 END as open_rate,
  CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE is_clicked)::numeric / COUNT(*) * 100), 1) ELSE 0 END as click_rate
FROM marketing_email_sends
GROUP BY template_name
ORDER BY sent DESC`,
    targetPage: "email-analytics",
  });

  const [timeRange, setTimeRange] = useState<TimeRange>("daily");

  // Use marketing_email_sends as the single source of truth
  const { data: sends = [], isLoading } = useQuery({
    queryKey: ["email-sends-analytics"],
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_email_sends" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const stats = useMemo(() => {
    const totalSent = sends.length;
    const totalOpened = sends.filter((s: any) => s.is_opened).length;
    const totalClicked = sends.filter((s: any) => s.is_clicked).length;

    // Avg time to open from created_at to opened_at
    let totalTimeToOpen = 0;
    let timeToOpenCount = 0;
    for (const s of sends) {
      if (s.is_opened && s.opened_at && s.created_at) {
        const diff = new Date(s.opened_at).getTime() - new Date(s.created_at).getTime();
        if (diff > 0) {
          totalTimeToOpen += diff;
          timeToOpenCount++;
        }
      }
    }
    const avgTimeToOpenMin = timeToOpenCount > 0 ? Math.round(totalTimeToOpen / timeToOpenCount / 60000) : 0;

    return {
      totalSent,
      totalOpened,
      totalClicked,
      openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0",
      clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : "0",
      avgTimeToOpen: avgTimeToOpenMin,
    };
  }, [sends]);

  const trendData = useMemo(() => {
    const now = new Date();
    let periods: { start: Date; label: string }[] = [];

    if (timeRange === "daily") {
      for (let i = 29; i >= 0; i--) {
        const d = subDays(now, i);
        periods.push({ start: startOfDay(d), label: format(d, "MMM d") });
      }
    } else if (timeRange === "weekly") {
      for (let i = 11; i >= 0; i--) {
        const d = subWeeks(now, i);
        periods.push({ start: startOfWeek(d), label: format(startOfWeek(d), "MMM d") });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(now, i);
        periods.push({ start: startOfMonth(d), label: format(d, "MMM yyyy") });
      }
    }

    return periods.map((p, idx) => {
      const nextStart = idx < periods.length - 1 ? periods[idx + 1].start : now;
      const periodSends = sends.filter((s: any) => {
        const d = new Date(s.created_at);
        return d >= p.start && d < nextStart;
      });
      const periodOpened = sends.filter((s: any) => {
        if (!s.is_opened || !s.opened_at) return false;
        const d = new Date(s.opened_at);
        return d >= p.start && d < nextStart;
      });
      const periodClicked = sends.filter((s: any) => {
        if (!s.is_clicked || !s.clicked_at) return false;
        const d = new Date(s.clicked_at);
        return d >= p.start && d < nextStart;
      });
      return {
        period: p.label,
        Sent: periodSends.length,
        Opened: periodOpened.length,
        Clicked: periodClicked.length,
      };
    });
  }, [sends, timeRange]);

  const templateBreakdown = useMemo(() => {
    const byTemplate: Record<string, { name: string; sent: number; opened: number; clicked: number }> = {};
    for (const s of sends) {
      const key = (s as any).template_name || "Unknown";
      if (!byTemplate[key]) byTemplate[key] = { name: key, sent: 0, opened: 0, clicked: 0 };
      byTemplate[key].sent++;
      if ((s as any).is_opened) byTemplate[key].opened++;
      if ((s as any).is_clicked) byTemplate[key].clicked++;
    }
    return Object.values(byTemplate).sort((a, b) => b.sent - a.sent);
  }, [sends]);

  if (isLoading) return <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Mail} label="Total Sent" value={stats.totalSent} />
        <StatCard icon={Eye} label="Unique Opens" value={stats.totalOpened} />
        <StatCard icon={MousePointerClick} label="Unique Clicks" value={stats.totalClicked} />
        <StatCard icon={Eye} label="Open Rate" value={`${stats.openRate}%`} />
        <StatCard icon={MousePointerClick} label="Click Rate" value={`${stats.clickRate}%`} />
        <StatCard icon={Clock} label="Avg Time to Open" value={stats.avgTimeToOpen > 0 ? `${stats.avgTimeToOpen}m` : "—"} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Email Trends</CardTitle>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList className="h-8">
              <TabsTrigger value="daily" className="text-xs px-2">Daily</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs px-2">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs px-2">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {trendData.every((d) => d.Sent === 0 && d.Opened === 0 && d.Clicked === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">No email events recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Line type="monotone" dataKey="Sent" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Opened" stroke="hsl(var(--accent-foreground))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Clicked" stroke="hsl(142 76% 36%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-Template Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {templateBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Opens</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Open Rate</TableHead>
                  <TableHead className="text-right">Click Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templateBreakdown.map((t) => (
                  <TableRow key={t.name}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-right">{t.sent}</TableCell>
                    <TableCell className="text-right">{t.opened}</TableCell>
                    <TableCell className="text-right">{t.clicked}</TableCell>
                    <TableCell className="text-right">{t.sent > 0 ? ((t.opened / t.sent) * 100).toFixed(1) : 0}%</TableCell>
                    <TableCell className="text-right">{t.sent > 0 ? ((t.clicked / t.sent) * 100).toFixed(1) : 0}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <PinnedQueryWidgets pageName="email-analytics" />
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="py-4 flex flex-col items-center text-center gap-1">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
