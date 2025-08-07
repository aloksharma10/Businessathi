import type { Metadata } from "next";
import "./globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { SessionWrapper } from "@/components/session-wraper";
import { ModalProvider } from "@/components/providers/modal-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LoadingProvider } from "@/components/providers/loading-provider";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Business Sathi",
  description: "Generated to manage your Business",
  icons: { icon: "/Logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={cn("bg-background font-sans antialiased", fontSans.variable)}
      >
        <LoadingProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SessionWrapper>
              <ModalProvider />
              {children}
              <Toaster
                richColors={true}
                position="top-right"
                offset={{ top: 75 }}
                mobileOffset={{ top: 67 }}
                swipeDirections={["right"]}
              />
            </SessionWrapper>
          </ThemeProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
