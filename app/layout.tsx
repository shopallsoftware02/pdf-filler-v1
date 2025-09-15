import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'PDF Form Filler - Fill PDF Forms Instantly',
  description: 'Upload your PDF documents, automatically detect form fields, fill them out with ease, and generate completed PDFs instantly.',
  keywords: ['PDF', 'form filler', 'PDF forms', 'document automation', 'fillable PDF'],
  authors: [{ name: 'PDF Form Filler' }],
  creator: 'PDF Form Filler',
  openGraph: {
    title: 'PDF Form Filler - Fill PDF Forms Instantly',
    description: 'Upload your PDF documents, automatically detect form fields, fill them out with ease, and generate completed PDFs instantly.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF Form Filler',
    description: 'Upload your PDF documents, automatically detect form fields, fill them out with ease, and generate completed PDFs instantly.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
