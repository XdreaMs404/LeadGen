import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { revokeGmailToken } from '@/lib/gmail/token-service';

/**
 * DELETE /api/auth/gmail/revoke
 * 
 * Revokes Gmail OAuth tokens and disconnects Gmail from the workspace.
 */
export async function DELETE() {
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

        // Get user's workspace
        const workspace = await prisma.workspace.findFirst({
            where: { userId: user.id },
            select: { id: true },
        });

        if (!workspace) {
            return NextResponse.json(
                { success: false, error: { code: 'NO_WORKSPACE', message: 'No workspace found' } },
                { status: 404 }
            );
        }

        // Revoke token
        const wasRevoked = await revokeGmailToken(workspace.id);

        if (!wasRevoked) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_CONNECTED', message: 'Gmail is not connected' } },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { message: 'Gmail disconnected successfully' },
        });
    } catch (error) {
        console.error('Gmail revoke error:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to disconnect Gmail' } },
            { status: 500 }
        );
    }
}
