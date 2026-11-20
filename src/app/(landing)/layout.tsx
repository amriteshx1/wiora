import { Plus_Jakarta_Sans } from "next/font/google";
import type { Metadata } from "next";

import "@/modules/home/ui/styles/landing.css";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-landing-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wiora",
  description:
    "Meet the other side before it matters. Give the context, then sit across from an AI counterpart and practice the conversation live.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${display.variable} landing-root`}>{children}</div>;
}
