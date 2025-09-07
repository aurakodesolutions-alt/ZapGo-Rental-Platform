'use client';

import { ContactForm } from '@/components/contact-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Mail, MapPinned, Phone, MessageSquare, ShieldCheck, Zap, IndianRupee } from 'lucide-react';

export default function ContactPage() {
    // --- Single source of truth for address/contact ---
    const businessName = 'ZapGo Rental';
    const streetAddress =
        'Holding No. 100/C/32, Sarada Pally, Ghoghomali Main Road, Siliguri, Jalpaiguri – 734006 (WB)';
    const email = 'roy777229@gmail.com';
    const phone = '+91-6374580290'; // also used for WhatsApp
    const phoneTel = '+916374580290'; // tel-friendly
    const whatsappLink = `https://wa.me/${phoneTel.replace('+', '')}`;

    const mapQuery = `${businessName}, ${streetAddress}`;
    const mapEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;
    const mapsDirections = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`;

    return (
        <div className="container mx-auto px-4 py-10">
            {/* HERO — consistent rounded gradient banner */}
            <section className="relative overflow-hidden rounded-3xl gradient-background noise-bg shadow-lg ring-1 ring-white/10">
                <div className="absolute inset-0 bg-black/10 dark:bg-black/15" />
                <div className="relative p-8 sm:p-12 text-primary-foreground">
                    <Badge className="rounded-xl bg-white/15 text-white">Contact</Badge>
                    <h1
                        className="mt-3 font-headline text-3xl sm:text-5xl font-bold tracking-tight leading-tight text-white"
                        style={{ textWrap: 'balance' }}
                    >
                        We’re here to help
                    </h1>
                    <p className="mt-3 max-w-2xl text-white/90 sm:text-lg">
                        Questions about bookings, documents, returns, or pricing? Reach us anytime—our team will get back promptly.
                    </p>

                    {/* trust chips, mirroring About/FAQ tone */}
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
                </div>
            </section>

            {/* BODY */}
            <section className="py-16 sm:py-20">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
                        {/* LEFT: Contact Form */}
                        <div className="lg:col-span-3">
                            <Card className="rounded-2xl h-full shadow-lg">
                                <CardHeader>
                                    <CardTitle>Send us a message</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ContactForm />
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT: Contact Details + Map (sticky on desktop) */}
                        <div className="lg:col-span-2">
                            <div
                                className="space-y-8 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-auto lg:pr-1"
                                style={{ scrollbarGutter: 'stable both-edges' }}
                            >
                            <Card className="rounded-2xl shadow-lg">
                                <CardHeader>
                                    <CardTitle>Get in touch</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <MapPinned className="mt-0.5 h-5 w-5 text-primary" />
                                        <div className="text-sm">
                                            <div className="font-medium">{businessName}</div>
                                            <div className="text-muted-foreground">{streetAddress}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5 text-primary" />
                                        <a className="text-primary underline" href={`mailto:${email}`}>
                                            {email}
                                        </a>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-primary" />
                                        <a className="text-primary underline" href={`tel:${phoneTel}`}>
                                            {phone}
                                        </a>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <MessageSquare className="h-5 w-5 text-primary" />
                                        <a className="text-primary underline" href={whatsappLink} target="_blank" rel="noopener noreferrer">
                                            WhatsApp us
                                        </a>
                                    </div>

                                    <Separator className="my-2" />
                                    <div className="text-xs text-muted-foreground">Hours: Mon–Sat, 10:00–19:00 IST</div>

                                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                        <Button asChild className="rounded-xl w-full sm:w-auto">
                                            <a href={mapsDirections} target="_blank" rel="noopener noreferrer">
                                                Get directions
                                            </a>
                                        </Button>
                                        <Button variant="outline" asChild className="rounded-xl w-full sm:w-auto">
                                            <a href={`tel:${phoneTel}`}>Call us</a>
                                        </Button>
                                        <Button variant="outline" asChild className="rounded-xl w-full sm:w-auto">
                                            <a href={`mailto:${email}`}>Email us</a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPinned className="text-primary" />
                                        Find us on Maps
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="aspect-video w-full rounded-xl overflow-hidden border">
                                        <iframe
                                            title="ZapGo Rental Location"
                                            width="100%"
                                            height="100%"
                                            loading="lazy"
                                            allowFullScreen
                                            referrerPolicy="no-referrer-when-downgrade"
                                            src={mapEmbedSrc}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* LocalBusiness JSON-LD for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'LocalBusiness',
                        name: businessName,
                        email,
                        telephone: phone,
                        address: {
                            '@type': 'PostalAddress',
                            streetAddress:
                                'Holding No. 100/C/32, Sarada Pally, Ghoghomali Main Road',
                            addressLocality: 'Siliguri',
                            addressRegion: 'West Bengal',
                            postalCode: '734006',
                            addressCountry: 'IN',
                        },
                        url: '/contact',
                    }),
                }}
            />
        </div>
    );
}
