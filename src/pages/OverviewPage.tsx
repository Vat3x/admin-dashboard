import { useEffect, useState } from 'react'
import { Building2, Users, MapPin, CreditCard, Globe, UserCheck, MessageSquare } from 'lucide-react'
import { StatCard } from '@/shared/components/ui/StatCard'
import {
  AreaChart,
  Area,
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

interface Stats {
  tracker: {
    companies: number
    users: number
    trips: number
  }
  planning: {
    totalUsers: number
    paidUsers: number
  }
}

interface Analytics {
  signupsByMonth: { month: string; count: number }[]
  demoRequestsByMonth: { month: string; count: number }[]
  planDistribution: { free: number; paid: number }
  statusDistribution: { active: number; blocked: number }
  recentSignups: number
  recentDemoRequests: number
}

const COLORS = {
  blue: '#3b82f6',
  purple: '#8b5cf6',
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
}

const tooltipStyle = {
  backgroundColor: 'var(--color-surface-800)',
  border: 'none',
  borderRadius: '8px',
  color: 'var(--color-surface-100)',
}

function formatMonth(month: string) {
  const [y, m] = month.split('-')
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[parseInt(m) - 1]} ${y.slice(2)}`
}

export function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get<Stats>('/api/stats'),
      api.get<Analytics>('/api/analytics'),
    ])
      .then(([s, a]) => {
        setStats(s)
        setAnalytics(a)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const planData = analytics
    ? [
        { name: 'Free', value: analytics.planDistribution.free },
        { name: 'Paid', value: analytics.planDistribution.paid },
      ]
    : []

  const statusData = analytics
    ? [
        { name: 'Active', value: analytics.statusDistribution.active },
        { name: 'Blocked', value: analytics.statusDistribution.blocked },
      ]
    : []

  const signupChartData = analytics?.signupsByMonth.map((d) => ({
    month: formatMonth(d.month),
    signups: d.count,
  })) ?? []

  const demoChartData = analytics?.demoRequestsByMonth.map((d) => ({
    month: formatMonth(d.month),
    requests: d.count,
  })) ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Overview</h1>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Row 1: Product stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Companies"
          value={loading ? '...' : String(stats?.tracker.companies ?? 0)}
          icon={<Building2 size={20} />}
          change="Tracker"
          changeType="neutral"
        />
        <StatCard
          title="Tracker Users"
          value={loading ? '...' : String(stats?.tracker.users ?? 0)}
          icon={<Users size={20} />}
          change="Tracker"
          changeType="neutral"
        />
        <StatCard
          title="Trips"
          value={loading ? '...' : String(stats?.tracker.trips ?? 0)}
          icon={<MapPin size={20} />}
          change="Tracker"
          changeType="neutral"
        />
        <StatCard
          title="3D Planning Users"
          value={loading ? '...' : String(stats?.planning.totalUsers ?? 0)}
          icon={<CreditCard size={20} />}
          change={`${stats?.planning.paidUsers ?? 0} paid`}
          changeType="neutral"
        />
      </div>

      {/* Row 2: Website & analytics stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Website Users"
          value={loading ? '...' : String(stats?.planning.totalUsers ?? 0)}
          icon={<Globe size={20} />}
          change={analytics ? `+${analytics.recentSignups} this week` : ''}
          changeType="positive"
        />
        <StatCard
          title="Free Tier"
          value={loading ? '...' : String(analytics?.planDistribution.free ?? 0)}
          icon={<UserCheck size={20} />}
          change="Website"
          changeType="neutral"
        />
        <StatCard
          title="Paid Users"
          value={loading ? '...' : String(analytics?.planDistribution.paid ?? 0)}
          icon={<CreditCard size={20} />}
          change="Website"
          changeType="neutral"
        />
        <StatCard
          title="Demo Requests"
          value={loading ? '...' : String(
            (analytics?.demoRequestsByMonth ?? []).reduce((sum, d) => sum + d.count, 0)
          )}
          icon={<MessageSquare size={20} />}
          change={analytics ? `+${analytics.recentDemoRequests} this week` : ''}
          changeType="positive"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Signups Over Time */}
        <div className="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
          <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
            Signups Over Time
          </h2>
          {signupChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={signupChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-200)" />
                <XAxis dataKey="month" stroke="var(--color-surface-400)" fontSize={12} />
                <YAxis stroke="var(--color-surface-400)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="signups"
                  stroke={COLORS.purple}
                  fill={COLORS.purple}
                  fillOpacity={0.3}
                  name="Signups"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-surface-400">
              No signup data yet
            </div>
          )}
        </div>

        {/* Demo Requests Over Time */}
        <div className="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
          <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
            Demo Requests
          </h2>
          {demoChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={demoChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-200)" />
                <XAxis dataKey="month" stroke="var(--color-surface-400)" fontSize={12} />
                <YAxis stroke="var(--color-surface-400)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="requests" fill={COLORS.blue} radius={[4, 4, 0, 0]} name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-surface-400">
              No demo request data yet
            </div>
          )}
        </div>
      </div>

      {/* Charts row 2 — Pie charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan Distribution */}
        <div className="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
          <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
            Plan Distribution
          </h2>
          {planData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  <Cell fill={COLORS.yellow} />
                  <Cell fill={COLORS.green} />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-surface-400">
              No user data yet
            </div>
          )}
        </div>

        {/* User Status */}
        <div className="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
          <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
            User Status
          </h2>
          {statusData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  <Cell fill={COLORS.green} />
                  <Cell fill={COLORS.red} />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-surface-400">
              No user data yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
