/**
 * Active Campaigns Detection
 * Story 3.6: Get active campaigns for a prospect
 * MVP: Returns empty array as Campaign tables don't exist yet
 */

export interface ActiveCampaign {
    id: string;
    name: string;
    status: string;
}

/**
 * Check if a prospect is enrolled in active campaigns
 * MVP: Returns empty array as Campaign tables are not yet implemented (Epic 5)
 */
export async function getProspectActiveCampaigns(
    prospectId: string
): Promise<ActiveCampaign[]> {
    // TODO: Epic 5 - When CampaignEnrollment table exists, implement actual query:
    // const enrollments = await prisma.campaignEnrollment.findMany({
    //   where: { prospectId, status: { in: ['ACTIVE', 'PENDING'] } },
    //   include: { campaign: true },
    // });
    // return enrollments.map(e => ({
    //   id: e.campaign.id,
    //   name: e.campaign.name,
    //   status: e.status,
    // }));

    return [];
}
