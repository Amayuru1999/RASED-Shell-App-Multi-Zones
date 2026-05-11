import { redirect } from 'next/navigation'

export default function Home() {
  // Middleware handles the actual redirect based on auth status,
  // but this is a fallback
  redirect('/dashboard')
}
