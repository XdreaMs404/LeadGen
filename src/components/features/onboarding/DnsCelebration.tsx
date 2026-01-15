'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface DnsCelebrationProps {
    show: boolean;
    onDismiss: () => void;
    onContinue: () => void;
}

/**
 * DNS Celebration Component
 *
 * Shows celebration animation when all DNS records pass validation.
 * Features:
 * - Confetti animation on mount
 * - Pulsing success icon
 * - French "Votre domaine est prêt !" message
 * - Auto-navigate option after 3s
 */
export function DnsCelebration({ show, onDismiss, onContinue }: DnsCelebrationProps) {
    const [autoNavigate, setAutoNavigate] = useState(true);

    useEffect(() => {
        if (show) {
            // Fire confetti on both sides
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#14b8a6', '#10b981', '#06b6d4', '#8b5cf6'],
                });
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#14b8a6', '#10b981', '#06b6d4', '#8b5cf6'],
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };

            frame();

            // Auto-navigate after 3 seconds
            const timer = setTimeout(() => {
                if (autoNavigate) {
                    onContinue();
                }
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [show, autoNavigate, onContinue]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={onDismiss}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-w-md mx-4 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-8 text-white shadow-2xl"
                    >
                        {/* Background decorations */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10 flex flex-col items-center text-center gap-6">
                            {/* Animated icon */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 1],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                                className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                            >
                                <CheckCircle2 className="h-14 w-14" />
                            </motion.div>

                            {/* Title */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-center gap-2">
                                    <PartyPopper className="h-6 w-6" />
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <h2 className="text-3xl font-bold">
                                    Votre domaine est prêt !
                                </h2>
                                <p className="text-white/90">
                                    Tous les enregistrements DNS sont configurés correctement.
                                </p>
                            </div>

                            {/* Status badges */}
                            <div className="flex flex-wrap justify-center gap-2">
                                {['SPF', 'DKIM', 'DMARC'].map((record) => (
                                    <motion.div
                                        key={record}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + Math.random() * 0.3 }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full text-sm font-medium"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        {record}
                                    </motion.div>
                                ))}
                            </div>

                            {/* CTA Button */}
                            <Button
                                onClick={onContinue}
                                size="lg"
                                className="bg-white text-teal-700 hover:bg-white/90 font-semibold shadow-lg"
                                data-testid="celebration-continue-button"
                            >
                                Continuer vers le Dashboard
                            </Button>

                            {/* Auto-navigate toggle */}
                            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoNavigate}
                                    onChange={(e) => setAutoNavigate(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/30"
                                />
                                Redirection automatique dans 3s
                            </label>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
