import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { ShieldOff, Shield, Clock, RefreshCw } from 'lucide-react'

type ActionType = 'block' | 'unblock' | 'extend-trial' | 'reset-usage'

export function ManualActionsPage() {
  const [action, setAction] = useState<ActionType | null>(null)
  const [targetId, setTargetId] = useState('')
  const [trialDays, setTrialDays] = useState('')

  const actions = [
    {
      type: 'block' as const,
      title: 'Block Company',
      description: 'Disable all users in a company and prevent access.',
      icon: ShieldOff,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      type: 'unblock' as const,
      title: 'Unblock Company',
      description: 'Re-enable access for a previously blocked company.',
      icon: Shield,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      type: 'extend-trial' as const,
      title: 'Extend Trial',
      description: 'Add more trial days to a company subscription.',
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      type: 'reset-usage' as const,
      title: 'Reset Usage Count',
      description: 'Reset daily usage count for a 3D Planning user.',
      icon: RefreshCw,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Manual Actions</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {actions.map(({ type, title, description, icon: Icon, color, bg }) => (
          <button
            key={type}
            onClick={() => setAction(type)}
            className={`flex items-start gap-4 rounded-xl border border-surface-200 p-6 text-left transition-colors hover:border-surface-300 dark:border-surface-700 dark:hover:border-surface-600 ${
              action === type ? 'ring-2 ring-primary-500' : ''
            } bg-white dark:bg-surface-800`}
          >
            <div className={`rounded-lg p-2.5 ${bg}`}>
              <Icon size={24} className={color} />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-surface-100">{title}</h3>
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{description}</p>
            </div>
          </button>
        ))}
      </div>

      {action && (
        <div className="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
          <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
            {actions.find((a) => a.type === action)?.title}
          </h2>
          <div className="space-y-4">
            <Input
              label={action === 'reset-usage' ? 'User Email or ID' : 'Company ID'}
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder={action === 'reset-usage' ? 'user@example.com' : 'Enter company ID'}
            />
            {action === 'extend-trial' && (
              <Input
                label="Additional Trial Days"
                type="number"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                placeholder="e.g., 14"
              />
            )}
            <div className="flex gap-3">
              <Button
                variant={action === 'block' ? 'danger' : 'primary'}
                disabled={!targetId || (action === 'extend-trial' && !trialDays)}
              >
                Execute Action
              </Button>
              <Button variant="secondary" onClick={() => { setAction(null); setTargetId(''); setTrialDays('') }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
