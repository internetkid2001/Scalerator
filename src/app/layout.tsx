import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scale Explorer", // Changed title here
  description: "Explore musical scales on a fretboard, tablature, and standard notation.", // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon SVG - a simple musical note */}
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='%232563EB' d='M50 10C33.43 10 20 23.43 20 40V70C20 86.57 33.43 100 50 100C66.57 100 80 86.57 80 70V40C80 23.43 66.57 10 50 10ZM50 20C61.05 20 70 28.95 70 40V70C70 81.05 61.05 90 50 90C38.95 90 30 81.05 30 70V40C30 28.95 38.95 20 50 20ZM50 30C44.47 30 40 34.47 40 40V70C40 75.53 44.47 80 50 80C55.53 80 60 75.53 60 70V40C60 34.47 55.53 30 50 30ZM50 40C52.76 40 55 42.24 55 45V70C55 72.76 52.76 75 50 75C47.24 75 45 72.76 45 70V45C45 42.24 47.24 40 50 40Z'/%3E%3C/svg%3E" type="image/svg+xml" />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
