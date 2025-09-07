"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Search,
    MessageCircleQuestion,
    HelpCircle,
    Check,
    X,
    MapPinned,
    Mail,
    Phone,
} from "lucide-react";

type Faq = {
    id: string;
    q: string;
    a: React.ReactNode;
    aText: string; // used for search
    category: "Booking" | "Payments" | "KYC & Eligibility" | "Rentals & Returns" | "Pricing & Deposit" | "Issues & Support";
};

const FAQS: Faq[] = [
    {
        id: "how-to-book",
        q: "How do I book a scooter?",
        category: "Booking",
        a: (
            <>
                <p>
                    Pick a plan and vehicle on the{" "}
                    <Link href="/book" className="text-primary underline">
                        Book Now
                    </Link>{" "}
                    page, choose your dates, and complete the payment. You’ll be redirected back to ZapGo and your booking will be confirmed automatically.
                </p>
                <ul className="list-disc pl-5 mt-2">
                    <li>We’ll email your booking receipt and show it in your dashboard.</li>
                    <li>You can also see it under <em>Rider → Rentals</em>.</li>
                </ul>
            </>
        ),
        aText:
            "Pick a plan and vehicle on Book Now, choose dates, pay, redirected back to ZapGo, booking confirmed, receipt emailed, view under rider rentals.",
    },
    {
        id: "documents-required",
        q: "What documents do I need?",
        category: "KYC & Eligibility",
        a: (
            <ul className="list-disc pl-5">
                <li>Valid government ID (Aadhaar / Passport)</li>
                <li>PAN (for billing/tax)</li>
                <li>Valid Driving Licence (for riding on public roads)</li>
            </ul>
        ),
        aText: "Valid government ID Aadhaar Passport PAN Driving Licence required for KYC.",
    },
    {
        id: "security-deposit",
        q: "Is there a security deposit?",
        category: "Pricing & Deposit",
        a: (
            <p>
                Yes. The deposit depends on the plan. It’s fully refundable after the scooter is returned in good condition. Any damages, fines, or missing accessories will be adjusted before the refund.
            </p>
        ),
        aText:
            "Yes deposit depends on plan refundable after return damages fines accessories adjusted before refund.",
    },
    {
        id: "how-payments-work",
        q: "Which payment methods are supported?",
        category: "Payments",
        a: (
            <p>
                We accept UPI, NetBanking, and Cards via Cashfree Payments. Your dashboard will show each payment with its transaction reference. If a payment shows as “UNKNOWN”, our system rechecks and updates within a few minutes.
            </p>
        ),
        aText:
            "UPI NetBanking Cards via Cashfree. Dashboard shows payment with transaction reference unknown statuses auto verify later.",
    },
    {
        id: "payment-failed",
        q: "My payment succeeded on the bank page but shows failed on ZapGo",
        category: "Payments",
        a: (
            <p>
                This can happen if the gateway callback is delayed. Use the booking success link again or wait a minute—the{" "}
                <span className="font-medium">Verify</span> step checks Cashfree for the final status. If the amount was captured, your booking will be confirmed automatically. Still stuck? Share your order ID with support.
            </p>
        ),
        aText:
            "Gateway callback delay. Reopen success link or wait. Verify checks Cashfree. If captured booking confirms automatically. Share order ID with support if stuck.",
    },
    {
        id: "extend-rental",
        q: "Can I extend my rental?",
        category: "Rentals & Returns",
        a: (
            <p>
                Yes—open your dashboard → <em>Rentals</em> → select your booking →{" "}
                <span className="font-medium">Extend</span>. New charges are calculated by your plan’s rate and shown before confirming.
            </p>
        ),
        aText: "Extend from dashboard rentals extend. New charges shown before confirming.",
    },
    {
        id: "return-process",
        q: "How do returns work?",
        category: "Rentals & Returns",
        a: (
            <ol className="list-decimal pl-5">
                <li>Request a return slot from your dashboard.</li>
                <li>We inspect the scooter (tires, brakes, battery, accessories).</li>
                <li>Deposits are released after adjustments, typically within 2–4 business days.</li>
            </ol>
        ),
        aText:
            "Request return slot dashboard. Inspection tires brakes battery accessories. Deposit released in 2-4 business days.",
    },
    {
        id: "late-fees",
        q: "Are there late return charges?",
        category: "Pricing & Deposit",
        a: (
            <p>
                Yes—late returns are charged at your per-day rate (or a portion thereof) as per your plan. Please extend in advance to avoid penalties.
            </p>
        ),
        aText:
            "Late returns charged at per-day rate. Extend in advance to avoid penalties.",
    },
    {
        id: "damage-policy",
        q: "What if the scooter is damaged or stolen?",
        category: "Issues & Support",
        a: (
            <p>
                Please notify us immediately. We’ll assess the repair or replacement cost as per our workshop estimates and adjust it from your deposit; any excess will be billed. For theft, a police report is required.
            </p>
        ),
        aText:
            "Notify immediately. Repairs/replacement assessed, adjusted from deposit; excess billed. Theft requires police report.",
    },
    {
        id: "refunds",
        q: "When do I get my refund?",
        category: "Payments",
        a: (
            <p>
                For cancellations within policy or deposit releases, refunds are initiated within 2–4 business days to the original payment method. Bank posting times may vary.
            </p>
        ),
        aText:
            "Refunds for cancellations or deposit releases initiated in 2-4 business days to original method.",
    },
    {
        id: "service-area",
        q: "Where do you operate?",
        category: "Booking",
        a: (
            <p>
                Currently in Siliguri and nearby zones. New locations are coming—join our waitlist on any <em>Coming Soon</em> page.
            </p>
        ),
        aText: "Currently in Siliguri and nearby zones; expanding soon.",
    },
    {
        id: "support",
        q: "How can I contact support?",
        category: "Issues & Support",
        a: (
            <p>
                Email{" "}
                <a className="text-primary underline" href="mailto:support@zapgorental.com">
                    support@zapgorental.com
                </a>{" "}
                or call{" "}
                <a className="text-primary underline" href="tel:+919999999999">
                    +91 99999 99999
                </a>{" "}
                (10:00–19:00 IST, Mon–Sat).
            </p>
        ),
        aText: "Email support@zapgorental.com or call +91 99999 99999.",
    },
];

const CATEGORIES = [
    "Booking",
    "Payments",
    "KYC & Eligibility",
    "Rentals & Returns",
    "Pricing & Deposit",
    "Issues & Support",
] as const;

export default function FaqPage() {
    const [q, setQ] = useState("");
    const [cat, setCat] = useState<(typeof CATEGORIES)[number] | "All">("All");
    const [helpful, setHelpful] = useState<Record<string, "yes" | "no">>({});

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return FAQS.filter((f) => {
            const inCat = cat === "All" ? true : f.category === cat;
            if (!needle) return inCat;
            return (
                inCat &&
                (f.q.toLowerCase().includes(needle) ||
                    f.aText.toLowerCase().includes(needle))
            );
        });
    }, [q, cat]);

    const jsonLd = useMemo(() => {
        const mainEntity = FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: {
                "@type": "Answer",
                text: f.aText,
            },
        }));
        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity,
        };
    }, []);

    return (
        <div className="container mx-auto px-4 py-10">
            {/* HERO */}
            <div className="relative overflow-hidden rounded-3xl gradient-background noise-bg shadow-lg ring-1 ring-white/10">
                <div className="absolute inset-0 bg-black/25" />
                <div className="relative p-8 sm:p-12 text-white">
                    <Badge className="rounded-xl bg-white/15 text-white">
                        <MessageCircleQuestion className="mr-1 h-3.5 w-3.5" />
                        FAQ
                    </Badge>
                    <h1
                        className="mt-3 font-headline text-3xl sm:text-5xl font-bold tracking-tight leading-tight text-white"
                        style={{ textWrap: "balance" }}
                    >
                        Frequently Asked Questions
                    </h1>
                    <p className="mt-3 max-w-2xl text-white/90 sm:text-lg">
                        Answers to common questions about bookings, payments, documents, and
                        returns on ZapGo Rental.
                    </p>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <div className="relative sm:min-w-[340px]">
                            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-white/70" />
                            <Input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search questions…"
                                className="h-11 rounded-xl bg-white/10 pl-9 text-white placeholder:text-white/70 ring-0 focus-visible:ring-2 focus-visible:ring-white/40"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge
                                onClick={() => setCat("All")}
                                className={`cursor-pointer rounded-xl ${
                                    cat === "All"
                                        ? "bg-white text-secondary"
                                        : "bg-white/15 text-white hover:bg-white/25"
                                }`}
                            >
                                All
                            </Badge>
                            {CATEGORIES.map((c) => (
                                <Badge
                                    key={c}
                                    onClick={() => setCat(c)}
                                    className={`cursor-pointer rounded-xl ${
                                        cat === c
                                            ? "bg-white text-secondary"
                                            : "bg-white/15 text-white hover:bg-white/25"
                                    }`}
                                >
                                    {c}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* BODY */}
            <div className="mx-auto mt-8 grid max-w-6xl gap-6 lg:grid-cols-12">
                {/* Left: Results */}
                <div className="lg:col-span-8">
                    <Card className="rounded-2xl">
                        <CardContent className="p-0">
                            <Accordion type="single" collapsible className="divide-y">
                                {filtered.length ? (
                                    filtered.map((f) => (
                                        <AccordionItem key={f.id} value={f.id} className="px-4">
                                            <AccordionTrigger className="py-4 text-left">
                                                <div className="flex w-full items-start justify-between gap-3">
                                                    <span className="text-base font-medium">{f.q}</span>
                                                    <Badge variant="secondary" className="shrink-0 rounded-xl">
                                                        {f.category}
                                                    </Badge>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-4 text-sm leading-6 text-muted-foreground">
                                                <div className="space-y-3">{f.a}</div>
                                                <Separator className="my-4" />
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="text-xs text-muted-foreground">
                                                        Was this helpful?
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant={
                                                                helpful[f.id] === "yes" ? "default" : "outline"
                                                            }
                                                            className="rounded-xl"
                                                            onClick={() =>
                                                                setHelpful((s) => ({ ...s, [f.id]: "yes" }))
                                                            }
                                                        >
                                                            <Check className="mr-1 h-4 w-4" />
                                                            Yes
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant={
                                                                helpful[f.id] === "no" ? "destructive" : "outline"
                                                            }
                                                            className="rounded-xl"
                                                            onClick={() =>
                                                                setHelpful((s) => ({ ...s, [f.id]: "no" }))
                                                            }
                                                        >
                                                            <X className="mr-1 h-4 w-4" />
                                                            No
                                                        </Button>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No results. Try a different search or filter.
                                    </div>
                                )}
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Contact & Quick Links */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="rounded-2xl">
                        <CardContent className="p-6">
                            <h3 className="font-semibold">Still need help?</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Our support team is here Mon–Sat, 10:00–19:00 IST.
                            </p>
                            <div className="mt-4 space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-primary" />
                                    <a
                                        href="mailto:support@zapgorental.com"
                                        className="text-primary underline"
                                    >
                                        support@zapgorental.com
                                    </a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-primary" />
                                    <a href="tel:+919999999999" className="text-primary underline">
                                        +91 99999 99999
                                    </a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPinned className="h-4 w-4 text-primary" />
                                    <Link href="/contact" className="text-primary underline">
                                        Visit Contact & Map
                                    </Link>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Button asChild className="rounded-xl">
                                    <Link href="/book">Book Now</Link>
                                </Button>
                                <Button variant="outline" asChild className="rounded-xl">
                                    <Link href="/rider/login">Rider Login</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                        <CardContent className="p-6">
                            <h3 className="font-semibold">Popular topics</h3>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {["How to book", "Extend rental", "Refunds", "Security deposit", "KYC"].map(
                                    (t) => (
                                        <Badge key={t} variant="secondary" className="rounded-xl">
                                            {t}
                                        </Badge>
                                    )
                                )}
                            </div>
                            <Separator className="my-4" />
                            <p className="text-xs text-muted-foreground">
                                Tip: use the search bar above to quickly find answers.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* SEO: FAQPage JSON-LD */}
            <script
                type="application/ld+json"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
        </div>
    );
}
