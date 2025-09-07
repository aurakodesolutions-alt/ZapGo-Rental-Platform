// src/components/coming-soon.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Calendar, Rocket, Sparkles } from "lucide-react";

type Props = {
    /** Big heading shown in the hero */
    title?: string;
    /** Short sentence under the heading */
    subtitle?: string;
    /** For DB/waitlist record (e.g. “Rider Dashboard v2” or route name) */
    page?: string;
    /** ISO date/time we’re counting down to, e.g. "2025-10-01T09:00:00+05:30" */
    etaIso?: string | null;
};

function prettyTime(ms: number) {
    if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return { d, h, m, s: sec };
}

export default function ComingSoon({
                                       title = "Coming Soon",
                                       subtitle = "We’re putting on the final touches. Join the waitlist and we’ll notify you the moment it’s live.",
                                       page = "coming-soon",
                                       etaIso = null,
                                   }: Props) {
    const eta = useMemo(() => (etaIso ? new Date(etaIso) : null), [etaIso]);
    const [now, setNow] = useState<Date>(() => new Date());
    const [email, setEmail] = useState("");
    const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const left = useMemo(() => (eta ? eta.getTime() - now.getTime() : 0), [eta, now]);
    const t = useMemo(() => prettyTime(Math.max(0, left)), [left]);

    const addToCalendar = () => {
        if (!eta) return;
        const start = eta.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
        const end = new Date(eta.getTime() + 60 * 60 * 1000)
            .toISOString()
            .replace(/[-:]/g, "")
            .replace(/\.\d{3}Z$/, "Z");

        const ics = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "CALSCALE:GREGORIAN",
            "PRODID:-//ZapGo Rental//Coming Soon//EN",
            "BEGIN:VEVENT",
            `DTSTART:${start}`,
            `DTEND:${end}`,
            "SUMMARY:ZapGo — Launch Reminder",
            `DESCRIPTION:${title} goes live!`,
            "END:VEVENT",
            "END:VCALENDAR",
        ].join("\r\n");

        const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "zapgo-launch.ics";
        a.click();
        URL.revokeObjectURL(url);
    };

    const submit = async () => {
        setMsg(null);
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!ok) {
            setMsg({ t: "err", m: "Please enter a valid email." });
            return;
        }
        setSending(true);
        try {
            const res = await fetch("/api/v1/public/waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, page }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to join waitlist");
            setMsg({ t: "ok", m: "You’re on the list. We’ll email you at launch!" });
            setEmail("");
        } catch (e: any) {
            setMsg({ t: "err", m: e?.message || "Couldn’t save your email." });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="py-12">
            {/* HERO */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-secondary via-secondary/90 to-primary shadow-lg ring-1 ring-white/10 noise-bg">
                <div className="absolute inset-0 bg-black/25" aria-hidden />
                <div className="relative p-8 sm:p-12 text-white">
                    <Badge className="rounded-xl bg-white/15 text-white">
                        <Rocket className="mr-1 h-3.5 w-3.5" /> Coming Soon
                    </Badge>

                    <h1 className="mt-3 font-headline text-3xl sm:text-5xl font-bold tracking-tight leading-tight text-white" style={{ textWrap: "balance" }}>
                        {title}
                    </h1>

                    <p className="mt-3 max-w-2xl text-white/90 sm:text-lg">{subtitle}</p>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        {eta ? (
                            <>
                                <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium backdrop-blur">
                                    <Calendar className="h-4 w-4" />
                                    Launch in:&nbsp;
                                    <span className="tabular-nums">{t.d}d</span>
                                    <span className="tabular-nums">{t.h}h</span>
                                    <span className="tabular-nums">{t.m}m</span>
                                    <span className="tabular-nums">{t.s}s</span>
                                </div>
                                <Button variant="secondary" className="rounded-xl" onClick={addToCalendar}>
                                    Add to Calendar
                                </Button>
                            </>
                        ) : null}
                        <Button variant="outline" className="rounded-xl" asChild>
                            <a href="/">Back to Home</a>
                        </Button>
                    </div>
                </div>

                {/* simple confetti strips using your existing tailwind animation */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {Array.from({ length: 14 }).map((_, i) => (
                        <span
                            key={i}
                            className="absolute -top-10 h-2 w-2 animate-confetti-fall rounded-sm"
                            style={{
                                left: `${(i * 7) % 100}%`,
                                animationDelay: `${(i % 5) * 0.6}s`,
                                opacity: 0.4,
                                background: "white",
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* CONTENT */}
            <div className="mx-auto mt-8 grid max-w-5xl gap-6 lg:grid-cols-5">
                {/* left: waitlist */}
                <Card className="rounded-2xl lg:col-span-3">
                    <CardContent className="p-6">
                        <h3 className="font-semibold">Get notified at launch</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Pop your email below and we’ll ping you as soon as it’s ready.
                        </p>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            <Input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 rounded-xl sm:max-w-xs"
                            />
                            <Button onClick={submit} className="h-11 rounded-xl" disabled={sending}>
                                {sending ? "Saving…" : "Notify Me"}
                            </Button>
                        </div>

                        {msg ? (
                            <p className={`mt-3 text-sm ${msg.t === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                                {msg.m}
                            </p>
                        ) : null}

                        <Separator className="my-6" />

                        <ul className="grid gap-3 sm:grid-cols-2">
                            {[
                                "Clean, mobile-first UI with your brand palette",
                                "Deep integration with rider account & payments",
                                "Performance tuned for SEO and Core Web Vitals",
                                "Secure by default (auth, rate limits, audit)",
                            ].map((f) => (
                                <li key={f} className="flex items-center gap-2 text-sm">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* right: status card */}
                <Card className="rounded-2xl lg:col-span-2">
                    <CardContent className="p-6">
                        <h3 className="font-semibold">Build status</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            We’re actively building this module. Here’s what’s shipping first:
                        </p>

                        <div className="mt-4 space-y-3 text-sm">
                            <div className="rounded-xl border p-3">
                                <p className="font-medium">Milestone 1</p>
                                <p className="text-muted-foreground">Core screens, responsive layout, and initial API hookup.</p>
                            </div>
                            <div className="rounded-xl border p-3">
                                <p className="font-medium">Milestone 2</p>
                                <p className="text-muted-foreground">Polish, analytics, and docs.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
