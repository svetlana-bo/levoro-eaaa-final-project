import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  KeyRound,
  BookOpen,
  Route,
  BarChart3,
  ShieldCheck,
  Settings,
  HelpCircle,
  UserPlus,
  GraduationCap,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type Item = { title: string; url?: string; icon: any; disabled?: boolean };

const SECTIONS: { label: string; items: Item[] }[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/organisation/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "User management",
    items: [
      { title: "Users", url: "/organisation/users", icon: Users },
      { title: "Bulk invite", icon: UserPlus, disabled: true },
      { title: "Groups & departments", url: "/organisation/groups", icon: Building2 },
    ],
  },
  {
    label: "Course management",
    items: [
      { title: "Course access", icon: KeyRound, disabled: true },
      { title: "Internal courses", icon: BookOpen, disabled: true },
      { title: "Learning paths", icon: Route, disabled: true },
    ],
  },
  {
    label: "Insights",
    items: [{ title: "Reports", icon: BarChart3, disabled: true }],
  },
  {
    label: "Account",
    items: [
      { title: "SSO & security", icon: ShieldCheck, disabled: true },
      { title: "Organisation settings", icon: Settings, disabled: true },
      { title: "Knowledge base", icon: HelpCircle, disabled: true },
    ],
  },
];

export function OrgSidebar() {
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent className="bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 px-4 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight">Levoro Academy</div>
            <div className="text-xs text-sidebar-foreground/70">Company portal</div>
          </div>
        </div>

        {SECTIONS.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = item.url ? pathname === item.url : false;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.title}>
                      {item.disabled || !item.url ? (
                        <div
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-2 text-sm opacity-50",
                          )}
                          aria-disabled
                          title="Available in a later stage"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </div>
                      ) : (
                        <SidebarMenuButton asChild isActive={isActive}>
                          <NavLink to={item.url} className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
