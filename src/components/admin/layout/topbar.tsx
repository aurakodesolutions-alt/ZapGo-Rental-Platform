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
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function Topbar() {
    const { user, signOut } = useAuthStore(); // access the user & signOut from the store
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        signOut();  // Call signOut to clear the store and session
        router.push('/admin/login');  // Redirect to login page
    };

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/riders', label: 'Riders' },
        { href: '/vehicles', label: 'Vehicles' },
        { href: '/rentals', label: 'Rentals' },
        { href: '/returns', label: 'Returns' },
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
