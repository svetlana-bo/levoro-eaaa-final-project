import { useState } from "react";
import type { EmailBlock, EmailTextBlock, EmailImageBlock, EmailVideoBlock, EmailTableBlock, EmailSplitScreenBlock, EmailSplitInnerBlock } from "./blockTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/lesson-editor/RichTextEditor";
import { MediaUpload } from "@/components/MediaUpload";
import { Plus, Trash2, ChevronUp, ChevronDown, Type, Image as ImageIcon, Video, Columns, Table2, Link as LinkIcon, X, Minus } from "lucide-react";

const newId = () => crypto.randomUUID();

const makeBlock = (type: EmailBlock["type"]): EmailBlock => {
  const id = newId();
  switch (type) {
    case "text": return { type: "text", id, html: "" };
    case "image": return { type: "image", id, url: "", alt: "", widthPercent: 100, linkUrl: "" };
    case "video": return { type: "video", id, url: "", title: "" };
    case "table": {
      const cell = () => ({ id: newId(), html: "" });
      return { type: "table", id, cells: [[cell(), cell()], [cell(), cell()]], headerRow: false, borderColor: "#e5e7eb", borderWidth: 1 };
    }
    case "splitScreen": return { type: "splitScreen", id, left: null, right: null };
    case "divider": return { type: "divider", id, thickness: 1, color: "#e5e7eb" };
  }
};

const makeInner = (type: "text" | "image"): EmailSplitInnerBlock => {
  if (type === "text") return { type: "text", id: newId(), html: "" };
  return { type: "image", id: newId(), url: "", alt: "", widthPercent: 100, linkUrl: "" };
};

interface Props {
  blocks: EmailBlock[];
  onChange: (b: EmailBlock[]) => void;
}

export function EmailBlockEditor({ blocks, onChange }: Props) {
  const update = (id: string, updated: EmailBlock) => onChange(blocks.map(b => b.id === id ? updated : b));
  const remove = (id: string) => onChange(blocks.filter(b => b.id !== id));
  const move = (i: number, dir: "up" | "down") => {
    const ni = dir === "up" ? i - 1 : i + 1;
    if (ni < 0 || ni >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[ni]] = [next[ni], next[i]];
    onChange(next);
  };
  const add = (type: EmailBlock["type"], index: number) => {
    const next = [...blocks];
    next.splice(index, 0, makeBlock(type));
    onChange(next);
  };

  const AddMenu = ({ index }: { index: number }) => {
    const [open, setOpen] = useState(false);
    const Item = ({ type, icon, label }: { type: EmailBlock["type"]; icon: React.ReactNode; label: string }) => (
      <button onClick={() => { add(type, index); setOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-left">
        {icon}{label}
      </button>
    );
    return (
      <div className="flex justify-center py-1">
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => setOpen(true)}>
          <Plus className="h-3 w-3" /> Add Block
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-xs p-0">
            <DialogHeader className="p-4 pb-2">
              <DialogTitle className="text-sm">Add Block</DialogTitle>
            </DialogHeader>
            <div className="px-2 pb-3">
              <Item type="text" icon={<Type className="h-4 w-4" />} label="Text" />
              <Item type="image" icon={<ImageIcon className="h-4 w-4" />} label="Image" />
              <Item type="video" icon={<Video className="h-4 w-4" />} label="Video" />
              <Item type="splitScreen" icon={<Columns className="h-4 w-4" />} label="Split Screen" />
              <Item type="table" icon={<Table2 className="h-4 w-4" />} label="Table" />
              <Item type="divider" icon={<Minus className="h-4 w-4" />} label="Divider" />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <AddMenu index={0} />
      {blocks.map((block, i) => (
        <div key={block.id}>
          <div className="border-2 border-border rounded-lg p-4 bg-card relative group shadow-sm">
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => move(i, "up")} disabled={i === 0}><ChevronUp className="h-3 w-3" /></Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => move(i, "down")} disabled={i === blocks.length - 1}><ChevronDown className="h-3 w-3" /></Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => remove(block.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
            <BlockBody block={block} onChange={(u) => update(block.id, u)} />
          </div>
          <AddMenu index={i + 1} />
        </div>
      ))}
      {blocks.length === 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">No blocks yet. Click "Add Block" to start.</p>
      )}
    </div>
  );
}

function BlockBody({ block, onChange }: { block: EmailBlock; onChange: (b: EmailBlock) => void }) {
  if (block.type === "text") {
    return (
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2"><Type className="h-3.5 w-3.5" /> Text</div>
        <RichTextEditor value={block.html} onChange={(html) => onChange({ ...block, html } as EmailTextBlock)} placeholder="Write content..." />
      </div>
    );
  }
  if (block.type === "image") {
    return <ImageBlockEditor block={block} onChange={onChange as (b: EmailImageBlock) => void} />;
  }
  if (block.type === "video") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Video className="h-3.5 w-3.5" /> Video</div>
        <Input value={block.url} onChange={e => onChange({ ...block, url: e.target.value } as EmailVideoBlock)} placeholder="https://youtu.be/... or video URL (renders as clickable thumbnail)" className="h-9 text-sm" />
        <div>
          <Label className="text-xs">Thumbnail (optional, recommended for non-YouTube)</Label>
          <MediaUpload value={block.thumbnailUrl || ""} onChange={(url) => onChange({ ...block, thumbnailUrl: url } as EmailVideoBlock)} accept="image/*" placeholder="Thumbnail image..." />
        </div>
        <Input value={block.title || ""} onChange={e => onChange({ ...block, title: e.target.value } as EmailVideoBlock)} placeholder="Caption (optional)" className="h-9 text-sm" />
        <p className="text-[11px] text-muted-foreground">Email clients don't support inline video. We render a clickable thumbnail linked to the video URL.</p>
      </div>
    );
  }
  if (block.type === "table") {
    return <TableBlockEditor block={block} onChange={onChange as (b: EmailTableBlock) => void} />;
  }
  if (block.type === "splitScreen") {
    return <SplitScreenBlockEditor block={block} onChange={onChange as (b: EmailSplitScreenBlock) => void} />;
  }
  if (block.type === "divider") {
    return <DividerBlockEditor block={block} onChange={onChange as (b: import("./blockTypes").EmailDividerBlock) => void} />;
  }
  return null;
}

function DividerBlockEditor({ block, onChange }: { block: import("./blockTypes").EmailDividerBlock; onChange: (b: import("./blockTypes").EmailDividerBlock) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Minus className="h-3.5 w-3.5" /> Divider</div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <Label className="text-xs">Color:</Label>
          <input type="color" value={block.color} onChange={e => onChange({ ...block, color: e.target.value })} className="h-7 w-9 rounded cursor-pointer border" />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <Label className="text-xs whitespace-nowrap">Thickness: {block.thickness}px</Label>
          <Slider min={1} max={10} step={1} value={[block.thickness]} onValueChange={([v]) => onChange({ ...block, thickness: v })} className="flex-1" />
        </div>
        <Input type="number" min={1} max={10} value={block.thickness} onChange={e => onChange({ ...block, thickness: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })} className="h-7 w-16 text-xs" />
      </div>
      <div className="py-2">
        <div style={{ borderTop: `${block.thickness}px solid ${block.color}`, width: "100%" }} />
      </div>
    </div>
  );
}

function ImageBlockEditor({ block, onChange }: { block: EmailImageBlock; onChange: (b: EmailImageBlock) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><ImageIcon className="h-3.5 w-3.5" /> Image</div>
      <MediaUpload value={block.url} onChange={(url) => onChange({ ...block, url })} accept="image/*" placeholder="Image URL or upload..." />
      <Input value={block.alt || ""} onChange={e => onChange({ ...block, alt: e.target.value })} placeholder="Alt text (optional)" className="h-9 text-sm" />
      <div className="flex items-center gap-2">
        <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <Input value={block.linkUrl || ""} onChange={e => onChange({ ...block, linkUrl: e.target.value })} placeholder="Link URL (optional — image becomes clickable)" className="h-9 text-sm flex-1" />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Width: {block.widthPercent || 100}%</span>
        <Slider min={25} max={100} step={5} value={[block.widthPercent || 100]} onValueChange={([v]) => onChange({ ...block, widthPercent: v })} className="flex-1" />
      </div>
    </div>
  );
}

function TableBlockEditor({ block, onChange }: { block: EmailTableBlock; onChange: (b: EmailTableBlock) => void }) {
  const cell = () => ({ id: newId(), html: "" });
  const rows = block.cells.length;
  const cols = block.cells[0]?.length || 0;

  const updateCell = (r: number, c: number, html: string) => {
    const next = block.cells.map((row, ri) => row.map((cc, ci) => (ri === r && ci === c) ? { ...cc, html } : cc));
    onChange({ ...block, cells: next });
  };
  const addRow = () => onChange({ ...block, cells: [...block.cells, Array.from({ length: cols }, cell)] });
  const removeRow = () => { if (rows > 1) onChange({ ...block, cells: block.cells.slice(0, -1) }); };
  const addCol = () => onChange({ ...block, cells: block.cells.map(r => [...r, cell()]) });
  const removeCol = () => { if (cols > 1) onChange({ ...block, cells: block.cells.map(r => r.slice(0, -1)) }); };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Table2 className="h-3.5 w-3.5" /> Table</div>
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={block.headerRow} onChange={e => onChange({ ...block, headerRow: e.target.checked })} />
          Header row
        </label>
        <div className="flex items-center gap-1">
          <Label className="text-xs">Border:</Label>
          <input type="color" value={block.borderColor} onChange={e => onChange({ ...block, borderColor: e.target.value })} className="h-7 w-9 rounded cursor-pointer border" />
          <Input type="number" min={0} max={5} value={block.borderWidth} onChange={e => onChange({ ...block, borderWidth: Number(e.target.value) })} className="h-7 w-16 text-xs" />
        </div>
        {block.headerRow && (
          <div className="flex items-center gap-1">
            <Label className="text-xs">Header BG:</Label>
            <input type="color" value={block.headerBgColor || "#f3f4f6"} onChange={e => onChange({ ...block, headerBgColor: e.target.value })} className="h-7 w-9 rounded cursor-pointer border" />
          </div>
        )}
        <div className="flex gap-1 ml-auto">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addRow}>+ Row</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={removeRow} disabled={rows <= 1}>− Row</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addCol}>+ Col</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={removeCol} disabled={cols <= 1}>− Col</Button>
        </div>
      </div>
      <table className="w-full border-collapse" style={{ border: `${block.borderWidth}px solid ${block.borderColor}` }}>
        <tbody>
          {block.cells.map((row, ri) => (
            <tr key={ri}>
              {row.map((cc, ci) => (
                <td key={cc.id} style={{ border: `${block.borderWidth}px solid ${block.borderColor}`, padding: 4, background: block.headerRow && ri === 0 ? (block.headerBgColor || "#f3f4f6") : undefined }}>
                  <Input value={cc.html} onChange={e => updateCell(ri, ci, e.target.value)} className="h-8 text-xs border-0 bg-transparent" placeholder="Cell" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SplitPanel({ side, inner, onChange }: { side: "left" | "right"; inner: EmailSplitInnerBlock | null; onChange: (v: EmailSplitInnerBlock | null) => void }) {
  if (!inner) {
    return (
      <div className="border-2 border-dashed border-border rounded-md p-4 text-center space-y-2">
        <p className="text-xs text-muted-foreground">{side === "left" ? "Left" : "Right"} panel</p>
        <div className="flex gap-2 justify-center">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onChange(makeInner("text"))}><Type className="h-3 w-3" /> Text</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onChange(makeInner("image"))}><ImageIcon className="h-3 w-3" /> Image</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-md p-3 space-y-2 relative">
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 absolute top-1 right-1" onClick={() => onChange(null)}>
        <X className="h-3 w-3" />
      </Button>
      {inner.type === "text" ? (
        <RichTextEditor value={inner.html} onChange={(html) => onChange({ ...inner, html })} placeholder={`${side} text...`} />
      ) : (
        <ImageBlockEditor block={inner} onChange={(b) => onChange(b)} />
      )}
    </div>
  );
}

function SplitScreenBlockEditor({ block, onChange }: { block: EmailSplitScreenBlock; onChange: (b: EmailSplitScreenBlock) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Columns className="h-3.5 w-3.5" /> Split Screen (50 / 50)</div>
      <div className="grid grid-cols-2 gap-3">
        <SplitPanel side="left" inner={block.left} onChange={(v) => onChange({ ...block, left: v })} />
        <SplitPanel side="right" inner={block.right} onChange={(v) => onChange({ ...block, right: v })} />
      </div>
    </div>
  );
}
