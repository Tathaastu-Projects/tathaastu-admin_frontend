import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tathasstu Admin Dashboard",
  description: "Admin dashboard for Tathasstu spiritual platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

