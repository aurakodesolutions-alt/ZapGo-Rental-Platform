// app/vehicles/page.tsx
"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VehicleCard from "@/components/vehicles/vehicle-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

type PlanOpt = { planId: number; planName: string };

export default function VehiclesPage() {
    const [q, setQ] = useState("");
    const [planId, setPlanId] = useState<number | undefined>(undefined);
    const [status, setStatus] = useState<"All" | "Available" | "Rented">("All");
    const [sort, setSort] = useState("created_desc");
    const [page, setPage] = useState(1);

    const params = useMemo(() => {
        const s = new URLSearchParams();
        if (q) s.set("q", q);
        if (planId) s.set("planId", String(planId));
        if (status !== "All") s.set("status", status);
        s.set("sort", sort);
        s.set("page", String(page));
        s.set("pageSize", "12");
        return s.toString();
    }, [q, planId, status, sort, page]);

    const { data, isLoading } = useSWR<{ items: any[]; total: number }>(
        `/api/v1/public/vehicles?${params}`,
        fetcher
    );
    const plans = useSWR<{ items: PlanOpt[] }>(`/api/v1/public/plans`, fetcher);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* HERO */}
            <div className="gradient-background noise-bg relative overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-black/15" />
                <div className="relative p-8 sm:p-12 text-white">
                    <Badge className="rounded-xl bg-white/15 text-white">Fleet</Badge>
                    <h1 className="mt-3 font-headline text-3xl sm:text-5xl font-bold leading-tight">
                        Choose your electric ride
                    </h1>
                    <p className="mt-2 max-w-2xl text-white/90">
                        Affordable daily rentals. Transparent pricing. Zero fuel, zero hassle.
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="relative">
                            <Input
                                placeholder="Search model or code…"
                                value={q}
                                onChange={(e) => {
                                    setQ(e.target.value);
                                    setPage(1);
                                }}
                                className="h-11 rounded-xl bg-white/10 text-white placeholder:text-white/70 ring-0 focus-visible:ring-2 focus-visible:ring-white/40"
                            />
                        </div>
                        <Select
                            value={planId ? String(planId) : "all"}
                            onValueChange={(v) => {
                                setPlanId(v === "all" ? undefined : Number(v));
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="h-11 rounded-xl bg-white/10 text-white ring-0 focus:ring-0 focus-visible:ring-2 focus-visible:ring-white/40">
                                <SelectValue placeholder="All plans" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All plans</SelectItem>
                                {(plans.data?.items || []).map((p) => (
                                    <SelectItem key={p.planId} value={String(p.planId)}>
                                        {p.planName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                            <Button
                                variant={status === "All" ? "default" : "outline"}
                                onClick={() => {
                                    setStatus("All");
                                    setPage(1);
                                }}
                                className="rounded-xl"
                            >
                                All
                            </Button>
                            <Button
                                variant={status === "Available" ? "default" : "outline"}
                                onClick={() => {
                                    setStatus("Available");
                                    setPage(1);
                                }}
                                className="rounded-xl"
                            >
                                Available
                            </Button>
                            <Button
                                variant={status === "Rented" ? "default" : "outline"}
                                onClick={() => {
                                    setStatus("Rented");
                                    setPage(1);
                                }}
                                className="rounded-xl"
                            >
                                Rented
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* SORT + COUNT */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                    {isLoading ? "Loading…" : `${data?.total ?? 0} vehicles`}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sort</span>
                    <Select
                        value={sort}
                        onValueChange={(v) => {
                            setSort(v);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="h-9 w-48 rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="created_desc">Newest</SelectItem>
                            <SelectItem value="price_asc">Price: Low to High</SelectItem>
                            <SelectItem value="price_desc">Price: High to Low</SelectItem>
                            <SelectItem value="model_asc">Model: A–Z</SelectItem>
                            <SelectItem value="model_desc">Model: Z–A</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* GRID (fixed keys) */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Loading skeletons */}
                {isLoading &&
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={`skel-${i}`} className="rounded-2xl">
                            <div className="relative h-44 w-full animate-pulse bg-muted" />
                            <CardContent className="p-4">
                                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                                <div className="mt-3 h-8 w-1/3 animate-pulse rounded bg-muted" />
                            </CardContent>
                        </Card>
                    ))}

                {/* Loaded items */}
                {!isLoading &&
                    (data?.items ?? []).map((v) => (
                        <VehicleCard
                            key={`veh-${v.id ?? v.VehicleId}`}
                            id={v.id ?? v.VehicleId}
                            model={v.model ?? v.Model}
                            price={v.rentPerDay ?? v.RentPerDay}
                            // Derive a status if API doesn't send one
                            status={
                                (v.status ??
                                    (typeof v.remaining === "number"
                                        ? v.remaining > 0
                                            ? "Available"
                                            : "Rented"
                                        : "Available")) as "Available" | "Rented"
                            }
                            rating={v.rating ?? v.Rating}
                            planName={v.planName ?? v.plan?.planName}
                            image={
                                v.vehicleImagesUrls?.[0] ||
                                v.images?.[0] ||
                                "/images/vehicles/placeholder.webp"
                            }
                        />
                    ))}
            </div>

            {/* PAGINATION */}
            <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-xl"
                >
                    Prev
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-xl"
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
