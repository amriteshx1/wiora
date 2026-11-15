"use client";

import Image from "next/image";
import { scrollToId } from "@/modules/home/ui/components/landing-ui";

const columns = [
  {
    title: "Product",
    links: [
      { label: "About", id: "about" },
      { label: "Sessions", id: "product" },
      { label: "How it works", id: "workflow" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs" },
      { label: "Help" },
      { label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy" },
      { label: "Terms" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--wiora-rule)]">
      <div className="landing-shell grid gap-12 py-14 md:grid-cols-4 md:gap-10 md:py-16">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-black.svg"
              alt="Wiora"
              width={22}
              height={22}
              className="size-[22px]"
            />
            <span className="text-[15px] font-medium leading-none tracking-tight">Wiora</span>
          </div>
          <p className="mt-4 max-w-[22rem] text-sm leading-relaxed text-[var(--wiora-mute)]">
            Prepare one real conversation, practice it live, then read what to
            do next.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <p className="text-sm font-medium">{column.title}</p>
            {column.links.map((link) =>
              "id" in link && link.id ? (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => scrollToId(link.id)}
                  className="w-fit text-left text-sm text-[var(--wiora-mute)] transition-colors hover:text-[var(--wiora-ink)]"
                >
                  {link.label}
                </button>
              ) : (
                <p
                  key={link.label}
                  className="text-sm text-[var(--wiora-mute)]"
                >
                  {link.label}
                </p>
              ),
            )}
          </div>
        ))}
      </div>

      <div className="landing-shell flex flex-col gap-2 border-t border-[var(--wiora-rule)] py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--wiora-mute)]">© Wiora. All rights reserved.</p>
      </div>
    </footer>
  );
}
