"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Redo2,
    CalendarClock,
    ShieldCheck,
    FileText,
    Wallet,
    AlertTriangle,
    Truck,
    Scale,
    HelpCircle,
    Mail,
    ChevronRight,
    CheckCircle2,
} from "lucide-react";

/** small helpers (same pattern as privacy page) */
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
            <CardContent className="prose prose-zinc dark:prose-invert max-w-none">
                {children}
            </CardContent>
        </Card>
    );
}

export default function RefundPolicyPage() {
    const lastUpdated = useMemo(() => new Date().toLocaleDateString(), []);

    const toc = [
        { id: "summary", label: "1. Summary" },
        { id: "scope", label: "2. Scope & Definitions" },
        { id: "cancellations", label: "3. Cancellations & No-Shows" },
        { id: "during-rental", label: "4. Changes During an Active Rental" },
        { id: "deposits", label: "5. Deposits & Deductions" },
        { id: "processing", label: "6. How Refunds Are Processed" },
        { id: "exceptions", label: "7. Exceptions & Special Cases" },
        { id: "legal", label: "8. Legal & Contracted Clients" },
        { id: "contact", label: "9. Contact" },
    ];

    return (
        <div className="container mx-auto px-4 py-10">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-secondary via-secondary/90 to-primary shadow-lg ring-1 ring-white/10">
                <div className="absolute inset-0 bg-black/25" />
                <div className="relative mx-auto max-w-3xl px-6 py-10 md:px-12 md:py-14 text-white">
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-1 text-xs font-medium">
            <Redo2 className="h-3.5 w-3.5" />
            Refund Policy
          </span>
                    <h1
                        className="mt-3 font-headline text-3xl md:text-4xl font-bold tracking-tight leading-tight text-white"
                        style={{ textWrap: "balance" }}
                    >
                        Refund & Cancellation Policy
                    </h1>
                    <p className="mt-2 text-sm md:text-base/7 text-white/90">
                        This policy explains when refunds are applicable, timelines, and how we handle deposits and adjustments for bookings on our website and rider flows.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs md:text-sm text-white/80">
                        <CalendarClock className="h-4 w-4 opacity-90" />
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
                                    <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </aside>

                {/* Content */}
                <div className="lg:col-span-9 space-y-6">
                    <Section id="summary" title="Summary (Quick View)" icon={<CheckCircle2 className="h-5 w-5" />}>
                        <ul className="not-prose grid gap-2">
                            <li><Badge variant="secondary">Before Start</Badge> Full refund of rental fee on cancellations made ≥24 hours before start time. Gateway charges (if any) are non-refundable.</li>
                            <li><Badge variant="secondary">No-Show</Badge> No-show or cancellation &lt;24 hours: first day’s rent may be retained.</li>
                            <li><Badge variant="secondary">During Rental</Badge> Early closure is allowed; charges already accrued (rent/fees/damages) are deducted, remainder of deposit is refunded.</li>
                            <li><Badge variant="secondary">Timeline</Badge> Approved refunds are issued within 5–7 business days to the original payment method.</li>
                        </ul>
                    </Section>

                    <Section id="scope" title="Scope & Definitions" icon={<FileText className="h-5 w-5" />}>
                        <p>
                            This policy applies to bookings and payments made on <strong>zapgorental.in</strong> and our official booking flows. “Deposit” means any refundable security collected at booking or handover; “Rental fee” includes base rent and applicable taxes; “Deductions” include payable rent, late fees, fines, or repair costs as per inspection.
                        </p>
                    </Section>

                    <Section id="cancellations" title="Cancellations & No-Shows" icon={<Truck className="h-5 w-5" />}>
                        <ul>
                            <li><strong>≥24 hours before start:</strong> 100% rental fee refunded. Payment gateway charges (if levied by the processor) and convenience fees are not refundable.</li>
                            <li><strong>&lt;24 hours before start:</strong> We may retain the first day’s rent. Any deposit (if collected in advance online) is refunded in full.</li>
                            <li><strong>No-Show:</strong> Treated as same-day cancellation—first day’s rent may be retained; deposit (if any) is refunded.</li>
                        </ul>
                    </Section>

                    <Section id="during-rental" title="Changes During an Active Rental" icon={<CalendarClock className="h-5 w-5" />}>
                        <ul>
                            <li><strong>Early end:</strong> You can end the rental early by returning the vehicle at an authorized location and completing return inspection. Unused days are not charged; all dues until return (rent, late fees, damage/cleaning, penalties) are deducted from the deposit or balance.</li>
                            <li><strong>Upgrades/plan changes:</strong> Any difference in fee is adjusted at return or charged before release of the vehicle, as applicable.</li>
                        </ul>
                    </Section>

                    <Section id="deposits" title="Deposits & Deductions" icon={<ShieldCheck className="h-5 w-5" />}>
                        <p>
                            Refundable security deposits (when applicable) are adjusted against outstanding amounts at return—rent till date, late fees, missing accessories, cleaning/damage, traffic fines, and other authorized charges supported by the inspection report and tax invoices. Any remainder is refunded to the original payer.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            For corporate or contracted clients, deposit handling and set-off follow the signed Leave & License/Service Agreement, which typically allows security deposits to be adjusted against periodic licence/rental fees and requires maintaining a minimum balance; early termination may attract a short-period fee as per contract.
                        </p>
                    </Section>

                    <Section id="processing" title="How Refunds Are Processed" icon={<Wallet className="h-5 w-5" />}>
                        <ul>
                            <li><strong>Method:</strong> Refunds go to the original payment method. Cash/UPI settlements are refunded via bank transfer.</li>
                            <li><strong>Timeline:</strong> 5–7 business days after approval. Banks/wallets may take additional time to reflect the credit.</li>
                            <li><strong>Proof:</strong> You’ll receive a confirmation email/SMS with reference IDs once the refund is initiated.</li>
                        </ul>
                    </Section>

                    <Section id="exceptions" title="Exceptions & Special Cases" icon={<AlertTriangle className="h-5 w-5" />}>
                        <ul>
                            <li><strong>Damage/Missing items:</strong> Assessed at return. Estimates/invoices are shared; corresponding amounts are adjusted before refund.</li>
                            <li><strong>Fraud/chargebacks:</strong> If a payment is flagged or disputed by your issuer, refunds are paused until the investigation resolves.</li>
                            <li><strong>Taxes & fees:</strong> Government taxes already paid and gateway convenience fees are generally non-refundable unless mandated by law or the processor.</li>
                        </ul>
                    </Section>

                    <Section id="legal" title="Legal & Contracted Clients" icon={<Scale className="h-5 w-5" />}>
                        <p>
                            If you have a separate written agreement with ZapGo (fleet/enterprise/aggregator), the terms in your agreement prevail for deposits, notice periods, early termination and fee adjustments. For example, security deposits and monthly licence fees may be adjusted/renewed as set out in the contract; early termination may attract a short-period fee.
                        </p>
                    </Section>

                    <Section id="contact" title="Need Help with a Refund?" icon={<Mail className="h-5 w-5" />}>
                        <p>
                            Email <Link href="mailto:support@zapgorental.com" className="text-primary underline underline-offset-2">support@zapgorental.com</Link>{" "}
                            from your registered email with subject “Refund Request – [Booking ID]”. Include the booking ID, payment proof, and reason. Our team will review and respond within 2 business days.
                        </p>

                        <Card className="mt-4 rounded-xl border bg-muted/40">
                            <CardContent className="py-4 text-sm">
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="font-medium">Checklist for faster refunds</div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary">Booking ID</Badge>
                                        <Badge variant="secondary">Payment Ref</Badge>
                                        <Badge variant="secondary">Bank/UPI details (for cash)</Badge>
                                        <Badge variant="secondary">Inspection report (if any)</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Section>

                    {/* FAQ */}
                    <Card className="rounded-2xl">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl">Frequently Asked</CardTitle>
                            <CardDescription>Common refund scenarios</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="f1">
                                    <AccordionTrigger>Can I reschedule instead of cancelling?</AccordionTrigger>
                                    <AccordionContent>
                                        Yes—subject to availability and pricing differences. If you then cancel the rescheduled booking, the cancellation window is recalculated from the new start time.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="f2">
                                    <AccordionTrigger>How are damages calculated?</AccordionTrigger>
                                    <AccordionContent>
                                        Based on authorized service centre estimates and invoices. We share copies for transparency and adjust only the proven amount.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="f3">
                                    <AccordionTrigger>My bank shows “refund completed” but I don’t see money.</AccordionTrigger>
                                    <AccordionContent>
                                        Some issuers take 2–3 business days to post the credit. If delayed further, share your ARN/UTR with your bank and CC us for trace.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    {/* CTA */}
                    <div className="rounded-2xl border bg-muted/40 p-5 sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="font-headline text-xl">Still need help?</h3>
                                <p className="text-sm text-muted-foreground">
                                    Our support team is happy to guide you through the refund steps.
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

                    <Separator className="my-2" />
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} ZapGo Rental. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
