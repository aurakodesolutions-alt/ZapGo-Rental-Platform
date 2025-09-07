"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Loader2,
    Eye,
    EyeOff,
    ShieldCheck,
    Zap,
    IndianRupee,
    Mail,
    Phone,
} from "lucide-react";

export default function RiderLoginPage() {
    const [identifier, setIdentifier] = useState("");
    const [pw, setPw] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const router = useRouter();

    const submit = useCallback(async () => {
        setErr(null);
        if (!identifier.trim() || !pw) {
            setErr("Please enter your email/phone and password.");
            return;
        }
        setLoading(true);
        try {
            const r = await fetch("/api/v1/public/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneOrEmail: identifier.trim(), password: pw }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || "Login failed");
            router.replace("/rider/profile");
        } catch (e: any) {
            setErr(e?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    }, [identifier, pw, router]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submit();
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-background container mx-auto px-4 py-10">
            {/* HERO (no overlap with card) */}
            <section className="gradient-background rounded-3xl noise-bg relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20" />
                <div className="container relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
                    <Badge className="rounded-xl bg-white/15 text-white">Rider</Badge>
                    <h1 className="mt-3 font-headline text-3xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
                        Welcome back
                    </h1>
                    <p className="mt-2 max-w-2xl text-primary-foreground/90">
                        Sign in to manage rentals, payments, and returns—all in one place.
                    </p>
                </div>
            </section>

            {/* AUTH CARD — separated from hero (no negative margin) */}
            <div className="container mx-auto max-w-6xl px-4 pb-14 mt-6 sm:mt-8">
                <Card className="overflow-hidden rounded-3xl border shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* VISUAL PANE */}
                        <div className="relative hidden md:block md:min-h-[560px] lg:min-h-[600px]">
                            <Image
                                src="/images/hero_12.png"
                                alt="Electric scooter in a modern city street"
                                fill
                                priority
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/0" />
                            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                                <h3 className="text-2xl font-semibold leading-tight">
                                    Ride Electric. Save More.
                                </h3>
                                <p className="mt-2 text-white/85">
                                    Affordable daily rentals with instant KYC and transparent pricing.
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Badge className="rounded-xl bg-white/15 text-white">
                                        <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Secure & insured
                                    </Badge>
                                    <Badge className="rounded-xl bg-white/15 text-white">
                                        <Zap className="mr-1.5 h-3.5 w-3.5" /> Instant KYC
                                    </Badge>
                                    <Badge className="rounded-xl bg-white/15 text-white">
                                        <IndianRupee className="mr-1.5 h-3.5 w-3.5" /> Transparent pricing
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* FORM PANE */}
                        <CardContent className="p-6 sm:p-10">
                            <form className="space-y-5" onSubmit={onSubmit} noValidate>
                                <div>
                                    <Label htmlFor="identifier">Email</Label>
                                    <Input
                                        id="identifier"
                                        type="text"
                                        autoComplete="username"
                                        inputMode="email"
                                        placeholder="you@example.com"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        className="mt-2 h-11 rounded-xl focus-visible:ring-2"
                                        aria-invalid={!!err && !identifier ? "true" : "false"}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative mt-2">
                                        <Input
                                            id="password"
                                            type={showPw ? "text" : "password"}
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            value={pw}
                                            onChange={(e) => setPw(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    submit();
                                                }
                                            }}
                                            className="h-11 rounded-xl pr-10 focus-visible:ring-2"
                                            aria-invalid={!!err && !pw ? "true" : "false"}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPw((s) => !s)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:bg-muted"
                                            aria-label={showPw ? "Hide password" : "Show password"}
                                        >
                                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {err && (
                                    <p className="text-sm font-medium text-destructive" role="alert" aria-live="polite">
                                        {err}
                                    </p>
                                )}

                                <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Signing you in…
                                        </>
                                    ) : (
                                        "Login"
                                    )}
                                </Button>

                                <div className="flex items-center justify-between text-sm">
                                    <Link href="/contact" className="text-primary underline underline-offset-4">
                                        Forgot password?
                                    </Link>
                                </div>

                                <Separator />

                                {/* NO ACCOUNT */}
                                <div className="space-y-2 text-sm">
                                    <p className="text-muted-foreground">Don’t have a rider account yet?</p>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <Button asChild className="rounded-xl">
                                            <Link href="/book">Book a vehicle to create your account</Link>
                                        </Button>
                                        <Button variant="outline" asChild className="rounded-xl">
                                            <Link href="/contact">Contact support</Link>
                                        </Button>
                                    </div>
                                </div>

                                {/* SUPPORT */}
                                <div className="pt-2 text-xs text-muted-foreground">
                                    <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      <a href="mailto:support@zapgorental.com" className="text-primary underline">
                        support@zapgorental.com
                      </a>
                    </span>
                                        <span>•</span>
                                        <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      <a href="tel:+916374580290" className="text-primary underline">
                        +91 63745 80290
                      </a>
                    </span>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </div>
                </Card>
            </div>
        </div>
    );
}
