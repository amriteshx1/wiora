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
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

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
      <SidebarHeader>
        <Link href="/home" className="flex items-center gap-2 px-2 pt-2">
          <Image src="/logo.svg" height={22} width={22} alt="Wiora" />
          <p className="text-lg font-medium tracking-tight">Wiora</p>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-9",
                      isNavActive(pathname, item.href) && "bg-sidebar-accent",
                    )}
                    isActive={isNavActive(pathname, item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <DashboardUserButton />
      </SidebarFooter>
    </Sidebar>
  );
};
