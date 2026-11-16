import { SidebarProvider } from "@/components/ui/sidebar";

import { DashboardNavbar } from "@/modules/dashboard/ui/components/dashboard-navbar";
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";

interface Props {
    children: React.ReactNode;
}

const Layout = ({children} : Props) => {
  return (
    <SidebarProvider>
        <DashboardSidebar />
        <main className="wiora-app flex h-svh min-h-0 w-full flex-col overflow-hidden bg-background">
          <DashboardNavbar />
          <div className="min-h-0 flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
    </SidebarProvider>
  )
}

export default Layout;
