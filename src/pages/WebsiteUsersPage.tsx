import { useEffect, useState, useCallback } from 'react'
import { DataTable } from '@/shared/components/ui/DataTable'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { api } from '@/shared/lib/api'
import { ShieldOff, ShieldCheck, UserCog, Trash2 } from 'lucide-react'

interface WebsiteUser {
  id: string
  email?: string
  display_name?: string
  displayName?: string
  plan?: string
  status?: string
  created_at?: string
  [key: string]: unknown
}

export function WebsiteUsersPage() {
  const [users, setUsers] = useState<WebsiteUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<WebsiteUser | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const fetchUsers = useCallback(() => {
    setLoading(true)
    api.get<WebsiteUser[]>('/api/users?product=3d-planning')
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleAction = async (action: () => Promise<void>) => {
    setActionLoading(true)
    try {
      await action()
      setSelected(null)
      setConfirmDelete(false)
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const freeCount = users.filter((u) => u.plan !== 'paid').length
  const paidCount = users.filter((u) => u.plan === 'paid').length
  const blockedCount = users.filter((u) => u.status === 'blocked').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-surface-500">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
          Website Users
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">Registered on load-mind.com</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-800">
          <p className="text-sm text-surface-500 dark:text-surface-400">Total Users</p>
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{users.length}</p>
        </div>
        <div className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-800">
          <p className="text-sm text-surface-500 dark:text-surface-400">Free Tier</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{freeCount}</p>
        </div>
        <div className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-800">
          <p className="text-sm text-surface-500 dark:text-surface-400">Paid</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{paidCount}</p>
        </div>
        <div className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-800">
          <p className="text-sm text-surface-500 dark:text-surface-400">Blocked</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{blockedCount}</p>
        </div>
      </div>

      <DataTable
        data={users}
        columns={[
          {
            key: 'display_name',
            label: 'Name',
            sortable: true,
            render: (u: WebsiteUser) => <span>{u.display_name || u.displayName || '-'}</span>,
          },
          { key: 'email', label: 'Email', sortable: true },
          {
            key: 'plan',
            label: 'Plan',
            render: (u: WebsiteUser) => (
              <Badge variant={u.plan === 'paid' ? 'success' : 'warning'}>{u.plan || 'free'}</Badge>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (u: WebsiteUser) => (
              <Badge variant={u.status === 'blocked' ? 'danger' : 'success'}>
                {u.status || 'active'}
              </Badge>
            ),
          },
          {
            key: 'created_at',
            label: 'Registered',
            sortable: true,
            render: (u: WebsiteUser) => (
              <span>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</span>
            ),
          },
          {
            key: 'actions',
            label: '',
            render: (u: WebsiteUser) => (
              <Button variant="ghost" size="sm" onClick={() => setSelected(u)}>
                <UserCog size={16} />
                Manage
              </Button>
            ),
          },
        ]}
        searchable
        searchPlaceholder="Search users..."
      />

      <Modal
        open={!!selected}
        onClose={() => { setSelected(null); setConfirmDelete(false) }}
        title={selected?.display_name || selected?.displayName || selected?.email || 'User'}
      >
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">Email</p>
              <p className="font-medium text-surface-900 dark:text-surface-100">{selected.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400">Plan</p>
                <p className="font-medium text-surface-900 dark:text-surface-100">{selected.plan || 'free'}</p>
              </div>
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400">Status</p>
                <Badge variant={selected.status === 'blocked' ? 'danger' : 'success'}>
                  {selected.status || 'active'}
                </Badge>
              </div>
            </div>
            {selected.created_at && (
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400">Registered</p>
                <p className="font-medium text-surface-900 dark:text-surface-100">
                  {new Date(selected.created_at).toLocaleDateString()}
                </p>
              </div>
            )}

            <hr className="border-surface-200 dark:border-surface-700" />

            <div className="space-y-3">
              <h3 className="font-medium text-surface-900 dark:text-surface-100">Actions</h3>
              <div className="flex flex-wrap gap-2">
                {(selected.status || 'active') !== 'blocked' ? (
                  <Button
                    variant="danger"
                    size="sm"
                    loading={actionLoading}
                    onClick={() => handleAction(() => api.post(`/api/trial/${selected.id}/block`, {}))}
                  >
                    <ShieldOff size={14} />
                    Block User
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={actionLoading}
                    onClick={() => handleAction(() => api.post(`/api/trial/${selected.id}/unblock`, {}))}
                  >
                    <ShieldCheck size={14} />
                    Unblock User
                  </Button>
                )}
              </div>
            </div>

            <div className="border-t border-surface-200 pt-4 dark:border-surface-700">
              {!confirmDelete ? (
                <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={14} />
                  Delete User
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-red-600 dark:text-red-400">Are you sure? This cannot be undone.</span>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={actionLoading}
                    onClick={() => handleAction(() => api.delete(`/api/trial/${selected.id}`))}
                  >
                    Confirm Delete
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
