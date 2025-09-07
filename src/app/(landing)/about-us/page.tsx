'use client';

import Link from 'next/link';
import {
    Badge,
} from '@/components/ui/badge';
import {
    Button,
} from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import {
    ShieldCheck,
    Zap,
    IndianRupee,
    Leaf,
    Briefcase,
    Users,
    MapPinned,
    Mail,
    Phone,
} from 'lucide-react';

const team = [
    { name: 'Rohan Sharma', role: 'Founder & CEO', image: 'https://picsum.photos/200/200?u=rohan' },
    { name: 'Priya Singh', role: 'Head of Operations', image: 'https://picsum.photos/200/200?u=priya' },
    { name: 'Amit Patel', role: 'CTO', image: 'https://picsum.photos/200/200?u=amit' },
    { name: 'Sneha Gupta', role: 'Head of CX', image: 'https://picsum.photos/200/200?u=sneha' },
];

const faqItems = [
    {
        q: 'What do I need to rent a scooter?',
        a: 'Valid driver’s license, Aadhaar/Passport (ID), age 18+. Complete KYC online from your dashboard.',
    },
    {
        q: 'What is included in the rental price?',
        a: 'Scooter, helmet, third-party insurance, and regular maintenance. No hidden fees—only pay for electricity.',
    },
    {
        q: 'Can I extend my rental period?',
        a: 'Yes. Rider Dashboard → Rentals → Extend. Updated charges are shown before you confirm.',
    },
    {
        q: 'What if the scooter breaks down?',
        a: '24/7 assistance. Request help in the app—we’ll repair on-site or arrange a replacement.',
    },
    {
        q: 'Are the scooters insured?',
        a: 'All rides include third-party liability. Optional add-ons (e.g., personal accident cover) are available.',
    },
    {
        q: 'Where can I charge my scooter?',
        a: 'Use the included BIS-certified charger at any standard socket or visit our partner charging points.',
    },
];

export default function AboutPage() {
    const stats = [
        { label: 'Rides completed', value: '10k+' },
        { label: 'CO₂ saved', value: '25t+' },
        { label: 'Fleet size', value: '50+' },
    ];

    return (
        <div className="container mx-auto px-4 py-10">
            {/* HERO — consistent with FAQ header */}
            <section className="relative overflow-hidden rounded-3xl gradient-background noise-bg shadow-lg ring-1 ring-white/10">
                <div className="absolute inset-0 bg-black/10 dark:bg-black/15" />
                <div className="relative p-8 sm:p-12 text-primary-foreground">
                    <Badge className="rounded-xl bg-white/15 text-white">About</Badge>
                    <h1
                        className="mt-3 font-headline text-3xl sm:text-5xl font-bold tracking-tight leading-tight text-white"
                        style={{ textWrap: 'balance' }}
                    >
                        Electrifying urban mobility—made simple
                    </h1>
                    <p className="mt-3 max-w-2xl text-white/90 sm:text-lg">
                        We’re building India’s most rider-friendly EV rental platform—affordable plans, instant KYC,
                        and a fleet you can rely on.
                    </p>

                    {/* trust chips */}
                    <div className="mt-5 flex flex-wrap gap-2">
                        <Badge className="rounded-xl bg-white/15 text-white hover:bg-white/25">
                            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                            Secure &amp; insured
                        </Badge>
                        <Badge className="rounded-xl bg-white/15 text-white hover:bg-white/25">
                            <Zap className="mr-1.5 h-3.5 w-3.5" />
                            Instant KYC
                        </Badge>
                        <Badge className="rounded-xl bg-white/15 text-white hover:bg-white/25">
                            <IndianRupee className="mr-1.5 h-3.5 w-3.5" />
                            Transparent pricing
                        </Badge>
                    </div>

                    {/* stats strip */}
                    <div className="mt-6 grid max-w-xl grid-cols-3 gap-3 rounded-2xl border border-white/15 bg-black/10 p-4 backdrop-blur-md">
                        {stats.map((s) => (
                            <div key={s.label} className="text-center">
                                <div className="text-xl font-bold sm:text-2xl text-white">{s.value}</div>
                                <div className="text-xs text-white/85">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* INTRO + CONTACT (address/email show here) */}
            <section className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-6 px-4 lg:grid-cols-12">
                {/* Intro blurb */}
                <Card className="rounded-2xl lg:col-span-8">
                    <CardContent className="p-6 sm:p-8">
                        <CardTitle className="text-2xl font-bold">Who we are</CardTitle>
                        <p className="mt-3 text-muted-foreground sm:text-lg">
                            ZapGo Rental is on a mission to make city rides greener, simpler, and more affordable.
                            With rider-first design and transparent pricing, we help thousands move smarter every day.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                            <Badge variant="secondary" className="rounded-xl">
                                Rider-first policies
                            </Badge>
                            <Badge variant="secondary" className="rounded-xl">
                                BIS-certified chargers
                            </Badge>
                            <Badge variant="secondary" className="rounded-xl">
                                Reliable maintenance
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact card (sticky on desktop) */}
                <Card className="rounded-2xl lg:col-span-4 lg:sticky lg:top-24 h-fit">
                    <CardHeader>
                        <CardTitle>Get in touch</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-start gap-3">
                            <MapPinned className="mt-0.5 h-5 w-5 text-primary" />
                            <div className="text-sm">
                                <div className="font-medium">ZapGo Rental</div>
                                <div className="text-muted-foreground">
                                    Holding No. 100/C/32, Sarada Pally, Ghoghomali Main Road,<br />
                                    Siliguri, Jalpaiguri – 734006 (WB)
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-primary" />
                            <a className="text-primary underline" href="mailto:support@zapgorental.com">
                                support@zapgorental.com
                            </a>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-primary" />
                            <span className="text-sm text-muted-foreground">Mon–Sat, 10:00–19:00 IST</span>
                        </div>
                        <div className="pt-2 flex gap-2">
                            <Button asChild className="rounded-xl">
                                <Link href="/contact">Contact &amp; Map</Link>
                            </Button>
                            <Button asChild variant="outline" className="rounded-xl">
                                <Link href="/book">Book now</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* MISSION & VALUES */}
            <section className="py-16 sm:py-20">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Mission &amp; Values</h2>
                        <p className="mt-3 max-w-2xl mx-auto text-muted-foreground sm:text-lg">
                            Make cities greener, mobility simpler, and riding truly delightful.
                        </p>
                    </div>

                    <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
                        {[
                            {
                                icon: Leaf,
                                title: 'Sustainability',
                                desc: 'Every ride cuts emissions. We invest in clean energy ops and safe charging.',
                            },
                            {
                                icon: Briefcase,
                                title: 'Reliability',
                                desc: 'Meticulously maintained fleet, proactive checks, BIS-certified chargers.',
                            },
                            {
                                icon: Users,
                                title: 'Community',
                                desc: 'Perks, partner offers, and a rider community built around you.',
                            },
                        ].map((v) => (
                            <Card key={v.title} className="rounded-2xl border bg-secondary/5 shadow-sm transition hover:shadow-md">
                                <CardContent className="p-8 text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <v.icon className="h-8 w-8" />
                                    </div>
                                    <h3 className="mt-5 text-xl font-bold">{v.title}</h3>
                                    <p className="mt-2 text-muted-foreground">{v.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* TEAM */}
            <section className="py-16 sm:py-20 bg-muted/30 dark:bg-muted/20">
                <div className="container mx-auto max-w-6xl px-4">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Meet the Team</h2>
                        <p className="mt-3 max-w-2xl mx-auto text-muted-foreground sm:text-lg">
                            A small team with a big mission.
                        </p>
                    </div>

                    <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
                        {team.map((m) => (
                            <Card
                                key={m.name}
                                className="group rounded-2xl border bg-card/80 backdrop-blur transition hover:shadow-lg"
                            >
                                <CardContent className="p-6 text-center">
                                    <Avatar className="mx-auto h-24 w-24 ring-2 ring-primary/20 transition group-hover:ring-primary/40">
                                        <AvatarImage src={m.image} alt={m.name} />
                                        <AvatarFallback>{m.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="mt-4 font-semibold">{m.name}</div>
                                    <div className="text-sm text-primary">{m.role}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="mt-10 pb-20">
                <div className="container mx-auto max-w-6xl px-4">
                    <div className="rounded-3xl border bg-card p-10 shadow-lg sm:p-12">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to ride?</h2>
                            <p className="mt-3 max-w-2xl mx-auto text-muted-foreground sm:text-lg">
                                Join thousands of riders choosing a cleaner commute.
                            </p>
                            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                <Button size="lg" asChild className="rounded-xl">
                                    <Link href="/book">Book your EV now</Link>
                                </Button>
                                <Button size="lg" variant="outline" asChild className="rounded-xl">
                                    <Link href="/vehicles">Browse vehicles</Link>
                                </Button>
                            </div>
                            <Separator className="my-8" />
                            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Insured rides
                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" /> Instant KYC
                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5" /> Transparent pricing
                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Page JSON-LD (About + breadcrumbs) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'AboutPage',
                        name: 'About ZapGo Rental',
                        url: '/about',
                    }),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                            { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
                            { '@type': 'ListItem', position: 2, name: 'About', item: '/about' },
                        ],
                    }),
                }}
            />
        </div>
    );
}
