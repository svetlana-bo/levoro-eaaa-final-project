import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Send, Archive, ArchiveRestore, Search, Linkedin, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ContactThread {
  id: string;
  category_id: string | null;
  source_page: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  metadata: Record<string, any>;
  is_read: boolean;
  is_archived: boolean;
  last_message_at: string;
  created_at: string;
}

interface ContactMessage {
  id: string;
  thread_id: string;
  direction: "inbound" | "outbound";
  body: string;
  sender_email: string;
  sender_name: string;
  created_at: string;
}

interface ContactCategory {
  id: string;
  slug: string;
  name: string;
  color: string;
}

const SOURCE_LABELS: Record<string, string> = {
  teach: "Teach on Levoro",
  business: "Levoro for Business",
  general: "General",
};

export default function Inbox() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["contact-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_categories" as any).select("*").order("name");
      if (error) throw error;
      return (data as any as ContactCategory[]) || [];
    },
  });

  const { data: threads = [], isLoading: threadsLoading } = useQuery({
    queryKey: ["contact-threads", showArchived],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_threads" as any)
        .select("*")
        .eq("is_archived", showArchived)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data as any as ContactThread[]) || [];
    },
    refetchInterval: 30000,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["contact-messages", selectedId],
    queryFn: async () => {
      if (!selectedId) return [];
      const { data, error } = await supabase
        .from("contact_messages" as any)
        .select("*")
        .eq("thread_id", selectedId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as any as ContactMessage[]) || [];
    },
    enabled: !!selectedId,
  });

  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      if (filterCategory !== "all" && t.category_id !== filterCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.sender_name.toLowerCase().includes(q) && !t.sender_email.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [threads, filterCategory, search]);

  const selectedThread = threads.find((t) => t.id === selectedId) || null;

  // Mark as read on open
  useEffect(() => {
    if (!selectedThread || selectedThread.is_read) return;
    (async () => {
      await supabase.from("contact_threads" as any).update({ is_read: true }).eq("id", selectedThread.id);
      qc.invalidateQueries({ queryKey: ["contact-threads"] });
      qc.invalidateQueries({ queryKey: ["contact-unread-count"] });
    })();
  }, [selectedThread?.id]);

  const handleSendReply = async () => {
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("reply-contact-thread", {
        body: { thread_id: selectedId, body: reply.trim() },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Reply sent");
      setReply("");
      qc.invalidateQueries({ queryKey: ["contact-messages", selectedId] });
      qc.invalidateQueries({ queryKey: ["contact-threads"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const toggleArchive = async (thread: ContactThread) => {
    const { error } = await supabase
      .from("contact_threads" as any)
      .update({ is_archived: !thread.is_archived })
      .eq("id", thread.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(thread.is_archived ? "Restored" : "Archived");
    if (selectedId === thread.id) setSelectedId(null);
    qc.invalidateQueries({ queryKey: ["contact-threads"] });
    qc.invalidateQueries({ queryKey: ["contact-unread-count"] });
  };

  const categoryById = (id: string | null) => categories.find((c) => c.id === id);

  const renderMetadataField = (key: string, value: any) => {
    if (value === null || value === undefined || value === "" || (typeof value === "object" && Object.keys(value).length === 0)) return null;
    let display: React.ReactNode;
    if (key === "linkedin_url" && typeof value === "string") {
      display = (
        <a href={value} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
          <Linkedin className="h-3 w-3" /> LinkedIn <ExternalLink className="h-3 w-3" />
        </a>
      );
    } else if (key === "website" && typeof value === "string") {
      display = (
        <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
          {value} <ExternalLink className="h-3 w-3" />
        </a>
      );
    } else if (typeof value === "object") {
      display = <span className="text-muted-foreground">{JSON.stringify(value)}</span>;
    } else {
      display = <span>{String(value)}</span>;
    }
    return (
      <div key={key} className="flex flex-col gap-0.5">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{key.replace(/_/g, " ")}</span>
        <span className="text-sm">{display}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
        <Button variant="outline" size="sm" onClick={() => setShowArchived((v) => !v)}>
          {showArchived ? <ArchiveRestore className="h-4 w-4 mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
          {showArchived ? "Show active" : "Show archived"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Thread list */}
        <div className="flex flex-col border border-border rounded-lg bg-card overflow-hidden">
          <div className="p-3 space-y-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name, email, subject…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="flex-1">
            {threadsLoading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
                {showArchived ? "No archived messages." : "No messages yet."}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filteredThreads.map((t) => {
                  const cat = categoryById(t.category_id);
                  const isSelected = selectedId === t.id;
                  return (
                    <li
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className={`p-3 cursor-pointer hover:bg-accent/30 transition-colors ${isSelected ? "bg-accent/50" : ""} ${!t.is_read ? "bg-accent/10" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className={`text-sm truncate ${!t.is_read ? "font-bold" : "font-medium"}`}>{t.sender_name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{format(new Date(t.last_message_at), "dd/MM HH:mm")}</span>
                      </div>
                      <div className={`text-xs text-muted-foreground truncate mb-1.5 ${!t.is_read ? "font-semibold text-foreground/80" : ""}`}>
                        {t.subject || "(no subject)"}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {cat && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4" style={{ borderColor: cat.color, color: cat.color }}>
                            {cat.name}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                          {SOURCE_LABELS[t.source_page] || t.source_page}
                        </Badge>
                        {!t.is_read && <span className="h-1.5 w-1.5 rounded-full bg-destructive" aria-label="unread" />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </div>

        {/* Thread detail */}
        <div className="flex flex-col border border-border rounded-lg bg-card overflow-hidden">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-base">
              Select a message to view
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-lg font-bold truncate">{selectedThread.subject || "(no subject)"}</div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{selectedThread.sender_name}</span>{" "}
                      <a href={`mailto:${selectedThread.sender_email}`} className="hover:underline">&lt;{selectedThread.sender_email}&gt;</a>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toggleArchive(selectedThread)}>
                    {selectedThread.is_archived ? <><ArchiveRestore className="h-4 w-4 mr-1.5" /> Restore</> : <><Archive className="h-4 w-4 mr-1.5" /> Archive</>}
                  </Button>
                </div>
                {Object.keys(selectedThread.metadata || {}).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-muted/40 rounded-md">
                    {Object.entries(selectedThread.metadata).map(([k, v]) => renderMetadataField(k, v))}
                  </div>
                )}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="text-center text-sm text-muted-foreground">Loading…</div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m) => (
                      <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-lg px-4 py-3 ${m.direction === "outbound" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          <div className={`text-xs mb-1 ${m.direction === "outbound" ? "opacity-80" : "text-muted-foreground"}`}>
                            {m.sender_name || m.sender_email} · {format(new Date(m.created_at), "dd/MM/yyyy HH:mm")}
                          </div>
                          <div className="text-sm whitespace-pre-wrap break-words">{m.body}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Composer */}
              <div className="border-t border-border p-3 space-y-2">
                <Textarea
                  placeholder="Write a reply…"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Reply will be sent to {selectedThread.sender_email}</span>
                  <Button onClick={handleSendReply} disabled={!reply.trim() || sending} size="sm">
                    {sending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
                    Send reply
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
