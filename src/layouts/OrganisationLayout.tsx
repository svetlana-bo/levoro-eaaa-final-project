import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { OrgSidebar } from "@/components/organisation/OrgSidebar";
import { ViewAsBanner } from "@/components/organisation/ViewAsBanner";

export default function OrganisationLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <OrgSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <ViewAsBanner />
          <header className="flex h-14 items-center gap-2 border-b border-border bg-card px-4 md:hidden">
            <SidebarTrigger />
            <span className="text-sm font-semibold text-foreground">Company portal</span>
          </header>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
