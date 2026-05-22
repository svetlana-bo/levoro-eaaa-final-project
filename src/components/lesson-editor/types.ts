export interface QuizOption { id: string; text: string; isCorrect: boolean; feedback?: string; }
export interface ChecklistItem { id: string; text: string; isCorrect: boolean; }
export interface DialogCard { id: string; front: string; back: string; bgColor: string; frontImage?: string; backImage?: string; sameImage?: boolean; textPosition?: "on-card" | "below-card"; }
export interface MultimediaOption { id: string; imageUrl: string; label?: string; isCorrect: boolean; }
export interface CrosswordWord { id: string; word: string; clue: string; }
export interface Hotspot { id: string; x: number; y: number; icon: "plus" | "minus" | "info" | "exclamation" | "question" | "euro" | "dollar" | "section" | "at" | "pound" | "hash" | "lightbulb" | "custom"; customIconUrl?: string; contentType: "text" | "image"; text?: string; imageUrl?: string; }
export interface ClickableArea { id: string; shape: "circle" | "rectangle"; x: number; y: number; width: number; height: number; isCorrect: boolean; feedback?: string; }
export interface DragDropPair { id: string; left: string; right: string; }
export interface MemoryCard { id: string; contentType: "text" | "image"; text?: string; html?: string; imageUrl?: string; bgColor?: string; pairId: string; }
export interface MemoryPair { id: string; cardA: string; cardB: string; }
export interface DragWordsBlank { id: string; correctWord: string; }
export interface DragWordsDistractor { id: string; word: string; }
export interface FeedbackRange { id: string; min: number; max: number; message: string; }

export interface TextBlock { type: "text"; id: string; html: string; }
export interface ImageBlock { type: "image"; id: string; url: string; alt?: string; widthPercent?: number; }
export interface QuizBlock { type: "quiz"; id: string; question: string; options: QuizOption[]; description?: string; feedbackRanges?: FeedbackRange[]; passingPercentage?: number; imageUrl?: string; multipleChoice?: boolean; showScore?: boolean; allowRetry?: boolean; allowReveal?: boolean; onePointForAll?: boolean; individualFeedback?: boolean; }
export interface ChecklistBlock { type: "checklist"; id: string; title: string; items: ChecklistItem[]; description?: string; feedbackRanges?: FeedbackRange[]; passingPercentage?: number; imageUrl?: string; }
export interface TrueFalseBlock { type: "trueFalse"; id: string; statement: string; isTrue: boolean; description?: string; feedbackRanges?: FeedbackRange[]; passingPercentage?: number; imageUrl?: string; labelTrue?: string; labelFalse?: string; feedbackCorrect?: string; feedbackIncorrect?: string; allowRetry?: boolean; allowReveal?: boolean; showScore?: boolean; }
export interface FillBlanksBlock { type: "fillBlanks"; id: string; title: string; text: string; answers: { id: string; value: string }[]; description?: string; feedbackRanges?: FeedbackRange[]; passingPercentage?: number; imageUrl?: string; completionMessage?: string; }
export interface DialogCardsBlock { type: "dialogCards"; id: string; title: string; cards: DialogCard[]; description?: string; imageUrl?: string; flipSpeed?: "fast" | "medium" | "slow"; }
export interface ReflectionBlock { type: "reflection"; id: string; prompt: string; helpText?: string; inputSize?: "small" | "medium" | "large"; minChars?: number; description?: string; feedbackRanges?: FeedbackRange[]; passingPercentage?: number; imageUrl?: string; completionMessage?: string; }
export interface MultimediaChoiceBlock { type: "multimediaChoice"; id: string; question: string; options: MultimediaOption[]; description?: string; feedbackRanges?: FeedbackRange[]; passingPercentage?: number; imageUrl?: string; multipleChoice?: boolean; showScore?: boolean; allowRetry?: boolean; allowReveal?: boolean; onePointForAll?: boolean; columnsPerRow?: number; }
export interface CrosswordSolutionMapping { wordIndex: number; letterIndex: number; }
export interface CrosswordBlock { type: "crossword"; id: string; title: string; words: CrosswordWord[]; description?: string; feedbackRanges?: FeedbackRange[]; passingPercentage?: number; imageUrl?: string; bgColor?: string; solutionWord?: string; solutionHint?: string; solutionDirection?: "across" | "down"; solutionMappings?: CrosswordSolutionMapping[]; }
export interface DragDropBlock { type: "dragDrop"; id: string; title: string; pairs: DragDropPair[]; description?: string; feedbackRanges?: FeedbackRange[]; passingPercentage?: number; imageUrl?: string; }
export interface SortParagraphsBlock { type: "sortParagraphs"; id: string; title: string; paragraphs: { id: string; text: string }[]; description?: string; feedbackRanges?: FeedbackRange[]; passingPercentage?: number; imageUrl?: string; allowReveal?: boolean; }
export interface SortImagesBlock { type: "sortImages"; id: string; title: string; images: { id: string; url: string; label?: string }[]; description?: string; feedbackRanges?: FeedbackRange[]; passingPercentage?: number; imageUrl?: string; columnsPerRow?: number; }
export interface MemoryGameBlock { type: "memoryGame"; id: string; title: string; pairs: MemoryPair[]; cards?: MemoryCard[]; backImage?: string; gridColumns?: number; gridRows?: number; completionMessage?: string; description?: string; feedbackRanges?: FeedbackRange[]; passingPercentage?: number; imageUrl?: string; }
export interface ImageJuxtapositionBlock { type: "imageJuxtaposition"; id: string; title: string; imageBefore: string; imageAfter: string; labelBefore?: string; labelAfter?: string; description?: string; imageUrl?: string; }
export interface DragWordsBlock { type: "dragWords"; id: string; title: string; text: string; blanks: DragWordsBlank[]; distractors: DragWordsDistractor[]; description?: string; feedbackRanges?: FeedbackRange[]; passingPercentage?: number; imageUrl?: string; showScore?: boolean; allowRetry?: boolean; allowReveal?: boolean; }
export interface FillWordsOption { id: string; text: string; isCorrect: boolean; }
export interface FillWordsBlank { id: string; allCorrect?: boolean; options: FillWordsOption[]; }
export interface FillWordsBlock { type: "fillWords"; id: string; title: string; text: string; blanks: FillWordsBlank[]; description?: string; feedbackRanges?: FeedbackRange[]; passingPercentage?: number; imageUrl?: string; showScore?: boolean; allowRetry?: boolean; allowReveal?: boolean; }
export interface MarkWordsBlock { type: "markWords"; id: string; title: string; text: string; description?: string; feedbackRanges?: FeedbackRange[]; passingPercentage?: number; imageUrl?: string; showScore?: boolean; allowRetry?: boolean; allowReveal?: boolean; }
export interface QuestionSetBlock { type: "questionSet"; id: string; title: string; exercises: ContentBlock[]; description?: string; feedbackRanges?: FeedbackRange[]; passingPercentage?: number; imageUrl?: string; showScore?: boolean; }
export interface ImageHotspotBlock { type: "imageHotspot"; id: string; title: string; baseImage: string; hotspots: Hotspot[]; description?: string; }
export interface FindHotspotBlock { type: "findHotspot"; id: string; title: string; baseImage: string; areas: ClickableArea[]; description?: string; feedbackRanges?: FeedbackRange[]; passingPercentage?: number; imageUrl?: string; showScore?: boolean; allowReveal?: boolean; feedbackEmpty?: string; feedbackFound?: string; feedbackAllFound?: string; }
export interface AccordionItem { id: string; title: string; body: string; }
export interface AccordionBlock { type: "accordion"; id: string; title: string; items: AccordionItem[]; description?: string; }
export interface ImageSliderImage { id: string; url: string; alt?: string; }
export interface ImageSliderBlock { type: "imageSlider"; id: string; title: string; images: ImageSliderImage[]; description?: string; }

export interface FlashcardItem { id: string; imageUrl: string; text?: string; mode: "open" | "exact"; correctAnswer?: string; feedbackCorrect?: string; feedbackIncorrect?: string; }
export interface FlashcardsBlock { type: "flashcards"; id: string; title: string; cards: FlashcardItem[]; mode?: "open" | "exact"; feedbackOpen?: string; description?: string; }

export interface AnswerCardItem { id: string; imageUrl: string; buttonLabel: string; revealedText: string; }
export interface AnswerCardsBlock { type: "answerCards"; id: string; title: string; cards: AnswerCardItem[]; description?: string; widthPercent?: number; }

export interface ImageReflectionInputBox { id: string; x: number; y: number; size: "one" | "three" | "five"; width?: number; height?: number; }
export interface ImageReflectionBlock { type: "imageReflection"; id: string; title: string; baseImage: string; inputBoxes: ImageReflectionInputBox[]; completionMessage?: string; description?: string; imageUrl?: string; }

export interface BranchingEndScene { id: string; type: "default" | "custom"; title?: string; text?: string; imageUrl?: string; }
export interface BranchingChoice { id: string; label: string; nextNodeId: string | null; scoreCondition?: "pass" | "fail"; endSceneId?: string; }
export interface BranchingNode { id: string; type: "text" | "image" | "video" | "branchingQuestion" | "exercise"; title: string; content?: string; imageUrl?: string; videoUrl?: string; question?: string; exerciseBlock?: ContentBlock; choices: BranchingChoice[]; }
export interface BranchingScenarioBlock { type: "branchingScenario"; id: string; title: string; startNodeId: string; nodes: BranchingNode[]; endScenes: BranchingEndScene[]; description?: string; imageUrl?: string; }

export interface SqlExerciseBlock { type: "sqlExercise"; id: string; title: string; setupSql: string; taskDescription: string; starterCode: string; solutionQuery: string; expectedColumns: string[]; expectedRows: string[][]; hint?: string; description?: string; validationMode?: "query" | "output"; expectedAnswer?: string; persistentDb?: boolean; }

export interface VideoBlock { type: "video"; id: string; url: string; title?: string; }

export interface TableCell { id: string; html: string; }
export interface TableBlock { type: "table"; id: string; title?: string; titleHtml?: string; cells: TableCell[][]; headerRow: boolean; borderStyle: "solid" | "dashed" | "dotted" | "none"; borderWidth: number; borderColor: string; headerBgColor?: string; }

export type SplitScreenInnerBlock = TextBlock | ImageBlock | VideoBlock | QuizBlock | TrueFalseBlock | FillBlanksBlock | CrosswordBlock | MultimediaChoiceBlock;
export interface SplitScreenBlock { type: "splitScreen"; id: string; title?: string; left: SplitScreenInnerBlock | null; right: SplitScreenInnerBlock | null; description?: string; }

export type ContentBlock = TextBlock | ImageBlock | VideoBlock | QuizBlock | ChecklistBlock | TrueFalseBlock | FillBlanksBlock | DialogCardsBlock | ReflectionBlock | MultimediaChoiceBlock | CrosswordBlock | DragDropBlock | SortParagraphsBlock | SortImagesBlock | MemoryGameBlock | ImageJuxtapositionBlock | DragWordsBlock | FillWordsBlock | MarkWordsBlock | QuestionSetBlock | ImageHotspotBlock | FindHotspotBlock | AccordionBlock | ImageReflectionBlock | BranchingScenarioBlock | ImageSliderBlock | FlashcardsBlock | AnswerCardsBlock | SqlExerciseBlock | TableBlock | SplitScreenBlock;

export function parseBlocks(lesson: any): ContentBlock[] {
  const raw = (lesson as any).content_blocks;
  if (raw) {
    try {
      const blocks = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(blocks) && blocks.length > 0) return blocks;
    } catch {}
  }
  const blocks: ContentBlock[] = [];
  if (lesson.content) blocks.push({ type: "text", id: crypto.randomUUID(), html: lesson.content });
  try {
    const exercises = typeof lesson.exercises === "string" ? JSON.parse(lesson.exercises) : (lesson.exercises || []);
    for (const ex of exercises) {
      if (ex.type === "checklist" && ex.items) {
        ex.items = ex.items.map((i: any) => ({ ...i, isCorrect: i.isCorrect ?? false }));
      }
      if (ex.type) blocks.push(ex);
    }
  } catch {}
  return blocks;
}

export function blocksToLegacy(blocks: ContentBlock[]): { content: string | null; exercises: string } {
  const textParts = blocks.filter(b => b.type === "text").map(b => (b as TextBlock).html);
  const exercises = blocks.filter(b => !["text", "image"].includes(b.type));
  return { content: textParts.join("\n") || null, exercises: JSON.stringify(exercises) };
}
