import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { SiteHeader } from "../components/site-header";

export const metadata: Metadata = {
  title: "BidWave",
  description: "Regional live shopping marketplace MVP for CZ/SK."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
