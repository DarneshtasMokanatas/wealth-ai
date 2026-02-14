import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { SidebarProvider } from "@/components/layout/sidebar-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinanceAI — Smart Money Dashboard",
  description:
    "AI-powered personal finance tracker with smart expense categorization, visual goal tracking, and spending insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SidebarProvider>
          <div className="app-shell">
            <Sidebar />
            <div className="app-main">
              <Header />
              <main className="app-content">{children}</main>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
