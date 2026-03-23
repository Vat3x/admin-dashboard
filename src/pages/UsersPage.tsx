import { useEffect, useState, useCallback } from 'react'
import { DataTable } from '@/shared/components/ui/DataTable'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { api } from '@/shared/lib/api'
import { ShieldOff, ShieldCheck, UserCog, Trash2 } from 'lucide-react'

interface UserItem {
  id: string
  product: string
  email?: string
  displayName?: string
  name?: string
  role?: string
  companyId?: string
  disabled?: boolean
  [key: string]: unknown
}

export function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [productFilter, setProductFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const fetchUsers = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (productFilter !== 'all') params.set('product', productFilter)
    if (roleFilter !== 'all') params.set('role', roleFilter)
    const qs = params.toString() ? `?${params.toString()}` : ''
    api.get<UserItem[]>(`/api/users${qs}`)
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [productFilter, roleFilter])

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

  // Collect display fields for the selected user modal
  const skipFields = new Set(['id', 'product', 'disabled'])
  const userInfoFields = selectedUser
    ? Object.entries(selectedUser).filter(
        ([key, val]) => !skipFields.has(key) && val !== undefined && val !== null && typeof val !== 'object'
      )
    : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Users</h1>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <select
          value={productFilter}
          onChange={(e) => {
            setProductFilter(e.target.value)
            if (e.target.value === '3d-planning') setRoleFilter('all')
          }}
          className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm dark:border-surface-600 dark:bg-surface-800 dark:text-surface-200"
        >
          <option value="all">All Products</option>
          <option value="tracker">Tracker</option>
          <option value="3d-planning">3D Planning</option>
        </select>
        {productFilter !== '3d-planning' && (
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm dark:border-surface-600 dark:bg-surface-800 dark:text-surface-200"
          >
            <option value="all">All Roles</option>
            <option value="dispatcher">Dispatcher</option>
            <option value="driver">Driver</option>
          </select>
        )}
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
              <Badge variant={u.role === 'dispatcher' ? 'info' : u.role === 'driver' ? 'default' : 'success'}>
                {u.role || '-'}
              </Badge>
            ),
          },
          {
            key: 'product',
            label: 'Product',
            render: (u: UserItem) => (
              <Badge variant={u.product === 'Tracker' ? 'info' : 'default'}>{u.product}</Badge>
            ),
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

      {/* User detail / actions modal */}
      <Modal
        open={!!selectedUser}
        onClose={() => { setSelectedUser(null); setConfirmDelete(false) }}
        title={selectedUser?.displayName || selectedUser?.name || selectedUser?.email || 'User'}
      >
        {selectedUser && (
          <div className="space-y-5">
            {/* User info */}
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
                {/* Block / Unblock */}
                <Button
                  variant={selectedUser.disabled ? 'primary' : 'danger'}
                  size="sm"
                  loading={actionLoading}
                  onClick={() => handleBlock(selectedUser)}
                >
                  {selectedUser.disabled ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                  {selectedUser.disabled ? 'Unblock' : 'Block'}
                </Button>

                {/* Role change (Tracker only) */}
                {selectedUser.product === 'Tracker' && (
                  <>
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
                  </>
                )}
              </div>

              {/* Delete user */}
              <div className="mt-4 border-t border-surface-200 pt-4 dark:border-surface-700">
                {!confirmDelete ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                  >
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
                      onClick={() => handleDelete(selectedUser)}
                    >
                      Confirm Delete
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                    >
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
