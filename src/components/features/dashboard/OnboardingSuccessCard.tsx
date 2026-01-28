'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Rocket, Sparkles, PartyPopper, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

/**
 * OnboardingSuccessCard - Premium celebration card when onboarding is complete
 */
export function OnboardingSuccessCard() {
    const items = [
        { label: 'Connexion Gmail', icon: '📧' },
        { label: 'SPF configuré', icon: '🛡️' },
        { label: 'DKIM configuré', icon: '🔐' },
        { label: 'DMARC configuré', icon: '✅' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            <Card
                className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-2xl"
                data-testid="onboarding-success-card"
            >
                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        className="absolute top-4 left-8 text-4xl"
                        animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        🎉
                    </motion.div>
                    <motion.div
                        className="absolute top-8 right-12 text-3xl"
                        animate={{ y: [0, -8, 0], rotate: [0, -15, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                    >
                        ✨
                    </motion.div>
                    <motion.div
                        className="absolute bottom-12 right-8 text-2xl"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                    >
                        🚀
                    </motion.div>
                    <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
                </div>

                <CardContent className="relative z-10 p-8">
                    {/* Success Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-4 shadow-lg"
                        >
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                            >
                                <PartyPopper className="h-10 w-10 text-white" />
                            </motion.div>
                        </motion.div>

                        <motion.h2
                            className="text-3xl font-bold mb-2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            Configuration terminée !
                        </motion.h2>
                        <motion.p
                            className="text-white/80 text-lg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            Votre compte est prêt pour envoyer des emails
                        </motion.p>
                    </div>

                    {/* Checkmarks Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        {items.map((item, index) => (
                            <motion.div
                                key={item.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20"
                            >
                                <span className="text-xl">{item.icon}</span>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">{item.label}</p>
                                </div>
                                <CheckCircle2 className="h-5 w-5 text-white/80" />
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                    >
                        <Button
                            asChild
                            className="w-full h-14 bg-white text-teal-700 hover:bg-white/90 font-bold text-lg shadow-xl border-0 transition-all hover:scale-[1.02]"
                        >
                            <Link href="/prospects" className="flex items-center justify-center gap-3">
                                <Rocket className="h-5 w-5" />
                                Commencer à prospecter
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                        </Button>
                    </motion.div>

                    {/* Subtle footer */}
                    <motion.p
                        className="text-center text-sm text-white/60 mt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1 }}
                    >
                        <Sparkles className="inline h-4 w-4 mr-1" />
                        Parfait, votre délivrabilité est optimisée !
                    </motion.p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
