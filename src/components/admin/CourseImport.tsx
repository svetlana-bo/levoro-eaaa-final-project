import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileJson, AlertTriangle, CheckCircle2, Loader2, Info, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { toast } from "sonner";
import type { ContentBlock } from "@/components/lesson-editor/types";

// ── Types ──

/** Detected interactive content from H5P or similar */
interface DetectedInteractive {
  id: string;
  originalUrl: string;
  contextHint: string; // surrounding text hint
  suggestedType: string; // our best-guess exercise type
  chosenType: string; // admin's chosen conversion (or "text" for red placeholder)
  surroundingContent: string; // extracted text content around the H5P block for populating exercises
}

interface RemoteH5PContent {
  title?: string;
  items?: string[];
  description?: string;
}

interface ParsedLesson {
  title: string;
  order_index: number;
  content_blocks: ContentBlock[];
  video_url: string | null;
  audio_url: string | null;
  warnings: string[];
  detectedInteractives: DetectedInteractive[];
}

interface ParsedModule {
  title: string;
  order_index: number;
  lessons: ParsedLesson[];
}

interface ParsedCourse {
  title: string;
  description: string;
  thumbnail_url: string | null;
  preview_video_url: string | null;
  modules: ParsedModule[];
  unmatchedLessons: ParsedLesson[];
  warnings: string[];
}


// ── Helpers ──

function extractAudioUrl(html: string): string | null {
  // [audio mp3="..." ] or [audio ogg="..." ] or [audio wav="..." ]
  const mp3AttrMatch = html.match(/\[audio[^\]]*(?:mp3|ogg|wav|m4a|flac|wma)=["'](https?:\/\/[^"']+)["'][^\]]*\]/i);
  if (mp3AttrMatch) return mp3AttrMatch[1].trim();
  // [audio src="..."]
  const srcAttrMatch = html.match(/\[audio[^\]]*src=["'](https?:\/\/[^"']+)["'][^\]]*\]/i);
  if (srcAttrMatch) return srcAttrMatch[1].trim();
  // [audio]URL[/audio]
  const shortcodeMatch = html.match(/\[audio[^\]]*\](https?:\/\/[^\[<\s]+)\[\/audio\]/i);
  if (shortcodeMatch) return shortcodeMatch[1].trim();
  // <audio> tag
  const audioTagMatch = html.match(/<audio[^>]+src=["'](https?:\/\/[^"']+)["']/i);
  if (audioTagMatch) return audioTagMatch[1].trim();
  const sourceMatch = html.match(/<audio[^>]*>.*?<source[^>]+src=["'](https?:\/\/[^"']+)["']/is);
  if (sourceMatch) return sourceMatch[1].trim();
  // Bare audio file URL in content
  const bareAudioMatch = html.match(/(https?:\/\/[^\s<"']+\.(?:mp3|ogg|wav|m4a|flac|wma))/i);
  if (bareAudioMatch) return bareAudioMatch[1].trim();
  return null;
}

function remapSingleUrl(url: string, mediaBaseUrl: string): string {
  if (!mediaBaseUrl || !url) return url;
  return url.replace(
    /https?:\/\/[^"'\s]+\/wp-content\/uploads\//i,
    mediaBaseUrl.replace(/\/$/, "") + "/"
  );
}

function sanitizeHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/\[caption[^\]]*\](.*?)\[\/caption\]/gi, "$1")
    .replace(/\[gallery[^\]]*\]/gi, '<p style="color:#dc2626;font-weight:bold;background:#fef2f2;padding:8px;border:2px dashed #dc2626;border-radius:6px;">⚠ GALLERY SHORTCODE — media not imported, please add manually</p>')
    .replace(/\[video[^\]]*\](.*?)\[\/video\]/gi, '<p style="color:#dc2626;font-weight:bold;background:#fef2f2;padding:8px;border:2px dashed #dc2626;border-radius:6px;">⚠ VIDEO SHORTCODE — media not imported: $1</p>')
    .replace(/\[audio[^\]]*\](.*?)\[\/audio\]/gi, "")
    .replace(/\[audio[^\]]*\/?\]/gi, "")
    .replace(/<audio[^>]*>.*?<\/audio>/gis, "")
    .replace(/\[embed\](.*?)\[\/embed\]/gi, '<p style="color:#dc2626;font-weight:bold;background:#fef2f2;padding:8px;border:2px dashed #dc2626;border-radius:6px;">⚠ EMBED — not imported: $1</p>')
    .replace(new RegExp("\\[/?[a-zA-Z_]+[^\\]]*\\]", "g"), "")
    .trim();
}

function extractVideoUrl(content: string): string | null {
  const iframeMatch = content.match(/src=["'](https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com|iframe\.mediadelivery\.net)[^"']+)["']/i);
  if (iframeMatch) return iframeMatch[1];
  const urlMatch = content.match(/(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/)[^\s<"']+)/i);
  if (urlMatch) return urlMatch[1];
  return null;
}

function extractVideoFromMeta(meta: any): string | null {
  if (!meta?._video) return null;
  const videoArr = Array.isArray(meta._video) ? meta._video : [meta._video];
  for (const v of videoArr) {
    if (v.source_embedded) {
      const url = extractVideoUrl(v.source_embedded);
      if (url) return url;
    }
    if (v.source_external_url) return v.source_external_url;
    if (v.source_video_id) return v.source_video_id;
  }
  return null;
}

/** Extract clean structured content from HTML: a title and a list of items */
function extractStructuredContent(html: string): { title: string; items: string[] } {
  // Remove images entirely (src attrs leak into text otherwise)
  const noImgs = html.replace(/<img[^>]*>/gi, "");
  // Extract heading text
  const headingMatch = noImgs.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i);
  const title = headingMatch ? headingMatch[1].replace(/<[^>]*>/g, "").trim() : "";
  // Extract list items
  const liRegex = /<li[^>]*>(.*?)<\/li>/gi;
  const items: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = liRegex.exec(noImgs)) !== null) {
    const text = m[1].replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    if (text.length > 2) items.push(text);
  }
  // If no list items, try paragraphs
  if (items.length === 0) {
    const pRegex = /<p[^>]*>(.*?)<\/p>/gi;
    while ((m = pRegex.exec(noImgs)) !== null) {
      const text = m[1].replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
      if (text.length > 5 && text !== title) items.push(text);
    }
  }
  // Fallback: split cleaned text by newlines/sentences
  if (items.length === 0 && !title) {
    const plain = noImgs.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    plain.split(/[.!?\n]/).forEach(s => {
      const t = s.trim();
      if (t.length > 5 && t.length < 300) items.push(t);
    });
  }
  return { title, items };
}

function normalizeRemoteH5PContent(content?: RemoteH5PContent): RemoteH5PContent {
  if (!content) return {};
  const title = typeof content.title === "string" ? content.title.trim() : "";
  const description = typeof content.description === "string" ? content.description.trim() : "";
  const items = Array.isArray(content.items)
    ? content.items.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)
    : [];

  return {
    title: title || undefined,
    description: description || undefined,
    items: items.length ? items : undefined,
  };
}

/** Detect H5P iframes and extract them, returning cleaned HTML + detected interactives */
function extractH5PContent(html: string): { cleanedHtml: string; interactives: DetectedInteractive[] } {
  const interactives: DetectedInteractive[] = [];
  const h5pRegex = /<iframe[^>]+src=["']([^"']*h5p[^"']*)["'][^>]*>[\s\S]*?<\/iframe>/gi;

  let cleanedHtml = html.replace(h5pRegex, (match, url) => {
    const beforeIdx = html.indexOf(match);
    const contextBefore = html.substring(Math.max(0, beforeIdx - 1000), beforeIdx);
    const contextAfter = html.substring(beforeIdx + match.length, Math.min(html.length, beforeIdx + match.length + 500));

    const suggestedType = guessH5PType(contextBefore.toLowerCase(), url);
    const id = crypto.randomUUID();

    // Store raw HTML context for structured extraction later
    const surroundingContent = contextBefore + " " + contextAfter;
    const cleanText = (h: string) => h.replace(/<img[^>]*>/gi, "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

    interactives.push({
      id,
      originalUrl: url,
      contextHint: cleanText(contextBefore).slice(-100),
      suggestedType,
      chosenType: suggestedType,
      surroundingContent,
    });

    return `<!--H5P_BLOCK_${id}-->`;
  });

  return { cleanedHtml, interactives };
}

function guessH5PType(context: string, _url: string): string {
  // Try to infer H5P type from surrounding text
  if (/check|tick|select.*apply|pick.*one|pick.*several/i.test(context)) return "checklist";
  if (/quiz|question|answer|multiple.*choice/i.test(context)) return "quiz";
  if (/true.*false|correct.*incorrect/i.test(context)) return "trueFalse";
  if (/fill.*blank|complete.*sentence/i.test(context)) return "fillBlanks";
  if (/flash.*card|dialog.*card|flip/i.test(context)) return "dialogCards";
  if (/reflect|essay|write.*about|journal/i.test(context)) return "reflection";
  if (/drag.*drop|match|pair/i.test(context)) return "dragDrop";
  if (/sort|order|arrange|sequence/i.test(context)) return "sortParagraphs";
  if (/memory|matching.*game/i.test(context)) return "memoryGame";
  if (/crossword|puzzle/i.test(context)) return "crossword";
  if (/compare.*image|before.*after|juxtapos/i.test(context)) return "imageJuxtaposition";
  // Default
  return "checklist";
}

/** Replace wp-content/uploads URLs with Supabase storage URL if base provided */
function remapMediaUrls(html: string, mediaBaseUrl: string): { html: string; warnings: string[] } {
  const warnings: string[] = [];
  if (!html) return { html, warnings };

  if (mediaBaseUrl) {
    // Replace wp-content/uploads paths with Supabase storage base URL
    const processed = html.replace(
      /(https?:\/\/[^"'\s]+\/wp-content\/uploads\/)([^"'\s<>]+)/gi,
      (_match, _wpBase, path) => {
        const newUrl = `${mediaBaseUrl.replace(/\/$/, "")}/${path}`;
        return newUrl;
      }
    );
    return { html: processed, warnings };
  }

  // No base URL: replace with red placeholders
  const processed = html.replace(
    /<img([^>]+)src=["'](https?:\/\/[^"']*wp-content\/uploads[^"']*)["']([^>]*)>/gi,
    (_match, before, src, after) => {
      // Try to get alt text
      const altMatch = (before + after).match(/alt=["']([^"']*)["']/i);
      const alt = altMatch?.[1] || "";
      warnings.push(`Image not imported: ${src.substring(0, 100)}`);
      return `<div style="border:2px dashed #dc2626;padding:12px;margin:8px 0;border-radius:6px;background:#fef2f2;color:#dc2626;font-weight:bold;font-size:14px;">⚠ IMAGE NOT IMPORTED<br/><span style="font-weight:normal;font-size:12px;">Source: <code style="word-break:break-all;">${src}</code>${alt ? `<br/>Alt: ${alt}` : ""}</span></div>`;
    }
  );
  return { html: processed, warnings };
}

function getTitle(item: any): string {
  if (typeof item.title === "string") return item.title;
  if (item.title?.rendered) return item.title.rendered;
  return item.post_title || item.name || item.label || "Untitled";
}

function getContent(item: any): string {
  if (typeof item.content === "string") return item.content;
  if (item.content?.rendered) return item.content.rendered;
  return item.post_content || item.description || item.body || item.text || "";
}

/** Create a text placeholder for detected H5P content */
function createH5PPlaceholder(
  originalUrl: string,
  suggestedType: string,
  surroundingContent: string = "",
): ContentBlock {
  const id = crypto.randomUUID();
  const cleanContext = surroundingContent.replace(/<img[^>]*>/gi, "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim().substring(0, 200);
  const typeLabel = suggestedType.charAt(0).toUpperCase() + suggestedType.slice(1).replace(/([A-Z])/g, " $1");
  return {
    type: "text",
    id,
    html: `<div style="border:2px dashed #f59e0b;padding:16px;margin:8px 0;border-radius:6px;background:#fffbeb;color:#92400e;font-weight:bold;font-size:14px;">⚠ INTERACTIVE CONTENT (H5P) — ${typeLabel}<br/><span style="font-weight:normal;font-size:12px;">Original: <code style="word-break:break-all;">${originalUrl}</code>${cleanContext ? `<br/>Context: ${cleanContext}` : ""}<br/><br/>This content needs to be recreated manually using the lesson editor.</span></div>`,
  };
}

function buildLesson(item: any, index: number, mediaBaseUrl: string): ParsedLesson {
  const rawContent = getContent(item);
  
  // Extract audio URL before sanitizing (sanitize removes audio tags)
  const rawAudioUrl = extractAudioUrl(rawContent);
  const audioUrl = rawAudioUrl ? remapSingleUrl(rawAudioUrl, mediaBaseUrl) : null;
  
  const sanitized = sanitizeHtml(rawContent);
  const video = item.video_url || extractVideoFromMeta(item.meta) || extractVideoUrl(rawContent);
  
  // Extract H5P interactives
  const { cleanedHtml, interactives } = extractH5PContent(sanitized);
  
  // Remap media URLs
  const { html, warnings } = remapMediaUrls(cleanedHtml, mediaBaseUrl);
  
  // Split HTML by H5P markers into content blocks
  const blocks: ContentBlock[] = [];
  if (html) {
    const parts = html.split(/<!--H5P_BLOCK_([a-f0-9-]+)-->/);
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        const text = parts[i].trim();
        if (text) {
          blocks.push({ type: "text", id: crypto.randomUUID(), html: text });
        }
      } else {
        const interactiveId = parts[i];
        const interactive = interactives.find(h => h.id === interactiveId);
        if (interactive) {
          blocks.push({ type: "text", id: interactiveId, html: `<div style="border:2px dashed #dc2626;padding:16px;margin:8px 0;border-radius:6px;background:#fef2f2;color:#dc2626;font-weight:bold;">⚠ H5P Interactive Content — will be converted on import<br/><span style="font-weight:normal;font-size:12px;">Source: ${interactive.originalUrl}</span></div>` });
        }
      }
    }
  }
  
  if (blocks.length === 0) {
    blocks.push({ type: "text", id: crypto.randomUUID(), html: "<p>No content detected.</p>" });
  }

  return {
    title: getTitle(item) || `Lesson ${index + 1}`,
    order_index: item.order ?? item.menu_order ?? item.order_index ?? index,
    content_blocks: blocks,
    video_url: video || null,
    audio_url: audioUrl,
    warnings,
    detectedInteractives: interactives,
  };
}

// ── Parsers ──

function parseWordPressJson(json: any, mediaBaseUrl: string): ParsedCourse {
  const warnings: string[] = [];

  if (json.data && Array.isArray(json.data)) {
    const courseEntry = json.data.find((d: any) => d.content_type === "courses");
    if (courseEntry?.data?.course) {
      return parseTutorLmsExport(courseEntry.data.course, warnings, mediaBaseUrl);
    }
  }

  if (Array.isArray(json)) {
    return parsePostsArray(json, warnings, mediaBaseUrl);
  }

  if (typeof json === "object") {
    const courseData = json.course || json.data || json.courses?.[0] || json;
    if (courseData.sections || courseData.modules || courseData.topics || courseData.chapters) {
      return parseSectioned(courseData, warnings, mediaBaseUrl);
    }
    if (courseData.curriculum) {
      return parseTutorCurriculum(courseData, warnings, mediaBaseUrl);
    }
    if (courseData.lessons || courseData.items || courseData.posts) {
      return parseFlatLessons(courseData, warnings, mediaBaseUrl);
    }
    if (courseData.title || courseData.post_title) {
      return parseSingleCourse(courseData, warnings, mediaBaseUrl);
    }
  }

  warnings.push("Could not auto-detect JSON structure. All top-level content saved as individual lessons.");
  return {
    title: "Imported Course",
    description: "",
    thumbnail_url: null,
    preview_video_url: null,
    modules: [],
    unmatchedLessons: [{
      title: "Imported Content",
      order_index: 0,
      content_blocks: [{ type: "text", id: crypto.randomUUID(), html: `<pre>${JSON.stringify(json, null, 2).substring(0, 50000)}</pre>` }],
      video_url: null,
      audio_url: null,
      warnings: ["Content structure not recognized - raw JSON preserved"],
      detectedInteractives: [],
    }],
    warnings,
  };
}

function parseTutorLmsExport(course: any, warnings: string[], mediaBaseUrl: string): ParsedCourse {
  const title = course.post_title || "Imported Course";
  const description = sanitizeHtml(course.post_content || "");
  const thumbnail = course.thumbnail_url || null;
  const previewVideo = extractVideoFromMeta(course.meta);

  const modules: ParsedModule[] = [];
  const contents = course.contents || [];

  for (let ti = 0; ti < contents.length; ti++) {
    const topic = contents[ti];
    const children = topic.children || [];
    const lessonChildren = children.filter((c: any) => c.post_type === "lesson" || c.post_type === "tutor_lesson" || !c.post_type);

    modules.push({
      title: getTitle(topic) || `Module ${ti + 1}`,
      order_index: topic.menu_order ?? ti,
      lessons: lessonChildren.map((l: any, li: number) => buildLesson(l, li, mediaBaseUrl)),
    });
  }

  if (modules.length === 0) {
    warnings.push("No topics/modules found in the Tutor LMS export.");
  }

  return { title, description, thumbnail_url: thumbnail, preview_video_url: previewVideo, modules, unmatchedLessons: [], warnings };
}

function parsePostsArray(posts: any[], warnings: string[], mediaBaseUrl: string): ParsedCourse {
  const courses = posts.filter(p => ["sfwd-courses", "courses", "tutor_course"].includes(p.post_type) || p.type === "course");
  const sectionPosts = posts.filter(p => ["sfwd-lessons", "section", "tutor_topics", "topics"].includes(p.post_type) || p.type === "section" || p.type === "module");
  const lessonPosts = posts.filter(p => ["sfwd-topic", "lesson", "tutor_lesson"].includes(p.post_type) || p.type === "lesson" || p.type === "topic");

  const courseMeta = courses[0] || posts[0];
  const title = getTitle(courseMeta) || "Imported Course";
  const description = courses.length ? sanitizeHtml(getContent(courseMeta)) : "";
  const thumbnail = courseMeta?.thumbnail_url || courseMeta?.featured_media_url || null;

  const modules: ParsedModule[] = [];
  const unmatchedLessons: ParsedLesson[] = [];

  if (sectionPosts.length > 0) {
    sectionPosts.forEach((sec, si) => {
      const sectionId = sec.id || sec.ID;
      const related = lessonPosts.filter(l => l.parent === sectionId || l.section_id === sectionId || l.post_parent === sectionId);
      modules.push({
        title: getTitle(sec),
        order_index: sec.menu_order ?? si,
        lessons: related.map((l, li) => buildLesson(l, li, mediaBaseUrl)),
      });
    });
    const matchedParents = new Set(sectionPosts.map(s => s.id || s.ID));
    lessonPosts.filter(l => !matchedParents.has(l.parent) && !matchedParents.has(l.post_parent)).forEach((l, i) => unmatchedLessons.push(buildLesson(l, i, mediaBaseUrl)));
  } else if (lessonPosts.length > 0) {
    lessonPosts.forEach((l, i) => unmatchedLessons.push(buildLesson(l, i, mediaBaseUrl)));
    warnings.push("No modules/sections detected - all lessons imported without module grouping.");
  } else {
    const nonCourse = posts.filter(p => p !== courseMeta);
    nonCourse.forEach((p, i) => unmatchedLessons.push(buildLesson(p, i, mediaBaseUrl)));
    if (nonCourse.length) warnings.push("No post_type metadata found - each item treated as a separate lesson.");
  }

  return { title, description, thumbnail_url: thumbnail, preview_video_url: null, modules, unmatchedLessons, warnings };
}

function parseSectioned(data: any, warnings: string[], mediaBaseUrl: string): ParsedCourse {
  const sections = data.sections || data.modules || data.topics || data.chapters || [];
  const modules: ParsedModule[] = sections.map((sec: any, si: number) => ({
    title: getTitle(sec),
    order_index: sec.order ?? si,
    lessons: (sec.lessons || sec.topics || sec.items || sec.children || []).map((l: any, li: number) => buildLesson(l, li, mediaBaseUrl)),
  }));
  return {
    title: getTitle(data) || "Imported Course",
    description: sanitizeHtml(getContent(data)),
    thumbnail_url: data.thumbnail_url || data.image || null,
    preview_video_url: null,
    modules,
    unmatchedLessons: [],
    warnings,
  };
}

function parseTutorCurriculum(data: any, warnings: string[], mediaBaseUrl: string): ParsedCourse {
  const curriculum = data.curriculum || [];
  const modules: ParsedModule[] = curriculum.map((topic: any, ti: number) => ({
    title: topic.topic_title || topic.title || `Module ${ti + 1}`,
    order_index: ti,
    lessons: (topic.items || topic.lessons || []).map((l: any, li: number) => buildLesson(l, li, mediaBaseUrl)),
  }));
  return {
    title: data.course_title || data.title || "Imported Course",
    description: sanitizeHtml(data.course_description || data.description || ""),
    thumbnail_url: data.thumbnail || data.image || null,
    preview_video_url: null,
    modules,
    unmatchedLessons: [],
    warnings,
  };
}

function parseFlatLessons(data: any, warnings: string[], mediaBaseUrl: string): ParsedCourse {
  const items = data.lessons || data.items || data.posts || [];
  warnings.push("No modules/sections detected - all lessons imported without module grouping.");
  return {
    title: getTitle(data) || "Imported Course",
    description: sanitizeHtml(getContent(data)),
    thumbnail_url: data.thumbnail_url || data.image || null,
    preview_video_url: null,
    modules: [],
    unmatchedLessons: items.map((l: any, i: number) => buildLesson(l, i, mediaBaseUrl)),
    warnings,
  };
}

function parseSingleCourse(data: any, warnings: string[], mediaBaseUrl: string): ParsedCourse {
  warnings.push("Single item detected - saved as one lesson.");
  return {
    title: getTitle(data) || "Imported Course",
    description: "",
    thumbnail_url: data.thumbnail_url || data.image || null,
    preview_video_url: null,
    modules: [],
    unmatchedLessons: [buildLesson(data, 0, mediaBaseUrl)],
    warnings,
  };
}

// ── Collect all interactives from parsed course ──
function collectAllInteractives(course: ParsedCourse): DetectedInteractive[] {
  const all: DetectedInteractive[] = [];
  for (const mod of course.modules) {
    for (const les of mod.lessons) {
      all.push(...les.detectedInteractives);
    }
  }
  for (const les of course.unmatchedLessons) {
    all.push(...les.detectedInteractives);
  }
  return all;
}

// ── Component ──

const ASSIGN_LATER = "__assign_later__";

export default function CourseImport() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");
  const [parsedCourse, setParsedCourse] = useState<ParsedCourse | null>(null);
  const [rawJson, setRawJson] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; courseId?: string; message: string } | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [showRawJson, setShowRawJson] = useState(false);
  const [mediaBaseUrl, setMediaBaseUrl] = useState<string>(
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/course-media/wp-imports/uploads`
  );
  

  const { data: instructors = [] } = useQuery({
    queryKey: ["import-instructors"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "instructor");
      if (!roles?.length) return [];
      const ids = roles.map(r => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name").in("id", ids);
      return profiles || [];
    },
  });

  const { data: currentUser } = useQuery({
    queryKey: ["current-admin-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        setRawJson(text.substring(0, 100000));
        const json = JSON.parse(text);
        const parsed = parseWordPressJson(json, mediaBaseUrl);
        setParsedCourse(parsed);
        
        const totalLessons = parsed.modules.reduce((s, m) => s + m.lessons.length, 0) + parsed.unmatchedLessons.length;
        const h5pCount = collectAllInteractives(parsed).length;
        toast.success(`Parsed "${parsed.title}" — ${parsed.modules.length} module(s), ${totalLessons} lesson(s)${h5pCount ? `, ${h5pCount} H5P interactive(s) detected` : ""}`);
        toast.success(`Parsed "${parsed.title}" — ${parsed.modules.length} module(s), ${totalLessons} lesson(s)${h5pCount ? `, ${h5pCount} H5P interactive(s) detected` : ""}`);
      } catch (err: any) {
        toast.error("Invalid JSON file: " + err.message);
        setParsedCourse(null);
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleReparse = useCallback(() => {
    if (!rawJson) return;
    try {
      const json = JSON.parse(rawJson);
      const parsed = parseWordPressJson(json, mediaBaseUrl);
      setParsedCourse(parsed);
      toast.success("Re-parsed with updated media URL mapping.");
    } catch (err: any) {
      toast.error("Parse error: " + err.message);
    }
  }, [rawJson, mediaBaseUrl]);

  const handleImport = async () => {
    if (!parsedCourse || !selectedInstructor) {
      toast.error("Please select an instructor option and upload a valid JSON file.");
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const instructorId = selectedInstructor === ASSIGN_LATER ? currentUser?.id : selectedInstructor;
      if (!instructorId) throw new Error("Could not determine instructor. Please try again.");

      // 1. Create course
      const { data: course, error: courseErr } = await supabase.from("courses").insert({
        title: parsedCourse.title || "Imported Course",
        description: parsedCourse.description || null,
        thumbnail_url: parsedCourse.thumbnail_url,
        preview_video_url: parsedCourse.preview_video_url,
        instructor_id: instructorId,
        status: "draft" as any,
        is_published: false,
        access_type: "subscription",
        price_eur: 0,
      }).select("id").single();

      if (courseErr) throw courseErr;
      const courseId = course.id;

      let lessonOrder = 0;

      const processLessonBlocks = (lesson: ParsedLesson): ContentBlock[] => {
        const blocks: ContentBlock[] = [];
        for (const block of lesson.content_blocks) {
          const interactive = lesson.detectedInteractives.find(h => h.id === block.id);
          if (interactive) {
            blocks.push(createH5PPlaceholder(interactive.originalUrl, interactive.suggestedType, interactive.surroundingContent));
          } else {
            blocks.push(block);
          }
        }
        return blocks;
      };

      // 2. Create modules and their lessons
      for (const mod of parsedCourse.modules) {
        const { data: moduleData, error: modErr } = await supabase.from("modules").insert({
          course_id: courseId,
          title: mod.title,
          order_index: mod.order_index,
        }).select("id").single();

        if (modErr) throw modErr;

        for (const lesson of mod.lessons) {
          const contentBlocks = processLessonBlocks(lesson);
          const { error: lesErr } = await supabase.from("lessons").insert({
            course_id: courseId,
            module_id: moduleData.id,
            title: lesson.title,
            order_index: lessonOrder++,
            video_url: lesson.video_url,
            audio_url: lesson.audio_url,
            content: null,
            content_blocks: contentBlocks as any,
          } as any);
          if (lesErr) throw lesErr;
        }
      }

      // 3. Unmatched lessons
      for (const lesson of parsedCourse.unmatchedLessons) {
        const contentBlocks = processLessonBlocks(lesson);
        const { error: lesErr } = await supabase.from("lessons").insert({
          course_id: courseId,
          title: lesson.title,
          order_index: lessonOrder++,
          video_url: lesson.video_url,
          audio_url: lesson.audio_url,
          content: null,
          content_blocks: contentBlocks as any,
        } as any);
        if (lesErr) throw lesErr;
      }

      const assignedLater = selectedInstructor === ASSIGN_LATER;
      setImportResult({
        success: true,
        courseId,
        message: `Course "${parsedCourse.title}" imported successfully as draft!${assignedLater ? " Remember to reassign the instructor before publishing." : ""}`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-draft-courses"] });
      toast.success("Course imported as draft!");
    } catch (err: any) {
      setImportResult({ success: false, message: err.message || "Import failed" });
      toast.error("Import failed: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const totalLessons = parsedCourse
    ? parsedCourse.modules.reduce((s, m) => s + m.lessons.length, 0) + parsedCourse.unmatchedLessons.length
    : 0;

  const allInteractives = parsedCourse ? collectAllInteractives(parsedCourse) : [];

  const totalWarnings = parsedCourse
    ? parsedCourse.warnings.length + parsedCourse.modules.reduce((s, m) => s + m.lessons.reduce((ls, l) => ls + l.warnings.length, 0), 0) + parsedCourse.unmatchedLessons.reduce((s, l) => s + l.warnings.length, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Course</h1>
        <p className="text-muted-foreground mt-1">Upload a WordPress JSON export to create a new course as draft.</p>
      </div>

      {/* Step 1: Select instructor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 1: Select Instructor</CardTitle>
          <CardDescription>Choose which instructor this course will belong to, or assign later.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select an instructor..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ASSIGN_LATER}>
                <span className="text-muted-foreground italic">Assign instructor later</span>
              </SelectItem>
              {instructors.map((inst: any) => (
                <SelectItem key={inst.id} value={inst.id}>
                  {inst.first_name || ""} {inst.last_name || ""} {!inst.first_name && !inst.last_name ? "(No name)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedInstructor === ASSIGN_LATER && (
            <p className="text-xs text-muted-foreground mt-2">
              The course will be temporarily assigned to your admin account. You can reassign it to an instructor from the Draft Courses section before publishing.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Step 1b: Media URL mapping (optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Media URL Mapping (Optional)</CardTitle>
          <CardDescription>
            If you've uploaded WordPress media files to Supabase Storage, paste the base URL here. 
            All <code className="text-xs bg-muted px-1 rounded">wp-content/uploads/</code> paths will be remapped.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 items-end max-w-2xl">
            <div className="flex-1">
              <Label className="text-xs">Supabase Storage Base URL</Label>
              <Input
                placeholder="e.g. https://scxzdhoaclusxlncjazm.supabase.co/storage/v1/object/public/course-media/wp-imports"
                value={mediaBaseUrl}
                onChange={e => setMediaBaseUrl(e.target.value)}
              />
            </div>
            {rawJson && (
              <Button variant="outline" size="sm" onClick={handleReparse}>
                Re-parse
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Leave empty to show red placeholders for all WordPress media. You can upload media to the{" "}
            <code className="bg-muted px-1 rounded">course-media</code> bucket and paste the public URL prefix here.
          </p>
        </CardContent>
      </Card>

      {/* Step 2: Upload JSON */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 2: Upload JSON File</CardTitle>
          <CardDescription>
            Supports Tutor LMS, LearnDash, LearnPress, WP REST API exports, and generic JSON structures.
            H5P interactive content will be automatically detected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <FileJson className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">{fileName || "Click to upload a .json file"}</p>
            <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
          </div>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileUpload} />

          {parsedCourse && (
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Parsed</Badge>
              <Badge variant="outline">{parsedCourse.modules.length} module(s)</Badge>
              <Badge variant="outline">{totalLessons} lesson(s)</Badge>
              {parsedCourse.preview_video_url && <Badge variant="outline">Preview video detected</Badge>}
              {allInteractives.length > 0 && (
                <Badge className="gap-1 bg-blue-600"><Zap className="h-3 w-3" /> {allInteractives.length} H5P interactive(s)</Badge>
              )}
              {totalWarnings > 0 && (
                <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> {totalWarnings} warning(s)</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* H5P Info (read-only) */}
      {allInteractives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Detected Interactive Content
            </CardTitle>
            <CardDescription>
              {allInteractives.length} H5P interactive element(s) were detected. They will be imported as text placeholders that need to be recreated manually using the lesson editor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {allInteractives.map((interactive, idx) => (
              <div key={interactive.id} className="flex items-start gap-3 p-3 border rounded-lg bg-accent/20">
                <Badge variant="outline" className="text-xs shrink-0">#{idx + 1}</Badge>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium">{interactive.suggestedType.charAt(0).toUpperCase() + interactive.suggestedType.slice(1).replace(/([A-Z])/g, " $1")}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Source: <code className="bg-muted px-1 rounded">{interactive.originalUrl}</code>
                  </p>
                  {interactive.contextHint && (
                    <p className="text-xs text-muted-foreground">Context: {interactive.contextHint}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {parsedCourse && (
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setShowPreview(!showPreview)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Import Preview</CardTitle>
              {showPreview ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {showPreview && (
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Course Title</Label>
                <p className="font-semibold text-lg">{parsedCourse.title}</p>
              </div>

              {parsedCourse.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="text-sm line-clamp-3">{parsedCourse.description.replace(/<[^>]*>/g, "").substring(0, 300)}</p>
                </div>
              )}

              {parsedCourse.thumbnail_url && (
                <div>
                  <Label className="text-xs text-muted-foreground">Thumbnail</Label>
                  <p className="text-xs text-muted-foreground truncate">{parsedCourse.thumbnail_url}</p>
                </div>
              )}

              {parsedCourse.preview_video_url && (
                <div>
                  <Label className="text-xs text-muted-foreground">Preview Video</Label>
                  <p className="text-xs text-muted-foreground truncate">{parsedCourse.preview_video_url}</p>
                </div>
              )}

              {parsedCourse.warnings.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-1">
                  <p className="text-sm font-medium text-destructive flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Warnings</p>
                  {parsedCourse.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-destructive/80">&#8226; {w}</p>
                  ))}
                </div>
              )}

              {parsedCourse.modules.map((mod, mi) => (
                <div key={mi} className="border rounded-lg p-3 space-y-2">
                  <p className="font-medium text-sm">📁 {mod.title}</p>
                  {mod.lessons.map((les, li) => (
                    <div key={li} className="ml-4 flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground shrink-0">📄</span>
                      <div className="min-w-0">
                        <p className="truncate">{les.title}</p>
                        {les.video_url && <p className="text-xs text-primary truncate">🎥 {les.video_url}</p>}
                        {les.audio_url && <p className="text-xs text-primary truncate">🎵 {les.audio_url}</p>}
                        {les.detectedInteractives.length > 0 && (
                          <p className="text-xs text-blue-600 flex items-center gap-1">
                            <Zap className="h-3 w-3" /> {les.detectedInteractives.length} interactive element(s) detected
                          </p>
                        )}
                        {les.warnings.length > 0 && les.warnings.map((w, wi) => (
                          <p key={wi} className="text-xs text-destructive">⚠ {w}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {parsedCourse.unmatchedLessons.length > 0 && (
                <div className="border border-destructive/30 rounded-lg p-3 space-y-2">
                  <p className="font-medium text-sm flex items-center gap-1"><Info className="h-4 w-4 text-destructive" /> Lessons without module ({parsedCourse.unmatchedLessons.length})</p>
                  {parsedCourse.unmatchedLessons.map((les, li) => (
                    <div key={li} className="ml-4 flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground shrink-0">📄</span>
                      <div className="min-w-0">
                        <p className="truncate">{les.title}</p>
                        {les.video_url && <p className="text-xs text-primary truncate">🎥 {les.video_url}</p>}
                        {les.audio_url && <p className="text-xs text-primary truncate">🎵 {les.audio_url}</p>}
                        {les.detectedInteractives.length > 0 && (
                          <p className="text-xs text-blue-600 flex items-center gap-1">
                            <Zap className="h-3 w-3" /> {les.detectedInteractives.length} interactive element(s) detected
                          </p>
                        )}
                        {les.warnings.length > 0 && les.warnings.map((w, wi) => (
                          <p key={wi} className="text-xs text-destructive">⚠ {w}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button variant="ghost" size="sm" onClick={() => setShowRawJson(!showRawJson)} className="text-xs">
                {showRawJson ? "Hide" : "Show"} Raw JSON
              </Button>
              {showRawJson && (
                <ScrollArea className="h-48 border rounded-md">
                  <pre className="text-xs p-3 whitespace-pre-wrap break-all">{rawJson.substring(0, 50000)}</pre>
                </ScrollArea>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Step 3: Import */}
      {parsedCourse && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 flex-wrap">
              <Button onClick={handleImport} disabled={importing || !selectedInstructor} className="gap-2" size="lg">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {importing ? "Importing..." : "Import as Draft"}
              </Button>
              {!selectedInstructor && <p className="text-sm text-destructive">Please select an instructor option first.</p>}
            </div>

            {importResult && (
              <div className={`mt-4 p-3 rounded-lg border ${importResult.success ? "bg-accent/30 border-accent" : "bg-destructive/10 border-destructive/30"}`}>
                <p className={`text-sm font-medium ${importResult.success ? "text-foreground" : "text-destructive"}`}>
                  {importResult.success ? <CheckCircle2 className="h-4 w-4 inline mr-1" /> : <AlertTriangle className="h-4 w-4 inline mr-1" />}
                  {importResult.message}
                </p>
                {importResult.success && (
                  <p className="text-xs text-muted-foreground mt-1">The course is now in the Draft Courses section. The assigned instructor can edit it from their dashboard.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
