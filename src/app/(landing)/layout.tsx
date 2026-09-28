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
    "Meet the other side before it matters. Wiora is AI counterparts for live conversations: a real-time voice session, then the recording, transcript, summary, and Ask AI.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${display.variable} landing-root`}>{children}</div>;
}
