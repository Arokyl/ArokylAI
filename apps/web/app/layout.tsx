'use client'

import '@rainbow-me/rainbowkit/styles.css'
import './globals.css'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import Providers from '@/components/Providers'
import Navbar from '@/components/Navbar'
import RemarkNotification from '@/components/RemarkNotification'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'ArokylAI — Intelligent Agent Wallet',
  description: 'AI-powered custodial wallet agent for Monad and Arc testnets. Swap, compare routes, execute, and get real-time AI remarks on your wallet activity.',
  icons: {
    icon: '/somnia-agent-logo.png',
    apple: '/somnia-agent-logo.png',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          <Navbar />
          {children}
          <RemarkNotification address="" />
        </Providers>
      </body>
    </html>
  )
}
