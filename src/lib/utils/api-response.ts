export type ApiResponse<T> =
    | { success: true; data: T }
    | { success: false; error: { code: string; message: string; details?: unknown } };

export function success<T>(data: T): ApiResponse<T> {
    return { success: true, data };
}

export function error(code: string, message: string, details?: unknown): ApiResponse<never> {
    return { success: false, error: { code, message, details } };
}
