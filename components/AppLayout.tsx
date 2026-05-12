'use client'

import { SharedAppLayout } from 'rased-shared-ui'
import { useAuthStore } from '../store/authStore'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const userName = user ? `${user.firstName} ${user.lastName}` : 'test User'

  return (
    <SharedAppLayout userName={userName} logoutHref="/api/auth/logout">
      {children}
    </SharedAppLayout>
  )
}
