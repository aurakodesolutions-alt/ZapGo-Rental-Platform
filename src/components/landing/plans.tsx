// src/components/landing/plans.tsx
"use client";

import useSWR from "swr";
import Link from "next/link";
import { useMemo } from "react";
import { Check, Zap, ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ApiPlan = {
    id: number;
    name: string;                   // e.g. "ZapGo Lite"
    requiredDocuments: any;         // JSON array or CSV
    features: any;                  // JSON array or CSV
    joiningFee: number;
    deposit: number;
};

const fetcher = (u: string) => fetch(u).then(r => {
    if (!r.ok) throw new Error("Failed to load plans");
    return r.json();
});

function toArray(maybeArrayOrString: any): string[] {
    if (Array.isArray(maybeArrayOrString)) return maybeArrayOrString.map(String);
    if (typeof maybeArrayOrString === "string") {
        // Try JSON first
        try {
            const parsed = JSON.parse(maybeArrayOrString);
            if (Array.isArray(parsed)) return parsed.map(String);
        } catch {}
        // Fallback CSV
        return maybeArrayOrString
            .split(/[,|\n]/g)
            .map(s => s.trim())
            .filter(Boolean);
    }
    return [];
}

function formatINR(n: number) {
    return Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function Plans() {
    const { data, error, isLoading } = useSWR<{ items: ApiPlan[] }>(
        "/api/v1/public/plans",
        fetcher
    );

    const plans = useMemo(() => {
        const src = data?.items ?? [];
        return src.map(p => ({
            id: p.id,
            title: p.name,                                  // "ZapGo Lite"
            short: p.name.replace(/^ZapGo\s*/i, ""),        // "Lite" | "Pro" (for CTA URLs)
            features: toArray(p.features),
            docs: toArray(p.requiredDocuments),
            joiningFee: p.joiningFee,
            deposit: p.deposit,
            // simple heuristic: show "Most Popular" on Pro
            popular: /pro/i.test(p.name),
        }));
    }, [data]);

    return (
        <section id="plans" className="py-16 lg:py-24 bg-muted/30 dark:bg-muted/20">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-10">
                    <Badge className="rounded-xl bg-secondary text-secondary-foreground">Plans</Badge>
                    <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-secondary">
                        Choose Your Ride
                    </h2>
                    <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Two straightforward plans—transparent pricing, refundable deposit, zero fuel.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-auto max-w-xl mb-6 rounded-2xl border p-4 text-center">
                        <p className="text-sm text-destructive">
                            Couldn’t load plans right now. Please refresh the page.
                        </p>
                    </div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                    {isLoading
                        ? Array.from({ length: 2 }).map((_, i) => (
                            <Card key={`s-${i}`} className="rounded-2xl shadow-sm">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-lg bg-primary/10 w-14 h-14" />
                                        <div className="flex-1">
                                            <Skeleton className="h-5 w-40" />
                                            <Skeleton className="mt-2 h-4 w-64" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-3">
                                        <Skeleton className="h-8 w-24" />
                                        <Skeleton className="h-8 w-24" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <Skeleton className="h-4 w-5/6" />
                                        <Skeleton className="h-4 w-2/3" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 pt-2">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-4 w-56" />
                                    </div>
                                    <Skeleton className="mt-4 h-11 w-full rounded-xl" />
                                </CardContent>
                            </Card>
                        ))
                        : plans.map((plan) => (
                            <Card
                                key={plan.id}
                                className={cn(
                                    "group relative flex flex-col rounded-2xl border shadow-sm hover:shadow-xl transition-shadow",
                                    plan.popular && "ring-2 ring-primary/40"
                                )}
                            >
                                {/* Ribbon for popular */}
                                {plan.popular && (
                                    <div className="absolute -top-3 right-4 z-10">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold shadow-sm">
                        <Sparkles className="h-3.5 w-3.5" />
                        Most Popular
                      </span>
                                    </div>
                                )}

                                <CardHeader className="pb-4">
                                    <div className="flex items-start sm:items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                            <Zap className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
                                            <CardDescription>
                                                {plan.popular
                                                    ? "Registered scooters with higher performance for longer commutes."
                                                    : "Perfect for city hops and daily errands with low mileage."}
                                            </CardDescription>
                                        </div>
                                    </div>

                                    {/* Price chips */}
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <PriceChip label="Joining Fee" amount={plan.joiningFee} />
                                        <PriceChip label="Refundable Deposit" amount={plan.deposit} icon={<ShieldCheck className="h-3.5 w-3.5" />} />
                                    </div>
                                </CardHeader>

                                <CardContent className="flex flex-col gap-5">
                                    {/* Features */}
                                    {plan.features.length > 0 && (
                                        <div>
                                            <p className="mb-2 font-semibold">What you get</p>
                                            <ul className="space-y-2">
                                                {plan.features.map((f, i) => (
                                                    <li key={`${plan.id}-f-${i}`} className="flex items-start gap-2">
                                                        <Check className="mt-0.5 h-4 w-4 text-green-500" />
                                                        <span>{f}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Documents */}
                                    {plan.docs.length > 0 && (
                                        <div>
                                            <p className="mb-2 font-semibold">Documents required</p>
                                            <div className="flex flex-wrap gap-2">
                                                {plan.docs.map((d, i) => (
                                                    <Badge key={`${plan.id}-d-${i}`} variant="secondary" className="rounded-lg">
                                                        {d}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* CTA */}
                                    <Button size="lg" asChild className="mt-1 rounded-xl">
                                        <Link href={`/book?plan=${encodeURIComponent(plan.short.toLowerCase())}&planId=${plan.id}`}>
                                            Book {plan.short} Plan
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                </div>
            </div>
        </section>
    );
}

function PriceChip({
                       label,
                       amount,
                       icon,
                   }: {
    label: string;
    amount: number;
    icon?: React.ReactNode;
}) {
    return (
        <span className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm bg-card">
      {icon ? icon : <Zap className="h-3.5 w-3.5 text-primary" />}
            <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold">₹{formatINR(amount)}</span>
    </span>
    );
}
