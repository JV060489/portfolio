import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Pixelify_Sans, Bitcount_Single_Ink, Aldrich, Bowlby_One } from 'next/font/google';
import { ThemeProvider } from "./context/ThemeContext";

const bitCountSingleInk = Bitcount_Single_Ink({
  variable: "--font-bitcount-single-ink",
  subsets: ['latin'],
  weight: ['100', '400', '700', '900'],
});
const bowlbyOne = Bowlby_One({
  variable: "--font-bowlby-one",
  subsets: ['latin'],
  weight: '400',
});

const pixelySans = Pixelify_Sans({
  subsets: ['latin'],
  weight: '400',
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const aldrich = Aldrich({
  variable: "--font-aldrich",
  weight: "400"
});

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Janarthanan Vasanth's Portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${bitCountSingleInk.variable} ${aldrich.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
