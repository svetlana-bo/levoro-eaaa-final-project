import DOMPurify from "dompurify";

/**
 * Force every rendered <a href="..."> to open in a new tab with safe rel.
 * Registered once at module load — applies to all sanitizeHtml() calls.
 */
let hookRegistered = false;
function ensureLinkHook() {
  if (hookRegistered) return;
  hookRegistered = true;
  DOMPurify.addHook("afterSanitizeAttributes", (node: any) => {
    if (node && node.nodeName === "A" && node.getAttribute && node.getAttribute("href")) {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
}

/**
 * Sanitize HTML string for safe use with dangerouslySetInnerHTML.
 * Allows common formatting tags, images, and iframes (for embeds).
 * All anchor tags are forced to open in a new tab.
 */
export function sanitizeHtml(dirty: string | undefined | null): string {
  if (!dirty) return "";
  ensureLinkHook();
  return DOMPurify.sanitize(dirty, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "target", "rel", "style", "class"],
  });
}

/** Shorthand for dangerouslySetInnerHTML prop */
export function safeHtml(dirty: string | undefined | null) {
  return { __html: sanitizeHtml(dirty) };
}

/** Strip all HTML tags and return plain text */
export function stripHtml(html: string | undefined | null): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

/**
 * Normalize HTML for Dialog Cards: remove rogue typography styles so every
 * card renders consistently regardless of how the source HTML was authored
 * or pasted. Keeps semantic emphasis (bold/italic/underline/links/lists).
 */
const STRIP_STYLE_PROPS = new Set([
  "font-size", "font-family", "color", "background", "background-color",
  "text-align", "line-height", "letter-spacing",
]);

function unwrapElement(el: Element) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

export function sanitizeDialogCardHtml(dirty: string | undefined | null): string {
  if (!dirty) return "";
  const clean = sanitizeHtml(dirty);
  if (typeof window === "undefined") return clean;
  const doc = new DOMParser().parseFromString(`<div>${clean}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLElement | null;
  if (!root) return clean;

  // Unwrap legacy <font> and headings so size doesn't blow up
  root.querySelectorAll("font, h1, h2, h3, h4, h5, h6").forEach(unwrapElement);

  // Wrap orphan inline/text children of root in a single <p> per run, so the
  // player's [&_p]:m-0 [&_p+p]:mt-2 rules always apply and line-height is stable.
  const BLOCK_TAGS = new Set(["P", "UL", "OL", "LI", "BLOCKQUOTE", "DIV", "PRE", "HR", "TABLE"]);
  const isBlock = (n: Node) => n.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has((n as Element).tagName);
  const children = Array.from(root.childNodes);
  let buffer: Node[] = [];
  const flush = () => {
    if (buffer.length === 0) return;
    const hasContent = buffer.some(n =>
      (n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim().length > 0) ||
      (n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName !== "BR")
    );
    if (!hasContent) { buffer = []; return; }
    const p = doc.createElement("p");
    buffer.forEach(n => p.appendChild(n));
    root.appendChild(p);
    buffer = [];
  };
  children.forEach(node => {
    if (isBlock(node)) {
      flush();
      root.appendChild(node);
    } else {
      buffer.push(node);
    }
  });
  flush();

  root.querySelectorAll<HTMLElement>("*").forEach(el => {
    el.removeAttribute("align");
    el.removeAttribute("face");
    el.removeAttribute("size");
    el.removeAttribute("color");
    const style = el.getAttribute("style");
    if (style) {
      const kept = style
        .split(";")
        .map(s => s.trim())
        .filter(Boolean)
        .filter(decl => {
          const prop = decl.split(":")[0]?.trim().toLowerCase();
          return prop && !STRIP_STYLE_PROPS.has(prop);
        })
        .join("; ");
      if (kept) el.setAttribute("style", kept);
      else el.removeAttribute("style");
    }
  });

  // Drop empty <span>/<div> wrappers that lost all attributes after stripping.
  root.querySelectorAll<HTMLElement>("span, div").forEach(el => {
    if (el.attributes.length === 0) unwrapElement(el);
  });

  return root.innerHTML;
}

/**
 * Light-touch normalizer for rich text fields (Quiz question, Branching node
 * content, etc.). Keeps headings, sizes, colors, alignment, and inline styles
 * — only fixes structural drift introduced by contentEditable browsers:
 *   - Wraps orphan text/inline children of root in a <p> (merging runs).
 *   - Converts root-level <div>s that only contain inline content into <p>.
 *   - Drops empty <p>/<span>/<div> wrappers.
 * Result: identical visible content always serializes to identical HTML.
 */
const INLINE_TAGS = new Set([
  "SPAN", "A", "B", "I", "STRONG", "EM", "U", "CODE", "MARK", "SUB", "SUP", "FONT", "SMALL", "S", "DEL", "INS",
]);
const BLOCK_TAGS_RT = new Set([
  "P", "UL", "OL", "LI", "BLOCKQUOTE", "PRE", "HR", "TABLE", "H1", "H2", "H3", "H4", "H5", "H6", "FIGURE", "IMG", "IFRAME", "VIDEO", "AUDIO",
]);

function isEffectivelyEmpty(el: Element): boolean {
  if (el.children.length === 0) {
    const t = (el.textContent || "").replace(/\u00a0|\s/g, "");
    return t.length === 0;
  }
  if (el.children.length === 1 && el.children[0].tagName === "BR" && (el.textContent || "").trim() === "") {
    return true;
  }
  return false;
}

function divHasOnlyInline(el: Element): boolean {
  for (const child of Array.from(el.children)) {
    if (BLOCK_TAGS_RT.has(child.tagName) || child.tagName === "DIV") return false;
  }
  return true;
}

export function normalizeRichTextHtml(dirty: string | undefined | null): string {
  if (!dirty) return "";
  const clean = sanitizeHtml(dirty);
  if (typeof window === "undefined") return clean;
  const doc = new DOMParser().parseFromString(`<div>${clean}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLElement | null;
  if (!root) return clean;

  // Convert root-level <div> with only inline content into <p>
  Array.from(root.children).forEach(child => {
    if (child.tagName === "DIV" && divHasOnlyInline(child)) {
      const p = doc.createElement("p");
      // Preserve attributes (style/class) on the converted block
      for (const attr of Array.from(child.attributes)) p.setAttribute(attr.name, attr.value);
      while (child.firstChild) p.appendChild(child.firstChild);
      child.replaceWith(p);
    }
  });

  // Wrap orphan text/inline runs in <p>
  const isInlineNode = (n: Node) =>
    n.nodeType === Node.TEXT_NODE ||
    (n.nodeType === Node.ELEMENT_NODE && (INLINE_TAGS.has((n as Element).tagName) || (n as Element).tagName === "BR"));

  const children = Array.from(root.childNodes);
  let buffer: Node[] = [];
  const flush = () => {
    if (buffer.length === 0) return;
    const hasContent = buffer.some(n =>
      (n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim().length > 0) ||
      (n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName !== "BR")
    );
    if (!hasContent) { buffer = []; return; }
    const p = doc.createElement("p");
    buffer.forEach(n => p.appendChild(n));
    root.appendChild(p);
    buffer = [];
  };
  // Re-append in order, batching inline runs into <p>
  children.forEach(node => {
    const isBlock =
      node.nodeType === Node.ELEMENT_NODE &&
      (BLOCK_TAGS_RT.has((node as Element).tagName) || (node as Element).tagName === "DIV");
    if (isBlock) {
      flush();
      root.appendChild(node);
    } else if (isInlineNode(node)) {
      buffer.push(node);
    } else {
      // Unknown node — flush and append as-is
      flush();
      root.appendChild(node);
    }
  });
  flush();

  // Drop empty wrappers
  root.querySelectorAll("p, span, div").forEach(el => {
    if (isEffectivelyEmpty(el) && el.attributes.length === 0) el.remove();
  });

  return root.innerHTML;
}

/** Relative luminance check for hex (#rgb / #rrggbb). Returns true if dark. */
export function isDarkColor(hex: string | undefined | null): boolean {
  if (!hex) return false;
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L < 0.5;
}
