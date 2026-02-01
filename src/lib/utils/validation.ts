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

/**
 * Sending Settings Validation Schema
 * Story 5.3
 */
export const sendingSettingsSchema = z.object({
    sendingDays: z.array(z.number().min(0).max(6)).min(1, "Sélectionnez au moins un jour"),
    startHour: z.number().min(0).max(23),
    endHour: z.number().min(0).max(23),
    timezone: z.string().min(1, "Timezone requis"),
    dailyQuota: z.number().min(20).max(50),
    rampUpEnabled: z.boolean(),
    fromName: z.string().optional().nullable(),
    signature: z.string().optional().nullable(),
}).refine(
    (data) => data.startHour < data.endHour,
    { message: "L'heure de début doit être avant l'heure de fin", path: ["startHour"] }
);

export type SendingSettingsInput = z.infer<typeof sendingSettingsSchema>;

