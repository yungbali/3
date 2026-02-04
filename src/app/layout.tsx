import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KOTOMO - AI Podcast Generator",
  description: "Turn any topic into a fully produced, multi-speaker podcast episode",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
