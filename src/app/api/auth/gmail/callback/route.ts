import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma/client';
import { encrypt } from '@/lib/crypto/encrypt';

interface GoogleTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

interface GoogleUserInfo {
    email: string;
}

/**
 * GET /api/auth/gmail/callback
 * 
 * Handles OAuth callback from Google.
 * Exchanges authorization code for tokens and stores them encrypted.
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    const cookieStore = await cookies();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Handle OAuth errors (user denied access)
    if (error) {
        console.error('Gmail OAuth error:', error);
        const errorCode = error === 'access_denied' ? 'GMAIL_SCOPE_DENIED' : 'OAUTH_ERROR';
        return NextResponse.redirect(`${appUrl}/onboarding?error=${errorCode}`);
    }

    // Validate required parameters
    if (!code || !state) {
        return NextResponse.redirect(`${appUrl}/onboarding?error=INVALID_CALLBACK`);
    }

    // Validate CSRF state
    // Validate CSRF state
    const storedStateCookie = cookieStore.get('gmail_oauth_state')?.value;

    let csrfToken: string | undefined;
    let returnTo = '/onboarding';

    try {
        if (storedStateCookie) {
            // Try to parse as JSON (new format)
            const stateData = JSON.parse(storedStateCookie);
            csrfToken = stateData.csrfToken;
            returnTo = stateData.returnTo || '/onboarding';
        } else {
            // Fallback? No, strict security requires state.
        }
    } catch {
        // Fallback for backward compatibility or direct string (old format)
        csrfToken = storedStateCookie;
    }

    if (!csrfToken || csrfToken !== state) {
        console.error('CSRF state mismatch');
        return NextResponse.redirect(`${appUrl}/onboarding?error=INVALID_STATE`);
    }

    // Clear the state cookie
    cookieStore.delete('gmail_oauth_state');

    try {
        // Verify user is authenticated
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.redirect(`${appUrl}/login?error=SESSION_EXPIRED`);
        }

        // Get user's workspace
        const workspace = await prisma.workspace.findFirst({
            where: { userId: user.id },
        });

        if (!workspace) {
            return NextResponse.redirect(`${appUrl}/onboarding?error=NO_WORKSPACE`);
        }

        // Exchange code for tokens
        const clientId = process.env.GMAIL_CLIENT_ID!;
        const clientSecret = process.env.GMAIL_CLIENT_SECRET!;
        const redirectUri = `${appUrl}/api/auth/gmail/callback`;

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            console.error('Token exchange failed:', errorData);
            return NextResponse.redirect(`${appUrl}/onboarding?error=TOKEN_EXCHANGE_FAILED`);
        }

        const tokens: GoogleTokenResponse = await tokenResponse.json();

        if (!tokens.refresh_token) {
            console.error('No refresh token received - prompt=consent may not have been set');
            return NextResponse.redirect(`${appUrl}/onboarding?error=NO_REFRESH_TOKEN`);
        }

        // Get user's Gmail email address
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userInfoResponse.ok) {
            console.error('Failed to get user info');
            return NextResponse.redirect(`${appUrl}/onboarding?error=USER_INFO_FAILED`);
        }

        const userInfo: GoogleUserInfo = await userInfoResponse.json();

        // Calculate token expiry
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

        // Store tokens encrypted (upsert to handle reconnection)
        await prisma.gmailToken.upsert({
            where: { workspaceId: workspace.id },
            update: {
                accessToken: encrypt(tokens.access_token),
                refreshToken: encrypt(tokens.refresh_token),
                expiresAt,
                email: userInfo.email,
            },
            create: {
                workspaceId: workspace.id,
                accessToken: encrypt(tokens.access_token),
                refreshToken: encrypt(tokens.refresh_token),
                expiresAt,
                email: userInfo.email,
            },
        });

        // Redirect to original return path with success param
        const redirectUrl = new URL(`${appUrl}${returnTo}`);
        redirectUrl.searchParams.set('gmail_connected', 'true');
        return NextResponse.redirect(redirectUrl.toString());
    } catch (error) {
        console.error('Gmail OAuth callback error:', error);
        return NextResponse.redirect(`${appUrl}/onboarding?error=SERVER_ERROR`);
    }
}
