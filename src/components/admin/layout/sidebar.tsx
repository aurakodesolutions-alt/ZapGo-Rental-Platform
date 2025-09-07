
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    AlertCircle,
    BarChart2,
    Bike,
    CreditCard,
    FileText,
    LayoutDashboard,
    Settings,
    Users,
    Users2,
    RotateCcw,
    Battery,
    Layers
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth/auth-store';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import Image from "next/image";
import {Skeleton} from "@/components/ui/skeleton";

const ZapGoLogo = () => (
    <div className="flex items-center gap-2 px-4">
        <Image src="/logo_zapgo_final.png" alt="ZapGo Logo" width={70} height={50} />
        <span className="text-xl font-bold font-headline">Admin</span>
    </div>
);

const NavItem = ({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) => {
    const pathname = usePathname();
    const isActive = pathname.startsWith(href);
    return (
        <Link
            href={href}
            className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                isActive && 'bg-muted text-primary'
            )}
        >
            {icon}
            {children}
        </Link>
    );
};

function SidebarSkeleton() {
    const Row = () => (
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-28" />
        </div>
    );

    return (
        <div className="hidden border-r bg-card md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-20 items-center justify-center border-b px-4 lg:h-[75px] lg:px-6">
                    <Skeleton className="h-6 w-28" />
                </div>
                <div className="flex-1 overflow-y-auto px-2 py-3 lg:px-4">
                    <div className="grid items-start gap-1 text-sm font-medium">
                        {Array.from({ length: 6 }).map((_, i) => <Row key={`main-${i}`} />)}
                        <hr className="my-2" />
                        {Array.from({ length: 2 }).map((_, i) => <Row key={`battery-${i}`} />)}
                        <hr className="my-2" />
                        {Array.from({ length: 2 }).map((_, i) => <Row key={`admin-${i}`} />)}
                    </div>
                </div>
            </div>
        </div>
    );
}


export function Sidebar() {
    const { user, status } = useAuthStore();
    const isAdmin = user?.role === 'admin';

    const navLinks = [
        { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: '/admin/plans', label: 'Plans', icon: <Layers className="h-4 w-4" /> },
        { href: '/admin/riders', label: 'Riders', icon: <Users2 className="h-4 w-4" /> },
        { href: '/admin/vehicles', label: 'Vehicles', icon: <Bike className="h-4 w-4" /> },
        { href: '/admin/rentals', label: 'Rentals', icon: <FileText className="h-4 w-4" /> },
        { href: '/admin/returns', label: 'Return Center', icon: <RotateCcw className="h-4 w-4" /> },
        { href: '/admin/payments', label: 'Payments', icon: <CreditCard className="h-4 w-4" /> },
        { href: '/admin/alerts', label: 'Alerts', icon: <AlertCircle className="h-4 w-4" /> },
        { href: '/admin/reports', label: 'Reports', icon: <BarChart2 className="h-4 w-4" /> },
    ];

    const batteryLinks = [
        { href: '/admin/inventory', label: 'Inventory', icon: <Battery className="h-4 w-4" />},
    ]

    const adminLinks = [
        { href: '/admin/staff', label: 'Staff', icon: <Users className="h-4 w-4" /> },
        { href: '/admin/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
    ];
    if(status === 'unauthenticated') {
        return(
            <SidebarSkeleton />
        );
    }
    return (
        <div className="hidden border-r bg-card md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-20 justify-center items-center border-b px-4 lg:h-[75px] lg:px-6">
                    <Image src="/logo.png" alt="ZapGo Rental Logo" width={110} height={32} className={""} />
                </div>
                <div className="flex-1 overflow-y-auto">
                    <nav className="grid items-start gap-1 px-2 text-sm font-medium lg:px-4">
                        {navLinks.map((link) => (
                            <NavItem key={link.href} href={link.href} icon={link.icon}>{link.label}</NavItem>
                        ))}
                        <hr className="my-2"/>
                        {batteryLinks.map((link) => (
                            <NavItem key={link.href} href={link.href} icon={link.icon}>{link.label}</NavItem>
                        ))}
                        {isAdmin && (
                            <>
                                <hr className="my-2"/>
                                {adminLinks.map((link) => (
                                    <NavItem key={link.href} href={link.href} icon={link.icon}>{link.label}</NavItem>
                                ))}
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </div>
    );
}
