import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Check, Star, RefreshCcw, ClipboardList } from "lucide-react";
import { QuestionSetBlock, FeedbackRange } from "@/components/lesson-editor/types";
import { BlockRenderer } from "./BlockRenderer";
import { QuestionSetContext, QuestionSetReporter } from "./QuestionSetContext";
import { safeHtml } from "@/lib/sanitize";

function isEmptyHtml(html?: string): boolean {
  if (!html) return true;
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim().length === 0;
}

function getScoreFeedback(score: number, feedbackRanges?: FeedbackRange[], passingPercentage?: number): { message: string | null; passed: boolean } {
  const passPct = passingPercentage ?? 0;
  const passed = score >= passPct;
  if (!feedbackRanges || feedbackRanges.length === 0) return { message: null, passed };
  const range = feedbackRanges.find(r => score >= r.min && score <= r.max);
  return { message: range?.message || null, passed };
}

export function QuestionSetPlayer({ exercise, lessonId }: { exercise: QuestionSetBlock; lessonId?: string }) {
  const exercises = exercise.exercises;
  const totalExercises = exercises.length;
  const showScore = exercise.showScore ?? true;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [exerciseScores, setExerciseScores] = useState<Record<string, number>>({});
  const [resetKey, setResetKey] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  const checkedCount = Object.keys(exerciseScores).length;

  // Sum the real per-exercise score01 values. Sub-exercises with their own
  // Show Score off self-report 1 (handled in BlockRenderer), so ungraded
  // questions already contribute full credit.
  const earnedPoints = exercises.reduce((sum, ex) => sum + (exerciseScores[ex.id] ?? 0), 0);
  const earnedDisplay = Math.round(earnedPoints * 10) / 10;

  const overallScore = totalExercises > 0 ? earnedPoints / totalExercises : 0;
  const overallPct = Math.round(overallScore * 100);

  const reporter: QuestionSetReporter = useCallback((blockId, score01) => {
    const clamped = Math.min(1, Math.max(0, score01));
    setExerciseScores(prev => {
      if (prev[blockId] === clamped) return prev;
      return { ...prev, [blockId]: clamped };
    });
  }, []);

  const goNext = () => {
    if (currentIndex < totalExercises - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowSummary(true);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const goToIndex = (i: number) => {
    if (i >= 0 && i < totalExercises) {
      setShowSummary(false);
      setCurrentIndex(i);
    }
  };

  const retry = () => {
    setCurrentIndex(0);
    setExerciseScores({});
    setShowSummary(false);
    setResetKey(k => k + 1);
  };

  if (totalExercises === 0) {
    return (
      <div className="border border-border rounded-xl p-5 bg-muted/20">
        <p className="text-muted-foreground text-base">This question set has no exercises.</p>
      </div>
    );
  }

  const { message: feedbackMessage, passed } = getScoreFeedback(overallPct, exercise.feedbackRanges, exercise.passingPercentage);

  return (
    <QuestionSetContext.Provider value={reporter}>
      <div className="border border-border rounded-xl overflow-hidden bg-muted/20">
        {/* Summary view */}
        <div style={{ display: showSummary ? 'block' : 'none' }}>
          {exercise.imageUrl && <img src={exercise.imageUrl} alt="Exercise" className="w-full max-h-48 object-cover" />}
          <div className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Complete</h3>

              {showScore && (
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border">
                    <div className="h-2 flex-1 min-w-[80px] rounded-full bg-muted-foreground/20 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.round((earnedPoints / totalExercises) * 100)}%` }}
                      />
                    </div>
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="font-semibold text-sm">{earnedDisplay}/{totalExercises}</span>
                  </div>
                </div>
              )}

              {feedbackMessage && (
                <p className={`text-sm font-medium ${passed ? "text-primary" : "text-destructive"}`}>
                  {feedbackMessage}
                </p>
              )}

              {checkedCount < totalExercises && (
                <p className="text-xs text-amber-600">
                  {totalExercises - checkedCount} exercise{totalExercises - checkedCount > 1 ? "s were" : " was"} not checked.
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowSummary(false); setCurrentIndex(0); }} className="gap-1.5">
                <ChevronLeft className="h-3.5 w-3.5" /> Review Exercises
              </Button>
              <Button variant="outline" size="sm" onClick={retry} className="gap-1.5">
                <RefreshCcw className="h-3.5 w-3.5" /> Retry All
              </Button>
            </div>
          </div>
        </div>

        {/* Exercises view */}
        <div style={{ display: showSummary ? 'none' : 'block' }}>
          {exercise.imageUrl && currentIndex === 0 && <img src={exercise.imageUrl} alt="Exercise" className="w-full max-h-48 object-cover" />}
          <div className="p-5">
            {(exercise.title || !isEmptyHtml(exercise.description)) && (
              <div className="mb-4">
                {exercise.title && <h3 className="text-lg font-semibold mb-1">{exercise.title}</h3>}
                {!isEmptyHtml(exercise.description) && (
                  <div
                    className="text-muted-foreground prose max-w-none text-left [&_*]:text-left"
                    dangerouslySetInnerHTML={safeHtml(exercise.description)}
                  />
                )}
              </div>
            )}
            {exercises.map((ex, i) => (
              <div key={`${resetKey}-${ex.id}`} style={{ display: i === currentIndex ? 'block' : 'none' }}>
                <BlockRenderer blocks={[ex]} lessonId={lessonId} storageScope={`qs-${exercise.id}`} />
              </div>
            ))}

            <div className="flex items-center justify-between pt-3 mt-4 border-t border-border/30">
              <div className="flex items-center gap-1.5 flex-1 justify-center">
                {exercises.map((ex, i) => {
                  const checked = exerciseScores[ex.id] !== undefined;
                  const isCurrent = i === currentIndex;
                  return (
                    <button
                      key={i}
                      onClick={() => goToIndex(i)}
                      className={`transition-all rounded-full ${
                        isCurrent
                          ? "w-3 h-3 ring-2 ring-primary/40 " + (checked ? "bg-primary" : "bg-primary/30")
                          : checked
                            ? "w-2.5 h-2.5 bg-primary"
                            : "w-2.5 h-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                      aria-label={`Exercise ${i + 1}`}
                    />
                  );
                })}
              </div>

              <div className="flex gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {currentIndex < totalExercises - 1 ? (
                  <Button variant="default" size="sm" className="rounded-lg gap-1.5" onClick={goNext}>
                    Next Question
                  </Button>
                ) : (
                  <Button variant="default" size="sm" className="rounded-lg gap-1.5" onClick={goNext}>
                    <Check className="h-4 w-4" /> Finish
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </QuestionSetContext.Provider>
  );
}
