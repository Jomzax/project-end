import 'bootstrap/dist/css/bootstrap.css'
import './globals.css'


import BootstrapClient from './bootstrap-client'
import { Sarabun } from 'next/font/google'


import { AuthProvider } from '@/app/lib/auth-context'
import { AlertProvider } from '@/app/lib/alert-context'
import Header from '@/app/components/layout/Header'
import Alert from '@/app/components/Alert'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata = {
  title: 'Pro',
  description: 'create next app',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={sarabun.className}
        suppressHydrationWarning
      >
        <BootstrapClient />
        <AlertProvider>
          <AuthProvider>
            <Alert />
            {children}
          </AuthProvider>
        </AlertProvider>

      </body>
    </html>
  )
}
