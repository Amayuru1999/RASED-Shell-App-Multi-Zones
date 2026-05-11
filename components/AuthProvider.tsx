'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '../store/authStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, clearUser, setLoading, isLoading } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session')
        const data = await res.json()

        if (data.authenticated && data.user) {
          setUser(data.user)
        } else {
          clearUser()
          if (pathname !== '/' && !pathname.startsWith('/api/auth')) {
            router.push(`/api/auth/login?returnUrl=${encodeURIComponent(pathname)}`)
          }
        }
      } catch (err) {
        console.error('Session check failed', err)
        clearUser()
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [pathname, router, setUser, clearUser, setLoading])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium text-slate-600">Verifying session...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
