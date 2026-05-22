import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Handshake,
  UserCog,
  ScrollText,
  ShieldCheck,
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
    items: [{ title: "Dashboard", icon: LayoutDashboard, disabled: true }],
  },
  {
    label: "Customers",
    items: [
      { title: "Companies", url: "/admin/companies", icon: Building2 },
      { title: "Engagements", icon: Handshake, disabled: true },
    ],
  },
  {
    label: "Internal",
    items: [
      { title: "Internal users", icon: UserCog, disabled: true },
      { title: "Audit log", icon: ScrollText, disabled: true },
    ],
  },
];

export function AdminSidebar() {
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent className="bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 px-4 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--gold))] text-[hsl(var(--navy-dark))]">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight">Levoro Admin</div>
            <div className="text-xs text-sidebar-foreground/70">Internal portal</div>
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
                  const isActive = item.url ? pathname.startsWith(item.url) : false;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.title}>
                      {item.disabled || !item.url ? (
                        <div
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-2 text-sm italic opacity-50",
                          )}
                          aria-disabled
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
