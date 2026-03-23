import { useEffect, useState } from 'react'
import { DollarSign, CreditCard, TrendingDown, TrendingUp, Settings } from 'lucide-react'
import { StatCard } from '@/shared/components/ui/StatCard'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { api } from '@/shared/lib/api'

interface SubscriptionAnalytics {
  mrr: number
  activeSubscriptions: number
  churnRate: number
  upgrades30d: number
  downgrades30d: number
  newSubscriptions30d: number
  cancellations30d: number
  netGrowth30d: number
  eventsByMonth: {
    month: string
    upgrades: number
    downgrades: number
    cancellations: number
    new: number
  }[]
  planDistribution: { plan: string; count: number }[]
  recentEvents: {
    id: string
    userEmail: string
    eventType: string
    fromPlan: string | null
    toPlan: string
    product: string
    timestamp: string
  }[]
}

interface Subscription {
  id: string
  companyId?: string
  userId?: string
  plan: string
  status: string
  createdAt: string | { _seconds: number }
}

const COLORS = {
  green: '#22c55e',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  yellow: '#eab308',
  orange: '#f97316',
}

const tooltipStyle = {
  backgroundColor: 'var(--color-surface-800)',
  border: 'none',
  borderRadius: '8px',
  color: 'var(--color-surface-100)',
}

const EVENT_BADGES: Record<string, { label: string; color: string }> = {
  upgrade: { label: 'Upgrade', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  downgrade: { label: 'Downgrade', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  cancellation: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  new: { label: 'New', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  past_due: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  trial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

function formatMonth(month: string) {
  const [y, m] = month.split('-')
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[parseInt(m) - 1]} ${y.slice(2)}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function parseTimestamp(ts: string | { _seconds: number }): string {
  if (typeof ts === 'string') return ts
  if (ts && typeof ts === 'object' && '_seconds' in ts) {
    return new Date(ts._seconds * 1000).toISOString()
  }
  return ''
}

interface Props {
  product: 'tracker' | '3d-planning'
  title: string
  planColors: Record<string, string>
  plans?: string[]
}

export function SubscriptionDashboardPage({ product, title, planColors, plans }: Props) {
  const [data, setData] = useState<SubscriptionAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Management state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [subsLoading, setSubsLoading] = useState(true)
  const [manageSub, setManageSub] = useState<Subscription | null>(null)
  const [newPlan, setNewPlan] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const availablePlans = plans || Object.keys(planColors)

  const fetchAnalytics = () => {
    api
      .get<SubscriptionAnalytics>(`/api/subscription-analytics?product=${product}`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  const fetchSubscriptions = () => {
    setSubsLoading(true)
    api
      .get<Subscription[]>('/api/payments/subscriptions')
      .then(setSubscriptions)
      .catch(() => {})
      .finally(() => setSubsLoading(false))
  }

  useEffect(() => {
    fetchAnalytics()
    if (product === 'tracker') {
      fetchSubscriptions()
    }
  }, [product])

  const handleChangePlan = async () => {
    if (!manageSub || !newPlan || newPlan === manageSub.plan) return
    setActionLoading(true)
    try {
      await api.put(`/api/payments/subscriptions/${manageSub.id}`, { plan: newPlan })
      setManageSub(null)
      fetchSubscriptions()
      fetchAnalytics()
    } catch (err: any) {
      alert(err.message || 'Failed to change plan')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!manageSub) return
    if (!confirm('Cancel this subscription?')) return
    setActionLoading(true)
    try {
      await api.delete(`/api/payments/subscriptions/${manageSub.id}`)
      setManageSub(null)
      fetchSubscriptions()
      fetchAnalytics()
    } catch (err: any) {
      alert(err.message || 'Failed to cancel subscription')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReactivate = async () => {
    if (!manageSub) return
    setActionLoading(true)
    try {
      await api.put(`/api/payments/subscriptions/${manageSub.id}`, { status: 'active' })
      setManageSub(null)
      fetchSubscriptions()
      fetchAnalytics()
    } catch (err: any) {
      alert(err.message || 'Failed to reactivate')
    } finally {
      setActionLoading(false)
    }
  }

  const eventsChartData = data?.eventsByMonth.map((d) => ({
    month: formatMonth(d.month),
    Upgrades: d.upgrades,
    Downgrades: d.downgrades,
    Cancellations: d.cancellations,
    New: d.new,
  })) ?? []

  const planChartData = data?.planDistribution.filter((d) => d.count > 0) ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">{title}</h1>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Recurring Revenue"
          value={loading ? '...' : `$${data?.mrr.toLocaleString() ?? 0}`}
          icon={<DollarSign size={20} />}
          changeType="neutral"
        />
        <StatCard
          title="Active Subscriptions"
          value={loading ? '...' : String(data?.activeSubscriptions ?? 0)}
          icon={<CreditCard size={20} />}
          change={data ? `+${data.newSubscriptions30d} new (30d)` : ''}
          changeType="positive"
        />
        <StatCard
          title="Churn Rate"
          value={loading ? '...' : `${data?.churnRate ?? 0}%`}
          icon={<TrendingDown size={20} />}
          change={data ? `${data.cancellations30d} cancelled (30d)` : ''}
          changeType={data && data.churnRate > 5 ? 'negative' : 'neutral'}
        />
        <StatCard
          title="Net Growth (30d)"
          value={loading ? '...' : String(data?.netGrowth30d ?? 0)}
          icon={<TrendingUp size={20} />}
          change={data ? `${data.upgrades30d} up / ${data.downgrades30d} down` : ''}
          changeType={data && data.netGrowth30d > 0 ? 'positive' : data && data.netGrowth30d < 0 ? 'negative' : 'neutral'}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
          <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
            Subscription Events
          </h2>
          {eventsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={eventsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-200)" />
                <XAxis dataKey="month" stroke="var(--color-surface-400)" fontSize={12} />
                <YAxis stroke="var(--color-surface-400)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="New" fill={COLORS.blue} radius={[2, 2, 0, 0]} stackId="a" />
                <Bar dataKey="Upgrades" fill={COLORS.green} radius={[2, 2, 0, 0]} stackId="a" />
                <Bar dataKey="Downgrades" fill={COLORS.yellow} radius={[2, 2, 0, 0]} stackId="b" />
                <Bar dataKey="Cancellations" fill={COLORS.red} radius={[2, 2, 0, 0]} stackId="b" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-surface-400">
              No subscription events yet
            </div>
          )}
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
          <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
            Plan Distribution
          </h2>
          {planChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={planChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="plan"
                  label={({ name, value }) => `${name ?? ''}: ${value}`}
                >
                  {planChartData.map((entry) => (
                    <Cell key={entry.plan} fill={planColors[entry.plan] || COLORS.purple} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-surface-400">
              No subscription data yet
            </div>
          )}
        </div>
      </div>

      {/* Manage Subscriptions */}
      {product === 'tracker' && (
        <div className="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
          <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
            Manage Subscriptions
          </h2>
          {subsLoading ? (
            <div className="flex items-center justify-center py-8 text-surface-400">Loading...</div>
          ) : subscriptions.length === 0 ? (
            <p className="text-center text-surface-400 py-8">No subscriptions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="pb-3 pr-4 text-left font-medium text-surface-500 dark:text-surface-400">Company</th>
                    <th className="pb-3 pr-4 text-left font-medium text-surface-500 dark:text-surface-400">Plan</th>
                    <th className="pb-3 pr-4 text-left font-medium text-surface-500 dark:text-surface-400">Status</th>
                    <th className="pb-3 pr-4 text-left font-medium text-surface-500 dark:text-surface-400">Created</th>
                    <th className="pb-3 text-left font-medium text-surface-500 dark:text-surface-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b border-surface-100 dark:border-surface-700/50">
                      <td className="py-3 pr-4 text-surface-900 dark:text-surface-100">
                        {sub.companyId || sub.userId || sub.id.slice(0, 8)}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${planColors[sub.plan] ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300'}`}>
                          {sub.plan}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[sub.status] || STATUS_STYLES.active}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-surface-500 dark:text-surface-400">
                        {sub.createdAt ? formatDate(parseTimestamp(sub.createdAt)) : '—'}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => { setManageSub(sub); setNewPlan(sub.plan) }}
                          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
                        >
                          <Settings size={14} />
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Manage Modal */}
      {manageSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setManageSub(null)}>
          <div
            className="w-full max-w-md rounded-xl border border-surface-200 bg-white p-6 shadow-xl dark:border-surface-700 dark:bg-surface-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
              Manage Subscription
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-1">
              ID: {manageSub.id.slice(0, 12)}...
            </p>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
              Current plan: <span className="font-medium text-surface-900 dark:text-surface-100 capitalize">{manageSub.plan}</span>
              {' '}&middot;{' '}Status: <span className="font-medium capitalize">{manageSub.status}</span>
            </p>

            {/* Change Plan */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Change Plan
              </label>
              <div className="flex gap-2">
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="flex-1 rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
                >
                  {availablePlans.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
                <button
                  onClick={handleChangePlan}
                  disabled={actionLoading || newPlan === manageSub.plan}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {actionLoading ? '...' : 'Update'}
                </button>
              </div>
            </div>

            {/* Cancel / Reactivate */}
            <div className="flex gap-2 border-t border-surface-200 pt-4 dark:border-surface-700">
              {manageSub.status === 'cancelled' ? (
                <button
                  onClick={handleReactivate}
                  disabled={actionLoading}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Reactivate
                </button>
              ) : (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Cancel Subscription
                </button>
              )}
              <button
                onClick={() => setManageSub(null)}
                className="rounded-lg border border-surface-300 px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 dark:border-surface-600 dark:text-surface-300 dark:hover:bg-surface-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Events */}
      <div className="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
        <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
          Recent Events
        </h2>
        {data && data.recentEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="pb-3 pr-4 text-left font-medium text-surface-500 dark:text-surface-400">User</th>
                  <th className="pb-3 pr-4 text-left font-medium text-surface-500 dark:text-surface-400">Event</th>
                  <th className="pb-3 pr-4 text-left font-medium text-surface-500 dark:text-surface-400">From</th>
                  <th className="pb-3 pr-4 text-left font-medium text-surface-500 dark:text-surface-400">To</th>
                  <th className="pb-3 text-left font-medium text-surface-500 dark:text-surface-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEvents.map((event) => {
                  const badge = EVENT_BADGES[event.eventType] || EVENT_BADGES.new
                  return (
                    <tr key={event.id} className="border-b border-surface-100 dark:border-surface-700/50">
                      <td className="py-3 pr-4 text-surface-900 dark:text-surface-100">
                        {event.userEmail || 'N/A'}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-surface-600 dark:text-surface-400">
                        {event.fromPlan || '—'}
                      </td>
                      <td className="py-3 pr-4 text-surface-600 dark:text-surface-400">
                        {event.toPlan}
                      </td>
                      <td className="py-3 text-surface-500 dark:text-surface-400">
                        {formatDate(event.timestamp)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-surface-400 py-8">
            No subscription events yet. Events will appear as plan changes occur.
          </p>
        )}
      </div>
    </div>
  )
}
