import { z } from 'zod'

export const workspaceIdSchema = z.string().cuid()

export const prospectSchema = z.object({
    id: z.string().cuid().optional(),
    workspaceId: workspaceIdSchema,
    firstName: z.string().min(1, 'First name is required').nullable(),
    lastName: z.string().min(1, 'Last name is required').nullable(),
    email: z.string().email('Invalid email address'),
    status: z.enum(['NEW', 'CONTACTED', 'REPLIED', 'BOUNCED', 'UNSUBSCRIBED', 'BOOKED']).default('NEW'),
})

export type Prospect = z.infer<typeof prospectSchema>

export const createProspectSchema = prospectSchema.omit({ id: true })
