// src/components/landing/featured-vehicles.tsx
"use client";

import useSWR from "swr";
import Link from "next/link";
import VehicleCard from "@/components/vehicles/vehicle-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ApiVehicle = {
    id: number;
    model: string;
    rentPerDay: number;
    planId: number;
    planName?: string;
    vehicleImagesUrls?: string[];
    images?: string[];     // bwd compat
    quantity: number;
    remaining: number;
};

const fetcher = (u: string) =>
    fetch(u).then(async (r) => {
        if (!r.ok) throw new Error("Failed to load vehicles");
        return r.json();
    });

export default function FeaturedVehicles() {
    // Your API already filters to available (Quantity > 0), so we only need a small page.
    const { data, error, isLoading } = useSWR<{ items: ApiVehicle[] }>(
        "/api/v1/public/vehicles?page=1&pageSize=6",
        fetcher
    );

    const items = data?.items ?? [];

    return (
        <section id="featured-vehicles" className="py-16 lg:py-24 bg-background">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Badge className="rounded-xl bg-secondary text-secondary-foreground">Fleet</Badge>
                        <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-secondary dark:text-white">
                            Featured Vehicles
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            Crowd favorites—great value, great range, ready to ride today.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild className="rounded-xl">
                            <Link href="/vehicles">Browse all vehicles</Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-xl">
                            <Link href="/book">Quick book</Link>
                        </Button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {isLoading
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <Card key={`skeleton-${i}`} className="rounded-2xl overflow-hidden">
                                <div className="relative h-44 w-full bg-muted animate-pulse" />
                                <CardContent className="p-4">
                                    <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                                    <div className="mt-3 h-8 w-1/3 bg-muted animate-pulse rounded" />
                                </CardContent>
                            </Card>
                        ))
                        : error
                            ? (
                                <Card className="sm:col-span-2 lg:col-span-3 rounded-2xl">
                                    <CardContent className="p-6 text-center text-muted-foreground">
                                        Couldn’t load featured vehicles. Please try again.
                                    </CardContent>
                                </Card>
                            )
                            : items.length
                                ? items.map((v) => (
                                    <VehicleCard
                                        key={`veh-${v.id}`}
                                        id={v.id}
                                        model={v.model}
                                        price={v.rentPerDay}
                                        // compute status from remaining; your route doesn’t return explicit status
                                        status={v.remaining > 0 ? "Available" : "Rented"}
                                        rating={undefined} // keep optional; your route doesn’t return rating
                                        planName={v.planName}
                                        image={
                                            v.vehicleImagesUrls?.[0] ||
                                            v.images?.[0] ||
                                            "/images/vehicles/placeholder.webp"
                                        }
                                    />
                                ))
                                : (
                                    <Card className="sm:col-span-2 lg:col-span-3 rounded-2xl">
                                        <CardContent className="p-6 text-center text-muted-foreground">
                                            No vehicles to feature yet. Check back soon or{" "}
                                            <Link href="/vehicles" className="text-primary underline">see the full fleet</Link>.
                                        </CardContent>
                                    </Card>
                                )}
                </div>

                {/* CTA */}
                <div className="mt-8 flex justify-center">
                    <Button variant="outline" asChild className="rounded-xl">
                        <Link href="/vehicles">See the full fleet</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
