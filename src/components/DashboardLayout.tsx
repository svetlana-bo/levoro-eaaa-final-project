import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, LayoutDashboard, GraduationCap, Settings, LogOut, Mail } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import GlobalNavbar from "@/components/GlobalNavbar";

const navItems = [
  { title: "Dashboard", url: "/student", icon: LayoutDashboard },
  { title: "My Courses", url: "/my-courses", icon: GraduationCap },
  { title: "Email Preferences", url: "/email-preferences", icon: Mail },
];

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-sidebar-primary shrink-0" />
          {!collapsed && <span className="font-bold text-lg font-sans">Student Dashboard</span>}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalNavbar hideOnScroll={false} />
      <SidebarProvider>
        <div className="flex-1 flex w-full dashboard-sidebar-offset">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 flex items-center border-b px-4 bg-card">
              <SidebarTrigger className="mr-4" />
              <span className="text-sm text-muted-foreground">Learning Management System</span>
              <div className="ml-auto">
                <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            </header>
            <main className="flex-1 p-6 md:p-8">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default DashboardLayout;
