/**
 * Sending Settings Types
 * Story 5.3: Sending Settings Configuration
 */

/**
 * Sending settings configuration for a workspace
 */
export interface SendingSettings {
    id: string;
    workspaceId: string;
    sendingDays: number[]; // Array of 0-6 (Sun-Sat), e.g., [1,2,3,4,5] for Mon-Fri
    startHour: number; // 0-23
    endHour: number; // 0-23
    timezone: string; // IANA timezone, e.g., "Europe/Paris"
    dailyQuota: number; // 20-50
    rampUpEnabled: boolean;
    fromName: string | null;
    signature: string | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Input for creating/updating sending settings
 */
export interface SendingSettingsInput {
    sendingDays: number[];
    startHour: number;
    endHour: number;
    timezone: string;
    dailyQuota: number;
    rampUpEnabled: boolean;
    fromName?: string;
    signature?: string;
}

/**
 * API response type for sending settings
 */
export interface SendingSettingsResponse {
    id: string;
    workspaceId: string;
    sendingDays: number[];
    startHour: number;
    endHour: number;
    timezone: string;
    dailyQuota: number;
    rampUpEnabled: boolean;
    fromName: string | null;
    signature: string | null;
    createdAt: string;
    updatedAt: string;
}

export const DEFAULT_SENDING_SETTINGS: {
    sendingDays: number[];
    startHour: number;
    endHour: number;
    timezone: string;
    dailyQuota: number;
    rampUpEnabled: boolean;
    fromName: null;
    signature: null;
} = {
    sendingDays: [1, 2, 3, 4, 5], // Mon-Fri
    startHour: 9,
    endHour: 18,
    timezone: 'Europe/Paris',
    dailyQuota: 30,
    rampUpEnabled: true,
    fromName: null,
    signature: null,
};

/**
 * Common timezones for the dropdown
 */
export const COMMON_TIMEZONES = [
    'Europe/Paris',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Rome',
    'Europe/Amsterdam',
    'Europe/Brussels',
    'Europe/Zurich',
    'America/New_York',
    'America/Chicago',
    'America/Los_Angeles',
    'America/Toronto',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Asia/Dubai',
    'Australia/Sydney',
] as const;

/**
 * Day names for the UI (French)
 */
export const DAY_NAMES = {
    0: 'Dim',
    1: 'Lun',
    2: 'Mar',
    3: 'Mer',
    4: 'Jeu',
    5: 'Ven',
    6: 'Sam',
} as const;

/**
 * Ramp-up schedule for new campaigns
 * Day 1: 20 emails, Day 2: 30 emails, Day 3: 40 emails, then cap at dailyQuota
 */
export const RAMP_UP_SCHEDULE = [20, 30, 40] as const;
