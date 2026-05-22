import { Type } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const FONT_SIZES = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Medium", value: "4" },
  { label: "Large", value: "5" },
  { label: "X-Large", value: "6" },
  { label: "XX-Large", value: "7" },
];

interface FontSizeControlProps {
  onApplySize: (size: string) => void;
  currentSize?: string;
  triggerClassName?: string;
}

export function FontSizeControl({ onApplySize, currentSize, triggerClassName }: FontSizeControlProps) {
  const activeSize = FONT_SIZES.find((s) => s.value === currentSize);
  const isNonDefault = currentSize && currentSize !== "" && currentSize !== "3";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={triggerClassName || `h-7 min-w-7 px-1 flex items-center justify-center gap-0.5 rounded hover:bg-accent text-xs ${isNonDefault ? "bg-accent text-accent-foreground" : ""}`}
          title="Font Size"
        >
          <Type className="h-3.5 w-3.5 shrink-0" />
          {activeSize && isNonDefault && <span className="leading-none">{activeSize.label}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 space-y-1" onOpenAutoFocus={(e) => e.preventDefault()}>
        {FONT_SIZES.map((s) => (
          <button
            key={s.value}
            onMouseDown={(e) => { e.preventDefault(); onApplySize(s.value); }}
            className={`block w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
              currentSize === s.value ? "bg-accent text-accent-foreground" : "hover:bg-accent"
            }`}
          >
            {s.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
