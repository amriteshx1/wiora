import { IBM_Plex_Serif } from "next/font/google";
import type { Metadata } from "next";

import "@/modules/home/ui/styles/landing.css";

const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
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
  return <div className={`${plexSerif.variable} landing-root`}>{children}</div>;
}
