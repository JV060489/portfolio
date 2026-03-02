import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Pixelify_Sans, Bitcount_Single_Ink } from 'next/font/google';

const bitCountSingleInk = Bitcount_Single_Ink({
  variable: "--font-bitcount-single-ink",
  subsets: ['latin'],
  weight: ['100', '400', '700', '900'], 
});
// Configure the font
const pixelySans = Pixelify_Sans({
  subsets: ['latin'],
  weight: '400', // Pixely Sans usually only has 400
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="en">
      <body
        className={`${bitCountSingleInk.variable} antialiased bg-[#1a1a2e] text-white`}
      >
        {children}
      </body>
    </html>
  );
}
