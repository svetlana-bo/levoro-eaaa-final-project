import { stripHtml } from "@/lib/sanitize";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, PlayCircle, Award, CheckCircle, RotateCcw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { CourseCompletionDialog } from "@/components/CourseCompletionDialog";
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
import { toast } from "sonner";

const MyCourses = () => {
  console.log("[MyCourses] Component rendered");
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [completionCourse, setCompletionCourse] = useState<{ id: string; title: string } | null>(null);
  const [resetCourse, setResetCourse] = useState<{ enrollmentId: string; courseId: string } | null>(null);

  const resetProgress = useMutation({
    mutationFn: async ({ courseId }: { enrollmentId: string; courseId: string }) => {
      const { data: lessons, error: lessonsError } = await supabase
        .from("lessons")
        .select("id")
        .eq("course_id", courseId);
      if (lessonsError) throw lessonsError;
      const lessonIds = (lessons || []).map((l) => l.id);
      if (lessonIds.length > 0) {
        const { error: delError } = await supabase
          .from("lesson_progress")
          .delete()
          .eq("student_id", user!.id)
          .in("lesson_id", lessonIds);
        if (delError) throw delError;
      }
    },
    onSuccess: () => {
      toast.success("Course progress reset");
      queryClient.invalidateQueries({ queryKey: ["enrolled-courses"] });
      queryClient.invalidateQueries({ queryKey: ["lesson-progress"] });
      setResetCourse(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to reset progress");
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["user-profile-name", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("first_name, last_name").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: enrolledCourses = [], isLoading, error: enrollError } = useQuery({
    queryKey: ["enrolled-courses", user?.id],
    queryFn: async () => {
      console.log("[MyCourses] Fetching enrollments for user:", user?.id);
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("*, courses(*)")
        .eq("student_id", user!.id)
        .order("enrolled_at", { ascending: false });
      
      if (enrollError) {
        console.error("[MyCourses] Enrollment fetch error:", enrollError);
        throw enrollError;
      }

      console.log("[MyCourses] Enrollments fetched:", enrollments?.length);

      // Filter out enrollments where the course is null (RLS hides draft/pending courses from students)
      const accessibleEnrollments = (enrollments || []).filter((e: any) => e.courses != null);

      const coursesWithProgress = await Promise.all(
        accessibleEnrollments.map(async (enrollment: any) => {
          const { data: lessons } = await supabase
            .from("lessons")
            .select("id")
            .eq("course_id", enrollment.course_id);

          const { data: progress } = await supabase
            .from("lesson_progress")
            .select("lesson_id, is_completed")
            .eq("student_id", user!.id)
            .in("lesson_id", lessons?.map(l => l.id) || []);

          const totalLessons = lessons?.length || 0;
          const completedLessons = progress?.filter(p => p.is_completed).length || 0;
          const progressPercentage = totalLessons > 0 
            ? Math.round((completedLessons / totalLessons) * 100) 
            : 0;

          return {
            ...enrollment,
            totalLessons,
            completedLessons,
            progressPercentage,
          };
        })
      );

      return coursesWithProgress;
    },
    enabled: !!user,
  });

  console.log("[MyCourses] State:", { isLoading, enrolledCoursesCount: enrolledCourses.length, error: enrollError });

  const studentName = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "Student";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground mt-1">
            Track your learning progress and continue where you left off
          </p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading your courses...</p>
        ) : enrolledCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              You haven't enrolled in any courses yet
            </p>
            <Button onClick={() => navigate("/catalog")}>
              Browse Course Catalog
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((enrollment: any) => {
              const isCompleted = enrollment.progressPercentage === 100 || !!enrollment.completed_at;
              return (
                <Card key={enrollment.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{enrollment.courses?.title ?? "Course unavailable"}</CardTitle>
                      {isCompleted && (
                        <Badge className="bg-secondary/20 text-secondary border-secondary/30 shrink-0">
                          <CheckCircle className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {enrollment.courses?.description ? stripHtml(enrollment.courses.description).substring(0, 200) || "No description" : "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{enrollment.progressPercentage}%</span>
                      </div>
                      <Progress value={enrollment.progressPercentage} className={`bg-muted ${isCompleted ? "[&>div]:bg-secondary" : ""}`} />
                      <p className="text-xs text-muted-foreground">
                        {enrollment.completedLessons} of {enrollment.totalLessons} lessons completed
                      </p>
                    </div>
                    {isCompleted ? (
                      <div className="flex justify-end gap-2 flex-wrap">
                        {(enrollment.courses as any)?.certificate_enabled && (
                          <Button
                            variant="hero"
                            size="sm"
                            className="gap-1 mr-auto"
                            onClick={() => setCompletionCourse({ id: enrollment.course_id, title: enrollment.courses?.title ?? "Course" })}
                          >
                            <Award className="h-4 w-4" /> Certificate
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => setResetCourse({ enrollmentId: enrollment.id, courseId: enrollment.course_id })}
                        >
                          <RotateCcw className="h-4 w-4" /> Start over
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => navigate(`/course/${enrollment.course_id}`)}
                        >
                          <PlayCircle className="h-4 w-4" /> Review
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => navigate(`/course/${enrollment.course_id}`)}
                        className="w-full gap-2"
                      >
                        <PlayCircle className="h-4 w-4" />
                        {enrollment.progressPercentage === 0 ? "Start Course" : "Continue Learning"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {completionCourse && (
        <CourseCompletionDialog
          open={!!completionCourse}
          onOpenChange={(open) => !open && setCompletionCourse(null)}
          courseId={completionCourse.id}
          courseTitle={completionCourse.title}
          studentName={studentName}
          certificateEnabled={enrolledCourses.find((e: any) => e.course_id === completionCourse.id)?.courses?.certificate_enabled || false}
        />
      )}

      <AlertDialog open={!!resetCourse} onOpenChange={(open) => !open && setResetCourse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start course over?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will reset to 0%, but you'll keep full access to all lessons, your review, and your certificate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetProgress.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={resetProgress.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (resetCourse) resetProgress.mutate(resetCourse);
              }}
            >
              {resetProgress.isPending ? "Resetting..." : "Start over"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default MyCourses;
