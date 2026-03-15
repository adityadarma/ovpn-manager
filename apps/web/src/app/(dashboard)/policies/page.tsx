'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Plus, Trash2, Shield, X, Search, Users, UsersRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Policy {
  id: string
  userId: string | null
  groupId: string | null
  username?: string
  group_name?: string
  allowedNetwork: string
  action: 'allow' | 'deny'
  priority: number
  description: string | null
}

interface CreatePolicyForm {
  targetType: 'user' | 'group'
  userId: string
  groupId: string
  allowedNetwork: string
  action: 'allow' | 'deny'
  priority: string
  description: string
}

export default function PoliciesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState<CreatePolicyForm>({
    targetType: 'user',
    userId: '',
    groupId: '',
    allowedNetwork: '',
    action: 'allow',
    priority: '100',
    description: '',
  })

  const { data: policies = [], isLoading } = useQuery<Policy[]>({
    queryKey: ['policies'],
    queryFn: () => api.get('/api/v1/policies'),
  })

  const { data: users = [] } = useQuery<{ id: string; username: string }[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/api/v1/users'),
  })

  const { data: groups = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['groups'],
    queryFn: () => api.get('/api/v1/groups'),
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/api/v1/policies', {
      userId: form.targetType === 'user' ? form.userId : undefined,
      groupId: form.targetType === 'group' ? form.groupId : undefined,
      allowedNetwork: form.allowedNetwork,
      action: form.action,
      priority: parseInt(form.priority) || 100,
      description: form.description || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['policies'] })
      setShowForm(false)
      setForm({ targetType: 'user', userId: '', groupId: '', allowedNetwork: '', action: 'allow', priority: '100', description: '' })
      toast.success('Policy created')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/policies/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['policies'] })
      toast.success('Policy deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // Filter policies
  const userPolicies = policies.filter(p => p.userId)
  const groupPolicies = policies.filter(p => p.groupId)

  // Search filter
  const filterPolicies = (policyList: Policy[]) => {
    if (!searchQuery) return policyList
    const query = searchQuery.toLowerCase()
    return policyList.filter(p => 
      (p.username?.toLowerCase().includes(query)) ||
      (p.group_name?.toLowerCase().includes(query)) ||
      p.allowedNetwork.toLowerCase().includes(query) ||
      (p.description?.toLowerCase().includes(query))
    )
  }

  const filteredUserPolicies = filterPolicies(userPolicies)
  const filteredGroupPolicies = filterPolicies(groupPolicies)

  const PolicyTable = ({ policies: policyList, type }: { policies: Policy[]; type: 'user' | 'group' }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {policyList.length === 0 ? (
        <div className="py-16 text-center">
          <Shield className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-700">No {type} policies found</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery ? 'Try a different search term' : `Create network access rules for ${type}s`}
          </p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {type === 'user' ? 'User' : 'Group'}
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Network</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {policyList.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 text-gray-900 font-medium">
                  {type === 'user' ? (p.username ?? p.userId) : (p.group_name ?? p.groupId)}
                </td>
                <td className="px-5 py-4 font-mono text-xs text-gray-600">{p.allowedNetwork}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    p.action === 'allow'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {p.action}
                  </span>
                </td>
                <td className="px-5 py-4 text-gray-500">{p.priority}</td>
                <td className="px-5 py-4 text-gray-500 max-w-xs truncate">
                  {p.description && p.description.length > 0 ? p.description : '—'}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => { if (confirm('Delete policy?')) deleteMutation.mutate(p.id) }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Network Policies</h1>
          <p className="text-sm text-gray-500 mt-1">{policies.length} rule{policies.length !== 1 ? 's' : ''} defined</p>
        </div>
        <Button
          id="btn-add-policy"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => setShowForm(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Policy
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search policies by user, group, network, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-400">Loading policies...</div>
      ) : (
        <Tabs defaultValue="user" className="space-y-4">
          <TabsList>
            <TabsTrigger value="user" className="gap-2">
              <Users className="h-4 w-4" />
              User Policies ({userPolicies.length})
            </TabsTrigger>
            <TabsTrigger value="group" className="gap-2">
              <UsersRound className="h-4 w-4" />
              Group Policies ({groupPolicies.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="user">
            <PolicyTable policies={filteredUserPolicies} type="user" />
          </TabsContent>

          <TabsContent value="group">
            <PolicyTable policies={filteredGroupPolicies} type="group" />
          </TabsContent>
        </Tabs>
      )}

      {/* Add Policy Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-900">Add Policy</h2>
                <p className="text-sm text-gray-400 mt-0.5">Define network access rules</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={e => { e.preventDefault(); createMutation.mutate() }}
              className="p-5 space-y-4"
            >
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1.5">Target Type <span className="text-red-500">*</span></Label>
                <select
                  value={form.targetType}
                  onChange={e => setForm({ ...form, targetType: e.target.value as 'user' | 'group', userId: '', groupId: '' })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="user">User</option>
                  <option value="group">Group</option>
                </select>
              </div>

              {form.targetType === 'user' ? (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1.5">User <span className="text-red-500">*</span></Label>
                  <select
                    value={form.userId}
                    onChange={e => setForm({ ...form, userId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">Select user...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1.5">Group <span className="text-red-500">*</span></Label>
                  <select
                    value={form.groupId}
                    onChange={e => setForm({ ...form, groupId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">Select group...</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1.5">Network CIDR <span className="text-red-500">*</span></Label>
                <Input
                  type="text"
                  value={form.allowedNetwork}
                  onChange={e => setForm({ ...form, allowedNetwork: e.target.value })}
                  placeholder="10.0.0.0/24"
                  required
                  className="font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1.5">Action</Label>
                  <select
                    value={form.action}
                    onChange={e => setForm({ ...form, action: e.target.value as 'allow' | 'deny' })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="allow">Allow</option>
                    <option value="deny">Deny</option>
                  </select>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</Label>
                  <Input
                    type="number"
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    placeholder="100"
                    min="1"
                    max="1000"
                  />
                </div>
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1.5">Description</Label>
                <Input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending ? 'Adding...' : 'Add Policy'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
