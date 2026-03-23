import { useState } from 'react'
import { DataTable } from '@/shared/components/ui/DataTable'
import { Badge } from '@/shared/components/ui/Badge'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { CreditCard, RefreshCw } from 'lucide-react'
import { StatCard } from '@/shared/components/ui/StatCard'

interface Subscription {
  id: string
  company: string
  product: string
  plan: string
  status: string
  amount: string
  nextBilling: string
  [key: string]: unknown
}

interface PaymentEvent {
  id: string
  company: string
  type: string
  amount: string
  date: string
  [key: string]: unknown
}

const mockSubscriptions: Subscription[] = [
  { id: '1', company: 'Swift Logistics', product: 'Tracker', plan: 'Pro', status: 'active', amount: '$49/mo', nextBilling: '2024-07-15' },
  { id: '2', company: 'Meridian Transport', product: 'Tracker', plan: 'Enterprise', status: 'active', amount: '$199/mo', nextBilling: '2024-07-10' },
  { id: '3', company: 'CargoMax', product: '3D Planning', plan: 'Starter', status: 'trial', amount: '$29/mo', nextBilling: '2024-07-01' },
  { id: '4', company: 'LoadPro Solutions', product: 'Both', plan: 'Pro', status: 'past_due', amount: '$78/mo', nextBilling: '2024-06-20' },
]

const mockPaymentEvents: PaymentEvent[] = [
  { id: '1', company: 'Swift Logistics', type: 'payment_success', amount: '$49.00', date: '2024-06-15' },
  { id: '2', company: 'Meridian Transport', type: 'payment_success', amount: '$199.00', date: '2024-06-10' },
  { id: '3', company: 'LoadPro Solutions', type: 'payment_failed', amount: '$78.00', date: '2024-06-20' },
  { id: '4', company: 'CargoMax', type: 'refund', amount: '$29.00', date: '2024-06-12' },
]

type Tab = 'subscriptions' | 'history' | 'plans'

export function PaymentsPage() {
  const [tab, setTab] = useState<Tab>('subscriptions')
  const [refundModal, setRefundModal] = useState<Subscription | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Payments</h1>
        <Badge variant="info">Flitt</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Monthly Revenue" value="$355" icon={<CreditCard size={20} />} change="+18% vs last month" changeType="positive" />
        <StatCard title="Active Subscriptions" value="3" icon={<RefreshCw size={20} />} />
        <StatCard title="Past Due" value="1" icon={<CreditCard size={20} />} changeType="negative" change="Action required" />
      </div>

      <div className="flex gap-1 rounded-lg border border-surface-200 bg-surface-50 p-1 dark:border-surface-700 dark:bg-surface-800">
        {(['subscriptions', 'history', 'plans'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-surface-100'
                : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'subscriptions' && (
        <DataTable
          data={mockSubscriptions}
          columns={[
            { key: 'company', label: 'Company', sortable: true },
            {
              key: 'product',
              label: 'Product',
              render: (s: Subscription) => (
                <Badge variant={s.product === 'Tracker' ? 'info' : s.product === '3D Planning' ? 'default' : 'success'}>
                  {s.product}
                </Badge>
              ),
            },
            {
              key: 'plan',
              label: 'Plan',
              render: (s: Subscription) => (
                <Badge variant={s.plan === 'Enterprise' ? 'success' : s.plan === 'Pro' ? 'info' : 'default'}>
                  {s.plan}
                </Badge>
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: (s: Subscription) => (
                <Badge variant={
                  s.status === 'active' ? 'success' :
                  s.status === 'trial' ? 'warning' :
                  s.status === 'past_due' ? 'danger' : 'default'
                }>
                  {s.status.replace('_', ' ')}
                </Badge>
              ),
            },
            { key: 'amount', label: 'Amount', sortable: true },
            { key: 'nextBilling', label: 'Next Billing', sortable: true },
            {
              key: 'actions',
              label: '',
              render: (s: Subscription) => (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setRefundModal(s)}>
                    Manage
                  </Button>
                </div>
              ),
            },
          ]}
          searchable
          searchPlaceholder="Search subscriptions..."
        />
      )}

      {tab === 'history' && (
        <DataTable
          data={mockPaymentEvents}
          columns={[
            { key: 'company', label: 'Company', sortable: true },
            {
              key: 'type',
              label: 'Type',
              render: (e: PaymentEvent) => (
                <Badge variant={
                  e.type === 'payment_success' ? 'success' :
                  e.type === 'payment_failed' ? 'danger' :
                  e.type === 'refund' ? 'warning' : 'default'
                }>
                  {e.type.replace('_', ' ')}
                </Badge>
              ),
            },
            { key: 'amount', label: 'Amount', sortable: true },
            { key: 'date', label: 'Date', sortable: true },
          ]}
          searchable
          searchPlaceholder="Search payment history..."
        />
      )}

      {tab === 'plans' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[
              { name: 'Demo', price: 'Free', product: 'Tracker', features: ['Request demo access', 'Limited trial period'] },
              { name: 'Starter', price: '$39/mo', product: 'Tracker', features: ['Real-time updates', 'Share tracking link', 'Email notifications'] },
              { name: 'Growth', price: '$99/mo', product: 'Tracker', features: ['All Starter features', 'Tracking reports', 'Priority support'] },
              { name: 'Business', price: '$189/mo', product: 'Tracker', features: ['All Growth features', 'Chat with drivers', 'Advanced analytics'] },
              { name: 'Enterprise', price: 'Custom', product: 'Tracker', features: ['All Business features', 'API access', 'Dedicated support'] },
              { name: 'Free', price: '$0/mo', product: '3D Planning', features: ['5 optimizations/month', 'AI cargo input', 'Weight balancing', 'Export (PDF, Excel)', 'Shareable links'], excluded: ['API access'] },
              { name: 'Starter', price: '$29/mo', product: '3D Planning', features: ['50 optimizations/month', 'AI cargo input', 'Weight balancing', 'Export (PDF, Excel)', 'Shareable links', 'API access'] },
              { name: 'Pro', price: '$79/mo', product: '3D Planning', popular: true, features: ['Unlimited optimizations', 'AI cargo input', 'Weight balancing', 'Export (PDF, Excel)', 'Shareable links', 'API access'] },
              { name: 'Enterprise', price: 'Custom', product: '3D Planning', features: ['Unlimited optimizations', 'AI cargo input', 'Weight balancing', 'Export (PDF, Excel)', 'Shareable links', 'API access'] },
            ].map((plan) => (
              <div key={`${plan.product}-${plan.name}`} className={`rounded-xl border p-6 ${plan.popular ? 'border-primary-500 ring-1 ring-primary-500 dark:border-primary-400 dark:ring-primary-400' : 'border-surface-200 dark:border-surface-700'} bg-white dark:bg-surface-800 relative`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-500 px-3 py-0.5 text-xs font-semibold text-white">Popular</span>
                )}
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">{plan.name}</h3>
                  <Badge variant={plan.product === 'Tracker' ? 'info' : 'default'}>{plan.product}</Badge>
                </div>
                <p className="mb-4 text-2xl font-bold text-primary-600 dark:text-primary-400">{plan.price}</p>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  ))}
                  {plan.excluded?.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-surface-400 dark:text-surface-500">
                      <span className="text-surface-400">✗</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={!!refundModal} onClose={() => setRefundModal(null)} title="Manage Subscription">
        {refundModal && (
          <div className="space-y-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ['Company', refundModal.company],
                ['Product', refundModal.product],
                ['Plan', refundModal.plan],
                ['Amount', refundModal.amount],
                ['Status', refundModal.status],
                ['Next Billing', refundModal.nextBilling],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm text-surface-500 dark:text-surface-400">{label}</dt>
                  <dd className="font-medium text-surface-900 dark:text-surface-100">{value}</dd>
                </div>
              ))}
            </dl>
            <hr className="border-surface-200 dark:border-surface-700" />
            <div className="space-y-2">
              <h3 className="font-medium text-surface-900 dark:text-surface-100">Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm">Upgrade Plan</Button>
                <Button variant="secondary" size="sm">Downgrade Plan</Button>
                <Button variant="danger" size="sm">Cancel Subscription</Button>
                <Button variant="danger" size="sm">Issue Refund</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
