'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Activity, ArrowUp, ArrowDown } from 'lucide-react'

interface Session {
  id: string
  username: string
  node_hostname: string
  vpn_ip: string
  bytes_sent: number
  bytes_received: number
  connected_at: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(since: string) {
  const ms = Date.now() - new Date(since).getTime()
  const m = Math.floor(ms / 60000)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  if (m === 0) return '< 1m'
  return `${m}m`
}

export default function SessionsPage() {
  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: () => api.get('/api/v1/sessions'),
    refetchInterval: 15_000,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Sessions</h1>
          <p className="text-sm text-gray-500 mt-1">{sessions.length} connected right now</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Auto-refresh 15s
        </span>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-16 text-center">
          <Activity className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-700">No active sessions</p>
          <p className="text-sm text-gray-400 mt-1">Sessions will appear here when users connect</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Node</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">VPN IP</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Traffic</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900">{s.username}</td>
                  <td className="px-5 py-4 text-gray-500">{s.node_hostname}</td>
                  <td className="px-5 py-4 font-mono text-gray-600 text-xs">{s.vpn_ip}</td>
                  <td className="px-5 py-4 text-gray-500" suppressHydrationWarning>{formatDuration(s.connected_at)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-1 text-blue-500">
                        <ArrowUp className="h-3 w-3" /> {formatBytes(s.bytes_sent)}
                      </span>
                      <span className="text-gray-300">/</span>
                      <span className="flex items-center gap-1 text-emerald-500">
                        <ArrowDown className="h-3 w-3" /> {formatBytes(s.bytes_received)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Connected
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
