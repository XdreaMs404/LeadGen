import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
// TODO: Re-enable when Prisma 7 compatibility is fixed
import { syncUserFromAuth } from '@/lib/services/user-sync'
import { ensureWorkspaceForUser } from '@/lib/services/workspace-service'


export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                try {
                    await syncUserFromAuth({
                        id: user.id,
                        email: user.email!,
                        name: user.user_metadata?.full_name ?? user.user_metadata?.name,
                        avatarUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.picture,
                    })

                    await ensureWorkspaceForUser(user.id)

                } catch (syncError) {
                    console.error('User sync/workspace error:', syncError)
                    // AC 4: Redirect with error so dashboard can show friendly message
                    return NextResponse.redirect(`${origin}${next}?error=workspace_setup_failed`)
                }
            }

            // Successful authentication - redirect to dashboard
            return NextResponse.redirect(`${origin}${next}`)
        }

        // Log error for debugging (but don't expose to user)
        console.error('Auth callback error:', error.message)
    }

    // Redirect to login with error indication
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
