
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
    Replace
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth/auth-store';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import Image from "next/image";

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


export function Sidebar() {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin';

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: '/riders', label: 'Riders', icon: <Users2 className="h-4 w-4" /> },
        { href: '/vehicles', label: 'Vehicles', icon: <Bike className="h-4 w-4" /> },
        { href: '/rentals', label: 'Rentals', icon: <FileText className="h-4 w-4" /> },
        { href: '/returns', label: 'Return Center', icon: <RotateCcw className="h-4 w-4" /> },
        { href: '/payments', label: 'Payments', icon: <CreditCard className="h-4 w-4" /> },
        { href: '/alerts', label: 'Alerts', icon: <AlertCircle className="h-4 w-4" /> },
        { href: '/reports', label: 'Reports', icon: <BarChart2 className="h-4 w-4" /> },
    ];

    const batteryLinks = [
        { href: '/batteries', label: 'Battery Packs', icon: <Battery className="h-4 w-4" />},
        { href: '/battery-swaps', label: 'Battery Swaps', icon: <Replace className="h-4 w-4" />},
    ]

    const adminLinks = [
        { href: '/staff', label: 'Staff', icon: <Users className="h-4 w-4" /> },
        { href: '/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
    ];

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
