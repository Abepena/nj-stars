import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

// Force dynamic rendering to avoid static generation issues with next-auth
export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NJ Stars Basketball",
  description: "Official website for NJ Stars AAU Basketball Team",
  icons: {
    icon: "/brand/logos/NJ Icon.svg",
  },
}

// Script to prevent theme flash - runs before React hydration
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('nj-stars-theme');
      if (theme === 'light' || theme === 'dark') {
        document.documentElement.classList.add(theme);
      } else if (theme === 'system') {
        var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.classList.add(systemTheme);
      } else {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      document.documentElement.classList.add('dark');
    }
  })();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
