import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

// Force dynamic rendering to avoid static generation issues with next-auth
export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "NJ Stars Elite Basketball",
    template: "%s | NJ Stars Elite",
  },
  description:
    "Elite AAU basketball training and competitive play for rising stars in Bergen County, NJ.",
  icons: {
    icon: "/brand/logos/NJ Icon.svg",
    apple: "/brand/logos/NJ Icon.svg",
  },
  metadataBase: new URL("https://njstarselite.com"),
  openGraph: {
    title: "NJ Stars Elite Basketball",
    description:
      "Elite AAU basketball training and competitive play for rising stars in Bergen County, NJ.",
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
    title: "NJ Stars Elite Basketball",
    description:
      "Elite AAU basketball training and competitive play for rising stars in Bergen County, NJ.",
    images: ["/brand/logos/black-outlined.jpg"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
