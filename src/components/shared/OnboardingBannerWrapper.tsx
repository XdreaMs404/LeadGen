'use client';

import { useOnboardingStatus } from '@/hooks/use-onboarding-status';
import { OnboardingBanner } from '@/components/shared/OnboardingBanner';

/**
 * OnboardingBannerWrapper - Client component that conditionally renders the banner
 */
export function OnboardingBannerWrapper() {
    const { onboardingComplete, isLoading } = useOnboardingStatus();

    // Don't show while loading or when onboarding is complete
    if (isLoading || onboardingComplete) {
        return null;
    }

    return <OnboardingBanner />;
}
