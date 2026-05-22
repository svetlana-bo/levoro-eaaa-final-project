import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, BarChart3, Trophy, ArrowRight, CreditCard, StickyNote, Settings, Download, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import DashboardLayout from "@/components/DashboardLayout";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";

const ChangePasswordCard = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Change Password</CardTitle>
        <CardDescription>Update your account password</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <PasswordInput
            id="currentPassword"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <PasswordInput
            id="newPassword"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
            minLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
          <PasswordInput
            id="confirmNewPassword"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            minLength={6}
          />
        </div>
        <Button onClick={handleChangePassword} disabled={loading || !currentPassword || !newPassword || !confirmPassword}>
          {loading ? "Updating…" : "Update password"}
        </Button>
      </CardContent>
    </Card>
  );
};

const BillingTab = ({ transactions, txLoading, getItemLabel }: { transactions: any[]; txLoading: boolean; getItemLabel: (tx: any) => string }) => {
  const { subscribed, planId, subscriptionEnd, cancelAtPeriodEnd, isLoading: subLoading } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const navigate = useNavigate();

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Active Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          {subLoading ? (
            <p className="text-sm text-muted-foreground">Checking subscription...</p>
          ) : subscribed ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {cancelAtPeriodEnd ? (
                  <Badge variant="outline" className="border-amber-500/50 text-amber-600">Cancelling</Badge>
                ) : (
                  <Badge className="bg-secondary/20 text-secondary border-secondary/30">Active</Badge>
                )}
                <span className="text-sm">
                  {planId ? `${planId.charAt(0).toUpperCase() + planId.slice(1)} plan` : "Membership"}
                  {cancelAtPeriodEnd
                    ? ` — Access until ${subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "N/A"}`
                    : ` — Renews ${subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "N/A"}`}
                </span>
              </div>
              {cancelAtPeriodEnd && (
                <p className="text-sm text-amber-600">Your subscription will not renew. You'll retain access until the date above.</p>
              )}
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleManageSubscription} disabled={portalLoading}>
                <ExternalLink className="h-3.5 w-3.5" />
                {portalLoading ? "Opening..." : cancelAtPeriodEnd ? "Reactivate Subscription" : "Manage Subscription"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">No active subscription.</p>
              <Button variant="hero" size="sm" onClick={() => navigate("/memberships")}>
                View Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <p className="text-muted-foreground">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx: any) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getItemLabel(tx)}</TableCell>
                    <TableCell className="text-right font-medium">€{Number(tx.amount_paid).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
};

type StudentDashboardTab = "overview" | "notes" | "billing" | "settings";
const STUDENT_DASHBOARD_TABS: StudentDashboardTab[] = ["overview", "notes", "billing", "settings"];
const isStudentDashboardTab = (value: string | null): value is StudentDashboardTab =>
  !!value && STUDENT_DASHBOARD_TABS.includes(value as StudentDashboardTab);

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTabParam = searchParams.get("tab");
  const initialTab = isStudentDashboardTab(initialTabParam) ? initialTabParam : "overview";
  const [activeTab, setActiveTab] = useState<StudentDashboardTab>(initialTab);

  const handleTabChange = (tab: string) => {
    if (!isStudentDashboardTab(tab)) return;

    setActiveTab(tab);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", tab);
    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (isStudentDashboardTab(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    if (isStudentDashboardTab(searchParams.get("tab"))) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", activeTab);
    setSearchParams(nextParams, { replace: true });
  }, [activeTab, searchParams, setSearchParams]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["student-stats", user?.id],
    queryFn: async () => {
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("id, course_id")
        .eq("student_id", user!.id);
      const enrolledCount = enrollments?.length || 0;

      const { data: progress } = await supabase
        .from("lesson_progress")
        .select("is_completed")
        .eq("student_id", user!.id)
        .eq("is_completed", true);
      const completedLessons = progress?.length || 0;
      const hoursLearned = Math.floor(completedLessons * 0.5);

      const { data: completedCourses } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", user!.id)
        .not("completed_at", "is", null);
      const certificates = completedCourses?.length || 0;

      return [
        { label: "Courses Enrolled", value: enrolledCount.toString(), icon: BookOpen, color: "text-primary" },
        { label: "Hours Learned", value: hoursLearned.toString(), icon: Clock, color: "text-secondary" },
        { label: "Lessons Completed", value: completedLessons.toString(), icon: BarChart3, color: "text-primary" },
        { label: "Certificates", value: certificates.toString(), icon: Trophy, color: "text-secondary" },
      ];
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_plan_name, subscription_end_date")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["student-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions" as any)
        .select("id, display_id, type, course_id, subscription_tier, amount_paid, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const courseIds = transactions.filter((t: any) => t.course_id).map((t: any) => t.course_id);
  const { data: courses = [] } = useQuery({
    queryKey: ["tx-courses", courseIds],
    queryFn: async () => {
      if (courseIds.length === 0) return [];
      const { data, error } = await supabase.from("courses").select("id, title").in("id", courseIds);
      if (error) throw error;
      return data;
    },
    enabled: courseIds.length > 0,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ["student-all-notes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_notes" as any)
        .select("*")
        .eq("student_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const noteCourseIds = [...new Set(notes.map((n: any) => n.course_id))];
  const { data: noteCourses = [] } = useQuery({
    queryKey: ["note-courses", noteCourseIds],
    queryFn: async () => {
      if (noteCourseIds.length === 0) return [];
      const { data, error } = await supabase.from("courses").select("id, title").in("id", noteCourseIds);
      if (error) throw error;
      return data;
    },
    enabled: noteCourseIds.length > 0,
  });

  const getCourseTitle = (courseId: string | null) => {
    if (!courseId) return "—";
    const course = [...courses, ...noteCourses].find((c: any) => c.id === courseId);
    return course?.title || "Unknown Course";
  };

  const getItemLabel = (tx: any) => {
    if (tx.type === "subscription") return `Subscription (${tx.subscription_tier || "N/A"})`;
    return getCourseTitle(tx.course_id);
  };

  // Settings state
  const [sidebarDefault, setSidebarDefault] = useState<boolean>(() => {
    try {
      const pref = localStorage.getItem("levoro_sidebar_default");
      return pref === null ? true : pref === "open";
    } catch { return true; }
  });

  const handleSidebarDefaultChange = (open: boolean) => {
    setSidebarDefault(open);
    localStorage.setItem("levoro_sidebar_default", open ? "open" : "closed");
    toast.success(`Course sidebar will be ${open ? "visible" : "hidden"} by default`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="rounded-2xl p-6 md:p-8 bg-sidebar-soft">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary-foreground">
            Welcome back, {user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || "Student"}!
          </h1>
          <p className="text-primary-foreground/70 mt-1 text-sm">
            Here's your learning overview.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
            <TabsTrigger value="notes" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <StickyNote className="h-3.5 w-3.5" />
              My Notes
              {notes.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold h-5 min-w-[20px] px-1">
                  {notes.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CreditCard className="h-3.5 w-3.5" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="h-3.5 w-3.5" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {isLoading ? (
                <p className="col-span-full text-muted-foreground">Loading stats...</p>
              ) : (
                stats?.map((s) => (
                  <Card key={s.label} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</CardTitle>
                      <div className={`h-8 w-8 rounded-lg bg-muted flex items-center justify-center`}>
                        <s.icon className={`h-4 w-4 ${s.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">{s.value}</div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="group cursor-pointer border-border/50 hover:border-secondary/50 transition-all hover:shadow-lg" onClick={() => navigate("/courses")}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 group-hover:bg-secondary/20 transition-colors">
                    <BookOpen className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Browse Catalog</h3>
                    <p className="text-sm text-muted-foreground">Discover new courses and expand your skills</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                </CardContent>
              </Card>

              <Card className="group cursor-pointer border-border/50 hover:border-primary/50 transition-all hover:shadow-lg" onClick={() => navigate("/my-courses")}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">My Courses</h3>
                    <p className="text-sm text-muted-foreground">Continue your learning journey</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <StickyNote className="h-5 w-5 text-secondary" /> My Notes
                </CardTitle>
                {notes.filter((n: any) => n.selected_text?.startsWith("[SQL Exercise]")).length > 0 && (
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => {
                    const sqlNotes = notes.filter((n: any) => n.selected_text?.startsWith("[SQL Exercise]"));
                    const content = sqlNotes.map((n: any) =>
                      `${n.selected_text ? `-- ${n.selected_text}\n` : ""}${n.note_content}\n`
                    ).join("\n---\n\n");
                    const blob = new Blob([content], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "sql-notes.sql";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}>
                    <Download className="h-3.5 w-3.5" /> Download SQL Notes
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notes yet. Select text while learning or use the Notes button in any lesson to start taking notes.</p>
                ) : (
                  <div className="space-y-5">
                    {noteCourseIds.map(cId => {
                      const courseNotes = notes.filter((n: any) => n.course_id === cId);
                      if (courseNotes.length === 0) return null;
                      return (
                        <div key={cId} className="space-y-2">
                          <h3 className="text-sm font-semibold text-primary">{getCourseTitle(cId)}</h3>
                          {courseNotes.map((note: any) => (
                            <div key={note.id} className="border border-border rounded-lg p-3 bg-card space-y-1">
                              {note.selected_text && (
                                <p className="text-xs text-muted-foreground italic border-l-2 border-secondary pl-2">
                                  "{note.selected_text}"
                                </p>
                              )}
                              <p className="text-sm">{note.note_content}</p>
                              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                <span>{new Date(note.created_at).toLocaleDateString()}</span>
                                {note.lesson_id && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-[10px] text-secondary"
                                    onClick={() => navigate(`/course/${note.course_id}`)}
                                  >
                                    Go to lesson →
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <BillingTab transactions={transactions} txLoading={txLoading} getItemLabel={getItemLabel} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Course Player Preferences</CardTitle>
                <CardDescription>Customize your learning experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show course content sidebar by default</Label>
                    <p className="text-xs text-muted-foreground">
                      When enabled, the lesson navigation sidebar will be visible when you open a course
                    </p>
                  </div>
                  <Switch checked={sidebarDefault} onCheckedChange={handleSidebarDefaultChange} />
                </div>
              </CardContent>
            </Card>

            <ChangePasswordCard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
