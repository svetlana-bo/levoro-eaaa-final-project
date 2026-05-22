import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Download, Award } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CourseCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  studentName: string;
  certificateEnabled?: boolean;
}

export function CourseCompletionDialog({ open, onOpenChange, courseId, courseTitle, studentName, certificateEnabled = false }: CourseCompletionDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setRating(0);
      setHoverRating(0);
      setReviewText("");
      setReviewSubmitted(false);
    }
    onOpenChange(next);
  };

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!rating) throw new Error("Please select a rating");
      const { error } = await supabase.from("course_reviews").insert({
        course_id: courseId,
        student_id: user!.id,
        rating,
        review_text: reviewText,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thank you for your review!");
      queryClient.invalidateQueries({ queryKey: ["course-reviews"] });
      setReviewSubmitted(true);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleDownloadCertificate = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = "#1F3A60";
    ctx.fillRect(0, 0, 1200, 800);
    ctx.fillStyle = "#F8F5F0";
    ctx.fillRect(30, 30, 1140, 740);

    // Border accent
    ctx.strokeStyle = "#C8972B";
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 50, 1100, 700);

    // Title
    ctx.fillStyle = "#1F3A60";
    ctx.font = "bold 48px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Certificate of Completion", 600, 180);

    // Divider
    ctx.strokeStyle = "#C8972B";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(350, 210);
    ctx.lineTo(850, 210);
    ctx.stroke();

    // Subtitle
    ctx.fillStyle = "#555";
    ctx.font = "24px sans-serif";
    ctx.fillText("This certifies that", 600, 290);

    // Student name
    ctx.fillStyle = "#1F3A60";
    ctx.font = "bold 40px 'Space Grotesk', sans-serif";
    ctx.fillText(studentName || "Student", 600, 360);

    // Course completion text
    ctx.fillStyle = "#555";
    ctx.font = "24px sans-serif";
    ctx.fillText("has successfully completed the course", 600, 430);

    // Course title
    ctx.fillStyle = "#C8972B";
    ctx.font = "bold 32px 'Space Grotesk', sans-serif";
    const maxWidth = 900;
    const titleText = courseTitle;
    if (ctx.measureText(titleText).width > maxWidth) {
      ctx.font = "bold 24px 'Space Grotesk', sans-serif";
    }
    ctx.fillText(titleText, 600, 500);

    // Date
    ctx.fillStyle = "#555";
    ctx.font = "20px sans-serif";
    ctx.fillText(`Completed on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 600, 580);

    // Levoro Academy
    ctx.fillStyle = "#1F3A60";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("Levoro Academy", 600, 680);

    // Download
    const link = document.createElement("a");
    link.download = `Certificate-${courseTitle.replace(/[^a-zA-Z0-9]/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Certificate downloaded!");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-secondary/20 flex items-center justify-center">
              <Award className="h-8 w-8 text-secondary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Congratulations! 🎉
          </DialogTitle>
          <DialogDescription className="text-center">
            You've completed <span className="font-semibold text-foreground">{courseTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Leave Review */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Leave a Review</Label>
            <div className="flex items-center gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => !reviewSubmitted && setRating(star)}
                  disabled={reviewSubmitted}
                  className="p-1 transition-transform hover:scale-110 disabled:cursor-default disabled:hover:scale-100"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-secondary text-secondary"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Share your experience with this course..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={3}
              disabled={reviewSubmitted}
            />
            {!reviewSubmitted ? (
              <Button
                key="submit"
                variant="default"
                className="w-full animate-fade-in"
                onClick={() => submitReview.mutate()}
                disabled={!rating || submitReview.isPending}
              >
                {submitReview.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            ) : certificateEnabled ? (
              <Button
                key="cert"
                variant="hero"
                className="w-full gap-2 animate-fade-in"
                onClick={handleDownloadCertificate}
              >
                <Download className="h-4 w-4" /> Get my Certificate
              </Button>
            ) : (
              <Button
                key="close"
                variant="outline"
                className="w-full animate-fade-in"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
