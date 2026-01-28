'use client';

import { useState } from 'react';
import { X, ArrowRight, Sparkles, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingBannerProps {
    className?: string;
}

/**
 * OnboardingBanner - Premium floating banner for incomplete onboarding
 */
export function OnboardingBanner({ className }: OnboardingBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    return (
        <AnimatePresence>
            {!dismissed && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                        'relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900',
                        className
                    )}
                    role="banner"
                    data-testid="onboarding-banner"
                >
                    {/* Animated gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-cyan-500/10" />

                    {/* Sparkle decorations */}
                    <motion.div
                        className="absolute left-8 top-1/2 -translate-y-1/2"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Sparkles className="h-4 w-4 text-teal-400/50" />
                    </motion.div>

                    <div className="relative z-10 flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-4 flex-1">
                            {/* Icon */}
                            <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30">
                                <Settings className="h-4 w-4 text-teal-400" />
                            </div>

                            {/* Message */}
                            <div className="flex-1">
                                <Link
                                    href="/settings/onboarding"
                                    className="group flex items-center gap-2"
                                >
                                    <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                                        Complétez la configuration pour commencer à envoyer
                                    </span>
                                    <motion.span
                                        className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-teal-400 bg-teal-500/10 px-2 py-1 rounded-full border border-teal-500/20"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        Configurer
                                        <ArrowRight className="h-3 w-3" />
                                    </motion.span>
                                </Link>
                            </div>
                        </div>

                        {/* Dismiss button */}
                        <motion.button
                            type="button"
                            onClick={() => setDismissed(true)}
                            className="ml-4 rounded-lg p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                            aria-label="Fermer la bannière"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <X className="h-4 w-4" />
                        </motion.button>
                    </div>

                    {/* Bottom gradient line */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
