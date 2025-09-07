'use client';

import {useMemo} from 'react';
import Link from 'next/link';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    FileCheck2,
    Scale,
    CalendarCheck2,
    Wallet,
    Car,
    Wrench,
    ShieldAlert,
    Clock,
    Undo2,
    UserCheck,
    Gavel,
    MapPin,
    Mail,
    ChevronRight,
} from 'lucide-react';

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

export default function TermsPage() {
    const lastUpdated = useMemo(() => new Date().toLocaleDateString(), []);

    const toc = [
        {id: 'definitions', label: '1. Definitions'},
        {id: 'eligibility', label: '2. Eligibility & KYC'},
        {id: 'booking', label: '3. Booking & Payments'},
        {id: 'security-deposit', label: '4. Security Deposit'},
        {id: 'vehicle-use', label: '5. Vehicle Use & Care'},
        {id: 'maintenance', label: '6. Maintenance & Service'},
        {id: 'damage', label: '7. Damage, Theft & Liability'},
        {id: 'extensions', label: '8. Extensions & Late Return'},
        {id: 'cancellation', label: '9. Cancellation & Refunds'},
        {id: 'privacy', label: '10. Privacy & Data'},
        {id: 'insurance', label: '11. Insurance'},
        {id: 'termination', label: '12. Termination'},
        {id: 'disputes', label: '13. Governing Law & Disputes'},
        {id: 'contact', label: '14. Contact'},
    ];

    return (
        <div className="container mx-auto px-4 py-10">
            {/* Hero */}
            <div
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-secondary via-secondary/90 to-primary shadow-lg ring-1 ring-white/10 noise-bg">
                {/* stronger scrim for contrast */}
                <div className="absolute inset-0 bg-black/25" aria-hidden/>

                {/* content */}
                <div className="relative p-8 sm:p-10 lg:p-14 text-white">
                    <Badge className="rounded-xl bg-white/15 text-white">
                        Legal
                    </Badge>

                    <h1
                        className="mt-3 font-headline text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-white"
                        style={{textWrap: 'balance'}}
                    >
                        Terms &amp; Conditions
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm/6 sm:text-base/7 text-white/90">
                        These Terms govern your use of ZapGo Rental services, including bookings, rentals, and payments.
                        Please read them carefully; by using our platform, you agree to these Terms.
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-white/80">
                        <FileCheck2 className="h-4 w-4"/>
                        <span>Last updated: {lastUpdated}</span>
                    </div>
                </div>
            </div>


            {/* Highlights */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-primary"/> Simple KYC
                        </CardTitle>
                        <CardDescription>Upload Aadhaar/PAN/DL securely</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Identity verification helps protect riders and assets.
                    </CardContent>
                </Card>

                <Card className="rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <CalendarCheck2 className="h-4 w-4 text-primary"/> Flexible Plans
                        </CardTitle>
                        <CardDescription>Extend or return with notice</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Manage your rental dates from your dashboard.
                    </CardContent>
                </Card>

                <Card className="rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-primary"/> Transparent Billing
                        </CardTitle>
                        <CardDescription>No hidden charges</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        See payable, paid, and balance in real time.
                    </CardContent>
                </Card>
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
                    <Section id="definitions" title="Definitions" icon={<Scale className="h-5 w-5"/>}>
                        <ul>
                            <li><strong>“Rider”</strong> means a registered user who rents a vehicle.</li>
                            <li><strong>“Vehicle”</strong> means any two-wheeler offered by ZapGo Rental.</li>
                            <li><strong>“Plan”</strong> means the pricing model (joining fee, security deposit, rent per
                                day, etc.).
                            </li>
                            <li><strong>“Platform”</strong> means our website and rider dashboard.</li>
                        </ul>
                    </Section>

                    <Section id="eligibility" title="Eligibility & KYC" icon={<UserCheck className="h-5 w-5"/>}>
                        <ul>
                            <li>Riders must be 18+ and legally eligible to ride.</li>
                            <li>Valid KYC (Aadhaar/PAN/DL) may be required before pickup/activation.</li>
                            <li>We may verify documents and decline or terminate service for mismatch/fraud.</li>
                        </ul>
                    </Section>

                    <Section id="booking" title="Booking & Payments" icon={<Wallet className="h-5 w-5"/>}>
                        <ul>
                            <li>By confirming a booking, you agree to the selected Plan and rental dates.</li>
                            <li>Payments are processed through trusted gateways (e.g., Cashfree). We store payment
                                references, not your card/UPI credentials.
                            </li>
                            <li>Taxes, fees, and deposits (if any) are displayed during checkout.</li>
                            <li>Unpaid balances must be cleared as per the Plan’s schedule.</li>
                        </ul>
                    </Section>

                    <Section id="security-deposit" title="Security Deposit" icon={<ShieldAlert className="h-5 w-5"/>}>
                        <p>
                            If your Plan includes a security deposit, it is refundable subject to inspection and
                            adjustments for
                            damages, penalties, or outstanding balances. Refund timelines depend on banking partners and
                            completion of checks.
                        </p>
                    </Section>

                    <Section id="vehicle-use" title="Vehicle Use & Care" icon={<Car className="h-5 w-5"/>}>
                        <ul>
                            <li>Use the Vehicle responsibly and only for lawful purposes.</li>
                            <li>No unauthorized riders; comply with traffic laws and safety norms.</li>
                            <li>Do not modify or tamper with parts, batteries, or telematics (if any).</li>
                            <li>You are responsible for fines, tolls, and violations during your rental.</li>
                        </ul>
                    </Section>

                    <Section id="maintenance" title="Maintenance & Service" icon={<Wrench className="h-5 w-5"/>}>
                        <ul>
                            <li>Routine service is scheduled by ZapGo; report issues promptly via support.</li>
                            <li>Repairs due to misuse/accident may be charged to the Rider per assessment.</li>
                        </ul>
                    </Section>

                    <Section id="damage" title="Damage, Theft & Liability" icon={<ShieldAlert className="h-5 w-5"/>}>
                        <ul>
                            <li>Notify us immediately for any accident, damage, or theft. File police reports where
                                required.
                            </li>
                            <li>Rider is liable for damages, excesses, and losses not covered by insurance or caused by
                                breach of Terms.
                            </li>
                        </ul>
                    </Section>

                    <Section id="extensions" title="Extensions & Late Return" icon={<Clock className="h-5 w-5"/>}>
                        <ul>
                            <li>Request extensions from your dashboard before the end date; approval depends on
                                availability.
                            </li>
                            <li>Late returns may attract per-day charges per your Plan and local policy.</li>
                        </ul>
                    </Section>

                    <Section id="cancellation" title="Cancellation & Refunds" icon={<Undo2 className="h-5 w-5"/>}>
                        <ul>
                            <li>Pre-pickup cancellations and refunds follow the Plan’s rules shown during booking.</li>
                            <li>After pickup/activation, charges are prorated as per usage and Plan policy.</li>
                        </ul>
                    </Section>

                    <Section id="privacy" title="Privacy & Data" icon={<FileCheck2 className="h-5 w-5"/>}>
                        <p>
                            Your data is processed under our <Link href="/legal/privacy"
                                                                   className="text-primary underline underline-offset-2">Privacy
                            Policy</Link>.
                            By using our services, you consent to the processing necessary to provide rentals, payments,
                            KYC, and support.
                        </p>
                    </Section>

                    <Section id="insurance" title="Insurance" icon={<ShieldAlert className="h-5 w-5"/>}>
                        <p>
                            If insurance applies, coverage and exclusions are per the insurer’s terms. Riders must
                            comply with
                            claim procedures. Non-compliance or prohibited use may forfeit benefits.
                        </p>
                    </Section>

                    <Section id="termination" title="Termination" icon={<Gavel className="h-5 w-5"/>}>
                        <p>
                            We may suspend or terminate rentals for breach, non-payment, unsafe usage, fraud, or as
                            required by law.
                            Outstanding dues remain payable upon termination.
                        </p>
                    </Section>

                    <Section id="disputes" title="Governing Law & Disputes" icon={<Scale className="h-5 w-5"/>}>
                        <p>
                            These Terms are governed by the laws of India. Courts having jurisdiction over Siliguri,
                            West Bengal shall
                            have exclusive jurisdiction, subject to any applicable arbitration clause agreed in writing.
                        </p>
                    </Section>

                    <Section id="contact" title="Contact" icon={<MapPin className="h-5 w-5"/>}>
                        <p>
                            <strong>ZapGo Rental</strong>
                            <br/>
                            Holding No. 100/C/32, Sarada Pally, Ghoghomali Main Road, Siliguri, Jalpaiguri – 734006 (WB)<br/>
                            Email:{' '}
                            <Link className="text-primary underline underline-offset-2"
                                  href="mailto:support@zapgorental.com">
                                support@zapgorental.com
                            </Link>
                        </p>
                    </Section>

                    {/* FAQs / helpful notes */}
                    <Card className="rounded-2xl">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl">Common Questions</CardTitle>
                            <CardDescription>Quick clarifications on rentals</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="q1">
                                    <AccordionTrigger>Can I transfer my booking to someone else?</AccordionTrigger>
                                    <AccordionContent>
                                        Bookings are non-transferable unless expressly approved by ZapGo after fresh KYC
                                        and eligibility checks.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="q2">
                                    <AccordionTrigger>When do I get my deposit back?</AccordionTrigger>
                                    <AccordionContent>
                                        After return and inspection, minus any deductions for dues or damages. Banking
                                        timelines may apply.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
