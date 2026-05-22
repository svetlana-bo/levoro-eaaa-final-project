import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, HelpCircle, ListChecks, ToggleLeft, PenLine, Layers, MessageSquare, ImageIcon, Grid3X3, GripHorizontal, ArrowUpDown, ArrowDownUp, Puzzle, SplitSquareHorizontal, ClipboardList, ChevronUp, ChevronDown, MapPin, ChevronsUpDown, MousePointerClick, Circle, Square, Info, Highlighter } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  QuizBlock, ChecklistBlock, TrueFalseBlock, FillBlanksBlock, DialogCardsBlock, ReflectionBlock,
  MultimediaChoiceBlock, CrosswordBlock, DragDropBlock, SortParagraphsBlock, SortImagesBlock,
  MemoryGameBlock, ImageJuxtapositionBlock, DragWordsBlock, FillWordsBlock, FillWordsBlank, FillWordsOption, MarkWordsBlock, QuestionSetBlock, ImageHotspotBlock, FindHotspotBlock, AccordionBlock, ImageReflectionBlock, ImageSliderBlock, FlashcardsBlock, FlashcardItem, AnswerCardsBlock, AnswerCardItem, ContentBlock, SqlExerciseBlock, TableBlock, TableCell,
  QuizOption, ChecklistItem, DialogCard, MultimediaOption, CrosswordWord, DragDropPair, MemoryPair, MemoryCard, DragWordsBlank, DragWordsDistractor, Hotspot, ClickableArea, AccordionItem, ImageReflectionInputBox, ImageSliderImage,
  SplitScreenBlock, SplitScreenInnerBlock
} from "./types";
import { FeedbackConfigEditor } from "./FeedbackConfigEditor";
import { MediaUpload } from "@/components/MediaUpload";
import { ExerciseImageField } from "./ExerciseImageField";
import { RichTextEditor } from "./RichTextEditor";
import { InlineTitleEditor } from "./InlineTitleEditor";
import { TableTitleEditor } from "./TableTitleEditor";
import { sanitizeDialogCardHtml, normalizeRichTextHtml } from "@/lib/sanitize";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";

/* ── Helper: Optional description field using RichTextEditor ── */
function DescriptionField({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const [visible, setVisible] = useState(!!value);
  if (!visible && !value) {
    return (
      <button type="button" onClick={() => setVisible(true)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 pt-2 border-t border-border/30">
        <Plus className="h-3 w-3" /> Add description
      </button>
    );
  }
  return (
    <div className="pt-2 border-t border-border/30 space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">Description (optional)</Label>
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => { onChange(""); setVisible(false); }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
      </div>
      <RichTextEditor value={value || ""} onChange={onChange} placeholder="Add a description or instructions for this exercise..." />
    </div>
  );
}

/* ── Helper: Feedback config wrapper ── */
function FeedbackSection({ exercise, onChange }: { exercise: any; onChange: (e: any) => void }) {
  return (
    <FeedbackConfigEditor
      feedbackRanges={exercise.feedbackRanges}
      passingPercentage={exercise.passingPercentage}
      onChange={(ranges, pct) => onChange({ ...exercise, feedbackRanges: ranges, passingPercentage: pct })}
    />
  );
}

/* ── Helper: Image field wrapper ── */
function ImageSection({ exercise, onChange }: { exercise: any; onChange: (e: any) => void }) {
  return (
    <ExerciseImageField
      imageUrl={exercise.imageUrl}
      onChange={(url) => onChange({ ...exercise, imageUrl: url })}
    />
  );
}

export function QuizEditor({ exercise, onChange }: { exercise: QuizBlock; onChange: (e: QuizBlock) => void }) {
  const isMulti = exercise.multipleChoice ?? false;
  const addOption = () => onChange({ ...exercise, options: [...exercise.options, { id: crypto.randomUUID(), text: "", isCorrect: false }] });
  const updateOption = (optId: string, field: Partial<QuizOption>) => {
    // Allow any number of correct answers regardless of selection mode.
    // In Single Choice mode the learner still picks only one option, but any
    // option flagged "correct" will validate as correct on the learner side.
    onChange({ ...exercise, options: exercise.options.map(o => o.id === optId ? { ...o, ...field } : o) });
  };
  const removeOption = (optId: string) => onChange({ ...exercise, options: exercise.options.filter(o => o.id !== optId) });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><HelpCircle className="h-3.5 w-3.5" /> Quiz Question</div>
      <ImageSection exercise={exercise} onChange={onChange} />

      {/* Selection mode toggle */}
      <div className="flex items-center gap-4 p-3 rounded-lg border border-border/50 bg-background">
        <Label className="text-sm font-medium">Selection Mode</Label>
        <div className="flex gap-1">
          <Button variant={!isMulti ? "default" : "outline"} size="sm" onClick={() => onChange({ ...exercise, multipleChoice: false })}>
            Single Choice
          </Button>
          <Button variant={isMulti ? "default" : "outline"} size="sm" onClick={() => onChange({ ...exercise, multipleChoice: true })}>
            Multiple Choice
          </Button>
        </div>
      </div>

      <RichTextEditor value={exercise.question} onChange={(v) => onChange({ ...exercise, question: normalizeRichTextHtml(v) })} placeholder="Enter your question..." />

      {/* Individual feedback toggle */}
      <div className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border/50 bg-background">
        <Label className="text-sm font-medium">Give individual feedback for each choice</Label>
        <Switch
          checked={exercise.individualFeedback ?? false}
          onCheckedChange={(v) => onChange({ ...exercise, individualFeedback: !!v })}
        />
      </div>

      <div className="space-y-2">
        {exercise.options.map(opt => (
          <div key={opt.id} className="space-y-2">
            <div className="flex items-center gap-3 p-2 rounded-lg border border-border/50 bg-background">
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Correct</Label>
                <Switch checked={opt.isCorrect} onCheckedChange={(v) => updateOption(opt.id, { isCorrect: !!v })} />
              </div>
              <Input className="flex-1" placeholder="Answer option..." value={opt.text} onChange={(e) => updateOption(opt.id, { text: e.target.value })} />
              <Button variant="ghost" size="sm" onClick={() => removeOption(opt.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
            {(exercise.individualFeedback ?? false) && (
              <Textarea
                className="ml-2"
                placeholder="Feedback for this choice (optional)..."
                value={opt.feedback ?? ""}
                onChange={(e) => updateOption(opt.id, { feedback: e.target.value })}
              />
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addOption} className="gap-1"><Plus className="h-3 w-3" /> Add Option</Button>
      </div>

      {/* Quiz behavior toggles */}
      <div className="space-y-2 p-3 rounded-lg border border-border/50 bg-background">
        <Label className="text-sm font-medium">Quiz Options</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Show score to learner</Label>
            <Switch checked={exercise.showScore ?? true} onCheckedChange={(v) => onChange({ ...exercise, showScore: !!v })} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Allow retry</Label>
            <Switch checked={exercise.allowRetry ?? true} onCheckedChange={(v) => onChange({ ...exercise, allowRetry: !!v })} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Allow reveal answer</Label>
            <Switch checked={exercise.allowReveal ?? true} onCheckedChange={(v) => onChange({ ...exercise, allowReveal: !!v })} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">One point for whole task</Label>
            <Switch checked={exercise.onePointForAll ?? false} onCheckedChange={(v) => onChange({ ...exercise, onePointForAll: !!v })} />
          </div>
        </div>
      </div>

      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />
      <FeedbackSection exercise={exercise} onChange={onChange} />
    </div>
  );
}

export function ChecklistEditor({ exercise, onChange }: { exercise: ChecklistBlock; onChange: (e: ChecklistBlock) => void }) {
  const addItem = () => onChange({ ...exercise, items: [...exercise.items, { id: crypto.randomUUID(), text: "", isCorrect: false }] });
  const updateItem = (itemId: string, field: Partial<ChecklistItem>) => onChange({ ...exercise, items: exercise.items.map(i => i.id === itemId ? { ...i, ...field } : i) });
  const removeItem = (itemId: string) => onChange({ ...exercise, items: exercise.items.filter(i => i.id !== itemId) });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ListChecks className="h-3.5 w-3.5" /> Checklist</div>
      <ImageSection exercise={exercise} onChange={onChange} />
      <RichTextEditor value={exercise.title} onChange={(v) => onChange({ ...exercise, title: v })} placeholder="Checklist title..." />
      <div className="space-y-2">
        {exercise.items.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">✓</Label>
              <Switch checked={item.isCorrect} onCheckedChange={(v) => updateItem(item.id, { isCorrect: v })} />
            </div>
            <Input className="flex-1" placeholder="Checklist item..." value={item.text} onChange={(e) => updateItem(item.id, { text: e.target.value })} />
            <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem} className="gap-1"><Plus className="h-3 w-3" /> Add Item</Button>
      </div>
      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />
      <FeedbackSection exercise={exercise} onChange={onChange} />
    </div>
  );
}

export function TrueFalseEditor({ exercise, onChange }: { exercise: TrueFalseBlock; onChange: (e: TrueFalseBlock) => void }) {
  const labelA = exercise.labelTrue || "True";
  const labelB = exercise.labelFalse || "False";
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ToggleLeft className="h-3.5 w-3.5" /> True / False</div>
      <ImageSection exercise={exercise} onChange={onChange} />
      <RichTextEditor value={exercise.statement} onChange={(v) => onChange({ ...exercise, statement: normalizeRichTextHtml(v) })} placeholder="Enter the statement..." />

      {/* Custom labels */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Option A label</Label>
          <Input value={exercise.labelTrue || ""} onChange={(e) => onChange({ ...exercise, labelTrue: e.target.value })} placeholder="True" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Option B label</Label>
          <Input value={exercise.labelFalse || ""} onChange={(e) => onChange({ ...exercise, labelFalse: e.target.value })} placeholder="False" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm">Correct answer:</Label>
        <Button variant={exercise.isTrue ? "default" : "outline"} size="sm" onClick={() => onChange({ ...exercise, isTrue: true })}>{labelA}</Button>
        <Button variant={!exercise.isTrue ? "default" : "outline"} size="sm" onClick={() => onChange({ ...exercise, isTrue: false })}>{labelB}</Button>
      </div>

      {/* Per-answer feedback */}
      <div className="space-y-2 p-3 rounded-lg border border-border/50 bg-background">
        <Label className="text-sm font-medium">Answer Feedback</Label>
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Feedback for correct answer</Label>
            <Input value={exercise.feedbackCorrect || ""} onChange={(e) => onChange({ ...exercise, feedbackCorrect: e.target.value })} placeholder="e.g. Well done! That's right." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Feedback for incorrect answer</Label>
            <Input value={exercise.feedbackIncorrect || ""} onChange={(e) => onChange({ ...exercise, feedbackIncorrect: e.target.value })} placeholder="e.g. Not quite. Try again." />
          </div>
        </div>
      </div>

      {/* Behavior toggles */}
      <div className="space-y-2 p-3 rounded-lg border border-border/50 bg-background">
        <Label className="text-sm font-medium">Options</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Show score to learner</Label>
            <Switch checked={exercise.showScore ?? true} onCheckedChange={(v) => onChange({ ...exercise, showScore: !!v })} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Allow retry</Label>
            <Switch checked={exercise.allowRetry ?? true} onCheckedChange={(v) => onChange({ ...exercise, allowRetry: !!v })} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Allow reveal answer</Label>
            <Switch checked={exercise.allowReveal ?? true} onCheckedChange={(v) => onChange({ ...exercise, allowReveal: !!v })} />
          </div>
        </div>
      </div>

      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />
    </div>
  );
}

export function FillBlanksEditor({ exercise, onChange }: { exercise: FillBlanksBlock; onChange: (e: FillBlanksBlock) => void }) {
  const rawText = exercise.text.replace(/<[^>]+>/g, '');
  const blankCount = (rawText.match(/___/g) || []).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><PenLine className="h-3.5 w-3.5" /> Fill in the Blanks</div>
      <ImageSection exercise={exercise} onChange={onChange} />
      <Input placeholder="Title (optional)" value={exercise.title} onChange={(e) => onChange({ ...exercise, title: e.target.value })} />
      <RichTextEditor value={exercise.text} onChange={(v) => onChange({ ...exercise, text: v })} placeholder='Write text with ___ for blanks. Example: "One thing I can improve is ___."' />
      {blankCount > 0 && (
        <p className="text-xs text-muted-foreground">{blankCount} blank{blankCount > 1 ? "s" : ""} detected. Learners will fill these in freely — no correct answers required.</p>
      )}
      {blankCount === 0 && (
        <p className="text-xs text-amber-600">Use ___ (three underscores) to create blanks in the text above.</p>
      )}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Completion feedback message (optional)</Label>
        <Input value={exercise.completionMessage || ""} onChange={(e) => onChange({ ...exercise, completionMessage: e.target.value })} placeholder="e.g. Thank you for your response!" />
      </div>
      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />
    </div>
  );
}

export function DialogCardsEditor({ exercise, onChange }: { exercise: DialogCardsBlock; onChange: (e: DialogCardsBlock) => void }) {
  const addCard = () => onChange({ ...exercise, cards: [...exercise.cards, { id: crypto.randomUUID(), front: "", back: "", bgColor: "#ffffff", sameImage: false }] });
  const updateCard = (cardId: string, field: Partial<DialogCard>) => onChange({ ...exercise, cards: exercise.cards.map(c => c.id === cardId ? { ...c, ...field } : c) });
  const removeCard = (cardId: string) => onChange({ ...exercise, cards: exercise.cards.filter(c => c.id !== cardId) });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Layers className="h-3.5 w-3.5" /> Dialogue Cards</div>
      <ImageSection exercise={exercise} onChange={onChange} />
      <Input placeholder="Section title (optional)" value={exercise.title} onChange={(e) => onChange({ ...exercise, title: e.target.value })} />
      <p className="text-xs text-muted-foreground italic">Dialog Cards use one standard text style so every card looks consistent. Bold, italic, underline, lists, and links are kept — headings, font sizes, colors, and alignment are removed automatically.</p>
      <div className="space-y-3">
        {exercise.cards.map((card, i) => (
          <div key={card.id} className="border border-border/50 rounded-lg p-4 bg-background space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Card {i + 1}</span>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Background</Label>
                <input type="color" value={card.bgColor || "#ffffff"} onChange={(e) => updateCard(card.id, { bgColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer border border-border" />
                <Button variant="ghost" size="sm" onClick={() => removeCard(card.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
            </div>

            {/* Front side */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium">Front Side</Label>
              <MediaUpload value={card.frontImage || ""} onChange={(url) => {
                const updates: Partial<DialogCard> = { frontImage: url };
                if (card.sameImage) updates.backImage = url;
                updateCard(card.id, updates);
              }} accept="image/*" placeholder="Front image URL or upload..." />
              <RichTextEditor value={card.front} onChange={(v) => updateCard(card.id, { front: sanitizeDialogCardHtml(v) })} placeholder="Front text..." />
            </div>

            {/* Same image toggle */}
            <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
              <Label className="text-xs font-medium">Use same image for both sides</Label>
              <Switch checked={card.sameImage ?? false} onCheckedChange={(v) => {
                const updates: Partial<DialogCard> = { sameImage: v };
                if (v && card.frontImage) updates.backImage = card.frontImage;
                updateCard(card.id, updates);
              }} />
            </div>

            {/* Text position */}
            <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
              <Label className="text-xs font-medium">Text position</Label>
              <div className="flex gap-1">
                {([{ value: "below-card", label: "Below card" }, { value: "on-card", label: "On card" }] as const).map(opt => (
                  <Button
                    key={opt.value}
                    variant={(card.textPosition || "below-card") === opt.value ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7 px-3"
                    onClick={() => updateCard(card.id, { textPosition: opt.value })}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Back side */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-medium">Back Side</Label>
              {!card.sameImage && (
                <MediaUpload value={card.backImage || ""} onChange={(url) => updateCard(card.id, { backImage: url })} accept="image/*" placeholder="Back image URL or upload..." />
              )}
              <RichTextEditor value={card.back} onChange={(v) => updateCard(card.id, { back: sanitizeDialogCardHtml(v) })} placeholder="Back text..." />
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addCard} className="gap-1"><Plus className="h-3 w-3" /> Add Card</Button>
      </div>

      {/* Flip Speed */}
      <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
        <Label className="text-xs font-medium">Flip Speed</Label>
        <div className="flex gap-1">
          {(["fast", "medium", "slow"] as const).map(speed => (
            <Button
              key={speed}
              variant={(exercise.flipSpeed || "fast") === speed ? "default" : "outline"}
              size="sm"
              className="text-xs h-7 px-3 capitalize"
              onClick={() => onChange({ ...exercise, flipSpeed: speed })}
            >
              {speed}
            </Button>
          ))}
        </div>
      </div>

      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />
    </div>
  );
}

export function ReflectionEditor({ exercise, onChange }: { exercise: ReflectionBlock; onChange: (e: ReflectionBlock) => void }) {
  const inputSize = exercise.inputSize || "medium";
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><MessageSquare className="h-3.5 w-3.5" /> Reflection</div>
      <ImageSection exercise={exercise} onChange={onChange} />

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground font-medium">Task Description *</Label>
        <p className="text-[11px] text-muted-foreground/70">Describe your task here. The task description will appear above the input area.</p>
        <RichTextEditor value={exercise.prompt} onChange={(v) => onChange({ ...exercise, prompt: v })} placeholder="Write the reflection prompt for the student..." />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground font-medium">Help Text</Label>
        <p className="text-[11px] text-muted-foreground/70">This text should help the user to get started. It appears as placeholder text inside the input field.</p>
        <Input
          value={exercise.helpText || ""}
          onChange={(e) => onChange({ ...exercise, helpText: e.target.value })}
          placeholder="e.g. Think about boundaries like not using employer time..."
          className="text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground font-medium">Input field size</Label>
        <p className="text-[11px] text-muted-foreground/70">The size of the input field in amount of lines it will cover.</p>
        <div className="flex gap-2">
          {([["small", "Small (1 line)"], ["medium", "Medium (3 lines)"], ["large", "Large (8 lines)"]] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => onChange({ ...exercise, inputSize: val })}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${inputSize === val ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-accent"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground font-medium">Completion Message (optional)</Label>
        <p className="text-[11px] text-muted-foreground/70">Shown after the learner submits their reflection.</p>
        <Input
          value={(exercise as any).completionMessage || ""}
          onChange={(e) => onChange({ ...exercise, completionMessage: e.target.value })}
          placeholder="e.g. Thank you for reflecting!"
          className="text-sm"
        />
      </div>
    </div>
  );
}

/* ── New Editors ── */

export function MultimediaChoiceEditor({ exercise, onChange }: { exercise: MultimediaChoiceBlock; onChange: (e: MultimediaChoiceBlock) => void }) {
  const addOption = () => onChange({ ...exercise, options: [...exercise.options, { id: crypto.randomUUID(), imageUrl: "", label: "", isCorrect: false }] });
  const updateOption = (optId: string, field: Partial<MultimediaOption>) => {
    if (field.isCorrect && !exercise.multipleChoice) {
      // Single choice: uncheck all others
      onChange({ ...exercise, options: exercise.options.map(o => o.id === optId ? { ...o, ...field } : { ...o, isCorrect: false }) });
    } else {
      onChange({ ...exercise, options: exercise.options.map(o => o.id === optId ? { ...o, ...field } : o) });
    }
  };
  const removeOption = (optId: string) => onChange({ ...exercise, options: exercise.options.filter(o => o.id !== optId) });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ImageIcon className="h-3.5 w-3.5" /> Multimedia Choice</div>
      <ImageSection exercise={exercise} onChange={onChange} />
      <RichTextEditor value={exercise.question} onChange={(v) => onChange({ ...exercise, question: normalizeRichTextHtml(v) })} placeholder="Enter your question..." />

      {/* Selection mode */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <Label className="text-sm font-medium">Multiple Choice (Checkboxes)</Label>
        <Switch checked={exercise.multipleChoice ?? false} onCheckedChange={(v) => onChange({ ...exercise, multipleChoice: v })} />
      </div>

      {/* Grid columns */}
      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
        <Label className="text-sm font-medium whitespace-nowrap">Items per row</Label>
        <Select value={String(exercise.columnsPerRow ?? 3)} onValueChange={(v) => onChange({ ...exercise, columnsPerRow: parseInt(v) })}>
          <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Behavior toggles */}
      <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between"><Label className="text-sm">Show Score</Label><Switch checked={exercise.showScore ?? true} onCheckedChange={(v) => onChange({ ...exercise, showScore: v })} /></div>
        <div className="flex items-center justify-between"><Label className="text-sm">Allow Retry</Label><Switch checked={exercise.allowRetry ?? true} onCheckedChange={(v) => onChange({ ...exercise, allowRetry: v })} /></div>
        <div className="flex items-center justify-between"><Label className="text-sm">Allow Reveal Answer</Label><Switch checked={exercise.allowReveal ?? true} onCheckedChange={(v) => onChange({ ...exercise, allowReveal: v })} /></div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">Give one point for the whole question</Label>
            <p className="text-xs text-muted-foreground">Learner must get all answers correct to receive the point</p>
          </div>
          <Switch checked={exercise.onePointForAll ?? false} onCheckedChange={(v) => onChange({ ...exercise, onePointForAll: v })} />
        </div>
      </div>

      <div className="space-y-3">
        {exercise.options.map((opt, i) => (
          <div key={opt.id} className="border border-border/50 rounded-lg p-3 bg-background space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Option {i + 1}</span>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Correct</Label>
                <Switch checked={opt.isCorrect} onCheckedChange={(v) => updateOption(opt.id, { isCorrect: v })} />
                <Button variant="ghost" size="sm" onClick={() => removeOption(opt.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
            </div>
            <MediaUpload value={opt.imageUrl} onChange={(url) => updateOption(opt.id, { imageUrl: url })} accept="image/*" placeholder="Upload image or paste URL..." />
            <Input placeholder="Label (optional)..." value={opt.label || ""} onChange={(e) => updateOption(opt.id, { label: e.target.value })} />
            {opt.imageUrl && <img src={opt.imageUrl} alt={opt.label} className="max-h-24 rounded-md object-cover" />}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addOption} className="gap-1"><Plus className="h-3 w-3" /> Add Image Option</Button>
      </div>
      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />
      <FeedbackSection exercise={exercise} onChange={onChange} />
    </div>
  );
}

export function CrosswordEditor({ exercise, onChange }: { exercise: CrosswordBlock; onChange: (e: CrosswordBlock) => void }) {
  const addWord = () => onChange({ ...exercise, words: [...exercise.words, { id: crypto.randomUUID(), word: "", clue: "" }] });
  const updateWord = (wId: string, field: Partial<CrosswordWord>) => onChange({ ...exercise, words: exercise.words.map(w => w.id === wId ? { ...w, ...field } : w) });
  const removeWord = (wId: string) => onChange({ ...exercise, words: exercise.words.filter(w => w.id !== wId) });

  const hasSolution = exercise.solutionWord !== undefined;
  const solutionDir = exercise.solutionDirection || "across";
  const mappings = exercise.solutionMappings || [];

  const toggleSolution = () => {
    if (hasSolution) {
      onChange({ ...exercise, solutionWord: undefined, solutionHint: undefined, solutionDirection: undefined, solutionMappings: undefined });
    } else {
      onChange({ ...exercise, solutionWord: "", solutionDirection: "across", solutionMappings: [] });
    }
  };

  const setSolutionWord = (val: string) => {
    const word = val.toUpperCase().replace(/[^A-Z]/g, "");
    // Auto-create mapping slots
    const newMappings = Array.from({ length: word.length }, (_, i) => mappings[i] || { wordIndex: -1, letterIndex: -1 });
    onChange({ ...exercise, solutionWord: word, solutionMappings: newMappings.slice(0, word.length) });
  };

  const updateMapping = (solIndex: number, wordIndex: number, letterIndex: number) => {
    const next = [...mappings];
    next[solIndex] = { wordIndex, letterIndex };
    onChange({ ...exercise, solutionMappings: next });
  };

  const solWord = exercise.solutionWord || "";
  const allMapped = solWord.length > 0 && mappings.length === solWord.length && mappings.every(m => m.wordIndex >= 0 && m.letterIndex >= 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Grid3X3 className="h-3.5 w-3.5" /> Crossword</div>

      {/* Solution Word Toggle — right at the top */}
      <div className="border border-border/50 rounded-lg p-3 bg-background space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Solution Word (optional)</label>
          <Switch checked={hasSolution} onCheckedChange={toggleSolution} />
        </div>
        {hasSolution && (
          <div className="space-y-3">
            <Input placeholder="Solution word (e.g. YOLO)..." value={exercise.solutionWord || ""} onChange={(e) => setSolutionWord(e.target.value)} />
            <Input placeholder="Hint for the solution (optional)..." value={exercise.solutionHint || ""} onChange={(e) => onChange({ ...exercise, solutionHint: e.target.value })} />
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-muted-foreground">Direction:</label>
              <div className="flex gap-2">
                <Button variant={solutionDir === "across" ? "default" : "outline"} size="sm" onClick={() => onChange({ ...exercise, solutionDirection: "across" })}>
                  Horizontal
                </Button>
                <Button variant={solutionDir === "down" ? "default" : "outline"} size="sm" onClick={() => onChange({ ...exercise, solutionDirection: "down" })}>
                  Vertical
                </Button>
              </div>
            </div>
            {solWord.length > 0 && exercise.words.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Letter Mappings — assign each solution letter to a word</label>
                {solWord.split("").map((letter, si) => (
                  <div key={si} className="flex items-center gap-2 text-xs">
                    <span className="w-8 h-8 flex items-center justify-center bg-accent/30 rounded font-bold border border-accent">{letter}</span>
                    <span className="text-muted-foreground">←</span>
                    <Select value={mappings[si]?.wordIndex >= 0 ? `${mappings[si].wordIndex}-${mappings[si].letterIndex}` : ""} onValueChange={(v) => {
                      const [wi, li] = v.split("-").map(Number);
                      updateMapping(si, wi, li);
                    }}>
                      <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue placeholder="Select word & letter..." /></SelectTrigger>
                      <SelectContent>
                        {exercise.words.map((w, wi) =>
                          w.word.split("").map((ch, li) =>
                            ch === letter ? (
                              <SelectItem key={`${wi}-${li}`} value={`${wi}-${li}`}>
                                Word {wi + 1}: "{w.word}" — letter {li + 1} ({ch})
                              </SelectItem>
                            ) : null
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                {!allMapped && <p className="text-xs text-destructive">All solution letters must be mapped before the crossword can work.</p>}
              </div>
            )}
            {solWord.length === 0 && <p className="text-xs text-muted-foreground">Enter a solution word. Other words will cross through it in the grid.</p>}
          </div>
        )}
      </div>

      <ImageSection exercise={exercise} onChange={onChange} />
      <Input placeholder="Crossword title..." value={exercise.title} onChange={(e) => onChange({ ...exercise, title: e.target.value })} />
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Background Color</label>
        <div className="flex items-center gap-2">
          <input type="color" value={exercise.bgColor || "#f0f4f8"} onChange={(e) => onChange({ ...exercise, bgColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-border" />
          <Input className="w-32" value={exercise.bgColor || "#f0f4f8"} onChange={(e) => onChange({ ...exercise, bgColor: e.target.value })} placeholder="#f0f4f8" />
        </div>
      </div>
      <div className="space-y-2">
        {exercise.words.map((w, i) => (
          <div key={w.id} className="border border-border/50 rounded-lg p-3 bg-background space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Word {i + 1}</span>
              <Button variant="ghost" size="sm" onClick={() => removeWord(w.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
            <Input placeholder="Word (answer)..." value={w.word} onChange={(e) => updateWord(w.id, { word: e.target.value.toUpperCase().replace(/[^A-Z]/g, "") })} />
            <RichTextEditor value={w.clue} onChange={(v) => updateWord(w.id, { clue: v })} placeholder="Clue / question..." />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addWord} className="gap-1"><Plus className="h-3 w-3" /> Add Word</Button>
      </div>

      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />
      <FeedbackSection exercise={exercise} onChange={onChange} />
    </div>
  );
}

export function DragDropEditor({ exercise, onChange }: { exercise: DragDropBlock; onChange: (e: DragDropBlock) => void }) {
  const addPair = () => onChange({ ...exercise, pairs: [...exercise.pairs, { id: crypto.randomUUID(), left: "", right: "" }] });
  const updatePair = (pId: string, field: Partial<DragDropPair>) => onChange({ ...exercise, pairs: exercise.pairs.map(p => p.id === pId ? { ...p, ...field } : p) });
  const removePair = (pId: string) => onChange({ ...exercise, pairs: exercise.pairs.filter(p => p.id !== pId) });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><GripHorizontal className="h-3.5 w-3.5" /> Match Pairs</div>
      <ImageSection exercise={exercise} onChange={onChange} />
      <RichTextEditor value={exercise.title} onChange={(v) => onChange({ ...exercise, title: v })} placeholder="Title..." />
      <div className="space-y-2">
        {exercise.pairs.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
            <Input className="flex-1" placeholder="Left side..." value={p.left} onChange={(e) => updatePair(p.id, { left: e.target.value })} />
            <span className="text-xs text-muted-foreground">↔</span>
            <Input className="flex-1" placeholder="Right side..." value={p.right} onChange={(e) => updatePair(p.id, { right: e.target.value })} />
            <Button variant="ghost" size="sm" onClick={() => removePair(p.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addPair} className="gap-1"><Plus className="h-3 w-3" /> Add Pair</Button>
      </div>
      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />
      <FeedbackSection exercise={exercise} onChange={onChange} />
    </div>
  );
}

export function DragWordsEditor({ exercise, onChange }: { exercise: DragWordsBlock; onChange: (e: DragWordsBlock) => void }) {
  const rawText = exercise.text.replace(/<[^>]+>/g, '');
  const blankMatches = rawText.match(/\*([^*]+)\*/g) || [];
  const detectedBlanks = blankMatches.map(m => m.replace(/\*/g, ''));

  // Sync blanks with detected words
  const syncedBlanks: DragWordsBlank[] = detectedBlanks.map((word, i) => {
    const existing = exercise.blanks[i];
    return existing ? { ...existing, correctWord: word } : { id: crypto.randomUUID(), correctWord: word };
  });
  if (JSON.stringify(syncedBlanks) !== JSON.stringify(exercise.blanks)) {
    setTimeout(() => onChange({ ...exercise, blanks: syncedBlanks }), 0);
  }

  const addDistractor = () => onChange({ ...exercise, distractors: [...exercise.distractors, { id: crypto.randomUUID(), word: "" }] });
  const updateDistractor = (dId: string, word: string) => onChange({ ...exercise, distractors: exercise.distractors.map(d => d.id === dId ? { ...d, word } : d) });
  const removeDistractor = (dId: string) => onChange({ ...exercise, distractors: exercise.distractors.filter(d => d.id !== dId) });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><PenLine className="h-3.5 w-3.5" /> Drag the Words</div>
      <ImageSection exercise={exercise} onChange={onChange} />
      <Input placeholder="Title / Task description..." value={exercise.title} onChange={(e) => onChange({ ...exercise, title: e.target.value })} />
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Text with blanks</Label>
          <span className="text-xs text-muted-foreground italic">Wrap words in *asterisks* to create blanks</span>
        </div>
        <RichTextEditor value={exercise.text} onChange={(v) => onChange({ ...exercise, text: v })} placeholder='e.g. "*Oslo* is the capital of Norway, *Stockholm* is the capital of Sweden."' />
      </div>
      {detectedBlanks.length > 0 && (
        <p className="text-xs text-muted-foreground">{detectedBlanks.length} blank{detectedBlanks.length > 1 ? "s" : ""} detected: {detectedBlanks.join(", ")}</p>
      )}
      {detectedBlanks.length === 0 && (
        <p className="text-xs text-amber-600">Wrap words in *asterisks* to create draggable blanks.</p>
      )}

      {/* Distractors */}
      <div className="space-y-2 p-3 rounded-lg border border-border/50 bg-background">
        <Label className="text-sm font-medium">Distractors (wrong options)</Label>
        <p className="text-xs text-muted-foreground">Add extra words that are incorrect to increase difficulty.</p>
        {exercise.distractors.map(d => (
          <div key={d.id} className="flex items-center gap-2">
            <Input className="flex-1" placeholder="Distractor word..." value={d.word} onChange={(e) => updateDistractor(d.id, e.target.value)} />
            <Button variant="ghost" size="sm" onClick={() => removeDistractor(d.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addDistractor} className="gap-1"><Plus className="h-3 w-3" /> Add Distractor</Button>
      </div>

      {/* Behavior toggles */}
      <div className="space-y-2 p-3 rounded-lg border border-border/50 bg-background">
        <Label className="text-sm font-medium">Options</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Show score to learner</Label>
            <Switch checked={exercise.showScore ?? true} onCheckedChange={(v) => onChange({ ...exercise, showScore: !!v })} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Allow retry</Label>
            <Switch checked={exercise.allowRetry ?? true} onCheckedChange={(v) => onChange({ ...exercise, allowRetry: !!v })} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Allow reveal answer</Label>
            <Switch checked={exercise.allowReveal ?? true} onCheckedChange={(v) => onChange({ ...exercise, allowReveal: !!v })} />
          </div>
        </div>
      </div>

      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />
      <FeedbackSection exercise={exercise} onChange={onChange} />
    </div>
  );
}

export function FillWordsEditor({ exercise, onChange }: { exercise: FillWordsBlock; onChange: (e: FillWordsBlock) => void }) {
  const rawText = exercise.text.replace(/<[^>]+>/g, '');
  const blankMatches = rawText.match(/\*([^*]+)\*/g) || [];
  const detectedWords = blankMatches.map(m => m.replace(/\*/g, ''));

  // Sync blanks with detected positions; preserve existing options when count is stable
  const syncedBlanks: FillWordsBlank[] = detectedWords.map((word, i) => {
    const existing = exercise.blanks[i];
    if (existing && existing.options && existing.options.length > 0) return existing;
    return {
      id: existing?.id || crypto.randomUUID(),
      allCorrect: existing?.allCorrect ?? false,
      options: [{ id: crypto.randomUUID(), text: word, isCorrect: true }],
    };
  });
  if (JSON.stringify(syncedBlanks) !== JSON.stringify(exercise.blanks)) {
    setTimeout(() => onChange({ ...exercise, blanks: syncedBlanks }), 0);
  }

  const updateBlank = (bId: string, patch: Partial<FillWordsBlank>) =>
    onChange({ ...exercise, blanks: exercise.blanks.map(b => b.id === bId ? { ...b, ...patch } : b) });

  const addOption = (bId: string) =>
    updateBlank(bId, { options: [...(exercise.blanks.find(b => b.id === bId)?.options || []), { id: crypto.randomUUID(), text: "", isCorrect: false }] });

  const updateOption = (bId: string, oId: string, patch: Partial<FillWordsOption>) => {
    const blank = exercise.blanks.find(b => b.id === bId);
    if (!blank) return;
    updateBlank(bId, { options: blank.options.map(o => o.id === oId ? { ...o, ...patch } : o) });
  };

  const setCorrectOption = (bId: string, oId: string) => {
    const blank = exercise.blanks.find(b => b.id === bId);
    if (!blank) return;
    updateBlank(bId, { options: blank.options.map(o => ({ ...o, isCorrect: o.id === oId })) });
  };

  const removeOption = (bId: string, oId: string) => {
    const blank = exercise.blanks.find(b => b.id === bId);
    if (!blank) return;
    updateBlank(bId, { options: blank.options.filter(o => o.id !== oId) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ChevronDown className="h-3.5 w-3.5" /> Fill in the Words</div>
      <ImageSection exercise={exercise} onChange={onChange} />
      <Input placeholder="Title / Task description..." value={exercise.title} onChange={(e) => onChange({ ...exercise, title: e.target.value })} />
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Text with blanks</Label>
          <span className="text-xs text-muted-foreground italic">Wrap words in *asterisks* to create dropdowns</span>
        </div>
        <RichTextEditor value={exercise.text} onChange={(v) => onChange({ ...exercise, text: v })} placeholder='e.g. "The capital of Norway is *Oslo*."' />
      </div>
      {detectedWords.length === 0 && (
        <p className="text-xs text-amber-600">Wrap words in *asterisks* to create dropdown blanks.</p>
      )}

      {/* Per-blank options */}
      {exercise.blanks.length > 0 && (
        <div className="space-y-3">
          {exercise.blanks.map((blank, bi) => (
            <div key={blank.id} className="space-y-2 p-3 rounded-lg border border-border/50 bg-background">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-medium">Blank {bi + 1} options</Label>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">All options correct</Label>
                  <Switch checked={blank.allCorrect ?? false} onCheckedChange={(v) => updateBlank(blank.id, { allCorrect: v })} />
                </div>
              </div>
              {blank.options.map((opt) => (
                <div key={opt.id} className="flex items-center gap-2">
                  {!blank.allCorrect && (
                    <button
                      type="button"
                      onClick={() => setCorrectOption(blank.id, opt.id)}
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${opt.isCorrect ? "border-primary bg-primary" : "border-muted-foreground/40"}`}
                      title="Mark as correct"
                    >
                      {opt.isCorrect && <Circle className="h-2 w-2 fill-primary-foreground text-primary-foreground" />}
                    </button>
                  )}
                  <Input className="flex-1" placeholder="Option..." value={opt.text} onChange={(e) => updateOption(blank.id, opt.id, { text: e.target.value })} />
                  <Button variant="ghost" size="sm" onClick={() => removeOption(blank.id, opt.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addOption(blank.id)} className="gap-1"><Plus className="h-3 w-3" /> Add Option</Button>
            </div>
          ))}
        </div>
      )}

      {/* Behavior toggles */}
      <div className="space-y-2 p-3 rounded-lg border border-border/50 bg-background">
        <Label className="text-sm font-medium">Options</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Show score to learner</Label>
            <Switch checked={exercise.showScore ?? true} onCheckedChange={(v) => onChange({ ...exercise, showScore: !!v })} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Allow retry</Label>
            <Switch checked={exercise.allowRetry ?? true} onCheckedChange={(v) => onChange({ ...exercise, allowRetry: !!v })} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Allow reveal answer</Label>
            <Switch checked={exercise.allowReveal ?? true} onCheckedChange={(v) => onChange({ ...exercise, allowReveal: !!v })} />
          </div>
        </div>
      </div>

      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />
      <FeedbackSection exercise={exercise} onChange={onChange} />
    </div>
  );
}

export function SortParagraphsEditor({ exercise, onChange }: { exercise: SortParagraphsBlock; onChange: (e: SortParagraphsBlock) => void }) {
  const addParagraph = () => onChange({ ...exercise, paragraphs: [...exercise.paragraphs, { id: crypto.randomUUID(), text: "" }] });
  const removeParagraph = (pId: string) => onChange({ ...exercise, paragraphs: exercise.paragraphs.filter(p => p.id !== pId) });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ArrowUpDown className="h-3.5 w-3.5" /> Sort Paragraphs</div>
      <ImageSection exercise={exercise} onChange={onChange} />
      <RichTextEditor value={exercise.title} onChange={(v) => onChange({ ...exercise, title: v })} placeholder="Title..." />
      <p className="text-xs text-muted-foreground">Enter paragraphs in the correct order. They will be shuffled for students.</p>
      <div className="space-y-3">
        {exercise.paragraphs.map((p, i) => (
          <div key={p.id} className="border border-border/50 rounded-lg p-3 bg-background space-y-1 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{i + 1}.</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeParagraph(p.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
            <RichTextEditor value={p.text} onChange={(v) => {
              const next = [...exercise.paragraphs]; next[i] = { ...next[i], text: v };
              onChange({ ...exercise, paragraphs: next });
            }} placeholder="Paragraph content..." />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addParagraph} className="gap-1"><Plus className="h-3 w-3" /> Add Paragraph</Button>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={exercise.allowReveal ?? false} onCheckedChange={(v) => onChange({ ...exercise, allowReveal: v })} />
        <Label className="text-xs">Allow Reveal Answer</Label>
      </div>
      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />
      <FeedbackSection exercise={exercise} onChange={onChange} />
    </div>
  );
}

export function SortImagesEditor({ exercise, onChange }: { exercise: SortImagesBlock; onChange: (e: SortImagesBlock) => void }) {
  const addImage = () => onChange({ ...exercise, images: [...exercise.images, { id: crypto.randomUUID(), url: "", label: "" }] });
  const removeImage = (imgId: string) => onChange({ ...exercise, images: exercise.images.filter(img => img.id !== imgId) });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ArrowDownUp className="h-3.5 w-3.5" /> Sort Images</div>
      <ImageSection exercise={exercise} onChange={onChange} />
      <Input placeholder="Title..." value={exercise.title} onChange={(e) => onChange({ ...exercise, title: e.target.value })} />
      <div className="flex items-center gap-2">
        <Label className="text-xs whitespace-nowrap">Images per row</Label>
        <Select value={String(exercise.columnsPerRow || 3)} onValueChange={(v) => onChange({ ...exercise, columnsPerRow: Number(v) })}>
          <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4</SelectItem>
            <SelectItem value="5">5</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">Add images in the correct order. They will be shuffled for students.</p>
      <div className="space-y-3">
        {exercise.images.map((img, i) => (
          <div key={img.id} className="border border-border/50 rounded-lg p-3 bg-background space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Image {i + 1}</span>
              <Button variant="ghost" size="sm" onClick={() => removeImage(img.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
            <MediaUpload value={img.url} onChange={(url) => {
              const next = [...exercise.images]; next[i] = { ...next[i], url };
              onChange({ ...exercise, images: next });
            }} accept="image/*" label="Image" />
            <Input placeholder="Label (optional)..." value={img.label || ""} onChange={(e) => {
              const next = [...exercise.images]; next[i] = { ...next[i], label: e.target.value };
              onChange({ ...exercise, images: next });
            }} />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addImage} className="gap-1"><Plus className="h-3 w-3" /> Add Image</Button>
      </div>
      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />
      <FeedbackSection exercise={exercise} onChange={onChange} />
    </div>
  );
}

export function MemoryGameEditor({ exercise, onChange }: { exercise: MemoryGameBlock; onChange: (e: MemoryGameBlock) => void }) {
  const cards = exercise.cards || [];
  const addCard = () => {
    const pairId = crypto.randomUUID();
    const newCards: MemoryCard[] = [
      { id: crypto.randomUUID(), contentType: "text", text: "", pairId, bgColor: "#3b82f6" },
      { id: crypto.randomUUID(), contentType: "text", text: "", pairId, bgColor: "#3b82f6" },
    ];
    onChange({ ...exercise, cards: [...cards, ...newCards] });
  };
  const updateCard = (cId: string, field: Partial<MemoryCard>) => onChange({ ...exercise, cards: cards.map(c => c.id === cId ? { ...c, ...field } : c) });
  const removePairByCard = (pairId: string) => onChange({ ...exercise, cards: cards.filter(c => c.pairId !== pairId) });

  // Group cards by pairId
  const pairMap = new Map<string, MemoryCard[]>();
  cards.forEach(c => { const arr = pairMap.get(c.pairId) || []; arr.push(c); pairMap.set(c.pairId, arr); });
  const pairEntries = Array.from(pairMap.entries());

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Puzzle className="h-3.5 w-3.5" /> Memory Cards</div>
      <ImageSection exercise={exercise} onChange={onChange} />
      <Input placeholder="Title..." value={exercise.title} onChange={(e) => onChange({ ...exercise, title: e.target.value })} />

      {/* Grid layout */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Grid Columns</Label>
          <Input type="number" min={2} max={8} value={exercise.gridColumns || 4} onChange={(e) => onChange({ ...exercise, gridColumns: parseInt(e.target.value) || 4 })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Grid Rows</Label>
          <Input type="number" min={2} max={8} value={exercise.gridRows || 3} onChange={(e) => onChange({ ...exercise, gridRows: parseInt(e.target.value) || 3 })} />
        </div>
      </div>

      {/* Back image */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Card Back Image (shared by all cards)</Label>
        <MediaUpload value={exercise.backImage || ""} onChange={(url) => onChange({ ...exercise, backImage: url })} accept="image/*" placeholder="Upload back image..." />
      </div>

      {/* Completion message */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Completion Message</Label>
        <Input placeholder="Congratulations! You matched all pairs!" value={exercise.completionMessage || ""} onChange={(e) => onChange({ ...exercise, completionMessage: e.target.value })} />
      </div>

      {/* Card pairs */}
      <p className="text-xs text-muted-foreground">Define matching pairs. Each pair has two cards with individual front-side content.</p>
      <div className="space-y-4">
        {pairEntries.map(([pairId, pairCards], i) => (
          <div key={pairId} className="border border-border/50 rounded-lg p-3 space-y-2 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Pair {i + 1}</span>
              <Button variant="ghost" size="sm" onClick={() => removePairByCard(pairId)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
            {pairCards.map((card, ci) => (
              <div key={card.id} className="space-y-1 border-l-2 border-primary/30 pl-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Card {ci === 0 ? "A" : "B"}</span>
                  <Select value={card.contentType} onValueChange={(v) => updateCard(card.id, { contentType: v as "text" | "image" })}>
                    <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {card.contentType === "text" && (
                  <div className="space-y-1">
                    <RichTextEditor value={card.html || card.text || ""} onChange={(html) => updateCard(card.id, { html, text: html.replace(/<[^>]*>/g, '') })} placeholder="Card text..." />
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Background</Label>
                      <input type="color" value={card.bgColor || "#3b82f6"} onChange={(e) => updateCard(card.id, { bgColor: e.target.value })} className="w-8 h-6 rounded border cursor-pointer" />
                    </div>
                  </div>
                )}
                {card.contentType === "image" && (
                  <MediaUpload value={card.imageUrl || ""} onChange={(url) => updateCard(card.id, { imageUrl: url })} accept="image/*" placeholder="Upload card image..." />
                )}
              </div>
            ))}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addCard} className="gap-1"><Plus className="h-3 w-3" /> Add Pair</Button>
      </div>
      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />
    </div>
  );
}

export function ImageJuxtapositionEditor({ exercise, onChange }: { exercise: ImageJuxtapositionBlock; onChange: (e: ImageJuxtapositionBlock) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><SplitSquareHorizontal className="h-3.5 w-3.5" /> Image Juxtaposition</div>
      <ImageSection exercise={exercise} onChange={onChange} />
      <Input placeholder="Title..." value={exercise.title} onChange={(e) => onChange({ ...exercise, title: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Before Image</Label>
          <MediaUpload value={exercise.imageBefore} onChange={(url) => onChange({ ...exercise, imageBefore: url })} accept="image/*" placeholder="Upload before image..." />
          <Input placeholder="Label (e.g. Before)..." value={exercise.labelBefore || ""} onChange={(e) => onChange({ ...exercise, labelBefore: e.target.value })} />
          {exercise.imageBefore && <img src={exercise.imageBefore} alt="Before" className="max-h-20 rounded-md object-contain" />}
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">After Image</Label>
          <MediaUpload value={exercise.imageAfter} onChange={(url) => onChange({ ...exercise, imageAfter: url })} accept="image/*" placeholder="Upload after image..." />
          <Input placeholder="Label (e.g. After)..." value={exercise.labelAfter || ""} onChange={(e) => onChange({ ...exercise, labelAfter: e.target.value })} />
          {exercise.imageAfter && <img src={exercise.imageAfter} alt="After" className="max-h-20 rounded-md object-contain" />}
        </div>
      </div>
      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />
    </div>
  );
}

export function MarkWordsEditor({ exercise, onChange }: { exercise: MarkWordsBlock; onChange: (e: MarkWordsBlock) => void }) {
  const rawText = exercise.text.replace(/<[^>]+>/g, '');
  const correctWords = (rawText.match(/\*([^*]+)\*/g) || []).map(m => m.replace(/\*/g, ''));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ListChecks className="h-3.5 w-3.5" /> Mark the Words</div>
      <ImageSection exercise={exercise} onChange={onChange} />
      <Input placeholder="Title / Task description..." value={exercise.title} onChange={(e) => onChange({ ...exercise, title: e.target.value })} />
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Text with correct words</Label>
          <span className="text-xs text-muted-foreground italic">Wrap correct words in *asterisks*</span>
        </div>
        <RichTextEditor value={exercise.text} onChange={(v) => onChange({ ...exercise, text: v })} placeholder='e.g. "I made a *mistake* during a report and delivered it *late*."' />
      </div>
      {correctWords.length > 0 ? (
        <p className="text-xs text-muted-foreground">{correctWords.length} correct word{correctWords.length > 1 ? "s" : ""} detected: {correctWords.join(", ")}</p>
      ) : (
        <p className="text-xs text-amber-600">Wrap correct words in *asterisks* to mark them.</p>
      )}

      {/* Behavior toggles */}
      <div className="space-y-2 p-3 rounded-lg border border-border/50 bg-background">
        <Label className="text-sm font-medium">Options</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Show score to learner</Label>
            <Switch checked={exercise.showScore ?? true} onCheckedChange={(v) => onChange({ ...exercise, showScore: !!v })} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Allow retry</Label>
            <Switch checked={exercise.allowRetry ?? true} onCheckedChange={(v) => onChange({ ...exercise, allowRetry: !!v })} />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Allow reveal answer</Label>
            <Switch checked={exercise.allowReveal ?? true} onCheckedChange={(v) => onChange({ ...exercise, allowReveal: !!v })} />
          </div>
        </div>
      </div>

      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />
      <FeedbackSection exercise={exercise} onChange={onChange} />
    </div>
  );
}

/* ── Image Hotspot Editor ── */

const HOTSPOT_ICONS: { value: Hotspot["icon"]; label: string; symbol: string }[] = [
  { value: "plus", label: "Plus", symbol: "+" },
  { value: "minus", label: "Minus", symbol: "–" },
  { value: "info", label: "Info", symbol: "i" },
  { value: "exclamation", label: "Alert", symbol: "!" },
  { value: "question", label: "Question", symbol: "?" },
  { value: "lightbulb", label: "Lightbulb", symbol: "💡" },
  { value: "euro", label: "Euro", symbol: "€" },
  { value: "dollar", label: "Dollar", symbol: "$" },
  { value: "section", label: "Section", symbol: "§" },
  { value: "at", label: "At", symbol: "@" },
  { value: "pound", label: "Pound", symbol: "£" },
  { value: "hash", label: "Hash", symbol: "#" },
];

export function ImageHotspotEditor({ exercise, onChange }: { exercise: ImageHotspotBlock; onChange: (e: ImageHotspotBlock) => void }) {
  const imgRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const justDraggedRef = useRef(false);

  const { data: customIcons = [] } = useQuery({
    queryKey: ["custom-hotspot-icons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("custom_hotspot_icons" as any).select("*").order("sort_order");
      if (error) throw error;
      return data as any[];
    },
  });

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newHotspot: Hotspot = { id: crypto.randomUUID(), x, y, icon: "plus", contentType: "text", text: "" };
    onChange({ ...exercise, hotspots: [...exercise.hotspots, newHotspot] });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingId || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    updateHotspot(draggingId, { x, y });
  };

  const endDrag = () => {
    if (draggingId) {
      justDraggedRef.current = true;
      setDraggingId(null);
    }
  };

  const updateHotspot = (id: string, updates: Partial<Hotspot>) => {
    onChange({ ...exercise, hotspots: exercise.hotspots.map(h => h.id === id ? { ...h, ...updates } : h) });
  };

  const removeHotspot = (id: string) => {
    onChange({ ...exercise, hotspots: exercise.hotspots.filter(h => h.id !== id) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><MapPin className="h-3.5 w-3.5" /> Image Hotspot</div>
      <Input placeholder="Title (optional)" value={exercise.title} onChange={(e) => onChange({ ...exercise, title: e.target.value })} />
      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />

      <MediaUpload value={exercise.baseImage} onChange={(url) => onChange({ ...exercise, baseImage: url })} accept="image/*" label="Base image" placeholder="Upload or paste image URL..." />

      {exercise.baseImage && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Click on the image to place hotspots</p>
          <div
            ref={imgRef}
            className="relative cursor-crosshair border border-border rounded-lg overflow-hidden"
            onClick={handleImageClick}
            onMouseMove={handleMouseMove}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
          >
            <img src={exercise.baseImage} alt="Base" className="w-full block" draggable={false} />
            {exercise.hotspots.map((hs, i) => (
              <div
                key={hs.id}
                title="Drag to move"
                onMouseDown={(e) => { e.stopPropagation(); setDraggingId(hs.id); }}
                onClick={(e) => e.stopPropagation()}
                className="absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shadow-md cursor-move select-none"
                style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {exercise.hotspots.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Hotspots ({exercise.hotspots.length})</Label>
          {exercise.hotspots.map((hs, i) => (
            <div key={hs.id} className="border border-border/60 rounded-lg p-3 bg-background space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Hotspot {i + 1}</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeHotspot(hs.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>

              {/* Icon selector */}
              <div className="flex items-center gap-1 flex-wrap">
                <Label className="text-xs text-muted-foreground mr-1">Icon:</Label>
                {HOTSPOT_ICONS.map(ic => (
                  <button
                    key={ic.value}
                    type="button"
                    onClick={() => updateHotspot(hs.id, { icon: ic.value, customIconUrl: undefined })}
                    className={`w-7 h-7 rounded-md text-xs font-bold flex items-center justify-center border transition-colors ${hs.icon === ic.value ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"}`}
                  >
                    {ic.symbol}
                  </button>
                ))}
                {customIcons.map((ci: any) => (
                  <button
                    key={ci.id}
                    type="button"
                    onClick={() => updateHotspot(hs.id, { icon: "custom" as any, customIconUrl: ci.icon_url })}
                    title={ci.name || "Custom icon"}
                    className={`w-7 h-7 rounded-md flex items-center justify-center border transition-colors ${hs.icon === "custom" && hs.customIconUrl === ci.icon_url ? "bg-primary border-primary" : "bg-muted/50 border-border hover:bg-muted"}`}
                  >
                    <img src={ci.icon_url} alt={ci.name} className="w-5 h-5 object-contain" />
                  </button>
                ))}
              </div>

              {/* Content type toggle */}
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Content:</Label>
                <div className="flex gap-1">
                  <Button type="button" variant={hs.contentType === "text" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => updateHotspot(hs.id, { contentType: "text" })}>Text</Button>
                  <Button type="button" variant={hs.contentType === "image" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => updateHotspot(hs.id, { contentType: "image" })}>Image</Button>
                </div>
              </div>

              {hs.contentType === "text" ? (
                <RichTextEditor value={hs.text || ""} onChange={(v) => updateHotspot(hs.id, { text: v })} placeholder="Hotspot content..." />
              ) : (
                <MediaUpload value={hs.imageUrl || ""} onChange={(url) => updateHotspot(hs.id, { imageUrl: url })} accept="image/*" placeholder="Hotspot image URL..." />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Find Hotspot Editor ── */

export function FindHotspotEditor({ exercise, onChange }: { exercise: FindHotspotBlock; onChange: (e: FindHotspotBlock) => void }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [drawShape, setDrawShape] = useState<"circle" | "rectangle">("circle");
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

  const getRelCoords = (e: React.MouseEvent) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imgRef.current) return;
    e.preventDefault();
    setDrawStart(getRelCoords(e));
    setDrawCurrent(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawStart) return;
    setDrawCurrent(getRelCoords(e));
  };

  const handleMouseUp = () => {
    if (!drawStart) return;
    const end = drawCurrent || drawStart;
    const x = Math.min(drawStart.x, end.x);
    const y = Math.min(drawStart.y, end.y);
    const w = Math.abs(end.x - drawStart.x);
    const h = Math.abs(end.y - drawStart.y);
    if (w < 2 && h < 2) { setDrawStart(null); setDrawCurrent(null); return; }
    const newArea: ClickableArea = { id: crypto.randomUUID(), shape: drawShape, x, y, width: w, height: h, isCorrect: true, feedback: "" };
    onChange({ ...exercise, areas: [...exercise.areas, newArea] });
    setDrawStart(null);
    setDrawCurrent(null);
  };

  const updateArea = (id: string, updates: Partial<ClickableArea>) => {
    onChange({ ...exercise, areas: exercise.areas.map(a => a.id === id ? { ...a, ...updates } : a) });
  };
  const removeArea = (id: string) => onChange({ ...exercise, areas: exercise.areas.filter(a => a.id !== id) });

  const previewRect = drawStart && drawCurrent ? {
    x: Math.min(drawStart.x, drawCurrent.x), y: Math.min(drawStart.y, drawCurrent.y),
    w: Math.abs(drawCurrent.x - drawStart.x), h: Math.abs(drawCurrent.y - drawStart.y),
  } : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><MousePointerClick className="h-3.5 w-3.5" /> Find Hotspot</div>
      <ImageSection exercise={exercise} onChange={onChange} />
      <Input placeholder="Exercise title..." value={exercise.title} onChange={(e) => onChange({ ...exercise, title: e.target.value })} />
      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />

      {/* Base image */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Base Image</Label>
        <MediaUpload value={exercise.baseImage} onChange={(url) => onChange({ ...exercise, baseImage: url })} accept="image/*" placeholder="Upload base image..." />
      </div>

      {exercise.baseImage && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Label className="text-xs text-muted-foreground">Draw shape:</Label>
            <div className="flex gap-1">
              <Button type="button" variant={drawShape === "circle" ? "default" : "outline"} size="sm" className="h-7 text-xs gap-1" onClick={() => setDrawShape("circle")}><Circle className="h-3 w-3" /> Circle</Button>
              <Button type="button" variant={drawShape === "rectangle" ? "default" : "outline"} size="sm" className="h-7 text-xs gap-1" onClick={() => setDrawShape("rectangle")}><Square className="h-3 w-3" /> Rectangle</Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Click and drag on the image to create a clickable area.</p>
          <div className="relative rounded-lg overflow-hidden border border-border select-none cursor-crosshair"
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => { setDrawStart(null); setDrawCurrent(null); }}
          >
            <img ref={imgRef} src={exercise.baseImage} alt="Base" className="w-full block pointer-events-none" draggable={false} />
            {/* Existing areas */}
            {exercise.areas.map((area, i) => (
              <div key={area.id}
                className={`absolute border-2 border-dashed pointer-events-none ${area.isCorrect ? "border-emerald-500/70 bg-emerald-500/15" : "border-red-500/70 bg-red-500/15"}`}
                style={{
                  left: `${area.x}%`, top: `${area.y}%`, width: `${area.width}%`, height: `${area.height}%`,
                  borderRadius: area.shape === "circle" ? "50%" : "4px",
                }}
              >
                <span className="absolute top-0.5 left-1 text-[10px] font-bold text-foreground bg-background/80 px-1 rounded">{i + 1}</span>
              </div>
            ))}
            {/* Preview area while drawing */}
            {previewRect && (
              <div className="absolute border-2 border-dashed border-primary/70 bg-primary/10 pointer-events-none"
                style={{ left: `${previewRect.x}%`, top: `${previewRect.y}%`, width: `${previewRect.w}%`, height: `${previewRect.h}%`, borderRadius: drawShape === "circle" ? "50%" : "4px" }}
              />
            )}
          </div>
        </div>
      )}

      {exercise.areas.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Areas ({exercise.areas.length})</Label>
          {exercise.areas.map((area, i) => (
            <div key={area.id} className="border border-border/60 rounded-lg p-3 bg-background space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Area {i + 1} ({area.shape})</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeArea(area.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-xs">Correct:</Label>
                <Switch checked={area.isCorrect} onCheckedChange={(v) => updateArea(area.id, { isCorrect: v })} />
              </div>
              <Input placeholder="Feedback message when clicked..." value={area.feedback || ""} onChange={(e) => updateArea(area.id, { feedback: e.target.value })} />
            </div>
          ))}
        </div>
      )}

      {/* Toggles */}
      <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Show score to learner</Label>
          <Switch checked={exercise.showScore ?? true} onCheckedChange={(v) => onChange({ ...exercise, showScore: v })} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm">Allow reveal answer</Label>
          <Switch checked={exercise.allowReveal ?? true} onCheckedChange={(v) => onChange({ ...exercise, allowReveal: v })} />
        </div>
      </div>

      {/* Feedback messages */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Feedback Messages</Label>
        <div>
          <Label className="text-xs text-muted-foreground">When learner clicks an empty spot:</Label>
          <Input value={exercise.feedbackEmpty || ""} onChange={(e) => onChange({ ...exercise, feedbackEmpty: e.target.value })} placeholder="You didn't locate any hotspots, try again!" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">When learner clicks an already found area:</Label>
          <Input value={exercise.feedbackFound || ""} onChange={(e) => onChange({ ...exercise, feedbackFound: e.target.value })} placeholder="You have already found this one!" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Completion Feedback</Label>
        <div>
          <Label className="text-xs text-muted-foreground">When learner finds all hotspots:</Label>
          <Input value={exercise.feedbackAllFound || ""} onChange={(e) => onChange({ ...exercise, feedbackAllFound: e.target.value })} placeholder="Great job! You found them all!" />
        </div>
      </div>
    </div>
  );
}

/* ── Question Set Editor ── */

const EXERCISE_TYPES_FOR_SET: { type: string; label: string; icon: any }[] = [
  { type: "quiz", label: "Quiz", icon: HelpCircle },
  { type: "trueFalse", label: "True / False", icon: ToggleLeft },
  { type: "fillBlanks", label: "Fill in Blanks", icon: PenLine },
  { type: "reflection", label: "Reflection", icon: MessageSquare },
  { type: "multimediaChoice", label: "Multimedia Choice", icon: ImageIcon },
  { type: "dragDrop", label: "Match Pairs", icon: GripHorizontal },
  { type: "checklist", label: "Checklist", icon: ListChecks },
  { type: "dragWords", label: "Drag the Words", icon: GripHorizontal },
  { type: "fillWords", label: "Fill in the Words", icon: ChevronDown },
  { type: "markWords", label: "Mark the Words", icon: Highlighter },
];

function createSubExercise(type: string): ContentBlock | null {
  const id = crypto.randomUUID();
  switch (type) {
    case "quiz": return { type: "quiz", id, question: "", options: [{ id: crypto.randomUUID(), text: "", isCorrect: false }, { id: crypto.randomUUID(), text: "", isCorrect: false }] };
    case "trueFalse": return { type: "trueFalse", id, statement: "", isTrue: true };
    case "fillBlanks": return { type: "fillBlanks", id, title: "", text: "", answers: [] };
    case "reflection": return { type: "reflection", id, prompt: "", helpText: "", inputSize: "medium", passingPercentage: 0 };
    case "multimediaChoice": return { type: "multimediaChoice", id, question: "", options: [{ id: crypto.randomUUID(), imageUrl: "", label: "", isCorrect: false }], multipleChoice: false, showScore: true, allowRetry: true, allowReveal: true, onePointForAll: false, columnsPerRow: 3 };
    case "dragDrop": return { type: "dragDrop", id, title: "", pairs: [{ id: crypto.randomUUID(), left: "", right: "" }] };
    case "checklist": return { type: "checklist", id, title: "", items: [{ id: crypto.randomUUID(), text: "", isCorrect: false }] };
    case "dragWords": return { type: "dragWords", id, title: "", text: "", blanks: [], distractors: [] };
    case "fillWords": return { type: "fillWords", id, title: "", text: "", blanks: [] };
    case "markWords": return { type: "markWords", id, title: "", text: "" };
    default: return null;
  }
}

function getExerciseLabel(type: string): string {
  const map: Record<string, string> = { quiz: "Quiz", trueFalse: "True / False", fillBlanks: "Fill in Blanks", reflection: "Reflection", multimediaChoice: "Multimedia Choice", dragDrop: "Match Pairs", checklist: "Checklist", dragWords: "Drag the Words", fillWords: "Fill in the Words", markWords: "Mark the Words" };
  return map[type] || type;
}

export function QuestionSetEditor({ exercise, onChange }: { exercise: QuestionSetBlock; onChange: (e: QuestionSetBlock) => void }) {
  const addExercise = (type: string) => {
    const newEx = createSubExercise(type);
    if (newEx) onChange({ ...exercise, exercises: [...exercise.exercises, newEx] });
  };

  const updateSubExercise = (id: string, updated: ContentBlock) => {
    onChange({ ...exercise, exercises: exercise.exercises.map(e => e.id === id ? updated : e) });
  };

  const removeSubExercise = (id: string) => {
    onChange({ ...exercise, exercises: exercise.exercises.filter(e => e.id !== id) });
  };

  const moveExercise = (index: number, dir: "up" | "down") => {
    const ni = dir === "up" ? index - 1 : index + 1;
    if (ni < 0 || ni >= exercise.exercises.length) return;
    const next = [...exercise.exercises];
    [next[index], next[ni]] = [next[ni], next[index]];
    onChange({ ...exercise, exercises: next });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ClipboardList className="h-3.5 w-3.5" /> Question Set</div>
      <ImageSection exercise={exercise} onChange={onChange} />
      <Input placeholder="Question Set title..." value={exercise.title} onChange={(e) => onChange({ ...exercise, title: e.target.value })} />
      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />

      {/* Show score toggle */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <Label className="text-sm font-medium">Show overall score to learner</Label>
        <Switch checked={exercise.showScore ?? true} onCheckedChange={(v) => onChange({ ...exercise, showScore: v })} />
      </div>

      {/* Sub-exercises */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Exercises ({exercise.exercises.length})</Label>
        {exercise.exercises.map((subEx, i) => (
          <div key={subEx.id} className="border border-border/60 rounded-lg bg-background">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-muted/20 rounded-t-lg">
              <span className="text-xs font-medium text-muted-foreground">{i + 1}. {getExerciseLabel(subEx.type)}</span>
              <div className="flex gap-0.5">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveExercise(i, "up")} disabled={i === 0}><ChevronUp className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveExercise(i, "down")} disabled={i === exercise.exercises.length - 1}><ChevronDown className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeSubExercise(subEx.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
            </div>
            <div className="p-3">
              {subEx.type === "quiz" && <QuizEditor exercise={subEx as QuizBlock} onChange={(u) => updateSubExercise(subEx.id, u)} />}
              {subEx.type === "trueFalse" && <TrueFalseEditor exercise={subEx as TrueFalseBlock} onChange={(u) => updateSubExercise(subEx.id, u)} />}
              {subEx.type === "fillBlanks" && <FillBlanksEditor exercise={subEx as FillBlanksBlock} onChange={(u) => updateSubExercise(subEx.id, u)} />}
              {subEx.type === "reflection" && <ReflectionEditor exercise={subEx as ReflectionBlock} onChange={(u) => updateSubExercise(subEx.id, u)} />}
              {subEx.type === "multimediaChoice" && <MultimediaChoiceEditor exercise={subEx as MultimediaChoiceBlock} onChange={(u) => updateSubExercise(subEx.id, u)} />}
              {subEx.type === "dragDrop" && <DragDropEditor exercise={subEx as DragDropBlock} onChange={(u) => updateSubExercise(subEx.id, u)} />}
              {subEx.type === "checklist" && <ChecklistEditor exercise={subEx as ChecklistBlock} onChange={(u) => updateSubExercise(subEx.id, u)} />}
              {subEx.type === "dragWords" && <DragWordsEditor exercise={subEx as DragWordsBlock} onChange={(u) => updateSubExercise(subEx.id, u)} />}
              {subEx.type === "fillWords" && <FillWordsEditor exercise={subEx as FillWordsBlock} onChange={(u) => updateSubExercise(subEx.id, u)} />}
              {subEx.type === "markWords" && <MarkWordsEditor exercise={subEx as MarkWordsBlock} onChange={(u) => updateSubExercise(subEx.id, u)} />}
            </div>
          </div>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1"><Plus className="h-3 w-3" /> Add Exercise</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            {EXERCISE_TYPES_FOR_SET.map(({ type, label, icon: Icon }) => (
              <DropdownMenuItem key={type} onClick={() => addExercise(type)}>
                <Icon className="h-4 w-4 mr-2" /> {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <FeedbackSection exercise={exercise} onChange={onChange} />
    </div>
  );
}

/* ── Accordion Editor ── */

function DescriptionFieldAccordion({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return <RichTextEditor value={value || ""} onChange={onChange} placeholder="Description (optional)..." />;
}

export function AccordionEditor({ exercise, onChange }: { exercise: AccordionBlock; onChange: (e: AccordionBlock) => void }) {
  const addItem = () => {
    onChange({ ...exercise, items: [...exercise.items, { id: crypto.randomUUID(), title: "", body: "" }] });
  };

  const updateItem = (id: string, updates: Partial<AccordionItem>) => {
    onChange({ ...exercise, items: exercise.items.map(it => it.id === id ? { ...it, ...updates } : it) });
  };

  const removeItem = (id: string) => {
    onChange({ ...exercise, items: exercise.items.filter(it => it.id !== id) });
  };

  const moveItem = (index: number, dir: "up" | "down") => {
    const ni = dir === "up" ? index - 1 : index + 1;
    if (ni < 0 || ni >= exercise.items.length) return;
    const next = [...exercise.items];
    [next[index], next[ni]] = [next[ni], next[index]];
    onChange({ ...exercise, items: next });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ChevronsUpDown className="h-3.5 w-3.5" /> Accordion</div>
      <Input placeholder="Title (optional)" value={exercise.title} onChange={(e) => onChange({ ...exercise, title: e.target.value })} />
      <DescriptionFieldAccordion value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />

      <div className="space-y-2">
        <Label className="text-sm font-medium">Sections ({exercise.items.length})</Label>
        {exercise.items.map((item, i) => (
          <div key={item.id} className="border border-border/60 rounded-lg p-3 bg-background space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Section {i + 1}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveItem(i, "up")} disabled={i === 0}><ChevronUp className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveItem(i, "down")} disabled={i === exercise.items.length - 1}><ChevronDown className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeItem(item.id)} disabled={exercise.items.length <= 1}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
            </div>
            <RichTextEditor value={item.title} onChange={(v) => updateItem(item.id, { title: v })} placeholder="Tab title..." />
            <RichTextEditor value={item.body} onChange={(v) => updateItem(item.id, { body: v })} placeholder="Body content..." />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem} className="gap-1"><Plus className="h-3 w-3" /> Add Section</Button>
      </div>
    </div>
  );
}

export function ImageReflectionEditor({ exercise, onChange }: { exercise: ImageReflectionBlock; onChange: (e: ImageReflectionBlock) => void }) {
  const imgRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const addBox = () => {
    const newBox: ImageReflectionInputBox = { id: crypto.randomUUID(), x: 10, y: 10, size: "three" };
    onChange({ ...exercise, inputBoxes: [...exercise.inputBoxes, newBox] });
  };
  const updateBox = (id: string, fields: Partial<ImageReflectionInputBox>) => {
    onChange({ ...exercise, inputBoxes: exercise.inputBoxes.map(b => b.id === id ? { ...b, ...fields } : b) });
  };
  const removeBox = (id: string) => {
    onChange({ ...exercise, inputBoxes: exercise.inputBoxes.filter(b => b.id !== id) });
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current || (e.target as HTMLElement).closest('.input-box-overlay')) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newBox: ImageReflectionInputBox = { id: crypto.randomUUID(), x: Math.min(Math.max(x, 2), 80), y: Math.min(Math.max(y, 2), 85), size: "three" };
    onChange({ ...exercise, inputBoxes: [...exercise.inputBoxes, newBox] });
  };

  const handleDrag = (e: React.MouseEvent, boxId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!imgRef.current) return;
    setDraggingId(boxId);
    const rect = imgRef.current.getBoundingClientRect();
    const onMove = (ev: MouseEvent) => {
      const x = ((ev.clientX - rect.left) / rect.width) * 100;
      const y = ((ev.clientY - rect.top) / rect.height) * 100;
      updateBox(boxId, { x: Math.min(Math.max(x, 2), 80), y: Math.min(Math.max(y, 2), 85) });
    };
    const onUp = () => { setDraggingId(null); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleResize = (e: React.MouseEvent, boxId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!imgRef.current) return;
    const box = exercise.inputBoxes.find(b => b.id === boxId);
    if (!box) return;
    const rect = imgRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = box.width || 18;
    const startH = box.height || (box.size === "one" ? 4 : box.size === "three" ? 8 : 13);
    const onMove = (ev: MouseEvent) => {
      const dxPct = ((ev.clientX - startX) / rect.width) * 100;
      const dyPct = ((ev.clientY - startY) / rect.height) * 100;
      updateBox(boxId, {
        width: Math.max(10, Math.min(60, startW + dxPct)),
        height: Math.max(3, Math.min(40, startH + dyPct)),
      });
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const sizeLabel = (s: string) => s === "one" ? "1 line" : s === "three" ? "3 lines" : "5 lines";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ImageIcon className="h-3.5 w-3.5" /> Image Reflection</div>
      <ImageSection exercise={exercise} onChange={onChange} />
      <Input placeholder="Title / Task description..." value={exercise.title} onChange={(e) => onChange({ ...exercise, title: e.target.value })} />
      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Base Image</Label>
        <MediaUpload value={exercise.baseImage} onChange={(url) => onChange({ ...exercise, baseImage: url })} accept="image/*" placeholder="Upload base image..." />
      </div>

      {exercise.baseImage && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Click on the image to place input boxes, or drag existing ones to reposition.</p>
          <div ref={imgRef} className="relative border border-border rounded-lg overflow-hidden cursor-crosshair" onClick={handleImageClick}>
            <img src={exercise.baseImage} alt="Base" className="w-full h-auto block" />
            {exercise.inputBoxes.map((box, i) => {
              const defaultH = box.size === "one" ? 4 : box.size === "three" ? 8 : 13;
              const boxW = box.width || 18;
              const boxH = box.height || defaultH;
              return (
              <div key={box.id} className="input-box-overlay absolute" style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${boxW}%`, zIndex: 10 }}>
                  <div className="relative w-full">
                    <div
                      className={`bg-background/90 border-2 border-primary rounded-md shadow-md cursor-move flex items-center justify-center text-xs text-muted-foreground ${draggingId === box.id ? "ring-2 ring-ring" : ""}`}
                      style={{ width: "100%", height: `${boxH}vh`, minHeight: "24px" }}
                      onMouseDown={(e) => handleDrag(e, box.id)}
                    >
                      #{i + 1} · {sizeLabel(box.size)}
                    </div>
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-bl cursor-nwse-resize"
                      onMouseDown={(e) => handleResize(e, box.id)}
                    />
                    <div className="absolute top-0 left-full ml-1 flex flex-col gap-0.5 z-20" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                      <Select value={box.size} onValueChange={(v) => updateBox(box.id, { size: v as "one" | "three" | "five", width: undefined, height: undefined })}>
                        <SelectTrigger className="h-5 w-14 text-[10px] p-0.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one">1 line</SelectItem>
                          <SelectItem value="three">3 lines</SelectItem>
                          <SelectItem value="five">5 lines</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); removeBox(box.id); }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={addBox} disabled={!exercise.baseImage} className="gap-1"><Plus className="h-3 w-3" /> Add Input Box</Button>
        <span className="text-xs text-muted-foreground">{exercise.inputBoxes.length} box{exercise.inputBoxes.length !== 1 ? "es" : ""}</span>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Completion feedback message</Label>
        <Input placeholder="Thank you for your reflection!" value={exercise.completionMessage || ""} onChange={(e) => onChange({ ...exercise, completionMessage: e.target.value })} />
      </div>
    </div>
  );
}

export function ImageSliderEditor({ exercise, onChange }: { exercise: ImageSliderBlock; onChange: (e: ImageSliderBlock) => void }) {
  const addImage = () => onChange({ ...exercise, images: [...exercise.images, { id: crypto.randomUUID(), url: "" }] });
  const updateImage = (id: string, patch: Partial<ImageSliderImage>) => onChange({ ...exercise, images: exercise.images.map(img => img.id === id ? { ...img, ...patch } : img) });
  const removeImage = (id: string) => onChange({ ...exercise, images: exercise.images.filter(img => img.id !== id) });
  const moveImage = (index: number, dir: "up" | "down") => {
    const ni = dir === "up" ? index - 1 : index + 1;
    if (ni < 0 || ni >= exercise.images.length) return;
    const next = [...exercise.images]; [next[index], next[ni]] = [next[ni], next[index]];
    onChange({ ...exercise, images: next });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><SplitSquareHorizontal className="h-3.5 w-3.5" /> Image Slider</div>
      <Input placeholder="Title (optional)" value={exercise.title} onChange={(e) => onChange({ ...exercise, title: e.target.value })} />
      <Input placeholder="Description (optional)" value={exercise.description || ""} onChange={(e) => onChange({ ...exercise, description: e.target.value })} />

      <Alert className="bg-muted/50 border-border">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs text-muted-foreground">
          For best results, use images with a <strong>16:10</strong> aspect ratio (e.g. 1920×1200). Images with different proportions will be automatically cropped to fill the frame.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Slides ({exercise.images.length})</Label>
        {exercise.images.map((img, i) => (
          <div key={img.id} className="border border-border/50 rounded-md p-3 space-y-2 bg-background">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Slide {i + 1}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveImage(i, "up")} disabled={i === 0}><ChevronUp className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveImage(i, "down")} disabled={i === exercise.images.length - 1}><ChevronDown className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeImage(img.id)} disabled={exercise.images.length <= 1}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
            </div>
            <MediaUpload value={img.url} onChange={(url) => updateImage(img.id, { url })} accept="image/*" label="Slide image" />
            <Input placeholder="Alt text (optional)" value={img.alt || ""} onChange={(e) => updateImage(img.id, { alt: e.target.value })} />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addImage} className="gap-1"><Plus className="h-3 w-3" /> Add Slide</Button>
      </div>
    </div>
  );
}

export function FlashcardsEditor({ exercise, onChange }: { exercise: FlashcardsBlock; onChange: (e: FlashcardsBlock) => void }) {
  const addCard = () => onChange({ ...exercise, cards: [...exercise.cards, { id: crypto.randomUUID(), imageUrl: "", text: "", mode: "open" }] });
  const updateCard = (id: string, patch: Partial<FlashcardItem>) => onChange({ ...exercise, cards: exercise.cards.map(c => c.id === id ? { ...c, ...patch } : c) });
  const removeCard = (id: string) => onChange({ ...exercise, cards: exercise.cards.filter(c => c.id !== id) });
  const moveCard = (index: number, dir: "up" | "down") => {
    const ni = dir === "up" ? index - 1 : index + 1;
    if (ni < 0 || ni >= exercise.cards.length) return;
    const next = [...exercise.cards]; [next[index], next[ni]] = [next[ni], next[index]];
    onChange({ ...exercise, cards: next });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ImageIcon className="h-3.5 w-3.5" /> Flashcards</div>
      <Input placeholder="Title (e.g. Which fruit is this?)" value={exercise.title} onChange={(e) => onChange({ ...exercise, title: e.target.value })} />
      <Input placeholder="Description (optional)" value={exercise.description || ""} onChange={(e) => onChange({ ...exercise, description: e.target.value })} />

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Default feedback for Open Answer cards</Label>
        <Input placeholder="Thank you for your answer!" value={exercise.feedbackOpen || ""} onChange={(e) => onChange({ ...exercise, feedbackOpen: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Cards ({exercise.cards.length})</Label>
        {exercise.cards.map((card, i) => (
          <div key={card.id} className="border border-border/50 rounded-md p-3 space-y-2 bg-background">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Card {i + 1}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveCard(i, "up")} disabled={i === 0}><ChevronUp className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveCard(i, "down")} disabled={i === exercise.cards.length - 1}><ChevronDown className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeCard(card.id)} disabled={exercise.cards.length <= 1}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-xs">Mode</Label>
              <Select value={card.mode || "open"} onValueChange={(v) => updateCard(card.id, { mode: v as "open" | "exact" })}>
                <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open Answer</SelectItem>
                  <SelectItem value="exact">Exact Match</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <MediaUpload value={card.imageUrl} onChange={(url) => updateCard(card.id, { imageUrl: url })} accept="image/*" label="Card image" />
            <Input placeholder="Text below image (optional)" value={card.text || ""} onChange={(e) => updateCard(card.id, { text: e.target.value })} />
            {(card.mode || "open") === "exact" && (
              <>
                <Input placeholder="Correct answer" value={card.correctAnswer || ""} onChange={(e) => updateCard(card.id, { correctAnswer: e.target.value })} />
                <Input placeholder="Feedback if correct" value={card.feedbackCorrect || ""} onChange={(e) => updateCard(card.id, { feedbackCorrect: e.target.value })} />
                <Input placeholder="Feedback if incorrect" value={card.feedbackIncorrect || ""} onChange={(e) => updateCard(card.id, { feedbackIncorrect: e.target.value })} />
              </>
            )}
            {(card.mode || "open") === "open" && (
              <Input placeholder="Feedback after submission (optional, overrides default)" value={card.feedbackCorrect || ""} onChange={(e) => updateCard(card.id, { feedbackCorrect: e.target.value })} />
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addCard} className="gap-1"><Plus className="h-3 w-3" /> Add Card</Button>
      </div>
    </div>
  );
}

export function AnswerCardsEditor({ exercise, onChange }: { exercise: AnswerCardsBlock; onChange: (e: AnswerCardsBlock) => void }) {
  const addCard = () => onChange({ ...exercise, cards: [...exercise.cards, { id: crypto.randomUUID(), imageUrl: "", buttonLabel: "Show the answer", revealedText: "" }] });
  const updateCard = (id: string, upd: Partial<AnswerCardItem>) => onChange({ ...exercise, cards: exercise.cards.map(c => c.id === id ? { ...c, ...upd } : c) });
  const removeCard = (id: string) => onChange({ ...exercise, cards: exercise.cards.filter(c => c.id !== id) });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ImageIcon className="h-3.5 w-3.5" /> Answer Cards</div>
      <Input placeholder="Title (optional)" value={exercise.title} onChange={(e) => onChange({ ...exercise, title: e.target.value })} />
      <DescriptionField value={exercise.description} onChange={(v) => onChange({ ...exercise, description: v })} />
      <div className="space-y-1">
        <Label className="text-xs">Image width: {exercise.widthPercent || 100}%</Label>
        <Slider min={25} max={100} step={5} value={[exercise.widthPercent || 100]} onValueChange={([v]) => onChange({ ...exercise, widthPercent: v })} />
      </div>
      <Alert variant="default" className="flex items-start gap-2 py-2 px-3">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs text-muted-foreground">
          For best results, use images with a <strong>16:10</strong> aspect ratio (e.g. 1920×1200). Images with different proportions will be automatically cropped to fill the frame.
        </AlertDescription>
      </Alert>
      <div className="space-y-4">
        {exercise.cards.map((card, ci) => (
          <div key={card.id} className="border border-border/50 rounded-lg p-3 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Card {ci + 1}</span>
              {exercise.cards.length > 1 && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeCard(card.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              )}
            </div>
            <MediaUpload value={card.imageUrl} onChange={(url) => updateCard(card.id, { imageUrl: url })} accept="image/*" label="Card image" />
            <Input placeholder="Button label (e.g. Show the answer)" value={card.buttonLabel} onChange={(e) => updateCard(card.id, { buttonLabel: e.target.value })} />
            <div className="space-y-1">
              <Label className="text-xs">Revealed text</Label>
              <RichTextEditor value={card.revealedText} onChange={(v) => updateCard(card.id, { revealedText: v })} placeholder="Text shown when button is clicked..." />
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addCard} className="gap-1"><Plus className="h-3 w-3" /> Add Card</Button>
      </div>
    </div>
  );
}

/* ── SQL Exercise Editor ── */
export function SqlExerciseEditor({ exercise, onChange }: { exercise: SqlExerciseBlock; onChange: (e: SqlExerciseBlock) => void }) {
  const [runResult, setRunResult] = useState<{ columns: string[]; rows: string[][]; error?: string } | null>(null);
  const [running, setRunning] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [setupStatus, setSetupStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [setupError, setSetupError] = useState<string>("");

  const validateSetupSql = async () => {
    if (!exercise.setupSql.trim()) return;
    setSetupStatus("running");
    setSetupError("");
    try {
      const { executeSQL } = await import("@/lib/sqlEngine");
      const result = await executeSQL(exercise.setupSql, "SELECT 1");
      if (result.error) {
        setSetupStatus("error");
        setSetupError(result.error);
      } else {
        setSetupStatus("success");
      }
    } catch (e: any) {
      setSetupStatus("error");
      setSetupError(e.message);
    }
  };

  const handleCsvImportInternal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const { csvToSql } = await import("@/lib/sqlEngine");
    const tableName = file.name.replace(/\.csv$/i, "").replace(/[^a-zA-Z0-9_]/g, "_") || "imported";
    const sql = csvToSql(text, tableName);
    const newSetupSql = exercise.setupSql ? exercise.setupSql + "\n\n" + sql : sql;
    onChange({ ...exercise, setupSql: newSetupSql });
    if (csvInputRef.current) csvInputRef.current.value = "";
    // Auto-validate after CSV import
    setSetupStatus("running");
    setSetupError("");
    try {
      const { executeSQL } = await import("@/lib/sqlEngine");
      const result = await executeSQL(newSetupSql, "SELECT 1");
      if (result.error) {
        setSetupStatus("error");
        setSetupError(result.error);
      } else {
        setSetupStatus("success");
      }
    } catch (err: any) {
      setSetupStatus("error");
      setSetupError(err.message);
    }
  };

  const runSolution = async () => {
    if (!exercise.solutionQuery.trim()) return;
    setRunning(true);
    try {
      const { executeSQL } = await import("@/lib/sqlEngine");
      const result = await executeSQL(exercise.setupSql, exercise.solutionQuery);
      setRunResult(result);
      if (!result.error) {
        onChange({ ...exercise, expectedColumns: result.columns, expectedRows: result.rows });
      }
    } catch (e: any) {
      setRunResult({ columns: [], rows: [], error: e.message });
    }
    setRunning(false);
  };

  const validationMode = exercise.validationMode || "query";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><HelpCircle className="h-3.5 w-3.5" /> SQL Exercise</div>
      <div className="space-y-1">
        <Label className="text-xs">Title</Label>
        <Input value={exercise.title} onChange={(e) => onChange({ ...exercise, title: e.target.value })} placeholder="Exercise title..." />
      </div>

      {/* Persistent DB toggle */}
      <div className="flex items-center gap-3">
        <Switch checked={exercise.persistentDb || false} onCheckedChange={(v) => onChange({ ...exercise, persistentDb: v })} />
        <Label className="text-xs">Persistent database <span className="text-muted-foreground">(student's changes are saved across sessions)</span></Label>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Setup SQL <span className="text-muted-foreground">(hidden from students — CREATE TABLE, INSERT, etc.)</span></Label>
          <div className="flex gap-2">
            <input ref={csvInputRef} type="file" accept=".csv" onChange={handleCsvImportInternal} className="hidden" />
            <Button variant="outline" size="sm" onClick={() => csvInputRef.current?.click()} className="gap-1 text-xs h-7">
              📄 Import CSV
            </Button>
          </div>
        </div>
        <textarea
          value={exercise.setupSql}
          onChange={(e) => { onChange({ ...exercise, setupSql: e.target.value }); setSetupStatus("idle"); }}
          placeholder="CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, department TEXT);&#10;INSERT INTO employees VALUES (1, 'Alice', 'Engineering');"
          className="w-full min-h-[120px] rounded-md border border-input bg-gray-900 text-green-400 px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={validateSetupSql} disabled={setupStatus === "running" || !exercise.setupSql.trim()} className="gap-1 text-xs h-7">
            {setupStatus === "running" ? "Validating..." : "✓ Validate Setup SQL"}
          </Button>
          {setupStatus === "success" && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">✓ Setup SQL is valid</span>
          )}
          {setupStatus === "error" && (
            <span className="text-xs text-destructive font-mono">{setupError}</span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Task Description <span className="text-muted-foreground">(shown to student)</span></Label>
        <RichTextEditor value={exercise.taskDescription} onChange={(v) => onChange({ ...exercise, taskDescription: v })} placeholder="Write a query that..." />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Starter Code <span className="text-muted-foreground">(optional — pre-filled SQL for the student)</span></Label>
        <textarea
          value={exercise.starterCode}
          onChange={(e) => onChange({ ...exercise, starterCode: e.target.value })}
          placeholder="SELECT * FROM ..."
          className="w-full min-h-[60px] rounded-md border border-input bg-gray-900 text-green-400 px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Validation mode */}
      <div className="space-y-2 border-t border-border/30 pt-4">
        <Label className="text-xs font-medium">Validation Mode</Label>
        <div className="flex gap-2">
          <Button variant={validationMode === "query" ? "default" : "outline"} size="sm"
            onClick={() => onChange({ ...exercise, validationMode: "query" })}>
            Exact query match
          </Button>
          <Button variant={validationMode === "output" ? "default" : "outline"} size="sm"
            onClick={() => onChange({ ...exercise, validationMode: "output" })}>
            Output values match
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {validationMode === "query"
            ? "Student must type the exact SQL query (ignoring case, extra spaces, and trailing semicolons)."
            : "Student can use any SQL query, as long as returned output values match."}
        </p>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">
          {validationMode === "query"
            ? <>Expected Query <span className="text-muted-foreground">(students must match this SQL)</span></>
            : <>Reference Query <span className="text-muted-foreground">(used to generate expected output)</span></>}
        </Label>
        <textarea
          value={exercise.solutionQuery}
          onChange={(e) => onChange({ ...exercise, solutionQuery: e.target.value })}
          placeholder="SELECT name, department FROM employees WHERE department = 'Engineering';"
          className="w-full min-h-[60px] rounded-md border border-input bg-gray-900 text-green-400 px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {validationMode === "output" ? (
          <Button variant="outline" size="sm" onClick={runSolution} disabled={running} className="mt-1 gap-1">
            {running ? "Running..." : "▶ Run Reference Query & Save Expected Output"}
          </Button>
        ) : (
          <p className="text-[11px] text-muted-foreground">Students still run their query, then "Check Answer" compares their SQL text to this expected query.</p>
        )}
      </div>
      {validationMode === "output" && (runResult || exercise.expectedColumns.length > 0) && (
        <div className="space-y-1">
          <Label className="text-xs">Expected Output</Label>
          {runResult?.error && <p className="text-xs text-destructive font-mono">{runResult.error}</p>}
          {exercise.expectedColumns.length > 0 && (
            <div className="border border-border rounded-md overflow-auto max-h-48">
              <table className="w-full text-xs font-mono">
                <thead><tr className="bg-muted">{exercise.expectedColumns.map((c, i) => <th key={i} className="px-2 py-1 text-left font-medium">{c}</th>)}</tr></thead>
                <tbody>{exercise.expectedRows.map((row, ri) => <tr key={ri} className="border-t border-border">{row.map((cell, ci) => <td key={ci} className="px-2 py-1">{cell}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
      <div className="space-y-1">
        <Label className="text-xs">Hint <span className="text-muted-foreground">(optional)</span></Label>
        <Input value={exercise.hint || ""} onChange={(e) => onChange({ ...exercise, hint: e.target.value })} placeholder="Try using a JOIN..." />
      </div>
    </div>
  );
}

/* ── Table Editor ── */
const TABLE_PRESETS = [
  { label: "2×2", rows: 2, cols: 2 },
  { label: "2×3", rows: 2, cols: 3 },
  { label: "3×3", rows: 3, cols: 3 },
  { label: "3×4", rows: 3, cols: 4 },
  { label: "4×4", rows: 4, cols: 4 },
];

function makeCell(): TableCell { return { id: crypto.randomUUID(), html: "" }; }
function makeGrid(rows: number, cols: number): TableCell[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => makeCell()));
}

export function TableEditor({ exercise, onChange }: { exercise: TableBlock; onChange: (e: TableBlock) => void }) {
  const rows = exercise.cells.length;
  const cols = exercise.cells[0]?.length || 0;

  const applyPreset = (r: number, c: number) => {
    onChange({ ...exercise, cells: makeGrid(r, c) });
  };

  const addRow = () => {
    const newRow = Array.from({ length: cols }, () => makeCell());
    onChange({ ...exercise, cells: [...exercise.cells, newRow] });
  };

  const addCol = () => {
    onChange({ ...exercise, cells: exercise.cells.map(row => [...row, makeCell()]) });
  };

  const removeRow = (ri: number) => {
    if (rows <= 1) return;
    onChange({ ...exercise, cells: exercise.cells.filter((_, i) => i !== ri) });
  };

  const removeCol = (ci: number) => {
    if (cols <= 1) return;
    onChange({ ...exercise, cells: exercise.cells.map(row => row.filter((_, i) => i !== ci)) });
  };

  const updateCell = (ri: number, ci: number, html: string) => {
    const next = exercise.cells.map((row, r) => row.map((cell, c) => r === ri && c === ci ? { ...cell, html } : cell));
    onChange({ ...exercise, cells: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Grid3X3 className="h-3.5 w-3.5" /> Table
      </div>

      {/* Title */}
      <TableTitleEditor
        value={exercise.titleHtml ?? exercise.title ?? ""}
        onChange={(html) => {
          const tmp = document.createElement("div");
          tmp.innerHTML = html;
          const plain = (tmp.textContent || "").trim();
          onChange({ ...exercise, titleHtml: html, title: plain });
        }}
        placeholder="Table title (optional)"
      />

      {/* Presets */}
      <div className="flex flex-wrap gap-1">
        <span className="text-xs text-muted-foreground self-center mr-1">Presets:</span>
        {TABLE_PRESETS.map(p => (
          <Button key={p.label} variant="outline" size="sm" className="h-7 text-xs" onClick={() => applyPreset(p.rows, p.cols)}>{p.label}</Button>
        ))}
      </div>

      {/* Table grid */}
      <div className="overflow-auto border border-border rounded-lg">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th className="w-8" />
              {Array.from({ length: cols }, (_, ci) => (
                <th key={ci} className="px-1 py-1 text-center">
                  {cols > 1 && (
                    <button onClick={() => removeCol(ci)} className="text-muted-foreground hover:text-destructive transition-colors" title="Remove column">
                      <Trash2 className="h-3 w-3 mx-auto" />
                    </button>
                  )}
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {exercise.cells.map((row, ri) => (
              <tr key={ri}>
                <td className="align-middle px-1">
                  {rows > 1 && (
                    <button onClick={() => removeRow(ri)} className="text-muted-foreground hover:text-destructive transition-colors" title="Remove row">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </td>
                {row.map((cell, ci) => (
                  <td key={cell.id} className="border border-border p-1" style={{ minWidth: 180 }}>
                    <RichTextEditor value={cell.html} onChange={(html) => updateCell(ri, ci, html)} placeholder={exercise.headerRow && ri === 0 ? "Header..." : "Cell content..."} />
                  </td>
                ))}
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row / col */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addRow}><Plus className="h-3 w-3" /> Row</Button>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addCol}><Plus className="h-3 w-3" /> Column</Button>
        <span className="text-xs text-muted-foreground self-center ml-2">{rows}×{cols}</span>
      </div>

      {/* Header row toggle */}
      <div className="flex items-center gap-3">
        <Switch checked={exercise.headerRow} onCheckedChange={(v) => onChange({ ...exercise, headerRow: v })} />
        <Label className="text-sm">Header row</Label>
      </div>

      {/* Header bg color */}
      {exercise.headerRow && (
        <div className="flex items-center gap-3">
          <Label className="text-xs whitespace-nowrap">Header background</Label>
          <input type="color" value={exercise.headerBgColor || "#f3f4f6"} onChange={(e) => onChange({ ...exercise, headerBgColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-input" />
        </div>
      )}

      {/* Border settings */}
      <details className="border border-border rounded-lg">
        <summary className="px-3 py-2 text-sm font-medium cursor-pointer hover:bg-accent/50 rounded-lg">Border Settings</summary>
        <div className="p-3 space-y-3 border-t border-border">
          <div className="flex items-center gap-3">
            <Label className="text-xs w-16">Style</Label>
            <Select value={exercise.borderStyle} onValueChange={(v: any) => onChange({ ...exercise, borderStyle: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-xs w-16">Width</Label>
            <Slider min={1} max={4} step={1} value={[exercise.borderWidth]} onValueChange={([v]) => onChange({ ...exercise, borderWidth: v })} className="flex-1" />
            <span className="text-xs text-muted-foreground w-8">{exercise.borderWidth}px</span>
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-xs w-16">Color</Label>
            <input type="color" value={exercise.borderColor} onChange={(e) => onChange({ ...exercise, borderColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-input" />
          </div>
        </div>
      </details>
    </div>
  );
}

/* ── Split Screen Editor ── */
const SPLIT_INNER_TYPES = [
  { value: "text", label: "Text", icon: <Info className="h-3.5 w-3.5" /> },
  { value: "image", label: "Image", icon: <ImageIcon className="h-3.5 w-3.5" /> },
  { value: "video", label: "Video", icon: <Info className="h-3.5 w-3.5" /> },
  { value: "quiz", label: "Quiz", icon: <HelpCircle className="h-3.5 w-3.5" /> },
  { value: "trueFalse", label: "True / False", icon: <ToggleLeft className="h-3.5 w-3.5" /> },
  { value: "fillBlanks", label: "Fill in Blanks", icon: <PenLine className="h-3.5 w-3.5" /> },
  { value: "crossword", label: "Crossword", icon: <Grid3X3 className="h-3.5 w-3.5" /> },
  { value: "multimediaChoice", label: "Multimedia Choice", icon: <ImageIcon className="h-3.5 w-3.5" /> },
];

function createInnerBlock(type: string): SplitScreenInnerBlock {
  const id = crypto.randomUUID();
  switch (type) {
    case "text": return { type: "text", id, html: "" };
    case "image": return { type: "image", id, url: "", alt: "" };
    case "video": return { type: "video", id, url: "", title: "" };
    case "quiz": return { type: "quiz", id, question: "", options: [{ id: crypto.randomUUID(), text: "", isCorrect: false }, { id: crypto.randomUUID(), text: "", isCorrect: false }] };
    case "trueFalse": return { type: "trueFalse", id, statement: "", isTrue: true };
    case "fillBlanks": return { type: "fillBlanks", id, title: "", text: "", answers: [] };
    case "crossword": return { type: "crossword", id, title: "", words: [{ id: crypto.randomUUID(), word: "", clue: "" }] };
    case "multimediaChoice": return { type: "multimediaChoice", id, question: "", options: [{ id: crypto.randomUUID(), imageUrl: "", label: "", isCorrect: false }], multipleChoice: false, showScore: true, allowRetry: true, allowReveal: true, onePointForAll: false, columnsPerRow: 3 };
    default: return { type: "text", id, html: "" };
  }
}

function SplitPanelEditor({ label, block, onChangeBlock }: { label: string; block: SplitScreenInnerBlock | null; onChangeBlock: (b: SplitScreenInnerBlock | null) => void }) {
  return (
    <div className="flex-1 min-w-0 border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        {block && (
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => onChangeBlock(null)}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        )}
      </div>
      {!block ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
              <Plus className="h-3 w-3" /> Add Block
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="text-xs">Content</DropdownMenuLabel>
            {SPLIT_INNER_TYPES.slice(0, 3).map(t => (
              <DropdownMenuItem key={t.value} onClick={() => onChangeBlock(createInnerBlock(t.value))} className="gap-2 text-xs">
                {t.icon}{t.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Exercises</DropdownMenuLabel>
            {SPLIT_INNER_TYPES.slice(3).map(t => (
              <DropdownMenuItem key={t.value} onClick={() => onChangeBlock(createInnerBlock(t.value))} className="gap-2 text-xs">
                {t.icon}{t.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div>
          <p className="text-xs text-muted-foreground mb-1 capitalize">{block.type === "trueFalse" ? "True / False" : block.type === "fillBlanks" ? "Fill in Blanks" : block.type === "multimediaChoice" ? "Multimedia Choice" : block.type}</p>
          {block.type === "text" && <RichTextEditor value={block.html} onChange={(html) => onChangeBlock({ ...block, html })} placeholder="Write content..." />}
          {block.type === "image" && (
            <div className="space-y-2">
              <MediaUpload value={block.url} onChange={(url) => onChangeBlock({ ...block, url })} accept="image/*" />
              <input placeholder="Alt text" value={block.alt || ""} onChange={(e) => onChangeBlock({ ...block, alt: e.target.value })} className="w-full px-2 py-1 text-xs border border-input rounded-md bg-background" />
            </div>
          )}
          {block.type === "video" && <MediaUpload value={block.url} onChange={(url) => onChangeBlock({ ...block, url })} accept="video/*" placeholder="Video URL..." />}
          {block.type === "quiz" && <QuizEditor exercise={block as QuizBlock} onChange={(u) => onChangeBlock(u as SplitScreenInnerBlock)} />}
          {block.type === "trueFalse" && <TrueFalseEditor exercise={block as TrueFalseBlock} onChange={(u) => onChangeBlock(u as SplitScreenInnerBlock)} />}
          {block.type === "fillBlanks" && <FillBlanksEditor exercise={block as FillBlanksBlock} onChange={(u) => onChangeBlock(u as SplitScreenInnerBlock)} />}
          {block.type === "crossword" && <CrosswordEditor exercise={block as CrosswordBlock} onChange={(u) => onChangeBlock(u as SplitScreenInnerBlock)} />}
          {block.type === "multimediaChoice" && <MultimediaChoiceEditor exercise={block as MultimediaChoiceBlock} onChange={(u) => onChangeBlock(u as SplitScreenInnerBlock)} />}
        </div>
      )}
    </div>
  );
}

export function SplitScreenEditor({ exercise, onChange }: { exercise: SplitScreenBlock; onChange: (e: SplitScreenBlock) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <SplitSquareHorizontal className="h-3.5 w-3.5" /> Split Screen
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        <SplitPanelEditor label="Left" block={exercise.left} onChangeBlock={(b) => onChange({ ...exercise, left: b })} />
        <SplitPanelEditor label="Right" block={exercise.right} onChangeBlock={(b) => onChange({ ...exercise, right: b })} />
      </div>
    </div>
  );
}
