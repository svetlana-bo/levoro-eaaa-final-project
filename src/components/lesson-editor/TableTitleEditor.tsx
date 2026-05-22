import { useRef, useEffect, useCallback, useState } from "react";
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, ChevronDown } from "lucide-react";
import { ColorPicker } from "./ColorPicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TableTitleEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const TEXT_STYLE_OPTIONS = [
  { label: "Normal", value: "p", className: "text-base" },
  { label: "Heading 6", value: "h6", className: "text-sm font-bold uppercase tracking-wider" },
  { label: "Heading 5", value: "h5", className: "text-base font-bold" },
  { label: "Heading 4", value: "h4", className: "text-[1.05rem] font-semibold" },
  { label: "Heading 3", value: "h3", className: "text-[1.17rem] font-semibold" },
  { label: "Heading 2", value: "h2", className: "text-[1.5rem] font-bold" },
  { label: "Heading 1", value: "h1", className: "text-[2rem] font-bold" },
];

const DEFAULT_FORMAT = "h3";

function TextStyleControl({ currentFormat, onApplyFormat }: { currentFormat: string; onApplyFormat: (tag: string) => void }) {
  const active = TEXT_STYLE_OPTIONS.find((o) => o.value === currentFormat) || TEXT_STYLE_OPTIONS.find((o) => o.value === DEFAULT_FORMAT)!;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-7 min-w-[5.5rem] px-2 flex items-center justify-between gap-1 rounded hover:bg-accent text-xs"
          title="Text Style"
        >
          <span className="leading-none truncate">{active.label}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 space-y-1" onOpenAutoFocus={(e) => e.preventDefault()}>
        {TEXT_STYLE_OPTIONS.map((o) => (
          <button
            key={o.value}
            onMouseDown={(e) => { e.preventDefault(); onApplyFormat(o.value); }}
            className={cn(
              "block w-full text-left px-3 py-1.5 rounded transition-colors",
              o.className,
              currentFormat === o.value ? "bg-accent text-accent-foreground" : "hover:bg-accent"
            )}
          >
            {o.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function TableTitleEditor({ value, onChange, placeholder, className }: TableTitleEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [formatState, setFormatState] = useState({
    bold: false, italic: false,
    justifyLeft: false, justifyCenter: false, justifyRight: false,
    blockFormat: DEFAULT_FORMAT,
  });

  const updateFormatState = useCallback(() => {
    const blockFormat = (document.queryCommandValue("formatBlock") || "").toLowerCase().replace(/[<>]/g, "");
    setFormatState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      justifyLeft: document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight: document.queryCommandState("justifyRight"),
      blockFormat: blockFormat || DEFAULT_FORMAT,
    });
  }, []);

  useEffect(() => {
    const onSelChange = () => {
      if (ref.current?.contains(document.activeElement) || document.activeElement === ref.current) {
        updateFormatState();
      }
    };
    document.addEventListener("selectionchange", onSelChange);
    return () => document.removeEventListener("selectionchange", onSelChange);
  }, [updateFormatState]);

  const ensureDefaultWrapper = useCallback((html: string) => {
    if (!html || !html.trim()) return `<${DEFAULT_FORMAT}><br></${DEFAULT_FORMAT}>`;
    if (/^\s*<(h[1-6]|p|div)\b/i.test(html)) return html;
    return `<${DEFAULT_FORMAT}>${html}</${DEFAULT_FORMAT}>`;
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return;
    const nextValue = ensureDefaultWrapper(value || "");
    if (ref.current.innerHTML !== nextValue) {
      ref.current.innerHTML = nextValue;
    }
  }, [value, ensureDefaultWrapper]);

  const emitChange = useCallback(() => {
    if (ref.current) {
      const html = ref.current.innerHTML;
      const cleaned = html === "<br>" || html === "<div><br></div>" ? "" : html;
      onChange(cleaned);
    }
  }, [onChange]);

  const handleFocus = useCallback(() => {
    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch { /* noop */ }
    try { document.execCommand("styleWithCSS", false, "true"); } catch { /* noop */ }
    if (ref.current && (!ref.current.innerHTML || ref.current.innerHTML === "<br>")) {
      ref.current.innerHTML = `<${DEFAULT_FORMAT}><br></${DEFAULT_FORMAT}>`;
      const range = document.createRange();
      const sel = window.getSelection();
      const node = ref.current.firstElementChild;
      if (node && sel) {
        range.setStart(node, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    updateFormatState();
  }, [updateFormatState]);

  const exec = (cmd: string, val?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    emitChange();
    updateFormatState();
  };

  const applyFormat = (tag: string) => {
    ref.current?.focus();
    document.execCommand("formatBlock", false, `<${tag}>`);
    emitChange();
    updateFormatState();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") e.preventDefault();
  };

  return (
    <div className="border border-input rounded-md overflow-hidden bg-background">
      <div className="flex items-center gap-0.5 p-1 border-b bg-muted/30">
        <TextStyleControl currentFormat={formatState.blockFormat} onApplyFormat={applyFormat} />
        <div className="w-px h-4 bg-border mx-1" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("bold"); }}
          className={cn("h-6 w-6 flex items-center justify-center rounded hover:bg-accent", formatState.bold && "bg-accent text-accent-foreground")} title="Bold">
          <Bold className="h-3 w-3" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("italic"); }}
          className={cn("h-6 w-6 flex items-center justify-center rounded hover:bg-accent", formatState.italic && "bg-accent text-accent-foreground")} title="Italic">
          <Italic className="h-3 w-3" />
        </button>
        <ColorPicker
          onApplyColor={(hex) => exec("foreColor", hex)}
          triggerClassName="h-6 w-6 flex items-center justify-center rounded hover:bg-accent"
          iconSize="h-3 w-3"
        />
        <div className="w-px h-4 bg-border mx-1" />
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("justifyLeft"); }}
          className={cn("h-6 w-6 flex items-center justify-center rounded hover:bg-accent", formatState.justifyLeft && "bg-accent text-accent-foreground")} title="Align Left">
          <AlignLeft className="h-3 w-3" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("justifyCenter"); }}
          className={cn("h-6 w-6 flex items-center justify-center rounded hover:bg-accent", formatState.justifyCenter && "bg-accent text-accent-foreground")} title="Align Center">
          <AlignCenter className="h-3 w-3" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("justifyRight"); }}
          className={cn("h-6 w-6 flex items-center justify-center rounded hover:bg-accent", formatState.justifyRight && "bg-accent text-accent-foreground")} title="Align Right">
          <AlignRight className="h-3 w-3" />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        className={`px-3 py-2 outline-none text-base leading-normal [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground [&_h1]:text-[2rem] [&_h1]:font-bold [&_h2]:text-[1.5rem] [&_h2]:font-bold [&_h3]:text-[1.17rem] [&_h3]:font-semibold [&_h4]:text-[1.05rem] [&_h4]:font-semibold [&_h5]:text-base [&_h5]:font-bold [&_h6]:text-sm [&_h6]:font-bold [&_h6]:uppercase [&_h6]:tracking-wider ${className || ""}`}
        data-placeholder={placeholder || "Enter title..."}
        onFocus={handleFocus}
        onInput={emitChange}
        onBlur={emitChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
    </div>
  );
}
