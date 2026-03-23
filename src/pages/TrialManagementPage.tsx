import { useEffect, useState, useCallback } from 'react'
import { DataTable } from '@/shared/components/ui/DataTable'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Input } from '@/shared/components/ui/Input'
import { api } from '@/shared/lib/api'
import { RotateCcw, ShieldOff, Shield } from 'lucide-react'

interface TrialUser {
  id: string
  email?: string
  display_name?: string
  plan?: string
  monthly_count?: number
  monthly_limit?: number
  daily_count?: number
  daily_limit?: number
  status?: string
  created_at?: string
  [key: string]: unknown
}

const PLAN_DEFAULTS: Record<string, number> = {
  free: 5,
  starter: 50,
  pro: 999,
  enterprise: 999,
}

const PLANS = ['free', 'starter', 'pro', 'enterprise'] as const

const planVariant = (plan: string): 'warning' | 'info' | 'success' | 'default' => {
  if (plan === 'starter') return 'info'
  if (plan === 'pro') return 'success'
  if (plan === 'enterprise') return 'default'
  return 'warning'
}

export function TrialManagementPage() {
  const [users, setUsers] = useState<TrialUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<TrialUser | null>(null)
  const [newLimit, setNewLimit] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = useCallback(() => {
    setLoading(true)
    api.get<TrialUser[]>('/api/trial')
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
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const freeCount = users.filter((u) => !u.plan || u.plan === 'free').length
  const paidCount = users.filter((u) => u.plan && u.plan !== 'free').length
  const blockedCount = users.filter((u) => u.status === 'blocked').length

  const getLimit = (u: TrialUser) => u.monthly_limit ?? PLAN_DEFAULTS[u.plan || 'free'] ?? 5
  const getCount = (u: TrialUser) => u.monthly_count ?? 0

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
          Trial Management
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">3D Load Planning Users</p>
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
          { key: 'email', label: 'Email', sortable: true },
          {
            key: 'display_name',
            label: 'Name',
            sortable: true,
            render: (u: TrialUser) => <span>{u.display_name || '-'}</span>,
          },
          {
            key: 'plan',
            label: 'Plan',
            render: (u: TrialUser) => {
              const plan = u.plan || 'free'
              return <Badge variant={planVariant(plan)}>{plan}</Badge>
            },
          },
          {
            key: 'monthly_count',
            label: 'Monthly Usage',
            render: (u: TrialUser) => {
              const count = getCount(u)
              const limit = getLimit(u)
              const atLimit = count >= limit && limit < 999
              return (
                <span className={atLimit ? 'font-medium text-red-600 dark:text-red-400' : ''}>
                  {count} / {limit >= 999 ? '\u221e' : limit}
                </span>
              )
            },
          },
          {
            key: 'status',
            label: 'Status',
            render: (u: TrialUser) => (
              <Badge variant={u.status === 'blocked' ? 'danger' : 'success'}>
                {u.status || 'active'}
              </Badge>
            ),
          },
          {
            key: 'created_at',
            label: 'Registered',
            sortable: true,
            render: (u: TrialUser) => (
              <span>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</span>
            ),
          },
          {
            key: 'actions',
            label: '',
            render: (u: TrialUser) => (
              <Button variant="ghost" size="sm" onClick={() => setSelected(u)}>
                <Shield size={16} />
                Manage
              </Button>
            ),
          },
        ]}
        searchable
        searchPlaceholder="Search by email..."
      />

      <Modal open={!!selected} onClose={() => { setSelected(null); setNewLimit('') }} title="Manage User">
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">Email</p>
              <p className="font-medium text-surface-900 dark:text-surface-100">{selected.email}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400">Plan</p>
                <Badge variant={planVariant(selected.plan || 'free')}>{selected.plan || 'free'}</Badge>
              </div>
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400">Monthly Limit</p>
                <p className="font-medium text-surface-900 dark:text-surface-100">
                  {getLimit(selected) >= 999 ? 'Unlimited' : getLimit(selected)}
                </p>
              </div>
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400">Used This Month</p>
                <p className="font-medium text-surface-900 dark:text-surface-100">{getCount(selected)}</p>
              </div>
            </div>

            <hr className="border-surface-200 dark:border-surface-700" />

            <div className="space-y-3">
              <h3 className="font-medium text-surface-900 dark:text-surface-100">Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={actionLoading}
                  onClick={() => handleAction(() => api.post(`/api/trial/${selected.id}/reset-count`, {}))}
                >
                  <RotateCcw size={14} />
                  Reset Usage Count
                </Button>
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
                    <Shield size={14} />
                    Unblock User
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Input
                label="Override Monthly Limit"
                type="number"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                placeholder="e.g., 20"
              />
              <Button
                size="sm"
                disabled={!newLimit}
                loading={actionLoading}
                onClick={() =>
                  handleAction(() =>
                    api.post(`/api/trial/${selected.id}/override-limit`, { monthlyLimit: Number(newLimit) })
                  )
                }
              >
                Apply Override
              </Button>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                Change Plan
              </label>
              <div className="flex gap-2">
                {PLANS.map((p) => (
                  <Button
                    key={p}
                    variant={(selected.plan || 'free') === p ? 'primary' : 'secondary'}
                    size="sm"
                    loading={actionLoading}
                    onClick={() =>
                      handleAction(() => api.post(`/api/trial/${selected.id}/change-plan`, { plan: p }))
                    }
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
