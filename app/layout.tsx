import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cafe Coffee Aroma",
  description: "Premium dine-in QR ordering",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
