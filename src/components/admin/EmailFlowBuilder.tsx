import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, Mail, Clock, Eye, Zap, GitBranch, MousePointerClick, EyeOff, Send, CheckCircle2, Users, Pencil, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import EmailPreviewDialog from "./EmailPreviewDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// --- Types ---

interface EmailStepCondition {
  id: string;
  type: "opens" | "clicks" | "none";
  target_node_id: string | null;
}

interface EmailStepConfig {
  trigger_type?: string;
  delay_type?: string;
  delay_days?: number;
  specific_date?: string;
  specific_time?: string;
  email_id?: string;
  subject?: string;
  body?: string;
  conditions?: EmailStepCondition[];
}

interface FlowNode {
  id: string;
  flow_id: string;
  type: string;
  position_x: number;
  position_y: number;
  config: EmailStepConfig;
}

// --- Layout ---

const NODE_W = 220;
const NODE_H = 72;
const H_GAP = 50;
const V_GAP = 90;

interface LayoutNode {
  id: string;
  x: number;
  y: number;
}

function layoutTree(nodes: FlowNode[], rootId: string | null): LayoutNode[] {
  if (!rootId || nodes.length === 0) {
    return nodes.map((n, i) => ({
      id: n.id,
      x: i * (NODE_W + H_GAP),
      y: 0,
    }));
  }

  const result: LayoutNode[] = [];
  const visited = new Set<string>();
  const levels: string[][] = [];

  const queue: { id: string; depth: number }[] = [{ id: rootId, depth: 0 }];
  visited.add(rootId);

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (!levels[depth]) levels[depth] = [];
    levels[depth].push(id);

    const node = nodes.find((n) => n.id === id);
    if (node?.config?.conditions) {
      for (const c of node.config.conditions) {
        if (c.target_node_id && !visited.has(c.target_node_id)) {
          visited.add(c.target_node_id);
          queue.push({ id: c.target_node_id, depth: depth + 1 });
        }
      }
    }
  }

  for (const n of nodes) {
    if (!visited.has(n.id)) {
      if (!levels[levels.length]) levels.push([]);
      levels[levels.length - 1].push(n.id);
    }
  }

  for (let d = 0; d < levels.length; d++) {
    const row = levels[d];
    const totalW = row.length * NODE_W + (row.length - 1) * H_GAP;
    const startX = -totalW / 2 + NODE_W / 2;
    for (let i = 0; i < row.length; i++) {
      result.push({ id: row[i], x: startX + i * (NODE_W + H_GAP), y: d * (NODE_H + V_GAP) });
    }
  }

  return result;
}

// --- Constants ---

const rootTriggerTypes = [
  { value: "manual", label: "Manual Send" },
  { value: "specific_date", label: "Specific Date & Time" },
  { value: "user_signup", label: "User Signs Up" },
  { value: "course_completed", label: "Completed a Course" },
  { value: "course_reviewed", label: "Reviewed a Course" },
  { value: "abandoned_cart", label: "Abandoned Cart" },
];

const triggerTypes = [
  { value: "manual", label: "Manual" },
  { value: "user_signup", label: "User Signs Up" },
  { value: "course_completed", label: "Completed a Course" },
  { value: "course_reviewed", label: "Reviewed a Course" },
  { value: "abandoned_cart", label: "Abandoned Cart" },
];

const conditionLabels: Record<string, { label: string; icon: any }> = {
  opens: { label: "OPENS", icon: Eye },
  clicks: { label: "CLICKS", icon: MousePointerClick },
  none: { label: "NONE", icon: EyeOff },
};

// --- Component ---

export default function EmailFlowBuilder() {
  const queryClient = useQueryClient();
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState({ subject: "", heading: "", body: "" });
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [flowGroupFilter, setFlowGroupFilter] = useState("all");

  // --- Queries ---

  const { data: flows = [], isLoading: flowsLoading } = useQuery({
    queryKey: ["email-flows"],
    queryFn: async () => {
      const { data, error } = await supabase.from("email_flows" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: nodes = [] } = useQuery({
    queryKey: ["email-flow-nodes", selectedFlowId],
    enabled: !!selectedFlowId,
    queryFn: async () => {
      const { data, error } = await supabase.from("email_flow_nodes" as any).select("*").eq("flow_id", selectedFlowId!);
      if (error) throw error;
      return data as unknown as FlowNode[];
    },
  });

  const { data: flowRuns = [] } = useQuery({
    queryKey: ["email-flow-runs", selectedFlowId],
    enabled: !!selectedFlowId,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_flow_runs" as any)
        .select("*")
        .eq("flow_id", selectedFlowId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["marketing-emails"],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketing_emails" as any).select("*").order("title");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: emailGroups = [] } = useQuery({
    queryKey: ["email-groups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("email_groups" as any).select("*").order("sort_order");
      if (error) throw error;
      return data as any[];
    },
  });

  const selectedFlow = flows.find((f: any) => f.id === selectedFlowId);
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Local state for name/description to prevent input lag from server roundtrips
  const [flowNameLocal, setFlowNameLocal] = useState("");
  const [flowDescLocal, setFlowDescLocal] = useState("");
  const nameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFlowNameLocal(selectedFlow?.name || "");
    setFlowDescLocal(selectedFlow?.description || "");
  }, [selectedFlowId]);

  const filteredTemplates = useMemo(() => {
    if (flowGroupFilter === "all") return templates;
    if (flowGroupFilter === "ungrouped") return templates.filter((t: any) => !t.group_id);
    return templates.filter((t: any) => t.group_id === flowGroupFilter);
  }, [templates, flowGroupFilter]);

  const rootNodeId = useMemo(() => {
    const withTrigger = nodes.find((n) => n.config?.trigger_type);
    return withTrigger?.id || nodes[0]?.id || null;
  }, [nodes]);

  const isSelectedNodeRoot = selectedNode ? selectedNode.id === rootNodeId : false;

  // --- Mutations ---

  const invalidateNodes = () => queryClient.invalidateQueries({ queryKey: ["email-flow-nodes", selectedFlowId] });

  const createFlow = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("email_flows" as any).insert({ name: "New Flow" } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["email-flows"] });
      setSelectedFlowId(data.id);
      toast.success("Flow created");
    },
  });

  const updateFlow = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase.from("email_flows" as any).update({ ...updates, updated_at: new Date().toISOString() } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-flows"] }),
  });

  const deleteFlow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_flows" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-flows"] });
      setSelectedFlowId(null);
      toast.success("Flow deleted");
    },
  });

  const addNode = useMutation({
    mutationFn: async () => {
      const isFirst = nodes.length === 0;
      const { error } = await supabase.from("email_flow_nodes" as any).insert({
        flow_id: selectedFlowId,
        type: "email_step",
        position_x: 0,
        position_y: 0,
        config: {
          trigger_type: isFirst ? "manual" : undefined,
          delay_type: isFirst ? undefined : "days",
          delay_days: isFirst ? undefined : 0,
          conditions: [],
        },
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateNodes();
      toast.success("Email step added");
    },
  });

  const updateNodeConfig = useMutation({
    mutationFn: async ({ id, config }: { id: string; config: EmailStepConfig }) => {
      const { error } = await supabase.from("email_flow_nodes" as any).update({ config } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateNodes(),
  });

  const deleteNode = useMutation({
    mutationFn: async (id: string) => {
      for (const n of nodes) {
        if (n.id === id) continue;
        const conds = n.config?.conditions;
        if (conds?.some((c) => c.target_node_id === id)) {
          const newConds = conds.map((c) => (c.target_node_id === id ? { ...c, target_node_id: null } : c));
          await supabase.from("email_flow_nodes" as any).update({ config: { ...n.config, conditions: newConds } } as any).eq("id", n.id);
        }
      }
      const { error } = await supabase.from("email_flow_nodes" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateNodes();
      setSelectedNodeId(null);
      toast.success("Step removed");
    },
  });

  // --- Layout ---

  const layout = useMemo(() => layoutTree(nodes, rootNodeId), [nodes, rootNodeId]);

  const bounds = useMemo(() => {
    if (layout.length === 0) return { minX: 0, minY: 0, maxX: 400, maxY: 300 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const l of layout) {
      minX = Math.min(minX, l.x - NODE_W / 2);
      minY = Math.min(minY, l.y - NODE_H / 2);
      maxX = Math.max(maxX, l.x + NODE_W / 2);
      maxY = Math.max(maxY, l.y + NODE_H / 2);
    }
    return { minX: minX - 40, minY: minY - 40, maxX: maxX + 40, maxY: maxY + 40 };
  }, [layout]);

  const svgW = bounds.maxX - bounds.minX;
  const svgH = bounds.maxY - bounds.minY;

  const getPos = useCallback((id: string) => layout.find((l) => l.id === id), [layout]);

  const connections = useMemo(() => {
    const conns: { fromX: number; fromY: number; toX: number; toY: number; label: string }[] = [];
    for (const node of nodes) {
      const from = getPos(node.id);
      if (!from || !node.config?.conditions) continue;
      for (const cond of node.config.conditions) {
        if (!cond.target_node_id) continue;
        const to = getPos(cond.target_node_id);
        if (!to) continue;
        conns.push({
          fromX: from.x - bounds.minX,
          fromY: from.y - bounds.minY + NODE_H / 2,
          toX: to.x - bounds.minX,
          toY: to.y - bounds.minY - NODE_H / 2,
          label: conditionLabels[cond.type]?.label || cond.type,
        });
      }
    }
    return conns;
  }, [nodes, layout, bounds, getPos]);

  // --- Pan handlers ---

  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      e.target === canvasRef.current ||
      (e.target as HTMLElement).tagName === "svg" ||
      (e.target as HTMLElement).tagName === "path" ||
      (e.target as HTMLElement).tagName === "polygon"
    ) {
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
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isPanning]);

  // --- Helpers ---

  const handlePreviewEmail = (emailId: string) => {
    const tpl = templates.find((t: any) => t.id === emailId);
    if (tpl) {
      setPreviewData({ subject: tpl.subject, heading: tpl.title, body: tpl.body });
      setPreviewOpen(true);
    }
  };

  const handleManualSend = async () => {
    if (!selectedFlow || !selectedNode) return;
    const emailId = selectedNode.config?.email_id;
    if (!emailId) {
      toast.error("Please select an email template first.");
      return;
    }
    const tpl = templates.find((t: any) => t.id === emailId);
    if (!tpl) {
      toast.error("Email template not found.");
      return;
    }

    // Gather recipients from flow recipient_data
    const recipientData = selectedFlow.recipient_data as any[];
    let recipientEmails: string[] = [];
    if (selectedFlow.recipient_type === "all") {
      // Fetch all user emails via the edge function
      const { data: emailMap } = await supabase.functions.invoke("get-user-emails");
      if (emailMap && typeof emailMap === "object") {
        recipientEmails = Object.values(emailMap) as string[];
      }
    } else if (selectedFlow.recipient_type === "categories") {
      // Category-based recipients
      const cats: string[] = (recipientData as any)?.categories || [];
      const allEmails = new Set<string>();

      // Fetch role-based users (students, instructors)
      const roleCats = cats.filter(c => c === "student" || c === "instructor" || c === "student_free" || c === "student_paying");
      if (roleCats.length > 0) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: emailData } = await supabase.functions.invoke("get-user-emails", {
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: { roles: roleCats },
          });
          if (emailData?.emailMap) {
            Object.values(emailData.emailMap as Record<string, string>).forEach(e => allEmails.add(e));
          }
        }
      }

      // Fetch newsletter subscribers
      if (cats.includes("newsletter")) {
        const { data: subs } = await supabase.from("newsletter_subscribers" as any).select("email").eq("is_active", true);
        if (subs) (subs as any[]).forEach((s: any) => allEmails.add(s.email));
      }

      recipientEmails = Array.from(allEmails);
    } else if (Array.isArray(recipientData)) {
      recipientEmails = recipientData.filter((e: any) => typeof e === "string" && e.includes("@"));
    }

    if (recipientEmails.length === 0) {
      toast.error("No recipients found. Please configure recipients for this flow.");
      return;
    }

    // Fetch sender settings
    const { data: settingsRow } = await supabase.from("email_settings").select("*").limit(1).single();
    const senderName = (settingsRow as any)?.sender_name || "Levoro Academy";
    const senderEmail = (settingsRow as any)?.sender_email || "onboarding@resend.dev";

    // Normalize template fields — fall back to title if subject is empty
    const finalSubject = tpl.subject?.trim() || tpl.title?.trim();
    const finalBody = tpl.body?.trim();

    if (!finalSubject) {
      toast.error("Email template has no subject. Please edit the template first.");
      return;
    }
    if (!finalBody) {
      toast.error("Email template has no body content. Please edit the template first.");
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-marketing-email", {
        body: {
          recipients: recipientEmails,
          subject: finalSubject,
          htmlBody: finalBody,
          senderName,
          senderEmail,
          flowId: selectedFlow.id,
          flowNodeId: selectedNode.id,
          templateId: emailId,
        },
      });

      if (error) throw error;

      const result = data as any;
      if (result.successCount > 0 && result.failCount > 0) {
        toast.warning(`Sent ${result.successCount} email(s). ${result.failCount} failed: ${result.errors?.[0] || "Unknown error"}`);
      } else if (result.successCount > 0) {
        toast.success(`Sent ${result.successCount} email(s) successfully.`);
      } else {
        toast.error(`Failed to send all ${result.failCount} email(s). ${result.errors?.[0] || "Unknown error"}`);
      }

      // Create flow runs for follow-up evaluation if the root node has conditions
      if (result.successCount > 0 && selectedNode.config?.conditions?.length > 0 && result.messageIds) {
        const messageIds = result.messageIds as Record<string, string | null>;
        // Calculate wait_until based on the child node delay config
        // Find the first child node via conditions to get its delay
        const firstCondition = selectedNode.config.conditions.find((c: EmailStepCondition) => c.target_node_id);
        let delayDays = 1; // default 1 day
        if (firstCondition?.target_node_id) {
          const childNode = nodes.find(n => n.id === firstCondition.target_node_id);
          if (childNode?.config?.delay_days !== undefined) {
            delayDays = childNode.config.delay_days;
          }
        }

        const waitUntil = new Date(Date.now() + (delayDays > 0 ? delayDays * 24 * 60 * 60 * 1000 : 5 * 60 * 1000));

        // Insert flow runs for each recipient
        const flowRuns = Object.entries(messageIds)
          .filter(([, msgId]) => msgId) // only for successful sends
          .map(([email, msgId]) => ({
            flow_id: selectedFlow.id,
            flow_node_id: selectedNode.id,
            recipient_email: email,
            resend_message_id: msgId,
            status: "waiting",
            wait_until: waitUntil.toISOString(),
          }));

        if (flowRuns.length > 0) {
          const { error: runError } = await supabase
            .from("email_flow_runs" as any)
            .insert(flowRuns as any);
          if (runError) {
            console.error("Failed to create flow runs:", runError);
            toast.warning("Emails sent but flow tracking failed. Follow-up emails may not trigger automatically.");
          } else {
            toast.success(`Flow runs created for ${flowRuns.length} recipient(s). Follow-up emails will be evaluated automatically.`);
          }
        }
      }
    } catch (e: any) {
      toast.error(`Send failed: ${e.message}`);
    } finally {
      setIsSending(false);
      setSendConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ["email-flow-runs", selectedFlowId] });
    }
  };

  const updateCondition = (nodeId: string, conditionId: string, patch: Partial<EmailStepCondition>) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const conditions = (node.config.conditions || []).map((c) => (c.id === conditionId ? { ...c, ...patch } : c));
    updateNodeConfig.mutate({ id: nodeId, config: { ...node.config, conditions } });
  };

  const addCondition = (nodeId: string, type: "opens" | "clicks" | "none") => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const existing = node.config.conditions || [];
    if (existing.some((c) => c.type === type)) return;
    const newCond: EmailStepCondition = { id: crypto.randomUUID(), type, target_node_id: null };
    updateNodeConfig.mutate({ id: nodeId, config: { ...node.config, conditions: [...existing, newCond] } });
  };

  const removeCondition = (nodeId: string, conditionId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    updateNodeConfig.mutate({
      id: nodeId,
      config: { ...node.config, conditions: (node.config.conditions || []).filter((c) => c.id !== conditionId) },
    });
  };

  const getNodeLabel = (node: FlowNode) => {
    if (node.config?.email_id) {
      const tpl = templates.find((t: any) => t.id === node.config.email_id);
      return tpl?.title || "Email";
    }
    if (node.config?.subject) return node.config.subject;
    return "New Email Step";
  };

  const targetOptions = useMemo(
    () => nodes.filter((n) => n.id !== selectedNodeId).map((n) => ({ value: n.id, label: getNodeLabel(n) })),
    [nodes, selectedNodeId, templates]
  );

  // Get status description for the flow
  const getFlowStatusText = () => {
    if (!selectedFlow) return "";
    if (!selectedFlow.is_active) return "Flow is inactive — emails will not be sent.";
    const rootNode = nodes.find((n) => n.id === rootNodeId);
    if (!rootNode) return "Flow is active but has no steps.";
    const trigger = rootNode.config?.trigger_type;
    if (trigger === "manual") return "Flow is active — waiting for manual send.";
    if (trigger === "specific_date") {
      const date = rootNode.config?.specific_date || "not set";
      const time = rootNode.config?.specific_time || "00:00";
      return `Flow is active — scheduled for ${date} at ${time}.`;
    }
    const label = rootTriggerTypes.find((t) => t.value === trigger)?.label;
    if (label) return `Flow is active — triggers on: ${label}.`;
    return "Flow is active.";
  };

  // --- Render ---

  if (flowsLoading) return <div className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>;

  return (
    <div className="space-y-4">
      {/* Flow selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedFlowId || ""} onValueChange={setSelectedFlowId}>
          <SelectTrigger className="w-[280px]"><SelectValue placeholder="Select a flow..." /></SelectTrigger>
          <SelectContent>
            {flows.map((f: any) => (
              <SelectItem key={f.id} value={f.id}>{f.name} {f.is_active ? "✓" : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => createFlow.mutate()}>
          <Plus className="h-4 w-4" /> New Flow
        </Button>
      </div>

      {selectedFlow && (
        <div className="space-y-4">
          {/* Flow settings */}
          <Card>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-xs">Flow Name</Label>
                  <Input value={flowNameLocal} onChange={(e) => {
                    const v = e.target.value;
                    setFlowNameLocal(v);
                    if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
                    nameDebounceRef.current = setTimeout(() => {
                      updateFlow.mutate({ id: selectedFlow.id, updates: { name: v } });
                    }, 500);
                  }} />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-xs">Description</Label>
                  <Input value={flowDescLocal} onChange={(e) => {
                    const v = e.target.value;
                    setFlowDescLocal(v);
                    if (descDebounceRef.current) clearTimeout(descDebounceRef.current);
                    descDebounceRef.current = setTimeout(() => {
                      updateFlow.mutate({ id: selectedFlow.id, updates: { description: v } });
                    }, 500);
                  }} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={selectedFlow.is_active} onCheckedChange={(checked) => updateFlow.mutate({ id: selectedFlow.id, updates: { is_active: checked } })} />
                  <span className={`text-xs font-semibold ${selectedFlow.is_active ? "text-green-600" : "text-muted-foreground"}`}>
                    {selectedFlow.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <Button variant="destructive" size="sm" onClick={() => deleteFlow.mutate(selectedFlow.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {/* Status indicator */}
              <div className={`text-xs px-3 py-2 rounded-md flex items-center gap-2 ${selectedFlow.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-muted text-muted-foreground border border-border"}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {getFlowStatusText()}
              </div>

      {/* Flow Runs Status */}
              {flowRuns.length > 0 && (
                <div className="border border-border rounded-md p-3 space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" /> Flow Activity
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(() => {
                      const waiting = flowRuns.filter((r: any) => r.status === "waiting");
                      const completed = flowRuns.filter((r: any) => r.status === "completed");
                      const failed = flowRuns.filter((r: any) => r.status === "failed");
                      const sent = flowRuns.filter((r: any) => r.status === "sent");
                      return (
                        <>
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <div className="text-lg font-bold text-foreground">{completed.length + sent.length}</div>
                            <div className="text-[10px] text-muted-foreground">Sent</div>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <div className="text-lg font-bold text-amber-600">{waiting.length}</div>
                            <div className="text-[10px] text-muted-foreground">Evaluating</div>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <div className="text-lg font-bold text-destructive">{failed.length}</div>
                            <div className="text-[10px] text-muted-foreground">Failed</div>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <div className="text-lg font-bold text-foreground">{flowRuns.length}</div>
                            <div className="text-[10px] text-muted-foreground">Total Runs</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Pending follow-up evaluation detail */}
                  {(() => {
                    const waiting = flowRuns.filter((r: any) => r.status === "waiting");
                    if (waiting.length === 0) return null;
                    return (
                      <div className="space-y-1">
                        <div className="text-[10px] font-medium text-muted-foreground">Pending follow-up evaluation:</div>
                        {waiting.slice(0, 5).map((r: any) => {
                          const node = nodes.find(n => n.id === r.flow_node_id);
                          const conditions = node?.config?.conditions || [];
                          // Show branch targets (the NEXT possible emails), not the current node
                          const branchInfo = conditions.map((c: any) => {
                            const targetNode = c.target_node_id ? nodes.find(n => n.id === c.target_node_id) : null;
                            const targetTpl = targetNode?.config?.email_id
                              ? templates.find((t: any) => t.id === targetNode.config.email_id)?.title
                              : null;
                            const label = c.type === "opens" ? "📬" : c.type === "clicks" ? "🔗" : "⏳";
                            return `${label}${targetTpl || "?"}`;
                          }).join(" / ");
                          const nextEval = (() => {
                            if (!r.wait_until) return "—";
                            const waitUntil = new Date(r.wait_until);
                            const reference = waitUntil > new Date() ? waitUntil : new Date();
                            const fiveMin = 5 * 60 * 1000;
                            return new Date(Math.ceil(reference.getTime() / fiveMin) * fiveMin).toLocaleString();
                          })();
                          return (
                            <div key={r.id} className="text-[10px] bg-muted/30 rounded px-2 py-1 space-y-0.5">
                              <div className="flex justify-between">
                                <span className="truncate font-medium">{r.recipient_email}</span>
                                <span className="text-muted-foreground shrink-0 ml-2">next eval: {nextEval}</span>
                              </div>
                              {branchInfo && (
                                <div className="text-muted-foreground truncate">Next: {branchInfo}</div>
                              )}
                            </div>
                          );
                        })}
                        {waiting.length > 5 && (
                          <div className="text-[10px] text-muted-foreground">...and {waiting.length - 5} more</div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardContent className="py-4 space-y-3">
              <Label className="text-sm font-semibold">Recipients</Label>
              <Select
                value={selectedFlow.recipient_type || "all"}
                onValueChange={(v) => {
                  const newData = v === "categories" ? { categories: [] } : v === "all" ? [] : selectedFlow.recipient_data || [];
                  updateFlow.mutate({ id: selectedFlow.id, updates: { recipient_type: v, recipient_data: newData } });
                }}
              >
                <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="categories">By Category</SelectItem>
                  <SelectItem value="selected">Select Individually</SelectItem>
                  <SelectItem value="uploaded">Upload CSV</SelectItem>
                </SelectContent>
              </Select>

              {selectedFlow.recipient_type === "categories" && (() => {
                const catData = (selectedFlow.recipient_data && typeof selectedFlow.recipient_data === "object" && !Array.isArray(selectedFlow.recipient_data))
                  ? (selectedFlow.recipient_data as any)
                  : { categories: [] };
                const selectedCats: string[] = catData.categories || [];
                const toggleCat = (cat: string) => {
                  const next = selectedCats.includes(cat) ? selectedCats.filter(c => c !== cat) : [...selectedCats, cat];
                  updateFlow.mutate({ id: selectedFlow.id, updates: { recipient_data: { categories: next } } });
                };
                return (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Select one or more recipient categories:</p>
                    {[
                      { value: "student", label: "Students (all)" },
                      { value: "student_free", label: "Free Students" },
                      { value: "student_paying", label: "Paying Students" },
                      { value: "instructor", label: "Instructors" },
                      { value: "newsletter", label: "Newsletter Subscribers" },
                    ].map(cat => (
                      <label key={cat.value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
                        <input
                          type="checkbox"
                          checked={selectedCats.includes(cat.value)}
                          onChange={() => toggleCat(cat.value)}
                          className="rounded"
                        />
                        {cat.label}
                      </label>
                    ))}
                    {selectedCats.length > 0 && (
                      <p className="text-xs text-muted-foreground">{selectedCats.length} categor{selectedCats.length === 1 ? "y" : "ies"} selected</p>
                    )}
                  </div>
                );
              })()}

              {selectedFlow.recipient_type === "selected" && (
                <RecipientSelector
                  selectedEmails={Array.isArray(selectedFlow.recipient_data) ? (selectedFlow.recipient_data as any[]).filter((e: any) => typeof e === "string") : []}
                  onChange={(emails) => updateFlow.mutate({ id: selectedFlow.id, updates: { recipient_data: emails } })}
                />
              )}

              {selectedFlow.recipient_type === "uploaded" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Upload a CSV with one email per line or a single "email" column.</p>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const text = await file.text();
                      const emails = text.split(/[\n,]/).map((s) => s.trim().replace(/^["']|["']$/g, "")).filter((s) => s.includes("@"));
                      updateFlow.mutate({ id: selectedFlow.id, updates: { recipient_data: emails } });
                      toast.success(`${emails.length} emails loaded`);
                    }}
                  />
                  {Array.isArray(selectedFlow.recipient_data) && (selectedFlow.recipient_data as string[]).length > 0 && (
                    <p className="text-xs text-muted-foreground">{(selectedFlow.recipient_data as string[]).length} recipients loaded</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Toolbar */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => addNode.mutate()}>
              <Plus className="h-4 w-4" /> Add Email Step
            </Button>
          </div>

          {/* Canvas + Detail split */}
          <div className="flex gap-3 min-h-[420px]">
            {/* Visual Canvas */}
            <div
              ref={canvasRef}
              className="flex-1 border border-border rounded-lg bg-muted/30 overflow-hidden relative"
              onMouseDown={handleMouseDown}
              style={{ cursor: isPanning ? "grabbing" : "grab" }}
            >
              <div
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                  position: "relative",
                  width: svgW,
                  height: svgH,
                  margin: "20px auto",
                }}
              >
                {/* SVG connections */}
                <svg width={svgW} height={svgH} className="absolute inset-0 pointer-events-none" style={{ overflow: "visible" }}>
                  {connections.map((c, i) => {
                    const midY = (c.fromY + c.toY) / 2;
                    const labelX = (c.fromX + c.toX) / 2;
                    const labelY = midY - 6;
                    return (
                      <g key={i}>
                        <path
                          d={`M ${c.fromX} ${c.fromY} C ${c.fromX} ${midY}, ${c.toX} ${midY}, ${c.toX} ${c.toY}`}
                          fill="none"
                          stroke="hsl(var(--border))"
                          strokeWidth={2}
                        />
                        <polygon
                          points={`${c.toX - 4},${c.toY - 8} ${c.toX + 4},${c.toY - 8} ${c.toX},${c.toY}`}
                          fill="hsl(var(--border))"
                        />
                        {c.label && (
                          <text x={labelX} y={labelY} textAnchor="middle" className="fill-muted-foreground text-[10px] font-semibold">
                            {c.label}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Node cards */}
                {layout.map((l) => {
                  const node = nodes.find((n) => n.id === l.id);
                  if (!node) return null;
                  const isSelected = selectedNodeId === l.id;
                  const isRoot = l.id === rootNodeId;
                  const label = getNodeLabel(node);
                  const triggerLabel = isRoot
                    ? rootTriggerTypes.find((t) => t.value === node.config?.trigger_type)?.label
                    : undefined;
                  const delayLabel = !isRoot && node.config?.delay_days ? `${node.config.delay_days}d delay` : null;
                  const condCount = (node.config?.conditions || []).length;

                  return (
                    <div
                      key={l.id}
                      className={`absolute rounded-lg border-2 px-3 py-2 cursor-pointer transition-colors select-none ${
                        isSelected ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"
                      } ${isRoot ? "ring-2 ring-primary/30" : ""}`}
                      style={{ left: l.x - bounds.minX - NODE_W / 2, top: l.y - bounds.minY - NODE_H / 2, width: NODE_W, height: NODE_H }}
                      onClick={(e) => { e.stopPropagation(); setSelectedNodeId(l.id); }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="text-xs font-semibold truncate flex-1">{label}</span>
                        {isRoot && <span className="text-[9px] bg-primary/20 text-primary px-1 rounded shrink-0">START</span>}
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {triggerLabel && (
                          <span className="text-[9px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Zap className="h-2.5 w-2.5" /> {triggerLabel}
                          </span>
                        )}
                        {delayLabel && (
                          <span className="text-[9px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" /> {delayLabel}
                          </span>
                        )}
                        {condCount > 0 && (
                          <span className="text-[9px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <GitBranch className="h-2.5 w-2.5" /> {condCount}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detail Panel */}
            <div className="w-80 border border-border rounded-lg bg-card p-4 overflow-y-auto space-y-4">
              {!selectedNode && (
                <p className="text-xs text-muted-foreground text-center py-8">Click an email step to edit it</p>
              )}

              {selectedNode && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-primary" />
                      {isSelectedNodeRoot ? "First Step (Start)" : "Follow-up Step"}
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => deleteNode.mutate(selectedNode.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>

                  {/* ROOT NODE: Trigger selection */}
                  {isSelectedNodeRoot && (
                    <div className="space-y-2">
                      <Label className="text-xs">Trigger</Label>
                      <Select
                        value={selectedNode.config?.trigger_type || "manual"}
                        onValueChange={(v) =>
                          updateNodeConfig.mutate({
                            id: selectedNode.id,
                            config: {
                              ...selectedNode.config,
                              trigger_type: v,
                              // Clear delay config for root, set date fields for specific_date
                              delay_type: undefined,
                              delay_days: undefined,
                              specific_date: v === "specific_date" ? selectedNode.config?.specific_date : undefined,
                              specific_time: v === "specific_date" ? selectedNode.config?.specific_time || "09:00" : undefined,
                            },
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {rootTriggerTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Specific date & time for root */}
                      {selectedNode.config?.trigger_type === "specific_date" && (
                        <div className="space-y-2">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Date</Label>
                            <Input
                              type="date"
                              className="h-8 text-xs"
                              value={selectedNode.config?.specific_date || ""}
                              onChange={(e) =>
                                updateNodeConfig.mutate({
                                  id: selectedNode.id,
                                  config: { ...selectedNode.config, specific_date: e.target.value },
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Time</Label>
                            <Input
                              type="time"
                              className="h-8 text-xs"
                              value={selectedNode.config?.specific_time || "09:00"}
                              onChange={(e) =>
                                updateNodeConfig.mutate({
                                  id: selectedNode.id,
                                  config: { ...selectedNode.config, specific_time: e.target.value },
                                })
                              }
                            />
                          </div>
                        </div>
                      )}

                      {/* Manual send button */}
                      {selectedNode.config?.trigger_type === "manual" && selectedFlow?.is_active && (
                        <Button
                          size="sm"
                          className="w-full gap-2 mt-1"
                          variant="hero"
                          disabled={isSending || !selectedNode.config?.email_id}
                          onClick={() => setSendConfirmOpen(true)}
                        >
                          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          {isSending ? "Sending..." : "Send Now"}
                        </Button>
                      )}
                      {selectedNode.config?.trigger_type === "manual" && !selectedFlow?.is_active && (
                        <p className="text-[10px] text-muted-foreground bg-muted rounded px-2 py-1.5">
                          Activate the flow above, then use "Send Now" to dispatch this email manually.
                        </p>
                      )}
                    </div>
                  )}

                  {/* CHILD NODE: Delay config only */}
                  {!isSelectedNodeRoot && (
                    <div className="space-y-2">
                      <Label className="text-xs">Scheduling</Label>
                      <Select
                        value={selectedNode.config?.delay_type || "days"}
                        onValueChange={(v) =>
                          updateNodeConfig.mutate({
                            id: selectedNode.id,
                            config: { ...selectedNode.config, delay_type: v, trigger_type: undefined },
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days after previous step</SelectItem>
                          <SelectItem value="date">Specific date & time</SelectItem>
                        </SelectContent>
                      </Select>

                      {(selectedNode.config?.delay_type || "days") === "days" && (
                        <>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Days after previous</Label>
                            <Input
                              type="number"
                              min={0}
                              className="h-8 text-xs"
                              value={selectedNode.config?.delay_days ?? 0}
                              onChange={(e) =>
                                updateNodeConfig.mutate({
                                  id: selectedNode.id,
                                  config: { ...selectedNode.config, delay_days: parseInt(e.target.value) || 0 },
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Send at time of day</Label>
                            <Input
                              type="time"
                              className="h-8 text-xs"
                              value={selectedNode.config?.specific_time || "09:00"}
                              onChange={(e) =>
                                updateNodeConfig.mutate({
                                  id: selectedNode.id,
                                  config: { ...selectedNode.config, specific_time: e.target.value },
                                })
                              }
                            />
                          </div>
                        </>
                      )}

                      {selectedNode.config?.delay_type === "date" && (
                        <div className="space-y-2">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Date</Label>
                            <Input
                              type="date"
                              className="h-8 text-xs"
                              value={selectedNode.config?.specific_date || ""}
                              onChange={(e) =>
                                updateNodeConfig.mutate({
                                  id: selectedNode.id,
                                  config: { ...selectedNode.config, specific_date: e.target.value },
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Time</Label>
                            <Input
                              type="time"
                              className="h-8 text-xs"
                              value={selectedNode.config?.specific_time || "09:00"}
                              onChange={(e) =>
                                updateNodeConfig.mutate({
                                  id: selectedNode.id,
                                  config: { ...selectedNode.config, specific_time: e.target.value },
                                })
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Email Template */}
                  <div className="space-y-2">
                    <Label className="text-xs">Filter by Group</Label>
                    <Select
                      value={flowGroupFilter}
                      onValueChange={setFlowGroupFilter}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All groups" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All groups</SelectItem>
                        {emailGroups.map((g: any) => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                        <SelectItem value="ungrouped">Ungrouped</SelectItem>
                      </SelectContent>
                    </Select>

                    <Label className="text-xs">Email Template</Label>
                    <Select
                      value={selectedNode.config?.email_id || ""}
                      onValueChange={(v) =>
                        updateNodeConfig.mutate({ id: selectedNode.id, config: { ...selectedNode.config, email_id: v || undefined } })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select template..." /></SelectTrigger>
                      <SelectContent>
                        {filteredTemplates.map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                        ))}
                        {filteredTemplates.length === 0 && (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">No templates in this group</div>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedNode.config?.email_id && (
                      <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => handlePreviewEmail(selectedNode.config.email_id!)}>
                        <Eye className="h-3 w-3" /> Preview
                      </Button>
                    )}
                  </div>

                  {/* Conditions / Branches */}
                  <div className="space-y-2">
                    <Label className="text-xs">Conditions (Branches)</Label>
                    <div className="text-[10px] text-muted-foreground">Add conditions to branch to different follow-up emails based on user action.</div>

                    {(selectedNode.config?.conditions || []).map((cond) => {
                      const cfg = conditionLabels[cond.type];
                      const Icon = cfg?.icon || GitBranch;
                      return (
                        <div key={cond.id} className="border border-border rounded-md p-2 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium flex items-center gap-1">
                              <Icon className="h-3 w-3" /> {cfg?.label || cond.type}
                            </span>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => removeCondition(selectedNode.id, cond.id)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                          <Select
                            value={cond.target_node_id || ""}
                            onValueChange={(v) => updateCondition(selectedNode.id, cond.id, { target_node_id: v || null })}
                          >
                            <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="→ Select target step..." /></SelectTrigger>
                            <SelectContent>
                              {targetOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}

                    {/* Add condition buttons */}
                    <div className="flex gap-1 flex-wrap">
                      {(["opens", "clicks", "none"] as const).map((type) => {
                        const already = (selectedNode.config?.conditions || []).some((c) => c.type === type);
                        if (already) return null;
                        const cfg = conditionLabels[type];
                        const Icon = cfg.icon;
                        return (
                          <Button key={type} variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => addCondition(selectedNode.id, type)}>
                            <Icon className="h-3 w-3" /> {cfg.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={sendConfirmOpen} onOpenChange={setSendConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Email Send
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will send the selected email template to all configured recipients in this flow. This action cannot be undone. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleManualSend} disabled={isSending}>
              {isSending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...</> : "Send Now"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EmailPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} {...previewData} />
    </div>
  );
}

// --- Recipient Selector (Collapsible) ---

function RecipientSelector({ selectedEmails, onChange }: { selectedEmails: string[]; onChange: (emails: string[]) => void }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles-for-recipients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, first_name, last_name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: emailMap = {} } = useQuery({
    queryKey: ["user-emails-for-recipients"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return {};
      const { data, error } = await supabase.functions.invoke("get-user-emails", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) return {};
      return (data as any)?.emailMap || {};
    },
  });

  const userOptions = profiles.map((p: any) => ({
    id: p.id,
    name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown",
    email: (emailMap as Record<string, string>)[p.id] || "",
  })).filter((u) => u.email);

  const filtered = search
    ? userOptions.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    : userOptions;

  const toggle = (email: string) => {
    onChange(selectedEmails.includes(email) ? selectedEmails.filter((e) => e !== email) : [...selectedEmails, email]);
  };

  if (!isOpen) {
    return (
      <div className="flex items-center gap-2 py-1">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {selectedEmails.length} recipient{selectedEmails.length !== 1 ? "s" : ""} selected
        </span>
        <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2 ml-auto" onClick={() => setIsOpen(true)}>
          <Pencil className="h-3 w-3" /> Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="h-8 text-sm" />
      <div className="max-h-[200px] overflow-y-auto border border-border rounded p-2 space-y-1">
        {filtered.slice(0, 50).map((u) => (
          <label key={u.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
            <input type="checkbox" checked={selectedEmails.includes(u.email)} onChange={() => toggle(u.email)} className="rounded" />
            <span>{u.name}</span>
            <span className="text-muted-foreground">{u.email}</span>
          </label>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground">No users found</p>}
      </div>
      <div className="flex items-center justify-between">
        {selectedEmails.length > 0 && <p className="text-xs text-muted-foreground">{selectedEmails.length} selected</p>}
        <Button variant="secondary" size="sm" className="h-7 text-xs gap-1 ml-auto" onClick={() => setIsOpen(false)}>
          Done
        </Button>
      </div>
    </div>
  );
}
