import { Metadata } from "next";

export const metadata: Metadata = {
  title: "NJ Stars Elite | Coming Soon 2026",
  description:
    "NJ Stars Elite AAU Basketball is warming up! Elite training and competitive play for rising stars in Bergen County, NJ.",
  openGraph: {
    title: "NJ Stars Elite | Coming Soon 2026",
    description:
      "Elite training and competitive play for rising stars in Bergen County, NJ.",
    url: "https://njstarselite.com",
    siteName: "NJ Stars Elite",
    images: [
      {
        url: "/brand/logos/black-outlined.jpg",
        width: 1200,
        height: 630,
        alt: "NJ Stars Elite Basketball",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NJ Stars Elite | Coming Soon 2026",
    description:
      "Elite training and competitive play for rising stars in Bergen County, NJ.",
    images: ["/brand/logos/black-outlined.jpg"],
  },
};

export default function WarmingUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
