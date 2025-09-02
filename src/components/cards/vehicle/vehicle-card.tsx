"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { Vehicle } from "@/lib/types";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Star, Zap, Gauge } from "lucide-react";
import { Skeleton } from "../../ui/skeleton";
import { VehicleDetailsDrawer } from "./vehicle-details-drawer";

const PLACEHOLDER_IMG =
    "https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1200&auto=format&fit=crop"; // swap to your own

function formatINR(n?: number) {
    return (Number(n || 0)).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
    });
}

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const primaryImage = useMemo(() => {
        const raw =
            (Array.isArray(vehicle.vehicleImagesUrls) && vehicle.vehicleImagesUrls.length
                ? vehicle.vehicleImagesUrls
                : (vehicle as any).images) || [];

        let first: string | undefined;

        if (Array.isArray(raw)) {
            first = raw[0];
            // If the first element is itself a JSON string like '["/a","/b"]', parse it:
            if (typeof first === "string" && first.trim().startsWith("[")) {
                try {
                    const parsed = JSON.parse(first);
                    if (Array.isArray(parsed) && parsed.length) first = String(parsed[0]);
                } catch {}
            }
        } else if (typeof raw === "string") {
            // Could be JSON or CSV
            const s = raw.trim();
            if (s.startsWith("[")) {
                try {
                    const parsed = JSON.parse(s);
                    if (Array.isArray(parsed) && parsed.length) first = String(parsed[0]);
                } catch {
                    first = s;
                }
            } else {
                first = s.split(",")[0]?.trim();
            }
        }

        // Ensure Next/Image-friendly src
        if (first && !first.startsWith("/") && !/^https?:\/\//i.test(first)) {
            first = `/${first.replace(/^\/+/, "")}`;
        }

        return first || PLACEHOLDER_IMG;
    }, [vehicle]);


    const model = vehicle.model || "Scooter";
    const planName =
        (vehicle.plan as any)?.PlanName ||
        (vehicle.plan as any)?.name ||
        (vehicle as any).planName ||
        `Plan #${vehicle.planId}`;

    const rangeKm =
        vehicle.specs?.rangeKm ??
        vehicle.specs_RangeKm ??
        undefined;

    const topSpeed =
        vehicle.specs?.topSpeedKmph ??
        vehicle.specs_TopSpeedKmph ??
        undefined;

    const rating = Number(vehicle.rating || 0);
    const filledStars = Math.round(Math.min(5, Math.max(0, rating)));

    return (
        <>
            <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="p-0 relative">
                    <Image
                        src={primaryImage}
                        alt={model}
                        width={600}
                        height={400}
                        className="w-full h-48 object-cover"
                        priority={false}
                    />
                    {!!vehicle.tags?.length && (
                        <div className="absolute top-2 left-2 flex gap-2">
                            {vehicle.tags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="capitalize backdrop-blur-sm bg-black/30 text-white border-white/20"
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardHeader>

                <CardContent className="p-4 flex-grow">
                    <CardDescription>{planName}</CardDescription>
                    <CardTitle className="text-xl mb-2">{model}</CardTitle>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        {typeof rangeKm === "number" && (
                            <div className="flex items-center gap-1">
                                <Gauge className="h-4 w-4 text-primary" /> {rangeKm}km Range
                            </div>
                        )}
                        {typeof topSpeed === "number" && (
                            <div className="flex items-center gap-1">
                                <Zap className="h-4 w-4 text-primary" /> {topSpeed}km/h Top Speed
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                                key={i}
                                className={`h-4 w-4 ${
                                    i < filledStars
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300"
                                }`}
                            />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">
              ({rating.toFixed(1)})
            </span>
                    </div>
                </CardContent>

                <CardFooter className="p-4 bg-muted/30 dark:bg-muted/20 flex-col items-start gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="default">₹{formatINR(vehicle.rentPerDay)}/day</Badge>
                        <Badge variant="outline">Qty: {vehicle.quantity ?? 0}</Badge>
                        {/* You can add "In Stock" badge if you compute remaining elsewhere */}
                    </div>

                    <div className="w-full flex gap-2">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setIsDrawerOpen(true)}
                        >
                            View Details
                        </Button>
                        <Button asChild className="w-full">
                            <Link href={`/book?vehicle=${vehicle.id}`}>Book Now</Link>
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            <VehicleDetailsDrawer
                vehicleId={vehicle.id.toString()}
                isOpen={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
            />
        </>
    );
}

export function VehicleCardSkeleton() {
    return (
        <Card className="flex flex-col overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardContent className="p-4">
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-6 w-3/4 mb-4" />
                <div className="flex gap-4 mb-4">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-5 w-1/3" />
                </div>
                <Skeleton className="h-5 w-1/2" />
            </CardContent>
            <CardFooter className="p-4 bg-muted/30 dark:bg-muted/20">
                <Skeleton className="h-9 w-full" />
            </CardFooter>
        </Card>
    );
}
