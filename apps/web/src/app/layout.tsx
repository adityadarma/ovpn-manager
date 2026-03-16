import type { Metadata } from 'next'
import { Inter, Geist } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/providers/query-provider'
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/providers/theme-provider"

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OpenVPN Manager',
  description: 'Centralized OpenVPN Management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        {/* Runtime environment configuration */}
        <script src="/env-config.js" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
