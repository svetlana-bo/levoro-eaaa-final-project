import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import PromoBanner from "@/components/PromoBanner";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import StudentDashboard from "./pages/StudentDashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CourseCatalog from "./pages/CourseCatalog";
import MyCourses from "./pages/MyCourses";
import CoursePlayer from "./pages/CoursePlayer";
import OurCourses from "./pages/OurCourses";
import Memberships from "./pages/Memberships";
import TeachOnLevoro from "./pages/TeachOnLevoro";
import LevoroForBusiness from "./pages/LevoroForBusiness";
import CoursePreview from "./pages/CoursePreview";
import BundlePage from "./pages/BundlePage";
import InstructorProfile from "./pages/InstructorProfile";
import FAQ from "./pages/FAQ";
import AboutUs from "./pages/AboutUs";
import Partnerships from "./pages/Partnerships";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogPreview from "./pages/BlogPreview";
import ContactSupport from "./pages/ContactSupport";
import Sustainability from "./pages/Sustainability";
import Accessibility from "./pages/Accessibility";
import DesignSystem from "./pages/DesignSystem";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import CompleteAccount from "./pages/CompleteAccount";
import Unsubscribe from "./pages/Unsubscribe";
import EmailPreferences from "./pages/EmailPreferences";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import PostHogPageView from "./components/PostHogPageView";
import ScrollToTop from "./components/ScrollToTop";
import OrganisationLayout from "./layouts/OrganisationLayout";
import OrgDashboard from "./pages/organisation/OrgDashboard";
import OrgUsers from "./pages/organisation/OrgUsers";
import OrgGroups from "./pages/organisation/OrgGroups";
import AdminLayout from "./layouts/AdminLayout";
import AdminCompaniesList from "./pages/admin/AdminCompaniesList";
import AdminCompanyCreate from "./pages/admin/AdminCompanyCreate";
import AdminCompanyDetail from "./pages/admin/AdminCompanyDetail";
import AdminViewAsRedirect from "./pages/admin/AdminViewAsRedirect";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <PromoBanner />
          <PostHogPageView />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/courses" element={<OurCourses />} />
            <Route path="/courses/:courseId" element={<CoursePreview />} />
            <Route path="/bundles/:slug" element={<BundlePage />} />
            <Route path="/instructor/:instructorId" element={<InstructorProfile />} />
            <Route path="/memberships" element={<Memberships />} />
            <Route path="/teach" element={<TeachOnLevoro />} />
            <Route path="/business" element={<LevoroForBusiness />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/partnerships" element={<Partnerships />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/preview/:id" element={
              <ProtectedRoute><RoleBasedRoute requiredRole="admin"><BlogPreview /></RoleBasedRoute></ProtectedRoute>
            } />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/contact" element={<ContactSupport />} />
            <Route path="/sustainability" element={<Sustainability />} />
            <Route path="/accessibility" element={<Accessibility />} />
            <Route path="/design-system" element={<DesignSystem />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/student" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
            <Route path="/instructor" element={
              <ProtectedRoute><RoleBasedRoute requiredRole="instructor"><InstructorDashboard /></RoleBasedRoute></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute><RoleBasedRoute requiredRole="admin"><AdminDashboard /></RoleBasedRoute></ProtectedRoute>
            } />
            <Route path="/catalog" element={<ProtectedRoute><CourseCatalog /></ProtectedRoute>} />
            <Route path="/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
            <Route path="/course/:courseId" element={<ProtectedRoute><CoursePlayer /></ProtectedRoute>} />
            <Route path="/email-preferences" element={<ProtectedRoute><EmailPreferences /></ProtectedRoute>} />
            <Route path="/complete-account" element={<CompleteAccount />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route element={<OrganisationLayout />}>
              <Route path="/organisation/dashboard" element={<OrgDashboard />} />
              <Route path="/organisation/users" element={<OrgUsers />} />
              <Route path="/organisation/groups" element={<OrgGroups />} />
            </Route>
            <Route path="/admin" element={<Navigate to="/admin/companies" replace />} />
            <Route path="/admin/companies/:id/view-as" element={<AdminViewAsRedirect />} />
            <Route element={<AdminLayout />}>
              <Route path="/admin/companies" element={<AdminCompaniesList />} />
              <Route path="/admin/companies/new" element={<AdminCompanyCreate />} />
              <Route path="/admin/companies/:id" element={<AdminCompanyDetail />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
