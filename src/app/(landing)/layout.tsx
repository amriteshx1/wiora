import { Plus_Jakarta_Sans } from "next/font/google";
import type { Metadata } from "next";

import "@/modules/home/ui/styles/landing.css";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-landing-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wiora",
  description:
    "Practice the conversations that matter. An AI agent takes the other seat for a live voice session, then you review the record before the one that counts.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${display.variable} landing-root`}>{children}</div>;
}
