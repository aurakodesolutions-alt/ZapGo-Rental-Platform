// src/components/landing/faq.tsx
"use client";

import Link from "next/link";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageCircleQuestion } from "lucide-react";

type MiniFaq = {
    id: string;
    question: string;
    answer: React.ReactNode;
};

const faqs: MiniFaq[] = [
    {
        id: "deposit-refund",
        question: "Is the security deposit refundable?",
        answer: (
            <p>
                Yes—your deposit is fully refundable after you return the scooter in good condition.
                If there are damages, fines, or missing accessories, we adjust those first. Refunds are
                typically initiated within <strong>2–4 business days</strong> to the original payment method.
            </p>
        ),
    },
    {
        id: "documents",
        question: "What documents do I need for KYC?",
        answer: (
            <p>
                <strong>Lite:</strong> Aadhaar + PAN.{" "}
                <strong>Pro:</strong> Aadhaar + PAN + valid Driving Licence.
                Upload clear images during booking for faster verification.
            </p>
        ),
    },
    {
        id: "dl-lite",
        question: "Do I need a Driving Licence for the Lite plan?",
        answer: (
            <p>
                No, the <strong>Lite</strong> plan uses non-registered vehicles—no DL required.
                You must be <strong>18+</strong>.
            </p>
        ),
    },
    {
        id: "payments",
        question: "Which payment methods are supported?",
        answer: (
            <p>
                UPI, NetBanking, and Cards via Cashfree. Every payment shows a transaction reference in your dashboard.
                If a payment briefly shows as “Unknown”, our system re-verifies and updates automatically.
            </p>
        ),
    },
    {
        id: "extend",
        question: "Can I extend my rental?",
        answer: (
            <p>
                Yes—go to <em>Dashboard → Rentals</em>, open your booking, and tap{" "}
                <strong>Extend</strong>. New charges are shown before you confirm.
            </p>
        ),
    },
    {
        id: "how-to-book",
        question: "How do I book a scooter?",
        answer: (
            <p>
                Head to <Link href="/book" className="text-primary underline">Book Now</Link>,
                pick a plan & vehicle, choose dates, and pay. You’ll be redirected back and your booking will be confirmed automatically.
            </p>
        ),
    },
];

export function Faq() {
    return (
        <section id="faq" className="py-16 lg:py-24 bg-background dark:bg-muted/20">
            <div className="container mx-auto px-4">
                {/* Header using your gradient token */}
                <div className="gradient-background noise-bg relative overflow-hidden rounded-3xl ring-1 ring-white/10">
                    <div className="absolute inset-0 bg-black/15" />
                    <div className="relative p-8 sm:p-12 text-primary-foreground">
                        <Badge className="rounded-xl bg-white/20 text-white">
                            <MessageCircleQuestion className="mr-1 h-3.5 w-3.5" />
                            FAQ
                        </Badge>
                        <h2 className="mt-3 text-3xl md:text-4xl font-extrabold drop-shadow">
                            Frequently Asked Questions
                        </h2>
                        <p className="mt-2 max-w-2xl text-white/90">
                            Quick answers about bookings, KYC, payments, and extensions. For more, see our full FAQ.
                        </p>
                        <div className="mt-5">
                            <Button asChild size="sm" variant="outline" className="rounded-xl bg-transparent text-white border-white/60 hover:bg-white hover:text-secondary">
                                <Link href="/faq">View Full FAQ</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="mx-auto mt-8 max-w-3xl">
                    <Accordion type="single" collapsible className="w-full rounded-2xl border bg-card">
                        {faqs.map((item) => (
                            <AccordionItem key={item.id} value={item.id} className="px-4">
                                <AccordionTrigger className="py-4 text-left text-base font-semibold hover:text-primary">
                                    {item.question}
                                </AccordionTrigger>
                                <AccordionContent className="pb-4 text-base text-muted-foreground">
                                    {item.answer}
                                </AccordionContent>
                                <Separator className="last-of-type:hidden" />
                            </AccordionItem>
                        ))}
                    </Accordion>

                    {/* CTA row */}
                    <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Button asChild className="rounded-xl w-full sm:w-auto">
                            <Link href="/book">Book Now</Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-xl w-full sm:w-auto">
                            <Link href="/contact-us">Contact Support</Link>
                        </Button>
                        <Button asChild variant="ghost" className="rounded-xl text-primary w-full sm:w-auto">
                            <Link href="/faq">See All FAQs →</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
