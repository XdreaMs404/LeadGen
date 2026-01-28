'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandShortcut,
} from '@/components/ui/command';
import {
    LayoutDashboard,
    Users,
    Settings,
    UserPlus,
    Upload,
} from 'lucide-react';

interface CommandPaletteProps {
    onAddProspect?: () => void;
}

interface CommandAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    shortcut?: string;
    action: () => void;
    keywords?: string[];
}

/**
 * Global Command Palette Component
 * Story 3.3: Quick action to add prospect via Alt+N
 * 
 * Shortcut: Alt+N (not Ctrl+K which is reserved by browsers)
 */
export function CommandPalette({ onAddProspect }: CommandPaletteProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    // Handle keyboard shortcut Alt+N
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            // Alt+N to open command palette
            if (e.key === 'n' && e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const handleAddProspect = useCallback(() => {
        setOpen(false);
        onAddProspect?.();
    }, [onAddProspect]);

    const handleNavigation = useCallback((path: string) => {
        setOpen(false);
        router.push(path);
    }, [router]);

    const actions: CommandAction[] = [
        {
            id: 'add-prospect',
            label: 'Ajouter un prospect',
            icon: <UserPlus className="h-4 w-4" />,
            shortcut: 'N',
            action: handleAddProspect,
            keywords: ['nouveau', 'créer', 'prospect', 'contact'],
        },
        {
            id: 'import-csv',
            label: 'Importer des prospects',
            icon: <Upload className="h-4 w-4" />,
            action: () => handleNavigation('/prospects/import'),
            keywords: ['csv', 'import', 'fichier', 'upload'],
        },
        {
            id: 'go-dashboard',
            label: 'Aller au Dashboard',
            icon: <LayoutDashboard className="h-4 w-4" />,
            shortcut: 'D',
            action: () => handleNavigation('/dashboard'),
            keywords: ['accueil', 'tableau de bord'],
        },
        {
            id: 'go-prospects',
            label: 'Voir les prospects',
            icon: <Users className="h-4 w-4" />,
            action: () => handleNavigation('/prospects'),
            keywords: ['liste', 'contacts'],
        },
        {
            id: 'go-settings',
            label: 'Paramètres',
            icon: <Settings className="h-4 w-4" />,
            action: () => handleNavigation('/settings'),
            keywords: ['configuration', 'réglages'],
        },
    ];

    return (
        <CommandDialog
            open={open}
            onOpenChange={setOpen}
            title="Palette de commandes"
            description="Recherchez une action..."
        >
            <CommandInput placeholder="Rechercher une action..." />
            <CommandList>
                <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
                <CommandGroup heading="Actions">
                    {actions.slice(0, 2).map((action) => (
                        <CommandItem
                            key={action.id}
                            onSelect={action.action}
                            keywords={action.keywords}
                        >
                            {action.icon}
                            <span>{action.label}</span>
                            {action.shortcut && (
                                <CommandShortcut>Alt+{action.shortcut}</CommandShortcut>
                            )}
                        </CommandItem>
                    ))}
                </CommandGroup>
                <CommandGroup heading="Navigation">
                    {actions.slice(2).map((action) => (
                        <CommandItem
                            key={action.id}
                            onSelect={action.action}
                            keywords={action.keywords}
                        >
                            {action.icon}
                            <span>{action.label}</span>
                            {action.shortcut && (
                                <CommandShortcut>Alt+{action.shortcut}</CommandShortcut>
                            )}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}

/**
 * Hook to control the command palette programmatically
 */
export function useCommandPalette() {
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

    return { isOpen, open, close, toggle };
}
