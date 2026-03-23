import { useEffect, useState, useCallback } from 'react'
import { DataTable } from '@/shared/components/ui/DataTable'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { api } from '@/shared/lib/api'
import { ShieldOff, ShieldCheck, UserCog, Trash2 } from 'lucide-react'

interface UserItem {
  id: string
  email?: string
  displayName?: string
  name?: string
  role?: string
  companyId?: string
  disabled?: boolean
  [key: string]: unknown
}

export function TrackerUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const fetchUsers = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ product: 'tracker' })
    if (roleFilter !== 'all') params.set('role', roleFilter)
    api.get<UserItem[]>(`/api/users?${params.toString()}`)
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleBlock = async (user: UserItem) => {
    setActionLoading(true)
    try {
      const action = user.disabled ? 'unblock' : 'block'
      await api.post(`/api/users/${user.id}/${action}`, {})
      setSelectedUser(null)
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRoleChange = async (user: UserItem, newRole: string) => {
    setActionLoading(true)
    try {
      await api.post(`/api/users/${user.id}/role`, { role: newRole })
      setSelectedUser(null)
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (user: UserItem) => {
    setActionLoading(true)
    try {
      await api.delete(`/api/users/${user.id}`)
      setSelectedUser(null)
      setConfirmDelete(false)
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-surface-500">Loading users...</div>
      </div>
    )
  }

  const skipFields = new Set(['id', 'product', 'disabled'])
  const userInfoFields = selectedUser
    ? Object.entries(selectedUser).filter(
        ([key, val]) => !skipFields.has(key) && val !== undefined && val !== null && typeof val !== 'object'
      )
    : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Tracker Users</h1>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm dark:border-surface-600 dark:bg-surface-800 dark:text-surface-200"
        >
          <option value="all">All Roles</option>
          <option value="dispatcher">Dispatcher</option>
          <option value="driver">Driver</option>
        </select>
      </div>

      <DataTable
        data={users}
        columns={[
          {
            key: 'displayName',
            label: 'Name',
            sortable: true,
            render: (u: UserItem) => <span>{u.displayName || u.name || '-'}</span>,
          },
          { key: 'email', label: 'Email', sortable: true },
          {
            key: 'role',
            label: 'Role',
            render: (u: UserItem) => (
              <Badge variant={u.role === 'dispatcher' ? 'info' : 'default'}>
                {u.role || '-'}
              </Badge>
            ),
          },
          {
            key: 'companyId',
            label: 'Company',
            render: (u: UserItem) => <span className="text-sm">{u.companyId || '-'}</span>,
          },
          {
            key: 'disabled',
            label: 'Status',
            render: (u: UserItem) => (
              <Badge variant={u.disabled ? 'danger' : 'success'}>
                {u.disabled ? 'Blocked' : 'Active'}
              </Badge>
            ),
          },
          {
            key: 'actions',
            label: '',
            render: (u: UserItem) => (
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(u)}>
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
        open={!!selectedUser}
        onClose={() => { setSelectedUser(null); setConfirmDelete(false) }}
        title={selectedUser?.displayName || selectedUser?.name || selectedUser?.email || 'User'}
      >
        {selectedUser && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-3">
              {userInfoFields.map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs text-surface-500 dark:text-surface-400">{key}</dt>
                  <dd className="text-sm font-medium text-surface-900 dark:text-surface-100">{String(value)}</dd>
                </div>
              ))}
            </dl>

            <div className="border-t border-surface-200 pt-4 dark:border-surface-700">
              <h3 className="mb-3 text-sm font-semibold text-surface-700 dark:text-surface-300">Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedUser.disabled ? 'primary' : 'danger'}
                  size="sm"
                  loading={actionLoading}
                  onClick={() => handleBlock(selectedUser)}
                >
                  {selectedUser.disabled ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                  {selectedUser.disabled ? 'Unblock' : 'Block'}
                </Button>

                {selectedUser.role !== 'dispatcher' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={actionLoading}
                    onClick={() => handleRoleChange(selectedUser, 'dispatcher')}
                  >
                    Set Dispatcher
                  </Button>
                )}
                {selectedUser.role !== 'driver' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={actionLoading}
                    onClick={() => handleRoleChange(selectedUser, 'driver')}
                  >
                    Set Driver
                  </Button>
                )}
              </div>

              <div className="mt-4 border-t border-surface-200 pt-4 dark:border-surface-700">
                {!confirmDelete ? (
                  <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                    <Trash2 size={14} />
                    Delete User
                  </Button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-red-600 dark:text-red-400">Are you sure? This cannot be undone.</span>
                    <Button variant="danger" size="sm" loading={actionLoading} onClick={() => handleDelete(selectedUser)}>
                      Confirm Delete
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
