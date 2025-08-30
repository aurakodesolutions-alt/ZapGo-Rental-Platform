'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { ZapGoLogo } from './icons';
import { navLinks } from '@/lib/constants';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from './ui/sheet';
import {useEffect, useState} from 'react';
import Image from "next/image";

export function SiteHeader() {
    const pathname = usePathname();
    const [isSheetOpen, setSheetOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-20 items-center">
                <div className="mr-4 flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <Image src="/logo.png" alt="ZapGo Rental Logo" width={110} height={32} className={cn(isScrolled ? '' : 'dark:invert')} />
                        {/*<ZapGoLogo className="h-6 w-6 text-primary" />*/}
                        {/*<span className="font-bold font-headline">ZapGo</span>*/}
                    </Link>
                    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'transition-colors hover:text-foreground/80',
                                    pathname === link.href
                                        ? 'text-foreground'
                                        : 'text-foreground/60'
                                )}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex flex-1 items-center justify-end space-x-2">
                    <Button asChild className="hidden md:inline-flex rounded-xl">
                        <Link href="/book">Book Now</Link>
                    </Button>

                    <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Open Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <SheetHeader>
                                <SheetTitle className="flex items-center justify-center">
                                    <Image src="/logo.png" alt="ZapGo Rental Logo" width={110} height={32} className={cn(isScrolled ? '' : 'dark:invert')} />
                                    {/*<span className="font-bold font-headline">ZapGo</span>*/}
                                </SheetTitle>
                            </SheetHeader>
                            <div className="mt-8 flex flex-col space-y-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={cn(
                                            'text-lg font-medium transition-colors hover:text-primary',
                                            pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                                        )}
                                        onClick={() => setSheetOpen(false)}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>
                            <Button asChild className="mt-8 w-full rounded-xl" size="lg">
                                <Link href="/book" onClick={() => setSheetOpen(false)}>Book Now</Link>
                            </Button>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
