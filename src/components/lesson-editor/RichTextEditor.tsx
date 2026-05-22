import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { Bold, Italic, Underline, ImageIcon, Loader2, AlignCenter, AlignRight, AlignLeft, AlignJustify, List, ListOrdered, Link as LinkIcon, Indent, Outdent, Minus, MousePointerClick, LayoutGrid, Crop, ChevronDown, ChevronsUpDown, ChevronsDownUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ColorPicker } from "./ColorPicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InlineImageCropper } from "./InlineImageCropper";

const TEXT_STYLE_OPTIONS = [
  { label: "Normal", value: "p", className: "text-base" },
  { label: "Heading 6", value: "h6", className: "text-sm font-bold uppercase tracking-wider" },
  { label: "Heading 5", value: "h5", className: "text-base font-bold" },
  { label: "Heading 4", value: "h4", className: "text-[1.05rem] font-semibold" },
  { label: "Heading 3", value: "h3", className: "text-[1.17rem] font-semibold" },
  { label: "Heading 2", value: "h2", className: "text-[1.5rem] font-bold" },
  { label: "Heading 1", value: "h1", className: "text-[2rem] font-bold" },
];

function TextStyleControl({ currentFormat, onApplyFormat }: { currentFormat: string; onApplyFormat: (tag: string) => void }) {
  const active = TEXT_STYLE_OPTIONS.find((o) => o.value === currentFormat) || TEXT_STYLE_OPTIONS[0];
  const isNonDefault = active.value !== "p";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-7 min-w-[5.5rem] px-2 flex items-center justify-between gap-1 rounded hover:bg-accent text-xs",
            isNonDefault && "bg-accent text-accent-foreground"
          )}
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

/** Handle for imperative editor actions */
export interface RichTextEditorHandle {
  insertText: (text: string) => void;
}

const RichTextEditorInner = forwardRef<RichTextEditorHandle, { value: string; onChange: (html: string) => void; placeholder?: string }>(function RichTextEditorInner({ value, onChange, placeholder }, forwardedRef) {
  const ref = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  // Button popover state
  const [btnPopoverOpen, setBtnPopoverOpen] = useState(false);
  const [btnLabel, setBtnLabel] = useState("Click Here");
  const [btnUrl, setBtnUrl] = useState("");
  const [btnBgColor, setBtnBgColor] = useState("#c9a84c");
  const [btnTextColor, setBtnTextColor] = useState("#ffffff");
  const savedSelectionRef = useRef<Range | null>(null);

  // Content box popover state
  const [boxPopoverOpen, setBoxPopoverOpen] = useState(false);

  // Selected image ref — accessible to toolbar buttons
  const selectedImgRef = useRef<HTMLImageElement | null>(null);

  // Resize overlay state
  const [resizeOverlay, setResizeOverlay] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  // Inline image cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState("");

  // Expanded editor height toggle
  const [expanded, setExpanded] = useState(false);

  // Track active formatting state
  const [formatState, setFormatState] = useState({
    bold: false, italic: false, underline: false,
    justifyLeft: false, justifyCenter: false, justifyRight: false, justifyFull: false,
    insertUnorderedList: false, insertOrderedList: false,
    blockFormat: "" as string,
  });

  const updateFormatState = useCallback(() => {
    const blockFormat = document.queryCommandValue("formatBlock") || "";
    setFormatState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      justifyLeft: document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight: document.queryCommandState("justifyRight"),
      justifyFull: document.queryCommandState("justifyFull"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
      blockFormat: blockFormat.toLowerCase().replace(/[<>]/g, ""),
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
    document.execCommand("defaultParagraphSeparator", false, "p");
    // Use CSS spans (<span style="color">) instead of legacy <font color> for color commands.
    try { document.execCommand("styleWithCSS", false, "true"); } catch { /* noop */ }
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return;

    const nextValue = value || "<p><br></p>";
    if (ref.current.innerHTML !== nextValue) {
      ref.current.innerHTML = nextValue;
    }
  }, [value]);

  const normalizeFontColors = useCallback((root: HTMLElement) => {
    // Fold inline color wrappers (<font color>, <span style="color">) onto block ancestors/children
    // so color survives re-formatting and never produces invalid <span><h2>…</h2></span> structures.
    const BLOCK_TAGS = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "DIV", "BLOCKQUOTE"]);

    const containsBlock = (el: Element) => !!el.querySelector("p,h1,h2,h3,h4,h5,h6,li,div,blockquote,ul,ol");

    const unwrap = (el: Element) => {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    };

    // 1) Convert <font color="..."> to <span style="color:..."> uniformly.
    Array.from(root.querySelectorAll("font[color]")).forEach((font) => {
      const color = font.getAttribute("color");
      if (!color) return;
      const span = document.createElement("span");
      span.style.color = color;
      while (font.firstChild) span.appendChild(font.firstChild);
      font.replaceWith(span);
    });

    // 2) Walk colored spans/wrappers; if they wrap or contain block elements, push the color
    //    onto every direct block descendant and unwrap the styled wrapper.
    const walk = () => {
      const wrappers = Array.from(
        root.querySelectorAll<HTMLElement>('span[style*="color"], strong[style*="color"], em[style*="color"], a[style*="color"]')
      );
      let changed = false;
      wrappers.forEach((w) => {
        const color = w.style.color;
        if (!color) return;
        // If wrapper contains any block element, push color onto each block descendant and unwrap.
        if (containsBlock(w)) {
          w.querySelectorAll<HTMLElement>("p,h1,h2,h3,h4,h5,h6,li,div,blockquote").forEach((b) => {
            if (!b.style.color) b.style.color = color;
          });
          // Also handle direct text-only siblings: wrap them so they keep color after unwrap.
          Array.from(w.childNodes).forEach((n) => {
            if (n.nodeType === Node.TEXT_NODE && n.textContent && n.textContent.trim()) {
              const s = document.createElement("span");
              s.style.color = color;
              w.insertBefore(s, n);
              s.appendChild(n);
            }
          });
          unwrap(w);
          changed = true;
          return;
        }
        // If wrapper sits directly inside a block and is the block's only meaningful child → push to block.
        const parent = w.parentElement;
        if (
          parent &&
          BLOCK_TAGS.has(parent.tagName) &&
          parent.childNodes.length === 1 &&
          !(parent as HTMLElement).style.color
        ) {
          (parent as HTMLElement).style.color = color;
          unwrap(w);
          changed = true;
        }
      });
      return changed;
    };
    // Iterate until stable (handles nested wrappers).
    for (let i = 0; i < 4 && walk(); i++) { /* noop */ }
  }, []);

  const emitChange = useCallback(() => {
    if (ref.current) {
      // Strip editor-only artifacts before saving
      ref.current.querySelectorAll(".rte-resize-handle").forEach(h => h.remove());
      ref.current.querySelectorAll("img").forEach((img) => {
        img.style.outline = "";
        img.style.outlineOffset = "";
        img.style.cursor = "";
      });
      normalizeFontColors(ref.current);
      const html = ref.current.innerHTML;
      if (html === "<br>" || html === "<div><br></div>") onChange("");
      else onChange(html);
    }
  }, [onChange, normalizeFontColors]);

  useImperativeHandle(forwardedRef, () => ({
    insertText: (text: string) => {
      const editor = ref.current;
      if (!editor) return;
      editor.focus();
      document.execCommand('insertHTML', false, text);
      emitChange();
    },
  }));

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
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        document.execCommand("insertLineBreak");
        emitChange();
        return;
      }
      const range = sel.getRangeAt(0);
      range.deleteContents();

      const editor = ref.current;
      const BLOCK = new Set(["P", "DIV", "LI", "BLOCKQUOTE", "H1", "H2", "H3", "H4", "H5", "H6", "TD", "TH"]);

      // Find nearest block-level ancestor inside the editor
      let node: Node | null = range.startContainer;
      let blockAncestor: HTMLElement | null = null;
      while (node && node !== editor) {
        if (node.nodeType === Node.ELEMENT_NODE && BLOCK.has((node as HTMLElement).tagName)) {
          blockAncestor = node as HTMLElement;
          break;
        }
        node = node.parentNode;
      }

      const br = document.createElement("br");
      range.insertNode(br);

      // Place caret OUTSIDE all inline wrappers (as a direct child of the block
      // ancestor) so new text inherits only from the block — not from leftover
      // <span style="font-size/color/font-family"> wrappers around the previous line.
      const placeholder = document.createTextNode("\u200B");
      if (blockAncestor && br.parentNode && br.parentNode !== blockAncestor) {
        // Walk up until we're a direct child of the block.
        let topInline: Node = br;
        while (topInline.parentNode && topInline.parentNode !== blockAncestor) {
          topInline = topInline.parentNode;
        }
        if (topInline.nextSibling) {
          blockAncestor.insertBefore(placeholder, topInline.nextSibling);
        } else {
          blockAncestor.appendChild(placeholder);
        }
      } else {
        // Already at block level (or no block ancestor) — place right after the br.
        if (br.nextSibling) br.parentNode!.insertBefore(placeholder, br.nextSibling);
        else br.parentNode!.appendChild(placeholder);
      }

      const newRange = document.createRange();
      try {
        newRange.setStart(placeholder, 1);
      } catch {
        newRange.setStartAfter(br);
      }
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      emitChange();
    }
  };

  const handleLink = () => {
    const sel = window.getSelection();
    const selectedText = sel?.toString()?.trim() || "";

    const normalizeLinkUrl = (input: string) => {
      let finalUrl = input.trim();

      while (/^https?:\/\/https?:\/\//i.test(finalUrl)) {
        finalUrl = finalUrl.replace(/^https?:\/\/(?=https?:\/\/)/i, "");
      }

      finalUrl = finalUrl.replace(/^https\/\//i, "https://");
      finalUrl = finalUrl.replace(/^http\/\//i, "http://");

      if (!/^(https?:\/\/|mailto:|tel:)/i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }

      return finalUrl;
    };

    const suggestedUrl = /^(https?:\/\/|https\/\/|www\.)/i.test(selectedText) ? selectedText : "";
    const url = window.prompt("Enter URL:", suggestedUrl);
    if (!url?.trim()) return;

    const finalUrl = normalizeLinkUrl(url);

    if (selectedText) {
      exec("createLink", finalUrl);
    } else {
      const linkText = window.prompt("Enter link text:", finalUrl);
      if (!linkText) return;
      ref.current?.focus();
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${finalUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`
      );
      emitChange();
    }
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedSelectionRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  const handleInsertButton = () => {
    if (!btnLabel.trim() || !btnUrl.trim()) {
      toast.error("Button label and URL are required");
      return;
    }
    let finalUrl = btnUrl.trim();
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(finalUrl)) finalUrl = `https://${finalUrl}`;

    const buttonHtml = `<div style="text-align:center;padding:8px 0;"><a data-email-button="true" href="${finalUrl}" style="display:inline-block;padding:12px 28px;background:${btnBgColor};color:${btnTextColor};text-decoration:none;border-radius:6px;font-weight:600;font-family:Arial,Helvetica,sans-serif;" target="_blank">${btnLabel}</a></div>`;

    ref.current?.focus();
    restoreSelection();
    document.execCommand("insertHTML", false, buttonHtml);
    emitChange();
    setBtnPopoverOpen(false);
    setBtnLabel("Click Here");
    setBtnUrl("");
    setBtnBgColor("#c9a84c");
    setBtnTextColor("#ffffff");
  };

  const contentBoxTemplates = [
    {
      label: "Two-Column (Do's & Don'ts)",
      html: `<div style="display:flex;gap:16px;margin:16px 0"><div style="flex:1;background:hsl(var(--muted));border-radius:12px;padding:24px;color:hsl(var(--foreground))"><h4 style="font-weight:700;margin-bottom:12px">✅ Do's</h4><ul style="list-style:disc;padding-left:20px;margin:0"><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul></div><div style="flex:1;background:hsl(var(--muted));border-radius:12px;padding:24px;color:hsl(var(--foreground))"><h4 style="font-weight:700;margin-bottom:12px">❌ Don'ts</h4><ul style="list-style:disc;padding-left:20px;margin:0"><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul></div></div>`,
    },
    {
      label: "Single Info Box",
      html: `<div style="background:hsl(var(--muted));border-radius:12px;padding:24px;margin:16px 0;border-left:4px solid hsl(var(--primary));color:hsl(var(--foreground))"><h4 style="font-weight:700;margin-bottom:8px">ℹ️ Info</h4><p style="margin:0">Your content here.</p></div>`,
    },
    {
      label: "Highlight Box",
      html: `<div style="background:hsl(var(--secondary) / 0.15);border-radius:12px;padding:24px;margin:16px 0;border:1px solid hsl(var(--secondary));color:hsl(var(--foreground))"><h4 style="font-weight:700;margin-bottom:8px">⚡ Important</h4><p style="margin:0">Key takeaway or highlight goes here.</p></div>`,
    },
    {
      label: "Success Box",
      html: `<div style="background:hsl(var(--muted));border-radius:12px;padding:24px;margin:16px 0;border-left:4px solid hsl(var(--secondary));color:hsl(var(--foreground))"><h4 style="font-weight:700;margin-bottom:8px">✅ Best Practice</h4><p style="margin:0">Describe the recommended approach here.</p></div>`,
    },
  ];

  const insertContentBox = (html: string) => {
    ref.current?.focus();
    restoreSelection();
    document.execCommand("insertHTML", false, html);
    emitChange();
    setBoxPopoverOpen(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("course-media").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("course-media").getPublicUrl(path);
      ref.current?.focus();
      document.execCommand("insertHTML", false, `<img src="${publicUrl}" alt="uploaded" style="max-width:100%;border-radius:8px;margin:16px;display:inline-block;vertical-align:top;" class="inline-editor-img" />`);
      emitChange();
      toast.success("Image inserted!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // Compute overlay position for selected image
  const updateOverlayPosition = useCallback(() => {
    const img = selectedImgRef.current;
    const wrapper = wrapperRef.current;
    if (!img || !wrapper || !ref.current?.contains(img)) {
      setResizeOverlay(null);
      return;
    }
    const imgRect = img.getBoundingClientRect();
    const containerEl = ref.current?.parentElement;
    if (!containerEl) { setResizeOverlay(null); return; }
    const containerRect = containerEl.getBoundingClientRect();
    setResizeOverlay({
      left: imgRect.left - containerRect.left,
      top: imgRect.top - containerRect.top,
      width: imgRect.width,
      height: imgRect.height,
    });
  }, []);

  const deselectImage = useCallback(() => {
    const img = selectedImgRef.current;
    if (img) {
      img.style.outline = "";
      img.style.outlineOffset = "";
      img.style.cursor = "";
    }
    selectedImgRef.current = null;
    setResizeOverlay(null);
  }, []);

  const selectImage = useCallback((img: HTMLImageElement) => {
    if (selectedImgRef.current === img) return;
    deselectImage();
    selectedImgRef.current = img;
    img.style.outline = "2px solid hsl(var(--primary))";
    img.style.outlineOffset = "2px";
    updateOverlayPosition();
  }, [deselectImage, updateOverlayPosition]);

  // Image resize + drag-to-move
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let mode: "resize" | "drag" | null = null;
    let activeImg: HTMLImageElement | null = null;
    let startX = 0, startWidth = 0, savedWidth = "";
    let dragPlaceholder: HTMLElement | null = null;

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" && el.contains(target)) {
        e.preventDefault();
        selectImage(target as HTMLImageElement);
      } else {
        deselectImage();
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "IMG" || !el.contains(target)) return;
      const img = target as HTMLImageElement;
      const rect = img.getBoundingClientRect();

      // Bottom-right corner = resize
      if (e.clientX > rect.right - 18 && e.clientY > rect.bottom - 18) {
        mode = "resize";
        activeImg = img;
        startX = e.clientX;
        startWidth = rect.width;
        selectImage(img);
        e.preventDefault();
      } else {
        // Drag mode
        mode = "drag";
        activeImg = img;
        savedWidth = img.style.width || `${rect.width}px`;
        selectImage(img);
        dragPlaceholder = document.createElement("span");
        dragPlaceholder.style.cssText = `width:${rect.width}px;height:${rect.height}px;border:2px dashed hsl(var(--border));border-radius:8px;display:inline-block;vertical-align:top;`;
        img.parentNode?.insertBefore(dragPlaceholder, img);
        img.style.opacity = "0.5";
        img.style.position = "fixed";
        img.style.zIndex = "9999";
        img.style.pointerEvents = "none";
        img.style.width = `${rect.width}px`;
        img.style.left = `${rect.left}px`;
        img.style.top = `${rect.top}px`;
        e.preventDefault();
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!activeImg || !mode) {
        // Cursor hint
        const target = e.target as HTMLElement;
        if (target.tagName === "IMG" && el.contains(target)) {
          const rect = target.getBoundingClientRect();
          if (e.clientX > rect.right - 18 && e.clientY > rect.bottom - 18) {
            target.style.cursor = "nwse-resize";
          } else {
            target.style.cursor = "grab";
          }
        }
        return;
      }
      e.preventDefault();
      if (mode === "resize") {
        const newWidth = startWidth + (e.clientX - startX);
        activeImg.style.width = `${Math.max(50, newWidth)}px`;
        activeImg.style.height = "auto";
        updateOverlayPosition();
      } else if (mode === "drag") {
        activeImg.style.left = `${e.clientX - 40}px`;
        activeImg.style.top = `${e.clientY - 20}px`;

        // Move placeholder to nearest drop position — avoid splitting text nodes
        const range = document.caretRangeFromPoint?.(e.clientX, e.clientY);
        if (range && el.contains(range.startContainer) && dragPlaceholder) {
          try {
            const container = range.startContainer;
            const offset = range.startOffset;
            if (container.nodeType === Node.ELEMENT_NODE) {
              const parent = container as HTMLElement;
              if (parent !== dragPlaceholder && parent !== activeImg) {
                const refChild = parent.childNodes[offset] || null;
                if (refChild !== dragPlaceholder && refChild !== activeImg) {
                  parent.insertBefore(dragPlaceholder, refChild);
                }
              }
            } else {
              // Text node — insert before/after the text node's parent element boundary
              // instead of splitting text which corrupts DOM with multiple images
              const textParent = container.parentNode;
              if (textParent && textParent !== dragPlaceholder && textParent !== activeImg && el.contains(textParent)) {
                const textNode = container as Text;
                if (offset <= textNode.length / 2) {
                  textParent.parentNode?.insertBefore(dragPlaceholder, textParent);
                } else {
                  textParent.parentNode?.insertBefore(dragPlaceholder, textParent.nextSibling);
                }
              }
            }
          } catch {}
        }
      }
    };

    const onMouseUp = () => {
      if (activeImg && mode) {
        if (mode === "resize") {
          const img = activeImg;
          mode = null;
          activeImg = null;
          selectImage(img);
          updateOverlayPosition();
        } else if (mode === "drag" && dragPlaceholder) {
          activeImg.style.opacity = "";
          activeImg.style.position = "";
          activeImg.style.zIndex = "";
          activeImg.style.pointerEvents = "";
          activeImg.style.left = "";
          activeImg.style.top = "";
          activeImg.style.width = savedWidth;
          dragPlaceholder.parentNode?.insertBefore(activeImg, dragPlaceholder);
          dragPlaceholder.remove();
          dragPlaceholder = null;
          const img = activeImg;
          mode = null;
          activeImg = null;
          selectImage(img);
          updateOverlayPosition();
        }
        emitChange();
      }
    };

    el.addEventListener("click", onClick);
    el.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      el.removeEventListener("click", onClick);
      el.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [emitChange, selectImage, deselectImage, updateOverlayPosition]);

  // Overlay resize handle mousedown handler
  const handleOverlayResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const img = selectedImgRef.current;
    if (!img) return;
    const startX = e.clientX;
    const startWidth = img.getBoundingClientRect().width;

    const onMove = (ev: MouseEvent) => {
      const newWidth = startWidth + (ev.clientX - startX);
      img.style.width = `${Math.max(50, newWidth)}px`;
      img.style.height = "auto";
      updateOverlayPosition();
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      updateOverlayPosition();
      emitChange();
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [emitChange, updateOverlayPosition]);

  // Float image helpers using selectedImgRef
  const handleFloatLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const img = selectedImgRef.current;
    if (!img) return;
    if (img.style.float === "left") {
      img.style.float = "";
      img.style.margin = "16px";
    } else {
      img.style.float = "left";
      img.style.margin = "0 16px 16px 0";
    }
    emitChange();
    updateOverlayPosition();
  }, [emitChange, updateOverlayPosition]);

  const handleFloatRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const img = selectedImgRef.current;
    if (!img) return;
    if (img.style.float === "right") {
      img.style.float = "";
      img.style.margin = "16px";
    } else {
      img.style.float = "right";
      img.style.margin = "0 0 16px 16px";
    }
    emitChange();
    updateOverlayPosition();
  }, [emitChange, updateOverlayPosition]);

  return (
    <div ref={wrapperRef} className="border border-input rounded-md overflow-hidden bg-background relative">
      <div className="flex items-center gap-0.5 p-1.5 border-b bg-muted/30 flex-wrap">
        {/* Format */}
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("bold"); }}
          className={cn("h-7 w-7 flex items-center justify-center rounded hover:bg-accent", formatState.bold && "bg-accent text-accent-foreground")} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("italic"); }}
          className={cn("h-7 w-7 flex items-center justify-center rounded hover:bg-accent", formatState.italic && "bg-accent text-accent-foreground")} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("underline"); }}
          className={cn("h-7 w-7 flex items-center justify-center rounded hover:bg-accent", formatState.underline && "bg-accent text-accent-foreground")} title="Underline">
          <Underline className="h-3.5 w-3.5" />
        </button>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Text style (headings + normal) */}
        <TextStyleControl
          currentFormat={formatState.blockFormat}
          onApplyFormat={(tag) => { exec("formatBlock", tag); }}
        />
        <div className="w-px h-5 bg-border mx-0.5" />


        {/* Alignment */}
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("justifyLeft"); }}
          className={cn("h-7 w-7 flex items-center justify-center rounded hover:bg-accent", formatState.justifyLeft && "bg-accent text-accent-foreground")} title="Align Left">
          <AlignLeft className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("justifyCenter"); }}
          className={cn("h-7 w-7 flex items-center justify-center rounded hover:bg-accent", formatState.justifyCenter && "bg-accent text-accent-foreground")} title="Align Center">
          <AlignCenter className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("justifyRight"); }}
          className={cn("h-7 w-7 flex items-center justify-center rounded hover:bg-accent", formatState.justifyRight && "bg-accent text-accent-foreground")} title="Align Right">
          <AlignRight className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("justifyFull"); }}
          className={cn("h-7 w-7 flex items-center justify-center rounded hover:bg-accent", formatState.justifyFull && "bg-accent text-accent-foreground")} title="Justify">
          <AlignJustify className="h-3.5 w-3.5" />
        </button>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Lists */}
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }}
          className={cn("h-7 w-7 flex items-center justify-center rounded hover:bg-accent", formatState.insertUnorderedList && "bg-accent text-accent-foreground")} title="Bullet List">
          <List className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("insertOrderedList"); }}
          className={cn("h-7 w-7 flex items-center justify-center rounded hover:bg-accent", formatState.insertOrderedList && "bg-accent text-accent-foreground")} title="Numbered List">
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Indent */}
        <button type="button" onMouseDown={(e) => {
          e.preventDefault();
          exec("indent");
          setTimeout(() => {
            if (!ref.current) return;
            const uls = ref.current.querySelectorAll("ul");
            const styles = ["disc", "circle", "square"];
            uls.forEach(ul => {
              let depth = 0;
              let parent = ul.parentElement;
              while (parent && parent !== ref.current) {
                if (parent.tagName === "UL") depth++;
                parent = parent.parentElement;
              }
              ul.style.listStyleType = styles[depth % styles.length];
            });
            emitChange();
          }, 0);
        }}
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent" title="Increase Indent">
          <Indent className="h-3.5 w-3.5" />
        </button>
        <button type="button" onMouseDown={(e) => {
          e.preventDefault();
          exec("outdent");
          setTimeout(() => {
            if (!ref.current) return;
            const uls = ref.current.querySelectorAll("ul");
            const styles = ["disc", "circle", "square"];
            uls.forEach(ul => {
              let depth = 0;
              let parent = ul.parentElement;
              while (parent && parent !== ref.current) {
                if (parent.tagName === "UL") depth++;
                parent = parent.parentElement;
              }
              ul.style.listStyleType = styles[depth % styles.length];
            });
            emitChange();
          }, 0);
        }}
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent" title="Decrease Indent">
          <Outdent className="h-3.5 w-3.5" />
        </button>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Link */}
        <button type="button" onMouseDown={(e) => { e.preventDefault(); handleLink(); }}
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent" title="Insert Link">
          <LinkIcon className="h-3.5 w-3.5" />
        </button>

        {/* Horizontal line */}
        <button type="button" onMouseDown={(e) => { e.preventDefault(); exec("insertHorizontalRule"); }}
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent" title="Horizontal Line">
          <Minus className="h-3.5 w-3.5" />
        </button>

        {/* Insert Action Button */}
        <Popover open={btnPopoverOpen} onOpenChange={(open) => {
          if (open) saveSelection();
          setBtnPopoverOpen(open);
        }}>
          <PopoverTrigger asChild>
            <button type="button"
              className="h-7 px-2 flex items-center justify-center rounded hover:bg-accent gap-1 text-xs" title="Insert Action Button">
              <MousePointerClick className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Button</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-3" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
            <p className="text-xs font-semibold">Insert Action Button</p>
            <div>
              <Label className="text-xs">Label</Label>
              <Input value={btnLabel} onChange={e => setBtnLabel(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">URL</Label>
              <Input value={btnUrl} onChange={e => setBtnUrl(e.target.value)} placeholder="https://..." className="h-8 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Button Color</Label>
                <div className="flex gap-1 items-center">
                  <input type="color" value={btnBgColor} onChange={e => setBtnBgColor(e.target.value)} className="h-7 w-8 rounded border cursor-pointer" />
                  <Input value={btnBgColor} onChange={e => setBtnBgColor(e.target.value)} className="flex-1 h-7 text-xs" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Text Color</Label>
                <div className="flex gap-1 items-center">
                  <input type="color" value={btnTextColor} onChange={e => setBtnTextColor(e.target.value)} className="h-7 w-8 rounded border cursor-pointer" />
                  <Input value={btnTextColor} onChange={e => setBtnTextColor(e.target.value)} className="flex-1 h-7 text-xs" />
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-muted-foreground">Preview:</div>
              <a style={{ display: "inline-block", padding: "6px 16px", background: btnBgColor, color: btnTextColor, borderRadius: 6, fontWeight: 600, fontSize: 12, textDecoration: "none" }}>{btnLabel || "Button"}</a>
            </div>
            <Button size="sm" className="w-full" onClick={handleInsertButton}>Insert Button</Button>
          </PopoverContent>
        </Popover>

        {/* Content Box Templates */}
        <Popover open={boxPopoverOpen} onOpenChange={(open) => {
          if (open) saveSelection();
          setBoxPopoverOpen(open);
        }}>
          <PopoverTrigger asChild>
            <button type="button"
              className="h-7 px-2 flex items-center justify-center rounded hover:bg-accent gap-1 text-xs" title="Insert Content Box">
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Box</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 space-y-1 p-2" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
            <p className="text-xs font-semibold px-2 py-1">Insert Content Box</p>
            {contentBoxTemplates.map((t, i) => (
              <button key={i} type="button" onClick={() => insertContentBox(t.html)}
                className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent transition-colors">
                {t.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Float image — uses selectedImgRef */}
        <button type="button" onMouseDown={handleFloatLeft}
          className={cn("h-7 px-1.5 flex items-center justify-center rounded hover:bg-accent text-[10px]", selectedImgRef.current?.style.float === "left" && "bg-accent")} title="Float image left">
          ◧
        </button>
        <button type="button" onMouseDown={handleFloatRight}
          className={cn("h-7 px-1.5 flex items-center justify-center rounded hover:bg-accent text-[10px]", selectedImgRef.current?.style.float === "right" && "bg-accent")} title="Float image right">
          ◨
        </button>
        <ColorPicker onApplyColor={(hex) => exec("foreColor", hex)} />
        <div className="w-px h-5 bg-border mx-1" />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="h-7 px-2 flex items-center justify-center rounded hover:bg-accent gap-1 text-xs" title="Insert Image">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
          {!uploading && <span className="hidden sm:inline">Image</span>}
        </button>
      </div>
      <div className="relative">
        <div
          ref={ref}
          contentEditable
          className={cn("p-3 min-h-[80px] overflow-y-auto outline-none text-base leading-relaxed overflow-x-hidden [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground [&_img]:max-w-full [&_img]:rounded-lg [&_img]:cursor-ew-resize [&::after]:content-[''] [&::after]:clear-both [&::after]:table [&>div]:mb-2 [&>p]:mb-2 [&_h1]:text-primary [&_h2]:text-primary [&_h3]:text-primary [&_h4]:text-primary [&_h5]:text-primary [&_h6]:text-primary [&_h1]:text-[2rem] [&_h1]:font-bold [&_h1]:mt-[1.5em] [&_h1]:mb-[0.5em] [&_h2]:text-[1.5rem] [&_h2]:font-bold [&_h2]:mt-[1.25em] [&_h2]:mb-[0.4em] [&_h3]:text-[1.17rem] [&_h3]:font-semibold [&_h3]:mt-[1em] [&_h3]:mb-[0.35em] [&_h4]:text-[1.05rem] [&_h4]:font-semibold [&_h4]:mt-[0.75em] [&_h4]:mb-[0.25em] [&_h5]:text-base [&_h5]:font-bold [&_h5]:mt-[0.6em] [&_h5]:mb-[0.2em] [&_h6]:text-sm [&_h6]:font-bold [&_h6]:uppercase [&_h6]:tracking-wider [&_h6]:mt-[0.5em] [&_h6]:mb-[0.2em] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ul_ul]:list-[circle] [&_ul_ul_ul]:list-[square] [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_ol_ol]:list-[lower-alpha] [&_ol_ol_ol]:list-[lower-roman] [&_a]:text-primary [&_a]:underline [&_hr]:my-4 [&_hr]:border-border [&_a[data-email-button]]:no-underline [&_a[data-email-button]]:rounded-md [&_a[data-email-button]]:px-4 [&_a[data-email-button]]:py-2", expanded ? "max-h-[85vh]" : "max-h-[60vh]")}
          data-placeholder={placeholder || "Type here..."}
          onInput={emitChange}
          onBlur={() => { emitChange(); deselectImage(); }}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
        />
        {/* Resize + crop overlay — rendered OUTSIDE contentEditable */}
        {resizeOverlay && (
          <>
            {/* Crop button */}
            <button
              type="button"
              style={{
                position: "absolute",
                left: resizeOverlay.left + resizeOverlay.width / 2 - 14,
                top: resizeOverlay.top - 32,
                pointerEvents: "auto",
                zIndex: 21,
              }}
              className="h-7 w-7 flex items-center justify-center rounded bg-background border border-border shadow-md hover:bg-accent"
              title="Crop image"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const img = selectedImgRef.current;
                if (img) {
                  setCropperSrc(img.src);
                  setCropperOpen(true);
                }
              }}
            >
              <Crop className="h-3.5 w-3.5" />
            </button>
            {/* Resize handle */}
            <div
              style={{
                position: "absolute",
                left: resizeOverlay.left + resizeOverlay.width - 8,
                top: resizeOverlay.top + resizeOverlay.height - 8,
                width: 16,
                height: 16,
                pointerEvents: "auto",
                zIndex: 20,
              }}
              className="bg-primary border-2 border-white rounded-sm shadow-md cursor-nwse-resize"
              onMouseDown={handleOverlayResizeStart}
            />
          </>
        )}
        {/* Expand/collapse height toggle */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setExpanded((v) => !v)}
          title={expanded ? "Collapse editor" : "Expand editor"}
          aria-label={expanded ? "Collapse editor" : "Expand editor"}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10 h-6 w-6 flex items-center justify-center rounded-full bg-background border border-border shadow-sm hover:bg-accent"
        >
          {expanded ? <ChevronsUpDown className="h-3.5 w-3.5" /> : <ChevronsDownUp className="h-3.5 w-3.5" />}
        </button>
      </div>
      <InlineImageCropper
        open={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageUrl={cropperSrc}
        onCropped={(url) => {
          const img = selectedImgRef.current;
          if (img) {
            img.src = url;
            emitChange();
          }
        }}
      />
    </div>
  );
});

RichTextEditorInner.displayName = "RichTextEditor";
export const RichTextEditor = RichTextEditorInner;
