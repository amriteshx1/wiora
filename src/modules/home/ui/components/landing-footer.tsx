"use client";

import Image from "next/image";
import { scrollToId } from "@/modules/home/ui/components/landing-ui";

const columns = [
  {
    title: "Product",
    links: [
      { label: "About", id: "about" },
      { label: "Practice", id: "features" },
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
    <footer>
      <div className="landing-shell grid gap-12 border-t border-[var(--wiora-rule)] pt-14 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:gap-16 md:pt-16">
        <div className="max-w-[28rem]">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-black.svg"
              alt="Wiora"
              width={24}
              height={24}
              className="size-6"
            />
            <span className="landing-display text-xl leading-none">Wiora</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--wiora-mute)]">
            Practice the conversation itself. An AI agent takes the other seat
            so you can rehearse out loud, then review the session before the
            real one.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <p className="text-sm font-medium">{column.title}</p>
              {column.links.map((link) =>
                "id" in link && link.id ? (
                  <button
                    key={link.label}
                    type="button"
                    onClick={() => scrollToId(link.id)}
                    className="w-fit text-left text-xs text-[var(--wiora-mute)] transition-colors hover:text-[var(--wiora-ink)]"
                  >
                    {link.label}
                  </button>
                ) : (
                  <p
                    key={link.label}
                    className="cursor-pointer text-xs text-[var(--wiora-mute)]"
                  >
                    {link.label}
                  </p>
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="landing-shell mt-12 flex flex-col gap-2 border-t border-[var(--wiora-rule)] pb-14 pt-6 sm:flex-row sm:items-center sm:justify-between md:pb-16">
        <p className="text-xs text-[var(--wiora-mute)]">© All Rights Reserved.</p>
        <p className="text-xs text-[var(--wiora-mute)]">Wiora</p>
      </div>
    </footer>
  );
}
