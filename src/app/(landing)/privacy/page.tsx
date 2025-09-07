'use client';

import {useMemo} from 'react';
import Link from 'next/link';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {
    ShieldCheck,
    IdCard,
    CreditCard,
    Server,
    Scale,
    Share2,
    Lock,
    Baby,
    RefreshCw,
    Mail,
    ChevronRight,
} from 'lucide-react';

/** small helpers */
function Section({
                     id,
                     title,
                     icon,
                     children,
                 }: {
    id: string;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <Card id={id} className="rounded-2xl border bg-card/60 backdrop-blur">
            <CardHeader className="flex flex-row items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {icon}
                </div>
                <div>
                    <CardTitle className="font-headline text-xl">{title}</CardTitle>
                    <CardDescription>
                        <Link href={`#${id}`} className="text-xs text-muted-foreground hover:text-primary">
                            #{id}
                        </Link>
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="prose prose-zinc dark:prose-invert max-w-none">{children}</CardContent>
        </Card>
    );
}

export default function PrivacyPage() {
    const lastUpdated = useMemo(() => new Date().toLocaleDateString(), []);

    const toc = [
        {id: 'data-we-collect', label: '1. Data We Collect'},
        {id: 'why-we-use', label: '2. Why We Use Your Data'},
        {id: 'legal-bases', label: '3. Legal Bases'},
        {id: 'sharing', label: '4. Sharing'},
        {id: 'retention', label: '5. Data Retention'},
        {id: 'your-rights', label: '6. Your Rights'},
        {id: 'security', label: '7. Security'},
        {id: 'children', label: '8. Children'},
        {id: 'changes', label: '9. Changes'},
        {id: 'contact', label: '10. Contact'},
    ];

    return (
        <div className="container mx-auto px-4 py-10">
            {/* Hero */}
            <div
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-secondary via-secondary/90 to-primary shadow-lg ring-1 ring-white/10">
                {/* stronger scrim for contrast */}
                <div className="absolute inset-0 bg-black/25"/>

                {/* content */}
                <div className="relative mx-auto max-w-3xl px-6 py-10 md:px-12 md:py-14 text-white">
    <span className="inline-flex items-center gap-2 self-start rounded-xl bg-white/15 px-3 py-1 text-xs font-medium">
      Policy
    </span>

                    <h1
                        className="mt-3 font-headline text-3xl md:text-4xl font-bold tracking-tight leading-tight text-white"
                        style={{textWrap: 'balance'}}
                    >
                        Privacy Policy
                    </h1>

                    <p className="mt-2 text-sm md:text-base/7 text-white/90">
                        ZapGo Rental (“we”, “us”, “our”) respects your privacy. This policy explains what we collect,
                        how we use it, and your choices. It applies to our website, booking flows, and rider dashboard.
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-xs md:text-sm text-white/80">
                        <svg className="h-4 w-4 opacity-90" viewBox="0 0 24 24" fill="none">
                            <path d="M12 3l7 4v6c0 5-3.5 7.5-7 8-3.5-.5-7-3-7-8V7l7-4z" stroke="currentColor"
                                  strokeWidth="1.5"/>
                        </svg>
                        <span>Last updated: {lastUpdated}</span>
                    </div>
                </div>
            </div>


            <div className="mt-8 grid gap-6 lg:grid-cols-12">
                {/* TOC (desktop) */}
                <aside className="lg:col-span-3">
                    <Card className="sticky top-24 hidden rounded-2xl border lg:block">
                        <CardHeader>
                            <CardTitle className="text-base">On this page</CardTitle>
                            <CardDescription>Quick navigation</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            {toc.map((t) => (
                                <Link
                                    key={t.id}
                                    href={`#${t.id}`}
                                    className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    {t.label}
                                    <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100"/>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </aside>

                {/* Content */}
                <div className="lg:col-span-9 space-y-6">
                    <Section id="data-we-collect" title="Data We Collect" icon={<IdCard className="h-5 w-5"/>}>
                        <ul>
                            <li>
                                <strong>Account &amp; KYC:</strong> name, phone, email, password hash, Aadhaar/PAN/DL
                                numbers and
                                document images (when you upload).
                            </li>
                            <li>
                                <strong>Booking &amp; Usage:</strong> selected vehicle/plan, rental dates, pricing,
                                servicing/return info.
                            </li>
                            <li>
                                <strong>Payments:</strong> amounts, payment method, gateway references (e.g., Cashfree
                                order/payment IDs).
                            </li>
                            <li>
                                <strong>Device/Logs:</strong> IP, browser data, pages viewed for security and analytics.
                            </li>
                        </ul>
                    </Section>

                    <Section id="why-we-use" title="Why We Use Your Data" icon={<Server className="h-5 w-5"/>}>
                        <ul>
                            <li>Provide bookings, manage rentals/returns, and support you.</li>
                            <li>Process payments and detect/prevent fraud.</li>
                            <li>Verify identity and comply with law.</li>
                            <li>Improve our products, safety, and customer experience.</li>
                        </ul>
                    </Section>

                    <Section id="legal-bases" title="Legal Bases" icon={<Scale className="h-5 w-5"/>}>
                        <p>
                            We rely on <strong>consent</strong>, <strong>contract performance</strong>,{' '}
                            <strong>legitimate interests</strong> (security/analytics), and <strong>legal
                            obligations</strong>{' '}
                            (KYC/records), depending on the processing context.
                        </p>
                    </Section>

                    <Section id="sharing" title="Sharing" icon={<Share2 className="h-5 w-5"/>}>
                        <ul>
                            <li>
                                <strong>Processors:</strong> payment gateways (e.g., Cashfree), hosting, storage,
                                email/SMS providers.
                            </li>
                            <li>
                                <strong>Legal/Safety:</strong> we may share info with law enforcement or to defend our
                                rights.
                            </li>
                            <li>We do <em>not</em> sell personal data.</li>
                        </ul>
                    </Section>

                    <Section id="retention" title="Data Retention" icon={<RefreshCw className="h-5 w-5"/>}>
                        <p>
                            We retain data only as long as needed for the purposes above and to satisfy legal, tax, and
                            audit
                            requirements. We then delete or anonymize it safely.
                        </p>
                    </Section>

                    <Section id="your-rights" title="Your Rights" icon={<CreditCard className="h-5 w-5"/>}>
                        <ul>
                            <li>Access, correction, deletion (where applicable), and withdrawal of consent.</li>
                            <li>
                                To exercise, email{' '}
                                <Link className="text-primary underline underline-offset-2"
                                      href="mailto:support@zapgorental.com">
                                    support@zapgorental.com
                                </Link>
                                .
                            </li>
                        </ul>
                    </Section>

                    <Section id="security" title="Security" icon={<Lock className="h-5 w-5"/>}>
                        <p>
                            We use reasonable technical and organizational measures (encryption in transit, credential
                            hashing, access
                            controls). No method is 100% secure; please keep your credentials safe.
                        </p>
                    </Section>

                    <Section id="children" title="Children" icon={<Baby className="h-5 w-5"/>}>
                        <p>
                            The service is not intended for children under 18. Do not provide KYC or payment info for
                            minors.
                        </p>
                    </Section>

                    <Section id="changes" title="Changes" icon={<RefreshCw className="h-5 w-5"/>}>
                        <p>We’ll update this page and adjust the “Last updated” date when the policy changes.</p>
                    </Section>

                    <Section id="contact" title="Contact" icon={<Mail className="h-5 w-5"/>}>
                        <p>
                            <strong>ZapGo Rental</strong>
                            <br/>
                            Holding No. 100/C/32, Sarada Pally, Ghoghomali Main Road, Siliguri, Jalpaiguri – 734006 (WB)
                            <br/>
                            Email:{' '}
                            <Link className="text-primary underline underline-offset-2"
                                  href="mailto:support@zapgorental.com">
                                support@zapgorental.com
                            </Link>
                        </p>
                    </Section>

                    {/* FAQ / Extras */}
                    <Card className="rounded-2xl">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl">Frequently Asked</CardTitle>
                            <CardDescription>Quick clarifications about your data</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="a1">
                                    <AccordionTrigger>Do you store my card/UPI details?</AccordionTrigger>
                                    <AccordionContent>
                                        We do not store sensitive card/UPI credentials. Payments are handled by
                                        PCI-compliant gateways (e.g.,
                                        Cashfree). We store payment references (order IDs, status) to reconcile rentals.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="a2">
                                    <AccordionTrigger>Can I delete my account?</AccordionTrigger>
                                    <AccordionContent>
                                        Yes. Email us from your registered email. We’ll delete or anonymize data unless
                                        retention is required
                                        by law (for example, invoices and KYC tied to paid rentals).
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    {/* CTA */}
                    <div className="rounded-2xl border bg-muted/40 p-5 sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="font-headline text-xl">Questions about this policy?</h3>
                                <p className="text-sm text-muted-foreground">
                                    We’re happy to help you understand how we protect your data.
                                </p>
                            </div>
                            <Link
                                href="/contact-us"
                                className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
                            >
                                Contact Support
                            </Link>
                        </div>
                    </div>

                    <Separator className="my-2"/>
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} ZapGo Rental. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
