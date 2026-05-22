export interface EmailTextBlock {
  type: "text";
  id: string;
  html: string;
}

export interface EmailImageBlock {
  type: "image";
  id: string;
  url: string;
  alt?: string;
  widthPercent?: number;
  linkUrl?: string;
}

export interface EmailVideoBlock {
  type: "video";
  id: string;
  url: string;
  thumbnailUrl?: string;
  title?: string;
}

export interface EmailTableCell {
  id: string;
  html: string;
}

export interface EmailTableBlock {
  type: "table";
  id: string;
  cells: EmailTableCell[][];
  headerRow: boolean;
  borderColor: string;
  borderWidth: number;
  headerBgColor?: string;
}

export type EmailSplitInnerBlock = EmailTextBlock | EmailImageBlock;

export interface EmailSplitScreenBlock {
  type: "splitScreen";
  id: string;
  left: EmailSplitInnerBlock | null;
  right: EmailSplitInnerBlock | null;
}

export interface EmailDividerBlock {
  type: "divider";
  id: string;
  thickness: number;
  color: string;
}

export type EmailBlock =
  | EmailTextBlock
  | EmailImageBlock
  | EmailVideoBlock
  | EmailTableBlock
  | EmailSplitScreenBlock
  | EmailDividerBlock;
