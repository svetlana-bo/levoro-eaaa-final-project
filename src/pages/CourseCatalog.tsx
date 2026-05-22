import { stripHtml } from "@/lib/sanitize";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, DollarSign, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";

const CourseCatalog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["published-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["my-enrollments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase.from("enrollments").insert({
        student_id: user!.id,
        course_id: courseId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Successfully enrolled!");
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isEnrolled = (courseId: string) => 
    enrollments.some((e) => e.course_id === courseId);

  const handleEnroll = (courseId: string) => {
    enrollMutation.mutate(courseId);
  };

  const handleViewCourse = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Catalog</h1>
          <p className="text-muted-foreground mt-1">
            Browse and enroll in published courses
          </p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading courses...</p>
        ) : courses.length === 0 ? (
          <p className="text-muted-foreground">No published courses available yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => {
              const enrolled = isEnrolled(course.id);
              return (
                <Card key={course.id} className="flex flex-col overflow-hidden">
                  {course.thumbnail_url && (
                    <div className="h-40 overflow-hidden">
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      {course.is_free ? (
                        <Badge variant="secondary">Free</Badge>
                      ) : (
                        <Badge variant="default" className="gap-1">
                          <DollarSign className="h-3 w-3" />
                          Paid
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-3">
                      {course.description ? stripHtml(course.description).substring(0, 200) || "No description available" : "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>View course content</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {enrolled ? (
                      <Button
                        onClick={() => handleViewCourse(course.id)}
                        className="w-full gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Continue Learning
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrollMutation.isPending}
                        className="w-full"
                      >
                        {enrollMutation.isPending ? "Enrolling..." : "Enroll Now"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CourseCatalog;
