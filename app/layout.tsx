import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tathasstu Admin Dashboard",
  description: "Admin dashboard for Tathasstu spiritual platform",
  // No site favicon — blank so browsers do not show the default Next/Vercel icon
  icons: {
    icon: [{ url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" }],
    shortcut: [{ url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" }],
    apple: [{ url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" }],
  },
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

