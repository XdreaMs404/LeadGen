import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { success, error } from '@/lib/utils/api-response';

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(error('UNAUTHORIZED', 'Non authentifié'), { status: 401 });
    }

    try {
        const workspace = await prisma.workspace.findFirst({
            where: { userId: user.id },
            select: {
                id: true,
                name: true,
                gmailToken: {
                    select: {
                        isValid: true,
                        email: true
                    }
                }
            }
        });

        if (!workspace) {
            return NextResponse.json(error('NOT_FOUND', 'Workspace not found'), { status: 404 });
        }

        return NextResponse.json(success(workspace));
    } catch (e) {
        return NextResponse.json(error('INTERNAL_ERROR', 'Failed to fetch workspace'), { status: 500 });
    }
}
