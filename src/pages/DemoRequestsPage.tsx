import { useEffect, useState, useCallback } from 'react'
import { DataTable } from '@/shared/components/ui/DataTable'
import { Badge } from '@/shared/components/ui/Badge'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { api } from '@/shared/lib/api'
import { UserPlus, Trash2 } from 'lucide-react'

interface DemoRequest {
  id: string
  name?: string
  email?: string
  subject?: string
  message?: string
  status?: string
  adminNotes?: string
  phone?: string
  company?: string
  businessType?: string
  shipmentVolume?: string
  mcDot?: string
  preferredTime?: string
  createdAt?: string | { _seconds: number }
  [key: string]: unknown
}

const statusOptions = ['new', 'contacted', 'converted', 'closed'] as const

function formatDate(val?: string | { _seconds: number }) {
  if (!val) return '-'
  if (typeof val === 'string') return new Date(val).toLocaleDateString()
  if (typeof val === 'object' && '_seconds' in val) return new Date(val._seconds * 1000).toLocaleDateString()
  return '-'
}

export function DemoRequestsPage() {
  const [requests, setRequests] = useState<DemoRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<DemoRequest | null>(null)
  const [notes, setNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [createSuccess, setCreateSuccess] = useState('')

  const fetchRequests = useCallback(() => {
    setLoading(true)
    api.get<DemoRequest[]>('/api/demo-requests')
      .then(setRequests)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleStatusChange = async (id: string, status: string) => {
    setActionLoading(true)
    try {
      await api.put(`/api/demo-requests/${id}`, { status })
      setSelected((prev) => prev ? { ...prev, status } : null)
      fetchRequests()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveNotes = async (id: string) => {
    setActionLoading(true)
    try {
      await api.put(`/api/demo-requests/${id}`, { adminNotes: notes })
      setSelected((prev) => prev ? { ...prev, adminNotes: notes } : null)
      fetchRequests()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this demo request?')) return
    setActionLoading(true)
    try {
      await api.delete(`/api/demo-requests/${id}`)
      setSelected(null)
      fetchRequests()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateAccount = async (req: DemoRequest) => {
    setActionLoading(true)
    setCreateSuccess('')
    try {
      await api.post('/api/companies/create', {
        name: req.name,
        email: req.email,
        companyName: req.company || req.name,
        mcDotNumber: req.mcDot || '',
      })
      // Auto-update status to converted
      await api.put(`/api/demo-requests/${req.id}`, { status: 'converted' })
      setSelected((prev) => prev ? { ...prev, status: 'converted' } : null)
      setCreateSuccess('Account created! The customer will receive an email with a password reset link.')
      fetchRequests()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-surface-500">Loading demo requests...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Demo Requests</h1>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <DataTable
        data={requests}
        columns={[
          { key: 'name', label: 'Name', sortable: true },
          { key: 'email', label: 'Email' },
          {
            key: 'company',
            label: 'Company',
            render: (r: DemoRequest) => <span>{r.company || '-'}</span>,
          },
          {
            key: 'phone',
            label: 'Phone',
            render: (r: DemoRequest) => <span>{r.phone || '-'}</span>,
          },
          {
            key: 'subject',
            label: 'Type',
            render: (r: DemoRequest) => (
              <Badge variant={r.subject === 'Demo Request' ? 'info' : 'default'}>
                {r.subject === 'Demo Request' ? 'Demo' : 'Contact'}
              </Badge>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (r: DemoRequest) => (
              <Badge variant={
                r.status === 'new' ? 'warning' :
                r.status === 'contacted' ? 'info' :
                r.status === 'converted' ? 'success' : 'default'
              }>
                {r.status || 'new'}
              </Badge>
            ),
          },
          {
            key: 'createdAt',
            label: 'Date',
            sortable: true,
            render: (r: DemoRequest) => <span>{formatDate(r.createdAt)}</span>,
          },
        ]}
        searchable
        searchPlaceholder="Search demo requests..."
        onRowClick={(r) => { setSelected(r); setNotes(r.adminNotes || ''); setCreateSuccess('') }}
      />

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Demo Request Details">
        {selected && (
          <div className="space-y-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              {([
                ['Name', selected.name],
                ['Email', selected.email],
                ['Phone', selected.phone],
                ['Company', selected.company],
                ['Business Type', selected.businessType],
                ['Shipment Volume', selected.shipmentVolume],
                ['MC# / DOT#', selected.mcDot],
                ['Preferred Time', selected.preferredTime],
                ['Type', selected.subject],
                ['Date', formatDate(selected.createdAt)],
              ] as [string, string | undefined][]).filter(([, v]) => v && v !== '').map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm text-surface-500 dark:text-surface-400">{label}</dt>
                  <dd className="font-medium text-surface-900 dark:text-surface-100">{value}</dd>
                </div>
              ))}
            </dl>
            {selected.message && (
              <div>
                <dt className="text-sm text-surface-500 dark:text-surface-400">Message</dt>
                <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-surface-50 p-3 text-sm text-surface-700 dark:bg-surface-700 dark:text-surface-300">
                  {selected.message}
                </dd>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                Update Status
              </label>
              <div className="mt-2 flex gap-2">
                {statusOptions.map((s) => (
                  <Button
                    key={s}
                    variant={selected.status === s ? 'primary' : 'secondary'}
                    size="sm"
                    loading={actionLoading}
                    onClick={() => handleStatusChange(selected.id, s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
            {selected.status !== 'converted' && (
              <div>
                <hr className="border-surface-200 dark:border-surface-700" />
                <Button
                  className="w-full"
                  variant="primary"
                  loading={actionLoading}
                  onClick={() => handleCreateAccount(selected)}
                >
                  <UserPlus size={16} />
                  Create Tracker Account
                </Button>
                <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
                  Creates company + dispatcher in Tracker and sends login email
                </p>
              </div>
            )}
            {createSuccess && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                {createSuccess}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                Admin Notes
              </label>
              <textarea
                className="mt-1 w-full rounded-lg border border-surface-300 bg-white p-3 text-sm dark:border-surface-600 dark:bg-surface-800 dark:text-surface-200"
                rows={3}
                placeholder="Add notes about this request..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              loading={actionLoading}
              onClick={() => handleSaveNotes(selected.id)}
            >
              Save Notes
            </Button>
            <hr className="border-surface-200 dark:border-surface-700" />
            <Button
              className="w-full"
              variant="danger"
              loading={actionLoading}
              onClick={() => handleDelete(selected.id)}
            >
              <Trash2 size={16} />
              Delete Request
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
