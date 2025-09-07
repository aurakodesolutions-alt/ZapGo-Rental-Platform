"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    CalendarClock,
    Mail,
    Sparkles,
    Rocket,
    ArrowLeft,
    Twitter,
    Instagram,
    Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Elegant, animated "Coming Soon" page.
 * - Soft gradient background + blurred blobs
 * - Subtle floating icons
 * - Countdown, notify form, and quick nav
 * - Shadcn buttons/inputs and Framer Motion micro-animations
 */

export default function ComingSoonPage() {
    // Set a target launch date (customize freely)
    const target = React.useMemo(() => new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), []);
    const [left, setLeft] = React.useState(getLeft(target));

    React.useEffect(() => {
        const id = setInterval(() => setLeft(getLeft(target)), 1000);
        return () => clearInterval(id);
    }, [target]);

    return (
        <main className="relative min-h-[calc(100dvh)] overflow-hidden bg-[radial-gradient(ellipse_at_top_left,theme(colors.primary/15),transparent_50%),radial-gradient(ellipse_at_bottom_right,theme(colors.sky.400/10),transparent_50%)]">
            {/* Background blobs */}
            <GradientBlob className="left-[-10%] top-[-10%]" />
            <GradientBlob className="right-[-10%] bottom-[-15%] from-fuchsia-400/30 to-indigo-400/20" />

            {/* Floating icons */}
            <FloatingIcon className="left-[6%] top-[18%]" delay={0.1}><Sparkles className="h-5 w-5" /></FloatingIcon>
            <FloatingIcon className="right-[10%] top-[26%]" delay={0.25}><Rocket className="h-5 w-5" /></FloatingIcon>
            <FloatingIcon className="left-[15%] bottom-[20%]" delay={0.4}><CalendarClock className="h-5 w-5" /></FloatingIcon>

            <div className="relative z-10 mx-auto grid max-w-4xl place-items-center px-6 py-14 sm:py-20">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="mb-8 flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur"
                >
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    Work in progress — something awesome is on the way
                </motion.div>

                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full"
                >
                    <Card className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-xl backdrop-blur">
                        {/* soft corner glow */}
                        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
                        <div className="pointer-events-none absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />

                        <CardContent className="p-8 sm:p-10">
                            <div className="text-center">
                                <h1 className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
                                    Coming Soon
                                </h1>
                                <p className="mx-auto mt-3 max-w-xl text-balance text-sm text-muted-foreground sm:text-base">
                                    This page is under construction. We’re polishing the last details—check back soon
                                    or get notified when it goes live.
                                </p>
                            </div>

                            {/* Countdown */}
                            <div className="mt-8 grid grid-cols-4 gap-2 sm:gap-3">
                                <TimePill label="Days"   value={left.days} />
                                <TimePill label="Hours"  value={left.hours} />
                                <TimePill label="Mins"   value={left.minutes} />
                                <TimePill label="Secs"   value={left.seconds} />
                            </div>

                            {/* Notify form */}
                            <NotifyMe />

                            {/* Actions */}
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                                <Button asChild variant="secondary" className="rounded-xl">
                                    <Link href="/admin">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Dashboard
                                    </Link>
                                </Button>
                                <div className="mx-1 h-6 w-px bg-border/70" />
                                <SocialLink href="#" label="X / Twitter"><Twitter className="h-4 w-4" /></SocialLink>
                                <SocialLink href="#" label="Instagram"><Instagram className="h-4 w-4" /></SocialLink>
                                <SocialLink href="#" label="GitHub"><Github className="h-4 w-4" /></SocialLink>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </main>
    );
}

/* ---------- Bits ---------- */

function TimePill({ label, value }: { label: string; value: number }) {
    return (
        <div className="group rounded-2xl border bg-background/70 p-4 text-center shadow-sm backdrop-blur transition-colors hover:border-primary/30">
            <div className="text-2xl font-bold tabular-nums tracking-tight">{pad(value)}</div>
            <div className="mt-1 text-[11px] uppercase text-muted-foreground">{label}</div>
        </div>
    );
}

function NotifyMe() {
    const [email, setEmail] = React.useState("");
    const [sent, setSent] = React.useState(false);

    return (
        <motion.form
            onSubmit={(e:any) => {
                e.preventDefault();
                // You can POST to /api/notify here; for now we just show success
                setSent(true);
            }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mx-auto mt-6 flex w-full max-w-md flex-col items-center gap-3 sm:flex-row"
        >
            <div className="relative w-full">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    className={cn(
                        "w-full rounded-xl pl-9",
                        sent && "border-emerald-400/60 bg-emerald-50/40 dark:bg-emerald-900/10"
                    )}
                />
            </div>
            <Button type="submit" className="w-full rounded-xl sm:w-auto" disabled={sent}>
                {sent ? "You're on the list ✓" : "Notify me"}
            </Button>
        </motion.form>
    );
}

function SocialLink({
                        href,
                        children,
                        label,
                    }: {
    href: string;
    children: React.ReactNode;
    label: string;
}) {
    return (
        <Button asChild size="sm" variant="ghost" className="rounded-xl">
            <a href={href} aria-label={label} title={label} className="flex items-center gap-2">
                {children}
                <span className="hidden text-xs text-muted-foreground sm:inline">{label}</span>
            </a>
        </Button>
    );
}

function GradientBlob({
                          className,
                          from = "from-primary/25",
                          to = "to-sky-400/20",
                      }: {
    className?: string;
    from?: string;
    to?: string;
}) {
    return (
        <div
            className={cn(
                "pointer-events-none absolute h-80 w-80 rounded-full bg-gradient-to-br blur-3xl",
                from,
                to,
                className
            )}
        />
    );
}

function FloatingIcon({
                          children,
                          className,
                          delay = 0,
                      }: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) {
    return (
        <motion.div
            className={cn(
                "pointer-events-none absolute grid place-items-center rounded-full border bg-background/70 p-3 text-muted-foreground shadow-sm backdrop-blur",
                className
            )}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: [0, -8, 0], opacity: 1 }}
            transition={{ delay, duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
            {children}
        </motion.div>
    );
}

/* ---------- utils ---------- */

function getLeft(target: Date) {
    const diff = Math.max(0, target.getTime() - Date.now());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds };
}

function pad(n: number) {
    return String(n).padStart(2, "0");
}
