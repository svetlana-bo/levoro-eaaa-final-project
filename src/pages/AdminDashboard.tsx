import { safeHtml } from "@/lib/sanitize";

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ShieldCheck, Users, BookCheck, LogOut, CheckCircle, Euro, Eye, RotateCcw, DollarSign, Megaphone, Plus, Trash2, HelpCircle, Pencil, Handshake, Star as StarIcon, CreditCard, FileText, MessageSquare, Tag, Upload, MapPin, Loader2, ChevronRight, UserX, Ban, BookOpen, UserPlus, Download, Package, Search, Mail, KeyRound, BarChart3, Info, Inbox as InboxIcon, X, Building2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import GlobalNavbar from "@/components/GlobalNavbar";
import CourseImport from "@/components/admin/CourseImport";
import HotspotIconsManager from "@/components/admin/HotspotIconsManager";
import SitePagesEditor from "@/components/admin/SitePagesEditor";
import BlogEditor from "@/components/admin/BlogEditor";
import AdminEmailsEditor from "@/components/admin/AdminEmailsEditor";
import MarketingEmailsManager from "@/components/admin/MarketingEmailsManager";
import EmailAnalytics from "@/components/admin/EmailAnalytics";
import SqlQueryStudio from "@/components/admin/SqlQueryStudio";

import KnowledgeBaseManager from "@/components/admin/KnowledgeBaseManager";
import WebsiteAnalytics from "@/components/admin/WebsiteAnalytics";
import SubscriberAnalytics from "@/components/admin/SubscriberAnalytics";
import AdminCourseAnalytics from "@/components/admin/AdminCourseAnalytics";
import PinnedQueryWidgets from "@/components/admin/PinnedQueryWidgets";
import Inbox from "@/components/admin/Inbox";
import EditUserProfileDialog from "@/components/admin/EditUserProfileDialog";
import OwnerPicker from "@/components/admin/OwnerPicker";
import { useInboxUnreadCount } from "@/hooks/useInboxUnreadCount";
import { MediaUpload } from "@/components/MediaUpload";

type AdminView = "users" | "create-users" | "subscribers" | "subscriber-analytics" | "drafts" | "approvals" | "published" | "financials" | "banners" | "popups" | "faq" | "partners" | "recommended" | "pricing" | "promo-codes" | "reviews" | "categories" | "import" | "hotspot-icons" | "site-pages" | "blog" | "bundles" | "admin-emails" | "marketing-emails" | "email-analytics" | "sql-studio" | "knowledge-base" | "website-analytics" | "course-analytics" | string;

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

const sidebarCategories = [
  {
    label: "User Management",
    items: [
      { title: "Manage", view: "users" as const, icon: Users },
      { title: "Create", view: "create-users" as const, icon: Plus },
      { title: "Subscribers", view: "subscribers" as const, icon: Mail },
    ],
  },
  {
    label: "Course Management",
    items: [
      { title: "Draft Courses", view: "drafts" as const, icon: FileText },
      { title: "Course Approvals", view: "approvals" as const, icon: BookCheck },
      { title: "Published Courses", view: "published" as const, icon: CheckCircle },
      { title: "Hotspot Icons", view: "hotspot-icons" as const, icon: MapPin },
      { title: "Import Course", view: "import" as const, icon: Upload },
    ],
  },
  {
    label: "Webpages",
    items: [
      { title: "Reviews", view: "reviews" as const, icon: MessageSquare },
      { title: "Categories", view: "categories" as const, icon: Tag },
      { title: "FAQ Manager", view: "faq" as const, icon: HelpCircle },
      { title: "Partners", view: "partners" as const, icon: Handshake },
      { title: "Recommended Courses", view: "recommended" as const, icon: StarIcon },
      { title: "Site Pages", view: "site-pages" as const, icon: FileText },
      { title: "Blog", view: "blog" as const, icon: BookOpen },
      { title: "Knowledge Base", view: "knowledge-base" as const, icon: Info },
    ],
  },
  {
    label: "Financials",
    items: [
      { title: "Financials", view: "financials" as const, icon: DollarSign },
      { title: "Membership Pricing", view: "pricing" as const, icon: CreditCard },
      { title: "Promo Codes", view: "promo-codes" as const, icon: Tag },
      { title: "Bundles", view: "bundles" as const, icon: Package },
    ],
  },
  {
    label: "Inbox",
    items: [
      { title: "Messages", view: "inbox" as const, icon: InboxIcon },
    ],
  },
  {
    label: "Banners & Pop-ups",
    items: [
      { title: "Banners", view: "banners" as const, icon: Megaphone },
      { title: "Pop-ups", view: "popups" as const, icon: Eye },
    ],
  },
  {
    label: "Email Manager",
    items: [
      { title: "Admin Emails", view: "admin-emails" as const, icon: Mail },
      { title: "Marketing Emails", view: "marketing-emails" as const, icon: Megaphone },
      { title: "Email Analytics", view: "email-analytics" as const, icon: Eye },
    ],
  },
  {
    label: "Analytics",
    items: [
      { title: "Course Analytics", view: "course-analytics" as const, icon: BarChart3 },
      { title: "Website Analytics", view: "website-analytics" as const, icon: Eye },
      { title: "Subscriber Analytics", view: "subscriber-analytics" as const, icon: Users },
      { title: "SQL Studio", view: "sql-studio" as const, icon: FileText },
    ],
  },
];

const SITE_URL = "https://levoro.academy";

const SnippetPreview = ({ title, url, description }: { title: string; url: string; description: string }) => (
  <div className="border border-border rounded-lg p-4 bg-background space-y-1 max-w-[600px]">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Search className="h-3 w-3" />
      Google Search Preview
    </div>
    <p className="text-sm text-[hsl(var(--primary))] truncate">{title || "Page Title | Levoro Academy"}</p>
    <p className="text-xs text-green-700 dark:text-green-400 truncate">{url}</p>
    <p className="text-xs text-muted-foreground line-clamp-2">{description || "No description set. A default will be used."}</p>
  </div>
);

function AdminSidebar({ activeView, setActiveView, customPages = [] }: { activeView: AdminView; setActiveView: (v: AdminView) => void; customPages?: string[] }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { data: unreadCount = 0 } = useInboxUnreadCount();
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-sidebar-primary shrink-0" />
          {!collapsed && <span className="font-bold text-lg font-sans">Admin Dashboard</span>}
        </div>
        {sidebarCategories.map((cat) => (
          <SidebarGroup key={cat.label}>
            <SidebarGroupLabel>{cat.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {cat.items.map((item) => {
                  const showBadge = item.view === "inbox" && unreadCount > 0;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={() => setActiveView(item.view)}
                        className={activeView === item.view ? "bg-sidebar-accent text-sidebar-foreground font-medium" : "hover:bg-sidebar-accent/50"}
                      >
                        <item.icon className={`mr-2 h-4 w-4 ${activeView === item.view ? "text-sidebar-primary" : ""}`} />
                        {!collapsed && <span className="flex-1">{item.title}</span>}
                        {showBadge && (
                          <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
                {cat.label === "Analytics" && customPages.map((cp) => (
                  <SidebarMenuItem key={cp}>
                    <SidebarMenuButton
                      onClick={() => setActiveView(cp)}
                      className={activeView === cp ? "bg-sidebar-accent text-sidebar-foreground font-medium" : "hover:bg-sidebar-accent/50"}
                    >
                      <BarChart3 className={`mr-2 h-4 w-4 ${activeView === cp ? "text-sidebar-primary" : ""}`} />
                      {!collapsed && <span>{cp.replace("custom:", "")}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

interface CourseSettings { [courseId: string]: { accessType: string; priceEur: number }; }

const AdminDashboard = () => {
  // Query for custom analytics pages
  const { data: customAnalyticsPages = [] } = useQuery({
    queryKey: ["custom-analytics-pages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_queries" as any).select("target_page").not("target_page", "is", null);
      if (error) throw error;
      const pages = new Set<string>();
      (data || []).forEach((r: any) => { if (r.target_page?.startsWith("custom:")) pages.add(r.target_page); });
      return [...pages];
    },
  });
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = (searchParams.get("tab") as AdminView) || "users";
  const [activeView, setActiveViewState] = useState<AdminView>(initialView);
  const setActiveView = (v: AdminView) => {
    setActiveViewState(v);
    setSearchParams({ tab: v }, { replace: true });
  };
  const [courseSettings, setCourseSettings] = useState<CourseSettings>({});
  const [publishedCourseSettings, setPublishedCourseSettings] = useState<CourseSettings>({});
  const [txFilter, setTxFilter] = useState<"all" | "subscription" | "course_purchase" | "subscriptions_view" | "trials_view">("all");
  const [showTrials, setShowTrials] = useState(false);

  // Promo state
  const [newPromoContent, setNewPromoContent] = useState("");
  const [newPromoBg, setNewPromoBg] = useState("#1F3A60");
  const [newPromoText, setNewPromoText] = useState("#FFFFFF");
  const [newPromoPages, setNewPromoPages] = useState("");

  // FAQ state
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [editFaqQuestion, setEditFaqQuestion] = useState("");
  const [editFaqAnswer, setEditFaqAnswer] = useState("");
  const [editFaqOrder, setEditFaqOrder] = useState(0);

  // Partner state
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerLogo, setNewPartnerLogo] = useState("");
  const [newPartnerUrl, setNewPartnerUrl] = useState("");
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [editPartnerName, setEditPartnerName] = useState("");
  const [editPartnerLogo, setEditPartnerLogo] = useState("");
  const [editPartnerUrl, setEditPartnerUrl] = useState("");

  // Recommended state
  const [selectedRecommendedCourseId, setSelectedRecommendedCourseId] = useState("");

  // Pricing state
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPlanPrice, setEditPlanPrice] = useState(0);
  const [editPlanDiscountEnd, setEditPlanDiscountEnd] = useState("");
  const [editPlanBadge, setEditPlanBadge] = useState("");
  const [editPlanTrialDays, setEditPlanTrialDays] = useState(0);

  // Currency overrides state
  const ALL_CURRENCIES: Record<string, string> = {
    USD: "US Dollar ($)", GBP: "British Pound (£)", SEK: "Swedish Krona (kr)", NOK: "Norwegian Krone (kr)",
    DKK: "Danish Krone (kr)", PLN: "Polish Złoty (zł)", CHF: "Swiss Franc (CHF)", CAD: "Canadian Dollar (C$)",
    AUD: "Australian Dollar (A$)", JPY: "Japanese Yen (¥)", INR: "Indian Rupee (₹)", BRL: "Brazilian Real (R$)",
    MXN: "Mexican Peso ($)", KRW: "South Korean Won (₩)", CNY: "Chinese Yuan (¥)", HKD: "Hong Kong Dollar (HK$)",
    SGD: "Singapore Dollar (S$)", NZD: "New Zealand Dollar (NZ$)", ZAR: "South African Rand (R)",
    THB: "Thai Baht (฿)", MYR: "Malaysian Ringgit (RM)", PHP: "Philippine Peso (₱)", IDR: "Indonesian Rupiah (Rp)",
    TRY: "Turkish Lira (₺)", ILS: "Israeli Shekel (₪)", AED: "UAE Dirham (د.إ)", SAR: "Saudi Riyal (﷼)",
    EGP: "Egyptian Pound (E£)", NGN: "Nigerian Naira (₦)", KES: "Kenyan Shilling (KSh)", TWD: "Taiwan Dollar (NT$)",
    CZK: "Czech Koruna (Kč)", HUF: "Hungarian Forint (Ft)", RON: "Romanian Leu (lei)", BGN: "Bulgarian Lev (лв)",
    CLP: "Chilean Peso ($)", COP: "Colombian Peso ($)", PEN: "Peruvian Sol (S/)", ARS: "Argentine Peso ($)",
    VND: "Vietnamese Dong (₫)", PKR: "Pakistani Rupee (₨)", BDT: "Bangladeshi Taka (৳)", LKR: "Sri Lankan Rupee (Rs)",
    QAR: "Qatari Riyal (QR)", KWD: "Kuwaiti Dinar (KD)", BHD: "Bahraini Dinar (BD)", OMR: "Omani Rial (OMR)",
    JOD: "Jordanian Dinar (JD)", MAD: "Moroccan Dirham (MAD)", TND: "Tunisian Dinar (TND)", ISK: "Icelandic Króna (kr)",
    HRK: "Croatian Kuna (kn)", RSD: "Serbian Dinar (din)", UAH: "Ukrainian Hryvnia (₴)", GEL: "Georgian Lari (₾)",
    KZT: "Kazakhstani Tenge (₸)",
  };
  const [currencyOverrides, setCurrencyOverrides] = useState<Record<string, Record<string, string>>>({});
  const [addCurrencySearch, setAddCurrencySearch] = useState("");
  const [showCurrencyPlanId, setShowCurrencyPlanId] = useState<string | null>(null);

  // Category state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");

  // Subcategory state
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [newSubcategorySlug, setNewSubcategorySlug] = useState("");
  const [newSubcategoryCategoryId, setNewSubcategoryCategoryId] = useState("");
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  // Course SEO state
  const [courseSeoEditing, setCourseSeoEditing] = useState<string | null>(null);
  const [courseSeoTitle, setCourseSeoTitle] = useState("");
  const [courseSeoDesc, setCourseSeoDesc] = useState("");

  // Category SEO state
  const [categorySeoEditing, setCategorySeoEditing] = useState<string | null>(null);
  const [categorySeoTitle, setCategorySeoTitle] = useState("");
  const [categorySeoDesc, setCategorySeoDesc] = useState("");

  // Bundle state
  const [newBundleTitle, setNewBundleTitle] = useState("");
  const [newBundleSlug, setNewBundleSlug] = useState("");
  const [newBundleDesc, setNewBundleDesc] = useState("");
  const [newBundlePrice, setNewBundlePrice] = useState(0);
  const [editingBundleId, setEditingBundleId] = useState<string | null>(null);
  const [editBundleTitle, setEditBundleTitle] = useState("");
  const [editBundleSlug, setEditBundleSlug] = useState("");
  const [editBundleDesc, setEditBundleDesc] = useState("");
  const [editBundlePrice, setEditBundlePrice] = useState(0);
  const [editBundleMetaTitle, setEditBundleMetaTitle] = useState("");
  const [editBundleMetaDesc, setEditBundleMetaDesc] = useState("");
  const [editBundleContent, setEditBundleContent] = useState("");
  const [bundleCourseDropdown, setBundleCourseDropdown] = useState<string | null>(null);

  // Course category assignment state (used in approvals/published)
  const [categoryDropdownCourse, setCategoryDropdownCourse] = useState<string | null>(null);

  // Force reset password state
  const [resetPasswordTarget, setResetPasswordTarget] = useState<{ id: string; name: string } | null>(null);
  const [editProfileTarget, setEditProfileTarget] = useState<{ id: string; role: string | null; company?: { id: string; name: string } | null } | null>(null);

  // Scheduled publish state
  const [scheduledPublishDate, setScheduledPublishDate] = useState<Date | undefined>();
  const [schedulingCourseId, setSchedulingCourseId] = useState<string | null>(null);

  // Multi-instructor state
  const [addInstructorCourseId, setAddInstructorCourseId] = useState<string | null>(null);

  // Delete user state
  const [deleteUserTarget, setDeleteUserTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteMode, setDeleteMode] = useState<"soft" | "hard">("soft");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // User role filter
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "student" | "instructor" | "admin" | "webadmin" | "pending-invite">("all");

  // Create user state
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserCountry, setNewUserCountry] = useState("");
  const [newUserRole, setNewUserRole] = useState("student");
  const [newUserInstructorType, setNewUserInstructorType] = useState<"individual" | "company">("individual");
  const [newUserCompanyName, setNewUserCompanyName] = useState("");
  const [newUserSendInvite, setNewUserSendInvite] = useState(true);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [companyInstructors, setCompanyInstructors] = useState<Array<{ first_name: string; last_name: string; email: string; country: string }>>([
    { first_name: "", last_name: "", email: "", country: "" },
  ]);
  const [sendingInviteIds, setSendingInviteIds] = useState<Set<string>>(new Set());
  const [bulkSendingInvites, setBulkSendingInvites] = useState(false);

  // CSV import state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvSendInvite, setCsvSendInvite] = useState(true);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResults, setCsvResults] = useState<{ email: string; success: boolean; error?: string }[]>([]);

  // ── Queries ──
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase.from("profiles").select("id, display_id, first_name, last_name, company_name, instructor_type, user_created_at, invite_sent");
      if (pErr) throw pErr;
      const { data: roles, error: rErr } = await supabase.from("user_roles").select("*");
      if (rErr) throw rErr;
      // Company memberships
      const { data: memberships } = await supabase
        .from("instructor_company_members")
        .select("user_id, company_id, instructor_companies:company_id(id, name, logo_url)");
      const companyByUser: Record<string, { id: string; name: string; logo_url: string | null }> = {};
      (memberships || []).forEach((m: any) => {
        const c = m.instructor_companies;
        if (c && !companyByUser[m.user_id]) companyByUser[m.user_id] = { id: c.id, name: c.name, logo_url: c.logo_url };
      });
      // Fetch emails via edge function
      let emailMap: Record<string, string> = {};
      try {
        const { data: emailData } = await supabase.functions.invoke("get-user-emails");
        if (emailData?.emailMap) emailMap = emailData.emailMap;
      } catch {}
      return (profiles || []).map((p: any) => ({ ...p, email: emailMap[p.id] || "", role: roles?.find((r: any) => r.user_id === p.id)?.role || "student", role_id: roles?.find((r: any) => r.user_id === p.id)?.id, company: companyByUser[p.id] || null }));
    },
  });

  const { data: draftCourses = [], isLoading: draftsLoading } = useQuery({
    queryKey: ["admin-draft-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("id, display_id, title, description, status, created_at, access_type, price_eur, instructor_id, owner_type, owner_id").eq("status", "draft" as any).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: pendingCourses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["admin-pending-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("id, display_id, title, description, status, created_at, access_type, price_eur, instructor_id, owner_type, owner_id").eq("status", "pending_review" as any).order("created_at", { ascending: false });
      if (error) throw error;
      const init: CourseSettings = {};
      data?.forEach((c: any) => { init[c.id] = { accessType: c.access_type || "subscription", priceEur: c.price_eur || 0 }; });
      setCourseSettings((prev) => ({ ...init, ...prev }));
      return data;
    },
  });

  const { data: publishedCourses = [], isLoading: publishedLoading } = useQuery({
    queryKey: ["admin-published-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("id, display_id, title, description, status, created_at, access_type, price_eur, is_free, instructor_id, owner_type, owner_id").eq("status", "published" as any).order("created_at", { ascending: false });
      if (error) throw error;
      const init: CourseSettings = {};
      data?.forEach((c: any) => { init[c.id] = { accessType: c.access_type || "subscription", priceEur: c.price_eur || 0 }; });
      setPublishedCourseSettings((prev) => ({ ...init, ...prev }));
      return data;
    },
  });

  const { data: instructorCompanies = [] } = useQuery({
    queryKey: ["admin-instructor-companies-with-main"],
    queryFn: async () => {
      const { data: companies, error } = await supabase
        .from("instructor_companies")
        .select("id, name")
        .order("name", { ascending: true });
      if (error) throw error;
      const ids = (companies || []).map((c: any) => c.id);
      let mainMap: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: members } = await supabase
          .from("instructor_company_members")
          .select("company_id, user_id, member_role")
          .in("company_id", ids)
          .eq("member_role", "main_instructor");
        (members || []).forEach((m: any) => { mainMap[m.company_id] = m.user_id; });
      }
      return (companies || []).map((c: any) => ({ id: c.id, name: c.name, main_instructor_id: mainMap[c.id] || null }));
    },
  });

  const { data: allTransactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("transactions" as any).select("id, display_id, user_id, type, course_id, subscription_tier, amount_paid, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: promotions = [], isLoading: promosLoading } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("promotions" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: faqItems = [], isLoading: faqLoading } = useQuery({
    queryKey: ["admin-faq"],
    queryFn: async () => {
      const { data, error } = await supabase.from("faq_items" as any).select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: partners = [], isLoading: partnersLoading } = useQuery({
    queryKey: ["admin-partners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("partners" as any).select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: recommendedCourses = [], isLoading: recLoading } = useQuery({
    queryKey: ["admin-recommended"],
    queryFn: async () => {
      const { data: recs, error } = await supabase.from("recommended_courses" as any).select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      if (!recs || recs.length === 0) return [];
      const courseIds = (recs as any[]).map((r: any) => r.course_id);
      const { data: courses } = await supabase.from("courses").select("id, title").in("id", courseIds);
      return (recs as any[]).map((r: any) => ({ ...r, course_title: courses?.find((c: any) => c.id === r.course_id)?.title || "Unknown" }));
    },
  });

  const { data: membershipPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["admin-membership-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("membership_plans" as any).select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  // Reviews query
  const { data: allReviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("course_reviews").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Imported review form state
  const [importedReview, setImportedReview] = useState<{ course_id: string; reviewer_name: string; rating: number; review_text: string; review_date: Date | undefined; }>({
    course_id: "", reviewer_name: "", rating: 5, review_text: "", review_date: new Date(),
  });
  const resetImportedReview = () => setImportedReview({ course_id: "", reviewer_name: "", rating: 5, review_text: "", review_date: new Date() });
  const { data: allCategories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  // Subcategories query
  const { data: allSubcategories = [] } = useQuery({
    queryKey: ["admin-subcategories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subcategories").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  // Course categories query
  const { data: allCourseCategories = [] } = useQuery({
    queryKey: ["admin-course-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("course_categories").select("*");
      if (error) throw error;
      return data as any[];
    },
  });

  // Course subcategories query
  const { data: allCourseSubcategories = [] } = useQuery({
    queryKey: ["admin-course-subcategories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("course_subcategories").select("*");
      if (error) throw error;
      return data as any[];
    },
  });

  // Course instructors query
  const { data: allCourseInstructors = [] } = useQuery({
    queryKey: ["admin-course-instructors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("course_instructors").select("*");
      if (error) throw error;
      return data as any[];
    },
  });

  // Bundles queries
  const { data: allBundles = [], isLoading: bundlesLoading } = useQuery({
    queryKey: ["admin-bundles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bundles" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: allBundleCourses = [] } = useQuery({
    queryKey: ["admin-bundle-courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bundle_courses" as any).select("*");
      if (error) throw error;
      return data as any[];
    },
  });
  const userMap = users.reduce((acc: any, u: any) => { acc[u.id] = u; return acc; }, {});

  const txCourseIds = [...new Set(allTransactions.filter((t: any) => t.course_id).map((t: any) => t.course_id))];
  const { data: txCourses = [] } = useQuery({
    queryKey: ["admin-tx-courses", txCourseIds],
    queryFn: async () => { if (txCourseIds.length === 0) return []; const { data, error } = await supabase.from("courses").select("id, title").in("id", txCourseIds); if (error) throw error; return data; },
    enabled: txCourseIds.length > 0,
  });
  const txCourseMap = txCourses.reduce((acc: any, c: any) => { acc[c.id] = c.title; return acc; }, {});
  const filteredTransactions = (() => {
    let rows = txFilter === "all"
      ? allTransactions
      : allTransactions.filter((t: any) => t.type === txFilter);
    if (!showTrials) {
      rows = rows.filter((t: any) => t.type !== "trial");
    }
    return rows;
  })();

  // Stripe subscriptions query (trials, active, canceled, etc.)
  const { data: stripeSubscriptions = [], isLoading: subsLoading } = useQuery({
    queryKey: ["admin-stripe-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("list-trials");
      if (error) throw error;
      return data?.trials || [];
    },
  });

  // Trials-only view (computed status per Stripe subscription)
  const { data: trialSubscriptions = [], isLoading: trialsLoading } = useQuery({
    queryKey: ["admin-trial-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("list-trial-subscriptions");
      if (error) throw error;
      return data?.trials || [];
    },
  });

  // Sync Stripe paid invoices into transactions table
  const [isSyncingStripeTx, setIsSyncingStripeTx] = useState(false);
  const syncStripeTx = async (silent: boolean) => {
    if (isSyncingStripeTx) return;
    setIsSyncingStripeTx(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-stripe-transactions");
      if (error) throw error;
      if (!silent) {
        const inserted = data?.inserted ?? 0;
        const unmatched = data?.unmatched ?? 0;
        toast.success(`Synced ${inserted} Stripe payment${inserted === 1 ? "" : "s"}${unmatched ? ` (${unmatched} unmatched)` : ""}`);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stripe-subscriptions"] });
    } catch (e: any) {
      if (!silent) toast.error(e.message || "Failed to sync Stripe payments");
    } finally {
      setIsSyncingStripeTx(false);
    }
  };

  // Auto-sync once whenever the Financials view is opened
  useEffect(() => {
    if (activeView === "financials") {
      syncStripeTx(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  // All courses map for review display
  const allCoursesMap = [...draftCourses, ...pendingCourses, ...publishedCourses].reduce((acc: any, c: any) => { acc[c.id] = c.title; return acc; }, {});

  // ── Mutations ──
  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole, roleId }: { userId: string; newRole: string; roleId?: string }) => {
      if (roleId) { const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("id", roleId); if (error) throw error; }
      else { const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any }); if (error) throw error; }
    },
    onSuccess: () => { toast.success("Role updated!"); queryClient.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e) => toast.error(e.message),
  });

  const deleteUser = useMutation({
    mutationFn: async ({ targetUserId, mode }: { targetUserId: string; mode: "soft" | "hard" }) => {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { targetUserId, mode },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setDeleteUserTarget(null);
      setDeleteConfirmText("");
      setDeleteMode("soft");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const approveCourse = useMutation({
    mutationFn: async (courseId: string) => {
      const settings = courseSettings[courseId]; if (!settings) throw new Error("Settings not found");
      const { error } = await supabase.from("courses").update({ status: "published" as any, is_published: true, access_type: settings.accessType, price_eur: settings.accessType === "one_off" ? settings.priceEur : 0, is_free: settings.accessType === "free" }).eq("id", courseId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Course approved!"); queryClient.invalidateQueries({ queryKey: ["admin-pending-courses"] }); },
    onError: (e) => toast.error(e.message),
  });

  const updatePublishedCourse = useMutation({
    mutationFn: async (courseId: string) => {
      const settings = publishedCourseSettings[courseId]; if (!settings) throw new Error("Settings not found");
      const { error } = await supabase.from("courses").update({ access_type: settings.accessType, price_eur: settings.accessType === "one_off" ? settings.priceEur : 0, is_free: settings.accessType === "free" }).eq("id", courseId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Course updated!"); queryClient.invalidateQueries({ queryKey: ["admin-published-courses"] }); },
    onError: (e) => toast.error(e.message),
  });

  const changeStatusToPending = useMutation({
    mutationFn: async (courseId: string) => { const { error } = await supabase.from("courses").update({ status: "pending_review" as any, is_published: false }).eq("id", courseId); if (error) throw error; },
    onSuccess: () => { toast.success("Moved to pending!"); queryClient.invalidateQueries({ queryKey: ["admin-published-courses"] }); queryClient.invalidateQueries({ queryKey: ["admin-pending-courses"] }); queryClient.invalidateQueries({ queryKey: ["admin-draft-courses"] }); },
    onError: (e) => toast.error(e.message),
  });

  const changeStatusToDraft = useMutation({
    mutationFn: async (courseId: string) => { const { error } = await supabase.from("courses").update({ status: "draft" as any, is_published: false }).eq("id", courseId); if (error) throw error; },
    onSuccess: () => { toast.success("Moved to draft!"); queryClient.invalidateQueries({ queryKey: ["admin-published-courses"] }); queryClient.invalidateQueries({ queryKey: ["admin-pending-courses"] }); queryClient.invalidateQueries({ queryKey: ["admin-draft-courses"] }); },
    onError: (e) => toast.error(e.message),
  });

  const deleteDraftCourse = useMutation({
    mutationFn: async (courseId: string) => {
      const { error: lesErr } = await supabase.from("lessons").delete().eq("course_id", courseId);
      if (lesErr) throw lesErr;
      const { error: modErr } = await supabase.from("modules").delete().eq("course_id", courseId);
      if (modErr) throw modErr;
      const { error: ccErr } = await supabase.from("course_categories").delete().eq("course_id", courseId);
      if (ccErr) throw ccErr;
      const { error: courseErr } = await supabase.from("courses").delete().eq("id", courseId);
      if (courseErr) throw courseErr;
    },
    onSuccess: () => { toast.success("Draft course deleted!"); queryClient.invalidateQueries({ queryKey: ["admin-draft-courses"] }); },
    onError: (e) => toast.error(e.message),
  });

  const updateCourseOwner = useMutation({
    mutationFn: async ({ courseId, kind, id, mainInstructorId }: { courseId: string; kind: "user" | "company"; id: string; mainInstructorId?: string | null }) => {
      const update: any = { owner_type: kind, owner_id: id };
      if (kind === "user") {
        update.instructor_id = id;
      } else if (mainInstructorId) {
        update.instructor_id = mainInstructorId;
      }
      const { error } = await supabase.from("courses").update(update).eq("id", courseId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Owner updated!"); queryClient.invalidateQueries({ queryKey: ["admin-draft-courses"] }); queryClient.invalidateQueries({ queryKey: ["admin-pending-courses"] }); queryClient.invalidateQueries({ queryKey: ["admin-published-courses"] }); },
    onError: (e) => toast.error(e.message),
  });

  const createPromotion = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("promotions" as any).insert({ type: "banner", content_html: newPromoContent, is_active: false, bg_color: newPromoBg, text_color: newPromoText, target_pages: newPromoPages ? newPromoPages.split(",").map((s: string) => s.trim()) : [] });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Promotion created!"); setNewPromoContent(""); setNewPromoPages(""); queryClient.invalidateQueries({ queryKey: ["admin-promotions"] }); },
    onError: (e) => toast.error(e.message),
  });

  const togglePromotion = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => { const { error } = await supabase.from("promotions" as any).update({ is_active: isActive }).eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-promotions"] }); queryClient.invalidateQueries({ queryKey: ["active-banners"] }); },
    onError: (e) => toast.error(e.message),
  });

  const deletePromotion = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("promotions" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted!"); queryClient.invalidateQueries({ queryKey: ["admin-promotions"] }); },
    onError: (e) => toast.error(e.message),
  });

  // Popup queries/mutations
  const { data: adminPopups = [] } = useQuery({
    queryKey: ["admin-popups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("popups" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createPopup = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("popups" as any).insert({
        type: popupType,
        heading: popupForm.heading,
        description: popupForm.description,
        button_text: popupForm.button_text,
        button_color: popupForm.button_color,
        button_text_color: popupForm.button_text_color,
        bg_color: popupForm.bg_color,
        text_color: popupForm.text_color,
        bg_image_url: popupForm.bg_image_url || null,
        image_url: popupForm.image_url || null,
        delay_seconds: popupForm.delay_seconds,
        target_pages: popupForm.target_pages ? popupForm.target_pages.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        promo_content_html: popupForm.promo_content_html,
        promo_link_url: popupForm.promo_link_url,
        input_border_color: popupForm.input_border_color,
        is_active: false,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pop-up created!"); resetPopupForm(); queryClient.invalidateQueries({ queryKey: ["admin-popups"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const updatePopup = useMutation({
    mutationFn: async () => {
      if (!editingPopupId) return;
      const { error } = await supabase.from("popups" as any).update({
        heading: popupForm.heading,
        description: popupForm.description,
        button_text: popupForm.button_text,
        button_color: popupForm.button_color,
        button_text_color: popupForm.button_text_color,
        bg_color: popupForm.bg_color,
        text_color: popupForm.text_color,
        bg_image_url: popupForm.bg_image_url || null,
        image_url: popupForm.image_url || null,
        delay_seconds: popupForm.delay_seconds,
        target_pages: popupForm.target_pages ? popupForm.target_pages.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        promo_content_html: popupForm.promo_content_html,
        promo_link_url: popupForm.promo_link_url,
        input_border_color: popupForm.input_border_color,
        updated_at: new Date().toISOString(),
      } as any).eq("id", editingPopupId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pop-up updated!"); resetPopupForm(); queryClient.invalidateQueries({ queryKey: ["admin-popups"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const togglePopup = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from("popups" as any).update({ is_active: isActive } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-popups"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const deletePopup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("popups" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pop-up deleted!"); queryClient.invalidateQueries({ queryKey: ["admin-popups"] }); },
    onError: (e: any) => toast.error(e.message),
  });


  const createFaq = useMutation({
    mutationFn: async () => {
      const maxOrder = faqItems.length > 0 ? Math.max(...faqItems.map((f: any) => f.sort_order)) + 1 : 1;
      const { error } = await supabase.from("faq_items" as any).insert({ question: newFaqQuestion, answer: newFaqAnswer, sort_order: maxOrder });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("FAQ item created!"); setNewFaqQuestion(""); setNewFaqAnswer(""); queryClient.invalidateQueries({ queryKey: ["admin-faq"] }); },
    onError: (e) => toast.error(e.message),
  });

  const updateFaq = useMutation({
    mutationFn: async ({ id, question, answer, sort_order, is_active }: { id: string; question?: string; answer?: string; sort_order?: number; is_active?: boolean }) => {
      const updates: any = {};
      if (question !== undefined) updates.question = question;
      if (answer !== undefined) updates.answer = answer;
      if (sort_order !== undefined) updates.sort_order = sort_order;
      if (is_active !== undefined) updates.is_active = is_active;
      const { error } = await supabase.from("faq_items" as any).update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("FAQ updated!"); setEditingFaqId(null); queryClient.invalidateQueries({ queryKey: ["admin-faq"] }); },
    onError: (e) => toast.error(e.message),
  });

  const deleteFaq = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("faq_items" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("FAQ deleted!"); queryClient.invalidateQueries({ queryKey: ["admin-faq"] }); },
    onError: (e) => toast.error(e.message),
  });

  const moveFaq = async (faqId: string, direction: "up" | "down") => {
    const idx = faqItems.findIndex((f: any) => f.id === faqId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= faqItems.length) return;
    const current = faqItems[idx] as any;
    const swap = faqItems[swapIdx] as any;
    await supabase.from("faq_items" as any).update({ sort_order: swap.sort_order }).eq("id", current.id);
    await supabase.from("faq_items" as any).update({ sort_order: current.sort_order }).eq("id", swap.id);
    queryClient.invalidateQueries({ queryKey: ["admin-faq"] });
  };

  // Partner mutations
  const createPartner = useMutation({
    mutationFn: async () => {
      const maxOrder = partners.length > 0 ? Math.max(...partners.map((p: any) => p.sort_order)) + 1 : 1;
      const { error } = await supabase.from("partners" as any).insert({ name: newPartnerName, logo_url: newPartnerLogo || null, website_url: newPartnerUrl || null, sort_order: maxOrder });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Partner added!"); setNewPartnerName(""); setNewPartnerLogo(""); setNewPartnerUrl(""); queryClient.invalidateQueries({ queryKey: ["admin-partners"] }); queryClient.invalidateQueries({ queryKey: ["landing-partners"] }); },
    onError: (e) => toast.error(e.message),
  });

  const updatePartner = useMutation({
    mutationFn: async ({ id, name, logo_url, website_url, is_active }: { id: string; name?: string; logo_url?: string; website_url?: string; is_active?: boolean }) => {
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (logo_url !== undefined) updates.logo_url = logo_url;
      if (website_url !== undefined) updates.website_url = website_url;
      if (is_active !== undefined) updates.is_active = is_active;
      const { error } = await supabase.from("partners" as any).update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Partner updated!"); setEditingPartnerId(null); queryClient.invalidateQueries({ queryKey: ["admin-partners"] }); queryClient.invalidateQueries({ queryKey: ["landing-partners"] }); },
    onError: (e) => toast.error(e.message),
  });

  const deletePartner = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("partners" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Partner deleted!"); queryClient.invalidateQueries({ queryKey: ["admin-partners"] }); queryClient.invalidateQueries({ queryKey: ["landing-partners"] }); },
    onError: (e) => toast.error(e.message),
  });

  // Recommended mutations
  const addRecommended = useMutation({
    mutationFn: async () => {
      const maxOrder = recommendedCourses.length > 0 ? Math.max(...recommendedCourses.map((r: any) => r.sort_order)) + 1 : 1;
      const { error } = await supabase.from("recommended_courses" as any).insert({ course_id: selectedRecommendedCourseId, sort_order: maxOrder });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Course added to recommended!"); setSelectedRecommendedCourseId(""); queryClient.invalidateQueries({ queryKey: ["admin-recommended"] }); queryClient.invalidateQueries({ queryKey: ["landing-recommended-courses"] }); },
    onError: (e) => toast.error(e.message),
  });

  const removeRecommended = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("recommended_courses" as any).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Removed!"); queryClient.invalidateQueries({ queryKey: ["admin-recommended"] }); queryClient.invalidateQueries({ queryKey: ["landing-recommended-courses"] }); },
    onError: (e) => toast.error(e.message),
  });

  // Pricing mutations
  const updatePlan = useMutation({
    mutationFn: async ({ id, price_eur, discount_ends_at, badge, trial_days }: { id: string; price_eur: number; discount_ends_at: string | null; badge: string | null; trial_days?: number }) => {
      const updateData: any = { price_eur, discount_ends_at, badge, updated_at: new Date().toISOString() };
      if (trial_days !== undefined) updateData.trial_days = trial_days;
      const { error } = await supabase.from("membership_plans" as any).update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Plan updated!"); setEditingPlanId(null); queryClient.invalidateQueries({ queryKey: ["admin-membership-plans"] }); queryClient.invalidateQueries({ queryKey: ["membership-plans"] }); },
    onError: (e) => toast.error(e.message),
  });

  const resetPlanPrice = useMutation({
    mutationFn: async (id: string) => {
      const plan = membershipPlans.find((p: any) => p.id === id);
      if (!plan) throw new Error("Plan not found");
      const { error } = await supabase.from("membership_plans" as any).update({ price_eur: plan.original_price_eur, discount_ends_at: null, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Price reset!"); queryClient.invalidateQueries({ queryKey: ["admin-membership-plans"] }); queryClient.invalidateQueries({ queryKey: ["membership-plans"] }); },
    onError: (e) => toast.error(e.message),
  });

  // Currency overrides query
  const { data: allCurrencyPrices = [] } = useQuery({
    queryKey: ["admin-currency-prices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("currency_prices" as any).select("*");
      if (error) throw error;
      return data as any[];
    },
  });

  // Initialize currency overrides when data loads
  useEffect(() => {
    if (allCurrencyPrices.length > 0) {
      const map: Record<string, Record<string, string>> = {};
      allCurrencyPrices.forEach((cp: any) => {
        if (!map[cp.plan_id]) map[cp.plan_id] = {};
        map[cp.plan_id][cp.currency_code] = String(cp.price);
      });
      setCurrencyOverrides(map);
    }
  }, [allCurrencyPrices]);

  const saveCurrencyOverride = useMutation({
    mutationFn: async ({ planId, currencyCode, price }: { planId: string; currencyCode: string; price: number | null }) => {
      if (price === null || isNaN(price)) {
        // Delete the override
        const { error } = await supabase.from("currency_prices" as any).delete().eq("plan_id", planId).eq("currency_code", currencyCode);
        if (error) throw error;
      } else {
        // Upsert
        const existing = allCurrencyPrices.find((cp: any) => cp.plan_id === planId && cp.currency_code === currencyCode);
        if (existing) {
          const { error } = await supabase.from("currency_prices" as any).update({ price }).eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("currency_prices" as any).insert({ plan_id: planId, currency_code: currencyCode, price });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => { toast.success("Currency price saved!"); queryClient.invalidateQueries({ queryKey: ["admin-currency-prices"] }); queryClient.invalidateQueries({ queryKey: ["currency-prices"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const forceResetPassword = useMutation({
    mutationFn: async (targetUserId: string) => {
      const { data, error } = await supabase.functions.invoke("force-reset-password", {
        body: { targetUserId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setResetPasswordTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  // Popup state
  const [popupType, setPopupType] = useState<"subscriber" | "promotional">("subscriber");
  const [popupForm, setPopupForm] = useState({
    heading: "", description: "", button_text: "Subscribe", button_color: "#C9A84C",
    button_text_color: "#FFFFFF", bg_color: "#FFFFFF", text_color: "#1A1A2E",
    bg_image_url: "", image_url: "", delay_seconds: 5, target_pages: "",
    promo_content_html: "", promo_link_url: "", input_border_color: "#D1D5DB",
  });
  const [editingPopupId, setEditingPopupId] = useState<string | null>(null);
  const resetPopupForm = () => {
    setPopupForm({ heading: "", description: "", button_text: "Subscribe", button_color: "#C9A84C", button_text_color: "#FFFFFF", bg_color: "#FFFFFF", text_color: "#1A1A2E", bg_image_url: "", image_url: "", delay_seconds: 5, target_pages: "", promo_content_html: "", promo_link_url: "", input_border_color: "#D1D5DB" });
    setEditingPopupId(null);
  };

  const toggleReviewApproval = useMutation({
    mutationFn: async ({ id, isApproved }: { id: string; isApproved: boolean }) => {
      const { error } = await supabase.from("course_reviews").update({ is_approved: isApproved }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }); queryClient.invalidateQueries({ queryKey: ["approved-reviews"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Review deleted!"); queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const createImportedReview = useMutation({
    mutationFn: async (payload: { course_id: string; reviewer_name: string; rating: number; review_text: string; review_date: Date }) => {
      const { error } = await supabase.from("course_reviews").insert({
        course_id: payload.course_id,
        reviewer_name: payload.reviewer_name.trim(),
        rating: payload.rating,
        review_text: payload.review_text.trim(),
        review_date: payload.review_date.toISOString(),
        source: "admin",
        student_id: null,
        is_approved: false,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review added as Pending. Approve it below to publish.");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Category mutations
  const createCategory = useMutation({
    mutationFn: async () => {
      const maxOrder = allCategories.length > 0 ? Math.max(...allCategories.map((c: any) => c.sort_order)) + 1 : 1;
      const slug = newCategorySlug || newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const { error } = await supabase.from("categories").insert({ name: newCategoryName, slug, sort_order: maxOrder });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Category created!"); setNewCategoryName(""); setNewCategorySlug(""); queryClient.invalidateQueries({ queryKey: ["admin-categories"] }); queryClient.invalidateQueries({ queryKey: ["navbar-categories"] }); queryClient.invalidateQueries({ queryKey: ["all-categories"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Category deleted!"); queryClient.invalidateQueries({ queryKey: ["admin-categories"] }); queryClient.invalidateQueries({ queryKey: ["navbar-categories"] }); queryClient.invalidateQueries({ queryKey: ["all-categories"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  // Subcategory mutations
  const createSubcategory = useMutation({
    mutationFn: async (categoryId: string) => {
      const subsInCat = allSubcategories.filter((s: any) => s.category_id === categoryId);
      const maxOrder = subsInCat.length > 0 ? Math.max(...subsInCat.map((s: any) => s.sort_order)) + 1 : 1;
      const slug = newSubcategorySlug || newSubcategoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const { error } = await supabase.from("subcategories").insert({ name: newSubcategoryName, slug, category_id: categoryId, sort_order: maxOrder });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Subcategory created!"); setNewSubcategoryName(""); setNewSubcategorySlug(""); queryClient.invalidateQueries({ queryKey: ["admin-subcategories"] }); queryClient.invalidateQueries({ queryKey: ["navbar-subcategories"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSubcategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subcategories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Subcategory deleted!"); queryClient.invalidateQueries({ queryKey: ["admin-subcategories"] }); queryClient.invalidateQueries({ queryKey: ["navbar-subcategories"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const addCourseCategory = useMutation({
    mutationFn: async ({ courseId, categoryId }: { courseId: string; categoryId: string }) => {
      const { error } = await supabase.from("course_categories").insert({ course_id: courseId, category_id: categoryId });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-course-categories"] }); queryClient.invalidateQueries({ queryKey: ["all-course-categories"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const removeCourseCategory = useMutation({
    mutationFn: async ({ courseId, categoryId }: { courseId: string; categoryId: string }) => {
      const { error } = await supabase.from("course_categories").delete().eq("course_id", courseId).eq("category_id", categoryId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-course-categories"] }); queryClient.invalidateQueries({ queryKey: ["all-course-categories"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  // Course subcategory mutations
  const addCourseSubcategory = useMutation({
    mutationFn: async ({ courseId, subcategoryId }: { courseId: string; subcategoryId: string }) => {
      const { error } = await supabase.from("course_subcategories").insert({ course_id: courseId, subcategory_id: subcategoryId });
      if (error) throw error;
      // Also ensure the parent category is assigned
      const sub = allSubcategories.find((s: any) => s.id === subcategoryId);
      if (sub) {
        const hasCat = allCourseCategories.some((cc: any) => cc.course_id === courseId && cc.category_id === sub.category_id);
        if (!hasCat) {
          await supabase.from("course_categories").insert({ course_id: courseId, category_id: sub.category_id });
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-course-subcategories"] }); queryClient.invalidateQueries({ queryKey: ["admin-course-categories"] }); queryClient.invalidateQueries({ queryKey: ["all-course-categories"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const removeCourseSubcategory = useMutation({
    mutationFn: async ({ courseId, subcategoryId }: { courseId: string; subcategoryId: string }) => {
      const { error } = await supabase.from("course_subcategories").delete().eq("course_id", courseId).eq("subcategory_id", subcategoryId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-course-subcategories"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  // Course instructor mutations
  const addCourseInstructor = useMutation({
    mutationFn: async ({ courseId, userId }: { courseId: string; userId: string }) => {
      const { error } = await supabase.from("course_instructors").insert({ course_id: courseId, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Instructor added!"); queryClient.invalidateQueries({ queryKey: ["admin-course-instructors"] }); setAddInstructorCourseId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const removeCourseInstructor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_instructors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Instructor removed!"); queryClient.invalidateQueries({ queryKey: ["admin-course-instructors"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  // Schedule publish mutation
  const schedulePublish = useMutation({
    mutationFn: async ({ courseId, publishAt }: { courseId: string; publishAt: string }) => {
      const settings = courseSettings[courseId]; if (!settings) throw new Error("Settings not found");
      const { error } = await supabase.from("courses").update({
        scheduled_publish_at: publishAt,
        access_type: settings.accessType,
        price_eur: settings.accessType === "one_off" ? settings.priceEur : 0,
        is_free: settings.accessType === "free",
      } as any).eq("id", courseId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Course scheduled for publication!"); setSchedulingCourseId(null); setScheduledPublishDate(undefined); queryClient.invalidateQueries({ queryKey: ["admin-pending-courses"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  // Course SEO mutation
  const updateCourseSeo = useMutation({
    mutationFn: async ({ courseId, meta_title, meta_description }: { courseId: string; meta_title: string; meta_description: string }) => {
      const { error } = await supabase.from("courses").update({ meta_title: meta_title || null, meta_description: meta_description || null } as any).eq("id", courseId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Course SEO updated!"); setCourseSeoEditing(null); queryClient.invalidateQueries({ queryKey: ["admin-published-courses"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  // Category SEO mutation
  const updateCategorySeo = useMutation({
    mutationFn: async ({ categoryId, meta_title, meta_description }: { categoryId: string; meta_title: string; meta_description: string }) => {
      const { error } = await supabase.from("categories").update({ meta_title: meta_title || null, meta_description: meta_description || null } as any).eq("id", categoryId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Category SEO updated!"); setCategorySeoEditing(null); queryClient.invalidateQueries({ queryKey: ["admin-categories"] }); queryClient.invalidateQueries({ queryKey: ["all-categories"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  // Bundle mutations
  const createBundle = useMutation({
    mutationFn: async () => {
      const slug = newBundleSlug || newBundleTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const { error } = await supabase.from("bundles" as any).insert({ title: newBundleTitle, slug, description: newBundleDesc || null, price_eur: newBundlePrice });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Bundle created!"); setNewBundleTitle(""); setNewBundleSlug(""); setNewBundleDesc(""); setNewBundlePrice(0); queryClient.invalidateQueries({ queryKey: ["admin-bundles"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateBundle = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; slug?: string; description?: string; price_eur?: number; is_active?: boolean; meta_title?: string; meta_description?: string; page_content?: string }) => {
      const { error } = await supabase.from("bundles" as any).update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Bundle updated!"); setEditingBundleId(null); queryClient.invalidateQueries({ queryKey: ["admin-bundles"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteBundle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bundles" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Bundle deleted!"); queryClient.invalidateQueries({ queryKey: ["admin-bundles"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const addBundleCourse = useMutation({
    mutationFn: async ({ bundleId, courseId }: { bundleId: string; courseId: string }) => {
      const { error } = await supabase.from("bundle_courses" as any).insert({ bundle_id: bundleId, course_id: courseId });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-bundle-courses"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const removeBundleCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bundle_courses" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-bundle-courses"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  // State for admin category hover in subcategory picker
  const [hoveredAdminCatId, setHoveredAdminCatId] = useState<string | null>(null);

  // Helper to render subcategory chips for a course (used in approvals/published)
  const renderSubcategoryChips = (courseId: string) => {
    const assigned = allCourseSubcategories.filter((cs: any) => cs.course_id === courseId);
    const assignedSubIds = new Set(assigned.map((cs: any) => cs.subcategory_id));
    return (
      <div className="space-y-2">
        <Label className="text-xs">Subcategories</Label>
        <div className="flex flex-wrap gap-1.5">
          {assigned.map((cs: any) => {
            const sub = allSubcategories.find((s: any) => s.id === cs.subcategory_id);
            const cat = sub ? allCategories.find((c: any) => c.id === sub.category_id) : null;
            return sub ? (
              <Badge key={cs.id} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeCourseSubcategory.mutate({ courseId, subcategoryId: sub.id })}>
                {cat ? `${cat.name} › ` : ""}{sub.name} <span className="text-destructive">×</span>
              </Badge>
            ) : null;
          })}
        </div>
        {categoryDropdownCourse === courseId ? (
          <div className="relative">
            <div className="border border-border rounded-lg bg-card shadow-lg overflow-hidden">
              <div className="flex min-h-[200px] max-h-[320px]">
                {/* Left: Categories */}
                <div className="w-48 border-r border-border overflow-y-auto">
                  {allCategories.map((cat: any) => {
                    const subs = allSubcategories.filter((s: any) => s.category_id === cat.id);
                    const isHovered = hoveredAdminCatId === cat.id;
                    return (
                      <div
                        key={cat.id}
                        className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors ${isHovered ? "bg-muted text-primary font-medium" : "text-foreground hover:bg-muted/60"}`}
                        onMouseEnter={() => setHoveredAdminCatId(cat.id)}
                      >
                        <span>{cat.name}</span>
                        {subs.length > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                    );
                  })}
                </div>
                {/* Right: Subcategories */}
                <div className="flex-1 overflow-y-auto p-3">
                  {hoveredAdminCatId ? (() => {
                    const subs = allSubcategories.filter((s: any) => s.category_id === hoveredAdminCatId && !assignedSubIds.has(s.id));
                    const catName = allCategories.find((c: any) => c.id === hoveredAdminCatId)?.name;
                    if (subs.length === 0) return (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        {allSubcategories.some((s: any) => s.category_id === hoveredAdminCatId) ? "All subcategories assigned" : "No subcategories"}
                      </div>
                    );
                    return (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{catName}</p>
                        <div className="grid grid-cols-1 gap-0.5">
                          {subs.map((sub: any) => (
                            <div
                              key={sub.id}
                              className="px-3 py-2 text-sm text-foreground hover:bg-muted hover:text-primary rounded-md transition-colors cursor-pointer"
                              onClick={() => addCourseSubcategory.mutate({ courseId, subcategoryId: sub.id })}
                            >
                              {sub.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      Hover a category to see subcategories
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-xs mt-1" onClick={() => { setCategoryDropdownCourse(null); setHoveredAdminCatId(null); }}>Done</Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => setCategoryDropdownCourse(courseId)}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        )}
      </div>
    );
  };

  // Helper to render multi-instructor management for a course
  const renderCourseInstructors = (courseId: string, primaryInstructorId: string) => {
    const additionalInstructors = allCourseInstructors.filter((ci: any) => ci.course_id === courseId);
    const assignedUserIds = new Set([primaryInstructorId, ...additionalInstructors.map((ci: any) => ci.user_id)]);
    const availableInstructors = instructorsList.filter((u: any) => !assignedUserIds.has(u.id));
    return (
      <div className="space-y-2">
        <Label className="text-xs">Instructors</Label>
        <div className="flex flex-wrap gap-1.5 items-center">
          <Badge variant="default" className="gap-1">
            {userMap[primaryInstructorId]?.first_name || "Unknown"} {userMap[primaryInstructorId]?.last_name || ""} <span className="text-xs opacity-70">(primary)</span>
          </Badge>
          {additionalInstructors.map((ci: any) => (
            <Badge key={ci.id} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeCourseInstructor.mutate(ci.id)}>
              {userMap[ci.user_id]?.first_name || "Unknown"} {userMap[ci.user_id]?.last_name || ""} <span className="text-destructive">×</span>
            </Badge>
          ))}
          {addInstructorCourseId === courseId ? (
            <Select onValueChange={(uid) => { addCourseInstructor.mutate({ courseId, userId: uid }); }}>
              <SelectTrigger className="w-[180px] h-7 text-xs"><SelectValue placeholder="Add instructor..." /></SelectTrigger>
              <SelectContent>{availableInstructors.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.first_name || ""} {u.last_name || ""}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => setAddInstructorCourseId(courseId)}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Helper to render category chips for a course (legacy - kept for compatibility)
  const renderCategoryChips = (courseId: string) => {
    const assigned = allCourseCategories.filter((cc: any) => cc.course_id === courseId);
    const assignedCatIds = new Set(assigned.map((cc: any) => cc.category_id));
    const unassigned = allCategories.filter((c: any) => !assignedCatIds.has(c.id));
    return (
      <div className="space-y-2">
        <Label className="text-xs">Categories</Label>
        <div className="flex flex-wrap gap-1.5">
          {assigned.map((cc: any) => {
            const cat = allCategories.find((c: any) => c.id === cc.category_id);
            return cat ? (
              <Badge key={cc.id} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeCourseCategory.mutate({ courseId, categoryId: cat.id })}>
                {cat.name} <span className="text-destructive">×</span>
              </Badge>
            ) : null;
          })}
          {categoryDropdownCourse === courseId ? (
            <Select onValueChange={(catId) => { addCourseCategory.mutate({ courseId, categoryId: catId }); setCategoryDropdownCourse(null); }}>
              <SelectTrigger className="w-[180px] h-7 text-xs"><SelectValue placeholder="Add category..." /></SelectTrigger>
              <SelectContent>{unassigned.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => setCategoryDropdownCourse(courseId)}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          )}
        </div>
      </div>
    );
  };

  const handleLogout = async () => { await signOut(); navigate("/"); };
  const updateCourseSettings = (courseId: string, field: "accessType" | "priceEur", value: string | number) => setCourseSettings((prev) => ({ ...prev, [courseId]: { ...prev[courseId], [field]: value } }));
  const updatePublishedCourseSettings = (courseId: string, field: "accessType" | "priceEur", value: string | number) => setPublishedCourseSettings((prev) => ({ ...prev, [courseId]: { ...prev[courseId], [field]: value } }));

  // Instructors list for reassignment
  const instructorsList = users.filter((u: any) => u.role === "instructor");

  // Available courses for recommended (exclude already recommended)
  const recCourseIds = new Set(recommendedCourses.map((r: any) => r.course_id));
  const availableForRecommended = publishedCourses.filter((c: any) => !recCourseIds.has(c.id));

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalNavbar hideOnScroll={false} />
      <SidebarProvider>
        <div className="flex-1 flex w-full dashboard-sidebar-offset">
          <AdminSidebar activeView={activeView} setActiveView={setActiveView} customPages={customAnalyticsPages} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b px-4 bg-card">
            <SidebarTrigger className="mr-4" />
            <span className="text-sm text-muted-foreground">Admin Panel</span>
            <div className="ml-auto"><button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><LogOut className="h-4 w-4" /> Log out</button></div>
          </header>
          <main className="flex-1 p-6 md:p-8">

            {/* ── Users ── */}
            {activeView === "users" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <Tabs value={userRoleFilter} onValueChange={(v) => setUserRoleFilter(v as any)}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="student">Students</TabsTrigger>
                    <TabsTrigger value="instructor">Instructors</TabsTrigger>
                    <TabsTrigger value="admin">Admins</TabsTrigger>
                    <TabsTrigger value="webadmin">Webadmins</TabsTrigger>
                    <TabsTrigger value="pending-invite">
                      Pending Invite
                      {users.filter((u: any) => u.invite_sent === false).length > 0 && (
                        <Badge className="ml-1.5 px-1.5 py-0 text-[10px] bg-warning text-warning-foreground hover:bg-warning/90">
                          {users.filter((u: any) => u.invite_sent === false).length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                {(() => {
                  const filteredUsers = users.filter((u: any) => {
                    if (userRoleFilter === "pending-invite") return u.invite_sent === false;
                    return userRoleFilter === "all" || u.role === userRoleFilter;
                  });
                  const pendingInviteUsers = filteredUsers.filter((u: any) => u.invite_sent === false);
                  return <>
                    {userRoleFilter === "pending-invite" && pendingInviteUsers.length > 0 && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={bulkSendingInvites}
                          onClick={async () => {
                            setBulkSendingInvites(true);
                            try {
                              const ids = pendingInviteUsers.map((u: any) => u.id);
                              const { data, error } = await supabase.functions.invoke("send-invite", {
                                body: { user_ids: ids, redirect_url: window.location.origin },
                              });
                              if (error) throw error;
                              if (data?.error) throw new Error(data.error);
                              if (data?.sent === 0) {
                                const firstError = data?.results?.find((result: any) => !result.success)?.error;
                                throw new Error(firstError || "No invite emails were sent");
                              }
                              toast.success(`Sent ${data.sent} of ${data.total} invite emails`);
                              queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                            } catch (err: any) {
                              toast.error(err.message || "Failed to send invites");
                            } finally {
                              setBulkSendingInvites(false);
                            }
                          }}
                        >
                          {bulkSendingInvites && <Loader2 className="h-4 w-4 animate-spin" />}
                          <Mail className="h-4 w-4" />
                          Send All Pending Invites ({pendingInviteUsers.length})
                        </Button>
                      </div>
                    )}
                {usersLoading ? <p className="text-muted-foreground">Loading...</p> : (
                  <Card className="overflow-x-auto"><Table className="min-w-[900px]"><TableHeader><TableRow>
                    <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Created</TableHead><TableHead>Status</TableHead><TableHead>Current Role</TableHead><TableHead>Change Role</TableHead><TableHead>Actions</TableHead>
                  </TableRow></TableHeader><TableBody>
                    {filteredUsers.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium text-muted-foreground">#{u.display_id}</TableCell>
                        <TableCell className="font-medium">{(() => { const name = u.instructor_type === "company" && u.company_name?.trim() ? u.company_name.trim() : `${u.first_name || ""} ${u.last_name || ""}`.trim(); const display = name || <span className="text-muted-foreground italic">No name</span>; return <Link to={`/instructor/${u.id}`} className="hover:underline hover:text-primary transition-colors">{display}</Link>; })()}</TableCell>
                        <TableCell className="text-muted-foreground text-base">{u.email || <span className="italic">—</span>}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(u.user_created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {u.invite_sent === false ? (
                            <span className="inline-flex items-center gap-2 text-warning font-medium">
                              <span className="h-2 w-2 rounded-full bg-warning" />
                              Invite Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 text-success font-medium">
                              <span className="h-2 w-2 rounded-full bg-success" />
                              Active
                            </span>
                          )}
                        </TableCell>
                        <TableCell><Badge variant="outline" className="rounded-md bg-muted/40 border-border text-foreground font-normal capitalize">{u.role}</Badge></TableCell>
                        <TableCell>
                          <Select value={u.role} onValueChange={(val) => updateRole.mutate({ userId: u.id, newRole: val, roleId: u.role_id })}>
                            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="student">Student</SelectItem><SelectItem value="instructor">Instructor</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="webadmin">Webadmin</SelectItem></SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="flex gap-1">
                          {u.invite_sent === false && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={sendingInviteIds.has(u.id)}
                                    onClick={async () => {
                                      setSendingInviteIds((prev) => new Set(prev).add(u.id));
                                      try {
                                        const { data, error } = await supabase.functions.invoke("send-invite", {
                                          body: { user_ids: [u.id], redirect_url: window.location.origin },
                                        });
                                        if (error) throw error;
                                        if (data?.error) throw new Error(data.error);
                                        if (data?.sent === 0) {
                                          const firstError = data?.results?.find((result: any) => !result.success)?.error;
                                          throw new Error(firstError || "No invite emails were sent");
                                        }
                                        toast.success(`Invite email sent to ${u.email}`);
                                        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                                      } catch (err: any) {
                                        toast.error(err.message || "Failed to send invite");
                                      } finally {
                                        setSendingInviteIds((prev) => { const n = new Set(prev); n.delete(u.id); return n; });
                                      }
                                    }}
                                  >
                                    {sendingInviteIds.has(u.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Send Setup Email</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Button variant="ghost" size="icon" title="Edit Profile" onClick={() => setEditProfileTarget({ id: u.id, role: u.role, company: u.company || null })}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Reset Password" onClick={() => { const dn = u.instructor_type === "company" && u.company_name?.trim() ? u.company_name.trim() : `${u.first_name || ""} ${u.last_name || ""}`.trim(); setResetPasswordTarget({ id: u.id, name: dn || u.email || "this user" }); }}>
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { const dn = u.instructor_type === "company" && u.company_name?.trim() ? u.company_name.trim() : `${u.first_name || ""} ${u.last_name || ""}`.trim(); setDeleteUserTarget({ id: u.id, name: dn || u.email || "this user" }); setDeleteMode("soft"); setDeleteConfirmText(""); }}>
                            <UserX className="h-4 w-4" />
                          </Button>
                          {u.company && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" asChild>
                                    <Link to={`/instructor/${u.company.id}`}>
                                      <Building2 className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View {u.company.name}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody></Table></Card>
                )}
                </>;
                })()}
                {/* Delete User Dialog */}
                <Dialog open={!!deleteUserTarget} onOpenChange={(open) => { if (!open) { setDeleteUserTarget(null); setDeleteConfirmText(""); setDeleteMode("soft"); } }}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2"><UserX className="h-5 w-5 text-destructive" /> Delete User</DialogTitle>
                      <DialogDescription>Choose how to handle <span className="font-semibold">{deleteUserTarget?.name}</span>'s account.</DialogDescription>
                    </DialogHeader>
                    <RadioGroup value={deleteMode} onValueChange={(v) => setDeleteMode(v as "soft" | "hard")} className="space-y-3 my-2">
                      <label className={cn("flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors", deleteMode === "soft" ? "border-primary bg-primary/5" : "border-border")}>
                        <RadioGroupItem value="soft" className="mt-0.5" />
                        <div>
                          <div className="font-medium flex items-center gap-1.5"><Ban className="h-4 w-4" /> Disable Account</div>
                          <p className="text-sm text-muted-foreground mt-1">Block the user from logging in. All their data (courses, progress, enrollments) is kept intact and can be restored later.</p>
                        </div>
                      </label>
                      <label className={cn("flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors", deleteMode === "hard" ? "border-destructive bg-destructive/5" : "border-border")}>
                        <RadioGroupItem value="hard" className="mt-0.5" />
                        <div>
                          <div className="font-medium flex items-center gap-1.5 text-destructive"><Trash2 className="h-4 w-4" /> Permanently Delete</div>
                          <p className="text-sm text-muted-foreground mt-1">Permanently remove the user and <strong>all</strong> associated data including courses they created, enrollments, progress, reviews, and transactions. This cannot be undone.</p>
                        </div>
                      </label>
                    </RadioGroup>
                    {deleteMode === "hard" && (
                      <div className="space-y-2">
                        <Label className="text-sm">Type <span className="font-mono font-semibold">DELETE</span> to confirm:</Label>
                        <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" className="font-mono" />
                      </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button variant="outline" onClick={() => { setDeleteUserTarget(null); setDeleteConfirmText(""); }}>Cancel</Button>
                      <Button variant="destructive" disabled={deleteUser.isPending || (deleteMode === "hard" && deleteConfirmText !== "DELETE")} onClick={() => { if (deleteUserTarget) deleteUser.mutate({ targetUserId: deleteUserTarget.id, mode: deleteMode }); }}>
                        {deleteUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        {deleteMode === "soft" ? "Disable User" : "Delete Permanently"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {/* Force Reset Password Dialog */}
                <Dialog open={!!resetPasswordTarget} onOpenChange={(open) => { if (!open) setResetPasswordTarget(null); }}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Reset Password</DialogTitle>
                      <DialogDescription>Send a password reset email to <span className="font-semibold">{resetPasswordTarget?.name}</span>. They will receive a link to set a new password.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button variant="outline" onClick={() => setResetPasswordTarget(null)}>Cancel</Button>
                      <Button onClick={() => { if (resetPasswordTarget) forceResetPassword.mutate(resetPasswordTarget.id); }} disabled={forceResetPassword.isPending}>
                        {forceResetPassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Send Reset Email
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <EditUserProfileDialog
                  userId={editProfileTarget?.id ?? null}
                  userRole={editProfileTarget?.role ?? null}
                  company={editProfileTarget?.company ?? null}
                  open={!!editProfileTarget}
                  onOpenChange={(o) => { if (!o) setEditProfileTarget(null); }}
                />
              </div>
            )}

            {/* ── Subscribers ── */}
            {activeView === "subscribers" && <SubscribersManager />}

            {/* ── Subscriber Analytics ── */}
            {activeView === "subscriber-analytics" && <SubscriberAnalytics />}

            {/* ── Create Users ── */}
            {activeView === "create-users" && (
              <div className="space-y-8">
                <h1 className="text-3xl font-bold tracking-tight">Create Users</h1>

                {/* Manual Creation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Create User Manually</CardTitle>
                    <CardDescription>Create a new user account. You can choose whether to send the setup email now or later.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Role first */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div className="space-y-2">
                        <Label>Role *</Label>
                        <Select value={newUserRole} onValueChange={(v) => { setNewUserRole(v); if (v !== "instructor") setNewUserInstructorType("individual"); }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="instructor">Instructor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="webadmin">Webadmin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newUserRole === "instructor" && (
                        <div className="space-y-2">
                          <Label className="block">Instructor type *</Label>
                          <div className="inline-flex h-10 items-center rounded-md border p-1 gap-1 w-fit">
                            <Button type="button" variant={newUserInstructorType === "individual" ? "default" : "ghost"} onClick={() => setNewUserInstructorType("individual")} className="h-8 px-3 text-xs font-normal normal-case">Individual</Button>
                            <Button type="button" variant={newUserInstructorType === "company" ? "default" : "ghost"} onClick={() => setNewUserInstructorType("company")} className="h-8 px-3 text-xs font-normal normal-case">Company</Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {newUserRole === "instructor" && newUserInstructorType === "company" ? (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label>Company Name *</Label>
                          <Input value={newUserCompanyName} onChange={(e) => setNewUserCompanyName(e.target.value)} placeholder="Acme Inc." />
                        </div>

                        <div className="space-y-4">
                          {companyInstructors.map((ins, idx) => (
                            <Card key={idx} className="bg-muted/20">
                              <CardContent className="pt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium">
                                    {idx === 0 ? "Main Instructor" : `Instructor ${idx + 1}`}
                                  </div>
                                  {idx > 0 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setCompanyInstructors((prev) => prev.filter((_, i) => i !== idx))}
                                      aria-label="Remove instructor"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label>First Name *</Label>
                                    <Input value={ins.first_name} onChange={(e) => setCompanyInstructors((prev) => prev.map((p, i) => i === idx ? { ...p, first_name: e.target.value } : p))} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label>Last Name *</Label>
                                    <Input value={ins.last_name} onChange={(e) => setCompanyInstructors((prev) => prev.map((p, i) => i === idx ? { ...p, last_name: e.target.value } : p))} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label>Email *</Label>
                                    <Input type="email" value={ins.email} onChange={(e) => setCompanyInstructors((prev) => prev.map((p, i) => i === idx ? { ...p, email: e.target.value } : p))} />
                                  </div>
                                  <div className="space-y-1">
                                    <Label>Country *</Label>
                                    <Input value={ins.country} onChange={(e) => setCompanyInstructors((prev) => prev.map((p, i) => i === idx ? { ...p, country: e.target.value } : p))} />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCompanyInstructors((prev) => [...prev, { first_name: "", last_name: "", email: "", country: "" }])}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" /> Add another instructor
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>First Name *</Label>
                          <Input value={newUserFirstName} onChange={(e) => setNewUserFirstName(e.target.value)} placeholder="John" />
                        </div>
                        <div className="space-y-2">
                          <Label>Last Name *</Label>
                          <Input value={newUserLastName} onChange={(e) => setNewUserLastName(e.target.value)} placeholder="Doe" />
                        </div>
                        <div className="space-y-2">
                          <Label>Email *</Label>
                          <Input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="john@example.com" />
                        </div>
                        <div className="space-y-2">
                          <Label>Country *</Label>
                          <Input value={newUserCountry} onChange={(e) => setNewUserCountry(e.target.value)} placeholder="United States" />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3 pt-2">
                      <Switch id="send-invite" checked={newUserSendInvite} onCheckedChange={setNewUserSendInvite} />
                      <Label htmlFor="send-invite" className="cursor-pointer">Send setup email now</Label>
                      {!newUserSendInvite && <span className="text-sm text-muted-foreground">(You can send it later from User Management)</span>}
                    </div>
                    {(() => {
                      const isCompany = newUserRole === "instructor" && newUserInstructorType === "company";
                      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      let disabled = createUserLoading;
                      if (isCompany) {
                        const allFilled = companyInstructors.length > 0 && companyInstructors.every(i => i.first_name.trim() && i.last_name.trim() && emailRe.test(i.email.trim()) && i.country.trim());
                        const emails = companyInstructors.map(i => i.email.trim().toLowerCase());
                        const uniqueEmails = new Set(emails).size === emails.length;
                        disabled = disabled || !newUserCompanyName.trim() || !allFilled || !uniqueEmails;
                      } else {
                        disabled = disabled || !newUserFirstName.trim() || !newUserLastName.trim() || !newUserEmail.trim() || !newUserCountry.trim();
                      }
                      return (
                        <Button
                          disabled={disabled}
                          onClick={async () => {
                            setCreateUserLoading(true);
                            try {
                              if (isCompany) {
                                const { data, error } = await supabase.functions.invoke("create-company-with-instructors", {
                                  body: {
                                    company_name: newUserCompanyName.trim(),
                                    instructors: companyInstructors.map(i => ({
                                      first_name: i.first_name.trim(),
                                      last_name: i.last_name.trim(),
                                      email: i.email.trim(),
                                      country: i.country.trim(),
                                    })),
                                    send_invite: newUserSendInvite,
                                    redirect_url: window.location.origin,
                                  },
                                });
                                if (error) throw error;
                                if (data?.error) throw new Error(data.error);
                                const results = data?.results || [];
                                const ok = results.filter((r: any) => r.success).length;
                                const fail = results.length - ok;
                                if (fail === 0) {
                                  toast.success(`Company created with ${ok} instructor${ok === 1 ? "" : "s"}${newUserSendInvite ? " — invite emails sent" : ""}`);
                                } else {
                                  const failed = results.filter((r: any) => !r.success).map((r: any) => `${r.email}: ${r.error}`).join("; ");
                                  toast.error(`${ok} created, ${fail} failed — ${failed}`);
                                }
                                setNewUserCompanyName("");
                                setCompanyInstructors([{ first_name: "", last_name: "", email: "", country: "" }]);
                                setNewUserRole("student");
                                setNewUserInstructorType("individual");
                                setNewUserSendInvite(true);
                              } else {
                                const body: any = {
                                  email: newUserEmail.trim(),
                                  country: newUserCountry.trim(),
                                  role: newUserRole,
                                  redirect_url: window.location.origin,
                                  send_invite: newUserSendInvite,
                                  first_name: newUserFirstName.trim(),
                                  last_name: newUserLastName.trim(),
                                };
                                if (newUserRole === "instructor") body.instructor_type = "individual";
                                const { data, error } = await supabase.functions.invoke("create-user", { body });
                                if (error) throw error;
                                if (data?.error) throw new Error(data.error);
                                toast.success(newUserSendInvite ? `User created! An email has been sent to ${newUserEmail.trim()}` : `User created! No email was sent — you can send it later.`);
                                setNewUserFirstName(""); setNewUserLastName(""); setNewUserEmail(""); setNewUserCountry(""); setNewUserRole("student"); setNewUserInstructorType("individual"); setNewUserSendInvite(true);
                              }
                              queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                            } catch (err: any) {
                              toast.error(err.message || "Failed to create user");
                            } finally {
                              setCreateUserLoading(false);
                            }
                          }}
                          className="gap-2"
                        >
                          {createUserLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                          {isCompany ? "Create Company & Instructors" : "Create User"}
                        </Button>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* CSV Import */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Import Users via CSV</CardTitle>
                    <CardDescription>Upload a CSV file with user data. Each row will create a new user account.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        const csv = "first_name,last_name,email,country,role\nJohn,Doe,john@example.com,United States,student\n";
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url; a.download = "user_import_template.csv"; a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="h-4 w-4" /> Download Template
                    </Button>
                    <div className="space-y-2">
                      <Label>Upload CSV File</Label>
                      <Input type="file" accept=".csv" onChange={(e) => { setCsvFile(e.target.files?.[0] || null); setCsvResults([]); }} />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch id="csv-send-invite" checked={csvSendInvite} onCheckedChange={setCsvSendInvite} />
                      <Label htmlFor="csv-send-invite" className="cursor-pointer">Send setup email to imported users</Label>
                    </div>
                    {csvFile && (
                      <Button
                        disabled={csvImporting}
                        onClick={async () => {
                          setCsvImporting(true);
                          setCsvResults([]);
                          const text = await csvFile.text();
                          const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
                          if (lines.length < 2) { toast.error("CSV must have a header row and at least one data row"); setCsvImporting(false); return; }
                          const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
                          const requiredCols = ["first_name", "last_name", "email", "country", "role"];
                          const missing = requiredCols.filter((c) => !headers.includes(c));
                          if (missing.length > 0) { toast.error(`Missing columns: ${missing.join(", ")}`); setCsvImporting(false); return; }
                          const results: { email: string; success: boolean; error?: string }[] = [];
                          for (let i = 1; i < lines.length; i++) {
                            const values = lines[i].split(",").map((v) => v.trim());
                            const row: Record<string, string> = {};
                            headers.forEach((h, idx) => { row[h] = values[idx] || ""; });
                            if (!row.email) { results.push({ email: `Row ${i + 1}`, success: false, error: "Missing email" }); continue; }
                            if (!row.first_name || !row.last_name || !row.country || !row.role) {
                              results.push({ email: row.email, success: false, error: "Missing required fields" }); continue;
                            }
                            try {
                              const { data, error } = await supabase.functions.invoke("create-user", {
                                body: { email: row.email, first_name: row.first_name, last_name: row.last_name, country: row.country, role: row.role, redirect_url: window.location.origin, send_invite: csvSendInvite },
                              });
                              if (error) throw error;
                              if (data?.error) throw new Error(data.error);
                              results.push({ email: row.email, success: true });
                            } catch (err: any) {
                              results.push({ email: row.email, success: false, error: err.message });
                            }
                          }
                          setCsvResults(results);
                          setCsvImporting(false);
                          queryClient.invalidateQueries({ queryKey: ["admin-users"] });
                          const successCount = results.filter((r) => r.success).length;
                          toast.success(`Imported ${successCount} of ${results.length} users`);
                        }}
                        className="gap-2"
                      >
                        {csvImporting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Import Users
                      </Button>
                    )}
                    {csvResults.length > 0 && (
                      <Card className="bg-muted/30">
                        <CardContent className="pt-4">
                          <Table>
                            <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {csvResults.map((r, i) => (
                                <TableRow key={i}>
                                  <TableCell className="text-sm">{r.email}</TableCell>
                                  <TableCell><Badge variant={r.success ? "secondary" : "destructive"}>{r.success ? "Success" : "Failed"}</Badge></TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{r.error || (csvSendInvite ? "Created & email sent" : "Created (no email sent)")}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── Drafts ── */}
            {activeView === "drafts" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Draft Courses</h1>
                {draftsLoading ? <p className="text-muted-foreground">Loading...</p> : draftCourses.length === 0 ? <p className="text-muted-foreground">No draft courses.</p> : (
                  <div className="space-y-4">
                    {draftCourses.map((c: any) => (
                      <Card key={c.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Course #{c.display_id} · by {userMap[c.instructor_id]?.first_name || "Unknown"} {userMap[c.instructor_id]?.last_name || ""}</div>
                              <CardTitle className="text-lg">{c.title}</CardTitle>
                               <CardDescription className="mt-1">{c.description ? stripHtml(c.description) : "No description"}</CardDescription>
                            </div>
                            <Badge variant="secondary">Draft</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Assign Instructor</Label>
                            <OwnerPicker
                              instructors={instructorsList as any}
                              companies={instructorCompanies as any}
                              ownerType={c.owner_type}
                              ownerId={c.owner_id}
                              instructorId={c.instructor_id}
                              onSelect={(sel) => updateCourseOwner.mutate({ courseId: c.id, kind: sel.kind, id: sel.id, mainInstructorId: sel.kind === "company" ? sel.mainInstructorId : undefined })}
                            />
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button variant="outline" size="sm" onClick={() => window.open(`/courses/${c.id}`, "_blank", "noopener,noreferrer")} className="gap-1"><Eye className="h-3.5 w-3.5" /> Preview</Button>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/instructor?editCourse=${c.id}`)} className="gap-1"><Pencil className="h-3.5 w-3.5" /> Edit Course</Button>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/instructor?tab=manage-lessons&course=${c.id}`)} className="gap-1"><BookOpen className="h-3.5 w-3.5" /> Manage Lessons</Button>
                            <Button variant="outline" size="sm" onClick={() => changeStatusToPending.mutate(c.id)} disabled={changeStatusToPending.isPending} className="gap-1"><RotateCcw className="h-3.5 w-3.5" /> Move to Pending</Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="gap-1"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Draft Course</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete "{c.title}" and all its modules and lessons. This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteDraftCourse.mutate(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Approvals ── */}
            {activeView === "approvals" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Course Approvals</h1>
                {coursesLoading ? <p className="text-muted-foreground">Loading...</p> : pendingCourses.length === 0 ? <p className="text-muted-foreground">No courses pending review.</p> : (
                  <div className="space-y-6">
                    {pendingCourses.map((c: any) => {
                      const settings = courseSettings[c.id] || { accessType: "subscription", priceEur: 0 };
                      return (
                        <Card key={c.id}>
                          <CardHeader><div className="flex items-start justify-between"><div><div className="text-xs text-muted-foreground mb-1">Course #{c.display_id} · by {userMap[c.instructor_id]?.first_name || "Unknown"} {userMap[c.instructor_id]?.last_name || ""}</div><CardTitle className="text-lg">{c.title}</CardTitle><CardDescription className="mt-1">{c.description ? stripHtml(c.description) : "No description"}</CardDescription></div><Badge variant="outline">Pending</Badge></div></CardHeader>
                          <CardContent className="space-y-6">
                            <Card className="bg-muted/30"><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Euro className="h-4 w-4" />Pricing & Access</CardTitle></CardHeader><CardContent className="space-y-4">
                              <div className="space-y-2"><Label>Access Type</Label><Select value={settings.accessType} onValueChange={(val) => updateCourseSettings(c.id, "accessType", val)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="subscription">Subscription</SelectItem><SelectItem value="one_off">One-off Purchase</SelectItem></SelectContent></Select></div>
                              <div className="space-y-2"><Label>Price (€)</Label><Input type="number" min="0" step="0.01" value={settings.priceEur} onChange={(e) => updateCourseSettings(c.id, "priceEur", parseFloat(e.target.value) || 0)} disabled={settings.accessType !== "one_off"} className={settings.accessType !== "one_off" ? "opacity-50" : ""} /></div>
                            </CardContent></Card>
                            <div className="space-y-2">
                              <Label className="text-xs">Assign Instructor</Label>
                              <OwnerPicker
                                instructors={instructorsList as any}
                                companies={instructorCompanies as any}
                                ownerType={c.owner_type}
                                ownerId={c.owner_id}
                                instructorId={c.instructor_id}
                                onSelect={(sel) => updateCourseOwner.mutate({ courseId: c.id, kind: sel.kind, id: sel.id, mainInstructorId: sel.kind === "company" ? sel.mainInstructorId : undefined })}
                              />
                            </div>
                            {renderSubcategoryChips(c.id)}
                            {renderCourseInstructors(c.id, c.instructor_id)}
                            <div className="flex justify-between items-center flex-wrap gap-2">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => window.open(`/courses/${c.id}`, "_blank", "noopener,noreferrer")} className="gap-1"><Eye className="h-3.5 w-3.5" /> Preview</Button>
                                <Button variant="outline" size="sm" onClick={() => navigate(`/instructor?editCourse=${c.id}`)} className="gap-1"><Pencil className="h-3.5 w-3.5" /> Edit Course</Button>
                                <Button variant="outline" size="sm" onClick={() => navigate(`/instructor?tab=manage-lessons&course=${c.id}`)} className="gap-1"><BookOpen className="h-3.5 w-3.5" /> Manage Lessons</Button>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                <Button variant="outline" onClick={() => changeStatusToDraft.mutate(c.id)} disabled={changeStatusToDraft.isPending} className="gap-2"><RotateCcw className="h-4 w-4" />Move to Draft</Button>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className="gap-2"><CalendarIcon className="h-4 w-4" />Schedule Publish</Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-4" align="end">
                                    <div className="space-y-3">
                                      <p className="text-sm font-medium">Schedule publication date</p>
                                      <Calendar
                                        mode="single"
                                        selected={schedulingCourseId === c.id ? scheduledPublishDate : undefined}
                                        onSelect={(date) => { setSchedulingCourseId(c.id); setScheduledPublishDate(date); }}
                                        disabled={(date) => date < new Date()}
                                        className={cn("p-3 pointer-events-auto")}
                                      />
                                      {schedulingCourseId === c.id && scheduledPublishDate && (
                                        <div className="flex gap-2">
                                          <Button size="sm" onClick={() => schedulePublish.mutate({ courseId: c.id, publishAt: scheduledPublishDate.toISOString() })} disabled={schedulePublish.isPending}>
                                            Schedule for {format(scheduledPublishDate, "MMM d, yyyy")}
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                <Button onClick={() => approveCourse.mutate(c.id)} disabled={approveCourse.isPending} className="gap-2"><CheckCircle className="h-4 w-4" />Approve & Publish</Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Published ── */}
            {activeView === "published" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Published Courses</h1>
                {publishedLoading ? <p className="text-muted-foreground">Loading...</p> : publishedCourses.length === 0 ? <p className="text-muted-foreground">No published courses.</p> : (
                  <div className="space-y-6">
                    {publishedCourses.map((c: any) => {
                      const settings = publishedCourseSettings[c.id] || { accessType: "subscription", priceEur: 0 };
                      return (
                        <Card key={c.id}>
                          <CardHeader><div className="flex items-start justify-between"><div className="flex-1"><div className="text-xs text-muted-foreground mb-1">Course #{c.display_id}</div><CardTitle className="text-lg cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/course/${c.id}`)}>{c.title}</CardTitle><CardDescription className="mt-1">{c.description ? stripHtml(c.description) : "No description"}</CardDescription></div><div className="flex gap-2"><Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Published</Badge><Badge variant="secondary">{c.is_free ? "Free" : c.access_type === "one_off" ? `€${c.price_eur}` : "Subscription"}</Badge></div></div></CardHeader>
                          <CardContent className="space-y-6">
                            <Card className="bg-muted/30"><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Euro className="h-4 w-4" />Edit Pricing</CardTitle></CardHeader><CardContent className="space-y-4">
                              <div className="space-y-2"><Label>Access Type</Label><Select value={settings.accessType} onValueChange={(val) => updatePublishedCourseSettings(c.id, "accessType", val)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="subscription">Subscription</SelectItem><SelectItem value="one_off">One-off Purchase</SelectItem></SelectContent></Select></div>
                              <div className="space-y-2"><Label>Price (€)</Label><Input type="number" min="0" step="0.01" value={settings.priceEur} onChange={(e) => updatePublishedCourseSettings(c.id, "priceEur", parseFloat(e.target.value) || 0)} disabled={settings.accessType !== "one_off"} className={settings.accessType !== "one_off" ? "opacity-50" : ""} /></div>
                            </CardContent></Card>
                            {renderSubcategoryChips(c.id)}
                            {renderCourseInstructors(c.id, c.instructor_id)}
                            {/* SEO Settings */}
                            <Card className="bg-muted/30">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2 cursor-pointer" onClick={() => { if (courseSeoEditing === c.id) { setCourseSeoEditing(null); } else { setCourseSeoEditing(c.id); setCourseSeoTitle(c.meta_title || ""); setCourseSeoDesc(c.meta_description || ""); } }}>
                                  <Search className="h-4 w-4" /> SEO Settings
                                  <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${courseSeoEditing === c.id ? "rotate-90" : ""}`} />
                                </CardTitle>
                              </CardHeader>
                              {courseSeoEditing === c.id && (
                                <CardContent className="space-y-4">
                                  <div className="space-y-2"><Label>Meta Title</Label><Input value={courseSeoTitle} onChange={(e) => setCourseSeoTitle(e.target.value)} placeholder={c.title} maxLength={60} /><p className="text-xs text-muted-foreground">{courseSeoTitle.length}/60 characters</p></div>
                                  <div className="space-y-2"><Label>Meta Description</Label><Textarea value={courseSeoDesc} onChange={(e) => setCourseSeoDesc(e.target.value)} placeholder="Course description for search engines..." maxLength={160} rows={3} /><p className="text-xs text-muted-foreground">{courseSeoDesc.length}/160 characters</p></div>
                                  <SnippetPreview title={`${courseSeoTitle || c.title} | Levoro Academy`} url={`${SITE_URL}/courses/${c.id}`} description={courseSeoDesc || stripHtml(c.description || "")?.substring(0, 155) || ""} />
                                  <Button size="sm" onClick={() => updateCourseSeo.mutate({ courseId: c.id, meta_title: courseSeoTitle, meta_description: courseSeoDesc })} disabled={updateCourseSeo.isPending}>Save SEO</Button>
                                </CardContent>
                              )}
                            </Card>
                            <div className="flex justify-between items-center gap-4 flex-wrap">
                              <div className="flex gap-2">
                                <Button variant="outline" onClick={() => navigate(`/course/${c.id}`)} className="gap-2"><Eye className="h-4 w-4" />View</Button>
                                <Button variant="outline" onClick={() => navigate(`/instructor?editCourse=${c.id}`)} className="gap-2"><Pencil className="h-4 w-4" />Edit Course</Button>
                                <Button variant="outline" onClick={() => navigate(`/instructor?tab=manage-lessons&course=${c.id}`)} className="gap-2"><BookOpen className="h-4 w-4" />Manage Lessons</Button>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" onClick={() => changeStatusToPending.mutate(c.id)} disabled={changeStatusToPending.isPending} className="gap-2"><RotateCcw className="h-4 w-4" />Move to Pending</Button>
                                <Button variant="outline" onClick={() => changeStatusToDraft.mutate(c.id)} disabled={changeStatusToDraft.isPending} className="gap-2"><RotateCcw className="h-4 w-4" />Move to Draft</Button>
                                <Button onClick={() => updatePublishedCourse.mutate(c.id)} disabled={updatePublishedCourse.isPending} className="gap-2"><CheckCircle className="h-4 w-4" />Save Changes</Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Financials ── */}
            {activeView === "financials" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Financials</h1>

                <div className="flex items-center gap-3">
                  <Label className="text-sm">Filter:</Label>
                  <Select value={txFilter} onValueChange={(v) => setTxFilter(v as any)}>
                    <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Transactions</SelectItem>
                      <SelectItem value="subscription">Subscriptions Only</SelectItem>
                      <SelectItem value="course_purchase">Course Purchases Only</SelectItem>
                      <SelectItem value="subscriptions_view">Stripe Subscriptions</SelectItem>
                      <SelectItem value="trials_view">Trials</SelectItem>
                    </SelectContent>
                  </Select>
                  {(txFilter === "all" || txFilter === "subscription") && (
                    <div className="flex items-center gap-2">
                      <Switch id="show-trials" checked={showTrials} onCheckedChange={setShowTrials} />
                      <Label htmlFor="show-trials" className="text-sm cursor-pointer">Show trials</Label>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncStripeTx(false)}
                    disabled={isSyncingStripeTx}
                    className="ml-auto gap-2"
                  >
                    {isSyncingStripeTx ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                    Sync Stripe payments
                  </Button>
                </div>

                {txFilter === "subscriptions_view" ? (
                  subsLoading ? <p className="text-muted-foreground">Loading subscriptions...</p> : stripeSubscriptions.length === 0 ? <p className="text-muted-foreground">No subscriptions found.</p> : (
                    <Card><Table>
                      <TableHeader><TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Next Payment</TableHead>
                        <TableHead>Auto-Renew</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {stripeSubscriptions.map((sub: any) => {
                          const isCanceling = sub.status === "active" && sub.cancel_at_period_end;
                          const statusLabel = sub.status === "trialing" ? "Trial" : isCanceling ? "Canceling" : sub.status === "active" ? "Active" : sub.status === "past_due" ? "Past Due" : sub.status === "canceled" ? "Canceled" : sub.status;
                          const statusVariant = sub.status === "trialing" ? "outline" : isCanceling ? "destructive" : sub.status === "active" ? "default" : sub.status === "canceled" ? "secondary" : "outline";
                          const startDate = sub.status === "trialing" ? sub.trial_start : sub.created;
                          const nextPayment = sub.status === "trialing" ? sub.trial_end : sub.current_period_end;
                          return (
                            <TableRow key={sub.id}>
                              <TableCell>
                                <div>
                                  <span className="font-medium">{sub.customer_name || "—"}</span>
                                  {sub.customer_email && <span className="block text-xs text-muted-foreground">{sub.customer_email}</span>}
                                </div>
                              </TableCell>
                              <TableCell><Badge variant="outline">{sub.plan}</Badge></TableCell>
                              <TableCell><Badge variant={statusVariant as any}>{statusLabel}</Badge></TableCell>
                              <TableCell className="text-muted-foreground">{startDate ? new Date(startDate).toLocaleDateString() : "—"}</TableCell>
                              <TableCell className="font-medium">{nextPayment ? new Date(nextPayment).toLocaleDateString() : "—"}</TableCell>
                              <TableCell>{sub.status === "canceled" ? "—" : sub.cancel_at_period_end ? <Badge variant="destructive">No</Badge> : <Badge variant="default">Yes</Badge>}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table></Card>
                  )
                ) : txFilter === "trials_view" ? (
                  trialsLoading ? <p className="text-muted-foreground">Loading trials...</p> : trialSubscriptions.length === 0 ? <p className="text-muted-foreground">No trials found.</p> : (
                    <Card><Table>
                      <TableHeader><TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Trial start</TableHead>
                        <TableHead>Trial end</TableHead>
                        <TableHead>Length</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Converted on</TableHead>
                        <TableHead className="text-right">First payment</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {trialSubscriptions.map((t: any) => {
                          const variant = t.status === "Active" ? "default" : t.status === "Converted" ? "secondary" : t.status === "Canceled" ? "outline" : "destructive";
                          return (
                            <TableRow key={t.id}>
                              <TableCell>
                                <div>
                                  <span className="font-medium">{t.customer_name || "—"}</span>
                                  {t.customer_email && <span className="block text-xs text-muted-foreground">{t.customer_email}</span>}
                                </div>
                              </TableCell>
                              <TableCell><Badge variant="outline">{t.plan}</Badge></TableCell>
                              <TableCell className="text-muted-foreground">{t.trial_start ? new Date(t.trial_start).toLocaleDateString() : "—"}</TableCell>
                              <TableCell className="text-muted-foreground">{t.trial_end ? new Date(t.trial_end).toLocaleDateString() : "—"}</TableCell>
                              <TableCell>{t.trial_days != null ? `${t.trial_days} day${t.trial_days === 1 ? "" : "s"}` : "—"}</TableCell>
                              <TableCell><Badge variant={variant as any}>{t.status}</Badge></TableCell>
                              <TableCell className="text-muted-foreground">{t.converted_at ? new Date(t.converted_at).toLocaleDateString() : "—"}</TableCell>
                              <TableCell className="text-right font-medium">{t.converted_amount != null ? `${t.converted_currency === "EUR" ? "€" : (t.converted_currency || "") + " "}${Number(t.converted_amount).toFixed(2)}` : "—"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table></Card>
                  )
                ) : (
                  txLoading ? <p className="text-muted-foreground">Loading...</p> : filteredTransactions.length === 0 ? <p className="text-muted-foreground">No transactions found.</p> : (
                    <Card><Table><TableHeader><TableRow>
                      <TableHead>TX #</TableHead><TableHead>User</TableHead><TableHead>Type</TableHead><TableHead>Item</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Date</TableHead>
                    </TableRow></TableHeader><TableBody>
                      {filteredTransactions.map((tx: any) => { const u = userMap[tx.user_id]; const isTrial = tx.type === "trial"; return (
                        <TableRow key={tx.id}>
                          <TableCell className="font-medium text-muted-foreground">#{tx.display_id}</TableCell>
                          <TableCell>{u ? <span>{u.first_name || ""} {u.last_name || ""} <span className="text-muted-foreground text-xs">(#{u.display_id})</span></span> : <span className="text-muted-foreground italic">Unknown</span>}</TableCell>
                          <TableCell><Badge variant={isTrial ? "outline" : "secondary"}>{isTrial ? "Trial" : tx.type === "subscription" ? "Subscription" : "Course Purchase"}</Badge></TableCell>
                          <TableCell>{(tx.type === "subscription" || isTrial) ? (tx.subscription_tier || "N/A") : (txCourseMap[tx.course_id] || "Unknown")}</TableCell>
                          <TableCell className="text-right font-medium">{isTrial ? <span className="text-muted-foreground italic">Trial</span> : `€${Number(tx.amount_paid).toFixed(2)}`}</TableCell>
                          <TableCell className="text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ); })}
                    </TableBody></Table></Card>
                  )
                )}
              </div>
            )}

            {/* ── Banners ── */}
            {(activeView === "banners" || activeView === "promotions") && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Banners Manager</h1>
                <Card>
                  <CardHeader><CardTitle>Create Banner</CardTitle><CardDescription>Add a new promotional banner</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Banner Content (HTML)</Label><Textarea placeholder='🎉 <strong>50% off</strong> all yearly plans!' value={newPromoContent} onChange={(e) => setNewPromoContent(e.target.value)} rows={2} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Background</Label><div className="flex gap-2 items-center"><input type="color" value={newPromoBg} onChange={(e) => setNewPromoBg(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" /><Input value={newPromoBg} onChange={(e) => setNewPromoBg(e.target.value)} className="flex-1" /></div></div>
                      <div className="space-y-2"><Label>Text Color</Label><div className="flex gap-2 items-center"><input type="color" value={newPromoText} onChange={(e) => setNewPromoText(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" /><Input value={newPromoText} onChange={(e) => setNewPromoText(e.target.value)} className="flex-1" /></div></div>
                    </div>
                    <div className="space-y-2"><Label>Target Pages (comma-separated)</Label><Input placeholder="/, /courses" value={newPromoPages} onChange={(e) => setNewPromoPages(e.target.value)} /></div>
                    {newPromoContent && <div className="rounded-lg py-2.5 px-4 text-sm font-medium text-center" style={{ backgroundColor: newPromoBg, color: newPromoText }}><span dangerouslySetInnerHTML={safeHtml(newPromoContent)} /></div>}
                    <Button onClick={() => createPromotion.mutate()} disabled={!newPromoContent.trim() || createPromotion.isPending} className="gap-2"><Plus className="h-4 w-4" /> Create</Button>
                  </CardContent>
                </Card>
                {promotions.length > 0 && <div className="space-y-3">{promotions.map((p: any) => (
                  <Card key={p.id}><CardContent className="pt-6"><div className="flex items-center gap-4">
                    <div className="flex-1"><div className="rounded-lg py-2 px-4 text-sm text-center mb-2" style={{ backgroundColor: p.bg_color, color: p.text_color }}><span dangerouslySetInnerHTML={safeHtml(p.content_html)} /></div></div>
                    <div className="flex items-center gap-3"><div className="flex items-center gap-2"><Label className="text-xs">Active</Label><Switch checked={p.is_active} onCheckedChange={(v) => togglePromotion.mutate({ id: p.id, isActive: v })} /></div><Button variant="ghost" size="sm" onClick={() => deletePromotion.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                  </div></CardContent></Card>
                ))}</div>}
              </div>
            )}

            {/* ── Pop-ups ── */}
            {activeView === "popups" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Pop-ups Manager</h1>

                <Tabs value={popupType} onValueChange={(v) => { setPopupType(v as any); resetPopupForm(); }}>
                  <TabsList><TabsTrigger value="subscriber">Subscriber Pop-ups</TabsTrigger><TabsTrigger value="promotional">Promotional Pop-ups</TabsTrigger></TabsList>
                </Tabs>

                <Card>
                  <CardHeader><CardTitle>{editingPopupId ? "Edit" : "Create"} {popupType === "subscriber" ? "Subscriber" : "Promotional"} Pop-up</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Heading</Label><Input value={popupForm.heading} onChange={(e) => setPopupForm(f => ({ ...f, heading: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Button Text</Label><Input value={popupForm.button_text} onChange={(e) => setPopupForm(f => ({ ...f, button_text: e.target.value }))} /></div>
                    </div>
                    <div className="space-y-2"><Label>Description</Label><Textarea value={popupForm.description} onChange={(e) => setPopupForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Button Color</Label><div className="flex gap-2 items-center"><input type="color" value={popupForm.button_color} onChange={(e) => setPopupForm(f => ({ ...f, button_color: e.target.value }))} className="w-10 h-10 rounded border cursor-pointer" /><Input value={popupForm.button_color} onChange={(e) => setPopupForm(f => ({ ...f, button_color: e.target.value }))} className="flex-1" /></div></div>
                      <div className="space-y-2"><Label>Button Text Color</Label><div className="flex gap-2 items-center"><input type="color" value={popupForm.button_text_color} onChange={(e) => setPopupForm(f => ({ ...f, button_text_color: e.target.value }))} className="w-10 h-10 rounded border cursor-pointer" /><Input value={popupForm.button_text_color} onChange={(e) => setPopupForm(f => ({ ...f, button_text_color: e.target.value }))} className="flex-1" /></div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Background Color</Label><div className="flex gap-2 items-center"><input type="color" value={popupForm.bg_color} onChange={(e) => setPopupForm(f => ({ ...f, bg_color: e.target.value }))} className="w-10 h-10 rounded border cursor-pointer" /><Input value={popupForm.bg_color} onChange={(e) => setPopupForm(f => ({ ...f, bg_color: e.target.value }))} className="flex-1" /></div></div>
                      <div className="space-y-2"><Label>Text Color</Label><div className="flex gap-2 items-center"><input type="color" value={popupForm.text_color} onChange={(e) => setPopupForm(f => ({ ...f, text_color: e.target.value }))} className="w-10 h-10 rounded border cursor-pointer" /><Input value={popupForm.text_color} onChange={(e) => setPopupForm(f => ({ ...f, text_color: e.target.value }))} className="flex-1" /></div></div>
                    </div>

                    <TooltipProvider>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">Background Image
                          <Tooltip><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent><p className="max-w-xs text-xs">Optional full-bleed background image for the popup container.</p></TooltipContent></Tooltip>
                        </Label>
                        <MediaUpload value={popupForm.bg_image_url} onChange={(url) => setPopupForm(f => ({ ...f, bg_image_url: url }))} accept="image/*" placeholder="Optional background image URL" />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">Decorative Image
                          <Tooltip><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent><p className="max-w-xs text-xs">An optional image shown at the top of the popup for visual appeal.</p></TooltipContent></Tooltip>
                        </Label>
                        <MediaUpload value={popupForm.image_url} onChange={(url) => setPopupForm(f => ({ ...f, image_url: url }))} accept="image/*" placeholder="Optional image URL" />
                      </div>
                    </div>

                    {popupType === "subscriber" && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">Input Border Color
                          <Tooltip><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent><p className="max-w-xs text-xs">Color of the Name/Email input field borders on the subscriber popup.</p></TooltipContent></Tooltip>
                        </Label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={popupForm.input_border_color} onChange={(e) => setPopupForm(f => ({ ...f, input_border_color: e.target.value }))} className="w-10 h-10 rounded border cursor-pointer" />
                          <Input value={popupForm.input_border_color} onChange={(e) => setPopupForm(f => ({ ...f, input_border_color: e.target.value }))} className="flex-1" />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">Delay (seconds)
                          <Tooltip><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent><p className="max-w-xs text-xs">Number of seconds after page load before the popup appears.</p></TooltipContent></Tooltip>
                        </Label>
                        <Input type="number" min={0} value={popupForm.delay_seconds} onChange={(e) => setPopupForm(f => ({ ...f, delay_seconds: parseInt(e.target.value) || 0 }))} />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">Target Pages
                          <Tooltip><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent><p className="max-w-xs text-xs">Comma-separated page paths where this popup will appear. Leave empty to show on all pages.</p></TooltipContent></Tooltip>
                        </Label>
                        <Input placeholder="/, /courses" value={popupForm.target_pages} onChange={(e) => setPopupForm(f => ({ ...f, target_pages: e.target.value }))} />
                      </div>
                    </div>

                    {popupType === "promotional" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">Promo Content (HTML)
                            <Tooltip><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent><p className="max-w-xs text-xs">Rich HTML content displayed in the popup body above the button. Use for promotional text, images, or formatted offers.</p></TooltipContent></Tooltip>
                          </Label>
                          <Textarea value={popupForm.promo_content_html} onChange={(e) => setPopupForm(f => ({ ...f, promo_content_html: e.target.value }))} rows={3} />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">CTA Link URL
                            <Tooltip><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent><p className="max-w-xs text-xs">Optional URL the button links to. If empty, the button is shown without a link.</p></TooltipContent></Tooltip>
                          </Label>
                          <Input value={popupForm.promo_link_url} onChange={(e) => setPopupForm(f => ({ ...f, promo_link_url: e.target.value }))} placeholder="https://..." />
                        </div>
                      </div>
                    )}

                    {/* Live Preview */}
                    {popupForm.heading && (
                      <div className="border rounded-xl overflow-hidden max-w-sm mx-auto" style={{ backgroundColor: popupForm.bg_color, color: popupForm.text_color, ...(popupForm.bg_image_url ? { backgroundImage: `url(${popupForm.bg_image_url})`, backgroundSize: "cover", backgroundPosition: "center" } : {}) }}>
                        <div className="p-6 space-y-3 text-center">
                          {popupForm.image_url && <img src={popupForm.image_url} alt="" className="max-h-20 mx-auto object-contain rounded" />}
                          <h3 className="text-lg font-bold">{popupForm.heading}</h3>
                          {popupForm.description && <p className="text-xs opacity-80">{popupForm.description}</p>}
                          {popupType === "subscriber" && (
                            <div className="space-y-2 max-w-[240px] mx-auto">
                              <div className="h-8 rounded-md border bg-white/90" style={{ borderColor: popupForm.input_border_color }} />
                              <div className="h-8 rounded-md border bg-white/90" style={{ borderColor: popupForm.input_border_color }} />
                            </div>
                          )}
                          <div className="rounded-full px-4 py-2 text-sm font-semibold inline-block" style={{ backgroundColor: popupForm.button_color, color: popupForm.button_text_color }}>{popupForm.button_text}</div>
                        </div>
                      </div>
                    )}
                    </TooltipProvider>

                    <div className="flex gap-2">
                      <Button onClick={() => editingPopupId ? updatePopup.mutate() : createPopup.mutate()} disabled={!popupForm.heading.trim() || createPopup.isPending || updatePopup.isPending} className="gap-2">
                        {editingPopupId ? <><Pencil className="h-4 w-4" /> Update</> : <><Plus className="h-4 w-4" /> Create</>}
                      </Button>
                      {editingPopupId && <Button variant="outline" onClick={resetPopupForm}>Cancel</Button>}
                    </div>
                  </CardContent>
                </Card>

                {/* Existing popups list */}
                {(adminPopups as any[]).filter((p: any) => p.type === popupType).length > 0 && (
                  <div className="space-y-3">
                    {(adminPopups as any[]).filter((p: any) => p.type === popupType).map((p: any) => (
                      <Card key={p.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <p className="font-medium">{p.heading || "(no heading)"}</p>
                              <p className="text-xs text-muted-foreground">{p.description?.substring(0, 80)}{p.description?.length > 80 ? "…" : ""}</p>
                              <p className="text-xs text-muted-foreground mt-1">Delay: {p.delay_seconds}s · Pages: {p.target_pages?.length ? p.target_pages.join(", ") : "All"}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2"><Label className="text-xs">Active</Label><Switch checked={p.is_active} onCheckedChange={(v) => togglePopup.mutate({ id: p.id, isActive: v })} /></div>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditingPopupId(p.id);
                                setPopupForm({
                                  heading: p.heading || "", description: p.description || "", button_text: p.button_text || "Subscribe",
                                  button_color: p.button_color || "#C9A84C", button_text_color: p.button_text_color || "#FFFFFF",
                                  bg_color: p.bg_color || "#FFFFFF", text_color: p.text_color || "#1A1A2E",
                                  bg_image_url: p.bg_image_url || "", image_url: p.image_url || "",
                                  delay_seconds: p.delay_seconds || 5, target_pages: (p.target_pages || []).join(", "),
                                  promo_content_html: p.promo_content_html || "", promo_link_url: p.promo_link_url || "",
                                  input_border_color: p.input_border_color || "#D1D5DB",
                                });
                              }}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => deletePopup.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── FAQ Manager ── */}
            {activeView === "faq" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">FAQ Manager</h1>
                <Card>
                  <CardHeader><CardTitle>Add FAQ Item</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Question</Label><Input value={newFaqQuestion} onChange={(e) => setNewFaqQuestion(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Answer</Label><Textarea value={newFaqAnswer} onChange={(e) => setNewFaqAnswer(e.target.value)} rows={4} /></div>
                    <Button onClick={() => createFaq.mutate()} disabled={!newFaqQuestion.trim() || !newFaqAnswer.trim() || createFaq.isPending} className="gap-2"><Plus className="h-4 w-4" /> Add</Button>
                  </CardContent>
                </Card>
                {faqItems.length > 0 && <div className="space-y-3">{faqItems.map((faq: any, idx: number) => (
                  <Card key={faq.id}><CardContent className="pt-6">
                    {editingFaqId === faq.id ? (
                      <div className="space-y-4">
                        <div className="space-y-2"><Label>Question</Label><Input value={editFaqQuestion} onChange={(e) => setEditFaqQuestion(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Answer</Label><Textarea value={editFaqAnswer} onChange={(e) => setEditFaqAnswer(e.target.value)} rows={4} /></div>
                        <div className="space-y-2"><Label>Sort Order</Label><Input type="number" value={editFaqOrder} onChange={(e) => setEditFaqOrder(parseInt(e.target.value) || 0)} /></div>
                        <div className="flex gap-2"><Button size="sm" onClick={() => updateFaq.mutate({ id: faq.id, question: editFaqQuestion, answer: editFaqAnswer, sort_order: editFaqOrder })} disabled={updateFaq.isPending}>Save</Button><Button size="sm" variant="outline" onClick={() => setEditingFaqId(null)}>Cancel</Button></div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col gap-1"><Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveFaq(faq.id, "up")} disabled={idx === 0}>↑</Button><Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveFaq(faq.id, "down")} disabled={idx === faqItems.length - 1}>↓</Button></div>
                        <div className="flex-1"><p className="font-medium text-sm mb-1">{faq.question}</p><p className="text-sm text-muted-foreground line-clamp-2">{faq.answer}</p></div>
                        <div className="flex items-center gap-2">
                          <Switch checked={faq.is_active} onCheckedChange={(v) => updateFaq.mutate({ id: faq.id, is_active: v })} />
                          <Button variant="ghost" size="sm" onClick={() => { setEditingFaqId(faq.id); setEditFaqQuestion(faq.question); setEditFaqAnswer(faq.answer); setEditFaqOrder(faq.sort_order); }}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteFaq.mutate(faq.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                    )}
                  </CardContent></Card>
                ))}</div>}
              </div>
            )}

            {/* ── Partners ── */}
            {activeView === "partners" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Partners Manager</h1>
                <Card>
                  <CardHeader><CardTitle>Add Partner</CardTitle><CardDescription>Add a partner logo to display on the homepage</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Partner Name *</Label><Input placeholder="e.g., WORKLAND" value={newPartnerName} onChange={(e) => setNewPartnerName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Logo</Label><MediaUpload value={newPartnerLogo} onChange={setNewPartnerLogo} accept="image/*" placeholder="Upload a logo or paste an image URL" /></div>
                    <div className="space-y-2"><Label>Website URL</Label><Input placeholder="https://partner-website.com" value={newPartnerUrl} onChange={(e) => setNewPartnerUrl(e.target.value)} /></div>
                    <Button onClick={() => createPartner.mutate()} disabled={!newPartnerName.trim() || createPartner.isPending} className="gap-2"><Plus className="h-4 w-4" /> Add Partner</Button>
                  </CardContent>
                </Card>
                <h2 className="text-xl font-semibold">Existing Partners ({partners.length})</h2>
                {partnersLoading ? <p className="text-muted-foreground">Loading...</p> : partners.length === 0 ? <p className="text-muted-foreground">No partners yet.</p> : (
                  <div className="space-y-3">{partners.map((p: any) => (
                    <Card key={p.id}><CardContent className="pt-6">
                      {editingPartnerId === p.id ? (
                        <div className="space-y-4">
                          <div className="space-y-2"><Label>Name</Label><Input value={editPartnerName} onChange={(e) => setEditPartnerName(e.target.value)} /></div>
                          <div className="space-y-2"><Label>Logo</Label><MediaUpload value={editPartnerLogo} onChange={setEditPartnerLogo} accept="image/*" placeholder="Upload a logo or paste an image URL" /></div>
                          <div className="space-y-2"><Label>Website URL</Label><Input value={editPartnerUrl} onChange={(e) => setEditPartnerUrl(e.target.value)} /></div>
                          <div className="flex gap-2"><Button size="sm" onClick={() => updatePartner.mutate({ id: p.id, name: editPartnerName, logo_url: editPartnerLogo, website_url: editPartnerUrl })}>Save</Button><Button size="sm" variant="outline" onClick={() => setEditingPartnerId(null)}>Cancel</Button></div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-12 bg-muted rounded flex items-center justify-center overflow-hidden shrink-0">
                            {p.logo_url ? <img src={p.logo_url} alt={p.name} className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-muted-foreground">{p.name}</span>}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{p.name}</p>
                            {p.website_url && <p className="text-xs text-muted-foreground truncate">{p.website_url}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={p.is_active} onCheckedChange={(v) => updatePartner.mutate({ id: p.id, is_active: v })} />
                            <Button variant="ghost" size="sm" onClick={() => { setEditingPartnerId(p.id); setEditPartnerName(p.name); setEditPartnerLogo(p.logo_url || ""); setEditPartnerUrl(p.website_url || ""); }}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => deletePartner.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </div>
                      )}
                    </CardContent></Card>
                  ))}</div>
                )}
              </div>
            )}

            {/* ── Recommended Courses ── */}
            {activeView === "recommended" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Recommended Courses</h1>
                <Card>
                  <CardHeader><CardTitle>Add Recommended Course</CardTitle><CardDescription>Select a published course to feature in the "Recommended for you" section</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Course</Label>
                      <Select value={selectedRecommendedCourseId} onValueChange={setSelectedRecommendedCourseId}>
                        <SelectTrigger><SelectValue placeholder="Choose a course..." /></SelectTrigger>
                        <SelectContent>{availableForRecommended.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => addRecommended.mutate()} disabled={!selectedRecommendedCourseId || addRecommended.isPending} className="gap-2"><Plus className="h-4 w-4" /> Add</Button>
                  </CardContent>
                </Card>
                <h2 className="text-xl font-semibold">Current Recommended ({recommendedCourses.length})</h2>
                {recLoading ? <p className="text-muted-foreground">Loading...</p> : recommendedCourses.length === 0 ? <p className="text-muted-foreground">No recommended courses yet.</p> : (
                  <div className="space-y-3">{recommendedCourses.map((r: any) => (
                    <Card key={r.id}><CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div><p className="font-medium text-sm">{r.course_title}</p><p className="text-xs text-muted-foreground">Order: {r.sort_order}</p></div>
                        <Button variant="ghost" size="sm" onClick={() => removeRecommended.mutate(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </CardContent></Card>
                  ))}</div>
                )}
              </div>
            )}

            {/* ── Membership Pricing ── */}
            {activeView === "pricing" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Membership Pricing</h1>
                <p className="text-muted-foreground">Edit prices, set campaign discounts with expiration dates. Prices update everywhere automatically.</p>
                {plansLoading ? <p className="text-muted-foreground">Loading...</p> : (
                  <div className="space-y-4">{membershipPlans.map((plan: any) => (
                    <Card key={plan.id}>
                      <CardContent className="pt-6">
                        {editingPlanId === plan.id ? (
                          <div className="space-y-4">
                            <h3 className="font-bold text-lg">{plan.title}</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Price per month (€)</Label>
                                <Input type="number" step="0.01" min="0" value={editPlanPrice} onChange={(e) => setEditPlanPrice(parseFloat(e.target.value) || 0)} />
                                <p className="text-xs text-muted-foreground">Original: €{plan.original_price_eur}/mo</p>
                              </div>
                              <div className="space-y-2">
                                <Label>Discount expires at (optional)</Label>
                                <Input type="datetime-local" value={editPlanDiscountEnd} onChange={(e) => setEditPlanDiscountEnd(e.target.value)} />
                                <p className="text-xs text-muted-foreground">Leave empty for permanent price</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Badge text (optional)</Label>
                              <Input value={editPlanBadge} onChange={(e) => setEditPlanBadge(e.target.value)} placeholder="e.g., BEST VALUE" />
                            </div>
                            <div className="space-y-2">
                              <Label>Free trial days (0 = no trial)</Label>
                              <Input type="number" min="0" value={editPlanTrialDays} onChange={(e) => setEditPlanTrialDays(parseInt(e.target.value) || 0)} />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updatePlan.mutate({ id: plan.id, price_eur: editPlanPrice, discount_ends_at: editPlanDiscountEnd ? new Date(editPlanDiscountEnd).toISOString() : null, badge: editPlanBadge || null, trial_days: editPlanTrialDays })} disabled={updatePlan.isPending}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingPlanId(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="font-bold">{plan.title}</h3>
                                {plan.badge && <Badge variant="secondary">{plan.badge}</Badge>}
                                {plan.price_eur !== plan.original_price_eur && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Discounted</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                €{Number(plan.price_eur).toFixed(2)}/mo
                                {plan.price_eur !== plan.original_price_eur && <span className="line-through ml-2">€{Number(plan.original_price_eur).toFixed(2)}/mo</span>}
                              </p>
                              {plan.discount_ends_at && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Discount expires: {new Date(plan.discount_ends_at).toLocaleString()}
                                  {new Date(plan.discount_ends_at) < new Date() && <span className="text-destructive font-medium ml-2">(Expired)</span>}
                                </p>
                              )}
                              {plan.trial_days > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">Free trial: {plan.trial_days} days</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => resetPlanPrice.mutate(plan.id)} disabled={plan.price_eur === plan.original_price_eur}>Reset</Button>
                              <Button variant="ghost" size="sm" onClick={() => { setEditingPlanId(plan.id); setEditPlanPrice(plan.price_eur); setEditPlanDiscountEnd(plan.discount_ends_at ? new Date(plan.discount_ends_at).toISOString().slice(0, 16) : ""); setEditPlanBadge(plan.badge || ""); setEditPlanTrialDays(plan.trial_days || 0); }}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}</div>
                )}

                {/* Currency Overrides */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Currency Price Overrides</CardTitle>
                    <CardDescription>Set fixed prices for specific currencies. If not set, prices are auto-converted using live exchange rates. All base prices are in EUR.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {membershipPlans.map((plan: any) => {
                      const isOpen = showCurrencyPlanId === plan.id;
                      const overrides = currencyOverrides[plan.id] || {};
                      return (
                        <div key={plan.id} className="border border-border rounded-lg overflow-visible">
                          <button
                            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                            onClick={() => setShowCurrencyPlanId(isOpen ? null : plan.id)}
                          >
                            <span className="font-medium text-sm">{plan.title} <span className="text-muted-foreground">(€{Number(plan.price_eur).toFixed(2)}/mo)</span></span>
                            <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                          </button>
                          {isOpen && (() => {
                            const activeCurrencies = Object.keys(overrides).filter(cc => overrides[cc] !== undefined);
                            const allActive = [...new Set([...activeCurrencies, ...Object.keys(overrides)])].filter(cc => cc in ALL_CURRENCIES);
                            const availableToAdd = Object.keys(ALL_CURRENCIES).filter(cc => !allActive.includes(cc));
                            const filtered = addCurrencySearch
                              ? availableToAdd.filter(cc => cc.toLowerCase().includes(addCurrencySearch.toLowerCase()) || ALL_CURRENCIES[cc].toLowerCase().includes(addCurrencySearch.toLowerCase()))
                              : [];
                            return (
                              <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                  {allActive.map((cc) => (
                                    <div key={cc} className="space-y-1">
                                      <Label className="text-xs">{cc} <span className="text-muted-foreground text-[10px]">{ALL_CURRENCIES[cc]?.split("(")[0]}</span></Label>
                                      <div className="flex gap-1">
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          placeholder="Auto"
                                          value={overrides[cc] || ""}
                                          onChange={(e) => setCurrencyOverrides(prev => ({
                                            ...prev,
                                            [plan.id]: { ...(prev[plan.id] || {}), [cc]: e.target.value }
                                          }))}
                                          className="h-8 text-sm"
                                        />
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 px-2"
                                          onClick={() => {
                                            const val = overrides[cc];
                                            if (!val) {
                                              // Remove from local state
                                              setCurrencyOverrides(prev => {
                                                const updated = { ...prev[plan.id] };
                                                delete updated[cc];
                                                return { ...prev, [plan.id]: updated };
                                              });
                                            }
                                            saveCurrencyOverride.mutate({
                                              planId: plan.id,
                                              currencyCode: cc,
                                              price: val ? parseFloat(val) : null,
                                            });
                                          }}
                                          disabled={saveCurrencyOverride.isPending}
                                        >
                                          {overrides[cc] ? "Save" : "✕"}
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {/* Add currency picker */}
                                <div className="relative">
                                  <Input
                                    placeholder="Search & add currency (e.g. INR, Brazilian...)"
                                    value={addCurrencySearch}
                                    onChange={(e) => setAddCurrencySearch(e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                  {addCurrencySearch && filtered.length > 0 && (
                                    <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-md border bg-popover shadow-md">
                                      {filtered.slice(0, 15).map(cc => (
                                        <button
                                          key={cc}
                                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                                          onClick={() => {
                                            setCurrencyOverrides(prev => ({
                                              ...prev,
                                              [plan.id]: { ...(prev[plan.id] || {}), [cc]: "" }
                                            }));
                                            setAddCurrencySearch("");
                                          }}
                                        >
                                          <span className="font-medium">{cc}</span> — {ALL_CURRENCIES[cc]}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Bundle Pricing */}
                {allBundles.filter((b: any) => b.is_active).length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Bundle Currency Overrides</CardTitle>
                      <CardDescription>Set fixed prices for bundles in specific currencies.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {allBundles.filter((b: any) => b.is_active).map((bundle: any) => {
                        const isOpen = showCurrencyPlanId === `bundle-${bundle.id}`;
                        const overrides = currencyOverrides[bundle.id] || {};
                        return (
                          <div key={bundle.id} className="border border-border rounded-lg overflow-visible">
                            <button className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors" onClick={() => setShowCurrencyPlanId(isOpen ? null : `bundle-${bundle.id}`)}>
                              <span className="font-medium text-sm">{bundle.title} <span className="text-muted-foreground">(€{Number(bundle.price_eur).toFixed(2)})</span></span>
                              <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                            </button>
                            {isOpen && (() => {
                              const activeCurrencies = Object.keys(overrides).filter(cc => cc in ALL_CURRENCIES);
                              const availableToAdd = Object.keys(ALL_CURRENCIES).filter(cc => !activeCurrencies.includes(cc));
                              const filtered = addCurrencySearch ? availableToAdd.filter(cc => cc.toLowerCase().includes(addCurrencySearch.toLowerCase()) || ALL_CURRENCIES[cc].toLowerCase().includes(addCurrencySearch.toLowerCase())) : [];
                              return (
                                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {activeCurrencies.map((cc) => (
                                      <div key={cc} className="space-y-1">
                                        <Label className="text-xs">{cc}</Label>
                                        <div className="flex gap-1">
                                          <Input type="number" step="0.01" min="0" placeholder="Auto" value={overrides[cc] || ""} onChange={(e) => setCurrencyOverrides(prev => ({ ...prev, [bundle.id]: { ...(prev[bundle.id] || {}), [cc]: e.target.value } }))} className="h-8 text-sm" />
                                          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => { const val = overrides[cc]; if (!val) { setCurrencyOverrides(prev => { const updated = { ...prev[bundle.id] }; delete updated[cc]; return { ...prev, [bundle.id]: updated }; }); } saveCurrencyOverride.mutate({ planId: bundle.id, currencyCode: cc, price: val ? parseFloat(val) : null }); }} disabled={saveCurrencyOverride.isPending}>{overrides[cc] ? "Save" : "✕"}</Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="relative">
                                    <Input placeholder="Search & add currency..." value={addCurrencySearch} onChange={(e) => setAddCurrencySearch(e.target.value)} className="h-8 text-sm" />
                                    {addCurrencySearch && filtered.length > 0 && (
                                      <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-md border bg-popover shadow-md">
                                        {filtered.slice(0, 15).map(cc => (
                                          <button key={cc} className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground" onClick={() => { setCurrencyOverrides(prev => ({ ...prev, [bundle.id]: { ...(prev[bundle.id] || {}), [cc]: "" } })); setAddCurrencySearch(""); }}>
                                            <span className="font-medium">{cc}</span> — {ALL_CURRENCIES[cc]}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ── Reviews ── */}
            {activeView === "reviews" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Course Reviews</h1>
                <p className="text-muted-foreground">Approve student feedback before it appears on the course catalog, or import past reviews from your old website.</p>

                {/* Add imported review */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add a review (imported)</CardTitle>
                    <CardDescription>Use this to add reviews from past students who don't have an account on Levoro Academy. New reviews start as <strong>Pending</strong> and need to be approved below to go live.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Course</Label>
                        <Select value={importedReview.course_id} onValueChange={(v) => setImportedReview((p) => ({ ...p, course_id: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select a course..." /></SelectTrigger>
                          <SelectContent className="max-h-72">
                            {Object.entries(allCoursesMap).map(([id, title]) => (
                              <SelectItem key={id} value={id}>{title as string}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Reviewer name</Label>
                        <Input value={importedReview.reviewer_name} onChange={(e) => setImportedReview((p) => ({ ...p, reviewer_name: e.target.value }))} placeholder="e.g., Jane D." maxLength={80} />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Rating</Label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button key={s} type="button" onClick={() => setImportedReview((p) => ({ ...p, rating: s }))} className="p-1 -m-1">
                              <StarIcon className={`h-6 w-6 transition-colors ${s <= importedReview.rating ? "text-secondary fill-secondary" : "text-muted-foreground/30"}`} />
                            </button>
                          ))}
                          <span className="ml-2 text-xs text-muted-foreground">{importedReview.rating}/5</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Review date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal normal-case tracking-normal", !importedReview.review_date && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {importedReview.review_date ? format(importedReview.review_date, "dd/MM/yyyy") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={importedReview.review_date}
                              onSelect={(d) => setImportedReview((p) => ({ ...p, review_date: d ?? p.review_date }))}
                              disabled={(date) => date > new Date()}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Review text</Label>
                      <Textarea value={importedReview.review_text} onChange={(e) => setImportedReview((p) => ({ ...p, review_text: e.target.value }))} placeholder="What the student wrote..." rows={4} maxLength={2000} />
                      <p className="text-[10px] text-muted-foreground text-right">{importedReview.review_text.length}/2000</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={resetImportedReview} disabled={createImportedReview.isPending}>Reset</Button>
                      <Button
                        onClick={() => createImportedReview.mutate(
                          { ...importedReview, review_date: importedReview.review_date! },
                          { onSuccess: resetImportedReview }
                        )}
                        disabled={
                          !importedReview.course_id ||
                          !importedReview.reviewer_name.trim() ||
                          !importedReview.review_text.trim() ||
                          !importedReview.review_date ||
                          createImportedReview.isPending
                        }
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" /> Add review
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <h2 className="text-xl font-semibold pt-2">All reviews</h2>
                {reviewsLoading ? <p className="text-muted-foreground">Loading...</p> : allReviews.length === 0 ? <p className="text-muted-foreground">No reviews yet.</p> : (
                  <div className="space-y-3">
                    {allReviews.map((review: any) => {
                      const student = userMap[review.student_id];
                      const isImported = review.source === "admin";
                      const displayName = review.reviewer_name
                        || (student ? `${student.first_name || ""} ${student.last_name || ""}`.trim() : "")
                        || "Student";
                      const displayDate = review.review_date || review.created_at;
                      return (
                        <Card key={review.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-medium text-sm">{displayName}</span>
                                  {isImported && <Badge variant="outline" className="text-[10px] py-0">Imported</Badge>}
                                  <span className="text-xs text-muted-foreground">on</span>
                                  <span className="text-sm font-medium text-primary">{allCoursesMap[review.course_id] || "Unknown Course"}</span>
                                </div>
                                <div className="flex items-center gap-1 mb-2">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <StarIcon key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "text-secondary fill-secondary" : "text-muted-foreground/30"}`} />
                                  ))}
                                  <span className="text-xs text-muted-foreground ml-2">{format(new Date(displayDate), "dd/MM/yyyy")}</span>
                                </div>
                                <p className="text-sm text-foreground/80">{review.review_text || <span className="italic text-muted-foreground">No text</span>}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant={review.is_approved ? "default" : "secondary"}>{review.is_approved ? "Approved" : "Pending"}</Badge>
                                <Switch checked={review.is_approved} onCheckedChange={(v) => toggleReviewApproval.mutate({ id: review.id, isApproved: v })} />
                                <Button variant="ghost" size="sm" onClick={() => deleteReview.mutate(review.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Categories ── */}
            {activeView === "categories" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Course Categories & Subcategories</h1>
                <Card>
                  <CardHeader><CardTitle>Add Category</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Name</Label><Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g., Leadership & Management" /></div>
                      <div className="space-y-2"><Label>Slug (auto-generated if empty)</Label><Input value={newCategorySlug} onChange={(e) => setNewCategorySlug(e.target.value)} placeholder="e.g., leadership-management" /></div>
                    </div>
                    <Button onClick={() => createCategory.mutate()} disabled={!newCategoryName.trim() || createCategory.isPending} className="gap-2"><Plus className="h-4 w-4" /> Add</Button>
                  </CardContent>
                </Card>
                <h2 className="text-xl font-semibold">Existing Categories ({allCategories.length})</h2>
                {categoriesLoading ? <p className="text-muted-foreground">Loading...</p> : allCategories.length === 0 ? <p className="text-muted-foreground">No categories.</p> : (
                  <div className="space-y-3">
                    {allCategories.map((cat: any) => {
                      const subs = allSubcategories.filter((s: any) => s.category_id === cat.id);
                      const isExpanded = expandedCategoryId === cat.id;
                      return (
                        <Card key={cat.id}>
                          <CardContent className="pt-4 pb-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <button className="flex items-center gap-2 text-left" onClick={() => setExpandedCategoryId(isExpanded ? null : cat.id)}>
                                <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                <div>
                                  <p className="font-medium text-sm">{cat.name}</p>
                                  <p className="text-xs text-muted-foreground">/{cat.slug} · {subs.length} subcategories</p>
                                </div>
                              </button>
                              <Button variant="ghost" size="sm" onClick={() => deleteCategory.mutate(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                            {/* Category SEO */}
                            <div className="ml-6 border-l-2 border-border pl-4">
                              <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2" onClick={() => { if (categorySeoEditing === cat.id) { setCategorySeoEditing(null); } else { setCategorySeoEditing(cat.id); setCategorySeoTitle(cat.meta_title || ""); setCategorySeoDesc(cat.meta_description || ""); } }}>
                                <Search className="h-3 w-3" /> SEO Settings <ChevronRight className={`h-3 w-3 transition-transform ${categorySeoEditing === cat.id ? "rotate-90" : ""}`} />
                              </button>
                              {categorySeoEditing === cat.id && (
                                <div className="space-y-3 mb-3">
                                  <div className="space-y-1"><Label className="text-xs">Meta Title</Label><Input value={categorySeoTitle} onChange={(e) => setCategorySeoTitle(e.target.value)} placeholder={cat.name} maxLength={60} className="h-8 text-sm" /><p className="text-[10px] text-muted-foreground">{categorySeoTitle.length}/60</p></div>
                                  <div className="space-y-1"><Label className="text-xs">Meta Description</Label><Textarea value={categorySeoDesc} onChange={(e) => setCategorySeoDesc(e.target.value)} placeholder="Category description..." maxLength={160} rows={2} className="text-sm" /><p className="text-[10px] text-muted-foreground">{categorySeoDesc.length}/160</p></div>
                                  <SnippetPreview title={`${categorySeoTitle || cat.name} Courses | Levoro Academy`} url={`${SITE_URL}/courses?category=${cat.slug}`} description={categorySeoDesc || ""} />
                                  <Button size="sm" className="h-7 text-xs" onClick={() => updateCategorySeo.mutate({ categoryId: cat.id, meta_title: categorySeoTitle, meta_description: categorySeoDesc })} disabled={updateCategorySeo.isPending}>Save SEO</Button>
                                </div>
                              )}
                            </div>
                            {isExpanded && (
                              <div className="ml-6 space-y-3 border-l-2 border-border pl-4">
                                {subs.map((sub: any) => (
                                  <div key={sub.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                                    <div>
                                      <p className="text-sm font-medium">{sub.name}</p>
                                      <p className="text-xs text-muted-foreground">/{sub.slug}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => deleteSubcategory.mutate(sub.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                                  </div>
                                ))}
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-muted-foreground">Add Subcategory</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input value={newSubcategoryName} onChange={(e) => setNewSubcategoryName(e.target.value)} placeholder="Subcategory name" className="text-sm h-8" />
                                    <Input value={newSubcategorySlug} onChange={(e) => setNewSubcategorySlug(e.target.value)} placeholder="slug (auto)" className="text-sm h-8" />
                                  </div>
                                  <Button variant="secondary" size="sm" onClick={() => createSubcategory.mutate(cat.id)} disabled={!newSubcategoryName.trim() || createSubcategory.isPending} className="gap-1 h-7 text-xs">
                                    <Plus className="h-3 w-3" /> Add
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Hotspot Icons ── */}
            {activeView === "hotspot-icons" && <HotspotIconsManager />}

            {/* ── Import ── */}
            {activeView === "import" && <CourseImport />}

            {/* ── Site Pages ── */}
            {activeView === "site-pages" && <SitePagesEditor />}

            {/* ── Promo Codes ── */}
            {activeView === "promo-codes" && <PromoCodesManager />}

            {/* ── Bundles ── */}
            {activeView === "bundles" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Course Bundles</h1>
                <Card>
                  <CardHeader><CardTitle>Create Bundle</CardTitle><CardDescription>Create a new course bundle with custom pricing.</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Title *</Label><Input value={newBundleTitle} onChange={(e) => setNewBundleTitle(e.target.value)} placeholder="e.g., Leadership Essentials Bundle" /></div>
                      <div className="space-y-2"><Label>Slug (auto if empty)</Label><Input value={newBundleSlug} onChange={(e) => setNewBundleSlug(e.target.value)} placeholder="leadership-essentials" /></div>
                      <div className="space-y-2"><Label>Description</Label><Textarea value={newBundleDesc} onChange={(e) => setNewBundleDesc(e.target.value)} placeholder="Bundle description..." rows={2} /></div>
                      <div className="space-y-2"><Label>Price (EUR)</Label><Input type="number" min="0" step="0.01" value={newBundlePrice} onChange={(e) => setNewBundlePrice(parseFloat(e.target.value) || 0)} /></div>
                    </div>
                    <Button onClick={() => createBundle.mutate()} disabled={!newBundleTitle.trim() || createBundle.isPending} className="gap-2"><Plus className="h-4 w-4" /> Create Bundle</Button>
                  </CardContent>
                </Card>

                {bundlesLoading ? <p className="text-muted-foreground">Loading...</p> : allBundles.length === 0 ? <p className="text-muted-foreground">No bundles yet.</p> : (
                  <div className="space-y-4">
                    {allBundles.map((bundle: any) => {
                      const bundleCourses = allBundleCourses.filter((bc: any) => bc.bundle_id === bundle.id);
                      const isEditing = editingBundleId === bundle.id;
                      return (
                        <Card key={bundle.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{bundle.title}</CardTitle>
                                <CardDescription>/{bundle.slug} · €{Number(bundle.price_eur).toFixed(2)} · {bundleCourses.length} courses</CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={bundle.is_active ? "default" : "secondary"}>{bundle.is_active ? "Active" : "Inactive"}</Badge>
                                <Switch checked={bundle.is_active} onCheckedChange={(v) => updateBundle.mutate({ id: bundle.id, is_active: v })} />
                                <Button variant="ghost" size="sm" onClick={() => {
                                  if (isEditing) { setEditingBundleId(null); } else {
                                    setEditingBundleId(bundle.id); setEditBundleTitle(bundle.title); setEditBundleSlug(bundle.slug);
                                    setEditBundleDesc(bundle.description || ""); setEditBundlePrice(bundle.price_eur);
                                    setEditBundleMetaTitle(bundle.meta_title || ""); setEditBundleMetaDesc(bundle.meta_description || "");
                                    setEditBundleContent(bundle.page_content || "");
                                  }
                                }}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => deleteBundle.mutate(bundle.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {isEditing && (
                              <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/20">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2"><Label>Title</Label><Input value={editBundleTitle} onChange={(e) => setEditBundleTitle(e.target.value)} /></div>
                                  <div className="space-y-2"><Label>Slug</Label><Input value={editBundleSlug} onChange={(e) => setEditBundleSlug(e.target.value)} /></div>
                                  <div className="space-y-2"><Label>Description</Label><Textarea value={editBundleDesc} onChange={(e) => setEditBundleDesc(e.target.value)} rows={2} /></div>
                                  <div className="space-y-2"><Label>Price (EUR)</Label><Input type="number" min="0" step="0.01" value={editBundlePrice} onChange={(e) => setEditBundlePrice(parseFloat(e.target.value) || 0)} /></div>
                                </div>
                                <h4 className="font-medium text-sm flex items-center gap-2"><Search className="h-4 w-4" /> SEO Settings</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2"><Label>Meta Title</Label><Input value={editBundleMetaTitle} onChange={(e) => setEditBundleMetaTitle(e.target.value)} placeholder={bundle.title} maxLength={60} /><p className="text-xs text-muted-foreground">{editBundleMetaTitle.length}/60</p></div>
                                  <div className="space-y-2"><Label>Meta Description</Label><Textarea value={editBundleMetaDesc} onChange={(e) => setEditBundleMetaDesc(e.target.value)} maxLength={160} rows={2} /><p className="text-xs text-muted-foreground">{editBundleMetaDesc.length}/160</p></div>
                                </div>
                                <SnippetPreview title={`${editBundleMetaTitle || editBundleTitle} | Levoro Academy`} url={`${SITE_URL}/bundles/${editBundleSlug}`} description={editBundleMetaDesc || editBundleDesc} />
                                <div className="space-y-2"><Label>Page Content (HTML)</Label><Textarea value={editBundleContent} onChange={(e) => setEditBundleContent(e.target.value)} rows={6} placeholder="<h2>Why this bundle?</h2><p>...</p>" /></div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => updateBundle.mutate({ id: bundle.id, title: editBundleTitle, slug: editBundleSlug, description: editBundleDesc, price_eur: editBundlePrice, meta_title: editBundleMetaTitle || null, meta_description: editBundleMetaDesc || null, page_content: editBundleContent })} disabled={updateBundle.isPending}>Save All Changes</Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingBundleId(null)}>Cancel</Button>
                                </div>
                              </div>
                            )}
                            {/* Bundle courses */}
                            <div className="space-y-2">
                              <Label className="text-xs">Included Courses ({bundleCourses.length})</Label>
                              <div className="flex flex-wrap gap-1.5">
                                {bundleCourses.map((bc: any) => {
                                  const course = publishedCourses.find((c: any) => c.id === bc.course_id);
                                  return (
                                    <Badge key={bc.id} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeBundleCourse.mutate(bc.id)}>
                                      {course?.title || "Unknown"} <span className="text-destructive">×</span>
                                    </Badge>
                                  );
                                })}
                              </div>
                              {bundleCourseDropdown === bundle.id ? (
                                <div className="flex gap-2 items-center">
                                  <Select onValueChange={(courseId) => { addBundleCourse.mutate({ bundleId: bundle.id, courseId }); setBundleCourseDropdown(null); }}>
                                    <SelectTrigger className="w-[300px] h-8 text-sm"><SelectValue placeholder="Add a course..." /></SelectTrigger>
                                    <SelectContent>
                                      {publishedCourses.filter((c: any) => !bundleCourses.some((bc: any) => bc.course_id === c.id)).map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setBundleCourseDropdown(null)}>Done</Button>
                                </div>
                              ) : (
                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setBundleCourseDropdown(bundle.id)}>
                                  <Plus className="h-3 w-3" /> Add Course
                                </Button>
                              )}
                            </div>
                            {bundle.is_active && (
                              <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate(`/bundles/${bundle.slug}`)}>
                                <Eye className="h-3.5 w-3.5" /> View Public Page
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Inbox ── */}
            {activeView === "inbox" && <Inbox />}

            {/* ── Blog ── */}
            {activeView === "blog" && <BlogEditor />}

            {/* ── Knowledge Base ── */}
            {activeView === "knowledge-base" && (
              <div className="space-y-8">
                <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
                <KnowledgeBaseManager />
              </div>
            )}

            {/* ── Admin Emails ── */}
            {activeView === "admin-emails" && (
              <div className="space-y-8">
                <h1 className="text-3xl font-bold tracking-tight">Admin Emails</h1>
                <AdminEmailsEditor />
              </div>
            )}

            {/* ── Marketing Emails ── */}
            {activeView === "marketing-emails" && (
              <div className="space-y-8">
                <h1 className="text-3xl font-bold tracking-tight">Marketing Emails</h1>
                <MarketingEmailsManager />
              </div>
            )}

            {/* ── Email Analytics ── */}
            {activeView === "email-analytics" && (
              <div className="space-y-8">
                <h1 className="text-3xl font-bold tracking-tight">Email Analytics</h1>
                <EmailAnalytics />
              </div>
            )}

            {/* ── SQL Studio ── */}
            {activeView === "sql-studio" && (
              <div className="space-y-8">
                <h1 className="text-3xl font-bold tracking-tight">SQL Query Studio</h1>
                <SqlQueryStudio />
              </div>
            )}

            {/* ── Website Analytics ── */}
            {activeView === "website-analytics" && (
              <WebsiteAnalytics />
            )}

            {/* ── Course Analytics ── */}
            {activeView === "course-analytics" && (
              <div className="space-y-8">
                <h1 className="text-3xl font-bold tracking-tight">Course Analytics</h1>
                <AdminCourseAnalytics />
              </div>
            )}

            {/* ── Custom Analytics Pages ── */}
            {typeof activeView === "string" && activeView.startsWith("custom:") && (
              <div className="space-y-8">
                <h1 className="text-3xl font-bold tracking-tight">{activeView.replace("custom:", "")}</h1>
                <PinnedQueryWidgets pageName={activeView} />
              </div>
            )}

          </main>
        </div>
      </div>
    </SidebarProvider>
    </div>
  );
};

function SubscribersManager() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [csvResults, setCsvResults] = useState<{ email: string; status: string }[] | null>(null);
  const [importing, setImporting] = useState(false);

  const { data: subscribers = [], isLoading } = useQuery({
    queryKey: ["newsletter-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("newsletter_subscribers" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("newsletter_subscribers" as any).update({ is_active } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] }),
  });

  const deleteSub = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("newsletter_subscribers" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] }); toast.success("Subscriber removed"); },
  });

  const handleAddSubscriber = async () => {
    if (!newEmail.trim()) { toast.error("Email is required"); return; }
    setAdding(true);
    try {
      const existing = (subscribers as any[]).find((s: any) => s.email?.toLowerCase() === newEmail.trim().toLowerCase());
      if (existing) { toast.error("This email is already subscribed"); setAdding(false); return; }
      const { error } = await supabase.from("newsletter_subscribers" as any).insert({ email: newEmail.trim().toLowerCase(), name: newName.trim() || null } as any);
      if (error) throw error;
      toast.success("Subscriber added");
      setNewName(""); setNewEmail("");
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to add subscriber");
    } finally { setAdding(false); }
  };

  const handleCsvDownloadTemplate = () => {
    const csv = "name,email\nJohn Doe,john@example.com";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "subscribers_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true); setCsvResults(null);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) { toast.error("CSV must have a header row and at least one data row"); setImporting(false); return; }
      const header = lines[0].toLowerCase().split(",").map(h => h.trim());
      const emailIdx = header.indexOf("email");
      const nameIdx = header.indexOf("name");
      if (emailIdx === -1) { toast.error("CSV must have an 'email' column"); setImporting(false); return; }

      const results: { email: string; status: string }[] = [];
      const existingEmails = new Set((subscribers as any[]).map((s: any) => s.email?.toLowerCase()));

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim().replace(/^["']|["']$/g, ""));
        const email = cols[emailIdx]?.toLowerCase();
        const name = nameIdx >= 0 ? cols[nameIdx] : "";
        if (!email || !email.includes("@")) { results.push({ email: email || `Row ${i + 1}`, status: "Invalid email" }); continue; }
        if (existingEmails.has(email)) { results.push({ email, status: "Duplicate" }); continue; }
        try {
          const { error } = await supabase.from("newsletter_subscribers" as any).insert({ email, name: name || null } as any);
          if (error) { results.push({ email, status: error.message }); } else {
            results.push({ email, status: "Success" }); existingEmails.add(email);
          }
        } catch (err: any) { results.push({ email, status: err.message }); }
      }
      setCsvResults(results);
      queryClient.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
      const successes = results.filter(r => r.status === "Success").length;
      toast.success(`Imported ${successes} of ${results.length} subscribers`);
    } catch (err: any) { toast.error("Failed to parse CSV"); } finally { setImporting(false); e.target.value = ""; }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Newsletter Subscribers</h1>
      <p className="text-muted-foreground text-base">{subscribers.length} subscriber{subscribers.length !== 1 ? "s" : ""} total</p>

      {/* Add Subscriber + CSV Import */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserPlus className="h-4 w-4" />Add Subscriber</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Name (optional)</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Jane Doe" /></div>
            <div><Label>Email *</Label><Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="jane@example.com" type="email" /></div>
            <Button onClick={handleAddSubscriber} disabled={adding} className="w-full">{adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}Add Subscriber</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" />Import CSV</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Upload a CSV with <code>name</code> and <code>email</code> columns.</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCsvDownloadTemplate}><Download className="h-4 w-4 mr-1" />Template</Button>
              <div className="relative flex-1">
                <Input type="file" accept=".csv" onChange={handleCsvUpload} disabled={importing} className="cursor-pointer" />
              </div>
            </div>
            {importing && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Importing...</div>}
          </CardContent>
        </Card>
      </div>

      {/* CSV Results */}
      {csvResults && (
        <Card>
          <CardHeader><CardTitle className="text-base">Import Results</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {csvResults.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{r.email}</TableCell>
                    <TableCell><Badge variant={r.status === "Success" ? "default" : "destructive"}>{r.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Existing Table */}
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subscribed</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(subscribers as any[]).map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell>{s.name || <span className="text-muted-foreground italic">—</span>}</TableCell>
                  <TableCell className="text-sm">{s.email}</TableCell>
                  <TableCell className="text-muted-foreground text-base">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Switch checked={s.is_active} onCheckedChange={(checked) => toggleActive.mutate({ id: s.id, is_active: checked })} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteSub.mutate(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {subscribers.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No subscribers yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function PromoCodesManager() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [percentOff, setPercentOff] = useState(10);
  const [amountOff, setAmountOff] = useState(5);
  const [duration, setDuration] = useState("once");
  const [durationMonths, setDurationMonths] = useState(3);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-promo-codes", { body: { action: "list" } });
      if (error) throw error;
      setCoupons(data.coupons || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load coupons");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setCreating(true);
    try {
      const body: any = { action: "create", name: name.trim(), duration, code: code.trim() || undefined };
      if (discountType === "percent") body.percent_off = percentOff;
      else body.amount_off = amountOff;
      if (duration === "repeating") body.duration_in_months = durationMonths;
      const { error } = await supabase.functions.invoke("manage-promo-codes", { body });
      if (error) throw error;
      toast.success("Promo code created!");
      setName(""); setCode("");
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || "Failed to create coupon");
    } finally { setCreating(false); }
  };

  const handleDelete = async (couponId: string) => {
    try {
      const { error } = await supabase.functions.invoke("manage-promo-codes", { body: { action: "delete", coupon_id: couponId } });
      if (error) throw error;
      toast.success("Coupon deleted");
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete coupon");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Promo Codes</h1>
      <p className="text-muted-foreground">Create and manage Stripe promotion codes. These codes can be entered by customers at checkout.</p>

      <Card>
        <CardHeader>
          <CardTitle>Create Promo Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Coupon Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Summer Sale" />
            </div>
            <div className="space-y-2">
              <Label>Promo Code (optional)</Label>
              <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="SUMMER2026" />
              <p className="text-xs text-muted-foreground">Auto-generated from name if empty</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select value={discountType} onValueChange={(v: "percent" | "amount") => setDiscountType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage</SelectItem>
                  <SelectItem value="amount">Fixed Amount (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{discountType === "percent" ? "Percent Off" : "Amount Off (€)"}</Label>
              {discountType === "percent"
                ? <Input type="number" min={1} max={100} value={percentOff} onChange={e => setPercentOff(Number(e.target.value))} />
                : <Input type="number" min={0.5} step={0.5} value={amountOff} onChange={e => setAmountOff(Number(e.target.value))} />}
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Once</SelectItem>
                  <SelectItem value="repeating">Repeating</SelectItem>
                  <SelectItem value="forever">Forever</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {duration === "repeating" && (
            <div className="space-y-2 max-w-xs">
              <Label>Duration (months)</Label>
              <Input type="number" min={1} value={durationMonths} onChange={e => setDurationMonths(Number(e.target.value))} />
            </div>
          )}
          <Button onClick={handleCreate} disabled={creating || !name.trim()}>
            {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : <><Plus className="mr-2 h-4 w-4" />Create Promo Code</>}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-muted-foreground">Loading...</p> : coupons.length === 0 ? <p className="text-muted-foreground">No coupons yet</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Codes</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.percent_off ? `${c.percent_off}%` : `€${(c.amount_off / 100).toFixed(2)}`}</TableCell>
                    <TableCell className="capitalize">{c.duration}{c.duration_in_months ? ` (${c.duration_in_months}mo)` : ""}</TableCell>
                    <TableCell>
                      {c.promotion_codes?.map((pc: any) => (
                        <Badge key={pc.id} variant={pc.active ? "default" : "secondary"} className="mr-1">{pc.code}</Badge>
                      ))}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Delete coupon?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this coupon and all its promotion codes.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(c.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminDashboard;
