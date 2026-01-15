'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Send, Inbox, Settings, Sparkles } from 'lucide-react';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Prospects', href: '/prospects', icon: Users },
    { name: 'Séquences', href: '/sequences', icon: Send },
    { name: 'Inbox', href: '/inbox', icon: Inbox },
];

const bottomNavItems = [
    { name: 'Paramètres', href: '/settings', icon: Settings },
];

export function SidebarContent() {
    const pathname = usePathname();

    return (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center px-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                        LeadGen
                    </span>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 flex flex-col justify-between py-4 px-3">
                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-700 shadow-sm"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                    isActive
                                        ? "bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25"
                                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                                )}>
                                    <item.icon className="h-4 w-4" />
                                </div>
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Navigation */}
                <nav className="space-y-1 border-t border-slate-100 pt-4">
                    {bottomNavItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-700 shadow-sm"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                    isActive
                                        ? "bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25"
                                        : "bg-slate-100 text-slate-500"
                                )}>
                                    <item.icon className="h-4 w-4" />
                                </div>
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}

export function Sidebar() {
    return (
        <div className="hidden bg-white border-r border-slate-100 lg:block lg:w-64 lg:fixed lg:inset-y-0 shadow-xl shadow-slate-100/50">
            <SidebarContent />
        </div>
    );
}
