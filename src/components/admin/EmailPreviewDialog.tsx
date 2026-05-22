import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface HeaderConfig {
  bgColor: string;
  bgImageUrl?: string;
  textColor: string;
  showHeader: boolean;
  headerHeight?: number;
}

interface FooterConfig {
  bgColor: string;
  textColor: string;
  companyName: string;
  contactEmail: string;
  socialLinks: { platform: string; url: string }[];
  showFooter: boolean;
  unsubscribeText?: string;
  unsubscribeUrl?: string;
}

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  heading?: string;
  headerText?: string;
  preheader?: string;
  body: string;
  senderName?: string;
  senderEmail?: string;
  headerConfig?: HeaderConfig;
  footerConfig?: FooterConfig;
}

/** Replace merge tags with sample values for preview */
function previewReplaceTags(html: string): string {
  const sampleButton = `<div style="text-align:center;margin:24px 0;"><a href="#" style="display:inline-block;padding:14px 32px;background:#c9a84c;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;">Action Button</a></div>`;
  return html
    .replace(/\{\{first_name\}\}/gi, "John")
    .replace(/\{\{email\}\}/gi, "john@example.com")
    .replace(/\{\{link\}\}/gi, sampleButton);
}

function getSocialIconImg(platform: string): string {
  const iconUrls: Record<string, string> = {
    instagram: "https://cdn.simpleicons.org/instagram/ffffff",
    facebook: "https://cdn.simpleicons.org/facebook/ffffff",
    linkedin: "https://img.icons8.com/ios-filled/50/FFFFFF/linkedin.png",
    tiktok: "https://cdn.simpleicons.org/TikTok/ffffff",
    twitter: "https://cdn.simpleicons.org/x/ffffff",
    youtube: "https://cdn.simpleicons.org/youtube/ffffff",
  };
  return iconUrls[platform] || "";
}

export function buildEmailHtml({
  heading,
  headerText,
  preheader,
  body,
  senderName = "Levoro Academy",
  senderEmail = "noreply@levoro.academy",
  headerConfig,
  footerConfig,
}: {
  heading?: string;
  headerText?: string;
  preheader?: string;
  body: string;
  senderName?: string;
  senderEmail?: string;
  headerConfig?: HeaderConfig;
  footerConfig?: FooterConfig;
}): string {
  const hc = headerConfig || { bgColor: "#1a1a2e", bgImageUrl: "", textColor: "#ffffff", showHeader: true };
  const fc = footerConfig || { bgColor: "#1a1a2e", textColor: "#ffffff", companyName: "Levoro Academy", contactEmail: "info@levoroacademy.com", socialLinks: [], showFooter: true };

  // Use headerText if provided, otherwise fall back to heading for backwards compat
  const displayText = headerText ?? heading ?? "";
  const headerHeight = (hc as any).headerHeight || 180;

  const preheaderHtml = preheader
    ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>`
    : "";

  const headerBgStyle = hc.bgImageUrl
    ? `background:url('${hc.bgImageUrl}') center/cover no-repeat;`
    : `background:${hc.bgColor};`;

  const headerHtml = hc.showHeader
    ? `<div style="${headerBgStyle}color:${hc.textColor};padding:32px 40px;text-align:center;min-height:${headerHeight}px;display:flex;align-items:center;justify-content:center;">
        ${displayText ? `<h1 style="margin:0;font-size:22px;font-weight:700;color:${hc.textColor};">${displayText}</h1>` : ""}
      </div>`
    : "";

  const socialIconCells = (fc.socialLinks || []).filter(s => s.url).map(s => {
    const iconUrl = getSocialIconImg(s.platform);
    if (!iconUrl) return "";
    return `<td style="padding:0 6px;"><a href="${s.url}" target="_blank" style="display:block;"><img src="${iconUrl}" width="24" height="24" alt="${s.platform}" style="display:block;border:0;" /></a></td>`;
  }).join("");

  const unsubscribeText = (fc as any).unsubscribeText || "You received this email because you signed up on our website or made a purchase from us.";
  const unsubscribeUrl = (fc as any).unsubscribeUrl || `mailto:${fc.contactEmail || "info@levoroacademy.com"}?subject=Unsubscribe`;

  const footerHtml = fc.showFooter
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${fc.bgColor};color:${fc.textColor};font-family:Arial,Helvetica,sans-serif;">
        <tr>
          <td style="padding:28px 40px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:top;">
                  ${fc.companyName ? `<div style="font-weight:600;font-size:14px;margin-bottom:6px;color:${fc.textColor};">${fc.companyName}</div>` : ""}
                  ${fc.contactEmail ? `<div style="margin-bottom:12px;font-size:13px;"><a href="mailto:${fc.contactEmail}" style="color:${fc.textColor};text-decoration:none;">${fc.contactEmail}</a></div>` : ""}
                  ${socialIconCells ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${socialIconCells}</tr></table>` : ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 40px 28px;border-top:1px solid rgba(255,255,255,0.15);">
            <div style="color:${fc.textColor};opacity:0.8;font-size:12px;line-height:1.6;margin-bottom:10px;">${unsubscribeText}</div>
            <a href="${unsubscribeUrl}" style="color:${fc.textColor};text-decoration:underline;font-size:13px;font-weight:600;">Unsubscribe</a>
          </td>
        </tr>
      </table>`
    : `<div style="padding:24px 40px;text-align:center;font-size:12px;color:#999;border-top:1px solid #eee;">Sent by ${senderName} &lt;${senderEmail}&gt;</div>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    body{margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif}
    .container{max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
    .body-content{padding:32px 40px;color:#333;font-size:15px;line-height:1.6}
    .body-content img{max-width:100%}
  </style></head><body>
    ${preheaderHtml}
    <div class="container">
      ${headerHtml}
      <div class="body-content">${body}</div>
      ${footerHtml}
    </div>
  </body></html>`;
}

export default function EmailPreviewDialog({ open, onOpenChange, subject, heading, headerText, preheader, body, senderName, senderEmail, headerConfig, footerConfig }: EmailPreviewDialogProps) {
  const previewBody = previewReplaceTags(body);
  const html = buildEmailHtml({ heading, headerText, preheader, body: previewBody, senderName, senderEmail, headerConfig, footerConfig });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Email Preview — {subject}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden rounded border border-border">
          <iframe
            srcDoc={html}
            title="Email Preview"
            className="w-full h-[500px] border-0"
            sandbox="allow-same-origin"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
