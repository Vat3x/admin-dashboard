import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
}

export function StatCard({ title, value, icon, change, changeType = 'neutral' }: StatCardProps) {
  const changeColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-surface-500 dark:text-surface-400',
  }

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-surface-500 dark:text-surface-400">{title}</p>
        <div className="text-surface-400 dark:text-surface-500">{icon}</div>
      </div>
      <p className="mt-2 text-3xl font-bold text-surface-900 dark:text-surface-100">{value}</p>
      {change && (
        <p className={`mt-1 text-sm ${changeColors[changeType]}`}>{change}</p>
      )}
    </div>
  )
}
