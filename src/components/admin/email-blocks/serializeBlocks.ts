import type { EmailBlock, EmailSplitInnerBlock } from "./blockTypes";

const escapeAttr = (s: string) => String(s || "").replace(/"/g, "&quot;");

const renderInner = (block: EmailSplitInnerBlock | null): string => {
  if (!block) return "&nbsp;";
  if (block.type === "text") return block.html || "&nbsp;";
  if (block.type === "image") return renderImageHtml(block.url, block.alt, block.widthPercent, block.linkUrl);
  return "";
};

const renderImageHtml = (url: string, alt?: string, widthPercent?: number, linkUrl?: string): string => {
  if (!url) return "";
  const w = widthPercent || 100;
  const img = `<img src="${escapeAttr(url)}" alt="${escapeAttr(alt || "")}" style="display:block;width:${w}%;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;margin:0 auto;" />`;
  if (linkUrl && linkUrl.trim()) {
    return `<a href="${escapeAttr(linkUrl.trim())}" target="_blank" rel="noopener" style="text-decoration:none;border:0;">${img}</a>`;
  }
  return img;
};

const getYouTubeId = (url: string): string | null => {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
};

const renderVideo = (url: string, thumbnailUrl?: string, title?: string): string => {
  if (!url) return "";
  let thumb = thumbnailUrl || "";
  if (!thumb) {
    const ytId = getYouTubeId(url);
    if (ytId) thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  const playOverlay = `
    <div style="position:relative;display:inline-block;max-width:100%;">
      ${thumb ? `<img src="${escapeAttr(thumb)}" alt="${escapeAttr(title || "Watch video")}" style="display:block;width:100%;max-width:100%;height:auto;border:0;" />` : `<div style="background:#1a1a2e;color:#fff;padding:60px 20px;text-align:center;font-family:Arial,sans-serif;">▶ Watch Video</div>`}
    </div>`;
  return `<a href="${escapeAttr(url)}" target="_blank" rel="noopener" style="text-decoration:none;border:0;display:block;">${playOverlay}${title ? `<div style="text-align:center;font-family:Arial,sans-serif;font-size:13px;color:#666;padding-top:6px;">${title}</div>` : ""}</a>`;
};

const renderTable = (block: Extract<EmailBlock, { type: "table" }>): string => {
  const { cells, headerRow, borderColor, borderWidth, headerBgColor } = block;
  if (!cells || cells.length === 0) return "";
  const cellStyle = `border:${borderWidth}px solid ${borderColor};padding:8px 12px;font-family:Arial,sans-serif;font-size:14px;color:#333;vertical-align:top;`;
  const rows = cells.map((row, ri) => {
    const isHeader = headerRow && ri === 0;
    const tag = isHeader ? "th" : "td";
    const bg = isHeader && headerBgColor ? `background-color:${headerBgColor};font-weight:bold;` : "";
    const tds = row.map(c => `<${tag} style="${cellStyle}${bg}">${c.html || "&nbsp;"}</${tag}>`).join("");
    return `<tr>${tds}</tr>`;
  }).join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;margin:0;">${rows}</table>`;
};

const wrapBlock = (inner: string): string =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px 0;"><tr><td>${inner}</td></tr></table>`;

export const blocksToEmailHtml = (blocks: EmailBlock[]): string => {
  if (!blocks || blocks.length === 0) return "";
  return blocks.map(b => {
    switch (b.type) {
      case "text":
        return wrapBlock(b.html || "");
      case "image":
        return wrapBlock(renderImageHtml(b.url, b.alt, b.widthPercent, b.linkUrl));
      case "video":
        return wrapBlock(renderVideo(b.url, b.thumbnailUrl, b.title));
      case "table":
        return wrapBlock(renderTable(b));
      case "divider":
        return wrapBlock(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;"><tr><td style="border-top:${b.thickness}px solid ${b.color};font-size:0;line-height:0;height:0;">&nbsp;</td></tr></table>`);
      case "splitScreen": {
        const left = renderInner(b.left);
        const right = renderInner(b.right);
        return wrapBlock(
          `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;"><tr>` +
          `<td width="50%" valign="top" style="padding-right:8px;width:50%;">${left}</td>` +
          `<td width="50%" valign="top" style="padding-left:8px;width:50%;">${right}</td>` +
          `</tr></table>`
        );
      }
      default:
        return "";
    }
  }).join("\n");
};
