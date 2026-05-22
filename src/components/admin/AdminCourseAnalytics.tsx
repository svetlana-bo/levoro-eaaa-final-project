import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, startOfMonth, subMonths } from "date-fns";
import PinnedQueryWidgets from "./PinnedQueryWidgets";
import { useSystemQuery } from "@/hooks/useSystemQuery";

function StatCard({ icon: Icon, label, value, onClick }: { icon: any; label: string; value: number; onClick?: () => void }) {
  return (
    <Card className={onClick ? "cursor-pointer hover:ring-2 hover:ring-primary/30 transition-shadow" : ""} onClick={onClick}>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="rounded-full bg-primary/10 p-3"><Icon className="h-5 w-5 text-primary" /></div>
        <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div>
      </CardContent>
    </Card>
  );
}

export default function AdminCourseAnalytics() {
  // Seed system queries so they appear in SQL Studio for editing
  useSystemQuery({
    key: "course-analytics:courses-with-enrollments",
    title: "Courses with Enrollments",
    defaultSql: `SELECT c.title, COUNT(e.id) as enrollment_count, ROUND(AVG(CASE WHEN lp.total > 0 THEN (lp.completed::numeric / lp.total * 100) ELSE 0 END)) as avg_completion_pct, MAX(e.enrolled_at) as latest_enrollment
FROM courses c
JOIN enrollments e ON e.course_id = c.id
LEFT JOIN LATERAL (
  SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE lpr.is_completed) as completed
  FROM lessons l
  LEFT JOIN lesson_progress lpr ON lpr.lesson_id = l.id AND lpr.student_id = e.student_id
  WHERE l.course_id = c.id
) lp ON true
GROUP BY c.id, c.title
ORDER BY enrollment_count DESC`,
    targetPage: "course-analytics",
  });

  useSystemQuery({
    key: "course-analytics:monthly-trend",
    title: "Monthly Enrollment Trend",
    defaultSql: `SELECT to_char(enrolled_at, 'YYYY-MM') as month, COUNT(*) as enrollments
FROM enrollments
GROUP BY month
ORDER BY month DESC
LIMIT 12`,
    defaultViz: { chartType: "line", xColumn: "month", yColumns: ["enrollments"] },
    targetPage: "course-analytics",
  });

  const [selectedInstructor, setSelectedInstructor] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [monthsBack, setMonthsBack] = useState(6);
  const [drillDown, setDrillDown] = useState<"enrollments" | "completion" | null>(null);
  const [studentDrillDown, setStudentDrillDown] = useState<{ courseId: string; courseTitle: string } | null>(null);

  // Fetch instructors
  const { data: instructors = [] } = useQuery({
    queryKey: ["admin-instructors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["instructor", "admin", "webadmin"]);
      if (error) throw error;
      const ids = data.map((r) => r.user_id);
      if (ids.length === 0) return [];
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", ids);
      if (pErr) throw pErr;
      return profiles || [];
    },
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["admin-courses-analytics", selectedInstructor],
    queryFn: async () => {
      let q = supabase.from("courses").select("id, title, instructor_id").order("title");
      if (selectedInstructor !== "all") q = q.eq("instructor_id", selectedInstructor);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const courseIds = useMemo(() => {
    if (selectedCourse === "all") return courses.map((c) => c.id);
    return [selectedCourse];
  }, [selectedCourse, courses]);

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["admin-enrollments-analytics", courseIds],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      const { data, error } = await supabase.from("enrollments").select("id, course_id, student_id, enrolled_at, completed_at").in("course_id", courseIds);
      if (error) throw error;
      return data;
    },
    enabled: courseIds.length > 0,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["admin-lessons-analytics", courseIds],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      const { data, error } = await supabase.from("lessons").select("id, course_id").in("course_id", courseIds);
      if (error) throw error;
      return data;
    },
    enabled: courseIds.length > 0,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["admin-progress-analytics", courseIds],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      const lessonIds = lessons.map((l) => l.id);
      if (lessonIds.length === 0) return [];
      const { data, error } = await supabase.from("lesson_progress").select("id, lesson_id, student_id, is_completed, completed_at").in("lesson_id", lessonIds).eq("is_completed", true);
      if (error) throw error;
      return data;
    },
    enabled: lessons.length > 0,
  });

  const studentIds = useMemo(() => [...new Set(enrollments.map((e) => e.student_id))], [enrollments]);
  const { data: studentProfiles = [] } = useQuery({
    queryKey: ["admin-student-display-ids", studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const { data, error } = await supabase.from("profiles").select("id, display_id").in("id", studentIds);
      if (error) throw error;
      return data;
    },
    enabled: studentIds.length > 0,
  });

  const profileMap = useMemo(() => {
    const m: Record<string, number> = {};
    studentProfiles.forEach((p) => { m[p.id] = p.display_id; });
    return m;
  }, [studentProfiles]);

  const lessonsByCourse = useMemo(() => {
    const m: Record<string, string[]> = {};
    lessons.forEach((l) => { if (!m[l.course_id]) m[l.course_id] = []; m[l.course_id].push(l.id); });
    return m;
  }, [lessons]);

  const studentCompletion = useMemo(() => {
    const result: Record<string, { completionPct: number; lastActivity: string | null }> = {};
    const completedByStudent: Record<string, Set<string>> = {};
    const lastActivity: Record<string, string> = {};
    progress.forEach((p) => {
      if (!completedByStudent[p.student_id]) completedByStudent[p.student_id] = new Set();
      completedByStudent[p.student_id].add(p.lesson_id);
      if (p.completed_at && (!lastActivity[p.student_id] || p.completed_at > lastActivity[p.student_id])) lastActivity[p.student_id] = p.completed_at;
    });
    enrollments.forEach((e) => {
      const cls = lessonsByCourse[e.course_id] || [];
      const completed = completedByStudent[e.student_id] || new Set();
      const count = cls.filter((lid) => completed.has(lid)).length;
      const pct = cls.length > 0 ? Math.round((count / cls.length) * 100) : 0;
      // Scope lastActivity to this course's lessons only
      const courseLessonIds = new Set(cls);
      let courseLastActivity: string | null = null;
      progress.forEach((p) => {
        if (p.student_id === e.student_id && courseLessonIds.has(p.lesson_id) && p.completed_at) {
          if (!courseLastActivity || p.completed_at > courseLastActivity) courseLastActivity = p.completed_at;
        }
      });
      result[`${e.student_id}-${e.course_id}`] = { completionPct: pct, lastActivity: courseLastActivity };
    });
    return result;
  }, [enrollments, progress, lessonsByCourse]);

  const totalEnrollments = enrollments.length;
  const studentsAbove50 = useMemo(() => {
    const seen = new Set<string>();
    enrollments.forEach((e) => {
      if ((studentCompletion[`${e.student_id}-${e.course_id}`]?.completionPct ?? 0) >= 50) seen.add(e.student_id);
    });
    return seen.size;
  }, [enrollments, studentCompletion]);

  const trendData = useMemo(() => {
    const months: string[] = [];
    for (let i = monthsBack - 1; i >= 0; i--) months.push(format(startOfMonth(subMonths(new Date(), i)), "yyyy-MM"));
    return months.map((m) => ({
      month: m,
      enrollments: enrollments.filter((e) => format(new Date(e.enrolled_at), "yyyy-MM") === m).length,
    }));
  }, [enrollments, monthsBack]);

  const courseMap = useMemo(() => {
    const m: Record<string, { title: string; instructor_id?: string }> = {};
    courses.forEach((c) => { m[c.id] = { title: c.title, instructor_id: c.instructor_id }; });
    return m;
  }, [courses]);

  const coursesWithEnrollments = useMemo(() => {
    const map: Record<string, { courseId: string; title: string; instructorId: string; enrollmentCount: number; avgCompletion: number; latestEnrollment: string }> = {};
    enrollments.forEach((e) => {
      if (!map[e.course_id]) {
        const c = courseMap[e.course_id];
        map[e.course_id] = { courseId: e.course_id, title: c?.title || "Unknown", instructorId: c?.instructor_id || "", enrollmentCount: 0, avgCompletion: 0, latestEnrollment: e.enrolled_at };
      }
      map[e.course_id].enrollmentCount++;
      if (e.enrolled_at > map[e.course_id].latestEnrollment) map[e.course_id].latestEnrollment = e.enrolled_at;
    });
    Object.keys(map).forEach((cid) => {
      const courseEnrollments = enrollments.filter((e) => e.course_id === cid);
      const totalPct = courseEnrollments.reduce((sum, e) => sum + (studentCompletion[`${e.student_id}-${e.course_id}`]?.completionPct ?? 0), 0);
      map[cid].avgCompletion = courseEnrollments.length > 0 ? Math.round(totalPct / courseEnrollments.length) : 0;
    });
    return Object.values(map).sort((a, b) => b.enrollmentCount - a.enrollmentCount);
  }, [enrollments, courseMap, studentCompletion]);

  const drillDownRows = useMemo(() => {
    if (!drillDown) return [];
    let rows = [...coursesWithEnrollments];
    if (drillDown === "completion") rows = rows.filter((r) => r.avgCompletion >= 50);
    return rows;
  }, [drillDown, coursesWithEnrollments]);

  // Per-course student drill-down
  const studentDrillDownRows = useMemo(() => {
    if (!studentDrillDown) return [];
    return enrollments
      .filter((e) => e.course_id === studentDrillDown.courseId)
      .map((e) => {
        const key = `${e.student_id}-${e.course_id}`;
        const comp = studentCompletion[key] || { completionPct: 0, lastActivity: null };
        return {
          displayId: profileMap[e.student_id] ?? "—",
          enrolledAt: e.enrolled_at,
          completionPct: comp.completionPct,
          lastActivity: comp.lastActivity,
        };
      })
      .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime());
  }, [studentDrillDown, enrollments, studentCompletion, profileMap]);

  if (isLoading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  // Student-level drill-down for a specific course
  if (studentDrillDown) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setStudentDrillDown(null)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h2 className="text-xl font-bold">Students enrolled in: {studentDrillDown.courseTitle}</h2>
        <p className="text-sm text-muted-foreground">Course ID: {studentDrillDown.courseId}</p>
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">Student ID</TableHead>
                  <TableHead className="text-xs">Enrolled</TableHead>
                  <TableHead className="text-xs">Completion %</TableHead>
                  <TableHead className="text-xs">Last Activity</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {studentDrillDownRows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-mono">#{r.displayId}</TableCell>
                      <TableCell className="text-xs">{format(new Date(r.enrolledAt), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-xs">{r.completionPct}%</TableCell>
                      <TableCell className="text-xs">{r.lastActivity ? format(new Date(r.lastActivity), "MMM d, yyyy HH:mm") : "—"}</TableCell>
                    </TableRow>
                  ))}
                  {studentDrillDownRows.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No students</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Course-level drill-down
  if (drillDown) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setDrillDown(null)}><ArrowLeft className="h-4 w-4" /> Back</Button>
        <h2 className="text-xl font-bold">{drillDown === "enrollments" ? "Enrollments by Course" : "Courses with ≥50% Avg Completion"}</h2>
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">Course</TableHead>
                  <TableHead className="text-xs">Enrollments</TableHead>
                  <TableHead className="text-xs">Avg Completion %</TableHead>
                  <TableHead className="text-xs">Latest Enrollment</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {drillDownRows.map((r) => (
                    <TableRow key={r.courseId}>
                      <TableCell className="text-xs">{r.title}</TableCell>
                      <TableCell className="text-xs">
                        <button
                          className="text-primary hover:underline font-medium"
                          onClick={() => { setDrillDown(null); setStudentDrillDown({ courseId: r.courseId, courseTitle: r.title }); }}
                        >
                          {r.enrollmentCount}
                        </button>
                      </TableCell>
                      <TableCell className="text-xs">{r.avgCompletion}%</TableCell>
                      <TableCell className="text-xs">{format(new Date(r.latestEnrollment), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                  {drillDownRows.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No data</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Instructor</p>
          <Select value={selectedInstructor} onValueChange={(v) => { setSelectedInstructor(v); setSelectedCourse("all"); }}>
            <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Instructors</SelectItem>
              {instructors.map((inst) => <SelectItem key={inst.id} value={inst.id}>{`${inst.first_name || ""} ${inst.last_name || ""}`.trim() || inst.id.slice(0, 8)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Course</p>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[220px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Period</p>
          <Select value={String(monthsBack)} onValueChange={(v) => setMonthsBack(Number(v))}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 months</SelectItem>
              <SelectItem value="6">6 months</SelectItem>
              <SelectItem value="12">12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard icon={Users} label="Total Enrollments" value={totalEnrollments} onClick={() => setDrillDown("enrollments")} />
        <StatCard icon={CheckCircle} label="Students ≥50% Completion" value={studentsAbove50} onClick={() => setDrillDown("completion")} />
      </div>

      {coursesWithEnrollments.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Courses with Enrollments</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">Course</TableHead>
                  <TableHead className="text-xs">Enrollments</TableHead>
                  <TableHead className="text-xs">Avg Completion %</TableHead>
                  <TableHead className="text-xs">Latest Enrollment</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {coursesWithEnrollments.map((c) => (
                    <TableRow key={c.courseId}>
                      <TableCell className="text-xs">{c.title}</TableCell>
                      <TableCell className="text-xs">
                        <button
                          className="text-primary hover:underline font-medium"
                          onClick={() => setStudentDrillDown({ courseId: c.courseId, courseTitle: c.title })}
                        >
                          {c.enrollmentCount}
                        </button>
                      </TableCell>
                      <TableCell className="text-xs">{c.avgCompletion}%</TableCell>
                      <TableCell className="text-xs">{format(new Date(c.latestEnrollment), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Enrollment Trend</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="enrollments" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <PinnedQueryWidgets pageName="course-analytics" />
    </div>
  );
}
