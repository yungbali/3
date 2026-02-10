import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://3-nine-brown.vercel.app";

export const metadata: Metadata = {
  title: "KOTOMO - AI Podcast Generator",
  description: "Turn any topic into a fully produced, multi-speaker podcast episode. Powered by multi-agent AI synthesis.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "KOTOMO - AI Podcast Generator",
    description: "Turn raw ideas into studio podcasts. Generate immersive audio episodes from a single topic.",
    url: siteUrl,
    siteName: "KOTOMO",
    images: [
      {
        url: "/og-image.png",
        width: 1024,
        height: 1024,
        alt: "KOTOMO - AI Podcast Generator",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KOTOMO - AI Podcast Generator",
    description: "Turn raw ideas into studio podcasts. Generate immersive audio episodes from a single topic.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
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
