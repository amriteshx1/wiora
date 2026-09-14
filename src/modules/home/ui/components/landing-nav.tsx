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
  { label: "About", id: "about", visibility: "md:block hidden" },
  { label: "Practice", id: "features", visibility: "md:block hidden" },
  { label: "How it works", id: "workflow", visibility: "lg:block hidden" },
] as const;

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[var(--wiora-paper)]">
      <div className="landing-shell flex h-16 items-center justify-between border-b border-[var(--wiora-rule)]">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo-black.svg"
            alt="Wiora"
            width={28}
            height={28}
            className="size-7"
          />
          <span className="landing-display text-[1.35rem] leading-none">Wiora</span>
        </Link>

        <div className="flex items-center gap-6 lg:gap-8">
          <nav className="flex items-center gap-6 lg:gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToId(item.id)}
                className={`${item.visibility} text-sm text-[var(--wiora-ink)]/80 transition-colors hover:text-[var(--wiora-ink)]`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              className="md:hidden size-9 rounded-sm border border-[var(--wiora-rule)] bg-white text-[var(--wiora-ink)] shadow-none hover:bg-[var(--wiora-mist)]"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <XIcon className="size-4" /> : <MenuIcon className="size-4" />}
            </Button>
            <Button asChild className={cn(landingGhostBtn, "hidden h-8 px-3 text-xs sm:inline-flex md:h-9 md:text-sm")}>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild className={cn(landingPrimaryBtn, "h-8 px-3 text-xs md:h-9 md:text-sm")}>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>

      {open ? (
        <div className="bg-[var(--wiora-paper)] md:hidden">
          <div className="landing-shell flex flex-col border-t border-[var(--wiora-rule)] py-3">
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
