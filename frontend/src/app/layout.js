import 'bootstrap/dist/css/bootstrap.css'
import './globals.css'


import BootstrapClient from './bootstrap-client'
import { Inter } from 'next/font/google'


import { AuthProvider } from '@/app/lib/auth-context'
import Header from '@/app/components/layout/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Pro',
  description: 'create next app',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}
      suppressHydrationWarning
      >
        <BootstrapClient />
        <AuthProvider>
          {children}
        </AuthProvider>

      </body>
    </html>
  )
}
