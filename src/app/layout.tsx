import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { ThemeProvider } from "@/components/layout/theme-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wealth AI — Smart Money Dashboard",
  description:
    "AI-powered personal finance tracker with smart expense categorization, visual goal tracking, and spending insights.",
};

// Prevents flash of wrong theme before React hydrates.
// This is a STATIC string — no user input flows into it.
// It reads localStorage('theme') and only allows 'light' | 'dark' through
// a strict equality check, so localStorage poisoning cannot inject attributes.
const themeScript = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  } catch(e) {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read per-request CSP nonce set by middleware
  const headerStore = await headers();
  const nonce = headerStore.get('x-nonce') ?? '';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Theme init — safe static script, nonce-protected for CSP compliance */}
        {/* suppressHydrationWarning: browsers blank nonce attrs after consumption */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} suppressHydrationWarning />
      </head>
      <body className={geistSans.variable}>
        <ThemeProvider>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
