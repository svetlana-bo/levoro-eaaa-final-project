import { useState, useCallback, useRef } from "react";
import { BranchingScenarioBlock, BranchingNode, BranchingEndScene } from "@/components/lesson-editor/types";
import { safeHtml, normalizeRichTextHtml } from "@/lib/sanitize";
import { Button } from "@/components/ui/button";
import { ChevronLeft, RotateCcw, Flag } from "lucide-react";
import { QuestionSetContext } from "./QuestionSetContext";
import { BlockRenderer } from "./BlockRenderer";

const EXPLORATORY_EXERCISE_TYPES = new Set(["imageHotspot"]);

export function BranchingScenarioPlayer({ block, courseId, lessonId, storageScope }: { block: BranchingScenarioBlock; courseId?: string; lessonId?: string; storageScope?: string }) {
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(block.startNodeId);
  const [history, setHistory] = useState<string[]>([]);
  const [endScene, setEndScene] = useState<BranchingEndScene | null>(null);
  const routedRef = useRef<string | null>(null);

  const currentNode = block.nodes.find(n => n.id === currentNodeId);
  const defaultEnd = block.endScenes.find(e => e.type === "default") || block.endScenes[0];

  const goToNode = useCallback((nodeId: string | null, endSceneId?: string) => {
    routedRef.current = null;
    if (currentNodeId) {
      setHistory(prev => [...prev, currentNodeId]);
    }
    if (nodeId) {
      setCurrentNodeId(nodeId);
      setEndScene(null);
    } else {
      setCurrentNodeId(null);
      const scene = endSceneId
        ? block.endScenes.find(e => e.id === endSceneId) || defaultEnd
        : defaultEnd;
      setEndScene(scene || null);
    }
  }, [currentNodeId, block.endScenes, defaultEnd]);

  const goBack = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setCurrentNodeId(prev);
    setEndScene(null);
    routedRef.current = null;
  }, [history]);

  const restart = useCallback(() => {
    setCurrentNodeId(block.startNodeId);
    setHistory([]);
    setEndScene(null);
    routedRef.current = null;
  }, [block.startNodeId]);

  // Reporter for scored exercises inside an exercise node.
  // BlockRenderer's ReportSubmission helper invokes this with (blockId, score01)
  // whenever the exercise is submitted/revealed.
  const exerciseReporter = useCallback((blockId: string, score01: number) => {
    if (!currentNode || currentNode.type !== "exercise" || !currentNode.exerciseBlock) return;
    if (blockId !== currentNode.exerciseBlock.id) return;
    if (routedRef.current === blockId) return; // already routed for this exercise
    const passPct = ((currentNode.exerciseBlock as any).passingPercentage ?? 50) / 100;
    const passed = score01 >= passPct;
    const target = currentNode.choices.find(c => c.scoreCondition === (passed ? "pass" : "fail"));
    if (!target) return;
    routedRef.current = blockId;
    setTimeout(() => goToNode(target.nextNodeId, target.endSceneId), 1200);
  }, [currentNode, goToNode]);

  const renderVideoEmbed = (url: string) => {
    let embedUrl = url;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
        <iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
      </div>
    );
  };

  if (endScene) {
    return (
      <div className="border border-border rounded-xl p-6 bg-muted/20 space-y-4">
        <div className="text-center space-y-4 py-6">
          <Flag className="h-8 w-8 text-green-600 mx-auto" />
          {endScene.title && <h3 className="text-lg font-semibold">{endScene.title}</h3>}
          {endScene.imageUrl && (
            <img src={endScene.imageUrl} alt={endScene.title || "End"} className="w-full rounded-lg" />
          )}
          {endScene.text && (
            <div className="prose max-w-none text-muted-foreground text-left [&_*]:text-left" dangerouslySetInnerHTML={safeHtml(normalizeRichTextHtml(endScene.text))} />
          )}
          {!endScene.title && !endScene.text && !endScene.imageUrl && (
            <p className="text-muted-foreground">You have completed this scenario.</p>
          )}
        </div>
        <div className="flex justify-center gap-2">
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={goBack} className="gap-1">
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={restart} className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" /> Restart
          </Button>
        </div>
      </div>
    );
  }

  if (!currentNode) {
    return (
      <div className="border border-border rounded-xl p-6 bg-muted/20 text-center space-y-3">
        <p className="text-sm text-muted-foreground">This scenario has no content yet.</p>
        <Button variant="outline" size="sm" onClick={restart}><RotateCcw className="h-3.5 w-3.5 mr-1" /> Restart</Button>
      </div>
    );
  }

  const isExerciseNode = currentNode.type === "exercise" && !!currentNode.exerciseBlock;
  const isExploratory = isExerciseNode && EXPLORATORY_EXERCISE_TYPES.has(currentNode.exerciseBlock!.type);

  return (
    <div className="border border-border rounded-xl p-5 bg-muted/20 space-y-4">
      {history.length > 0 && (
        <div className="flex items-center justify-end">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={goBack}>
            <ChevronLeft className="h-3 w-3" /> Back
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {currentNode.type === "text" && currentNode.content && (
          <div className="prose max-w-none text-left [&_*]:text-left" dangerouslySetInnerHTML={safeHtml(normalizeRichTextHtml(currentNode.content))} />
        )}

        {currentNode.type === "image" && currentNode.imageUrl && (
          <img src={currentNode.imageUrl} alt={currentNode.title} className="w-full rounded-lg" />
        )}

        {currentNode.type === "video" && currentNode.videoUrl && (
          renderVideoEmbed(currentNode.videoUrl)
        )}

        {currentNode.type === "branchingQuestion" && currentNode.question && (
          <div className="py-4">
            <div className="prose max-w-none font-medium text-left [&_*]:text-left" dangerouslySetInnerHTML={safeHtml(normalizeRichTextHtml(currentNode.question))} />
          </div>
        )}

        {isExerciseNode && (
          <QuestionSetContext.Provider value={exerciseReporter}>
            <BlockRenderer blocks={[currentNode.exerciseBlock!]} courseId={courseId} lessonId={lessonId} storageScope={storageScope} />
          </QuestionSetContext.Provider>
        )}

        {currentNode.type === "exercise" && !currentNode.exerciseBlock && (
          <p className="text-sm text-muted-foreground italic text-center py-6">No exercise configured.</p>
        )}
      </div>

      {/* Choice buttons — hidden for scored exercises (auto-routed). Shown as a single Continue for exploratory exercises and decision points. */}
      {currentNode.choices.length > 0 && !(isExerciseNode && !isExploratory) && (
        <div className="flex flex-col gap-3 items-center w-full max-w-lg mx-auto pt-2">
          {currentNode.choices.map(choice => (
            <Button
              key={choice.id}
              variant="outline"
              className="rounded-full px-6 py-3 h-auto min-h-[2.75rem] text-sm normal-case whitespace-normal break-words text-center w-full hover:bg-primary hover:text-primary-foreground transition-colors leading-snug"
              onClick={() => goToNode(choice.nextNodeId, choice.endSceneId)}
            >
              {choice.label}
            </Button>
          ))}
        </div>
      )}

      {currentNode.choices.length === 0 && (
        <div className="flex justify-center gap-2 pt-2">
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={goBack} className="gap-1">
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={restart} className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" /> Restart
          </Button>
        </div>
      )}
    </div>
  );
}
