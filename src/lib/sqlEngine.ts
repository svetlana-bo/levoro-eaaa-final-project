import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";

let SQL: SqlJsStatic | null = null;

async function getSql(): Promise<SqlJsStatic> {
  if (SQL) return SQL;
  SQL = await initSqlJs({
    locateFile: () => sqlWasmUrl,
  });
  return SQL;
}

export interface SqlResult {
  columns: string[];
  rows: string[][];
  error?: string;
}

export async function executeSQL(
  setupSql: string,
  userQuery: string
): Promise<SqlResult> {
  try {
    const sql = await getSql();
    const db: Database = new sql.Database();
    try {
      if (setupSql.trim()) {
        db.run(setupSql);
      }
      if (!userQuery.trim()) {
        return { columns: [], rows: [], error: "No query provided." };
      }
      const results = db.exec(userQuery);
      if (results.length === 0) {
        return { columns: [], rows: [], error: undefined };
      }
      const first = results[0];
      return {
        columns: first.columns,
        rows: first.values.map((row) => row.map((v) => (v === null ? "NULL" : String(v)))),
      };
    } finally {
      db.close();
    }
  } catch (e: any) {
    return { columns: [], rows: [], error: e.message || String(e) };
  }
}

/** Execute SQL on a persistent database (binary state), returns result + updated binary */
export async function executeSQLPersistent(
  dbBinary: Uint8Array | null,
  setupSql: string,
  userQuery: string
): Promise<SqlResult & { dbBinary: Uint8Array }> {
  try {
    const sql = await getSql();
    const db: Database = dbBinary
      ? new sql.Database(dbBinary)
      : new sql.Database();
    try {
      // Apply setup SQL only if this is a fresh DB (no binary)
      if (!dbBinary && setupSql.trim()) {
        db.run(setupSql);
      }
      if (!userQuery.trim()) {
        const exported = db.export();
        return { columns: [], rows: [], error: "No query provided.", dbBinary: new Uint8Array(exported) };
      }
      const results = db.exec(userQuery);
      const exported = new Uint8Array(db.export());
      if (results.length === 0) {
        return { columns: [], rows: [], error: undefined, dbBinary: exported };
      }
      const first = results[0];
      return {
        columns: first.columns,
        rows: first.values.map((row) => row.map((v) => (v === null ? "NULL" : String(v)))),
        dbBinary: exported,
      };
    } finally {
      db.close();
    }
  } catch (e: any) {
    return { columns: [], rows: [], error: e.message || String(e), dbBinary: dbBinary || new Uint8Array() };
  }
}

/** Parse CSV text into CREATE TABLE + INSERT INTO statements */
export function csvToSql(csvText: string, tableName: string): string {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return "";
  
  const headers = parseCsvLine(lines[0]);
  const dataRows = lines.slice(1).map(parseCsvLine);
  
  // Infer types from first data row
  const types = headers.map((_, i) => {
    const val = dataRows[0]?.[i]?.trim() ?? "";
    if (val === "" || isNaN(Number(val))) return "TEXT";
    return val.includes(".") ? "REAL" : "INTEGER";
  });

  const colDefs = headers.map((h, i) => `  ${sanitizeIdentifier(h)} ${types[i]}`).join(",\n");
  let sql = `CREATE TABLE ${sanitizeIdentifier(tableName)} (\n${colDefs}\n);\n\n`;

  for (const row of dataRows) {
    if (row.every(c => c.trim() === "")) continue;
    const vals = row.map((v, i) => {
      const trimmed = v.trim();
      if (types[i] === "TEXT") return `'${trimmed.replace(/'/g, "''")}'`;
      return trimmed === "" ? "NULL" : trimmed;
    });
    sql += `INSERT INTO ${sanitizeIdentifier(tableName)} VALUES (${vals.join(", ")});\n`;
  }
  return sql;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function sanitizeIdentifier(name: string): string {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9_]/g, "_").replace(/^[0-9]/, "_$&");
  return cleaned || "col";
}
