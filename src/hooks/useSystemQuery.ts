import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { VizConfig } from "@/components/admin/ChartRenderer";

interface SystemQueryDef {
  key: string;
  title: string;
  defaultSql: string;
  defaultViz?: Partial<VizConfig>;
  targetPage?: string;
}

interface SystemQueryResult {
  columns: string[];
  rows: any[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  sql: string;
}

export function useSystemQuery(def: SystemQueryDef): SystemQueryResult {
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sql, setSql] = useState(def.defaultSql);
  const [seeded, setSeeded] = useState(false);
  const queryClient = useQueryClient();

  // Seed or load the saved query
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Check if system query exists
        const { data: existing, error: fetchErr } = await supabase
          .from("saved_queries" as any)
          .select("*")
          .eq("system_key", def.key)
          .maybeSingle();
        if (fetchErr) throw fetchErr;

        if (existing) {
          setSql((existing as any).sql_query);
        } else {
          // Seed it
          const { error: insertErr } = await supabase
            .from("saved_queries" as any)
            .insert({
              system_key: def.key,
              title: def.title,
              sql_query: def.defaultSql,
              visualization_config: def.defaultViz || null,
              target_page: def.targetPage || null,
            } as any);
          if (insertErr) {
            // Race condition — another tab may have inserted it
            const { data: retry } = await supabase
              .from("saved_queries" as any)
              .select("*")
              .eq("system_key", def.key)
              .maybeSingle();
            if (retry) setSql((retry as any).sql_query);
          }
        }
        if (!cancelled) setSeeded(true);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message);
          setIsLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [def.key]);

  // Run the query once seeded
  const runQuery = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Re-fetch the latest SQL in case it was edited in SQL Studio
      const { data: latest } = await supabase
        .from("saved_queries" as any)
        .select("sql_query")
        .eq("system_key", def.key)
        .maybeSingle();
      const currentSql = (latest as any)?.sql_query || sql;
      setSql(currentSql);

      const { data, error: fnError } = await supabase.functions.invoke("run-analytics-query", {
        body: { sql: currentSql },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setColumns(data.columns || []);
      setRows(data.rows || []);
    } catch (e: any) {
      setError(e.message || "Query failed");
    } finally {
      setIsLoading(false);
    }
  }, [def.key, sql]);

  useEffect(() => {
    if (seeded) runQuery();
  }, [seeded, runQuery]);

  return { columns, rows, isLoading, error, refetch: runQuery, sql };
}

export function useSystemQueries(defs: SystemQueryDef[]): Record<string, SystemQueryResult> {
  // This is a convenience wrapper — but hooks can't be called in loops.
  // Instead, use individual useSystemQuery calls in the component.
  // This export is just for type reference.
  throw new Error("Use individual useSystemQuery calls instead");
}
