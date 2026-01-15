import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

/**
 * Gmail OAuth scopes required for sending and reading emails
 * Note: These are restricted scopes requiring Google verification for production
 */
const GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
];

/**
 * GET /api/auth/gmail
 * 
 * Initiates Gmail OAuth flow with incremental consent.
 * Requires authenticated session.
 */
export async function GET(request: NextRequest) {
    try {
        // Verify user is authenticated
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
                { status: 401 }
            );
        }

        // Validate required environment variables
        const clientId = process.env.GMAIL_CLIENT_ID;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL;

        if (!clientId || !appUrl) {
            console.error('Missing Gmail OAuth configuration');
            return NextResponse.json(
                { success: false, error: { code: 'CONFIG_ERROR', message: 'Gmail OAuth not configured' } },
                { status: 500 }
            );
        }

        // Determine return path (default to onboarding)
        const returnTo = request.nextUrl.searchParams.get('from') || '/onboarding';

        // Generate CSRF state token
        const csrfToken = randomBytes(32).toString('hex');

        // Build OAuth URL
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', `${appUrl}/api/auth/gmail/callback`);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', GMAIL_SCOPES.join(' '));
        authUrl.searchParams.set('access_type', 'offline'); // Get refresh token
        authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token
        authUrl.searchParams.set('include_granted_scopes', 'true'); // Incremental consent
        authUrl.searchParams.set('state', csrfToken); // CSRF protection

        // Redirect to Google OAuth and set cookie on response
        // Store both CSRF token and return path in the cookie
        const cookieValue = JSON.stringify({ csrfToken, returnTo });
        const response = NextResponse.redirect(authUrl.toString());

        response.cookies.set('gmail_oauth_state', cookieValue, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 10, // 10 minutes
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Gmail OAuth initiation error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to initiate Gmail OAuth' } },
            { status: 500 }
        );
    }
}
