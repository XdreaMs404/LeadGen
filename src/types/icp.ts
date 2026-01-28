import { z } from 'zod';

export const COMPANY_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '500+'] as const;
export type CompanySize = typeof COMPANY_SIZE_OPTIONS[number];

export const IcpConfigInputSchema = z.object({
    industries: z.array(z.string()).default([]),
    companySizes: z.array(z.enum(COMPANY_SIZE_OPTIONS)).default([]),
    roles: z.array(z.string()).default([]),
    locations: z.array(z.string()).default([]),
});

export type IcpConfigInput = z.infer<typeof IcpConfigInputSchema>;

export interface IcpConfig {
    id: string;
    workspaceId: string;
    industries: string[];
    companySizes: CompanySize[];
    roles: string[];
    locations: string[];
    createdAt: string;
    updatedAt: string;
}
