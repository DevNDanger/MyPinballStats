import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Jason's Pinball Fucking DASHBOARD!!",
  description: 'Personal pinball statistics from IFPA and Match Play',
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
