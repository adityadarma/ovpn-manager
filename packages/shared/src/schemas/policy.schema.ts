import { z } from 'zod'

export const CreatePolicySchema = z.object({
  userId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  allowedNetwork: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/, 'Must be a valid CIDR'),
  action: z.enum(['allow', 'deny']).default('allow'),
  priority: z.number().int().min(0).max(1000).default(100),
  description: z.string().max(500).optional(),
}).refine(
  (data) => (data.userId && !data.groupId) || (!data.userId && data.groupId),
  { message: 'Must specify either userId or groupId, but not both' }
)

export type CreatePolicyInput = z.infer<typeof CreatePolicySchema>
