import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="relative @container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 p-4 md:p-8">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
