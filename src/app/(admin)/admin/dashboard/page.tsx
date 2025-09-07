"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
    Activity,
    AlertTriangle,
    CarFront,
    Users,
    Wallet,
    Coins,
    CalendarClock,
    IndianRupee,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatINR, formatIST } from "@/lib/format";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip as RTTooltip,
    BarChart,
    Bar,
    AreaChart,
    Area,
} from "recharts";

/* ---------- types from API ---------- */
type DashboardData = {
    stats: {
        totalRiders: number;
        totalVehicles: number;
        vehiclesAvailable: number;
        activeRentals: number;
        overdueRentals: number;
        receivables: number;
        paymentsToday: number;
        paymentsMonth: number;
    };
    utilization: { date: string; rented: number; total: number; utilization: number }[];
    earningsDaily: { date: string; amount: number }[];
    recentPayments: {
        paymentId: number;
        rentalId: number;
        rider: { riderId: number; fullName: string; phone: string };
        amount: number;
        paymentMethod: string;
        txnRef?: string | null;
        transactionStatus: string;
        transactionDate: string;
    }[];
    recentReturns: {
        rentalId: number;
        rider: { riderId: number; fullName: string; phone: string };
        vehicle: { vehicleId: number; uniqueCode: string; model: string };
        actualReturnDate: string | null;
        payableTotal: number;
        paidTotal: number;
        balanceDue: number;
        finalAmount: number;
        settled: boolean;
    }[];
};

export default function AdminDashboardPage() {
    const { data: session } = useSession();
    const role = (session?.user as any)?.role as "admin" | "staff" | undefined;

    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState<DashboardData | null>(null);
    const [days, setDays] = React.useState<7 | 14 | 30>(14);

    React.useEffect(() => {
        let aborted = false;
        (async () => {
            try {
                setLoading(true);
                const r = await fetch(`/api/v1/admin/dashboard?days=${days}`, { cache: "no-store" });
                const j = await r.json();
                if (!aborted && r.ok && j?.ok) setData(j.data as DashboardData);
            } finally {
                if (!aborted) setLoading(false);
            }
        })();
        return () => {
            aborted = true;
        };
    }, [days]);

    const utilizationNow =
        data?.utilization?.length ? data.utilization[data.utilization.length - 1].utilization : 0;

    return (
        <>
            <PageHeader
                title="Dashboard"
                description="Snapshot of rentals, payments and utilization."
            >
                <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex rounded-xl border bg-background/60 p-1 shadow-sm backdrop-blur">
                        {([7, 14, 30] as const).map((d) => (
                            <Button
                                key={d}
                                size="sm"
                                variant={days === d ? "default" : "ghost"}
                                className={cn(
                                    "px-3 rounded-lg",
                                    days === d && "shadow-sm"
                                )}
                                onClick={() => setDays(d)}
                            >
                                {d}d
                            </Button>
                        ))}
                    </div>
                </div>
            </PageHeader>

            {/* KPI row */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    title="Active Rentals"
                    value={data?.stats.activeRentals}
                    loading={loading}
                    icon={<Activity className="h-5 w-5" />}
                    glow="from-primary/25"
                />
                <KpiCard
                    title="Overdue"
                    value={data?.stats.overdueRentals}
                    loading={loading}
                    icon={<AlertTriangle className="h-5 w-5" />}
                    glow="from-destructive/30"
                    warn
                />
                <KpiCard
                    title="Vehicles (Avail / Total)"
                    value={
                        data ? `${data.stats.vehiclesAvailable} / ${data.stats.totalVehicles}` : undefined
                    }
                    loading={loading}
                    icon={<CarFront className="h-5 w-5" />}
                    glow="from-sky-300/30"
                    footer={
                        <MiniProgress
                            value={data?.stats.totalVehicles ? (1 - (data.stats.vehiclesAvailable / data.stats.totalVehicles)) * 100 : 0}
                            label="Currently rented"
                        />
                    }
                />
                <KpiCard
                    title="Riders"
                    value={data?.stats.totalRiders}
                    loading={loading}
                    icon={<Users className="h-5 w-5" />}
                    glow="from-emerald-300/30"
                />
                <KpiCard
                    title="Receivables"
                    value={data ? formatINR(data.stats.receivables) : undefined}
                    loading={loading}
                    icon={<Coins className="h-5 w-5" />}
                    glow="from-amber-300/30"
                />
                <KpiCard
                    title="Payments Today"
                    value={data ? formatINR(data.stats.paymentsToday) : undefined}
                    loading={loading}
                    icon={<Wallet className="h-5 w-5" />}
                    glow="from-fuchsia-300/30"
                />
                <KpiCard
                    title="Payments This Month"
                    value={data ? formatINR(data.stats.paymentsMonth) : undefined}
                    loading={loading}
                    icon={<IndianRupee className="h-5 w-5" />}
                    glow="from-indigo-300/30"
                />
                <KpiCard
                    title="Utilization"
                    value={`${Math.round(utilizationNow * 100)}%`}
                    loading={loading}
                    icon={<CarFront className="h-5 w-5" />}
                    glow="from-lime-300/30"
                    footer={<MiniProgress value={utilizationNow * 100} label="Fleet utilization" />}
                />
            </div>

            {/* Charts */}
            <div className="mt-6 grid gap-4 lg:grid-cols-12">
                {/* Utilization (everyone) */}
                <ChartCard
                    title="Vehicle Utilization"
                    subtitle={`Last ${days} days`}
                    className="lg:col-span-7"
                >
                    {loading ? (
                        <Skeleton className="h-80 w-full rounded-xl" />
                    ) : (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.utilization || []} margin={{ left: 8, right: 8 }}>
                                    <defs>
                                        <linearGradient id="utilFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.04} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                    <YAxis tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`} domain={[0, 1]} />
                                    <RTTooltip
                                        formatter={(v: any, n) =>
                                            n === "utilization" ? `${Math.round(v * 100)}%` : v
                                        }
                                        labelFormatter={(l) => `Date: ${l}`}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="utilization"
                                        stroke="hsl(var(--primary))"
                                        fill="url(#utilFill)"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>

                {/* Earnings (admins only) */}
                {role !== "staff" && (
                    <ChartCard title="Earnings" subtitle={`Last ${days} days`} className="lg:col-span-5">
                        {loading ? (
                            <Skeleton className="h-80 w-full rounded-xl" />
                        ) : (
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data?.earningsDaily || []} margin={{ left: 8, right: 8 }}>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                        <YAxis tickFormatter={(v) => `₹${v}`} />
                                        <RTTooltip formatter={(v: any) => formatINR(Number(v || 0))} />
                                        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[10, 10, 4, 4]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </ChartCard>
                )}
            </div>

            {/* Recent Lists */}
            <div className="mt-6 grid gap-4 lg:grid-cols-12">
                <Card className="lg:col-span-7 rounded-2xl border bg-gradient-to-b from-background to-muted/40 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                            <CarFront className="h-5 w-5 text-primary" />
                            Recent Returns
                        </CardTitle>
                    </CardHeader>
                    <Separator />
                    <CardContent className="space-y-3 pt-4">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                        ) : (data?.recentReturns || []).length ? (
                            data!.recentReturns.map((r) => (
                                <RowCard key={r.rentalId}>
                                    <div className="flex min-w-0 items-center gap-3">
                                        <AvatarBubble name={r.rider.fullName} />
                                        <div className="min-w-0">
                                            <div className="truncate font-medium">
                                                <Link
                                                    href={`/admin/rentals/${r.rentalId}`}
                                                    className="text-primary hover:underline"
                                                >
                                                    #{r.rentalId}
                                                </Link>{" "}
                                                · {r.rider.fullName} · {r.vehicle.model} ({r.vehicle.uniqueCode})
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Returned:{" "}
                                                {r.actualReturnDate
                                                    ? formatIST(r.actualReturnDate, "dd MMM, hh:mm a")
                                                    : "—"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-sm">Balance: {formatINR(r.balanceDue)}</div>
                                        <Badge variant={r.settled ? "default" : "secondary"}>
                                            {r.settled ? "Settled" : "Unsettled"}
                                        </Badge>
                                    </div>
                                </RowCard>
                            ))
                        ) : (
                            <EmptyState label="No recent returns." />
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-5 rounded-2xl border bg-gradient-to-b from-background to-muted/40 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-primary" />
                            Recent Payments
                        </CardTitle>
                    </CardHeader>
                    <Separator />
                    <CardContent className="space-y-3 pt-4">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                        ) : (data?.recentPayments || []).length ? (
                            data!.recentPayments.map((p) => (
                                <RowCard key={p.paymentId}>
                                    <div className="flex min-w-0 items-center gap-3">
                                        <AvatarBubble name={p.rider.fullName} />
                                        <div className="min-w-0">
                                            <div className="truncate font-medium">
                                                {p.rider.fullName} ·{" "}
                                                <Link
                                                    href={`/admin/rentals/${p.rentalId}`}
                                                    className="text-primary hover:underline"
                                                >
                                                    #{p.rentalId}
                                                </Link>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {formatIST(p.transactionDate, "dd MMM, hh:mm a")} · {p.paymentMethod} ·{" "}
                                                {p.txnRef || "—"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="font-medium">{formatINR(p.amount)}</div>
                                        <Badge
                                            variant={
                                                p.transactionStatus === "SUCCESS"
                                                    ? "default"
                                                    : p.transactionStatus === "PENDING"
                                                        ? "secondary"
                                                        : "destructive"
                                            }
                                        >
                                            {p.transactionStatus}
                                        </Badge>
                                    </div>
                                </RowCard>
                            ))
                        ) : (
                            <EmptyState label="No recent payments." />
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

/* ---------- UI bits ---------- */

function KpiCard({
                     title,
                     value,
                     loading,
                     icon,
                     warn,
                     glow,
                     footer,
                 }: {
    title: string;
    value?: string | number;
    loading?: boolean;
    icon: React.ReactNode;
    warn?: boolean;
    glow?: string; // e.g. 'from-primary/25'
    footer?: React.ReactNode;
}) {
    return (
        <Card className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-background to-muted/30 shadow-sm">
            <div
                className={cn(
                    "pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-tr blur-2xl",
                    glow || "from-primary/20 to-transparent"
                )}
            />
            <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {title}
                    </CardTitle>
                    <div className="grid place-items-center rounded-xl border bg-background/80 p-2 shadow-sm">
                        {icon}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pb-3">
                {loading ? (
                    <Skeleton className="h-8 w-32" />
                ) : (
                    <div className={cn("text-2xl font-semibold", warn && "text-destructive")}>
                        {value ?? "—"}
                    </div>
                )}
                {footer && <div className="mt-3">{footer}</div>}
            </CardContent>
        </Card>
    );
}

function ChartCard({
                       title,
                       subtitle,
                       className,
                       children,
                   }: {
    title: string;
    subtitle?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <Card className={cn("rounded-2xl border bg-gradient-to-b from-background to-muted/30 shadow-sm", className)}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">{title}</CardTitle>
                        {subtitle && <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>}
                    </div>
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">{children}</CardContent>
        </Card>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="rounded-xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            {label}
        </div>
    );
}

function RowCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-card/50 p-3 shadow-sm backdrop-blur-sm">
            {children}
        </div>
    );
}

function AvatarBubble({ name }: { name: string }) {
    const initials = (name || "?")
        .split(" ")
        .map((s) => s[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    return (
        <div className="grid h-9 w-9 place-items-center rounded-full border bg-background text-xs font-semibold text-muted-foreground shadow-sm">
            {initials}
        </div>
    );
}

function MiniProgress({ value, label }: { value?: number; label?: string }) {
    const v = Math.max(0, Math.min(100, Number(value || 0)));
    return (
        <div className="space-y-1">
            {label && <div className="text-[11px] text-muted-foreground">{label}</div>}
            <div className="h-2 w-full rounded-full bg-muted">
                <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${v}%` }}
                />
            </div>
        </div>
    );
}
