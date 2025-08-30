import Link from 'next/link';
import { ZapGoLogo } from './icons';
import { footerLinks, socialLinks } from '@/lib/constants';
import { Button } from './ui/button';
import Image from "next/image";
import {cn} from "@/lib/utils";

export function SiteFooter() {
    return (
        <footer className="bg-card text-card-foreground border-t mt-auto ">
            <div className="container px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
                    <div className="flex flex-col justify-center space-y-4 items-center md:items-start md:col-span-1">
                        <Link href="/" className="flex items-center space-x-2">
                            <Image src="/logo.png" alt="ZapGo Rental Logo" width={110} height={32} className={"dark:invert"} />
                            <span className="font-bold text-xl font-headline">ZapGo Rental</span>
                        </Link>
                        <p className="text-muted-foreground max-w-xs">
                            Electric scooter rentals for the modern commuter.
                        </p>
                        <div className="flex space-x-2">
                            {socialLinks.map((link) => (
                                <Button key={link.name} variant="ghost" size="icon" asChild>
                                    <a href={link.href} target="_blank" rel="noreferrer">
                                        <link.icon className="h-5 w-5" />
                                        <span className="sr-only">{link.name}</span>
                                    </a>
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 col-span-1 md:col-span-3">
                        {footerLinks.map((section) => (
                            <div key={section.title} className="md:justify-self-center">
                                <h3 className="font-headline font-semibold">{section.title}</h3>
                                <ul className="mt-4 space-y-2">
                                    {section.links.map((link) => (
                                        <li key={link.name}>
                                            <Link
                                                href={link.href}
                                                className="text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                {link.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-8 border-t pt-8 text-center text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} ZapGo. All rights reserved.</p>
                    {/*<p className="mt-2">Developed By Amalendu Pandey</p>*/}
                    <div className="container mx-auto">
                        <span>Made with passion ✨ by </span>
                        <span className="font-headline bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                          AuraKode
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
