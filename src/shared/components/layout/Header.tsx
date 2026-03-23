import { useState, useRef, useEffect } from 'react'
import { Moon, Sun, LogOut } from 'lucide-react'
import { useDarkMode } from '@/shared/hooks/useDarkMode'
import { useAuthStore } from '@/features/auth/store'

export function Header() {
  const { isDark, toggle } = useDarkMode()
  const { user, signOut } = useAuthStore()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-200 bg-white px-6 dark:border-surface-700 dark:bg-surface-900">
      <div />
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-surface-900"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white uppercase">
                {user?.email?.charAt(0) ?? '?'}
              </div>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-surface-200 bg-white py-1 shadow-lg dark:border-surface-700 dark:bg-surface-800">
              <div className="border-b border-surface-200 px-4 py-3 dark:border-surface-700">
                <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => { setOpen(false); signOut() }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
