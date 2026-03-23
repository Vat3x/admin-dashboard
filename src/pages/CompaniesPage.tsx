import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/shared/components/ui/DataTable'
import { Badge } from '@/shared/components/ui/Badge'
import { api } from '@/shared/lib/api'

interface Company {
  id: string
  name: string
  blocked?: boolean
  _users?: number
  _drivers?: number
  _dispatchers?: number
  [key: string]: unknown
}

export function CompaniesPage() {
  const navigate = useNavigate()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Company[]>('/api/companies')
      .then(setCompanies)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    { key: 'name', label: 'Company', sortable: true },
    { key: 'id', label: 'ID', sortable: true },
    {
      key: '_users',
      label: 'Users',
      sortable: true,
      render: (item: Company) => <span>{item._users ?? 0}</span>,
    },
    {
      key: '_drivers',
      label: 'Drivers',
      sortable: true,
      render: (item: Company) => <span>{item._drivers ?? 0}</span>,
    },
    {
      key: '_dispatchers',
      label: 'Dispatchers',
      sortable: true,
      render: (item: Company) => <span>{item._dispatchers ?? 0}</span>,
    },
    {
      key: 'blocked',
      label: 'Status',
      render: (item: Company) => (
        <Badge variant={item.blocked ? 'danger' : 'success'}>
          {item.blocked ? 'Blocked' : 'Active'}
        </Badge>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-surface-500">Loading companies...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Companies</h1>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <DataTable
        data={companies}
        columns={columns}
        searchable
        searchPlaceholder="Search companies..."
        onRowClick={(company) => navigate(`/tracker/companies/${company.id}`)}
      />
    </div>
  )
}
