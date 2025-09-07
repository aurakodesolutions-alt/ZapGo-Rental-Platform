'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { navLinks } from '@/lib/constants';
import { useRider } from '@/hooks/public/useRider';

function NavItem({
                     href,
                     label,
                     active,
                     onClick,
                 }: {
    href: string;
    label: string;
    active: boolean;
    onClick?: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            aria-current={active ? 'page' : undefined}
            className={cn(
                'relative rounded-md px-1 py-0.5 text-sm font-medium transition-colors outline-none',
                active
                    ? 'text-foreground'
                    : 'text-foreground/60 hover:text-foreground/85 focus-visible:ring-2 focus-visible:ring-primary/40'
            )}
        >
            {label}
            {/* active underline */}
            <span
                className={cn(
                    'absolute inset-x-0 -bottom-1 mx-auto h-0.5 w-0 rounded-full bg-primary transition-all duration-200',
                    active && 'w-full'
                )}
            />
        </Link>
    );
}

export function SiteHeader() {
    const pathname = usePathname();
    const [isSheetOpen, setSheetOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { loggedIn, isLoading } = useRider();

    // blur / background only after scroll
    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 10);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // close mobile sheet on route change
    useEffect(() => {
        setSheetOpen(false);
    }, [pathname]);

    return (
        <>
            {/* a11y: skip link */}
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
            >
                Skip to content
            </a>

            <header
                data-scrolled={isScrolled ? 'true' : 'false'}
                className={cn(
                    'sticky top-0 z-50 w-full border-b transition-colors',
                    isScrolled
                        ? 'border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm'
                        : 'border-transparent bg-transparent'
                )}
            >
                <div className="container flex h-[80px] items-center md:h-18">
                    {/* Left: logo + primary nav */}
                    <div className="mr-4 flex flex-1 items-center">
                        <Link href="/" className="mr-6 flex items-center space-x-2">
                            <Image
                                src="/logo.png"
                                alt="ZapGo Rental"
                                width={110}
                                height={32}
                                className={cn('select-none', !isScrolled && 'dark:invert')}
                                priority
                            />
                        </Link>

                        <nav aria-label="Primary" className="hidden md:flex items-center gap-6">
                            {navLinks.map((l) => (
                                <NavItem key={l.href} href={l.href} label={l.name} active={pathname === l.href} />
                            ))}

                            {/* show My Profile inline when logged in */}
                            {!isLoading && loggedIn && (
                                <NavItem
                                    href="/rider/profile"
                                    label="My Profile"
                                    active={pathname === '/rider/profile'}
                                />
                            )}
                        </nav>
                    </div>

                    {/* Right: CTAs */}
                    <div className="flex items-center gap-2">
                        <Button asChild className="hidden rounded-xl md:inline-flex">
                            <Link href="/book">Book Now</Link>
                        </Button>

                        {!isLoading && !loggedIn && (
                            <Button asChild variant="outline" className="hidden rounded-xl md:inline-flex">
                                <Link href="/rider/login">Login</Link>
                            </Button>
                        )}

                        {/* Mobile menu */}
                        <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
                            <SheetTrigger asChild className="md:hidden">
                                <Button variant="ghost" size="icon" aria-label="Open Menu">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[88vw] sm:w-96">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center justify-center">
                                        <Image
                                            src="/logo.png"
                                            alt="ZapGo Rental"
                                            width={110}
                                            height={32}
                                            className={cn(!isScrolled && 'dark:invert')}
                                        />
                                    </SheetTitle>
                                </SheetHeader>

                                <nav aria-label="Mobile" className="mt-8 flex flex-col space-y-4">
                                    {navLinks.map((l) => (
                                        <NavItem
                                            key={l.href}
                                            href={l.href}
                                            label={l.name}
                                            active={pathname === l.href}
                                            onClick={() => setSheetOpen(false)}
                                        />
                                    ))}
                                    {!isLoading && loggedIn && (
                                        <NavItem
                                            href="/rider/profile"
                                            label="My Profile"
                                            active={pathname === '/rider/profile'}
                                            onClick={() => setSheetOpen(false)}
                                        />
                                    )}
                                </nav>

                                <div className="mt-8 space-y-3">
                                    <Button asChild size="lg" className="w-full rounded-xl">
                                        <Link href="/book">Book Now</Link>
                                    </Button>

                                    {!isLoading && !loggedIn && (
                                        <Button asChild size="lg" variant="outline" className="w-full rounded-xl">
                                            <Link href="/rider/login">Login</Link>
                                        </Button>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>
        </>
    );
}
