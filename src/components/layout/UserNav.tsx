'use client';

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { signOut } from "@/lib/auth/actions";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UserNavProps {
    user: User | null;
}

export function UserNav({ user }: UserNavProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const email = user?.email || "";
    const initial = email[0]?.toUpperCase() || "U";
    const name = user?.user_metadata?.full_name || 'User';

    const handleSignOut = async () => {
        setIsLoggingOut(true);

        const result = await signOut({ queryClient });

        if (result.success) {
            toast.success("Logged out successfully");
            router.push('/login');
        } else {
            toast.error(result.error || "Failed to log out");
            setIsLoggingOut(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={email} />
                        <AvatarFallback>{initial}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} disabled={isLoggingOut}>
                    {isLoggingOut ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                    )}
                    <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
