import { create } from 'zustand'
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from '@/shared/lib/firebase'

interface AuthState {
  user: User | null
  isAdmin: boolean
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  init: () => () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  loading: true,
  error: null,

  signIn: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const tokenResult = await result.user.getIdTokenResult()
      const isAdmin = tokenResult.claims.admin === true

      if (!isAdmin) {
        await firebaseSignOut(auth)
        set({ user: null, isAdmin: false, loading: false, error: 'Access denied. Admin privileges required.' })
        return
      }

      set({ user: result.user, isAdmin: true, loading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      set({ loading: false, error: message })
    }
  },

  signOut: async () => {
    await firebaseSignOut(auth)
    set({ user: null, isAdmin: false })
  },

  init: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await user.reload()
        const refreshed = auth.currentUser!
        const tokenResult = await refreshed.getIdTokenResult()
        const isAdmin = tokenResult.claims.admin === true
        set({ user: refreshed, isAdmin, loading: false })
      } else {
        set({ user: null, isAdmin: false, loading: false })
      }
    })
    return unsubscribe
  },
}))
