import { Navigate } from 'react-router-dom'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useAuthStore } from '@/features/auth/store'

export function LoginPage() {
  const { user, isAdmin, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  if (user && isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4 dark:bg-surface-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white">
            LM
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            LoadMind Admin
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Sign in to manage your products
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
