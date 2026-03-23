import { useState, type FormEvent } from 'react'
import { useAuthStore } from '../store'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, loading, error } = useAuthStore()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await signIn(email, password)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="admin@loadmind.com"
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        required
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <Button type="submit" loading={loading} className="w-full">
        Sign In
      </Button>
    </form>
  )
}
