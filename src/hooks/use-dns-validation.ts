import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@/lib/utils/api-response';
import type { DnsValidationResult } from '@/types/dns';
import type { DnsRecordType } from '@/lib/dns/dns-constants';

// Types for validate-all response
interface ValidateAllResult {
    spf: DnsValidationResult;
    dkim: DnsValidationResult;
    dmarc: DnsValidationResult;
    allPass: boolean;
}

// Types for override response
interface OverrideResult {
    recordType: DnsRecordType;
    status: 'MANUAL_OVERRIDE';
    message: string;
}

/**
 * Validate a single DNS record
 */
async function validateDnsRecord(
    recordType: DnsRecordType,
    selector?: string
): Promise<DnsValidationResult> {
    const response = await fetch('/api/workspace/dns/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordType, selector }),
    });

    const json: ApiResponse<DnsValidationResult> = await response.json();

    if (!json.success) {
        throw new Error(json.error.message);
    }

    return json.data;
}

/**
 * Validate all DNS records in parallel
 */
async function validateAllDnsRecords(): Promise<ValidateAllResult> {
    const response = await fetch('/api/workspace/dns/validate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    const json: ApiResponse<ValidateAllResult> = await response.json();

    if (!json.success) {
        throw new Error(json.error.message);
    }

    return json.data;
}

/**
 * Override a DNS record status manually
 */
async function overrideDnsRecord(
    recordType: DnsRecordType
): Promise<OverrideResult> {
    const response = await fetch('/api/workspace/dns/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordType, confirmed: true }),
    });

    const json: ApiResponse<OverrideResult> = await response.json();

    if (!json.success) {
        throw new Error(json.error.message);
    }

    return json.data;
}

/**
 * Hook for DNS validation operations
 *
 * Provides mutations for:
 * - validateDns: Validate a single DNS record
 * - validateAllDns: Validate all DNS records in parallel
 * - overrideDns: Manually override a DNS record status
 */
export function useDnsValidation() {
    const queryClient = useQueryClient();

    // Invalidate dns-status query on success
    const onSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['dns-status'] });
    };

    // Single record validation
    const validateDnsMutation = useMutation({
        mutationFn: ({ recordType, selector }: { recordType: DnsRecordType; selector?: string }) =>
            validateDnsRecord(recordType, selector),
        onSuccess,
    });

    // All records validation
    const validateAllDnsMutation = useMutation({
        mutationFn: validateAllDnsRecords,
        onSuccess,
    });

    // Manual override
    const overrideDnsMutation = useMutation({
        mutationFn: (recordType: DnsRecordType) => overrideDnsRecord(recordType),
        onSuccess,
    });

    return {
        // Single validation
        validateDns: validateDnsMutation.mutate,
        validateDnsAsync: validateDnsMutation.mutateAsync,
        isValidating: validateDnsMutation.isPending,
        validationResult: validateDnsMutation.data,
        validationError: validateDnsMutation.error,

        // All validation
        validateAllDns: validateAllDnsMutation.mutate,
        validateAllDnsAsync: validateAllDnsMutation.mutateAsync,
        isValidatingAll: validateAllDnsMutation.isPending,
        validateAllResult: validateAllDnsMutation.data,
        validateAllError: validateAllDnsMutation.error,

        // Override
        overrideDns: overrideDnsMutation.mutate,
        overrideDnsAsync: overrideDnsMutation.mutateAsync,
        isOverriding: overrideDnsMutation.isPending,
        overrideResult: overrideDnsMutation.data,
        overrideError: overrideDnsMutation.error,

        // Reset states
        resetValidation: validateDnsMutation.reset,
        resetValidateAll: validateAllDnsMutation.reset,
        resetOverride: overrideDnsMutation.reset,
    };
}
