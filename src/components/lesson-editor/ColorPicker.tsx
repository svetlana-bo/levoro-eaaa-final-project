import { useState } from "react";
import { Palette, Star, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useFavoriteColors } from "@/hooks/useFavoriteColors";
import { useRole } from "@/hooks/useRole";

interface ColorPickerProps {
  onApplyColor: (hex: string) => void;
  triggerClassName?: string;
  iconSize?: string;
}

export function ColorPicker({ onApplyColor, triggerClassName, iconSize }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState("#000000");
  const [needsSelection, setNeedsSelection] = useState(false);
  const { colors, rawColors, addColor, removeColor } = useFavoriteColors();
  const { role } = useRole();
  const isAdmin = role === "admin";

  const applyHex = () => {
    const hex = hexInput.trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(hex)) {
      onApplyColor(hex);
    }
  };

  const handleSaveToFavorites = () => {
    const hex = hexInput.trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(hex)) {
      addColor.mutate({ hex_value: hex, name: hex });
    }
  };

  const iconCls = iconSize || "h-3.5 w-3.5";

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) {
          const sel = window.getSelection();
          setNeedsSelection(!sel || sel.isCollapsed || sel.toString().length === 0);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={triggerClassName || "h-7 w-7 flex items-center justify-center rounded hover:bg-accent"}
          title="Text Color"
        >
          <Palette className={iconCls} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 space-y-3" onOpenAutoFocus={(e) => e.preventDefault()}>
        {needsSelection && (
          <p className="text-xs text-muted-foreground max-w-[220px]">
            Select text first, then pick a color.
          </p>
        )}
        <div className="flex gap-1.5 flex-wrap max-w-[220px]">
          {colors.map((c) => (
            <div key={c.id} className="relative group/color">
              <button
                onMouseDown={(e) => { e.preventDefault(); onApplyColor(c.hex_value); }}
                className="w-6 h-6 rounded-full border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: c.hex_value }}
                title={c.name || c.hex_value}
              />
              {isAdmin && !c.id.startsWith("default-") && (
                <button
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); removeColor.mutate(c.id); }}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover/color:opacity-100 transition-opacity"
                  title="Remove from favorites"
                >
                  <X className="h-2 w-2" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            placeholder="#ff0000"
            className="h-7 text-xs w-24 font-mono"
          />
          <div
            className="w-6 h-6 rounded border border-border shrink-0"
            style={{ backgroundColor: /^#[0-9a-fA-F]{3,8}$/.test(hexInput) ? hexInput : "#fff" }}
          />
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); applyHex(); }}
            className="text-xs px-2 h-7 rounded bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Apply
          </button>
          {isAdmin && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSaveToFavorites(); }}
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent"
              title="Save to favorites"
            >
              <Star className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
