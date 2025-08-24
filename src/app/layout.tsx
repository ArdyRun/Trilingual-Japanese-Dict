import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Lexend_Deca } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lexendDeca = Lexend_Deca({
  variable: "--font-lexend-deca",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "JIDict - Japanese Dictionary",
  description: "A minimalist Japanese dictionary for learning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" >
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lexendDeca.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );

}
