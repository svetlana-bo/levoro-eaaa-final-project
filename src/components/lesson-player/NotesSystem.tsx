import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, X, Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NotesSystemProps {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
}

export function NotesButton({ courseId, lessonId, lessonTitle }: NotesSystemProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");

  const { data: notes = [] } = useQuery({
    queryKey: ["student-notes", user?.id, courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_notes" as any)
        .select("*")
        .eq("student_id", user!.id)
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const addNote = useMutation({
    mutationFn: async ({ content, selectedText }: { content: string; selectedText?: string }) => {
      const { error } = await supabase.from("student_notes" as any).insert({
        student_id: user!.id,
        course_id: courseId,
        lesson_id: lessonId,
        selected_text: selectedText || null,
        note_content: content,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Note saved!");
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ["student-notes"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from("student_notes" as any).delete().eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-notes"] });
    },
  });

  const sqlNotes = notes.filter((n: any) => n.selected_text?.startsWith("[SQL Exercise]"));
  const lessonNotes = notes.filter((n: any) => n.lesson_id === lessonId);

  const downloadSqlNotes = () => {
    if (sqlNotes.length === 0) return;
    const content = sqlNotes.map((n: any) =>
      `${n.selected_text ? `-- ${n.selected_text}\n` : ""}${n.note_content}\n`
    ).join("\n---\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sql-notes.sql";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <StickyNote className="h-4 w-4" />
          Notes {lessonNotes.length > 0 && `(${lessonNotes.length})`}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[380px] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" /> Notes — {lessonTitle}
          </SheetTitle>
          {sqlNotes.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1 w-fit" onClick={downloadSqlNotes}>
              <Download className="h-3 w-3" /> Download SQL Notes ({sqlNotes.length})
            </Button>
          )}
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
            />
            <Button
              size="sm"
              disabled={!newNote.trim() || addNote.isPending}
              onClick={() => addNote.mutate({ content: newNote })}
              className="gap-1"
            >
              <Plus className="h-3 w-3" /> Save Note
            </Button>
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {lessonNotes.map((note: any) => (
              <div key={note.id} className="border border-border rounded-lg p-3 space-y-1 bg-muted/20">
                {note.selected_text && (
                  <p className="text-xs text-muted-foreground italic border-l-2 border-primary pl-2">
                    "{note.selected_text}"
                  </p>
                )}
                <p className="text-sm">{note.note_content}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deleteNote.mutate(note.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {lessonNotes.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No notes for this lesson yet.</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function TextSelectionPopover({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [popup, setPopup] = useState<{ x: number; y: number; text: string } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showInput, setShowInput] = useState(false);

  const addNote = useMutation({
    mutationFn: async ({ content, selectedText }: { content: string; selectedText: string }) => {
      const { error } = await supabase.from("student_notes" as any).insert({
        student_id: user!.id,
        course_id: courseId,
        lesson_id: lessonId,
        selected_text: selectedText,
        note_content: content,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Note saved!");
      setPopup(null);
      setNoteText("");
      setShowInput(false);
      queryClient.invalidateQueries({ queryKey: ["student-notes"] });
    },
  });

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      if (!showInput) setPopup(null);
      return;
    }
    const text = sel.toString().trim();
    if (text.length < 3) return;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setPopup({ x: rect.left + rect.width / 2, y: rect.top - 10, text });
    setShowInput(false);
    setNoteText("");
  }, [showInput]);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  if (!popup || !user) return null;

  return (
    <div
      className="fixed z-50 bg-card border border-border rounded-lg shadow-lg p-2"
      style={{ left: Math.max(10, popup.x - 120), top: Math.max(10, popup.y - (showInput ? 140 : 40)) }}
    >
      {showInput ? (
        <div className="w-60 space-y-2">
          <p className="text-[10px] text-muted-foreground italic truncate">"{popup.text.slice(0, 60)}"</p>
          <Textarea
            placeholder="Add your note..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={2}
            className="text-xs"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs flex-1" disabled={!noteText.trim()}
              onClick={() => addNote.mutate({ content: noteText, selectedText: popup.text })}>
              Save
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setPopup(null); setShowInput(false); }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setShowInput(true)}>
          <StickyNote className="h-3 w-3" /> Take Note
        </Button>
      )}
    </div>
  );
}
