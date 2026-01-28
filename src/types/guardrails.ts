/**
 * Pre-send block codes for guardrails system
 * Used to identify specific blocking conditions
 */
export type PreSendBlockCode =
    | 'ONBOARDING_INCOMPLETE'
    | 'GMAIL_NOT_CONNECTED'
    | 'GMAIL_TOKEN_INVALID'
    | 'WORKSPACE_NOT_FOUND'
    | 'QUOTA_EXCEEDED';

/**
 * Result of pre-send check
 * Indicates whether sending is allowed and reason if blocked
 */
export interface PreSendCheckResult {
    /** Whether the workspace can send emails */
    canSend: boolean;
    /** Human-readable reason for blocking (French) */
    blockedReason?: string;
    /** Machine-readable error code for frontend handling */
    code?: PreSendBlockCode;
}

/**
 * Response for campaign launch check API
 */
export interface CanLaunchResponse {
    /** Whether the campaign can be launched */
    canLaunch: boolean;
    /** Human-readable reason for blocking (French) */
    blockedReason?: string;
}
