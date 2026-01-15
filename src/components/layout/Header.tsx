import { UserNav } from "@/components/layout/UserNav";
import { createClient } from "@/lib/supabase/server";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Bell } from "lucide-react";
import { SidebarContent } from "@/components/layout/Sidebar";

export async function Header() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-lg px-6">
            <div className="flex items-center gap-4">
                {/* Mobile menu */}
                <div className="lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-slate-100">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64 border-r-0">
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Search placeholder - for future */}
                <div className="hidden md:block">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="h-10 w-64 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                            disabled
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Health Score Badge */}
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-emerald-700">
                        Score santé : --
                    </span>
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 rounded-xl">
                    <Bell className="h-5 w-5 text-slate-500" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </Button>

                {/* User Menu */}
                <UserNav user={user} />
            </div>
        </header>
    );
}
