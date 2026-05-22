import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Trash2, Plus, MessageSquareWarning } from "lucide-react";
import { FeedbackRange } from "./types";

interface FeedbackConfigEditorProps {
  feedbackRanges?: FeedbackRange[];
  passingPercentage?: number;
  onChange: (ranges: FeedbackRange[], passingPct: number) => void;
}

export function FeedbackConfigEditor({ feedbackRanges, passingPercentage, onChange }: FeedbackConfigEditorProps) {
  const ranges = feedbackRanges || [];
  const passPct = passingPercentage ?? 0;

  const addRange = () => {
    const lastMax = ranges.length > 0 ? ranges[ranges.length - 1].max : 0;
    onChange([...ranges, { id: crypto.randomUUID(), min: lastMax, max: 100, message: "" }], passPct);
  };

  const updateRange = (id: string, field: Partial<FeedbackRange>) => {
    onChange(ranges.map(r => r.id === id ? { ...r, ...field } : r), passPct);
  };

  const removeRange = (id: string) => {
    onChange(ranges.filter(r => r.id !== id), passPct);
  };

  return (
    <div className="pt-3 border-t border-border/30 space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <MessageSquareWarning className="h-3.5 w-3.5" /> Feedback & Passing
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Passing threshold: {passPct}%</Label>
        <Slider
          value={[passPct]}
          onValueChange={([v]) => onChange(ranges, v)}
          min={0} max={100} step={5}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Score-based feedback messages</Label>
        {ranges.map((r) => (
          <div key={r.id} className="flex items-start gap-2 p-2 rounded-lg border border-border/50 bg-background">
            <div className="flex items-center gap-1 shrink-0 pt-1">
              <Input type="number" min={0} max={100} value={r.min} onChange={(e) => updateRange(r.id, { min: Number(e.target.value) })} className="w-16 h-7 text-xs" />
              <span className="text-xs text-muted-foreground">–</span>
              <Input type="number" min={0} max={100} value={r.max} onChange={(e) => updateRange(r.id, { max: Number(e.target.value) })} className="w-16 h-7 text-xs" />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <Input className="flex-1 h-7 text-xs" placeholder="Feedback message..." value={r.message} onChange={(e) => updateRange(r.id, { message: e.target.value })} />
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => removeRange(r.id)}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addRange} className="gap-1 text-xs">
          <Plus className="h-3 w-3" /> Add Feedback Range
        </Button>
      </div>
    </div>
  );
}
