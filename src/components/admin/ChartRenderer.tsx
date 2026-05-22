import { useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(142 76% 36%)", "hsl(38 92% 50%)", "hsl(0 84% 60%)", "hsl(262 83% 58%)", "hsl(199 89% 48%)"];

export interface VizConfig {
  chartType: string;
  xColumn: string;
  yColumns: string[];
  groupBy: string;
  aggregation: string;
  sortOrder: string;
  limitRows: number;
  title: string;
  subtitle: string;
}

export const defaultViz: VizConfig = {
  chartType: "table",
  xColumn: "",
  yColumns: [],
  groupBy: "",
  aggregation: "NONE",
  sortOrder: "asc",
  limitRows: 100,
  title: "",
  subtitle: "",
};

export const CHART_TYPES = [
  { value: "table", label: "Table" },
  { value: "bar", label: "Bar Chart" },
  { value: "stacked_bar", label: "Stacked Bar" },
  { value: "grouped_bar", label: "Grouped Bar" },
  { value: "line", label: "Line Chart" },
  { value: "area", label: "Area Chart" },
  { value: "pie", label: "Pie / Donut" },
  { value: "scatter", label: "Scatter Plot" },
  { value: "number", label: "Single Stat" },
];

export const AGGREGATIONS = ["NONE", "SUM", "COUNT", "AVG", "MIN", "MAX"];

export default function ChartRenderer({ rows, viz, columns }: { rows: any[]; viz: VizConfig; columns: string[] }) {
  const chartData = useMemo(() => {
    let data = [...rows];

    if (viz.aggregation !== "NONE" && viz.xColumn && viz.yColumns[0]) {
      const groups: Record<string, any[]> = {};
      for (const row of data) {
        const key = String(row[viz.xColumn] ?? "");
        if (!groups[key]) groups[key] = [];
        groups[key].push(row);
      }
      data = Object.entries(groups).map(([key, groupRows]) => {
        const result: any = { [viz.xColumn]: key };
        for (const yCol of viz.yColumns) {
          const values = groupRows.map((r) => parseFloat(r[yCol]) || 0);
          switch (viz.aggregation) {
            case "SUM": result[yCol] = values.reduce((a, b) => a + b, 0); break;
            case "COUNT": result[yCol] = values.length; break;
            case "AVG": result[yCol] = values.reduce((a, b) => a + b, 0) / values.length; break;
            case "MIN": result[yCol] = Math.min(...values); break;
            case "MAX": result[yCol] = Math.max(...values); break;
          }
        }
        return result;
      });
    }

    if (viz.xColumn) {
      data.sort((a, b) => {
        const av = a[viz.yColumns[0] ?? viz.xColumn];
        const bv = b[viz.yColumns[0] ?? viz.xColumn];
        return viz.sortOrder === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
    }

    return data.slice(0, viz.limitRows);
  }, [rows, viz]);

  if (chartData.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">No data to visualize</p>;

  const yCol = viz.yColumns[0] || "";

  if (viz.chartType === "number") {
    const value = chartData[0]?.[yCol || columns[0]] ?? "—";
    return (
      <div className="text-center py-8">
        {viz.title && <p className="text-sm text-muted-foreground mb-2">{viz.title}</p>}
        <p className="text-5xl font-bold">{String(value)}</p>
      </div>
    );
  }

  if (viz.chartType === "pie") {
    return (
      <div>
        {viz.title && <p className="text-sm font-medium text-center mb-2">{viz.title}</p>}
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={chartData} dataKey={yCol} nameKey={viz.xColumn} cx="50%" cy="50%" outerRadius={100} label>
              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (viz.chartType === "scatter") {
    return (
      <div>
        {viz.title && <p className="text-sm font-medium text-center mb-2">{viz.title}</p>}
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={viz.xColumn} name={viz.xColumn} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis dataKey={yCol} name={yCol} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip />
            <Scatter data={chartData} fill={COLORS[0]} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (viz.chartType === "area") {
    return (
      <div>
        {viz.title && <p className="text-sm font-medium text-center mb-2">{viz.title}</p>}
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={viz.xColumn} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip />
            <Area type="monotone" dataKey={yCol} fill={COLORS[0]} stroke={COLORS[0]} fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (viz.chartType === "line") {
    return (
      <div>
        {viz.title && <p className="text-sm font-medium text-center mb-2">{viz.title}</p>}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={viz.xColumn} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip />
            <Legend />
            {viz.yColumns.map((y, i) => <Line key={y} type="monotone" dataKey={y} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // bar, stacked_bar, grouped_bar
  return (
    <div>
      {viz.title && <p className="text-sm font-medium text-center mb-2">{viz.title}</p>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={viz.xColumn} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <Tooltip />
          <Legend />
          {viz.yColumns.map((y, i) => (
            <Bar key={y} dataKey={y} fill={COLORS[i % COLORS.length]} stackId={viz.chartType === "stacked_bar" ? "stack" : undefined} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
