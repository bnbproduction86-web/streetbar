import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Street Bar POS | Cashier & Bar Management",
  description: "Aplikasi POS Street Bar",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { PosProvider } from "@/context/PosContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased bg-[#FBFBFC] text-[#18191B] overflow-x-hidden">
        <PosProvider>
          {children}
        </PosProvider>
      </body>
    </html>
  );
}
