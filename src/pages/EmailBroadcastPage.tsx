import { useEffect, useState } from 'react'
import { Send, History, AlertTriangle } from 'lucide-react'
import { api } from '@/shared/lib/api'

interface Broadcast {
  id: string
  subject: string
  body: string
  recipientGroup: string
  recipientCount: number
  sentCount: number
  sentAt: string
  status: string
}

const RECIPIENT_GROUPS = [
  { value: 'all', label: 'All Users' },
  { value: 'free', label: 'Free Users' },
  { value: 'paid', label: 'Paid Users' },
  { value: 'tracker', label: 'Tracker Users' },
  { value: '3d-planning', label: '3D Planning Users' },
  { value: 'website', label: 'Website Users' },
]

const STATUS_BADGES: Record<string, string> = {
  sent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  partial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function EmailBroadcastPage() {
  const [tab, setTab] = useState<'compose' | 'history'>('compose')
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Compose form state
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [recipientGroup, setRecipientGroup] = useState('all')
  const [sending, setSending] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchHistory = () => {
    setHistoryLoading(true)
    api
      .get<Broadcast[]>('/api/broadcasts')
      .then(setBroadcasts)
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }

  useEffect(() => {
    if (tab === 'history') {
      fetchHistory()
    }
  }, [tab])

  const handleSend = async () => {
    setSending(true)
    setResult(null)
    try {
      const res = await api.post<{ message: string; recipientCount: number; sentCount: number }>('/api/broadcasts', {
        subject,
        body,
        recipientGroup,
      })
      setResult({
        type: 'success',
        message: `Broadcast sent to ${res.sentCount} recipients`,
      })
      setSubject('')
      setBody('')
      setConfirmOpen(false)
    } catch (err: any) {
      setResult({
        type: 'error',
        message: err.message || 'Failed to send broadcast',
      })
      setConfirmOpen(false)
    } finally {
      setSending(false)
    }
  }

  const groupLabel = RECIPIENT_GROUPS.find((g) => g.value === recipientGroup)?.label || recipientGroup

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Email Broadcast</h1>

      {/* Tab switcher */}
      <div className="inline-flex rounded-lg border border-surface-200 dark:border-surface-700">
        <button
          onClick={() => setTab('compose')}
          className={`flex items-center gap-2 rounded-l-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'compose'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-surface-600 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700'
          }`}
        >
          <Send size={16} />
          Compose
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex items-center gap-2 rounded-r-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'history'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-surface-600 hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700'
          }`}
        >
          <History size={16} />
          History
        </button>
      </div>

      {tab === 'compose' && (
        <div className="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800">
          <div className="space-y-5">
            {/* Recipient Group */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                Recipient Group
              </label>
              <select
                value={recipientGroup}
                onChange={(e) => setRecipientGroup(e.target.value)}
                className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm text-surface-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
              >
                {RECIPIENT_GROUPS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100 dark:placeholder:text-surface-500"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                Message (HTML supported)
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your broadcast message..."
                rows={10}
                className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100 dark:placeholder:text-surface-500"
              />
            </div>

            {/* Result message */}
            {result && (
              <div
                className={`rounded-lg p-4 text-sm ${
                  result.type === 'success'
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                {result.message}
              </div>
            )}

            {/* Confirm dialog */}
            {confirmOpen && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="mt-0.5 text-yellow-600 dark:text-yellow-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Confirm broadcast
                    </p>
                    <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                      You are about to send &quot;{subject}&quot; to <strong>{groupLabel}</strong>. This action cannot be undone.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={handleSend}
                        disabled={sending}
                        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        {sending ? 'Sending...' : 'Confirm Send'}
                      </button>
                      <button
                        onClick={() => setConfirmOpen(false)}
                        className="rounded-lg border border-surface-300 px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 dark:border-surface-600 dark:text-surface-300 dark:hover:bg-surface-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Send button */}
            {!confirmOpen && (
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={!subject.trim() || !body.trim()}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                Send Broadcast
              </button>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
          {historyLoading ? (
            <div className="flex items-center justify-center py-12 text-surface-400">Loading...</div>
          ) : broadcasts.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-surface-400">
              No broadcasts sent yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="px-6 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Subject</th>
                    <th className="px-6 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Group</th>
                    <th className="px-6 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Recipients</th>
                    <th className="px-6 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Status</th>
                    <th className="px-6 py-3 text-left font-medium text-surface-500 dark:text-surface-400">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {broadcasts.map((b) => (
                    <tr key={b.id} className="border-b border-surface-100 dark:border-surface-700/50">
                      <td className="px-6 py-4 font-medium text-surface-900 dark:text-surface-100">
                        {b.subject}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-600 dark:bg-surface-700 dark:text-surface-300">
                          {RECIPIENT_GROUPS.find((g) => g.value === b.recipientGroup)?.label || b.recipientGroup}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-surface-600 dark:text-surface-400">
                        {b.sentCount ?? b.recipientCount}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_BADGES[b.status] || STATUS_BADGES.sent
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-surface-500 dark:text-surface-400">
                        {formatDate(b.sentAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
