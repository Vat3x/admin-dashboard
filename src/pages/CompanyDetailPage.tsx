import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldOff, ShieldCheck, Trash2, Users, Truck, Radio } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Badge } from '@/shared/components/ui/Badge'
import { StatCard } from '@/shared/components/ui/StatCard'
import { DataTable } from '@/shared/components/ui/DataTable'
import { api } from '@/shared/lib/api'

interface Company {
  id: string
  name?: string
  email?: string
  phone?: string
  blocked?: boolean
  [key: string]: unknown
}

interface CompanyUser {
  id: string
  email?: string
  displayName?: string
  role?: string
  disabled?: boolean
  [key: string]: unknown
}

export function CompanyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [company, setCompany] = useState<Company | null>(null)
  const [users, setUsers] = useState<CompanyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get<Company>(`/api/companies/${id}`),
      api.get<CompanyUser[]>('/api/users?product=tracker'),
    ])
      .then(([companyData, usersData]) => {
        setCompany(companyData)
        setUsers(usersData.filter((u) => u.companyId === id))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleBlockToggle = async () => {
    if (!company) return
    setActionLoading(true)
    try {
      const action = company.blocked ? 'unblock' : 'block'
      await api.post(`/api/companies/${id}/${action}`, {})
      setCompany({ ...company, blocked: !company.blocked })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-surface-500">Loading company...</div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="py-12 text-center text-surface-500">Company not found</div>
    )
  }

  // Collect all company fields for display
  const skipFields = new Set(['id', 'blocked'])
  const infoFields = Object.entries(company).filter(
    ([key, val]) => !skipFields.has(key) && val !== undefined && val !== null && typeof val !== 'object'
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/tracker/companies')}
          className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {company.name || company.id}
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">ID: {id}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge variant="info">Tracker</Badge>
          <Badge variant={company.blocked ? 'danger' : 'success'}>
            {company.blocked ? 'Blocked' : 'Active'}
          </Badge>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Users"
          value={String(users.length)}
          icon={<Users size={20} />}
        />
        <StatCard
          title="Drivers"
          value={String(users.filter((u) => u.role === 'driver').length)}
          icon={<Truck size={20} />}
        />
        <StatCard
          title="Dispatchers"
          value={String(users.filter((u) => u.role === 'dispatcher').length)}
          icon={<Radio size={20} />}
        />
      </div>

      <div className="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
        <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">Company Info</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          {infoFields.map(([key, value]) => (
            <div key={key}>
              <dt className="text-sm text-surface-500 dark:text-surface-400">{key}</dt>
              <dd className="font-medium text-surface-900 dark:text-surface-100">{String(value)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant={company.blocked ? 'primary' : 'danger'}
          onClick={handleBlockToggle}
          loading={actionLoading}
        >
          {company.blocked ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
          {company.blocked ? 'Unblock Company' : 'Block Company'}
        </Button>

        {!confirmDelete ? (
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={16} />
            Delete Company
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-red-600 dark:text-red-400">
              Delete company? Users will be unlinked, not deleted.
            </span>
            <Button
              variant="danger"
              loading={actionLoading}
              onClick={async () => {
                setActionLoading(true)
                try {
                  await api.delete(`/api/companies/${id}`)
                  navigate('/tracker/companies')
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Delete failed')
                  setActionLoading(false)
                }
              }}
            >
              Confirm Delete
            </Button>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
          Users ({users.length})
        </h2>
        <DataTable
          data={users}
          columns={[
            {
              key: 'displayName',
              label: 'Name',
              sortable: true,
              render: (u: CompanyUser) => <span>{u.displayName || '-'}</span>,
            },
            { key: 'email', label: 'Email' },
            {
              key: 'role',
              label: 'Role',
              render: (u: CompanyUser) => (
                <Badge variant={u.role === 'dispatcher' ? 'info' : 'default'}>{u.role || '-'}</Badge>
              ),
            },
            {
              key: 'disabled',
              label: 'Status',
              render: (u: CompanyUser) => (
                <Badge variant={u.disabled ? 'danger' : 'success'}>
                  {u.disabled ? 'Disabled' : 'Active'}
                </Badge>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
