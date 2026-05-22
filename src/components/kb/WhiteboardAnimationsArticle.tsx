import { useEffect, useState } from "react";
import { AdminEditableImage } from "@/components/AdminEditableImage";
import { AdminEditableVideo } from "@/components/AdminEditableVideo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileText, Palette, Layers, BarChart3, PenLine, Mic, Subtitles } from "lucide-react";

function useSiteValue(key: string) {
  const [value, setValue] = useState<string>("");
  useEffect(() => {
    supabase
      .from("site_images" as any)
      .select("value")
      .eq("image_key", key)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.value) setValue(data.value);
      });
  }, [key]);
  return value;
}

export default function WhiteboardAnimationsArticle() {
  const samplePdf = useSiteValue("kb-whiteboard-sample-pdf");
  const templateDocx = useSiteValue("kb-whiteboard-template-docx");

  const visualCards = [
    {
      icon: Palette,
      tone: "bg-secondary/30",
      lead: "The visuals in your video will be colorful whiteboard-style drawings",
      body: "that follow your narration. We can include light movements such as zooming, panning, or simple frame-by-frame motion, as well as smooth transitions like fades or a 'wiping the whiteboard' effect. Complex animations, such as a character performing detailed actions, are not possible.",
    },
    {
      icon: Layers,
      tone: "bg-accent/15",
      lead: "To keep the screen clear, we usually show no more than three separate objects at once",
      body: "unless the elements connect naturally. If a scene feels too crowded, we'll divide it into multiple frames. Logos can be included if you provide the files; other images must comply with copyright laws. You can also share visual references or metaphors, which we'll try to imitate where possible.",
    },
    {
      icon: BarChart3,
      tone: "bg-primary/5",
      lead: "Complex charts and graphs are not supported",
      body: "as they tend to overload the screen and don't fit our learning approach. Instead, simplify data into clear visuals or symbolic representations. The aim is for visuals to support your narration without distracting from it.",
    },
  ];

  const narrationCards = [
    {
      icon: Mic,
      tone: "bg-secondary/30",
      lead: "We do not want the video to go above 4 minutes",
      body: "Your narration should stay short and focused, with one clear idea per video. The ideal length is between 270 and 540 words, depending on whether your video is closer to two or four minutes. We follow a 'narration-first' approach: once your script is written, the design team creates visuals that follow your words naturally.",
    },
    {
      icon: Subtitles,
      tone: "bg-accent/15",
      lead: "Subtitles are generated automatically from the narration",
      body: "so you don't need to provide them separately. For consistency, all videos use the same AI voiceover style, which can't be customized. Add long pauses with '…' or paragraph breaks, and use CAPITAL letters to mark emphasis.",
    },
  ];

  return (
    <div className="space-y-12 max-w-4xl mx-auto">

      {/* Hero */}
      <section className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Video */}
          <div>
            <AdminEditableVideo videoKey="kb-whiteboard-video" title="Whiteboard animation example" />
          </div>

          {/* Download files panel */}
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Download files</h3>
              <p className="text-sm text-muted-foreground">
                Use the sample as a reference and the template to draft your own script.
              </p>
            </div>
            <div className="space-y-3">
              {samplePdf && (
                <Button asChild variant="outline" className="w-full justify-start gap-2" size="lg">
                  <a href={samplePdf} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    Sample of Script
                  </a>
                </Button>
              )}
              {templateDocx && (
                <Button asChild variant="outline" className="w-full justify-start gap-2" size="lg">
                  <a href={templateDocx} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4" />
                    Video Script Template
                  </a>
                </Button>
              )}
              {!samplePdf && !templateDocx && (
                <p className="text-sm text-muted-foreground italic">
                  Download files will appear here once added by an admin.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Visuals Explained */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Visuals explained</h2>
        <div className="space-y-4">
          {visualCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className={`rounded-2xl border p-6 md:p-7 flex items-center gap-5 w-full ${card.tone}`}
              >
                <div className="h-12 w-12 rounded-xl bg-background/70 flex items-center justify-center shrink-0">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-foreground/90 leading-relaxed">
                  <span className="font-semibold">{card.lead}</span> {card.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Script Writing Guidelines */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Script writing guidelines</h2>
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          <div className="rounded-xl overflow-hidden min-h-[240px] h-full bg-muted">
            <AdminEditableImage
              imageKey="kb-whiteboard-s2"
              alt="Writing a whiteboard animation script"
              className="w-full h-full object-cover"
              containerClassName="w-full h-full"
              fallback={
                <div className="w-full h-full bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
                  <PenLine className="h-16 w-16 text-primary/40" />
                </div>
              }
            />
          </div>
          <div className="space-y-4">
            <p className="text-foreground/90 leading-relaxed">
              <span className="font-semibold">Focus on narration, not scene direction.</span> When
              writing your script, focus on the narration itself; the design team will match
              visuals to your words. You don't need to describe every scene — just provide the
              idea, and we'll create visuals that align with the tempo and flow. If you have
              something specific in mind, describe it clearly and we'll do our best to include it.
            </p>
            <p className="text-foreground/90 leading-relaxed">
              <span className="font-semibold">Examples, short stories, and metaphors are welcome</span>{" "}
              — especially when they can be represented with simple, static images. Visual
              metaphors often work very well in this format — a compass representing direction or
              inner values, for example. Whiteboard videos don't typically use complex animations,
              so concepts that work as still illustrations are most effective.
            </p>
            <p className="text-foreground/90 leading-relaxed">
              <span className="font-semibold">Keep narration and on-screen text aligned.</span> The
              text in your narration should match what is being said on screen. Avoid including
              written text that doesn't fit with the narration — it can confuse learners.
            </p>
          </div>
        </div>
      </section>

      {/* Narration Guidelines */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Narration guidelines</h2>
        <div className="space-y-4">
          {narrationCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className={`rounded-2xl border p-6 md:p-7 flex items-center gap-5 w-full ${card.tone}`}
              >
                <div className="h-12 w-12 rounded-xl bg-background/70 flex items-center justify-center shrink-0">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-foreground/90 leading-relaxed">
                  <span className="font-semibold">{card.lead}</span> — {card.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
