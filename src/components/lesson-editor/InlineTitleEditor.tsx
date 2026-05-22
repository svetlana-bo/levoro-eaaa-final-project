import { useRef, useEffect, useCallback, useState } from "react";
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { ColorPicker } from "./ColorPicker";
import { FontSizeControl } from "./FontSizeControl";
import { cn } from "@/lib/utils";

interface InlineTitleEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function InlineTitleEditor({ value, onChange, placeholder, className }: InlineTitleEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [formatState, setFormatState] = useState({ bold: false, italic: false, justifyLeft: false, justifyCenter: false, justifyRight: false });

  const updateFormatState = useCallback(() => {
    setFormatState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      justifyLeft: document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight: document.queryCommandState("justifyRight"),
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

  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return;

    const nextValue = value || "";
    if (ref.current.innerHTML !== nextValue) {
      ref.current.innerHTML = nextValue;
    }
  }, [value]);

  const emitChange = useCallback(() => {
    if (ref.current) {
      const html = ref.current.innerHTML;
      if (html === "<br>" || html === "<div><br></div>") onChange("");
      else onChange(html);
    }
  }, [onChange]);

  const exec = (cmd: string, val?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
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
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("bold"); }}
          className={cn("h-6 w-6 flex items-center justify-center rounded hover:bg-accent", formatState.bold && "bg-accent text-accent-foreground")} title="Bold">
          <Bold className="h-3 w-3" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("italic"); }}
          className={cn("h-6 w-6 flex items-center justify-center rounded hover:bg-accent", formatState.italic && "bg-accent text-accent-foreground")} title="Italic">
          <Italic className="h-3 w-3" />
        </button>
        <FontSizeControl
          onApplySize={(size) => exec("fontSize", size)}
          triggerClassName="h-6 w-6 flex items-center justify-center rounded hover:bg-accent"
        />
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
        className={`px-3 py-2 outline-none text-sm leading-normal [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground ${className || ""}`}
        data-placeholder={placeholder || "Enter title..."}
        onInput={emitChange}
        onBlur={emitChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
    </div>
  );
}