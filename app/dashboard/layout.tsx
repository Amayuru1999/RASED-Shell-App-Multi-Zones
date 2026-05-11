import { AuthProvider } from '@/components/AuthProvider'
import { AppLayout } from '@/components/AppLayout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <AppLayout>
        {children}
      </AppLayout>
    </AuthProvider>
  )
}
