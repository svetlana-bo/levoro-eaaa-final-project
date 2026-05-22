import { useCallback } from "react";

const DRAFT_KEY = "levoro-course-builder-draft";

export interface CourseDraft {
  title: string;
  description: string;
  thumbnailUrl: string;
  previewVideoUrl?: string;
  courseDetails?: any;
  lessonDrafts: Array<{
    id: string;
    title: string;
    video_url: string;
    audio_url?: string;
    content?: string;
    order_index: number;
    exercises?: any[];
    contentBlocks?: any[];
    module_id?: string | null;
  }>;
  moduleDrafts?: Array<{
    id: string;
    title: string;
    description?: string;
    order_index: number;
  }>;
  inProgressLesson?: {
    title: string;
    video_url: string;
    audio_url?: string;
    contentBlocks: any[];
    module_id: string | null;
    editingDraftId: string | null;
  };
  editingLesson?: {
    lessonId: string;
    courseId: string | null;
    title: string;
    video_url: string;
    audio_url?: string;
    contentBlocks: any[];
  } | null;
  activeView?: "courses" | "builder" | "knowledge-base" | "kb-article" | "students" | "manage-lessons" | "profile" | "analytics";
  selectedCourseId?: string | null;
  builderStep: "details" | "curriculum";
  editingCourseId: string | null;
}

export const useLocalStorageDraft = () => {
  const saveDraft = useCallback((draft: CourseDraft) => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch {}
  }, []);

  const loadDraft = useCallback((): CourseDraft | null => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  return { saveDraft, loadDraft, clearDraft };
};
