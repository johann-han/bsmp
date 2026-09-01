import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthGate } from "../src/components/AuthGate";
import { GlobalNav } from "../src/components/GlobalNav";
import { WorkspaceBackButton } from "../src/components/WorkspaceBackButton";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "BSMP",
  description: "Bible Study Ministry Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <GlobalNav />
        <AuthGate>
          <WorkspaceBackButton />
          {children}
        </AuthGate>
      </body>
    </html>
  );
}
