'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CircleUser, Menu, Package2, Search, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStore } from '@/lib/auth/auth-store'; // This is our store now
import { signOut } from "next-auth/react"
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import {Skeleton} from "@/components/ui/skeleton";

function TopbarSkeleton() {
    return (
        <header className="sticky top-0 z-10 flex h-[75px] items-center gap-4 border-b bg-card px-4 md:px-6">
            {/* Left / brand + desktop nav skeletons */}
            <nav className="hidden items-center gap-5 md:flex lg:gap-6">
                <div className="flex items-center gap-2">
                    <Zap className="h-6 w-6 text-primary" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <div className="hidden md:flex items-center gap-5 lg:gap-6">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </nav>

            {/* Mobile menu button skeleton */}
            <div className="md:hidden">
                <Skeleton className="h-10 w-10 rounded-md" />
            </div>

            {/* Search + actions skeletons */}
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <div className="ml-auto hidden sm:block">
                    <Skeleton className="h-10 w-[220px] sm:w-[300px] md:w-[200px] lg:w-[300px] rounded-md" />
                </div>
                <Skeleton className="h-10 w-32 rounded-md" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>
        </header>
    );
}

export function Topbar() {
    const { user, status } = useAuthStore(); // access the user & signOut from the store
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        signOut({ callbackUrl: "/admin/login" });  // Call signOut to clear the store and session
        // router.push('/login');  // Redirect to login page
    };

    const navLinks = [
        { href: '/admin/dashboard', label: 'Dashboard' },
        {href: '/admin/plans', label: 'Plans'},
        { href: '/admin/riders', label: 'Riders' },
        { href: '/admin/vehicles', label: 'Vehicles' },
        { href: '/admin/rentals', label: 'Rentals' },
        { href: '/admin/returns', label: 'Returns' },
    ];

    const MobileNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
        const isActive = pathname.startsWith(href);
        return (
            <Link
                href={href}
                className={cn(
                    "text-muted-foreground transition-colors hover:text-foreground",
                    isActive && 'text-foreground'
                )}
            >
                {children}
            </Link>
        );
    };

    if(status === 'unauthenticated') {
        return (
            <TopbarSkeleton/>
        )
    }

    return (
        <header className="sticky top-0 flex h-[75px] items-center gap-4 border-b bg-card px-4 md:px-6 z-10">
            <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                    <Zap className="h-6 w-6 text-primary" />
                    <span className="sr-only">ZapGo</span>
                </Link>
                {navLinks.map(link => (
                    <MobileNavLink key={link.href} href={link.href}>{link.label}</MobileNavLink>
                ))}
            </nav>
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <nav className="grid gap-6 text-lg font-medium">
                        <Link href="#" className="flex items-center gap-2 text-lg font-semibold">
                            <Zap className="h-6 w-6 text-primary" />
                            <span className="sr-only">ZapGo</span>
                        </Link>
                        {navLinks.map(link => (
                            <MobileNavLink key={link.href} href={link.href}>{link.label}</MobileNavLink>
                        ))}
                    </nav>
                </SheetContent>
            </Sheet>
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <form className="ml-auto flex-1 sm:flex-initial">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search riders, vehicles..."
                            className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                        />
                    </div>
                </form>
                <Button asChild>
                    <Link href="/rentals/new">+ New Rental</Link>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="rounded-full">
                            <CircleUser className="h-5 w-5" />
                            <span className="sr-only">Toggle user menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{user?.name || 'My Account'}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile (placeholder)</DropdownMenuItem>
                        <DropdownMenuItem>Support</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
