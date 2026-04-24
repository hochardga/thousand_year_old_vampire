import type { ReactNode } from "react";
import type { Metadata } from "next";
import { resolveSiteUrl } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  metadataBase: new URL(resolveSiteUrl()),
  title: "Thousand Year Old Vampire: Digital Edition",
  description: "A guided digital ritual for a solitary gothic life. Private beta.",
  openGraph: {
    title: "Thousand Year Old Vampire: Digital Edition",
    description: "A guided digital ritual for a solitary gothic life. Private beta.",
    images: ["/og/tyov-beta-card.png"],
    type: "website",
  },
};

export default function MarketingLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
