import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { safeHtml, sanitizeDialogCardHtml, normalizeRichTextHtml, isDarkColor } from "@/lib/sanitize";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { HelpCircle, ListChecks, ToggleLeft, PenLine, Layers, MessageSquare, RotateCcw, Grid3X3, GripHorizontal, ArrowUpDown, ArrowDownUp, Puzzle, SplitSquareHorizontal, ImageIcon, Check, X, Shuffle, RefreshCcw, Eye, GripVertical, Highlighter, ChevronLeft, ChevronRight, MapPin, Plus, Minus, Info, AlertTriangle, Lightbulb, Hash, ChevronsUpDown, ChevronDown, MousePointerClick, CheckCircle } from "lucide-react";
import {
  ContentBlock, QuizBlock, ChecklistBlock, TrueFalseBlock, FillBlanksBlock, DialogCardsBlock, ReflectionBlock,
  MultimediaChoiceBlock, CrosswordBlock, DragDropBlock, SortParagraphsBlock, SortImagesBlock, MemoryGameBlock, ImageJuxtapositionBlock, DragWordsBlock, FillWordsBlock, FillWordsBlank, FillWordsOption, MarkWordsBlock, QuestionSetBlock, ImageHotspotBlock, FindHotspotBlock, AccordionBlock, ImageReflectionBlock, BranchingScenarioBlock, ImageSliderBlock, FlashcardsBlock, AnswerCardsBlock, SqlExerciseBlock, VideoBlock, TableBlock,
  FeedbackRange, SplitScreenBlock
} from "@/components/lesson-editor/types";
import { QuestionSetPlayer } from "./QuestionSetPlayer";
import { BranchingScenarioPlayer } from "./BranchingScenarioPlayer";
import { useQuestionSetReporter } from "./QuestionSetContext";

/**
 * Helper component used inside Question Set sub-exercises to explicitly
 * report their completion + score (0..1) to the parent QuestionSetPlayer.
 * Outside a Question Set, the reporter is null and this is a no-op.
 * Rendering it conditionally is fine — it's a separate component, so its
 * hooks are isolated and Rules of Hooks are preserved.
 */
function ReportSubmission({ blockId, score01 }: { blockId: string; score01: number }) {
  const report = useQuestionSetReporter();
  useEffect(() => {
    if (report) report(blockId, score01);
  }, [report, blockId, score01]);
  return null;
}

/**
 * Convert RichTextEditor HTML into plain text while preserving paragraph and
 * <br> line breaks. Used by exercises (Fill in the Blanks, Mark the Words)
 * that tokenize raw text but still need authored line breaks to be visible
 * to the learner.
 */
function htmlToPlainTextWithBreaks(html: string): string {
  if (!html) return "";
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*(p|div|h[1-6]|li|blockquote)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ── Crossword Generator ── */
interface PlacedWord { word: string; clue: string; row: number; col: number; direction: "across" | "down"; number: number; isSolution?: boolean; }

interface CrosswordResult { grid: string[][]; placed: PlacedWord[]; solutionCells?: Set<string>; }

function canPlace(grid: string[][], word: string, row: number, col: number, dir: "across" | "down", size: number): boolean {
  for (let i = 0; i < word.length; i++) {
    const r = dir === "across" ? row : row + i;
    const c = dir === "across" ? col + i : col;
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    if (grid[r][c] && grid[r][c] !== word[i]) return false;
    if (!grid[r][c]) {
      if (dir === "across") { if ((r > 0 && grid[r - 1][c]) || (r < size - 1 && grid[r + 1][c])) return false; }
      else { if ((c > 0 && grid[r][c - 1]) || (c < size - 1 && grid[r][c + 1])) return false; }
    }
  }
  if (dir === "across") { if (col > 0 && grid[row][col - 1]) return false; if (col + word.length < size && grid[row][col + word.length]) return false; }
  else { if (row > 0 && grid[row - 1][col]) return false; if (row + word.length < size && grid[row + word.length][col]) return false; }
  return true;
}

function trimGrid(grid: string[][], placed: PlacedWord[], size: number, solutionRow?: number, solutionCol?: number, solutionLen?: number, solutionDir?: "across" | "down"): CrosswordResult {
  let minR = size, maxR = 0, minC = size, maxC = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) { if (grid[r][c]) { minR = Math.min(minR, r); maxR = Math.max(maxR, r); minC = Math.min(minC, c); maxC = Math.max(maxC, c); } }
  if (minR > maxR) return { grid: [], placed: [] };
  const trimmed = grid.slice(minR, maxR + 1).map(row => row.slice(minC, maxC + 1));
  const trimmedPlaced = placed.map(p => ({ ...p, row: p.row - minR, col: p.col - minC }));
  let solutionCells: Set<string> | undefined;
  if (solutionRow !== undefined && solutionCol !== undefined && solutionLen && solutionDir) {
    solutionCells = new Set<string>();
    for (let i = 0; i < solutionLen; i++) {
      const r = (solutionDir === "across" ? solutionRow : solutionRow + i) - minR;
      const c = (solutionDir === "across" ? solutionCol + i : solutionCol) - minC;
      solutionCells.add(`${r}-${c}`);
    }
  }
  return { grid: trimmed, placed: trimmedPlaced, solutionCells };
}

function generateCrosswordGrid(words: { word: string; clue: string }[], solutionWord?: string, solutionDir?: "across" | "down", solutionMappings?: { wordIndex: number; letterIndex: number }[]): CrosswordResult {
  const sorted = [...words].filter(w => w.word.length > 0).sort((a, b) => b.word.length - a.word.length);
  if (sorted.length === 0) return { grid: [], placed: [] };
  const size = 30;
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(""));
  const placed: PlacedWord[] = [];
  let num = 1;

  // Solution word mode with mappings: place solution word, then deterministically place each mapped word
  if (solutionWord && solutionWord.length > 0 && solutionDir && solutionMappings && solutionMappings.length === solutionWord.length && solutionMappings.every(m => m.wordIndex >= 0 && m.letterIndex >= 0)) {
    const solRow = solutionDir === "across" ? Math.floor(size / 2) : Math.floor((size - solutionWord.length) / 2);
    const solCol = solutionDir === "across" ? Math.floor((size - solutionWord.length) / 2) : Math.floor(size / 2);
    // Place solution word in grid
    for (let i = 0; i < solutionWord.length; i++) {
      if (solutionDir === "across") grid[solRow][solCol + i] = solutionWord[i];
      else grid[solRow + i][solCol] = solutionWord[i];
    }

    // Track which words have been placed (by original index in the unfiltered words array)
    const placedWordIndices = new Set<number>();
    const crossDir: "across" | "down" = solutionDir === "across" ? "down" : "across";

    // Place each word according to its mapping
    for (let si = 0; si < solutionMappings.length; si++) {
      const mapping = solutionMappings[si];
      const wordData = words[mapping.wordIndex];
      if (!wordData || !wordData.word || placedWordIndices.has(mapping.wordIndex)) continue;
      placedWordIndices.add(mapping.wordIndex);

      const letterIdx = mapping.letterIndex;
      // The intersection point on the solution word
      const solR = solutionDir === "across" ? solRow : solRow + si;
      const solC = solutionDir === "across" ? solCol + si : solCol;
      // Place the crossing word so its letterIdx-th letter lands on the solution intersection
      const wordRow = crossDir === "across" ? solR : solR - letterIdx;
      const wordCol = crossDir === "across" ? solC - letterIdx : solC;

      for (let i = 0; i < wordData.word.length; i++) {
        const r = crossDir === "across" ? wordRow : wordRow + i;
        const c = crossDir === "across" ? wordCol + i : wordCol;
        if (r >= 0 && r < size && c >= 0 && c < size) grid[r][c] = wordData.word[i];
      }
      placed.push({ word: wordData.word, clue: wordData.clue, row: wordRow, col: wordCol, direction: crossDir, number: num++ });
    }

    // Place remaining words that weren't mapped (try to intersect with placed words)
    for (let wi = 0; wi < words.length; wi++) {
      if (placedWordIndices.has(wi) || !words[wi].word) continue;
      const w = words[wi];
      let bestPos: { row: number; col: number; dir: "across" | "down" } | null = null;
      for (const p of placed) {
        for (let pi = 0; pi < p.word.length; pi++) {
          for (let wi2 = 0; wi2 < w.word.length; wi2++) {
            if (p.word[pi] !== w.word[wi2]) continue;
            const dir: "across" | "down" = p.direction === "across" ? "down" : "across";
            const row = p.direction === "across" ? p.row - wi2 : p.row + pi;
            const col = p.direction === "across" ? p.col + pi : p.col - wi2;
            if (canPlace(grid, w.word, row, col, dir, size)) { bestPos = { row, col, dir }; break; }
          }
          if (bestPos) break;
        }
        if (bestPos) break;
      }
      if (bestPos) {
        const { row, col, dir } = bestPos;
        for (let i = 0; i < w.word.length; i++) { if (dir === "across") grid[row][col + i] = w.word[i]; else grid[row + i][col] = w.word[i]; }
        placed.push({ word: w.word, clue: w.clue, row, col, direction: dir, number: num++ });
      }
    }

    return trimGrid(grid, placed, size, solRow, solCol, solutionWord.length, solutionDir);
  }

  // Default random layout (no solution word)
  const first = sorted[0];
  const startCol = Math.floor((size - first.word.length) / 2);
  const startRow = Math.floor(size / 2);
  for (let i = 0; i < first.word.length; i++) grid[startRow][startCol + i] = first.word[i];
  placed.push({ word: first.word, clue: first.clue, row: startRow, col: startCol, direction: "across", number: num++ });
  for (let wi = 1; wi < sorted.length; wi++) {
    const w = sorted[wi];
    let bestPos: { row: number; col: number; dir: "across" | "down" } | null = null;
    for (const p of placed) {
      for (let pi = 0; pi < p.word.length; pi++) {
        for (let wi2 = 0; wi2 < w.word.length; wi2++) {
          if (p.word[pi] !== w.word[wi2]) continue;
          let row: number, col: number, dir: "across" | "down";
          if (p.direction === "across") { dir = "down"; row = p.row - wi2; col = p.col + pi; }
          else { dir = "across"; row = p.row + pi; col = p.col - wi2; }
          if (canPlace(grid, w.word, row, col, dir, size)) { bestPos = { row, col, dir }; break; }
        }
        if (bestPos) break;
      }
      if (bestPos) break;
    }
    if (bestPos) {
      const { row, col, dir } = bestPos;
      for (let i = 0; i < w.word.length; i++) { if (dir === "across") grid[row][col + i] = w.word[i]; else grid[row + i][col] = w.word[i]; }
      placed.push({ word: w.word, clue: w.clue, row, col, direction: dir, number: num++ });
    }
  }
  return trimGrid(grid, placed, size);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function isEmptyHtml(html?: string): boolean {
  if (!html) return true;
  const stripped = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, "")
    .trim();
  return stripped.length === 0;
}

function ExerciseDescription({ text, icon }: { text?: string; icon?: React.ReactNode }) {
  if (isEmptyHtml(text)) return null;
  if (icon) {
    return (
      <div className="flex items-start gap-2 text-muted-foreground text-left">
        <span className="mt-1 shrink-0">{icon}</span>
        <div className="prose max-w-none text-left [&_*]:text-left" dangerouslySetInnerHTML={safeHtml(text!)} />
      </div>
    );
  }
  return <div className="text-muted-foreground prose max-w-none text-left [&_*]:text-left" dangerouslySetInnerHTML={safeHtml(text!)} />;
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="gap-1.5">
      <RefreshCcw className="h-3.5 w-3.5" /> Retry
    </Button>
  );
}

function ExerciseHeaderImage({ url }: { url?: string }) {
  if (!url) return null;
  return <img src={url} alt="Exercise" className="w-full h-auto rounded-lg mb-3" />;
}

function getScoreFeedback(score: number, feedbackRanges?: FeedbackRange[], passingPercentage?: number): { message: string | null; passed: boolean } {
  const passPct = passingPercentage ?? 0;
  const passed = score >= passPct;
  if (!feedbackRanges || feedbackRanges.length === 0) return { message: null, passed };
  const range = feedbackRanges.find(r => score >= r.min && score <= r.max);
  return { message: range?.message || null, passed };
}

function FeedbackDisplay({ score, feedbackRanges, passingPercentage }: { score: number; feedbackRanges?: FeedbackRange[]; passingPercentage?: number }) {
  const { message, passed } = getScoreFeedback(score, feedbackRanges, passingPercentage);
  const passPct = passingPercentage ?? 0;
  return (
    <div className="space-y-1">
      {message && (
        <p className={`text-base font-medium break-words overflow-wrap-anywhere ${passed ? "text-primary" : "text-destructive"}`}>{message}</p>
      )}
    </div>
  );
}

function normalizeSqlForComparison(query: string): string {
  return query
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--.*$/gm, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/;+$/g, "")
    .toLowerCase();
}

function normalizeSqlRows(rows: string[][]): string[][] {
  return rows.map((row) => row.map((cell) => cell.trim().toLowerCase()));
}

export function BlockRenderer({ blocks, courseId, lessonId, storageScope }: { blocks: ContentBlock[]; courseId?: string; lessonId?: string; storageScope?: string }) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [multiSelectedAnswers, setMultiSelectedAnswers] = useState<Record<string, Set<string>>>({});
  const [revealedQuizzes, setRevealedQuizzes] = useState<Set<string>>(new Set());
  const [quizRevealed, setQuizRevealed] = useState<Set<string>>(new Set());
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [revealedChecklists, setRevealedChecklists] = useState<Set<string>>(new Set());
  const [trueFalseAnswers, setTrueFalseAnswers] = useState<Record<string, boolean | null>>({});
  const [revealedTrueFalse, setRevealedTrueFalse] = useState<Set<string>>(new Set());
  const [fillBlanksInputs, setFillBlanksInputs] = useState<Record<string, string[]>>({});
  const [revealedFillBlanks, setRevealedFillBlanks] = useState<Set<string>>(new Set());
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [dialogCardIndex, setDialogCardIndex] = useState<Record<string, number>>({});
  const reflectionStorageKey = lessonId ? `reflection-texts-${lessonId}${storageScope ? `-${storageScope}` : ''}` : null;
  const reflectionSavedKey = lessonId ? `reflection-saved-${lessonId}${storageScope ? `-${storageScope}` : ''}` : null;
  const exerciseStorageKey = lessonId ? `exercise-state-${lessonId}${storageScope ? `-${storageScope}` : ''}` : null;
  const exerciseHydrated = useRef(false);
  const [reflectionTexts, setReflectionTexts] = useState<Record<string, string>>(() => {
    if (!reflectionStorageKey) return {};
    try { const raw = localStorage.getItem(reflectionStorageKey); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  });
  const [savedReflections, setSavedReflections] = useState<Set<string>>(() => {
    if (!reflectionSavedKey) return new Set();
    try { const raw = localStorage.getItem(reflectionSavedKey); return raw ? new Set(JSON.parse(raw)) : new Set(); } catch { return new Set(); }
  });
  const [mmSelected, setMmSelected] = useState<Record<string, Set<string>>>({});
  const [mmSubmitted, setMmSubmitted] = useState<Set<string>>(new Set());
  const [mmRevealed, setMmRevealed] = useState<Set<string>>(new Set());
  const [crosswordInputs, setCrosswordInputs] = useState<Record<string, Record<string, string>>>({});
  const [crosswordRevealed, setCrosswordRevealed] = useState<Set<string>>(new Set());
  const [ddMatches, setDdMatches] = useState<Record<string, Record<string, string>>>({});
  const [ddRevealed, setDdRevealed] = useState<Set<string>>(new Set());
  const [sortPOrder, setSortPOrder] = useState<Record<string, string[]>>({});
  const [sortPRevealed, setSortPRevealed] = useState<Set<string>>(new Set());
  const [sortPAnswerRevealed, setSortPAnswerRevealed] = useState<Set<string>>(new Set());
  const [sortIOrder, setSortIOrder] = useState<Record<string, string[]>>({});
  const [sortIRevealed, setSortIRevealed] = useState<Set<string>>(new Set());
  const [memoryFlipped, setMemoryFlipped] = useState<Record<string, Set<number>>>({});
  const [memoryMatched, setMemoryMatched] = useState<Record<string, Set<number>>>({});
  const [memoryCards, setMemoryCards] = useState<Record<string, { html?: string; text?: string; imageUrl?: string; bgColor?: string; pairId: string; contentType: "text" | "image" }[]>>({});
  const [juxtaSlider, setJuxtaSlider] = useState<Record<string, number>>({});
  const [dwPlacements, setDwPlacements] = useState<Record<string, Record<string, string>>>({});
  const [dwSubmitted, setDwSubmitted] = useState<Set<string>>(new Set());
  const [dwRevealed, setDwRevealed] = useState<Set<string>>(new Set());
  const [fwSelections, setFwSelections] = useState<Record<string, Record<string, string>>>({});
  const [fwSubmitted, setFwSubmitted] = useState<Set<string>>(new Set());
  const [fwRevealed, setFwRevealed] = useState<Set<string>>(new Set());
  const [mwSelected, setMwSelected] = useState<Record<string, Set<number>>>({});
  const [mwSubmitted, setMwSubmitted] = useState<Set<string>>(new Set());
  const [mwRevealed, setMwRevealed] = useState<Set<string>>(new Set());
  const [hotspotOpen, setHotspotOpen] = useState<Record<string, string | null>>({});
  const [accordionOpen, setAccordionOpen] = useState<Record<string, boolean>>({});
  const [fhFound, setFhFound] = useState<Record<string, Set<string>>>({});
  const [fhRevealed, setFhRevealed] = useState<Set<string>>(new Set());
  const [fhFeedback, setFhFeedback] = useState<Record<string, string | null>>({});
  const [fhMarkers, setFhMarkers] = useState<Record<string, Array<{ id: string; areaId: string; isCorrect: boolean; x: number; y: number; fading: boolean }>>>({});
  const [irInputs, setIrInputs] = useState<Record<string, Record<string, string>>>({});
  const [irSubmitted, setIrSubmitted] = useState<Set<string>>(new Set());
  const [imageSliderIndex, setImageSliderIndex] = useState<Record<string, number>>({});
  const [flashcardIndex, setFlashcardIndex] = useState<Record<string, number>>({});
  const [flashcardAnswers, setFlashcardAnswers] = useState<Record<string, Record<number, string>>>({});
  const [flashcardSubmitted, setFlashcardSubmitted] = useState<Record<string, Set<number>>>({});
  const [answerCardRevealed, setAnswerCardRevealed] = useState<Record<string, Set<string>>>({});
  const [answerCardIndex, setAnswerCardIndex] = useState<Record<string, number>>({});
  const [sqlCode, setSqlCode] = useState<Record<string, string>>({});
  const [sqlResult, setSqlResult] = useState<Record<string, { columns: string[]; rows: string[][]; error?: string }>>({});
  const [sqlRunning, setSqlRunning] = useState<Set<string>>(new Set());
  const [sqlChecked, setSqlChecked] = useState<Record<string, boolean | null>>({});
  const [sqlShowHint, setSqlShowHint] = useState<Set<string>>(new Set());
  const [sqlDbBinary, setSqlDbBinary] = useState<Record<string, Uint8Array>>({});

  type MemoryCardDisplay = { html?: string; text?: string; imageUrl?: string; bgColor?: string; pairId: string; contentType: "text" | "image" };
  const buildMemoryCards = useCallback((ex: MemoryGameBlock): MemoryCardDisplay[] => {
    if (ex.cards && ex.cards.length > 0) {
      return ex.cards.map(c => ({ html: c.html, text: c.text, imageUrl: c.imageUrl, bgColor: c.bgColor, pairId: c.pairId, contentType: c.contentType }));
    }
    return ex.pairs.flatMap((p, i) => [
      { text: p.cardA, pairId: `legacy-${i}`, contentType: "text" as const, bgColor: "#3b82f6" },
      { text: p.cardB, pairId: `legacy-${i}`, contentType: "text" as const, bgColor: "#3b82f6" },
    ]);
  }, []);

  const toggleChecked = (itemId: string) => {
    setCheckedItems(prev => { const n = new Set(prev); n.has(itemId) ? n.delete(itemId) : n.add(itemId); return n; });
  };

  const retryQuiz = (id: string) => {
    setSelectedAnswers(p => { const n = { ...p }; delete n[id]; return n; });
    setMultiSelectedAnswers(p => { const n = { ...p }; delete n[id]; return n; });
    setRevealedQuizzes(p => { const n = new Set(p); n.delete(id); return n; });
    setQuizRevealed(p => { const n = new Set(p); n.delete(id); return n; });
  };
  const retryChecklist = (id: string, items: any[]) => {
    items.forEach(i => setCheckedItems(p => { const n = new Set(p); n.delete(i.id); return n; }));
    setRevealedChecklists(p => { const n = new Set(p); n.delete(id); return n; });
  };
  const retryTrueFalse = (id: string) => {
    setTrueFalseAnswers(p => { const n = { ...p }; delete n[id]; return n; });
    setRevealedTrueFalse(p => { const n = new Set(p); n.delete(id); return n; });
  };
  const retryFillBlanks = (id: string) => {
    setFillBlanksInputs(p => { const n = { ...p }; delete n[id]; return n; });
    setRevealedFillBlanks(p => { const n = new Set(p); n.delete(id); return n; });
  };
  const retryMm = (id: string) => {
    setMmSelected(p => { const n = { ...p }; delete n[id]; return n; });
    setMmSubmitted(p => { const n = new Set(p); n.delete(id); return n; });
    setMmRevealed(p => { const n = new Set(p); n.delete(id); return n; });
  };
  const retryCrossword = (id: string) => {
    setCrosswordInputs(p => { const n = { ...p }; delete n[id]; return n; });
    setCrosswordRevealed(p => { const n = new Set(p); n.delete(id); return n; });
  };
  const retryDd = (id: string) => {
    setDdMatches(p => { const n = { ...p }; delete n[id]; return n; });
    setDdRevealed(p => { const n = new Set(p); n.delete(id); return n; });
  };
  const retrySortP = (id: string, correctOrder: string[]) => {
    setSortPOrder(p => ({ ...p, [id]: shuffle(correctOrder) }));
    setSortPRevealed(p => { const n = new Set(p); n.delete(id); return n; });
    setSortPAnswerRevealed(p => { const n = new Set(p); n.delete(id); return n; });
  };
  // buildMemoryCards moved above early return
  const retrySortI = (id: string, correctOrder: string[]) => {
    setSortIOrder(p => ({ ...p, [id]: shuffle(correctOrder) }));
    setSortIRevealed(p => { const n = new Set(p); n.delete(id); return n; });
  };
  const retryMemory = (id: string, ex: MemoryGameBlock) => {
    setMemoryFlipped(p => ({ ...p, [id]: new Set<number>() }));
    setMemoryMatched(p => ({ ...p, [id]: new Set<number>() }));
    const cardData = buildMemoryCards(ex);
    setMemoryCards(p => ({ ...p, [id]: shuffle(cardData) }));
  };
  const retryReflection = (id: string) => {
    setReflectionTexts(p => { const n = { ...p }; delete n[id]; return n; });
    setSavedReflections(p => { const n = new Set(p); n.delete(id); return n; });
  };

  // Persist reflection data to localStorage
  useEffect(() => {
    if (!reflectionStorageKey) return;
    localStorage.setItem(reflectionStorageKey, JSON.stringify(reflectionTexts));
  }, [reflectionTexts, reflectionStorageKey]);

  useEffect(() => {
    if (!reflectionSavedKey) return;
    localStorage.setItem(reflectionSavedKey, JSON.stringify([...savedReflections]));
  }, [savedReflections, reflectionSavedKey]);

  // Rehydrate reflection state when storage key changes (e.g. lesson navigation)
  useEffect(() => {
    if (!reflectionStorageKey || !reflectionSavedKey) return;
    try { const raw = localStorage.getItem(reflectionStorageKey); setReflectionTexts(raw ? JSON.parse(raw) : {}); } catch { setReflectionTexts({}); }
    try { const raw = localStorage.getItem(reflectionSavedKey); setSavedReflections(raw ? new Set(JSON.parse(raw)) : new Set()); } catch { setSavedReflections(new Set()); }
  }, [reflectionStorageKey, reflectionSavedKey]);

  // Serialize Sets to arrays for JSON storage
  const serializeSet = (s: Set<string>) => [...s];
  const deserializeSet = (a: any) => new Set<string>(Array.isArray(a) ? a : []);
  const deserializeSetRecord = (obj: any): Record<string, Set<string>> => {
    if (!obj || typeof obj !== 'object') return {};
    const result: Record<string, Set<string>> = {};
    for (const [k, v] of Object.entries(obj)) result[k] = new Set(Array.isArray(v) ? v as string[] : []);
    return result;
  };

  // Persist exercise state to localStorage
  useEffect(() => {
    if (!exerciseStorageKey || !exerciseHydrated.current) return;
    const blob: any = {};
    if (Object.keys(selectedAnswers).length) blob.selectedAnswers = selectedAnswers;
    if (Object.keys(multiSelectedAnswers).length) {
      blob.multiSelectedAnswers = Object.fromEntries(Object.entries(multiSelectedAnswers).map(([k, v]) => [k, [...v]]));
    }
    if (revealedQuizzes.size) blob.revealedQuizzes = serializeSet(revealedQuizzes);
    if (quizRevealed.size) blob.quizRevealed = serializeSet(quizRevealed);
    if (Object.keys(trueFalseAnswers).length) blob.trueFalseAnswers = trueFalseAnswers;
    if (revealedTrueFalse.size) blob.revealedTrueFalse = serializeSet(revealedTrueFalse);
    if (Object.keys(fillBlanksInputs).length) blob.fillBlanksInputs = fillBlanksInputs;
    if (revealedFillBlanks.size) blob.revealedFillBlanks = serializeSet(revealedFillBlanks);
    if (Object.keys(dwPlacements).length) blob.dwPlacements = dwPlacements;
    if (dwSubmitted.size) blob.dwSubmitted = serializeSet(dwSubmitted);
    if (dwRevealed.size) blob.dwRevealed = serializeSet(dwRevealed);
    if (Object.keys(fwSelections).length) blob.fwSelections = fwSelections;
    if (fwSubmitted.size) blob.fwSubmitted = serializeSet(fwSubmitted);
    if (fwRevealed.size) blob.fwRevealed = serializeSet(fwRevealed);
    if (Object.keys(mmSelected).length) {
      blob.mmSelected = Object.fromEntries(Object.entries(mmSelected).map(([k, v]) => [k, [...v]]));
    }
    if (mmSubmitted.size) blob.mmSubmitted = serializeSet(mmSubmitted);
    if (mmRevealed.size) blob.mmRevealed = serializeSet(mmRevealed);
    if (Object.keys(blob).length > 0) {
      localStorage.setItem(exerciseStorageKey, JSON.stringify(blob));
    } else {
      localStorage.removeItem(exerciseStorageKey);
    }
  }, [exerciseStorageKey, selectedAnswers, multiSelectedAnswers, revealedQuizzes, quizRevealed,
      trueFalseAnswers, revealedTrueFalse, fillBlanksInputs, revealedFillBlanks,
      dwPlacements, dwSubmitted, dwRevealed, fwSelections, fwSubmitted, fwRevealed, mmSelected, mmSubmitted, mmRevealed]);

  // Rehydrate exercise state when storage key changes
  useEffect(() => {
    if (!exerciseStorageKey) return;
    try {
      const raw = localStorage.getItem(exerciseStorageKey);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.selectedAnswers) setSelectedAnswers(d.selectedAnswers);
        if (d.multiSelectedAnswers) setMultiSelectedAnswers(deserializeSetRecord(d.multiSelectedAnswers));
        if (d.revealedQuizzes) setRevealedQuizzes(deserializeSet(d.revealedQuizzes));
        if (d.quizRevealed) setQuizRevealed(deserializeSet(d.quizRevealed));
        if (d.trueFalseAnswers) setTrueFalseAnswers(d.trueFalseAnswers);
        if (d.revealedTrueFalse) setRevealedTrueFalse(deserializeSet(d.revealedTrueFalse));
        if (d.fillBlanksInputs) setFillBlanksInputs(d.fillBlanksInputs);
        if (d.revealedFillBlanks) setRevealedFillBlanks(deserializeSet(d.revealedFillBlanks));
        if (d.dwPlacements) setDwPlacements(d.dwPlacements);
        if (d.dwSubmitted) setDwSubmitted(deserializeSet(d.dwSubmitted));
        if (d.dwRevealed) setDwRevealed(deserializeSet(d.dwRevealed));
        if (d.fwSelections) setFwSelections(d.fwSelections);
        if (d.fwSubmitted) setFwSubmitted(deserializeSet(d.fwSubmitted));
        if (d.fwRevealed) setFwRevealed(deserializeSet(d.fwRevealed));
        if (d.mmSelected) setMmSelected(deserializeSetRecord(d.mmSelected));
        if (d.mmSubmitted) setMmSubmitted(deserializeSet(d.mmSubmitted));
        if (d.mmRevealed) setMmRevealed(deserializeSet(d.mmRevealed));
      }
    } catch { /* ignore corrupt data */ }
    exerciseHydrated.current = true;
  }, [exerciseStorageKey]);

  useEffect(() => {
    const persistentSqlBlocks = blocks.filter(
      (block): block is SqlExerciseBlock => block.type === "sqlExercise" && !!block.persistentDb
    );
    const missingBlocks = persistentSqlBlocks.filter((block) => !sqlDbBinary[block.id]);
    if (missingBlocks.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        for (const sqlBlock of missingBlocks) {
          const path = `${user.id}/${sqlBlock.id}.sqlite`;
          const { data } = await supabase.storage.from("sql-databases").download(path);
          if (!data || cancelled) continue;
          const binary = new Uint8Array(await data.arrayBuffer());
          if (cancelled) return;
          setSqlDbBinary((prev) => (prev[sqlBlock.id] ? prev : { ...prev, [sqlBlock.id]: binary }));
        }
      } catch {
        // ignore missing saved DBs
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [blocks, sqlDbBinary]);

  if (!blocks.length) return <p className="text-muted-foreground">No content available for this lesson.</p>;

  return (
    <div className="space-y-4">
      {blocks.map((block) => {
        if (block.type === "text") {
          // Strip problematic inline styles and classes from imported content (e.g. ChatGPT, WordPress)
          // Preserve intentional float styles set via the rich text editor
          const cleanImportedHtml = (html: string) => {
            const cleaned = html
              // Only strip float+width from images that also have cursor:grab (imported content marker)
              .replace(/<img[^>]*style="[^"]*cursor\s*:\s*grab[^"]*"[^>]*>/gi, (imgTag) => {
                return imgTag
                  .replace(/float\s*:\s*[^;"]+(;?)/gi, '')
                  .replace(/cursor\s*:\s*grab\s*(;?)/gi, '')
                  .replace(/width\s*:\s*\d+px\s*;?/gi, '');
              })
              // For images that ARE floated (intentional editor float), strip layout
              // properties that fight float behavior (display:block, auto margins, clear).
              .replace(/<img[^>]*style="([^"]*float\s*:\s*(?:left|right)[^"]*)"[^>]*>/gi, (imgTag, styleAttr) => {
                const cleanedStyle = styleAttr
                  .replace(/display\s*:\s*[^;"]+(;?)/gi, '')
                  .replace(/margin-left\s*:\s*auto\s*;?/gi, '')
                  .replace(/margin-right\s*:\s*auto\s*;?/gi, '')
                  .replace(/margin\s*:\s*[^;"]*auto[^;"]*(;?)/gi, '')
                  .replace(/clear\s*:\s*[^;"]+(;?)/gi, '');
                return imgTag.replace(styleAttr, cleanedStyle);
              })
              // Remove cursor: grab from any remaining elements
              .replace(/cursor\s*:\s*grab\s*(;?)/gi, '')
              // Remove ChatGPT dark mode classes that conflict with our prose
              .replace(/\bclass="([^"]*?\b)(dark\b[^"]*?)"/gi, (m, pre, rest) => `class="${pre}${rest.replace(/\bdark\b/g, '').replace(/\bdark:prose-invert\b/g, '')}"`)
              // Strip any leftover editor resize handle artifacts
              .replace(/<div[^>]*class="rte-resize-handle"[^>]*>.*?<\/div>/gi, '')
              // Clean up empty style attributes
              .replace(/style="\s*;?\s*"/gi, '');

            // DOM-based: strip purely presentational layout wrappers (e.g. ChatGPT export
            // markup) so downstream normalization can see the real content as direct
            // children of root. Editor-authored content boxes (with bg/border) don't
            // carry these class names so they're untouched.
            if (typeof document === "undefined") return cleaned;
            const root = document.createElement("div");
            root.innerHTML = cleaned;
            const LAYOUT_CLASS_TOKENS = [
              "markdown", "prose", "agent-turn", "text-message", "markdown-new-styling",
              "wrap-break-word", "dark:prose-invert", "min-h-8", "grow", "empty:hidden",
              "flex", "flex-col", "gap-1", "gap-2", "gap-3", "pb-25", "pb-10",
            ];
            const isLayoutWrapper = (el: Element) => {
              const tag = el.tagName;
              if (tag !== "DIV" && tag !== "ARTICLE" && tag !== "SECTION") return false;
              const cls = (el.getAttribute("class") || "").toLowerCase();
              if (!cls) return tag === "ARTICLE" || tag === "SECTION";
              return LAYOUT_CLASS_TOKENS.some((tok) => cls.includes(tok));
            };
            for (let pass = 0; pass < 8; pass++) {
              const wrappers = Array.from(root.querySelectorAll("div,article,section")).filter(isLayoutWrapper);
              if (!wrappers.length) break;
              wrappers.forEach((el) => {
                const parent = el.parentNode;
                if (!parent) return;
                while (el.firstChild) parent.insertBefore(el.firstChild, el);
                parent.removeChild(el);
              });
            }
            // Unwrap <a> tags that wrap images (legacy WordPress "Link to Media file"
            // imports). Keeps the image, removes the link so inline images are
            // consistently non-clickable across all imported lessons.
            Array.from(root.querySelectorAll("a")).forEach((a) => {
              if (a.querySelector("img")) {
                const parent = a.parentNode;
                if (!parent) return;
                while (a.firstChild) parent.insertBefore(a.firstChild, a);
                parent.removeChild(a);
              }
            });
            return root.innerHTML;
          };

          // DOM-based normalizer:
          //  - Convert <font color> → <span style="color">
          //  - When a styled wrapper contains block elements (h1..h6/p/li/div), push color
          //    onto each block descendant and unwrap the wrapper (prevents <span><h2/></span>).
          //  - Wrap only truly bare top-level text/inline runs in <p>.
          const normalize = (html: string) => {
            if (!html || typeof document === "undefined") return html;
            const root = document.createElement("div");
            root.innerHTML = html;

            const BLOCK_TAGS = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "DIV", "BLOCKQUOTE", "UL", "OL"]);
            const containsBlock = (el: Element) =>
              !!el.querySelector("p,h1,h2,h3,h4,h5,h6,li,div,blockquote,ul,ol");
            const unwrap = (el: Element) => {
              const parent = el.parentNode;
              if (!parent) return;
              while (el.firstChild) parent.insertBefore(el.firstChild, el);
              parent.removeChild(el);
            };

            // 1) <font color|size|face> → <span style="...">
            Array.from(root.querySelectorAll("font")).forEach((font) => {
              const color = font.getAttribute("color");
              const size = font.getAttribute("size");
              const face = font.getAttribute("face");
              if (!color && !size && !face) return;
              const span = document.createElement("span");
              if (color) span.style.color = color;
              if (face) span.style.fontFamily = face;
              if (size) {
                // Map legacy <font size="1..7"> to approximate em sizes
                const sizeMap: Record<string, string> = {
                  "1": "0.75em", "2": "0.89em", "3": "1em",
                  "4": "1.12em", "5": "1.5em", "6": "2em", "7": "3em",
                };
                const mapped = sizeMap[size.replace(/^\+|^-/, "")];
                if (mapped) span.style.fontSize = mapped;
              }
              while (font.firstChild) span.appendChild(font.firstChild);
              font.replaceWith(span);
            });

            // 1b) Repair malformed nested <p> chains: if a <p> directly contains
            // another block-level element, unwrap the outer <p> so its children
            // become siblings (browsers auto-break nested <p>s anyway).
            const NESTED_BLOCK_SELECTOR = "p,h1,h2,h3,h4,h5,h6,div,ul,ol,blockquote";
            for (let pass = 0; pass < 4; pass++) {
              const offenders = Array.from(root.querySelectorAll("p")).filter(
                (p) => !!p.querySelector(NESTED_BLOCK_SELECTOR)
              );
              if (!offenders.length) break;
              offenders.forEach((p) => unwrap(p));
            }

            // 1c) Remove <font> elements that are empty (no text, no media).
            Array.from(root.querySelectorAll("font")).forEach((f) => {
              if (f.querySelector("img,video,iframe,audio,picture,svg")) return;
              if ((f.textContent || "").replace(/\u00a0/g, "").trim()) return;
              f.parentNode?.removeChild(f);
            });

            // 1d) Removed: previously collapsed <ul><ul>...</ul></ul> wrappers,
            // but the editor uses that structure intentionally for indent-only
            // sublists (circle/square levels with no sibling disc item).


            // 1e) Unwrap <p>/<div> wrappers that are direct children of <li> when
            // they only contain inline content. Makes list-item structure
            // deterministic so spacing/indent stays consistent.
            for (let pass = 0; pass < 4; pass++) {
              const wrappers = Array.from(
                root.querySelectorAll<HTMLElement>("li > p, li > div")
              ).filter((w) => !containsBlock(w));
              if (!wrappers.length) break;
              wrappers.forEach((w) => unwrap(w));
            }

            const flatten = () => {
              const wrappers = Array.from(
                root.querySelectorAll<HTMLElement>('span[style*="color"], strong[style*="color"], em[style*="color"], a[style*="color"]')
              );
              let changed = false;
              wrappers.forEach((w) => {
                const color = w.style.color;
                if (!color) return;
                if (containsBlock(w)) {
                  w.querySelectorAll<HTMLElement>("p,h1,h2,h3,h4,h5,h6,li,div,blockquote").forEach((b) => {
                    if (!b.style.color) b.style.color = color;
                  });
                  // Wrap any remaining direct text-node children so their color survives unwrap.
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
                }
              });
              return changed;
            };
            for (let i = 0; i < 4 && flatten(); i++) { /* noop */ }

            // 3) Heal: any heading or paragraph without explicit color/font-size but with a
            //    descendant that has one → hoist the innermost descendant's value onto the block.
            const findDeepestStyled = (el: HTMLElement, prop: "color" | "fontSize"): string => {
              let found = "";
              const walk = (node: HTMLElement) => {
                Array.from(node.children).forEach((c) => {
                  const child = c as HTMLElement;
                  const v = child.style?.[prop];
                  if (v) found = v;
                  walk(child);
                });
              };
              walk(el);
              return found;
            };
            const HEADING_PRESENTATION_PROPS = [
              "font-size",
              "font-family",
              "line-height",
              "margin",
              "margin-top",
              "margin-bottom",
              "margin-left",
              "margin-right",
            ];
            root.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6,p").forEach((b) => {
              const isHeading = /^H[1-6]$/.test(b.tagName);
              if (isHeading) {
                // Headings must follow the platform style — strip presentation styles
                // (color, font-size/family, line-height, margins) on the heading itself
                // and on every descendant so imported/pasted styling cannot override.
                HEADING_PRESENTATION_PROPS.forEach((prop) => b.style.removeProperty(prop));
                b.querySelectorAll<HTMLElement>("[style]").forEach((d) => {
                  HEADING_PRESENTATION_PROPS.forEach((prop) => d.style.removeProperty(prop));
                });
              } else {
                if (!b.style.color) {
                  const c = findDeepestStyled(b, "color");
                  if (c) b.style.color = c;
                }
                if (!b.style.fontSize) {
                  const s = findDeepestStyled(b, "fontSize");
                  if (s) b.style.fontSize = s;
                }
              }
            });

            // 3b) Trim ONLY leading empty blocks (accidental whitespace from pasted content).
            // Do not touch empty blocks between content — those are intentional author spacing.
            const EMPTY_TRIMMABLE_TAGS = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6"]);
            const isEmptyBlock = (node: Node): boolean => {
              if (node.nodeType === Node.TEXT_NODE) {
                return !node.textContent?.replace(/\u00a0/g, "").trim();
              }
              if (node.nodeType !== Node.ELEMENT_NODE) return false;
              const el = node as HTMLElement;
              if (!EMPTY_TRIMMABLE_TAGS.has(el.tagName)) return false;
              if (el.querySelector("img,video,iframe,audio,picture,svg")) return false;
              const text = (el.textContent || "").replace(/\u00a0/g, "").trim();
              return text.length === 0;
            };
            while (root.firstChild && isEmptyBlock(root.firstChild)) {
              root.removeChild(root.firstChild);
            }

            // 4) Wrap only truly bare top-level inline/text runs in <p>.
            const frag = document.createDocumentFragment();
            const nodes = Array.from(root.childNodes);
            let pending: Node[] = [];
            const INLINE = new Set(["SPAN", "STRONG", "EM", "B", "I", "U", "A", "SUB", "SUP", "S", "MARK", "CODE", "BR"]);
            const flush = () => {
              if (!pending.length) return;
              // Skip whitespace-only runs.
              const hasContent = pending.some(
                (n) => (n.nodeType === Node.TEXT_NODE ? !!n.textContent?.trim() : true)
              );
              if (hasContent) {
                const p = document.createElement("p");
                pending.forEach((n) => p.appendChild(n));
                frag.appendChild(p);
              } else {
                pending.forEach((n) => frag.appendChild(n));
              }
              pending = [];
            };
            nodes.forEach((n) => {
              if (n.nodeType === Node.TEXT_NODE) {
                pending.push(n);
                return;
              }
              if (n.nodeType !== Node.ELEMENT_NODE) {
                pending.push(n);
                return;
              }
              const el = n as HTMLElement;
              const tag = el.tagName;
              // If an inline element actually contains a block (rare leftover), treat as block: flush, append.
              if (INLINE.has(tag) && !containsBlock(el)) {
                pending.push(n);
              } else {
                flush();
                frag.appendChild(n);
              }
            });
            flush();
            const out = document.createElement("div");
            out.appendChild(frag);
            return out.innerHTML;
          };

          return <div key={block.id} className="lesson-rich-text max-w-none flow-root" dangerouslySetInnerHTML={safeHtml(normalize(cleanImportedHtml(block.html)))} />;
        }
        if (block.type === "image") {
          return block.url ? <img key={block.id} src={block.url} alt={block.alt || ""} className="rounded-lg max-w-full mx-auto block" style={{ width: `${block.widthPercent || 100}%` }} /> : null;
        }
        if (block.type === "video") {
          const vb = block as VideoBlock;
          if (!vb.url) return null;
          const isYoutube = /youtu\.?be/.test(vb.url);
          const isVimeo = /vimeo/.test(vb.url);
          let embedUrl = vb.url;
          if (isYoutube) {
            const match = vb.url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
            if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`;
          } else if (isVimeo) {
            const match = vb.url.match(/vimeo\.com\/(\d+)/);
            if (match) embedUrl = `https://player.vimeo.com/video/${match[1]}`;
          }
          return (
            <div key={block.id} className="space-y-1">
              {vb.title && <p className="text-sm font-medium text-foreground">{vb.title}</p>}
              <div className="aspect-video bg-muted rounded-xl overflow-hidden border border-border">
                {isYoutube || isVimeo ? (
                  <iframe src={embedUrl} className="w-full h-full" allowFullScreen title={vb.title || "Video"} />
                ) : (
                  <video src={vb.url} controls className="w-full h-full" />
                )}
              </div>
            </div>
          );
        }
        if (block.type === "quiz") {
          const ex = block as QuizBlock;
          const isMulti = ex.multipleChoice ?? false;
          const submitted = revealedQuizzes.has(ex.id);
          const answerRevealed = quizRevealed.has(ex.id);
          const showScore = ex.showScore ?? true;
          const allowRetry = ex.allowRetry ?? true;
          const allowReveal = ex.allowReveal ?? true;
          const onePoint = ex.onePointForAll ?? false;

          const correctOpts = ex.options.filter(o => o.isCorrect);
          const totalCorrect = correctOpts.length;

          // Gather selected options
          const selectedSet = isMulti
            ? (multiSelectedAnswers[ex.id] || new Set<string>())
            : new Set(selectedAnswers[ex.id] ? [selectedAnswers[ex.id]] : []);
          const hasSelection = selectedSet.size > 0;

          // Scoring
          let correctCount = 0;
          let wrongCount = 0;
          if (submitted) {
            selectedSet.forEach(id => {
              const opt = ex.options.find(o => o.id === id);
              if (opt?.isCorrect) correctCount++;
              else wrongCount++;
            });
          }

          // Score percentage calculation
          let scorePct = 0;
          if (submitted && totalCorrect > 0) {
            if (onePoint) {
              // All correct picks selected, no wrong picks selected
              scorePct = (correctCount === totalCorrect && wrongCount === 0) ? 100 : 0;
            } else {
              // Partial scoring: correct picks minus wrong picks, bounded 0-100
              scorePct = Math.max(0, Math.round(((correctCount - wrongCount) / totalCorrect) * 100));
            }
          }

          const toggleMultiOption = (optId: string) => {
            if (submitted) return;
            setMultiSelectedAnswers(prev => {
              const current = new Set(prev[ex.id] || []);
              current.has(optId) ? current.delete(optId) : current.add(optId);
              return { ...prev, [ex.id]: current };
            });
          };

          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-3">
              <ExerciseHeaderImage url={ex.imageUrl} />
              <div className="font-medium flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="prose max-w-none" dangerouslySetInnerHTML={safeHtml(normalizeRichTextHtml(ex.question))} />
              </div>
              <ExerciseDescription text={ex.description} />
              {isMulti && !submitted && <p className="text-xs text-muted-foreground">Select all that apply</p>}
              <div className="space-y-2">
                {ex.options.map(opt => {
                  const selected = selectedSet.has(opt.id);
                  let cls = "border-border bg-background hover:bg-accent";
                  if ((submitted || answerRevealed) && selected && opt.isCorrect) cls = "border-primary bg-primary/10";
                  else if ((submitted || answerRevealed) && selected && !opt.isCorrect) cls = "border-destructive bg-destructive/10";
                  else if (answerRevealed && opt.isCorrect) cls = "border-primary/50 bg-primary/5";

                  const showIndividualFeedback =
                    (ex.individualFeedback ?? false) &&
                    !!opt.feedback?.trim() &&
                    ((submitted && selected) || (answerRevealed && opt.isCorrect));

                  return (
                    <div key={opt.id} className="space-y-2">
                      <button
                        onClick={() => {
                          if (submitted || answerRevealed) return;
                          if (isMulti) {
                            toggleMultiOption(opt.id);
                          } else {
                            setSelectedAnswers(p => ({ ...p, [ex.id]: opt.id }));
                          }
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-colors text-sm flex items-center gap-3 ${cls} ${selected && !submitted && !answerRevealed ? "ring-2 ring-primary/30" : ""}`}
                      >
                        {/* Radio or checkbox indicator */}
                        {isMulti ? (
                          <span className={`flex-shrink-0 h-4 w-4 rounded-sm border ${selected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"} flex items-center justify-center`}>
                            {selected && <Check className="h-3 w-3" />}
                          </span>
                        ) : (
                          <span className={`flex-shrink-0 h-4 w-4 rounded-full border-2 ${selected ? "border-primary" : "border-muted-foreground"} flex items-center justify-center`}>
                            {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                          </span>
                        )}
                        <span className="flex-1">{opt.text}</span>
                        {answerRevealed && opt.isCorrect && <span className="text-primary font-medium text-xs">✓</span>}
                        {(submitted || answerRevealed) && selected && !opt.isCorrect && <span className="text-destructive font-medium text-xs">✗</span>}
                        {(submitted || answerRevealed) && selected && opt.isCorrect && <span className="text-primary font-medium text-xs">✓</span>}
                      </button>
                      {showIndividualFeedback && (
                        <div className="ml-7 p-3 rounded-md border border-border/50 bg-background text-base text-foreground whitespace-pre-wrap">
                          {opt.feedback}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 flex-wrap">
                {!submitted && !answerRevealed && (
                  <Button size="sm" onClick={() => setRevealedQuizzes(p => new Set(p).add(ex.id))} disabled={!hasSelection}>
                    Submit
                  </Button>
                )}
                {!submitted && !answerRevealed && allowReveal && (
                  <Button variant="outline" size="sm" onClick={() => setQuizRevealed(p => new Set(p).add(ex.id))} className="gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> Reveal Answer
                  </Button>
                )}
                {(submitted || answerRevealed) && allowRetry && <RetryButton onClick={() => retryQuiz(ex.id)} />}
                {submitted && !answerRevealed && allowReveal && (
                  <Button variant="outline" size="sm" onClick={() => setQuizRevealed(p => new Set(p).add(ex.id))} className="gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> Reveal Answer
                  </Button>
                )}
              </div>
              {/* Score display */}
              {submitted && showScore && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className={scorePct >= (ex.passingPercentage ?? 0) ? "text-primary" : "text-destructive"}>
                    {onePoint
                      ? (scorePct === 100 ? "✓ Correct" : "✗ Incorrect")
                      : `${correctCount} out of ${totalCorrect} correct`
                    }
                  </span>
                </div>
              )}
              {submitted && <FeedbackDisplay score={scorePct} feedbackRanges={ex.feedbackRanges} passingPercentage={ex.passingPercentage} />}
              {submitted && <ReportSubmission blockId={ex.id} score01={ex.showScore === false ? 1 : scorePct / 100} />}
            </div>
          );
        }
        if (block.type === "checklist") {
          const ex = block as ChecklistBlock;
          const revealed = revealedChecklists.has(ex.id);
          const hasCorrectAnswers = ex.items.some(i => i.isCorrect);
          const correctItems = ex.items.filter(i => i.isCorrect);
          const score = revealed && hasCorrectAnswers
            ? (correctItems.filter(i => checkedItems.has(i.id)).length / Math.max(correctItems.length, 1)) * 100
            : 0;
          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-3">
              <ExerciseHeaderImage url={ex.imageUrl} />
              
              <ExerciseDescription text={ex.description} />
              {hasCorrectAnswers && !revealed && <p className="text-xs text-muted-foreground">Select the correct items:</p>}
              <div className="space-y-2">
                {ex.items.map(item => {
                  const checked = checkedItems.has(item.id);
                  let itemCls = "";
                  if (revealed && hasCorrectAnswers) {
                    if (checked && item.isCorrect) itemCls = "bg-primary/10";
                    else if (checked && !item.isCorrect) itemCls = "bg-destructive/10";
                  }
                  return (
                    <label key={item.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent ${itemCls}`}>
                      <Checkbox checked={checked} onCheckedChange={() => !revealed && toggleChecked(item.id)} disabled={revealed} />
                      <span className={`text-sm ${checked && !hasCorrectAnswers ? "line-through text-muted-foreground" : ""}`}>{item.text}</span>
                      {revealed && checked && item.isCorrect && <span className="text-primary text-xs ml-auto">✓</span>}
                      {revealed && checked && !item.isCorrect && <span className="text-destructive text-xs ml-auto">✗</span>}
                    </label>
                  );
                })}
              </div>
              <div className="flex gap-2">
                {hasCorrectAnswers && !revealed && <Button size="sm" onClick={() => setRevealedChecklists(p => new Set(p).add(ex.id))}>Check Answers</Button>}
                {revealed && <RetryButton onClick={() => retryChecklist(ex.id, ex.items)} />}
              </div>
              {revealed && hasCorrectAnswers && <FeedbackDisplay score={score} feedbackRanges={ex.feedbackRanges} passingPercentage={ex.passingPercentage} />}
              {!hasCorrectAnswers && ex.items.every(i => checkedItems.has(i.id)) && <p className="text-sm text-primary font-medium">All done! ✓</p>}
              {revealed && hasCorrectAnswers && <ReportSubmission blockId={ex.id} score01={(ex as any).showScore === false ? 1 : score / 100} />}
              {!hasCorrectAnswers && ex.items.length > 0 && ex.items.every(i => checkedItems.has(i.id)) && <ReportSubmission blockId={ex.id} score01={1} />}
            </div>
          );
        }
        if (block.type === "trueFalse") {
          const ex = block as TrueFalseBlock;
          const answer = trueFalseAnswers[ex.id];
          const submitted = revealedTrueFalse.has(ex.id);
          const tfRevealed = quizRevealed.has(`tf-${ex.id}`);
          const isCorrect = answer === ex.isTrue;
          const score = submitted ? (isCorrect ? 100 : 0) : 0;
          const labelA = ex.labelTrue || "True";
          const labelB = ex.labelFalse || "False";
          const allowRetry = ex.allowRetry ?? true;
          const allowReveal = ex.allowReveal ?? true;
          const showScore = ex.showScore ?? true;

          const correctLabel = ex.isTrue ? labelA : labelB;
          const feedbackMsg = submitted
            ? (isCorrect ? (ex.feedbackCorrect || null) : (ex.feedbackIncorrect || null))
            : null;

          const btnVariant = (val: boolean) => {
            if (!submitted && !tfRevealed) return answer === val ? "default" : "outline";
            if (tfRevealed && val === ex.isTrue) return "default"; // only highlight correct on explicit reveal
            if (submitted && answer === val && isCorrect) return "default";
            if ((submitted || tfRevealed) && answer === val && !isCorrect) return "destructive";
            return "outline";
          };

          return (
            <div key={ex.id} className="border border-border rounded-xl bg-muted/20 overflow-hidden">
              {ex.imageUrl && (
                <img src={ex.imageUrl} alt="Exercise" className="w-full max-h-96 object-contain bg-transparent block" />
              )}
              <div className="p-5 space-y-3">
                {!isEmptyHtml(ex.statement) ? (
                  <div className="flex items-start gap-2">
                    <ToggleLeft className="h-5 w-5 text-primary mt-1 shrink-0" />
                    <div className="font-medium prose max-w-none" dangerouslySetInnerHTML={safeHtml(normalizeRichTextHtml(ex.statement))} />
                  </div>
                ) : (
                  <div className="flex">
                    <ToggleLeft className="h-5 w-5 text-primary" />
                  </div>
                )}
                <ExerciseDescription text={ex.description} />
                <div className="flex items-center justify-center flex-wrap gap-3">
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button variant={btnVariant(true)} size="sm"
                      onClick={() => {
                        if (submitted || tfRevealed) return;
                        setTrueFalseAnswers(p => ({ ...p, [ex.id]: true }));
                        setRevealedTrueFalse(p => new Set(p).add(ex.id));
                      }}
                      disabled={submitted || tfRevealed}>
                      {labelA}
                      {tfRevealed && ex.isTrue && <span className="ml-1.5">✓</span>}
                    </Button>
                    <Button variant={btnVariant(false)} size="sm"
                      onClick={() => {
                        if (submitted || tfRevealed) return;
                        setTrueFalseAnswers(p => ({ ...p, [ex.id]: false }));
                        setRevealedTrueFalse(p => new Set(p).add(ex.id));
                      }}
                      disabled={submitted || tfRevealed}>
                      {labelB}
                      {tfRevealed && !ex.isTrue && <span className="ml-1.5">✓</span>}
                    </Button>
                  </div>
                  <div className="flex gap-2 justify-center flex-wrap">
                    {!submitted && !tfRevealed && allowReveal && (
                      <Button variant="outline" size="sm" onClick={() => setQuizRevealed(p => new Set(p).add(`tf-${ex.id}`))} className="gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> Reveal Answer
                      </Button>
                    )}
                    {(submitted || tfRevealed) && allowRetry && (
                      <RetryButton onClick={() => {
                        retryTrueFalse(ex.id);
                        setQuizRevealed(p => { const n = new Set(p); n.delete(`tf-${ex.id}`); return n; });
                      }} />
                    )}
                    {submitted && !tfRevealed && allowReveal && (
                      <Button variant="outline" size="sm" onClick={() => setQuizRevealed(p => new Set(p).add(`tf-${ex.id}`))} className="gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> Reveal Answer
                      </Button>
                    )}
                  </div>
                </div>
                {submitted && showScore && (
                  <div className="flex items-center gap-2 font-medium">
                    <span className={isCorrect ? "text-primary" : "text-destructive"}>
                      {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                    </span>
                  </div>
                )}
                {feedbackMsg && (
                  <p className={isCorrect ? "text-primary" : "text-destructive"}>{feedbackMsg}</p>
                )}
                {tfRevealed && (
                  <p className="text-muted-foreground">Correct answer: <span className="font-medium text-foreground">{correctLabel}</span></p>
                )}
                {submitted && <ReportSubmission blockId={ex.id} score01={ex.showScore === false ? 1 : (isCorrect ? 1 : 0)} />}
              </div>
            </div>
          );
        }
        if (block.type === "fillBlanks") {
          const ex = block as FillBlanksBlock;
          const textContent = htmlToPlainTextWithBreaks(ex.text);
          const parts = textContent.split("___");
          const blankCount = parts.length - 1;
          const inputs = fillBlanksInputs[ex.id] || Array(blankCount).fill("");
          const submitted = revealedFillBlanks.has(ex.id);
          const hasInput = inputs.some(v => v.trim().length > 0);

          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-3">
              <ExerciseHeaderImage url={ex.imageUrl} />
              
              <ExerciseDescription text={ex.description} />
              <div className="text-base leading-loose whitespace-pre-line">
                {parts.map((part, i) => (
                  <span key={i}>
                    {part}
                    {i < blankCount && (
                      <input
                        className={`inline-block w-32 border-b-2 mx-1 px-1 text-center outline-none bg-transparent ${
                          submitted ? "border-primary text-primary" : "border-muted-foreground focus:border-primary"
                        } transition-colors`}
                        value={inputs[i] || ""}
                        onChange={(e) => { const next = [...inputs]; next[i] = e.target.value; setFillBlanksInputs(p => ({ ...p, [ex.id]: next })); }}
                        disabled={submitted}
                        placeholder="..."
                      />
                    )}
                  </span>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                {!submitted && (
                  <Button size="sm" onClick={() => setRevealedFillBlanks(p => new Set(p).add(ex.id))} disabled={!hasInput}>
                    Submit
                  </Button>
                )}
                {submitted && <RetryButton onClick={() => retryFillBlanks(ex.id)} />}
              </div>
              {submitted && (
                <p className="text-base text-primary flex items-center gap-1.5 break-words overflow-wrap-anywhere">
                  <Check className="h-4 w-4 shrink-0" /> {ex.completionMessage || "Thank you for your response!"}
                </p>
              )}
              {submitted && <ReportSubmission blockId={ex.id} score01={1} />}
            </div>
          );
        }
        if (block.type === "dialogCards") {
          const ex = block as DialogCardsBlock;
          const cardIndex = dialogCardIndex[ex.id] ?? 0;
          const currentCard = ex.cards[cardIndex];
          const isFlipped = currentCard ? flippedCards.has(currentCard.id) : false;
          const total = ex.cards.length;
          const frontImg = currentCard?.frontImage;
          const backImg = currentCard?.sameImage ? frontImg : currentCard?.backImage;
          const displayImg = isFlipped ? backImg : frontImg;
          const displayText = isFlipped ? currentCard?.back : currentCard?.front;
          const textPosition = currentCard?.textPosition || "below-card";
          const onDarkBg = isDarkColor(currentCard?.bgColor);
          const cardTextColor = onDarkBg ? "text-white" : "text-slate-900";
          const cardTextClasses = `text-center text-base leading-relaxed [&_p]:text-center [&_p]:m-0 [&_p+p]:mt-2 [&_ul]:inline-block [&_ul]:text-left [&_ol]:inline-block [&_ol]:text-left [&_a]:underline`;

          const goTo = (idx: number) => {
            setFlippedCards(prev => { const n = new Set(prev); if (currentCard) n.delete(currentCard.id); return n; });
            setDialogCardIndex(prev => ({ ...prev, [ex.id]: idx }));
          };

          return (
            <div key={ex.id} className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-muted/30 shadow-sm overflow-hidden">
              <ExerciseHeaderImage url={ex.imageUrl} />
              <div className="p-6 space-y-4">
                <ExerciseDescription text={ex.description} />

                {currentCard && (
                  <div className="flex flex-col items-center gap-4">
                    {/* Card with flip – fixed 4:3 aspect ratio */}
                    <div className="w-full max-w-md" style={{ perspective: "1000px" }}>
                      <button
                        onClick={() => setFlippedCards(prev => { const n = new Set(prev); n.has(currentCard.id) ? n.delete(currentCard.id) : n.add(currentCard.id); return n; })}
                        className="relative w-full cursor-pointer"
                        style={{ transformStyle: "preserve-3d", transition: `transform ${ex.flipSpeed === "slow" ? "0.9s" : ex.flipSpeed === "medium" ? "0.75s" : "0.6s"} cubic-bezier(0.16, 1, 0.3, 1)`, transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                      >
                        {/* Front face */}
                        <div
                          className="rounded-xl border border-border/40 shadow-md overflow-hidden aspect-[4/3] flex flex-col"
                          style={{ backgroundColor: currentCard.bgColor || "#ffffff", backfaceVisibility: "hidden" }}
                        >
                        {frontImg ? (
                            <div className="flex-1 min-h-0 flex items-center justify-center p-2 relative">
                              <img src={frontImg} alt="" className="max-w-full max-h-full object-contain rounded" />
                              {textPosition === "on-card" && currentCard.front && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-3 max-h-[60%] overflow-y-auto">
                                  <div className={`${cardTextClasses} text-white`} dangerouslySetInnerHTML={{ __html: sanitizeDialogCardHtml(currentCard.front) }} />
                                </div>
                              )}
                            </div>
                          ) : textPosition === "on-card" ? (
                           <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
                              {currentCard.front && (
                                <div className={`${cardTextClasses} ${cardTextColor} max-w-full`} dangerouslySetInnerHTML={{ __html: sanitizeDialogCardHtml(currentCard.front) }} />
                              )}
                            </div>
                          ) : null}
                          <div className="p-3 flex items-center justify-center shrink-0">
                            <span className={`text-[10px] ${onDarkBg ? "text-white/60" : "text-slate-600/70"} flex items-center gap-1`}><RotateCcw className="h-3 w-3" /> Click to flip</span>
                          </div>
                        </div>
                        {/* Back face */}
                        <div
                          className="absolute inset-0 rounded-xl border border-border/40 shadow-md overflow-hidden aspect-[4/3] flex flex-col"
                          style={{ backgroundColor: currentCard.bgColor || "#ffffff", backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                        >
                          {backImg ? (
                            <div className="flex-1 min-h-0 flex items-center justify-center p-2 relative">
                              <img src={backImg} alt="" className="max-w-full max-h-full object-contain rounded" />
                              {textPosition === "on-card" && currentCard.back && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-3 max-h-[60%] overflow-y-auto">
                                  <div className={`${cardTextClasses} text-white`} dangerouslySetInnerHTML={{ __html: sanitizeDialogCardHtml(currentCard.back) }} />
                                </div>
                              )}
                            </div>
                          ) : textPosition === "on-card" ? (
                            <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
                              {currentCard.back && (
                                <div className={`${cardTextClasses} ${cardTextColor} max-w-full`} dangerouslySetInnerHTML={{ __html: sanitizeDialogCardHtml(currentCard.back) }} />
                              )}
                            </div>
                          ) : null}
                          <div className="p-3 flex items-center justify-center shrink-0">
                            <span className={`text-[10px] ${onDarkBg ? "text-white/60" : "text-slate-600/70"} flex items-center gap-1`}><RotateCcw className="h-3 w-3" /> Click to see front</span>
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Text below the card – only shown when textPosition is "below-card" */}
                    {textPosition === "below-card" && (
                      <div className="w-full max-w-md min-h-[2rem]">
                        {displayText && (
                          <div className={`${cardTextClasses} text-foreground`} dangerouslySetInnerHTML={{ __html: sanitizeDialogCardHtml(displayText) }} />
                        )}
                      </div>
                    )}


                    {/* Navigation */}
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        disabled={cardIndex === 0}
                        onClick={(e) => { e.stopPropagation(); goTo(cardIndex - 1); }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground font-medium tabular-nums">
                        {cardIndex + 1} / {total}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        disabled={cardIndex === total - 1}
                        onClick={(e) => { e.stopPropagation(); goTo(cardIndex + 1); }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Progress dots */}
                    <div className="flex gap-1.5">
                      {ex.cards.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => { e.stopPropagation(); goTo(i); }}
                          className={`h-2 rounded-full transition-all duration-300 ${i === cardIndex ? "w-6 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/40"}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }
        if (block.type === "reflection") {
          const ex = block as ReflectionBlock;
          const saved = savedReflections.has(ex.id);
          const text = reflectionTexts[ex.id] || "";
          const minChars = ex.minChars || 0;
          const meetsMin = text.length >= minChars;
          const rowsMap = { small: 1, medium: 4, large: 8 } as const;
          const rows = rowsMap[ex.inputSize || "medium"] || 4;
          const heightMap = { small: "2rem", medium: "6rem", large: "12rem" } as const;
          const textareaHeight = heightMap[ex.inputSize || "medium"] || "6rem";
          const placeholderText = ex.helpText || "Write your thoughts...";
          return (
            <div key={ex.id} className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-muted/30 shadow-sm overflow-hidden">
              {ex.imageUrl && (
                <img
                  src={ex.imageUrl}
                  alt="Reflection"
                  className="w-full max-h-96 object-contain bg-transparent block"
                />
              )}
              <div className="p-6 space-y-4">
                {!isEmptyHtml(ex.prompt) ? (
                  <div className="flex items-start gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="prose max-w-none pt-1 flex-1 min-w-0" dangerouslySetInnerHTML={safeHtml(ex.prompt)} />
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                )}
                <ExerciseDescription text={ex.description} />
                <Textarea
                  placeholder={placeholderText}
                  value={text}
                  onChange={(e) => setReflectionTexts(p => ({ ...p, [ex.id]: e.target.value }))}
                  rows={rows}
                  disabled={saved}
                  style={{ height: textareaHeight, ...(ex.inputSize === "small" ? { minHeight: "2rem", maxHeight: "2rem", overflow: "hidden" } : {}) }}
                  className={`rounded-xl border-border/50 bg-background/80 transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10 ${ex.inputSize === "small" ? "resize-none py-1" : "resize-none"} ${saved ? "opacity-60 bg-muted/40" : ""}`}
                />
                <div className="flex items-center justify-between pt-1">
                  <span className={`text-xs ${meetsMin ? "text-muted-foreground" : "text-destructive"}`}>
                    {text.length}{minChars > 0 ? ` / ${minChars} min characters` : " characters"}
                  </span>
                  <div className="flex gap-2 items-center">
                    {saved && <RetryButton onClick={() => retryReflection(ex.id)} />}
                    {!saved ? (
                      <Button size="sm" disabled={!text.trim() || !meetsMin} onClick={() => setSavedReflections(p => new Set(p).add(ex.id))} className="rounded-lg px-5">Submit</Button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-primary font-medium">
                        <Check className="h-4 w-4" /> Reflection saved
                      </div>
                    )}
                  </div>
                </div>
                {saved && (ex as any).completionMessage && (
                  <p className="text-primary font-medium break-words overflow-wrap-anywhere">{(ex as any).completionMessage}</p>
                )}
                {saved && <ReportSubmission blockId={ex.id} score01={1} />}
              </div>
            </div>
          );
        }

        /* ── Multimedia Choice ── */
        if (block.type === "multimediaChoice") {
          const ex = block as MultimediaChoiceBlock;
          const isMulti = ex.multipleChoice ?? false;
          const submitted = mmSubmitted.has(ex.id);
          const revealed = mmRevealed.has(ex.id);
          const showScore = ex.showScore ?? true;
          const allowRetry = ex.allowRetry ?? true;
          const allowReveal = ex.allowReveal ?? true;
          const selected = mmSelected[ex.id] || new Set<string>();
          const cols = ex.columnsPerRow ?? 3;

          const correctOptions = ex.options.filter(o => o.isCorrect);
          const totalCorrect = correctOptions.length;

          // Scoring
          let scorePct = 0;
          let correctCount = 0;
          let wrongCount = 0;
          if (submitted) {
            correctCount = [...selected].filter(id => ex.options.find(o => o.id === id)?.isCorrect).length;
            wrongCount = [...selected].filter(id => !ex.options.find(o => o.id === id)?.isCorrect).length;
            if (ex.onePointForAll) {
              const passPct = ex.passingPercentage ?? 0;
              if (passPct === 0) {
                scorePct = 100;
              } else {
                scorePct = (correctCount === totalCorrect && wrongCount === 0) ? 100 : 0;
              }
            } else {
              scorePct = totalCorrect > 0 ? Math.max(0, Math.round(((correctCount - wrongCount) / totalCorrect) * 100)) : 0;
            }
          }

          const toggleOption = (optId: string) => {
            if (submitted || revealed) return;
            setMmSelected(prev => {
              const current = new Set(prev[ex.id] || []);
              if (isMulti) {
                current.has(optId) ? current.delete(optId) : current.add(optId);
              } else {
                if (current.has(optId)) { current.clear(); } else { current.clear(); current.add(optId); }
              }
              return { ...prev, [ex.id]: current };
            });
          };

          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-4">
              <ExerciseHeaderImage url={ex.imageUrl} />
              <div className="font-medium prose max-w-none" dangerouslySetInnerHTML={safeHtml(normalizeRichTextHtml(ex.question))} />
              <ExerciseDescription text={ex.description} />

              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                {ex.options.map(opt => {
                  const isSelected = selected.has(opt.id);
                  let ringCls = "ring-transparent";
                  let overlayContent: React.ReactNode = null;

                  if (submitted || revealed) {
                    if (isSelected && opt.isCorrect) {
                      ringCls = "ring-primary";
                      overlayContent = <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check className="h-3.5 w-3.5" /></div>;
                    } else if (isSelected && !opt.isCorrect) {
                      ringCls = "ring-destructive";
                      overlayContent = <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"><X className="h-3.5 w-3.5" /></div>;
                    } else if (revealed && !isSelected && opt.isCorrect) {
                      ringCls = "ring-primary/40";
                      overlayContent = <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center"><Check className="h-3.5 w-3.5" /></div>;
                    }
                  } else if (isSelected) {
                    ringCls = "ring-primary";
                    overlayContent = <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check className="h-3.5 w-3.5" /></div>;
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleOption(opt.id)}
                      disabled={submitted || revealed}
                      className={`relative rounded-xl overflow-hidden border border-border ring-2 ${ringCls} transition-all hover:shadow-md text-left disabled:cursor-default`}
                    >
                      {opt.imageUrl && <img src={opt.imageUrl} alt={opt.label || ""} className="w-full aspect-square object-contain bg-white" />}
                      {opt.label && <p className="text-xs text-center p-2 font-medium">{opt.label}</p>}
                      {overlayContent}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 flex-wrap">
                {!submitted && !revealed && (
                  <Button size="sm" onClick={() => setMmSubmitted(p => new Set(p).add(ex.id))} disabled={selected.size === 0}>
                    Submit
                  </Button>
                )}
                {!submitted && !revealed && allowReveal && (
                  <Button variant="outline" size="sm" onClick={() => setMmRevealed(p => new Set(p).add(ex.id))} className="gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> Reveal Answer
                  </Button>
                )}
                {(submitted || revealed) && allowRetry && <RetryButton onClick={() => retryMm(ex.id)} />}
                {submitted && !revealed && allowReveal && (
                  <Button variant="outline" size="sm" onClick={() => setMmRevealed(p => new Set(p).add(ex.id))} className="gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> Reveal Answer
                  </Button>
                )}
              </div>

              {submitted && showScore && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className={scorePct >= (ex.passingPercentage ?? 0) ? "text-primary" : "text-destructive"}>
                    {correctCount} out of {totalCorrect} correct
                  </span>
                </div>
              )}
              {submitted && <FeedbackDisplay score={scorePct} feedbackRanges={ex.feedbackRanges} passingPercentage={ex.passingPercentage} />}
              {submitted && <ReportSubmission blockId={ex.id} score01={ex.showScore === false ? 1 : scorePct / 100} />}
            </div>
          );
        }

        /* ── Crossword ── */
        if (block.type === "crossword") {
          const ex = block as CrosswordBlock;
          const hasSolution = !!ex.solutionWord && ex.solutionWord.length > 0;
          const solDir = ex.solutionDirection || "across";
          const { grid, placed, solutionCells } = generateCrosswordGrid(
            ex.words.map(w => ({ word: w.word, clue: w.clue })),
            hasSolution ? ex.solutionWord : undefined,
            hasSolution ? solDir : undefined,
            hasSolution ? ex.solutionMappings : undefined
          );
          const revealed = crosswordRevealed.has(ex.id);
          const inputs = crosswordInputs[ex.id] || {};
          const numberMap: Record<string, number> = {};
          for (const p of placed) numberMap[`${p.row}-${p.col}`] = p.number;

          // Build direction map
          const directionMap: Record<string, "across" | "down"> = {};
          for (const p of placed) {
            for (let i = 0; i < p.word.length; i++) {
              const r = p.direction === "across" ? p.row : p.row + i;
              const c = p.direction === "across" ? p.col + i : p.col;
              const key = `${r}-${c}`;
              if (i === 0 || !directionMap[key]) directionMap[key] = p.direction;
            }
          }
          // Also add solution word direction to the map for cells that only belong to the solution
          if (hasSolution && solutionCells) {
            solutionCells.forEach(key => {
              if (!directionMap[key]) directionMap[key] = solDir;
            });
          }

          let totalCells = 0, correctCells = 0;
          if (revealed) {
            grid.forEach((row, ri) => row.forEach((cell, ci) => {
              if (cell) { totalCells++; if ((inputs[`${ri}-${ci}`] || "").toUpperCase() === cell) correctCells++; }
            }));
          }
          const score = revealed && totalCells > 0 ? (correctCells / totalCells) * 100 : 0;
          const bgColor = ex.bgColor || "#f0f4f8";

          // Check if solution word is fully revealed
          const solutionRevealed = hasSolution && solutionCells ? Array.from(solutionCells).every(key => {
            const [r, c] = key.split("-").map(Number);
            return grid[r] && grid[r][c] && (inputs[key] || "").toUpperCase() === grid[r][c];
          }) : false;

          const handleCrosswordInput = (ri: number, ci: number, val: string) => {
            const v = val.toUpperCase();
            const key = `${ri}-${ci}`;
            setCrosswordInputs(p => ({ ...p, [ex.id]: { ...(p[ex.id] || {}), [key]: v } }));
            if (v) {
              const dir = directionMap[key];
              const nextR = dir === "down" ? ri + 1 : ri;
              const nextC = dir === "across" ? ci + 1 : ci;
              const nextKey = `${nextR}-${nextC}`;
              const nextInput = document.querySelector<HTMLInputElement>(`[data-crossword-cell="${ex.id}-${nextKey}"]`);
              if (nextInput) nextInput.focus();
            }
          };

          const handleCrosswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, ri: number, ci: number) => {
            if (e.key === "Backspace") {
              const key = `${ri}-${ci}`;
              const current = inputs[key] || "";
              if (!current) {
                const dir = directionMap[key];
                const prevR = dir === "down" ? ri - 1 : ri;
                const prevC = dir === "across" ? ci - 1 : ci;
                const prevInput = document.querySelector<HTMLInputElement>(`[data-crossword-cell="${ex.id}-${prevR}-${prevC}"]`);
                if (prevInput) { prevInput.focus(); e.preventDefault(); }
              }
            }
          };

          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-4">
              <ExerciseHeaderImage url={ex.imageUrl} />
              
              <ExerciseDescription text={ex.description} />
              {hasSolution && ex.solutionHint && (
                <p className="text-sm text-muted-foreground italic text-center">💡 {ex.solutionHint}</p>
              )}
              {grid.length > 0 ? (
                <>
                  <div className="flex justify-center">
                    <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: bgColor }}>
                      <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${grid[0].length}, 2.25rem)` }}>
                        {grid.map((row, ri) => row.map((cell, ci) => {
                          const key = `${ri}-${ci}`;
                          const num = numberMap[key];
                          const isSolCell = solutionCells?.has(key);
                          if (!cell) return <div key={key} className="w-9 h-9" />;
                          const userVal = inputs[key] || "";
                          const isCorrect = revealed && userVal.toUpperCase() === cell;
                          const solCellCorrect = isSolCell && userVal.toUpperCase() === cell;
                          return (
                            <div key={key} className={`relative w-9 h-9 rounded-[3px] shadow-sm transition-colors ${
                              revealed
                                ? (isCorrect ? "ring-2 ring-primary/40 bg-primary/5" : "ring-2 ring-destructive/40 bg-destructive/5")
                                : isSolCell
                                  ? (solCellCorrect ? "bg-primary/10 ring-2 ring-primary/50" : "bg-accent/30 ring-1 ring-accent")
                                  : "bg-white hover:ring-2 hover:ring-primary/30"
                            }`}>
                              {num && <span className="absolute top-[1px] left-[3px] text-[7px] font-semibold text-muted-foreground/70 leading-none select-none">{num}</span>}
                              <input
                                data-crossword-cell={`${ex.id}-${key}`}
                                className="w-full h-full text-center text-sm font-bold uppercase bg-transparent outline-none cursor-pointer focus:ring-2 focus:ring-primary rounded-[3px]"
                                maxLength={1}
                                value={revealed ? cell : userVal}
                                disabled={revealed}
                                onChange={(e) => handleCrosswordInput(ri, ci, e.target.value)}
                                onKeyDown={(e) => handleCrosswordKeyDown(e, ri, ci)}
                              />
                            </div>
                          );
                        }))}
                      </div>
                    </div>
                  </div>

                  {hasSolution && solutionRevealed && (
                    <p className="text-sm font-semibold text-primary text-center animate-fade-in">🎉 Solution: {ex.solutionWord}</p>
                  )}

                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Across</p>
                      {placed.filter(p => p.direction === "across").map(p => (
                        <div key={p.number} className="flex gap-2 py-0.5">
                          <span className="font-bold text-primary min-w-[1.5rem]">{p.number}.</span>
                          <span className="prose prose-sm max-w-none" dangerouslySetInnerHTML={safeHtml(p.clue)} />
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Down</p>
                      {placed.filter(p => p.direction === "down").map(p => (
                        <div key={p.number} className="flex gap-2 py-0.5">
                          <span className="font-bold text-primary min-w-[1.5rem]">{p.number}.</span>
                          <span className="prose prose-sm max-w-none" dangerouslySetInnerHTML={safeHtml(p.clue)} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!revealed && <Button size="sm" onClick={() => setCrosswordRevealed(p => new Set(p).add(ex.id))}>Reveal Answers</Button>}
                    {revealed && <RetryButton onClick={() => retryCrossword(ex.id)} />}
                  </div>
                  {revealed && <FeedbackDisplay score={score} feedbackRanges={ex.feedbackRanges} passingPercentage={ex.passingPercentage} />}
                  {revealed && <ReportSubmission blockId={ex.id} score01={(ex as any).showScore === false ? 1 : score / 100} />}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No words to display.</p>
              )}
            </div>
          );
        }

        /* ── Drag & Drop ── */
        if (block.type === "dragDrop") {
          const ex = block as DragDropBlock;
          const revealed = ddRevealed.has(ex.id);
          const matches = ddMatches[ex.id] || {};
          const shuffledRight = shuffle(ex.pairs.map(p => ({ id: p.id, right: p.right })));
          const usedRights = new Set(Object.values(matches));
          const correctCount = revealed ? ex.pairs.filter(p => matches[p.id] === p.right).length : 0;
          const score = revealed && ex.pairs.length > 0 ? (correctCount / ex.pairs.length) * 100 : 0;
          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-4">
              <ExerciseHeaderImage url={ex.imageUrl} />
              
              <ExerciseDescription text={ex.description} />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Items</p>
                  {ex.pairs.map(pair => {
                    const matchedRight = matches[pair.id];
                    const isCorrect = revealed && matchedRight === pair.right;
                    return (
                      <div key={pair.id}
                        className={`p-3 rounded-lg border text-sm ${revealed ? (isCorrect ? "border-primary bg-primary/10" : "border-destructive bg-destructive/10") : "border-border bg-background"}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { if (revealed) return; const rightText = e.dataTransfer.getData("text/plain"); setDdMatches(p => ({ ...p, [ex.id]: { ...(p[ex.id] || {}), [pair.id]: rightText } })); }}>
                        <span>{pair.left}</span>
                        {matchedRight && (
                          <span className="ml-2 px-2 py-0.5 rounded bg-accent text-xs">
                            → {matchedRight}
                            {!revealed && <button className="ml-1 text-destructive" onClick={() => { const next = { ...(ddMatches[ex.id] || {}) }; delete next[pair.id]; setDdMatches(p => ({ ...p, [ex.id]: next })); }}>×</button>}
                          </span>
                        )}
                        {revealed && !isCorrect && <span className="text-xs text-destructive ml-2">✗</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Drag these to match</p>
                  {shuffledRight.filter(r => !usedRights.has(r.right)).map(r => (
                    <div key={r.id} draggable={!revealed} onDragStart={(e) => e.dataTransfer.setData("text/plain", r.right)}
                      className={`p-3 rounded-lg border border-border bg-background text-sm cursor-grab active:cursor-grabbing hover:bg-accent ${revealed ? "opacity-50" : ""}`}>{r.right}</div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {!revealed && <Button size="sm" onClick={() => setDdRevealed(p => new Set(p).add(ex.id))} disabled={Object.keys(matches).length < ex.pairs.length}>Check Answers</Button>}
                {revealed && <RetryButton onClick={() => retryDd(ex.id)} />}
              </div>
              {revealed && <FeedbackDisplay score={score} feedbackRanges={ex.feedbackRanges} passingPercentage={ex.passingPercentage} />}
              {revealed && <ReportSubmission blockId={ex.id} score01={(ex as any).showScore === false ? 1 : score / 100} />}
            </div>
          );
        }

        /* ── Sort Paragraphs ── */
        if (block.type === "sortParagraphs") {
          const ex = block as SortParagraphsBlock;
          const revealed = sortPRevealed.has(ex.id);
          const answerRevealed = sortPAnswerRevealed.has(ex.id);
          const allowReveal = ex.allowReveal ?? false;
          const correctOrder = ex.paragraphs.map(p => p.id);
          if (!sortPOrder[ex.id]) { setTimeout(() => setSortPOrder(p => ({ ...p, [ex.id]: shuffle(correctOrder) })), 0); }
          const currentOrder = answerRevealed ? correctOrder : (sortPOrder[ex.id] || correctOrder);
          const paragraphMap = Object.fromEntries(ex.paragraphs.map(p => [p.id, p.text]));
          const isChecked = revealed || answerRevealed;
          const correctCount = isChecked ? currentOrder.filter((id, i) => id === correctOrder[i]).length : 0;
          const score = isChecked && correctOrder.length > 0 ? (correctCount / correctOrder.length) * 100 : 0;

          const handleDragStart = (e: React.DragEvent, idx: number) => {
            if (isChecked) return;
            e.dataTransfer.setData("text/plain", String(idx));
            e.dataTransfer.effectAllowed = "move";
          };
          const handleDrop = (e: React.DragEvent, targetIdx: number) => {
            e.preventDefault();
            if (isChecked) return;
            const sourceIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
            if (isNaN(sourceIdx) || sourceIdx === targetIdx) return;
            const next = [...currentOrder];
            const [moved] = next.splice(sourceIdx, 1);
            next.splice(targetIdx, 0, moved);
            setSortPOrder(p => ({ ...p, [ex.id]: next }));
          };
          const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };

          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-3">
              <ExerciseHeaderImage url={ex.imageUrl} />
              
              <ExerciseDescription text={ex.description} />
              {!isChecked && <p className="text-xs text-muted-foreground">Drag and drop to sort the paragraphs in the correct order.</p>}
              <div className="space-y-2">
                {currentOrder.map((id, i) => {
                  const isCorrect = isChecked && id === correctOrder[i];
                  return (
                    <div
                      key={id}
                      draggable={!isChecked}
                      onDragStart={(e) => handleDragStart(e, i)}
                      onDrop={(e) => handleDrop(e, i)}
                      onDragOver={handleDragOver}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${
                        isChecked
                          ? (isCorrect ? "border-primary bg-primary/10" : "border-destructive bg-destructive/10")
                          : "border-border bg-background hover:border-primary/50 cursor-grab active:cursor-grabbing"
                      }`}
                    >
                      <span className="text-xs text-muted-foreground w-6 shrink-0">{i + 1}.</span>
                      <span className="flex-1 min-w-0 prose prose-sm max-w-none break-words" dangerouslySetInnerHTML={safeHtml(paragraphMap[id])} />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 justify-end">
                {!isChecked && <Button size="sm" onClick={() => setSortPRevealed(p => new Set(p).add(ex.id))}>Check Order</Button>}
                {!isChecked && allowReveal && (
                  <Button variant="outline" size="sm" onClick={() => setSortPAnswerRevealed(p => new Set(p).add(ex.id))} className="gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> Reveal Answer
                  </Button>
                )}
                {isChecked && <RetryButton onClick={() => retrySortP(ex.id, correctOrder)} />}
              </div>
              {isChecked && <FeedbackDisplay score={score} feedbackRanges={ex.feedbackRanges} passingPercentage={ex.passingPercentage} />}
              {isChecked && <ReportSubmission blockId={ex.id} score01={(ex as any).showScore === false ? 1 : score / 100} />}
            </div>
          );
        }

        /* ── Sort Images ── */
        if (block.type === "sortImages") {
          const ex = block as SortImagesBlock;
          const revealed = sortIRevealed.has(ex.id);
          const correctOrder = ex.images.map(img => img.id);
          if (!sortIOrder[ex.id]) { setTimeout(() => setSortIOrder(p => ({ ...p, [ex.id]: shuffle(correctOrder) })), 0); }
          const currentOrder = sortIOrder[ex.id] || correctOrder;
          const imageMap = Object.fromEntries(ex.images.map(img => [img.id, img]));
          const correctCount = revealed ? currentOrder.filter((id, i) => id === correctOrder[i]).length : 0;
          const score = revealed && correctOrder.length > 0 ? (correctCount / correctOrder.length) * 100 : 0;
          const cols = ex.columnsPerRow || 3;

          const handleDragStart = (e: React.DragEvent, idx: number) => {
            if (revealed) return;
            e.dataTransfer.setData("text/plain", String(idx));
            e.dataTransfer.effectAllowed = "move";
          };
          const handleDrop = (e: React.DragEvent, targetIdx: number) => {
            e.preventDefault();
            if (revealed) return;
            const sourceIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
            if (isNaN(sourceIdx) || sourceIdx === targetIdx) return;
            const next = [...currentOrder];
            const [moved] = next.splice(sourceIdx, 1);
            next.splice(targetIdx, 0, moved);
            setSortIOrder(p => ({ ...p, [ex.id]: next }));
          };
          const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };

          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-3">
              <ExerciseHeaderImage url={ex.imageUrl} />
              
              <ExerciseDescription text={ex.description} />
              {!revealed && <p className="text-xs text-muted-foreground">Drag and drop images to sort them in the correct order.</p>}
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {currentOrder.map((id, i) => {
                  const img = imageMap[id]; if (!img) return null;
                  const isCorrect = revealed && id === correctOrder[i];
                  return (
                    <div
                      key={id}
                      draggable={!revealed}
                      onDragStart={(e) => handleDragStart(e, i)}
                      onDrop={(e) => handleDrop(e, i)}
                      onDragOver={handleDragOver}
                      className={`rounded-xl overflow-hidden border transition-all ${
                        revealed
                          ? (isCorrect ? "border-primary ring-2 ring-primary" : "border-destructive ring-2 ring-destructive")
                          : "border-border hover:border-primary/50 cursor-grab active:cursor-grabbing"
                      }`}
                    >
                      {img.url && (
                        <div className="relative bg-white" style={{ aspectRatio: "1 / 1" }}>
                          <img src={img.url} alt={img.label || ""} className="absolute inset-0 w-full h-full object-contain p-1" />
                        </div>
                      )}
                      <div className="p-2 text-center">
                        <span className="text-xs font-medium">{img.label || `#${i + 1}`}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                {!revealed && <Button size="sm" onClick={() => setSortIRevealed(p => new Set(p).add(ex.id))}>Check Order</Button>}
                {revealed && <RetryButton onClick={() => retrySortI(ex.id, correctOrder)} />}
              </div>
              {revealed && <FeedbackDisplay score={score} feedbackRanges={ex.feedbackRanges} passingPercentage={ex.passingPercentage} />}
              {revealed && <ReportSubmission blockId={ex.id} score01={(ex as any).showScore === false ? 1 : score / 100} />}
            </div>
          );
        }

        /* ── Memory Cards ── */
        if (block.type === "memoryGame") {
          const ex = block as MemoryGameBlock;
          if (!memoryCards[ex.id]) {
            const cardData = buildMemoryCards(ex);
            setTimeout(() => setMemoryCards(p => ({ ...p, [ex.id]: shuffle(cardData) })), 0);
          }
          const cards = memoryCards[ex.id] || [];
          const flipped = memoryFlipped[ex.id] || new Set<number>();
          const matched = memoryMatched[ex.id] || new Set<number>();
          const allMatched = matched.size === cards.length && cards.length > 0;
          const cols = ex.gridColumns || 4;
          const handleFlip = (idx: number) => {
            if (flipped.has(idx) || matched.has(idx) || flipped.size >= 2) return;
            const newFlipped = new Set(flipped); newFlipped.add(idx);
            setMemoryFlipped(p => ({ ...p, [ex.id]: newFlipped }));
            if (newFlipped.size === 2) {
              const [a, b] = Array.from(newFlipped);
              setTimeout(() => {
                if (cards[a].pairId === cards[b].pairId) {
                  setMemoryMatched(p => { const nm = new Set(p[ex.id] || new Set<number>()); nm.add(a); nm.add(b); return { ...p, [ex.id]: nm }; });
                }
                setMemoryFlipped(p => ({ ...p, [ex.id]: new Set<number>() }));
              }, 800);
            }
          };
          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-3">
              <ExerciseHeaderImage url={ex.imageUrl} />
              
              <ExerciseDescription text={ex.description} />
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, perspective: "1000px" }}>
                {cards.map((card, i) => {
                  const isFlipped = flipped.has(i) || matched.has(i);
                  return (
                    <button key={i} onClick={() => handleFlip(i)}
                      className={`aspect-square relative ${!isFlipped && !matched.has(i) ? "hover:scale-[1.02] cursor-pointer" : ""}`}
                      style={{ transformStyle: "preserve-3d", transition: "transform 0.6s ease", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
                      disabled={matched.has(i)}
                    >
                      {/* Back face (visible when not flipped) */}
                      <div className={`absolute inset-0 rounded-lg border overflow-hidden ${matched.has(i) ? "ring-2 ring-primary border-primary" : "border-border"}`}
                        style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                        {ex.backImage ? (
                          <img src={ex.backImage} alt="Card back" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/80 flex items-center justify-center text-primary-foreground text-2xl font-bold">?</div>
                        )}
                      </div>
                      {/* Front face (visible when flipped) */}
                      <div className={`absolute inset-0 rounded-lg border overflow-hidden ${matched.has(i) ? "ring-2 ring-primary border-primary" : "border-border"}`}
                        style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", backgroundColor: card.contentType === "text" ? (card.bgColor || "#3b82f6") : undefined }}>
                        {card.contentType === "image" && card.imageUrl ? (
                          <img src={card.imageUrl} alt="Card" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-2 text-white text-sm font-medium"
                            dangerouslySetInnerHTML={safeHtml(card.html || card.text || "")}
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                {allMatched && <p className="text-base text-primary font-medium break-words overflow-wrap-anywhere">{ex.completionMessage || "All pairs matched! 🎉"}</p>}
                {allMatched && <RetryButton onClick={() => retryMemory(ex.id, ex)} />}
              </div>
              {allMatched && <ReportSubmission blockId={ex.id} score01={1} />}
            </div>
          );
        }

        /* ── Image Juxtaposition ── */
        if (block.type === "imageJuxtaposition") {
          const ex = block as ImageJuxtapositionBlock;
          const sliderVal = juxtaSlider[ex.id] ?? 50;
          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-3">
              <ExerciseHeaderImage url={ex.imageUrl} />
              
              <ExerciseDescription text={ex.description} />
              {ex.imageBefore && ex.imageAfter ? (
                <div className="space-y-3">
                  <div className="relative w-full overflow-hidden rounded-lg bg-muted" style={{ maxWidth: "560px", margin: "0 auto" }}>
                    {/* "After" image — sets natural aspect ratio */}
                    <img src={ex.imageAfter} alt={ex.labelAfter || "After"} className="block w-full h-auto" />
                    {/* "Before" image — same size, clipped from the right */}
                    <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderVal}% 0 0)` }}>
                      <img src={ex.imageBefore} alt={ex.labelBefore || "Before"} className="block w-full h-full object-cover" />
                    </div>
                    {/* Slider divider line */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-ew-resize" style={{ left: `${sliderVal}%` }} />
                    {ex.labelBefore && <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">{ex.labelBefore}</span>}
                    {ex.labelAfter && <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">{ex.labelAfter}</span>}
                  </div>
                  <div style={{ maxWidth: "560px", margin: "0 auto" }}>
                    <Slider value={[sliderVal]} onValueChange={([v]) => setJuxtaSlider(p => ({ ...p, [ex.id]: v }))} min={0} max={100} step={1} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Both images are required.</p>
              )}
            </div>
          );
        }

        /* ── Drag the Words ── */
        if (block.type === "dragWords") {
          const ex = block as DragWordsBlock;
          const submitted = dwSubmitted.has(ex.id);
          const revealed = dwRevealed.has(ex.id);
          const showScore = ex.showScore ?? true;
          const allowRetry = ex.allowRetry ?? true;
          const allowReveal = ex.allowReveal ?? true;
          const placements = dwPlacements[ex.id] || {};

          // Parse text: split on *word* patterns
          const rawText = ex.text.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<\/div>/gi, '\n').replace(/<[^>]+>/g, '');
          const parts: { type: "text" | "blank"; text: string; blankId?: string; correctWord?: string }[] = [];
          const regex = /\*([^*]+)\*/g;
          let lastIndex = 0;
          let match;
          let blankIdx = 0;
          while ((match = regex.exec(rawText)) !== null) {
            if (match.index > lastIndex) parts.push({ type: "text", text: rawText.slice(lastIndex, match.index) });
            const blank = ex.blanks[blankIdx];
            parts.push({ type: "blank", text: match[1], blankId: blank?.id || `b-${blankIdx}`, correctWord: match[1] });
            blankIdx++;
            lastIndex = regex.lastIndex;
          }
          if (lastIndex < rawText.length) parts.push({ type: "text", text: rawText.slice(lastIndex) });

          const blanks = parts.filter(p => p.type === "blank");
          const totalBlanks = blanks.length;

          // Word bank: correct words + distractors, shuffled, minus placed ones
          const allWords = [
            ...blanks.map(b => b.correctWord!),
            ...ex.distractors.map(d => d.word).filter(w => w.trim())
          ];
          const placedWords = new Set(Object.values(placements));
          const availableWords = shuffle(allWords).filter(w => !placedWords.has(w));

          // Scoring
          const correctCount = submitted ? blanks.filter(b => placements[b.blankId!] === b.correctWord).length : 0;
          const scorePct = submitted && totalBlanks > 0 ? Math.round((correctCount / totalBlanks) * 100) : 0;

          const retryDw = () => {
            setDwPlacements(p => { const n = { ...p }; delete n[ex.id]; return n; });
            setDwSubmitted(p => { const n = new Set(p); n.delete(ex.id); return n; });
            setDwRevealed(p => { const n = new Set(p); n.delete(ex.id); return n; });
          };

          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-4">
              <ExerciseHeaderImage url={ex.imageUrl} />
              <ExerciseDescription text={ex.description} />

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Text with blanks */}
                <div className="flex-1 text-base leading-loose" style={{ whiteSpace: "pre-wrap" }}>
                  {parts.map((part, i) => {
                    if (part.type === "text") {
                      // Render text with line breaks preserved
                      const lines = part.text.split('\n');
                      return <span key={i}>{lines.map((line, li) => (
                        <span key={li}>{line}{li < lines.length - 1 && <br />}</span>
                      ))}</span>;
                    }
                    const placed = placements[part.blankId!];
                    const isCorrectPlacement = placed === part.correctWord;
                    const showCorrectWord = revealed && (!placed || !isCorrectPlacement);
                    let blankCls = "inline-flex items-center min-w-[100px] min-h-[2rem] px-2 py-1 mx-1 rounded border-2 border-dashed align-middle";
                    if (submitted || revealed) {
                      if (placed && isCorrectPlacement) blankCls += " border-primary bg-primary/10";
                      else if (placed && !isCorrectPlacement) blankCls += " border-destructive bg-destructive/10";
                      else if (revealed && !placed) blankCls += " border-primary/50 bg-primary/5";
                    } else {
                      blankCls += placed ? " border-primary/50 bg-primary/5" : " border-muted-foreground/40 bg-muted/30";
                    }
                    return (
                      <span
                        key={i}
                        className={blankCls}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          if (submitted || revealed) return;
                          const word = e.dataTransfer.getData("text/plain");
                          const updated = { ...(dwPlacements[ex.id] || {}) };
                          Object.keys(updated).forEach(k => { if (updated[k] === word) delete updated[k]; });
                          updated[part.blankId!] = word;
                          setDwPlacements(p => ({ ...p, [ex.id]: updated }));
                        }}
                      >
                        {showCorrectWord ? (
                          <span className="flex items-center gap-1 text-sm text-primary font-medium">
                            {part.correctWord}
                            <Check className="h-3 w-3 text-primary" />
                          </span>
                        ) : placed ? (
                          <span className="flex items-center gap-1 text-sm">
                            {placed}
                            {!submitted && !revealed && (
                              <button className="text-destructive/70 hover:text-destructive text-xs ml-0.5" onClick={() => {
                                const updated = { ...(dwPlacements[ex.id] || {}) };
                                delete updated[part.blankId!];
                                setDwPlacements(p => ({ ...p, [ex.id]: updated }));
                              }}>×</button>
                            )}
                            {(submitted || revealed) && isCorrectPlacement && <Check className="h-3 w-3 text-primary" />}
                            {(submitted || revealed) && !isCorrectPlacement && <X className="h-3 w-3 text-destructive" />}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">drop here</span>
                        )}
                      </span>
                    );
                  })}
                </div>

                {/* Word bank */}
                <div className="sm:w-48 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Word Bank</p>
                  <div className="flex flex-wrap sm:flex-col gap-1.5">
                    {availableWords.map((word, i) => (
                      <div
                        key={`${word}-${i}`}
                        draggable={!submitted && !revealed}
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", word)}
                        className={`px-3 py-1.5 rounded-lg border border-border bg-background text-sm cursor-grab active:cursor-grabbing hover:bg-accent transition-colors ${submitted || revealed ? "opacity-50 cursor-default" : ""}`}
                      >
                        {word}
                      </div>
                    ))}
                    {availableWords.length === 0 && !submitted && !revealed && (
                      <p className="text-xs text-muted-foreground italic">All words placed</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {!submitted && !revealed && (
                  <Button size="sm" onClick={() => setDwSubmitted(p => new Set(p).add(ex.id))} disabled={Object.keys(placements).length < totalBlanks}>
                    Submit
                  </Button>
                )}
                {!submitted && !revealed && allowReveal && (
                  <Button variant="outline" size="sm" onClick={() => setDwRevealed(p => new Set(p).add(ex.id))} className="gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> Reveal Answer
                  </Button>
                )}
                {(submitted || revealed) && allowRetry && <RetryButton onClick={retryDw} />}
                {submitted && !revealed && allowReveal && (
                  <Button variant="outline" size="sm" onClick={() => setDwRevealed(p => new Set(p).add(ex.id))} className="gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> Reveal Answer
                  </Button>
                )}
              </div>

              {submitted && showScore && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className={scorePct >= (ex.passingPercentage ?? 0) ? "text-primary" : "text-destructive"}>
                    {correctCount} out of {totalBlanks} correct
                  </span>
                </div>
              )}
              {submitted && <FeedbackDisplay score={scorePct} feedbackRanges={ex.feedbackRanges} passingPercentage={ex.passingPercentage} />}
              {submitted && <ReportSubmission blockId={ex.id} score01={ex.showScore === false ? 1 : scorePct / 100} />}
              {revealed && !submitted && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium">Correct answers:</p>
                  {blanks.map((b, i) => (
                    <p key={i}>Blank {i + 1}: <span className="text-foreground font-medium">{b.correctWord}</span></p>
                  ))}
                </div>
              )}
            </div>
          );
        }

        /* ── Fill in the Words ── */
        if (block.type === "fillWords") {
          const ex = block as FillWordsBlock;
          const submitted = fwSubmitted.has(ex.id);
          const revealed = fwRevealed.has(ex.id);
          const showScore = ex.showScore ?? true;
          const allowRetry = ex.allowRetry ?? true;
          const allowReveal = ex.allowReveal ?? true;
          const selections = fwSelections[ex.id] || {};

          // Parse text on *word* markers (mirror dragWords parsing)
          const rawText = ex.text.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<\/div>/gi, '\n').replace(/<[^>]+>/g, '');
          const parts: { type: "text" | "blank"; text: string; blankIdx?: number }[] = [];
          const regex = /\*([^*]+)\*/g;
          let lastIndex = 0;
          let match;
          let bIdx = 0;
          while ((match = regex.exec(rawText)) !== null) {
            if (match.index > lastIndex) parts.push({ type: "text", text: rawText.slice(lastIndex, match.index) });
            parts.push({ type: "blank", text: match[1], blankIdx: bIdx });
            bIdx++;
            lastIndex = regex.lastIndex;
          }
          if (lastIndex < rawText.length) parts.push({ type: "text", text: rawText.slice(lastIndex) });

          const totalBlanks = ex.blanks.length;
          const isBlankCorrect = (blank: FillWordsBlank, optionId?: string) => {
            if (!optionId) return false;
            if (blank.allCorrect) return true;
            const opt = blank.options.find(o => o.id === optionId);
            return !!opt?.isCorrect;
          };
          const correctCount = submitted
            ? ex.blanks.filter(b => isBlankCorrect(b, selections[b.id])).length
            : 0;
          const scorePct = submitted && totalBlanks > 0 ? Math.round((correctCount / totalBlanks) * 100) : 0;
          const allFilled = ex.blanks.length > 0 && ex.blanks.every(b => !!selections[b.id]);

          const retryFw = () => {
            setFwSelections(p => { const n = { ...p }; delete n[ex.id]; return n; });
            setFwSubmitted(p => { const n = new Set(p); n.delete(ex.id); return n; });
            setFwRevealed(p => { const n = new Set(p); n.delete(ex.id); return n; });
          };

          // Stable shuffled options per blank (per exercise id)
          const shuffledOptionsByBlank: Record<string, FillWordsOption[]> = {};
          ex.blanks.forEach(b => { shuffledOptionsByBlank[b.id] = shuffle(b.options); });

          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-4">
              <ExerciseHeaderImage url={ex.imageUrl} />
              {ex.title && <div className="text-base font-medium">{ex.title}</div>}
              <ExerciseDescription text={ex.description} />

              <div className="text-base leading-loose" style={{ whiteSpace: "pre-wrap" }}>
                {parts.map((part, i) => {
                  if (part.type === "text") {
                    const lines = part.text.split('\n');
                    return <span key={i}>{lines.map((line, li) => (
                      <span key={li}>{line}{li < lines.length - 1 && <br />}</span>
                    ))}</span>;
                  }
                  const blank = ex.blanks[part.blankIdx!];
                  if (!blank) return <span key={i} className="text-muted-foreground italic">[blank]</span>;
                  const selectedOptId = selections[blank.id];
                  const correct = isBlankCorrect(blank, selectedOptId);
                  let cls = "inline-block mx-1 align-middle px-2 py-1 rounded border-2 bg-background text-base focus:outline-none focus:ring-2 focus:ring-ring";
                  if (submitted || revealed) {
                    if (selectedOptId && correct) cls += " border-primary bg-primary/10";
                    else if (selectedOptId && !correct) cls += " border-destructive bg-destructive/10";
                    else cls += " border-muted-foreground/40";
                  } else {
                    cls += selectedOptId ? " border-primary/50" : " border-dashed border-muted-foreground/40";
                  }
                  const correctOptionText = blank.allCorrect
                    ? (blank.options[0]?.text ?? "")
                    : (blank.options.find(o => o.isCorrect)?.text ?? "");
                  if (revealed && (!selectedOptId || !correct)) {
                    return (
                      <span key={i} className="inline-flex items-center gap-1 mx-1 px-2 py-1 rounded border-2 border-primary bg-primary/10 align-middle text-base text-primary font-medium">
                        {correctOptionText}
                        <Check className="h-3 w-3" />
                      </span>
                    );
                  }
                  return (
                    <span key={i} className="inline-flex items-center gap-1 align-middle">
                      <select
                        className={cls}
                        value={selectedOptId || ""}
                        disabled={submitted || revealed}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFwSelections(p => ({ ...p, [ex.id]: { ...(p[ex.id] || {}), [blank.id]: v } }));
                        }}
                      >
                        <option value="" disabled></option>
                        {shuffledOptionsByBlank[blank.id].map(o => (
                          <option key={o.id} value={o.id}>{o.text}</option>
                        ))}
                      </select>
                      {(submitted || revealed) && selectedOptId && correct && <Check className="h-3 w-3 text-primary" />}
                      {(submitted || revealed) && selectedOptId && !correct && <X className="h-3 w-3 text-destructive" />}
                    </span>
                  );
                })}
              </div>

              <div className="flex gap-2 flex-wrap">
                {!submitted && !revealed && (
                  <Button size="sm" onClick={() => setFwSubmitted(p => new Set(p).add(ex.id))} disabled={!allFilled}>
                    Submit
                  </Button>
                )}
                {!submitted && !revealed && allowReveal && (
                  <Button variant="outline" size="sm" onClick={() => setFwRevealed(p => new Set(p).add(ex.id))} className="gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> Reveal Answer
                  </Button>
                )}
                {(submitted || revealed) && allowRetry && <RetryButton onClick={retryFw} />}
                {submitted && !revealed && allowReveal && (
                  <Button variant="outline" size="sm" onClick={() => setFwRevealed(p => new Set(p).add(ex.id))} className="gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> Reveal Answer
                  </Button>
                )}
              </div>

              {submitted && showScore && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className={scorePct >= (ex.passingPercentage ?? 0) ? "text-primary" : "text-destructive"}>
                    {correctCount} out of {totalBlanks} correct
                  </span>
                </div>
              )}
              {submitted && <FeedbackDisplay score={scorePct} feedbackRanges={ex.feedbackRanges} passingPercentage={ex.passingPercentage} />}
              {submitted && <ReportSubmission blockId={ex.id} score01={ex.showScore === false ? 1 : scorePct / 100} />}
            </div>
          );
        }

        if (block.type === "markWords") {
          const ex = block as MarkWordsBlock;
          const submitted = mwSubmitted.has(ex.id);
          const revealed = mwRevealed.has(ex.id);
          const showScore = ex.showScore ?? true;
          const allowRetry = ex.allowRetry ?? true;
          const allowReveal = ex.allowReveal ?? true;
          const selected = mwSelected[ex.id] || new Set<number>();

          // Parse text into word tokens, identifying correct ones.
          // Preserve author-inserted line breaks by emitting "break" tokens
          // between source lines so flex-wrap forces a new row.
          const rawText = htmlToPlainTextWithBreaks(ex.text);
          type MwToken =
            | { kind: "word"; text: string; isCorrect: boolean; index: number }
            | { kind: "break"; key: string };
          const tokens: MwToken[] = [];
          const regex = /\*([^*]+)\*|(\S+)/g;
          let idx = 0;
          const lines = rawText.split("\n");
          lines.forEach((line, lineIdx) => {
            if (lineIdx > 0) tokens.push({ kind: "break", key: `br-${lineIdx}` });
            let m: RegExpExecArray | null;
            // reset regex state per line
            regex.lastIndex = 0;
            while ((m = regex.exec(line)) !== null) {
              if (m[1]) {
                tokens.push({ kind: "word", text: m[1], isCorrect: true, index: idx });
              } else if (m[2]) {
                tokens.push({ kind: "word", text: m[2], isCorrect: false, index: idx });
              }
              idx++;
            }
          });

          const wordTokens = tokens.filter((t): t is Extract<MwToken, { kind: "word" }> => t.kind === "word");
          const correctIndices = new Set(wordTokens.filter(t => t.isCorrect).map(t => t.index));
          const totalCorrect = correctIndices.size;

          // Scoring: correct selections - wrong selections, min 0
          const correctSelected = submitted ? [...selected].filter(i => correctIndices.has(i)).length : 0;
          const wrongSelected = submitted ? [...selected].filter(i => !correctIndices.has(i)).length : 0;
          const scorePct = submitted && totalCorrect > 0 ? Math.max(0, Math.round(((correctSelected - wrongSelected) / totalCorrect) * 100)) : 0;

          const toggleWord = (wordIdx: number) => {
            if (submitted || revealed) return;
            setMwSelected(prev => {
              const current = new Set(prev[ex.id] || []);
              current.has(wordIdx) ? current.delete(wordIdx) : current.add(wordIdx);
              return { ...prev, [ex.id]: current };
            });
          };

          const retryMw = () => {
            setMwSelected(p => { const n = { ...p }; delete n[ex.id]; return n; });
            setMwSubmitted(p => { const n = new Set(p); n.delete(ex.id); return n; });
            setMwRevealed(p => { const n = new Set(p); n.delete(ex.id); return n; });
          };

          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-4">
              <ExerciseHeaderImage url={ex.imageUrl} />
              <ExerciseDescription text={ex.description} />

              <div className="leading-relaxed text-base flex flex-wrap gap-1">
                {tokens.map((token) => {
                  if (token.kind === "break") {
                    return <span key={token.key} className="basis-full h-0" aria-hidden="true" />;
                  }
                  const isSelected = selected.has(token.index);
                  let cls = "px-1 py-0.5 rounded cursor-pointer transition-colors select-none";

                  if (!submitted && !revealed) {
                    cls += isSelected ? " bg-primary/20 ring-1 ring-primary/40" : " hover:bg-accent";
                  } else {
                    // After submit or reveal
                    if (isSelected && token.isCorrect) cls += " bg-primary/20 ring-1 ring-primary text-primary";
                    else if (isSelected && !token.isCorrect) cls += " bg-destructive/20 ring-1 ring-destructive text-destructive line-through";
                    else if (!isSelected && token.isCorrect && revealed) cls += " bg-primary/10 ring-1 ring-primary/30";
                    else cls += " opacity-70";
                  }

                  return (
                    <span
                      key={token.index}
                      onClick={() => toggleWord(token.index)}
                      className={cls}
                    >
                      {token.text}
                      {(submitted || revealed) && isSelected && token.isCorrect && <Check className="inline h-3 w-3 ml-0.5 text-primary" />}
                      {(submitted || revealed) && isSelected && !token.isCorrect && <X className="inline h-3 w-3 ml-0.5 text-destructive" />}
                    </span>
                  );
                })}
              </div>

              <div className="flex gap-2 flex-wrap">
                {!submitted && !revealed && (
                  <Button size="sm" onClick={() => setMwSubmitted(p => new Set(p).add(ex.id))} disabled={selected.size === 0}>
                    Submit
                  </Button>
                )}
                {!submitted && !revealed && allowReveal && (
                  <Button variant="outline" size="sm" onClick={() => setMwRevealed(p => new Set(p).add(ex.id))} className="gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> Reveal Answer
                  </Button>
                )}
                {(submitted || revealed) && allowRetry && <RetryButton onClick={retryMw} />}
                {submitted && !revealed && allowReveal && (
                  <Button variant="outline" size="sm" onClick={() => setMwRevealed(p => new Set(p).add(ex.id))} className="gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> Reveal Answer
                  </Button>
                )}
              </div>

              {submitted && showScore && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className={scorePct >= (ex.passingPercentage ?? 0) ? "text-primary" : "text-destructive"}>
                    {correctSelected} out of {totalCorrect} correct
                  </span>
                </div>
              )}
              {submitted && <FeedbackDisplay score={scorePct} feedbackRanges={ex.feedbackRanges} passingPercentage={ex.passingPercentage} />}
              {submitted && <ReportSubmission blockId={ex.id} score01={ex.showScore === false ? 1 : scorePct / 100} />}

              {revealed && (
                <div className="mt-2 p-4 rounded-lg bg-muted/30 border border-border space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Answer Key</p>
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {tokens.map((token, ti) => {
                      if (token.kind === "break") return <span key={`ak-${ti}`}>{"\n"}</span>;
                      return (
                        <span key={token.index} className={token.isCorrect ? "font-semibold text-primary bg-primary/10 px-0.5 rounded" : ""}>
                          {token.text}{" "}
                        </span>
                      );
                    })}
                  </p>
                </div>
              )}
            </div>
          );
        }

        /* ── Image Hotspot ── */
        if (block.type === "imageHotspot") {
          const ex = block as ImageHotspotBlock;
          const openHsId = hotspotOpen[ex.id] || null;
          const openHs = ex.hotspots.find(h => h.id === openHsId);

          const getIcon = (hs: { icon: string; customIconUrl?: string }) => {
            if (hs.icon === "custom" && hs.customIconUrl) {
              return <img src={hs.customIconUrl} alt="icon" className="h-4 w-4 object-contain" />;
            }
            const cls = "h-4 w-4";
            const textCls = "text-sm font-bold leading-none";
            switch (hs.icon) {
              case "info": return <Info className={cls} />;
              case "exclamation": return <span className={textCls}>!</span>;
              case "minus": return <Minus className={cls} />;
              case "question": return <span className={textCls}>?</span>;
              case "lightbulb": return <Lightbulb className={cls} />;
              case "euro": return <span className={textCls}>€</span>;
              case "dollar": return <span className={textCls}>$</span>;
              case "section": return <span className={textCls}>§</span>;
              case "at": return <span className={textCls}>@</span>;
              case "pound": return <span className={textCls}>£</span>;
              case "hash": return <Hash className={cls} />;
              default: return <Plus className={cls} />;
            }
          };

          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-3">
              
              <ExerciseDescription text={ex.description} />
              {ex.baseImage && (
                <div className="relative rounded-lg border border-border">
                  <img src={ex.baseImage} alt="Hotspot base" className="w-full block rounded-lg" draggable={false} />
                  {ex.hotspots.map((hs) => (
                    <button
                      key={hs.id}
                      onClick={() => setHotspotOpen(p => ({ ...p, [ex.id]: p[ex.id] === hs.id ? null : hs.id }))}
                      className={`absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
                        openHsId === hs.id
                          ? "bg-primary text-primary-foreground scale-110 ring-2 ring-primary/30"
                          : "bg-foreground/80 text-background hover:bg-foreground hover:scale-110"
                      }`}
                      style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                    >
                      {getIcon(hs)}
                    </button>
                  ))}
                  {/* Popup rendered as overlay on the image */}
                  {openHs && (
                    <div
                      className="absolute inset-x-[5%] z-10 bg-background rounded-xl shadow-xl border border-border p-4 animate-in fade-in-0 duration-200 overflow-y-auto"
                      style={{
                        top: openHs.y < 50 ? `${Math.min(openHs.y + 6, 60)}%` : undefined,
                        bottom: openHs.y >= 50 ? `${Math.min(100 - openHs.y + 6, 60)}%` : undefined,
                        maxHeight: '50%',
                      }}
                    >
                      <button
                        onClick={() => setHotspotOpen(p => ({ ...p, [ex.id]: null }))}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors z-10"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      {openHs.contentType === "text" && openHs.text && (
                        <div className="prose max-w-none text-foreground pr-6 [&_h1]:text-[2rem] [&_h1]:font-bold [&_h1]:mt-[1.5em] [&_h1]:mb-[0.5em] [&_h2]:text-[1.5rem] [&_h2]:font-bold [&_h2]:mt-[1.25em] [&_h2]:mb-[0.4em] [&_h3]:text-[1.17rem] [&_h3]:font-semibold [&_h3]:mt-[1em] [&_h3]:mb-[0.35em] [&_h4]:text-[1.05rem] [&_h4]:font-semibold [&_h4]:mt-[0.75em] [&_h4]:mb-[0.25em] [&_p]:mt-0 [&_p]:mb-2 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:my-0.5 [&_a]:text-primary [&_a]:underline" dangerouslySetInnerHTML={safeHtml(openHs.text)} />
                      )}
                      {openHs.contentType === "image" && openHs.imageUrl && (
                        <img src={openHs.imageUrl} alt="Hotspot content" className="w-full max-h-60 object-contain rounded-lg" />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }

        /* ── Find Hotspot ── */
        if (block.type === "findHotspot") {
          const ex = block as FindHotspotBlock;
          const found = fhFound[ex.id] || new Set<string>();
          const revealed = fhRevealed.has(ex.id);
          const feedback = fhFeedback[ex.id] || null;
          const correctAreas = ex.areas.filter(a => a.isCorrect);
          const foundCorrect = correctAreas.filter(a => found.has(a.id)).length;
          const scorePct = correctAreas.length > 0 ? Math.round((foundCorrect / correctAreas.length) * 100) : 100;

          const markers = fhMarkers[ex.id] || [];

          const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
            if (revealed) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = ((e.clientX - rect.left) / rect.width) * 100;
            const clickY = ((e.clientY - rect.top) / rect.height) * 100;

            const addMarker = (area: typeof ex.areas[0]) => {
              const markerId = `${area.id}_${Date.now()}`;
              const markerX = area.x + area.width / 2;
              const markerY = area.y + area.height / 2;
              setFhMarkers(p => ({ ...p, [ex.id]: [...(p[ex.id] || []), { id: markerId, areaId: area.id, isCorrect: area.isCorrect, x: markerX, y: markerY, fading: false }] }));
              setTimeout(() => setFhMarkers(p => ({ ...p, [ex.id]: (p[ex.id] || []).map(m => m.id === markerId ? { ...m, fading: true } : m) })), 4000);
              setTimeout(() => setFhMarkers(p => ({ ...p, [ex.id]: (p[ex.id] || []).filter(m => m.id !== markerId) })), 5000);
            };

            for (const area of ex.areas) {
              let inside = false;
              if (area.shape === "rectangle") {
                inside = clickX >= area.x && clickX <= area.x + area.width && clickY >= area.y && clickY <= area.y + area.height;
              } else {
                const cx = area.x + area.width / 2;
                const cy = area.y + area.height / 2;
                const rx = area.width / 2;
                const ry = area.height / 2;
                inside = ((clickX - cx) ** 2) / (rx ** 2) + ((clickY - cy) ** 2) / (ry ** 2) <= 1;
              }
              if (inside) {
                if (found.has(area.id)) {
                  setFhFeedback(p => ({ ...p, [ex.id]: "You have already clicked on this area!" }));
                  addMarker(area);
                } else {
                  const next = new Set(found);
                  next.add(area.id);
                  setFhFound(p => ({ ...p, [ex.id]: next }));
                  setFhFeedback(p => ({ ...p, [ex.id]: area.feedback || (area.isCorrect ? "Correct!" : "Incorrect area.") }));
                  addMarker(area);
                }
                return;
              }
            }
            setFhFeedback(p => ({ ...p, [ex.id]: ex.feedbackEmpty || "You didn't locate any hotspots, try again!" }));
          };

          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-3">
              
              <ExerciseDescription text={ex.description} />
              <ExerciseHeaderImage url={ex.imageUrl} />
              {ex.baseImage && (
                <div className="relative rounded-lg overflow-hidden border border-border select-none cursor-pointer"
                  onClick={handleImageClick}
                >
                  <img src={ex.baseImage} alt="Find hotspot" className="w-full block pointer-events-none" draggable={false} />
                  {/* Revealed areas (only on reveal) */}
                  {revealed && ex.areas.map((area) => (
                    <div key={area.id}
                      className={`absolute border-2 transition-all duration-300 ${
                        area.isCorrect
                          ? "border-emerald-500 bg-emerald-500/20"
                          : "border-red-500 bg-red-500/20"
                      }`}
                      style={{
                        left: `${area.x}%`, top: `${area.y}%`, width: `${area.width}%`, height: `${area.height}%`,
                        borderRadius: area.shape === "circle" ? "50%" : "4px",
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        {area.isCorrect ? <Check className="h-5 w-5 text-emerald-600" /> : <X className="h-5 w-5 text-red-600" />}
                      </div>
                    </div>
                  ))}
                  {/* Temporary click markers */}
                  {markers.map((marker) => (
                    <div key={marker.id}
                      className="absolute flex items-center justify-center pointer-events-none"
                      style={{
                        left: `${marker.x}%`, top: `${marker.y}%`,
                        transform: "translate(-50%, -50%)",
                        transition: "opacity 1s ease-out",
                        opacity: marker.fading ? 0 : 1,
                      }}
                    >
                      <div className={`rounded-full p-1.5 shadow-lg ${marker.isCorrect ? "bg-emerald-500" : "bg-red-500"}`}>
                        {marker.isCorrect
                          ? <Check className="h-5 w-5 text-white" strokeWidth={3} />
                          : <X className="h-5 w-5 text-white" strokeWidth={3} />
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Feedback toast */}
              {feedback && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border text-base animate-in fade-in-0 duration-200">
                  {feedback}
                </div>
              )}

              {/* Score */}
              {(ex.showScore !== false) && found.size > 0 && (
                <p className="text-sm text-muted-foreground">
                  Found {foundCorrect} of {correctAreas.length} correct area{correctAreas.length !== 1 ? "s" : ""}
                </p>
              )}

              {foundCorrect >= correctAreas.length && correctAreas.length > 0 && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-base text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300 animate-in fade-in-0 duration-200">
                  {ex.feedbackAllFound || "Great job! You found all the hotspots!"}
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-2 flex-wrap">
                {(ex.allowReveal !== false) && !revealed && (
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => setFhRevealed(p => { const n = new Set(p); n.add(ex.id); return n; })}>
                    <Eye className="h-3.5 w-3.5" /> Reveal Areas
                  </Button>
                )}
              </div>
            </div>
          );
        }

        /* ── Question Set ── */
        if (block.type === "questionSet") {
          const ex = block as QuestionSetBlock;
          return (
            <QuestionSetPlayer key={ex.id} exercise={ex} lessonId={lessonId} />
          );
        }

        /* ── Accordion ── */
        if (block.type === "accordion") {
          const ex = block as AccordionBlock;
          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-3">
              
              <ExerciseDescription text={ex.description} />
              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                {ex.items.map((item) => {
                  const isOpen = accordionOpen[`${ex.id}_${item.id}`] || false;
                  return (
                    <div key={item.id}>
                      <button
                        type="button"
                        onClick={() => setAccordionOpen(p => ({ ...p, [`${ex.id}_${item.id}`]: !isOpen }))}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
                      >
                        <div className="font-semibold text-foreground prose max-w-none [&>*]:m-0" dangerouslySetInnerHTML={safeHtml(item.title || "Untitled")} />
                        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      <div
                        className="overflow-hidden transition-all duration-300 ease-out"
                        style={{ maxHeight: isOpen ? "2000px" : "0px", opacity: isOpen ? 1 : 0 }}
                      >
                        <div className="px-4 pb-4 pt-1 prose max-w-none text-foreground" dangerouslySetInnerHTML={safeHtml(item.body)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        /* ── Image Reflection ── */
        if (block.type === "imageReflection") {
          const ex = block as ImageReflectionBlock;
          const inputs = irInputs[ex.id] || {};
          const submitted = irSubmitted.has(ex.id);
          const allFilled = ex.inputBoxes.length > 0 && ex.inputBoxes.every(b => (inputs[b.id] || "").trim().length > 0);
          const sizeToRows = (s: string) => s === "one" ? 1 : s === "three" ? 3 : 5;
          const defaultSizeToHeight = (s: string) => s === "one" ? "28px" : s === "three" ? "64px" : "104px";
          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-3">
              <ExerciseHeaderImage url={ex.imageUrl} />
              
              <ExerciseDescription text={ex.description} />
              {ex.baseImage && (
                <div className="relative rounded-lg overflow-hidden border border-border" style={{ maxWidth: "700px", margin: "0 auto" }}>
                  <img src={ex.baseImage} alt="Reflection base" className="block w-full h-auto" />
                  {ex.inputBoxes.map((box) => {
                    const boxWidth = box.width ? `${box.width}%` : "18%";
                    const boxHeight = box.height ? `${box.height}vh` : defaultSizeToHeight(box.size);
                    return (
                      <div key={box.id} className="absolute" style={{ left: `${box.x}%`, top: `${box.y}%`, width: boxWidth, zIndex: 10 }}>
                        <textarea
                          rows={sizeToRows(box.size)}
                          value={inputs[box.id] || ""}
                          onChange={(e) => !submitted && setIrInputs(p => ({ ...p, [ex.id]: { ...p[ex.id], [box.id]: e.target.value } }))}
                          disabled={submitted}
                          className="w-full rounded-md border border-primary/50 bg-background/90 text-foreground text-xs px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-primary shadow-sm backdrop-blur-sm"
                          style={{ height: boxHeight }}
                          placeholder="Type here..."
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              {!submitted ? (
                <Button
                  onClick={() => setIrSubmitted(p => { const n = new Set(p); n.add(ex.id); return n; })}
                  disabled={!allFilled}
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <CheckCircle className="h-4 w-4" /> Submit
                </Button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base text-primary font-medium break-words overflow-wrap-anywhere">{ex.completionMessage || "Thank you for your reflection!"}</p>
                  <RetryButton onClick={() => {
                    setIrInputs(p => { const n = { ...p }; delete n[ex.id]; return n; });
                    setIrSubmitted(p => { const n = new Set(p); n.delete(ex.id); return n; });
                  }} />
                  <ReportSubmission blockId={ex.id} score01={1} />
                </div>
              )}
            </div>
          );
        }

        if (block.type === "branchingScenario") {
          return <BranchingScenarioPlayer key={block.id} block={block as BranchingScenarioBlock} courseId={courseId} lessonId={lessonId} storageScope={storageScope} />;
        }

        /* ── Image Slider ── */
        if (block.type === "imageSlider") {
          const ex = block as ImageSliderBlock;
          const validImages = ex.images.filter(img => img.url);
          if (validImages.length === 0) return <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 text-muted-foreground text-base">No images added to slider.</div>;
          const currentIdx = imageSliderIndex[ex.id] ?? 0;
          const safeIdx = Math.min(currentIdx, validImages.length - 1);
          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-3">
              
              {ex.description && <p className="text-sm text-muted-foreground">{ex.description}</p>}
              <div className="relative group select-none overflow-hidden rounded-lg" style={{ backgroundColor: "white" }}>
                <div className="w-full" style={{ aspectRatio: "16 / 10" }}>
                  <img
                    src={validImages[safeIdx].url}
                    alt={validImages[safeIdx].alt || `Slide ${safeIdx + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
                {/* Left arrow */}
                {safeIdx > 0 && (
                  <button
                    onClick={() => setImageSliderIndex(p => ({ ...p, [ex.id]: safeIdx - 1 }))}
                    className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-start pl-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-gradient-to-r from-black/20 to-transparent"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-8 w-8 text-white drop-shadow-md" />
                  </button>
                )}
                {/* Right arrow */}
                {safeIdx < validImages.length - 1 && (
                  <button
                    onClick={() => setImageSliderIndex(p => ({ ...p, [ex.id]: safeIdx + 1 }))}
                    className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer bg-gradient-to-l from-black/20 to-transparent"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-8 w-8 text-white drop-shadow-md" />
                  </button>
                )}
                {/* Slide counter */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                  {safeIdx + 1} / {validImages.length}
                </div>
              </div>
            </div>
          );
        }

        /* ── Flashcards ── */
        if (block.type === "flashcards") {
          const ex = block as FlashcardsBlock;
          if (!ex.cards.length) return null;
          const idx = flashcardIndex[ex.id] ?? 0;
          const safeIdx = Math.min(idx, ex.cards.length - 1);
          const card = ex.cards[safeIdx];
          const answers = flashcardAnswers[ex.id] || {};
          const submittedSet = flashcardSubmitted[ex.id] || new Set<number>();
          const isSubmitted = submittedSet.has(safeIdx);
          const answer = answers[safeIdx] || "";
          const cardMode = card.mode || ex.mode || "open";
          const isExact = cardMode === "exact";
          const isCorrect = isExact && isSubmitted ? answer.trim().toLowerCase() === (card.correctAnswer || "").trim().toLowerCase() : null;

          const handleSubmit = () => {
            setFlashcardSubmitted(p => {
              const s = new Set(p[ex.id] || []);
              s.add(safeIdx);
              return { ...p, [ex.id]: s };
            });
          };

          const handleRetry = () => {
            setFlashcardSubmitted(p => {
              const s = new Set(p[ex.id] || []);
              s.delete(safeIdx);
              return { ...p, [ex.id]: s };
            });
            setFlashcardAnswers(p => {
              const a = { ...(p[ex.id] || {}) };
              delete a[safeIdx];
              return { ...p, [ex.id]: a };
            });
          };

          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-3">
              
              {ex.description && <p className="text-sm text-muted-foreground text-center">{ex.description}</p>}
              <p className="text-sm text-muted-foreground text-center">{safeIdx + 1} / {ex.cards.length}</p>

              <div className="bg-card rounded-xl border border-border p-4 space-y-3 max-w-md mx-auto">
                {card.imageUrl && (
                  <div className="rounded-lg overflow-hidden relative" style={{ aspectRatio: "4 / 3", backgroundColor: "white" }}>
                    <img src={card.imageUrl} alt="" className="absolute inset-0 w-full h-full object-contain" />
                  </div>
                )}
                {card.text && <p className="text-sm text-center text-muted-foreground">{card.text}</p>}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Your answer"
                    value={answer}
                    disabled={isSubmitted}
                    onChange={(e) => setFlashcardAnswers(p => ({ ...p, [ex.id]: { ...(p[ex.id] || {}), [safeIdx]: e.target.value } }))}
                    className="flex-1 px-3 py-2 text-sm border border-input rounded-lg bg-background disabled:opacity-60"
                  />
                  {!isSubmitted ? (
                    <Button size="sm" onClick={handleSubmit} disabled={!answer.trim()}>Check</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={handleRetry} className="gap-1">
                      <RotateCcw className="h-3 w-3" /> Retry
                    </Button>
                  )}
                </div>

                {isSubmitted && (
                  <div className={`text-sm rounded-lg p-3 ${isExact ? (isCorrect ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive") : "bg-primary/10 text-primary"}`}>
                    {isExact
                      ? (isCorrect ? (card.feedbackCorrect || "Correct!") : (card.feedbackIncorrect || "Incorrect. Try again!"))
                      : (card.feedbackCorrect || ex.feedbackOpen || "Thank you for your answer!")}
                  </div>
                )}
              </div>

              {/* Navigation */}
              {ex.cards.length > 1 && (
                <div className="flex justify-center gap-3">
                  <Button variant="outline" size="sm" disabled={safeIdx === 0}
                    onClick={() => setFlashcardIndex(p => ({ ...p, [ex.id]: safeIdx - 1 }))} className="gap-1">
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={safeIdx === ex.cards.length - 1}
                    onClick={() => setFlashcardIndex(p => ({ ...p, [ex.id]: safeIdx + 1 }))} className="gap-1">
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        }

        if (block.type === "answerCards") {
          const ex = block as AnswerCardsBlock;
          const safeIdx = Math.min(answerCardIndex[ex.id] || 0, ex.cards.length - 1);
          const card = ex.cards[safeIdx];
          if (!card) return null;
          const revealedSet = answerCardRevealed[ex.id] || new Set<string>();
          const isRevealed = revealedSet.has(card.id);
          return (
            <div key={ex.id} className="border border-border rounded-xl p-5 bg-muted/20 space-y-4">
              
              <ExerciseDescription text={ex.description} />
              {ex.cards.length > 1 && (
                <p className="text-xs text-muted-foreground text-center">Card {safeIdx + 1} of {ex.cards.length}</p>
              )}
              <div className="space-y-3 mx-auto" style={{ maxWidth: `${ex.widthPercent || 100}%` }}>
                {card.imageUrl && (
                  <div className="rounded-lg overflow-hidden relative" style={{ aspectRatio: "16 / 10" }}>
                    <img src={card.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                )}
                {!isRevealed ? (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      setAnswerCardRevealed(prev => {
                        const s = new Set(prev[ex.id] || []);
                        s.add(card.id);
                        return { ...prev, [ex.id]: s };
                      });
                    }}
                  >
                    {card.buttonLabel || "Show the answer"}
                  </Button>
                ) : (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 prose max-w-none animate-in fade-in-0 slide-in-from-bottom-2 duration-300" dangerouslySetInnerHTML={safeHtml(card.revealedText)} />
                )}
              </div>
              {ex.cards.length > 1 && (
                <div className="flex justify-center gap-3">
                  <Button variant="outline" size="sm" disabled={safeIdx === 0}
                    onClick={() => setAnswerCardIndex(p => ({ ...p, [ex.id]: safeIdx - 1 }))} className="gap-1">
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={safeIdx === ex.cards.length - 1}
                    onClick={() => setAnswerCardIndex(p => ({ ...p, [ex.id]: safeIdx + 1 }))} className="gap-1">
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        }

        if (block.type === "sqlExercise") {
          const sqlEx = block as SqlExerciseBlock;
          const code = sqlCode[block.id] ?? sqlEx.starterCode;
          const result = sqlResult[block.id];
          const isRunning = sqlRunning.has(block.id);
          const checked = sqlChecked[block.id];
          const showHint = sqlShowHint.has(block.id);
          const validationMode = sqlEx.validationMode || "query";
          const hasExpectedOutput = sqlEx.expectedColumns.length > 0 || sqlEx.expectedRows.length > 0;
          const canCheckAnswer = validationMode === "query"
            ? !!sqlEx.solutionQuery.trim()
            : !!result && !result.error && hasExpectedOutput;

          const runQuery = async () => {
            setSqlRunning(prev => new Set(prev).add(block.id));
            setSqlChecked(prev => ({ ...prev, [block.id]: null }));
            try {
              if (validationMode === "query") {
                // Exact query mode validates SQL text only; don't execute SQL.
                // Auto-check answer immediately
                const expectedQuery = normalizeSqlForComparison(sqlEx.solutionQuery || "");
                const studentQuery = normalizeSqlForComparison(code);
                const isCorrect = expectedQuery.length > 0 && studentQuery === expectedQuery;
                setSqlChecked(prev => ({ ...prev, [block.id]: isCorrect }));
                // Auto-save to notes on correct answer
                if (isCorrect && courseId && lessonId) {
                  try {
                    const { supabase } = await import("@/integrations/supabase/client");
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      await supabase.from("student_notes" as any).insert({
                        student_id: user.id,
                        course_id: courseId,
                        lesson_id: lessonId,
                        selected_text: `[SQL Exercise] ${sqlEx.title || "Untitled"}`,
                        note_content: `-- Task: ${(sqlEx.taskDescription || "").replace(/<[^>]*>/g, "")}\n-- Your query:\n${code}\n-- Result: Correct ✓`,
                      } as any);
                    }
                  } catch {}
                }
              } else if (sqlEx.persistentDb) {
                const { executeSQLPersistent } = await import("@/lib/sqlEngine");
                const existingBinary = sqlDbBinary[block.id] || null;
                const res = await executeSQLPersistent(existingBinary, sqlEx.setupSql, code);
                setSqlDbBinary(prev => ({ ...prev, [block.id]: res.dbBinary }));
                setSqlResult(prev => ({ ...prev, [block.id]: { columns: res.columns, rows: res.rows, error: res.error } }));
                // Save to Supabase storage
                try {
                  const { supabase } = await import("@/integrations/supabase/client");
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    const path = `${user.id}/${block.id}.sqlite`;
                    await supabase.storage.from("sql-databases").upload(path, res.dbBinary, { upsert: true, contentType: "application/octet-stream" });
                  }
                } catch {}
              } else {
                const { executeSQL } = await import("@/lib/sqlEngine");
                const res = await executeSQL(sqlEx.setupSql, code);
                setSqlResult(prev => ({ ...prev, [block.id]: res }));
              }
            } catch (e: any) {
              setSqlResult(prev => ({ ...prev, [block.id]: { columns: [], rows: [], error: e.message } }));
            }
            setSqlRunning(prev => { const s = new Set(prev); s.delete(block.id); return s; });
          };

          const checkAnswer = async () => {
            let isCorrect = false;
            if (validationMode === "query") {
              // For exact query match, compare SQL text directly — no need to run successfully
              const expectedQuery = normalizeSqlForComparison(sqlEx.solutionQuery || "");
              const studentQuery = normalizeSqlForComparison(code);
              isCorrect = expectedQuery.length > 0 && studentQuery === expectedQuery;
            } else {
              if (!result || result.error) return;
              const resultValues = normalizeSqlRows(result.rows);
              const expectedValues = normalizeSqlRows(sqlEx.expectedRows);
              isCorrect = JSON.stringify(resultValues) === JSON.stringify(expectedValues);
            }
            setSqlChecked(prev => ({ ...prev, [block.id]: isCorrect }));

            // Auto-save to notes on correct answer
            if (isCorrect && courseId && lessonId) {
              try {
                const { supabase } = await import("@/integrations/supabase/client");
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await supabase.from("student_notes" as any).insert({
                    student_id: user.id,
                    course_id: courseId,
                    lesson_id: lessonId,
                    selected_text: `[SQL Exercise] ${sqlEx.title || "Untitled"}`,
                    note_content: `-- Task: ${(sqlEx.taskDescription || "").replace(/<[^>]*>/g, "")}\n-- Your query:\n${code}\n-- Result: Correct ✓`,
                  } as any);
                }
              } catch {}
            }
          };

          const retry = () => {
            setSqlCode(prev => ({ ...prev, [block.id]: sqlEx.starterCode }));
            setSqlResult(prev => { const n = { ...prev }; delete n[block.id]; return n; });
            setSqlChecked(prev => { const n = { ...prev }; delete n[block.id]; return n; });
          };

          return (
            <div key={block.id} className="border border-border rounded-xl p-6 space-y-4 bg-card">
              {sqlEx.title && <h3 className="text-lg font-semibold">{sqlEx.title}</h3>}
              {sqlEx.taskDescription && (
                <div className="prose max-w-none" dangerouslySetInnerHTML={safeHtml(sqlEx.taskDescription)} />
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">SQL Query</label>
                <p className="text-xs text-muted-foreground">
                  {validationMode === "query"
                    ? "Exact Query Match: your SQL text must match the instructor query (execution is optional)."
                    : "Output Values Match: your SQL can differ, but the returned values must match."}
                </p>
                <textarea
                  value={code}
                  onChange={(e) => setSqlCode(prev => ({ ...prev, [block.id]: e.target.value }))}
                  className="w-full min-h-[120px] rounded-md border border-input bg-gray-900 text-green-400 px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Write your SQL query here..."
                  spellCheck={false}
                />
                <div className="flex gap-2 items-center">
                  <Button variant="default" size="sm" onClick={runQuery} disabled={isRunning} className="gap-1">
                    {isRunning ? "Running..." : "▶ Run"}
                  </Button>
                  {canCheckAnswer && validationMode !== "query" && (
                    <Button variant="outline" size="sm" onClick={checkAnswer} className="gap-1">
                      Check Answer
                    </Button>
                  )}
                  {checked !== null && checked !== undefined && (
                    <Button variant="ghost" size="sm" onClick={retry} className="gap-1">
                      <RotateCcw className="h-3 w-3" /> Retry
                    </Button>
                  )}
                  {sqlEx.hint && (
                    <Button variant="ghost" size="sm" onClick={() => setSqlShowHint(prev => { const s = new Set(prev); if (s.has(block.id)) s.delete(block.id); else s.add(block.id); return s; })} className="ml-auto gap-1 text-muted-foreground">
                      <HelpCircle className="h-3 w-3" /> Hint
                    </Button>
                  )}
                </div>
              </div>
              {showHint && sqlEx.hint && (
                <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm">
                  💡 {sqlEx.hint}
                </div>
              )}
              {result?.error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm font-mono text-destructive">
                  {result.error}
                </div>
              )}
              {result && !result.error && result.columns.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Result ({result.rows.length} row{result.rows.length !== 1 ? "s" : ""})</label>
                  <div className="border border-border rounded-md overflow-auto max-h-64">
                    <table className="w-full text-sm font-mono">
                      <thead><tr className="bg-muted">{result.columns.map((c, i) => <th key={i} className="px-3 py-2 text-left font-medium border-b border-border">{c}</th>)}</tr></thead>
                      <tbody>{result.rows.map((row, ri) => <tr key={ri} className="border-b border-border last:border-0">{row.map((cell, ci) => <td key={ci} className="px-3 py-2">{cell}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                </div>
              )}
              {result && !result.error && result.columns.length === 0 && (
                <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 text-sm text-muted-foreground">
                  Query executed successfully. No rows returned.
                </div>
              )}
              {checked === true && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 text-sm font-medium text-primary flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  {validationMode === "query"
                    ? "Correct! Your SQL matches the expected query."
                    : "Correct! Your query output matches the expected values."}
                </div>
              )}
              {checked === false && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm font-medium text-destructive flex items-center gap-2">
                  <X className="h-4 w-4" />
                  {validationMode === "query"
                    ? "Not quite right. Your SQL doesn't match the expected query yet."
                    : "Not quite right. Your result doesn't match the expected output yet."}
                </div>
              )}
            </div>
          );
        }

        if (block.type === "table") {
          const tb = block as TableBlock;
          const borderCss = tb.borderStyle === "none" ? "none" : `${tb.borderWidth}px ${tb.borderStyle} ${tb.borderColor}`;
          return (
            <div key={block.id} className="my-4">
              {(tb.titleHtml?.trim() || tb.title) && (
                <div
                  className="mb-2 [&_h1]:text-[2rem] [&_h1]:font-bold [&_h2]:text-[1.5rem] [&_h2]:font-bold [&_h3]:text-[1.17rem] [&_h3]:font-semibold [&_h4]:text-[1.05rem] [&_h4]:font-semibold [&_h5]:text-base [&_h5]:font-bold [&_h6]:text-sm [&_h6]:font-bold [&_h6]:uppercase [&_h6]:tracking-wider"
                  dangerouslySetInnerHTML={safeHtml(
                    tb.titleHtml?.trim()
                      ? tb.titleHtml
                      : `<h3>${(tb.title || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h3>`
                  )}
                />
              )}
              <div className="overflow-x-auto">
                <table className="w-full" style={{ borderCollapse: "collapse", border: borderCss }}>
                  <tbody>
                    {tb.cells.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => {
                          const isHeader = tb.headerRow && ri === 0;
                          const Tag = isHeader ? "th" : "td";
                          return (
                            <Tag
                              key={cell.id}
                              className={`px-4 py-3 align-top text-sm [&_p]:m-0 [&_p+p]:mt-2 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:my-0.5 [&_strong]:font-semibold [&_h1]:text-[1.5rem] [&_h1]:font-bold [&_h2]:text-[1.25rem] [&_h2]:font-bold [&_h3]:text-[1.1rem] [&_h3]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic ${isHeader ? "font-bold" : ""}`}
                              style={{
                                border: borderCss,
                                backgroundColor: isHeader ? (tb.headerBgColor || "#f3f4f6") : undefined,
                              }}
                              dangerouslySetInnerHTML={safeHtml(cell.html)}
                            />
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        if (block.type === "splitScreen") {
          const sb = block as SplitScreenBlock;
          return (
            <div key={block.id} className="my-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  {sb.left ? <BlockRenderer blocks={[sb.left]} courseId={courseId} lessonId={lessonId} storageScope={storageScope} /> : <div className="text-muted-foreground text-base italic p-4 border border-dashed rounded-lg text-center">Empty panel</div>}
                </div>
                <div className="flex-1 min-w-0">
                  {sb.right ? <BlockRenderer blocks={[sb.right]} courseId={courseId} lessonId={lessonId} storageScope={storageScope} /> : <div className="text-muted-foreground text-base italic p-4 border border-dashed rounded-lg text-center">Empty panel</div>}
                </div>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
