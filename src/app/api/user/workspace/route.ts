import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceId } from '@/lib/guardrails/workspace-check'
import { success, error } from '@/lib/utils/api-response'

export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json(error('UNAUTHORIZED', 'Not authenticated'), { status: 401 })
    }

    try {
        const workspaceId = await getWorkspaceId(user.id)
        return NextResponse.json(success({ workspaceId }))
    } catch (e) {
        // Log the error for debugging
        console.error('Error fetching workspace:', e)
        return NextResponse.json(error('NOT_FOUND', 'No workspace found'), { status: 404 })
    }
}
