import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Play, Save, Loader2, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import ChartRenderer, { VizConfig, defaultViz, CHART_TYPES, AGGREGATIONS } from "./ChartRenderer";

const TARGET_PAGES = [
  { value: "none", label: "None (don't pin)" },
  { value: "course-analytics", label: "Course Analytics" },
  { value: "subscriber-analytics", label: "Subscriber Analytics" },
  { value: "website-analytics", label: "Website Analytics" },
  { value: "email-analytics", label: "Email Analytics" },
];

export default function SqlQueryStudio() {
  const queryClient = useQueryClient();
  const [sql, setSql] = useState("SELECT * FROM profiles LIMIT 10");
  const [results, setResults] = useState<{ columns: string[]; rows: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [viz, setViz] = useState<VizConfig>({ ...defaultViz });
  const [saveTitle, setSaveTitle] = useState("");
  const [targetPage, setTargetPage] = useState("none");
  const [customPageName, setCustomPageName] = useState("");
  const [activeTab, setActiveTab] = useState("results");
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: savedQueries = [] } = useQuery({
    queryKey: ["saved-queries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_queries" as any).select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const customPages = useMemo(() => {
    const pages = new Set<string>();
    savedQueries.forEach((q: any) => {
      if (q.target_page && q.target_page.startsWith("custom:")) pages.add(q.target_page);
    });
    return [...pages];
  }, [savedQueries]);

  const runQuery = async () => {
    setRunning(true);
    setError(null);
    setResults(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("run-analytics-query", { body: { sql } });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setResults(data);
      if (data?.columns?.length > 0) {
        setViz((v) => ({
          ...v,
          xColumn: v.xColumn || data.columns[0],
          yColumns: v.yColumns.length > 0 ? v.yColumns : data.columns.length > 1 ? [data.columns[1]] : [],
        }));
      }
    } catch (e: any) {
      setError(e.message || "Query failed");
    } finally {
      setRunning(false);
    }
  };

  const resolvedTargetPage = targetPage === "custom:new"
    ? (customPageName.trim() ? `custom:${customPageName.trim()}` : null)
    : (targetPage === "none" ? null : targetPage);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase.from("saved_queries" as any).update({
          title: saveTitle || "Untitled Query",
          sql_query: sql,
          visualization_config: viz,
          target_page: resolvedTargetPage,
        } as any).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("saved_queries" as any).insert({
          title: saveTitle || "Untitled Query",
          sql_query: sql,
          visualization_config: viz,
          target_page: resolvedTargetPage,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-queries"] });
      queryClient.invalidateQueries({ queryKey: ["pinned-queries"] });
      queryClient.invalidateQueries({ queryKey: ["custom-analytics-pages"] });
      toast.success(editingId ? "Query updated" : "Query saved");
      setSaveTitle("");
      setTargetPage("none");
      setCustomPageName("");
      setEditingId(null);
    },
  });

  const deleteSaved = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_queries" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-queries"] });
      toast.success("Deleted");
    },
  });

  const loadSaved = (q: any) => {
    setSql(q.sql_query);
    if (q.visualization_config) setViz({ ...defaultViz, ...q.visualization_config });
    setTargetPage(q.target_page || "none");
    setSaveTitle(q.title || "");
    setEditingId(q.id);
  };

  const columns = results?.columns || [];
  const rows = results?.rows || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center gap-2">
            <Label className="font-semibold">SQL Query</Label>
            {editingId && (
              <Badge variant="secondary" className="text-xs">
                Editing: {saveTitle || "Untitled"}
              </Badge>
            )}
          </div>
          <Textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            className="font-mono text-sm min-h-[120px]"
            placeholder="SELECT * FROM ..."
          />
          <div className="flex gap-2 items-center flex-wrap">
            <Button size="sm" className="gap-1" onClick={runQuery} disabled={running || !sql.trim()}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run Query
            </Button>
            {editingId && (
              <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setSaveTitle(""); setSql("SELECT * FROM profiles LIMIT 10"); setTargetPage("none"); }}>
                Cancel Edit
              </Button>
            )}
            <div className="flex gap-2 items-center ml-auto flex-wrap">
              <Input value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} placeholder="Query name..." className="w-36 h-8 text-sm" />
              <Select value={targetPage} onValueChange={setTargetPage}>
                <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Pin to page..." /></SelectTrigger>
                <SelectContent>
                  {TARGET_PAGES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  {customPages.map((cp) => <SelectItem key={cp} value={cp}>{cp.replace("custom:", "📊 ")}</SelectItem>)}
                  <SelectItem value="custom:new">+ New Custom Page</SelectItem>
                </SelectContent>
              </Select>
              {targetPage === "custom:new" && (
                <Input value={customPageName} onChange={(e) => setCustomPageName(e.target.value)} placeholder="Page name..." className="w-36 h-8 text-sm" />
              )}
              <Button variant="outline" size="sm" className="gap-1" onClick={() => saveMutation.mutate()} disabled={!sql.trim()}>
                <Save className="h-4 w-4" /> {editingId ? "Update" : "Save"}
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {savedQueries.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Saved Queries ({savedQueries.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Title</TableHead>
                    <TableHead className="text-xs">Pinned To</TableHead>
                    <TableHead className="text-xs">Updated</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedQueries.map((q: any) => (
                    <TableRow key={q.id} className={editingId === q.id ? "bg-muted/50" : ""}>
                      <TableCell className="text-xs font-medium py-2">
                        <span className="flex items-center gap-1.5">
                          {q.title}
                          {q.system_key && <Badge variant="outline" className="text-[10px] px-1 py-0">System</Badge>}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-2">
                        {q.target_page ? q.target_page.replace("custom:", "📊 ") : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-2">
                        {q.updated_at ? format(new Date(q.updated_at), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-right py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => loadSaved(q)}>
                            <Pencil className="h-3 w-3" /> Edit
                          </Button>
                          {!q.system_key && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive/80" onClick={() => deleteSaved.mutate(q.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {results && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{rows.length} rows × {columns.length} columns</CardTitle>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="h-8">
                  <TabsTrigger value="results" className="text-xs px-2">Table</TabsTrigger>
                  <TabsTrigger value="visualization" className="text-xs px-2">Visualization</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "results" && (
              <div className="max-h-[400px] overflow-auto border border-border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((c) => <TableHead key={c} className="text-xs whitespace-nowrap">{c}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 200).map((row, i) => (
                      <TableRow key={i}>
                        {columns.map((c) => <TableCell key={c} className="text-xs whitespace-nowrap">{String(row[c] ?? "")}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {activeTab === "visualization" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Chart Type</Label>
                    <Select value={viz.chartType} onValueChange={(v) => setViz({ ...viz, chartType: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CHART_TYPES.map((ct) => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">X-Axis</Label>
                    <Select value={viz.xColumn} onValueChange={(v) => setViz({ ...viz, xColumn: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {columns.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Y-Axis</Label>
                    <Select value={viz.yColumns[0] || ""} onValueChange={(v) => setViz({ ...viz, yColumns: [v] })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {columns.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Aggregation</Label>
                    <Select value={viz.aggregation} onValueChange={(v) => setViz({ ...viz, aggregation: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AGGREGATIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Group By</Label>
                    <Select value={viz.groupBy || "none"} onValueChange={(v) => setViz({ ...viz, groupBy: v === "none" ? "" : v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {columns.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Sort</Label>
                    <Select value={viz.sortOrder} onValueChange={(v) => setViz({ ...viz, sortOrder: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Limit</Label>
                    <Input type="number" value={viz.limitRows} onChange={(e) => setViz({ ...viz, limitRows: parseInt(e.target.value) || 100 })} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Title</Label>
                    <Input value={viz.title} onChange={(e) => setViz({ ...viz, title: e.target.value })} className="h-8 text-xs" placeholder="Chart title" />
                  </div>
                </div>
                <ChartRenderer rows={rows} viz={viz} columns={columns} />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
