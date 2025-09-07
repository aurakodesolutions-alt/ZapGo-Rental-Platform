import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { footerLinks, socialLinks } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SiteFooter() {
    const year = new Date().getFullYear();
    const address =
        "Holding No. 100/C/32, Sarada Pally, Ghoghomali Main Road, Siliguri, Jalpaiguri – 734006 (WB)";
    const mapsHref = `https://www.google.com/maps?q=${encodeURIComponent(
        `ZapGo Rental, ${address}`
    )}`;

    return (
        <footer className="mt-auto border-t bg-card text-card-foreground">
            <div className="container px-4 py-12 sm:px-6 lg:px-8">
                {/* Top: Brand + Contact + Link sections */}
                <div className="grid gap-10 md:grid-cols-12">
                    {/* Brand + contact */}
                    <div className="md:col-span-4">
                        <Link href="/" className="flex items-center gap-2">
                            <Image
                                src="/logo.png"
                                alt="ZapGo Rental"
                                width={110}
                                height={32}
                                className={cn("select-none dark:invert")}
                                priority
                            />
                            <span className="font-headline text-xl font-bold">ZapGo Rental</span>
                        </Link>

                        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                            Electric scooter rentals for the modern commuter—affordable plans,
                            instant KYC, and transparent pricing.
                        </p>

                        <address className="mt-5 not-italic text-sm">
                            <div className="font-semibold">ZapGo Rental</div>
                            <div className="text-muted-foreground">{address}</div>
                            <div className="mt-2 flex flex-col gap-1">
                                <a
                                    className="w-fit text-primary underline underline-offset-4"
                                    href="mailto:support@zapgorental.com"
                                >
                                    support@zapgorental.com
                                </a>
                                <a
                                    className="w-fit text-primary underline underline-offset-4"
                                    href="tel:+916374580290"
                                >
                                    +91&nbsp;63745&nbsp;80290
                                </a>
                                <a
                                    className="w-fit text-primary underline underline-offset-4"
                                    href={mapsHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Get directions
                                </a>
                            </div>
                        </address>

                        <div className="mt-5 flex gap-2">
                            {socialLinks.map((link) => (
                                <Button
                                    key={link.name}
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                    className="rounded-full"
                                >
                                    <a
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={link.name}
                                        title={link.name}
                                        className="focus-visible:ring-2 focus-visible:ring-primary/40"
                                    >
                                        <link.icon className="h-5 w-5" />
                                        <span className="sr-only">{link.name}</span>
                                    </a>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Link sections */}
                    <nav
                        aria-label="Footer"
                        className="md:col-span-8 grid grid-cols-2 gap-8 sm:grid-cols-3"
                    >
                        {footerLinks.map((section) => (
                            <div key={section.title}>
                                <h3 className="font-headline text-sm font-semibold">{section.title}</h3>
                                <ul className="mt-4 space-y-2">
                                    {section.links.map((link) => (
                                        <li key={link.name}>
                                            <Link
                                                href={link.href}
                                                className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                            >
                                                {link.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Bottom: legal, credits */}
                <div className="mt-10 border-t pt-6">
                    <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
                        <p className="text-xs text-muted-foreground">
                            © {year} ZapGo Rental. All rights reserved.
                        </p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <Link
                                href="/privacy"
                                className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            >
                                Privacy
                            </Link>
                            <span aria-hidden>•</span>
                            <Link
                                href="/terms"
                                className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            >
                                Terms
                            </Link>
                            <span aria-hidden>•</span>
                            <a
                                href="/sitemap.xml"
                                className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            >
                                Sitemap
                            </a>
                        </div>

                        <div className="text-xs">
                            <span className="text-muted-foreground">Made with passion ✨ by </span>
                            <span className="font-headline bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AuraKode
              </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
