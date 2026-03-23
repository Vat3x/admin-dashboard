import { useEffect, useState } from 'react'
import { DataTable } from '@/shared/components/ui/DataTable'
import { Badge } from '@/shared/components/ui/Badge'
import { api } from '@/shared/lib/api'

interface UserItem {
  id: string
  email?: string
  displayName?: string
  display_name?: string
  plan?: string
  daily_count?: number
  daily_limit?: number
  status?: string
  created_at?: string
  [key: string]: unknown
}

export function PlanningUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<UserItem[]>('/api/users?product=3d-planning')
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-surface-500">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">3D Planning Users</h1>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-800">
          <p className="text-sm text-surface-500 dark:text-surface-400">Total Users</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{users.length}</p>
        </div>
        <div className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-800">
          <p className="text-sm text-surface-500 dark:text-surface-400">Free Tier</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {users.filter((u) => !u.plan || u.plan === 'free').length}
          </p>
        </div>
        <div className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-800">
          <p className="text-sm text-surface-500 dark:text-surface-400">Paid</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {users.filter((u) => u.plan && u.plan !== 'free').length}
          </p>
        </div>
      </div>

      <DataTable
        data={users}
        columns={[
          {
            key: 'displayName',
            label: 'Name',
            sortable: true,
            render: (u: UserItem) => <span>{u.displayName || u.display_name || '-'}</span>,
          },
          { key: 'email', label: 'Email', sortable: true },
          {
            key: 'plan',
            label: 'Plan',
            render: (u: UserItem) => (
              <Badge variant={u.plan === 'paid' ? 'success' : 'warning'}>
                {u.plan || 'free'}
              </Badge>
            ),
          },
          {
            key: 'created_at',
            label: 'Registered',
            sortable: true,
            render: (u: UserItem) => (
              <span>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</span>
            ),
          },
        ]}
        searchable
        searchPlaceholder="Search users..."
      />
    </div>
  )
}
