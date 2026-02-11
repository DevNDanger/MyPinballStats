import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'My Pinball Stats',
  description: 'Personal pinball statistics from IFPA, Match Play, and Stern Insider Connected',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
