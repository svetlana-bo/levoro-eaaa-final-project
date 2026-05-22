import React, { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ContentBlock, TextBlock, ImageBlock, VideoBlock, BranchingScenarioBlock, ImageReflectionBlock, ImageSliderBlock, FlashcardsBlock, AnswerCardsBlock, SqlExerciseBlock, TableBlock, SplitScreenBlock, FillWordsBlock } from "./types";
import { Slider } from "@/components/ui/slider";
import { RichTextEditor } from "./RichTextEditor";
import {
  QuizEditor, ChecklistEditor, TrueFalseEditor, FillBlanksEditor, DialogCardsEditor, ReflectionEditor,
  MultimediaChoiceEditor, CrosswordEditor, DragDropEditor, SortParagraphsEditor, SortImagesEditor,
  MemoryGameEditor, ImageJuxtapositionEditor, DragWordsEditor, FillWordsEditor, MarkWordsEditor, QuestionSetEditor, ImageHotspotEditor, FindHotspotEditor, AccordionEditor, ImageReflectionEditor, ImageSliderEditor, FlashcardsEditor, AnswerCardsEditor, SqlExerciseEditor, TableEditor, SplitScreenEditor
} from "./ExerciseEditors";
import { BranchingScenarioEditor } from "./BranchingScenarioEditor";
import { Plus, Trash2, ChevronUp, ChevronDown, ImageIcon, Type, HelpCircle, ListChecks, ToggleLeft, PenLine, Layers, MessageSquare, Grid3X3, GripHorizontal, ArrowUpDown, ArrowDownUp, Puzzle, SplitSquareHorizontal, GripVertical, Highlighter, ClipboardList, MapPin, ChevronsUpDown, MousePointerClick, GitBranch, PenSquare, GalleryHorizontalEnd, Zap, CreditCard, X, Database, Video, Table2, Columns, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaUpload } from "@/components/MediaUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const BLOCK_SECTIONS: { name: string; items: { type: string; icon: React.ComponentType<{ className?: string }>; label: string }[] }[] = [
  { name: "Content", items: [
    { type: "text", icon: Type, label: "Text" },
    { type: "image", icon: ImageIcon, label: "Image" },
    { type: "video", icon: Video, label: "Video" },
    { type: "table", icon: Table2, label: "Table" },
  ]},
  { name: "Questions", items: [
    { type: "quiz", icon: HelpCircle, label: "Quiz" },
    { type: "multimediaChoice", icon: ImageIcon, label: "Multimedia Choice" },
    { type: "trueFalse", icon: ToggleLeft, label: "True / False" },
    { type: "fillBlanks", icon: PenLine, label: "Fill in Blanks" },
    { type: "fillWords", icon: ChevronDown, label: "Fill in the Words" },
    { type: "crossword", icon: Grid3X3, label: "Crossword" },
  ]},
  { name: "Interactive", items: [
    { type: "checklist", icon: ListChecks, label: "Checklist" },
    { type: "dialogCards", icon: Layers, label: "Dialog Cards" },
    { type: "dragDrop", icon: GripHorizontal, label: "Match Pairs" },
    { type: "sortParagraphs", icon: ArrowUpDown, label: "Sort Paragraphs" },
    { type: "sortImages", icon: ArrowDownUp, label: "Sort Images" },
    { type: "memoryGame", icon: Puzzle, label: "Memory Cards" },
    { type: "imageJuxtaposition", icon: SplitSquareHorizontal, label: "Image Juxtaposition" },
    { type: "imageSlider", icon: GalleryHorizontalEnd, label: "Image Slider" },
    { type: "dragWords", icon: GripVertical, label: "Drag the Words" },
    { type: "markWords", icon: Highlighter, label: "Mark the Words" },
    { type: "imageHotspot", icon: MapPin, label: "Image Hotspot" },
    { type: "findHotspot", icon: MousePointerClick, label: "Find Hotspot" },
    { type: "accordion", icon: ChevronsUpDown, label: "Accordion" },
    { type: "flashcards", icon: Zap, label: "Flashcards" },
    { type: "answerCards", icon: CreditCard, label: "Answer Cards" },
  ]},
  { name: "Containers", items: [
    { type: "questionSet", icon: ClipboardList, label: "Question Set" },
    { type: "branchingScenario", icon: GitBranch, label: "Branching Scenario" },
    { type: "splitScreen", icon: Columns, label: "Split Screen" },
  ]},
  { name: "Code", items: [
    { type: "sqlExercise", icon: Database, label: "SQL Exercise" },
  ]},
  { name: "Reflection", items: [
    { type: "reflection", icon: MessageSquare, label: "Reflection" },
    { type: "imageReflection", icon: PenSquare, label: "Image Reflection" },
  ]},
];

export function BlockEditor({ blocks, onChange }: { blocks: ContentBlock[]; onChange: (blocks: ContentBlock[]) => void }) {
  const addBlock = (type: string, index: number) => {
    let newBlock: ContentBlock;
    const id = crypto.randomUUID();
    switch (type) {
      case "text": newBlock = { type: "text", id, html: "" }; break;
      case "image": newBlock = { type: "image", id, url: "", alt: "" }; break;
      case "video": newBlock = { type: "video", id, url: "", title: "" } as VideoBlock; break;
      case "quiz": newBlock = { type: "quiz", id, question: "", options: [{ id: crypto.randomUUID(), text: "", isCorrect: false }, { id: crypto.randomUUID(), text: "", isCorrect: false }] }; break;
      case "checklist": newBlock = { type: "checklist", id, title: "", items: [{ id: crypto.randomUUID(), text: "", isCorrect: false }] }; break;
      case "trueFalse": newBlock = { type: "trueFalse", id, statement: "", isTrue: true }; break;
      case "fillBlanks": newBlock = { type: "fillBlanks", id, title: "", text: "", answers: [] }; break;
      case "dialogCards": newBlock = { type: "dialogCards", id, title: "", cards: [{ id: crypto.randomUUID(), front: "", back: "", bgColor: "#ffffff" }] }; break;
      case "reflection": newBlock = { type: "reflection", id, prompt: "", helpText: "", inputSize: "medium", passingPercentage: 0 }; break;
      case "multimediaChoice": newBlock = { type: "multimediaChoice", id, question: "", options: [{ id: crypto.randomUUID(), imageUrl: "", label: "", isCorrect: false }], multipleChoice: false, showScore: true, allowRetry: true, allowReveal: true, onePointForAll: false, columnsPerRow: 3 }; break;
      case "crossword": newBlock = { type: "crossword", id, title: "", words: [{ id: crypto.randomUUID(), word: "", clue: "" }] }; break;
      case "dragDrop": newBlock = { type: "dragDrop", id, title: "", pairs: [{ id: crypto.randomUUID(), left: "", right: "" }] }; break;
      case "sortParagraphs": newBlock = { type: "sortParagraphs", id, title: "", paragraphs: [{ id: crypto.randomUUID(), text: "" }] }; break;
      case "sortImages": newBlock = { type: "sortImages", id, title: "", images: [{ id: crypto.randomUUID(), url: "", label: "" }] }; break;
      case "memoryGame": { const pId = crypto.randomUUID(); newBlock = { type: "memoryGame", id, title: "", pairs: [], cards: [{ id: crypto.randomUUID(), contentType: "text", text: "", pairId: pId, bgColor: "#3b82f6" }, { id: crypto.randomUUID(), contentType: "text", text: "", pairId: pId, bgColor: "#3b82f6" }], backImage: "", gridColumns: 4, gridRows: 3, completionMessage: "" }; break; }
      case "imageJuxtaposition": newBlock = { type: "imageJuxtaposition", id, title: "", imageBefore: "", imageAfter: "" }; break;
      case "dragWords": newBlock = { type: "dragWords", id, title: "", text: "", blanks: [], distractors: [] }; break;
      case "fillWords": newBlock = { type: "fillWords", id, title: "", text: "", blanks: [] }; break;
      case "markWords": newBlock = { type: "markWords", id, title: "", text: "" }; break;
      case "questionSet": newBlock = { type: "questionSet", id, title: "", exercises: [], showScore: true }; break;
      case "imageHotspot": newBlock = { type: "imageHotspot", id, title: "", baseImage: "", hotspots: [] }; break;
      case "findHotspot": newBlock = { type: "findHotspot", id, title: "", baseImage: "", areas: [], showScore: true, allowReveal: true, feedbackEmpty: "You didn't locate any hotspots, try again!", feedbackFound: "You have already found this one!" }; break;
      case "accordion": newBlock = { type: "accordion", id, title: "", items: [{ id: crypto.randomUUID(), title: "", body: "" }] }; break;
      case "imageReflection": newBlock = { type: "imageReflection", id, title: "", baseImage: "", inputBoxes: [], completionMessage: "Thank you for your reflection!" } as ImageReflectionBlock; break;
      case "imageSlider": newBlock = { type: "imageSlider", id, title: "", images: [{ id: crypto.randomUUID(), url: "" }] } as ImageSliderBlock; break;
      case "flashcards": newBlock = { type: "flashcards", id, title: "", cards: [{ id: crypto.randomUUID(), imageUrl: "", text: "", mode: "open" }], feedbackOpen: "Thank you for your answer!" } as FlashcardsBlock; break;
      case "answerCards": newBlock = { type: "answerCards", id, title: "", cards: [{ id: crypto.randomUUID(), imageUrl: "", buttonLabel: "Show the answer", revealedText: "" }] } as AnswerCardsBlock; break;
      case "branchingScenario": {
        const startId = crypto.randomUUID();
        const defaultEndId = crypto.randomUUID();
        newBlock = {
          type: "branchingScenario", id, title: "", startNodeId: startId,
          nodes: [{ id: startId, type: "branchingQuestion", title: "Start", question: "", choices: [] }],
          endScenes: [{ id: defaultEndId, type: "default", title: "The End", text: "You have completed this scenario." }],
        } as BranchingScenarioBlock;
        break;
      }
      case "sqlExercise": newBlock = { type: "sqlExercise", id, title: "", setupSql: "", taskDescription: "", starterCode: "", solutionQuery: "", expectedColumns: [], expectedRows: [] } as SqlExerciseBlock; break;
      case "table": {
        const makeCell = () => ({ id: crypto.randomUUID(), html: "" });
        newBlock = { type: "table", id, title: "", cells: [[makeCell(), makeCell()], [makeCell(), makeCell()]], headerRow: false, borderStyle: "solid", borderWidth: 1, borderColor: "#e5e7eb" } as TableBlock;
        break;
      }
      case "splitScreen": newBlock = { type: "splitScreen", id, left: null, right: null } as SplitScreenBlock; break;
      default: return;
    }
    const next = [...blocks]; next.splice(index, 0, newBlock); onChange(next);
  };

  const updateBlock = (id: string, updated: ContentBlock) => onChange(blocks.map(b => b.id === id ? updated : b));
  const removeBlock = (id: string) => onChange(blocks.filter(b => b.id !== id));
  const moveBlock = (index: number, dir: "up" | "down") => {
    const ni = dir === "up" ? index - 1 : index + 1;
    if (ni < 0 || ni >= blocks.length) return;
    const next = [...blocks]; [next[index], next[ni]] = [next[ni], next[index]]; onChange(next);
  };

  const AddMenu = ({ index }: { index: number }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const add = (type: string) => { addBlock(type, index); setOpen(false); };

    useEffect(() => {
      if (open) {
        const id = requestAnimationFrame(() => inputRef.current?.focus());
        return () => cancelAnimationFrame(id);
      }
    }, [open]);

    const filteredSections = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return BLOCK_SECTIONS;
      return BLOCK_SECTIONS
        .map(s => ({ ...s, items: s.items.filter(i => i.label.toLowerCase().includes(q)) }))
        .filter(s => s.items.length > 0);
    }, [query]);

    const hasResults = filteredSections.length > 0;

    return (
      <div className="flex justify-center py-1">
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => setOpen(true)}>
          <Plus className="h-3 w-3" /> Add Block
        </Button>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
          <DialogContent className="max-w-xs p-0">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle className="text-sm">Add Block</DialogTitle>
            </DialogHeader>
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && query.length > 0) {
                      e.preventDefault();
                      e.stopPropagation();
                      setQuery("");
                    }
                  }}
                  placeholder="Quick search"
                  className="h-8 pl-7 pr-7 text-sm"
                />
                {query.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <ScrollArea className="h-[60vh] px-2 pb-3">
              {hasResults ? (
                filteredSections.map((section, sIdx) => (
                  <div key={section.name}>
                    {sIdx > 0 && <div className="my-1 h-px bg-border mx-3" />}
                    <p className="text-xs font-medium text-muted-foreground px-3 py-1.5">{section.name}</p>
                    {section.items.map(item => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.type}
                          onClick={() => add(item.type)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-150 text-left"
                        >
                          <Icon className="h-4 w-4" />{item.label}
                        </button>
                      );
                    })}
                  </div>
                ))
              ) : (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">No blocks found</p>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <AddMenu index={0} />
      {blocks.map((block, i) => (
        <div key={block.id}>
          <div className="border-2 border-border rounded-lg p-4 bg-card relative group shadow-sm">
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveBlock(i, "up")} disabled={i === 0}><ChevronUp className="h-3 w-3" /></Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveBlock(i, "down")} disabled={i === blocks.length - 1}><ChevronDown className="h-3 w-3" /></Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeBlock(block.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
            {block.type === "text" && (
              <RichTextEditor value={(block as TextBlock).html} onChange={(html) => updateBlock(block.id, { ...block, html } as TextBlock)} placeholder="Write your content..." />
            )}
            {block.type === "image" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ImageIcon className="h-3.5 w-3.5" /> Image</div>
                <MediaUpload value={block.url} onChange={(url) => updateBlock(block.id, { ...block, url })} accept="image/*" placeholder="Image URL or upload..." />
                <input placeholder="Alt text (optional)" value={block.alt || ""} onChange={(e) => updateBlock(block.id, { ...block, alt: e.target.value })} className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background" />
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Width: {(block as ImageBlock).widthPercent || 100}%</span>
                  <Slider min={25} max={100} step={5} value={[(block as ImageBlock).widthPercent || 100]} onValueChange={([v]) => updateBlock(block.id, { ...block, widthPercent: v } as ImageBlock)} className="flex-1" />
                </div>
              </div>
            )}
            {block.type === "video" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Video className="h-3.5 w-3.5" /> Video</div>
                <MediaUpload value={(block as VideoBlock).url} onChange={(url) => updateBlock(block.id, { ...block, url } as VideoBlock)} accept="video/*" placeholder="Video URL or upload..." />
                <input placeholder="Title (optional)" value={(block as VideoBlock).title || ""} onChange={(e) => updateBlock(block.id, { ...block, title: e.target.value } as VideoBlock)} className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background" />
              </div>
            )}
            {block.type === "quiz" && <QuizEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "checklist" && <ChecklistEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "trueFalse" && <TrueFalseEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "fillBlanks" && <FillBlanksEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "dialogCards" && <DialogCardsEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "reflection" && <ReflectionEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "multimediaChoice" && <MultimediaChoiceEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "crossword" && <CrosswordEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "dragDrop" && <DragDropEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "sortParagraphs" && <SortParagraphsEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "sortImages" && <SortImagesEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "memoryGame" && <MemoryGameEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "imageJuxtaposition" && <ImageJuxtapositionEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "dragWords" && <DragWordsEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "fillWords" && <FillWordsEditor exercise={block as FillWordsBlock} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "markWords" && <MarkWordsEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "questionSet" && <QuestionSetEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "imageHotspot" && <ImageHotspotEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "findHotspot" && <FindHotspotEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "accordion" && <AccordionEditor exercise={block} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "imageReflection" && <ImageReflectionEditor exercise={block as ImageReflectionBlock} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "imageSlider" && <ImageSliderEditor exercise={block as ImageSliderBlock} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "flashcards" && <FlashcardsEditor exercise={block as FlashcardsBlock} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "branchingScenario" && <BranchingScenarioEditor exercise={block as BranchingScenarioBlock} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "answerCards" && <AnswerCardsEditor exercise={block as AnswerCardsBlock} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "sqlExercise" && <SqlExerciseEditor exercise={block as SqlExerciseBlock} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "table" && <TableEditor exercise={block as TableBlock} onChange={(u) => updateBlock(block.id, u)} />}
            {block.type === "splitScreen" && <SplitScreenEditor exercise={block as SplitScreenBlock} onChange={(u) => updateBlock(block.id, u)} />}
          </div>
          <AddMenu index={i + 1} />
        </div>
      ))}
    </div>
  );
}
