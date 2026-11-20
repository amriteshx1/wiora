"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CreditCardIcon, HouseIcon, NotebookPenIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

import { DashboardSidebarPlanCard } from "./dashboard-sidebar-plan-card";
import { DashboardUserButton } from "./dashboard-user-button";

const items = [
  {
    icon: HouseIcon,
    label: "Home",
    href: "/home",
  },
  {
    icon: NotebookPenIcon,
    label: "Preparations",
    href: "/preparations",
  },
  {
    icon: CreditCardIcon,
    label: "Credits",
    href: "/upgrade",
  },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/home") {
    return pathname === "/home" || pathname.startsWith("/preparations/new");
  }
  if (href === "/preparations") {
    return pathname === "/preparations"
      || (pathname.startsWith("/preparations/") && !pathname.startsWith("/preparations/new"));
  }
  return pathname === href;
}

export const DashboardSidebar = () => {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 pt-5 pb-2">
        <Link href="/home" className="flex items-center gap-2">
          <Image src="/logo.svg" height={22} width={22} alt="Wiora" />
          <p className="text-lg font-medium tracking-tight">Wiora</p>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-3 pt-4">
        <nav className="flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-3 rounded-[24px] px-3 text-sm tracking-tight text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                isNavActive(pathname, item.href) && "bg-sidebar-accent text-sidebar-foreground",
              )}
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </SidebarContent>
      <SidebarFooter className="gap-3 px-3 pb-4">
        <DashboardSidebarPlanCard />
        <DashboardUserButton />
      </SidebarFooter>
    </Sidebar>
  );
};
