'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Trash2, MapPin, Clock, Activity, Server, X } from 'lucide-react'
import type { VpnNode } from '@ovpn/shared'

interface NodeForm {
  hostname: string
  ipAddress: string
  region: string
}

export default function NodesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<NodeForm>({ hostname: '', ipAddress: '', region: '' })

  const { data: nodes = [], isLoading } = useQuery<VpnNode[]>({
    queryKey: ['nodes'],
    queryFn: () => api.get('/api/v1/nodes'),
  })

  const createMutation = useMutation({
    mutationFn: (data: NodeForm) => api.post<VpnNode>('/api/v1/nodes', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nodes'] })
      setShowForm(false)
      setForm({ hostname: '', ipAddress: '', region: '' })
      toast.success('Node registered')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/nodes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nodes'] })
      toast.success('Node removed')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const onlineCount = nodes.filter(n => n.status === 'online').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">VPN Nodes</h1>
          <p className="text-sm text-gray-500 mt-1">{onlineCount}/{nodes.length} nodes online</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Node
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading nodes...</div>
      ) : nodes.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <Server className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-700">No nodes registered</p>
          <p className="text-sm text-gray-400 mt-1">Add your first VPN node to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map((node) => (
            <div key={node.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              {/* Status & Hostname */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full mt-0.5 ${
                    node.status === 'online' ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 'bg-gray-300'
                  }`} />
                  <div>
                    <p className="font-semibold text-gray-900">{node.hostname}</p>
                    <p className="text-xs font-mono text-gray-400 mt-0.5">{node.ipAddress}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  node.status === 'online'
                    ? 'bg-emerald-50 text-emerald-700'
                    : node.status === 'offline'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-amber-50 text-amber-600'
                }`}>
                  {node.status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-xs text-gray-500">
                {node.region && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-300" /> {node.region}
                  </div>
                )}
                {node.version && (
                  <div className="flex items-center gap-2">
                    <Server className="h-3.5 w-3.5 text-gray-300" /> v{node.version}
                  </div>
                )}
                {node.lastSeen && (
                  <div className="flex items-center gap-2" suppressHydrationWarning>
                    <Clock className="h-3.5 w-3.5 text-gray-300" /> 
                    Last seen {new Date(node.lastSeen).toLocaleString()}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-gray-300" /> {node.activeSessions ?? 0} active sessions
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => { if (confirm('Remove node?')) deleteMutation.mutate(node.id) }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Node Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-900">Register Node</h2>
                <p className="text-sm text-gray-400 mt-0.5">Add a new VPN node</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={e => { e.preventDefault(); createMutation.mutate(form) }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hostname <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.hostname}
                  onChange={e => setForm({ ...form, hostname: e.target.value })}
                  placeholder="vpn-node-1"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">IP Address <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.ipAddress}
                  onChange={e => setForm({ ...form, ipAddress: e.target.value })}
                  placeholder="203.0.113.1"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Region</label>
                <input
                  type="text"
                  value={form.region}
                  onChange={e => setForm({ ...form, region: e.target.value })}
                  placeholder="Singapore"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Registering...' : 'Register Node'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
