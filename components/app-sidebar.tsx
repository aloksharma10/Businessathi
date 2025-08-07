"use client";

import {
  FileText,
  LayoutDashboardIcon,
  Package,
  Plus,
  ReceiptTextIcon,
  ScrollText,
  UsersRoundIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { getTimeGreeting } from "@/lib/greeting";
import { useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Gst",
    url: "#",
    icon: ScrollText,
    isActive: true,
    items: [
      {
        title: "Create Invoice",
        url: "/gst/create-invoice",
        icon: Plus,
      },
      {
        title: "Invoices",
        url: "/gst/invoices",
        icon: ReceiptTextIcon,
      },
      {
        title: "Customers",
        url: "/gst/customers",
        icon: UsersRoundIcon,
      },
      {
        title: "Products",
        url: "/gst/products",
        icon: Package,
      },
    ],
  },
  {
    title: "General",
    url: "#",
    icon: FileText,
    isActive: true,
    items: [
      {
        title: "Create Invoice",
        url: "/local/create-invoice",
        icon: Plus,
      },
      {
        title: "Invoices",
        url: "/local/invoices",
        icon: ReceiptTextIcon,
      },
      {
        title: "Customers",
        url: "/local/customers",
        icon: UsersRoundIcon,
      },
      {
        title: "Products",
        url: "/local/products",
        icon: Package,
      },
    ],
  },
];

// const teams = [
//   {
//     name: "Acme Inc",
//     logo: GalleryVerticalEnd,
//     plan: "Enterprise",
//   },
//   {
//     name: "Acme Corp.",
//     logo: AudioWaveform,
//     plan: "Startup",
//   },
//   {
//     name: "Evil Corp.",
//     logo: Command,
//     plan: "Free",
//   },
// ];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { data: session } = useSession();
  const pathname = usePathname();

  const firstName = useMemo(
    () => session?.user?.name?.split(" ")[0] ?? "there",
    [session?.user?.name]
  );
  const greeting = useMemo(() => getTimeGreeting(firstName), [firstName]);

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                {!isCollapsed && (
                  <span className="text-sm font-semibold">{greeting}</span>
                )}
                <SidebarTrigger className="-ml-1 bg-transparent" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain as any} group="" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
