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
    <footer>
      <div className="landing-shell grid gap-12 py-14 md:grid-cols-4 md:gap-10 md:py-16">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-black.svg"
              alt="Wiora"
              width={22}
              height={22}
              className="size-[22px] invert"
            />
            <span className="text-[15px] font-medium leading-none tracking-tight">Wiora</span>
          </div>
          <p className="mt-4 max-w-[22rem] text-sm leading-relaxed text-white/60">
            Practice one real conversation with an AI counterpart before it
            happens.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-x-8 gap-y-8 md:contents">
          {columns.map((column) => (
            <div
              key={column.title}
              className="flex min-w-[5.25rem] flex-col gap-3 md:min-w-[7rem]"
            >
              <p className="text-sm font-medium">{column.title}</p>
              {column.links.map((link) =>
                "id" in link && link.id ? (
                  <button
                    key={link.label}
                    type="button"
                    onClick={() => scrollToId(link.id)}
                    className="w-fit text-left text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </button>
                ) : (
                  <p
                    key={link.label}
                    className="text-sm text-white/60"
                  >
                    {link.label}
                  </p>
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="landing-shell flex flex-col gap-2 border-t border-white/15 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-white/50">© Wiora. All rights reserved.</p>
      </div>
    </footer>
  );
}
