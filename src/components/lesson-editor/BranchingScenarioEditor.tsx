import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { BranchingScenarioBlock, BranchingNode, BranchingChoice, BranchingEndScene, ContentBlock, QuizBlock, TrueFalseBlock, FindHotspotBlock, ImageHotspotBlock } from "./types";
import { RichTextEditor } from "./RichTextEditor";
import { normalizeRichTextHtml } from "@/lib/sanitize";
import { MediaUpload } from "@/components/MediaUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GitBranch, Flag, Type, ImageIcon, Video, HelpCircle, Puzzle, X, ChevronRight } from "lucide-react";
import { QuizEditor, TrueFalseEditor, FindHotspotEditor, ImageHotspotEditor } from "./ExerciseEditors";

const EXPLORATORY_EXERCISE_TYPES = new Set(["imageHotspot"]);
function makeChoicesForExerciseType(type: string): BranchingChoice[] {
  if (EXPLORATORY_EXERCISE_TYPES.has(type)) {
    return [{ id: crypto.randomUUID(), label: "Continue", nextNodeId: null }];
  }
  return [
    { id: crypto.randomUUID(), label: "On Pass", nextNodeId: null, scoreCondition: "pass" as const },
    { id: crypto.randomUUID(), label: "On Fail", nextNodeId: null, scoreCondition: "fail" as const },
  ];
}

const NODE_W = 160;
const NODE_H = 56;
const END_W = 140;
const END_H = 48;
const H_GAP = 40;
const V_GAP = 80;

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  isEnd?: boolean;
}

function layoutGraph(nodes: BranchingNode[], endScenes: BranchingEndScene[], startNodeId: string): LayoutNode[] {
  const result: LayoutNode[] = [];
  const visited = new Set<string>();
  const levels: string[][] = [];

  // BFS from start
  const queue: { id: string; depth: number }[] = [{ id: startNodeId, depth: 0 }];
  visited.add(startNodeId);

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (!levels[depth]) levels[depth] = [];
    levels[depth].push(id);

    const node = nodes.find(n => n.id === id);
    if (node) {
      for (const c of node.choices) {
        if (c.nextNodeId && !visited.has(c.nextNodeId)) {
          visited.add(c.nextNodeId);
          queue.push({ id: c.nextNodeId, depth: depth + 1 });
        }
      }
    }
  }

  // Add unvisited nodes
  const orphans: string[] = [];
  for (const n of nodes) {
    if (!visited.has(n.id)) orphans.push(n.id);
  }
  if (orphans.length > 0) levels.push(orphans);

  // Position nodes
  for (let d = 0; d < levels.length; d++) {
    const row = levels[d];
    const totalW = row.length * NODE_W + (row.length - 1) * H_GAP;
    const startX = -totalW / 2 + NODE_W / 2;
    for (let i = 0; i < row.length; i++) {
      result.push({ id: row[i], x: startX + i * (NODE_W + H_GAP), y: d * (NODE_H + V_GAP) });
    }
  }

  // End scenes below all nodes
  const endY = levels.length * (NODE_H + V_GAP);
  const totalEndW = endScenes.length * END_W + (endScenes.length - 1) * H_GAP;
  const endStartX = -totalEndW / 2 + END_W / 2;
  for (let i = 0; i < endScenes.length; i++) {
    result.push({ id: endScenes[i].id, x: endStartX + i * (END_W + H_GAP), y: endY, isEnd: true });
  }

  return result;
}

const nodeTypeIcon = (type: BranchingNode["type"]) => {
  switch (type) {
    case "text": return <Type className="h-3 w-3" />;
    case "image": return <ImageIcon className="h-3 w-3" />;
    case "video": return <Video className="h-3 w-3" />;
    case "branchingQuestion": return <HelpCircle className="h-3 w-3" />;
    case "exercise": return <Puzzle className="h-3 w-3" />;
  }
};

export function BranchingScenarioEditor({ exercise, onChange }: { exercise: BranchingScenarioBlock; onChange: (e: BranchingScenarioBlock) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const layout = useMemo(() => layoutGraph(exercise.nodes, exercise.endScenes, exercise.startNodeId), [exercise.nodes, exercise.endScenes, exercise.startNodeId]);

  // Calculate canvas bounds
  const bounds = useMemo(() => {
    if (layout.length === 0) return { minX: 0, minY: 0, maxX: 400, maxY: 300 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const l of layout) {
      const w = l.isEnd ? END_W : NODE_W;
      const h = l.isEnd ? END_H : NODE_H;
      minX = Math.min(minX, l.x - w / 2);
      minY = Math.min(minY, l.y - h / 2);
      maxX = Math.max(maxX, l.x + w / 2);
      maxY = Math.max(maxY, l.y + h / 2);
    }
    return { minX: minX - 40, minY: minY - 40, maxX: maxX + 40, maxY: maxY + 40 };
  }, [layout]);

  const svgW = bounds.maxX - bounds.minX;
  const svgH = bounds.maxY - bounds.minY;

  const getLayoutPos = useCallback((id: string) => layout.find(l => l.id === id), [layout]);

  const selectedNode = exercise.nodes.find(n => n.id === selectedId);
  const selectedEnd = exercise.endScenes.find(e => e.id === selectedId);

  const updateNode = (id: string, patch: Partial<BranchingNode>) => {
    onChange({ ...exercise, nodes: exercise.nodes.map(n => n.id === id ? { ...n, ...patch } : n) });
  };

  const updateEndScene = (id: string, patch: Partial<BranchingEndScene>) => {
    onChange({ ...exercise, endScenes: exercise.endScenes.map(e => e.id === id ? { ...e, ...patch } : e) });
  };

  const addNode = (type: BranchingNode["type"] = "text") => {
    const id = crypto.randomUUID();
    const newNode: BranchingNode = {
      id, type, title: `New ${type} node`, choices: [],
      ...(type === "branchingQuestion" ? { question: "" } : {}),
      ...(type === "text" ? { content: "" } : {}),
      ...(type === "image" ? { imageUrl: "" } : {}),
      ...(type === "video" ? { videoUrl: "" } : {}),
    };
    onChange({ ...exercise, nodes: [...exercise.nodes, newNode] });
    setSelectedId(id);
  };

  const addEndScene = () => {
    const id = crypto.randomUUID();
    const newEnd: BranchingEndScene = { id, type: "custom", title: "Custom Ending", text: "" };
    onChange({ ...exercise, endScenes: [...exercise.endScenes, newEnd] });
    setSelectedId(id);
  };

  const removeNode = (id: string) => {
    // Remove all choices pointing to this node
    const updatedNodes = exercise.nodes
      .filter(n => n.id !== id)
      .map(n => ({
        ...n,
        choices: n.choices.map(c => c.nextNodeId === id ? { ...c, nextNodeId: null } : c)
      }));
    const newStart = id === exercise.startNodeId && updatedNodes.length > 0 ? updatedNodes[0].id : exercise.startNodeId;
    onChange({ ...exercise, nodes: updatedNodes, startNodeId: newStart });
    if (selectedId === id) setSelectedId(null);
  };

  const removeEndScene = (id: string) => {
    if (exercise.endScenes.length <= 1) return; // keep at least the default
    const defaultEnd = exercise.endScenes.find(e => e.type === "default")?.id;
    const updatedNodes = exercise.nodes.map(n => ({
      ...n,
      choices: n.choices.map(c => c.endSceneId === id ? { ...c, endSceneId: defaultEnd } : c)
    }));
    onChange({ ...exercise, endScenes: exercise.endScenes.filter(e => e.id !== id), nodes: updatedNodes });
    if (selectedId === id) setSelectedId(null);
  };

  const addChoice = (nodeId: string) => {
    const node = exercise.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const newChoice: BranchingChoice = { id: crypto.randomUUID(), label: "Choice", nextNodeId: null };
    updateNode(nodeId, { choices: [...node.choices, newChoice] });
  };

  const updateChoice = (nodeId: string, choiceId: string, patch: Partial<BranchingChoice>) => {
    const node = exercise.nodes.find(n => n.id === nodeId);
    if (!node) return;
    updateNode(nodeId, {
      choices: node.choices.map(c => c.id === choiceId ? { ...c, ...patch } : c)
    });
  };

  const removeChoice = (nodeId: string, choiceId: string) => {
    const node = exercise.nodes.find(n => n.id === nodeId);
    if (!node) return;
    updateNode(nodeId, { choices: node.choices.filter(c => c.id !== choiceId) });
  };

  // Build connection lines
  const connections: { fromX: number; fromY: number; toX: number; toY: number; label: string }[] = [];
  for (const node of exercise.nodes) {
    const from = getLayoutPos(node.id);
    if (!from) continue;
    for (const choice of node.choices) {
      const targetId = choice.nextNodeId || choice.endSceneId;
      if (!targetId) continue;
      const to = getLayoutPos(targetId);
      if (!to) continue;
      const isEnd = exercise.endScenes.some(e => e.id === targetId);
      connections.push({
        fromX: from.x - bounds.minX,
        fromY: from.y - bounds.minY + NODE_H / 2,
        toX: to.x - bounds.minX,
        toY: to.y - bounds.minY - (isEnd ? END_H : NODE_H) / 2,
        label: choice.label,
      });
    }
  }

  // Also connect choices with nextNodeId null and endSceneId set
  // (already handled above)

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).tagName === 'line' || (e.target as HTMLElement).tagName === 'path') {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
    }
  };

  useEffect(() => {
    if (!isPanning) return;
    const onMove = (e: MouseEvent) => {
      setPanOffset({
        x: panStart.current.ox + (e.clientX - panStart.current.x),
        y: panStart.current.oy + (e.clientY - panStart.current.y),
      });
    };
    const onUp = () => setIsPanning(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [isPanning]);

  // Target options for choice dropdowns
  const targetOptions = [
    ...exercise.nodes.map(n => ({ value: `node:${n.id}`, label: `↳ ${n.title || n.type}` })),
    ...exercise.endScenes.map(e => ({ value: `end:${e.id}`, label: `🏁 ${e.title || (e.type === "default" ? "Default End" : "Custom End")}` })),
  ];

  const handleChoiceTarget = (nodeId: string, choiceId: string, val: string) => {
    if (val.startsWith("node:")) {
      updateChoice(nodeId, choiceId, { nextNodeId: val.replace("node:", ""), endSceneId: undefined });
    } else if (val.startsWith("end:")) {
      updateChoice(nodeId, choiceId, { nextNodeId: null, endSceneId: val.replace("end:", "") });
    }
  };

  const getChoiceTargetValue = (choice: BranchingChoice) => {
    if (choice.nextNodeId) return `node:${choice.nextNodeId}`;
    if (choice.endSceneId) return `end:${choice.endSceneId}`;
    return "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <GitBranch className="h-3.5 w-3.5" /> Branching Scenario
      </div>
      <Input
        value={exercise.title}
        onChange={e => onChange({ ...exercise, title: e.target.value })}
        placeholder="Scenario title..."
        className="text-sm font-medium"
      />

      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => addNode("text")}><Type className="h-3 w-3" /> Text Node</Button>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => addNode("image")}><ImageIcon className="h-3 w-3" /> Image Node</Button>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => addNode("video")}><Video className="h-3 w-3" /> Video Node</Button>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => addNode("branchingQuestion")}><HelpCircle className="h-3 w-3" /> Decision Point</Button>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => addNode("exercise")}><Puzzle className="h-3 w-3" /> Exercise Node</Button>
        <div className="w-px bg-border h-7" />
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addEndScene}><Flag className="h-3 w-3" /> End Scene</Button>
      </div>

      {/* Canvas + Detail split */}
      <div className="flex gap-3 items-start">
        {/* Visual Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 border border-border rounded-lg bg-muted/30 overflow-auto relative cursor-grab max-h-[500px]"
          onMouseDown={handleMouseDown}
          style={{ cursor: isPanning ? "grabbing" : "grab" }}
        >
          <div style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)`, position: "relative", width: svgW, height: svgH, margin: "20px auto" }}>
            {/* SVG connections */}
            <svg width={svgW} height={svgH} className="absolute inset-0 pointer-events-none" style={{ overflow: "visible" }}>
              {connections.map((c, i) => {
                const midY = (c.fromY + c.toY) / 2;
                return (
                  <g key={i}>
                    <path
                      d={`M ${c.fromX} ${c.fromY} C ${c.fromX} ${midY}, ${c.toX} ${midY}, ${c.toX} ${c.toY}`}
                      fill="none"
                      stroke="hsl(var(--border))"
                      strokeWidth={2}
                    />
                    {/* Arrow head */}
                    <polygon
                      points={`${c.toX - 4},${c.toY - 8} ${c.toX + 4},${c.toY - 8} ${c.toX},${c.toY}`}
                      fill="hsl(var(--border))"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Node cards */}
            {layout.filter(l => !l.isEnd).map(l => {
              const node = exercise.nodes.find(n => n.id === l.id);
              if (!node) return null;
              const isSelected = selectedId === l.id;
              const isStart = l.id === exercise.startNodeId;
              return (
                <div
                  key={l.id}
                  className={`absolute rounded-lg border-2 px-3 py-2 cursor-pointer transition-colors text-xs flex items-center gap-1.5 truncate select-none ${
                    isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"
                  } ${isStart ? "ring-2 ring-primary/30" : ""}`}
                  style={{ left: l.x - bounds.minX - NODE_W / 2, top: l.y - bounds.minY - NODE_H / 2, width: NODE_W, height: NODE_H }}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(l.id); }}
                >
                  {nodeTypeIcon(node.type)}
                  <span className="truncate flex-1">{node.title || node.type}</span>
                  {isStart && <span className="text-[9px] bg-primary/20 text-primary px-1 rounded">START</span>}
                </div>
              );
            })}

            {/* End scene cards */}
            {layout.filter(l => l.isEnd).map(l => {
              const end = exercise.endScenes.find(e => e.id === l.id);
              if (!end) return null;
              const isSelected = selectedId === l.id;
              return (
                <div
                  key={l.id}
                  className={`absolute rounded-full border-2 px-3 py-2 cursor-pointer transition-colors text-xs flex items-center gap-1.5 truncate select-none ${
                    isSelected ? "border-primary bg-primary/10" : "border-green-500/50 bg-green-500/10 hover:border-green-500"
                  }`}
                  style={{ left: l.x - bounds.minX - END_W / 2, top: l.y - bounds.minY - END_H / 2, width: END_W, height: END_H }}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(l.id); }}
                >
                  <Flag className="h-3 w-3 text-green-600 shrink-0" />
                  <span className="truncate">{end.title || (end.type === "default" ? "Default End" : "Custom End")}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="w-72 border border-border rounded-lg bg-card p-3 overflow-y-auto space-y-3 max-h-[500px] sticky top-0">
          {!selectedNode && !selectedEnd && (
            <p className="text-xs text-muted-foreground text-center py-8">Click a node to edit it</p>
          )}

          {/* Node editor */}
          {selectedNode && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium flex items-center gap-1">{nodeTypeIcon(selectedNode.type)} Node</span>
                <div className="flex gap-1">
                  {selectedNode.id !== exercise.startNodeId && (
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5" onClick={() => onChange({ ...exercise, startNodeId: selectedNode.id })}>
                      Set Start
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeNode(selectedNode.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs">Title</Label>
                <Input value={selectedNode.title} onChange={e => updateNode(selectedNode.id, { title: e.target.value })} className="text-xs h-8" />
              </div>

              <div>
                <Label className="text-xs">Type</Label>
                <Select value={selectedNode.type} onValueChange={v => updateNode(selectedNode.id, { type: v as BranchingNode["type"] })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="branchingQuestion">Decision Point</SelectItem>
                    <SelectItem value="exercise">Exercise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type-specific content */}
              {selectedNode.type === "text" && (
                <div>
                  <Label className="text-xs">Content</Label>
                  <RichTextEditor value={selectedNode.content || ""} onChange={content => updateNode(selectedNode.id, { content: normalizeRichTextHtml(content) })} placeholder="Enter text content..." />
                </div>
              )}

              {selectedNode.type === "image" && (
                <div>
                  <Label className="text-xs">Image</Label>
                  <MediaUpload value={selectedNode.imageUrl || ""} onChange={imageUrl => updateNode(selectedNode.id, { imageUrl })} accept="image/*" placeholder="Upload image..." />
                </div>
              )}

              {selectedNode.type === "video" && (
                <div>
                  <Label className="text-xs">Video URL</Label>
                  <Input value={selectedNode.videoUrl || ""} onChange={e => updateNode(selectedNode.id, { videoUrl: e.target.value })} placeholder="YouTube/Vimeo URL..." className="text-xs h-8" />
                </div>
              )}

              {selectedNode.type === "branchingQuestion" && (
                <div>
                  <Label className="text-xs">Question</Label>
                  <RichTextEditor value={selectedNode.question || ""} onChange={question => updateNode(selectedNode.id, { question: normalizeRichTextHtml(question) })} placeholder="Enter decision question..." />
                </div>
              )}

              {selectedNode.type === "exercise" && (
                <div className="space-y-2">
                  <Label className="text-xs">Exercise</Label>
                  {!selectedNode.exerciseBlock && (
                    <>
                      <p className="text-[10px] text-muted-foreground">Pick a type. Scored exercises auto-route On Pass / On Fail. Image Hotspot is exploratory — students continue when ready.</p>
                      <Select onValueChange={v => {
                        let block: ContentBlock;
                        const id = crypto.randomUUID();
                        switch (v) {
                          case "quiz": block = { type: "quiz", id, question: "", options: [{ id: crypto.randomUUID(), text: "", isCorrect: false }, { id: crypto.randomUUID(), text: "", isCorrect: false }], passingPercentage: 50 } as QuizBlock; break;
                          case "trueFalse": block = { type: "trueFalse", id, statement: "", isTrue: true, passingPercentage: 50 } as TrueFalseBlock; break;
                          case "findHotspot": block = { type: "findHotspot", id, title: "", baseImage: "", areas: [], passingPercentage: 50 } as FindHotspotBlock; break;
                          case "imageHotspot": block = { type: "imageHotspot", id, title: "", baseImage: "", hotspots: [] } as ImageHotspotBlock; break;
                          default: return;
                        }
                        updateNode(selectedNode.id, {
                          exerciseBlock: block,
                          choices: makeChoicesForExerciseType(v),
                        });
                      }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select exercise type..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="trueFalse">True / False</SelectItem>
                          <SelectItem value="findHotspot">Find Hotspot</SelectItem>
                          <SelectItem value="imageHotspot">Image Hotspot (exploratory)</SelectItem>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                  {selectedNode.exerciseBlock && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-muted/50 rounded p-2">
                        <span className="text-[10px] font-medium capitalize">{selectedNode.exerciseBlock.type}</span>
                        <Button variant="ghost" size="sm" className="h-5 text-[10px] text-destructive" onClick={() => updateNode(selectedNode.id, { exerciseBlock: undefined, choices: [] })}>
                          Change / Remove
                        </Button>
                      </div>
                      <div className="border border-border rounded-lg p-2 bg-background">
                        {selectedNode.exerciseBlock.type === "quiz" && (
                          <QuizEditor exercise={selectedNode.exerciseBlock as QuizBlock} onChange={b => updateNode(selectedNode.id, { exerciseBlock: b })} />
                        )}
                        {selectedNode.exerciseBlock.type === "trueFalse" && (
                          <TrueFalseEditor exercise={selectedNode.exerciseBlock as TrueFalseBlock} onChange={b => updateNode(selectedNode.id, { exerciseBlock: b })} />
                        )}
                        {selectedNode.exerciseBlock.type === "findHotspot" && (
                          <FindHotspotEditor exercise={selectedNode.exerciseBlock as FindHotspotBlock} onChange={b => updateNode(selectedNode.id, { exerciseBlock: b })} />
                        )}
                        {selectedNode.exerciseBlock.type === "imageHotspot" && (
                          <ImageHotspotEditor exercise={selectedNode.exerciseBlock as ImageHotspotBlock} onChange={b => updateNode(selectedNode.id, { exerciseBlock: b })} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Choices */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{selectedNode.type === "exercise" ? (selectedNode.exerciseBlock && EXPLORATORY_EXERCISE_TYPES.has(selectedNode.exerciseBlock.type) ? "Next step" : "Routing") : "Choices"}</Label>
                  {selectedNode.type !== "exercise" && (
                    <Button variant="ghost" size="sm" className="h-5 text-[10px] gap-0.5" onClick={() => addChoice(selectedNode.id)}>
                      <Plus className="h-2.5 w-2.5" /> Add
                    </Button>
                  )}
                </div>
                {selectedNode.choices.length === 0 && (
                  <p className="text-[10px] text-muted-foreground">No choices — this is a dead end.</p>
                )}
                {selectedNode.choices.map(choice => {
                  const isExerciseChoice = selectedNode.type === "exercise";
                  const isLocked = !!choice.scoreCondition || isExerciseChoice;
                  return (
                  <div key={choice.id} className="space-y-1 border border-border/50 rounded p-2">
                    <div className="flex gap-1 items-center">
                      <Input
                        value={choice.label}
                        onChange={e => updateChoice(selectedNode.id, choice.id, { label: e.target.value })}
                        className="text-xs h-6 flex-1"
                        placeholder="Button label..."
                        disabled={isLocked}
                      />
                      {!isLocked && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => removeChoice(selectedNode.id, choice.id)}>
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <Select
                      value={getChoiceTargetValue(choice)}
                      onValueChange={v => handleChoiceTarget(selectedNode.id, choice.id, v)}
                    >
                      <SelectTrigger className="h-6 text-[10px]"><SelectValue placeholder="→ Target..." /></SelectTrigger>
                      <SelectContent>
                        {targetOptions.filter(o => !o.value.includes(selectedNode.id)).map(o => (
                          <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* End scene editor */}
          {selectedEnd && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium flex items-center gap-1"><Flag className="h-3 w-3 text-green-600" /> End Scene</span>
                {selectedEnd.type !== "default" && (
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeEndScene(selectedEnd.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>

              <div>
                <Label className="text-xs">Type</Label>
                <Select value={selectedEnd.type} onValueChange={v => updateEndScene(selectedEnd.id, { type: v as "default" | "custom" })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Title</Label>
                <Input value={selectedEnd.title || ""} onChange={e => updateEndScene(selectedEnd.id, { title: e.target.value })} className="text-xs h-8" placeholder="End scene title..." />
              </div>

              <div>
                <Label className="text-xs">Text (optional)</Label>
                <RichTextEditor value={selectedEnd.text || ""} onChange={text => updateEndScene(selectedEnd.id, { text: normalizeRichTextHtml(text) })} placeholder="Ending message..." />
              </div>

              <div>
                <Label className="text-xs">Image (optional)</Label>
                <MediaUpload value={selectedEnd.imageUrl || ""} onChange={imageUrl => updateEndScene(selectedEnd.id, { imageUrl })} accept="image/*" placeholder="Upload end scene image..." />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
