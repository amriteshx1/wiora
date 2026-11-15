"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MenuIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  landingGhostBtn,
  landingPrimaryBtn,
  scrollToId,
} from "@/modules/home/ui/components/landing-ui";

const navItems = [
  { label: "Product", id: "product" },
  { label: "How it works", id: "workflow" },
  { label: "Credits", id: "credits" },
] as const;

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[var(--wiora-paper)]/90 backdrop-blur-md">
      <div className="landing-shell flex h-[52px] items-center justify-between">
        <div className="flex items-center gap-8 lg:gap-10">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-black.svg"
              alt="Wiora"
              width={22}
              height={22}
              className="size-[22px]"
            />
            <span className="text-[15px] font-medium leading-none tracking-tight">Wiora</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToId(item.id)}
                className="text-sm text-[var(--wiora-ink)]/80 transition-colors hover:text-[var(--wiora-ink)]"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            className="size-9 rounded-full border border-[var(--wiora-rule)] bg-[var(--wiora-paper)] text-[var(--wiora-ink)] shadow-none hover:bg-[var(--wiora-mist)] md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <XIcon className="size-4" /> : <MenuIcon className="size-4" />}
          </Button>
          <Button asChild className={cn(landingGhostBtn, "hidden h-8 px-3.5 text-[13px] sm:inline-flex")}>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild className={cn(landingPrimaryBtn, "h-8 px-3.5 text-[13px]")}>
            <Link href="/sign-up">Sign up</Link>
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-[var(--wiora-rule)] bg-[var(--wiora-paper)] md:hidden">
          <div className="landing-shell flex flex-col py-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="py-2.5 text-left text-sm"
                onClick={() => {
                  setOpen(false);
                  scrollToId(item.id);
                }}
              >
                {item.label}
              </button>
            ))}
            <Link
              href="/sign-in"
              className="py-2.5 text-sm sm:hidden"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
