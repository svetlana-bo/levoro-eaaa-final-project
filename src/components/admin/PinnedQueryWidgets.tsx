import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import ChartRenderer, { VizConfig, defaultViz } from "./ChartRenderer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PinnedQuery {
  id: string;
  title: string;
  sql_query: string;
  visualization_config: VizConfig | null;
}

export default function PinnedQueryWidgets({ pageName }: { pageName: string }) {
  const queryClient = useQueryClient();

  const { data: queries = [] } = useQuery({
    queryKey: ["pinned-queries", pageName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_queries" as any)
        .select("*")
        .eq("target_page", pageName)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any as PinnedQuery[];
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("saved_queries" as any)
        .update({ target_page: null } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pinned-queries", pageName] }),
  });

  if (queries.length === 0) return null;

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pinned Queries</h3>
      {queries.map((q) => (
        <PinnedWidget key={q.id} query={q} onRemove={() => removeMutation.mutate(q.id)} />
      ))}
    </div>
  );
}

function PinnedWidget({ query, onRemove }: { query: PinnedQuery; onRemove: () => void }) {
  const [result, setResult] = useState<{ columns: string[]; rows: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("run-analytics-query", {
          body: { sql: query.sql_query },
        });
        if (cancelled) return;
        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);
        setResult(data);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Query failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [query.sql_query]);

  const viz: VizConfig = query.visualization_config
    ? { ...defaultViz, ...query.visualization_config }
    : defaultViz;

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">{query.title}</CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove} title="Remove from page">
          <X className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && viz.chartType === "table" && (
          <div className="max-h-[300px] overflow-auto border border-border rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  {result.columns.map((c) => <TableHead key={c} className="text-xs whitespace-nowrap">{c}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.slice(0, 100).map((row, i) => (
                  <TableRow key={i}>
                    {result.columns.map((c) => <TableCell key={c} className="text-xs whitespace-nowrap">{String(row[c] ?? "")}</TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {result && viz.chartType !== "table" && (
          <ChartRenderer rows={result.rows} viz={viz} columns={result.columns} />
        )}
      </CardContent>
    </Card>
  );
}
