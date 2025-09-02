"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Vehicle } from "@/lib/types";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "../../ui/sheet";
import { Skeleton } from "../../ui/skeleton";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "../../ui/carousel";
import { Table, TableBody, TableCell, TableRow } from "../../ui/table";
import { Star, Zap, Gauge } from "lucide-react";
import { Calendar } from "../../ui/calendar";
import { format, isBefore, startOfDay } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface VehicleDetailsDrawerProps {
    vehicleId: string | number;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

const PLACEHOLDER_IMG =
    "https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1200&auto=format&fit=crop";

function formatINR(n?: number) {
    return (Number(n || 0)).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function VehicleDetailsDrawer({
                                         vehicleId,
                                         isOpen,
                                         onOpenChange,
                                     }: VehicleDetailsDrawerProps) {
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();

    useEffect(() => {
        if (!isOpen || !vehicleId) return;

        const fetchDetails = async () => {
            setIsLoading(true);
            try {
                // Expect API shape: { id, model, vehicleImagesUrls[], rentPerDay, planId, planName?, quantity, specs?, rating?, tags? }
                const res = await fetch(`/api/v1/public/vehicles/${vehicleId}`);
                if (!res.ok) throw new Error("Failed to fetch vehicle details.");
                const v = await res.json();
                setVehicle(v);
            } catch (err) {
                console.error(err);
                toast({
                    title: "Error",
                    description: "Could not load vehicle details.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [isOpen, vehicleId]);

    const primaryImage = useMemo(() => {
        if (!vehicle) return PLACEHOLDER_IMG;
        const arr =
            vehicle.vehicleImagesUrls ||
            (Array.isArray((vehicle as any).images) ? (vehicle as any).images : []);
        return arr?.[0] || PLACEHOLDER_IMG;
    }, [vehicle]);

    const planName = useMemo(() => {
        if (!vehicle) return "";
        return (
            (vehicle.plan as any)?.PlanName ||
            (vehicle.plan as any)?.name ||
            (vehicle as any).planName ||
            `Plan #${vehicle.planId}`
        );
    }, [vehicle]);

    const rangeKm =
        vehicle?.specs?.rangeKm ?? vehicle?.specs_RangeKm ?? undefined;
    const topSpeed =
        vehicle?.specs?.topSpeedKmph ?? vehicle?.specs_TopSpeedKmph ?? undefined;

    const rating = Number(vehicle?.rating || 0);
    const filledStars = Math.round(Math.min(5, Math.max(0, rating)));

    const featureList = useMemo(() => {
        if (!vehicle) return [] as string[];
        // Prefer explicit tags. If none, try pulling from plan.Features (CSV) when present.
        if (Array.isArray(vehicle.tags) && vehicle.tags.length) return vehicle.tags;
        const planFeatures = (vehicle.plan as any)?.Features as string | undefined;
        if (planFeatures) {
            // tolerate CSV or JSON array
            try {
                const parsed = JSON.parse(planFeatures);
                if (Array.isArray(parsed)) return parsed.map(String);
            } catch {
                // not JSON; treat as CSV
                return planFeatures
                    .split(/[,|]\s*/g)
                    .map((x) => x.trim())
                    .filter(Boolean);
            }
        }
        return [];
    }, [vehicle]);

    const getBookNowLink = () => {
        const base = "/book";
        if (!vehicle) return base;
        const params = new URLSearchParams();
        params.set("vehicle", String(vehicle.id));
        if (selectedDate) {
            const d = format(selectedDate, "yyyy-MM-dd");
            params.set("from", d);
            params.set("to", d); // 1-day default; your wizard can extend this
        }
        return `${base}?${params.toString()}`;
    };

    const renderContent = () => {
        if (isLoading) return <VehicleDetailsSkeleton />;
        if (!vehicle) return <div className="p-6 text-center">Vehicle not found.</div>;

        return (
            <>
                <div className="p-0 overflow-y-auto">
                    <SheetHeader className="p-6 pb-0">
                        <SheetTitle className="text-2xl">{vehicle.model || "Scooter"}</SheetTitle>
                        <SheetDescription>{planName}</SheetDescription>
                    </SheetHeader>

                    <Carousel className="w-full my-4">
                        <CarouselContent>
                            {(vehicle.vehicleImagesUrls && vehicle.vehicleImagesUrls.length
                                    ? vehicle.vehicleImagesUrls
                                    : [primaryImage]
                            ).map((img, i) => (
                                <CarouselItem key={i}>
                                    <Image
                                        src={img}
                                        alt={`${vehicle.model || "Scooter"} view ${i + 1}`}
                                        width={800}
                                        height={600}
                                        className="w-full aspect-video object-cover"
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-4" />
                        <CarouselNext className="right-4" />
                    </Carousel>

                    <div className="p-6 space-y-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="default">₹{formatINR(vehicle.rentPerDay)}/day</Badge>
                            <Badge variant={vehicle.quantity > 0 ? "outline" : "destructive"}>
                                {vehicle.quantity > 0 ? `In Stock: ${vehicle.quantity}` : "Out of Stock"}
                            </Badge>
                        </div>

                        <div>
                            <h3 className="font-semibold text-lg mb-2">Specifications</h3>
                            <Table>
                                <TableBody>
                                    {typeof rangeKm === "number" && (
                                        <TableRow>
                                            <TableCell>Range</TableCell>
                                            <TableCell>{rangeKm} km</TableCell>
                                        </TableRow>
                                    )}
                                    {typeof topSpeed === "number" && (
                                        <TableRow>
                                            <TableCell>Top Speed</TableCell>
                                            <TableCell>{topSpeed} km/h</TableCell>
                                        </TableRow>
                                    )}
                                    {!!vehicle.specs_Battery && (
                                        <TableRow>
                                            <TableCell>Battery</TableCell>
                                            <TableCell>{vehicle.specs_Battery}</TableCell>
                                        </TableRow>
                                    )}
                                    {typeof vehicle.specs_ChargingTimeHrs === "number" && (
                                        <TableRow>
                                            <TableCell>Charging Time</TableCell>
                                            <TableCell>{vehicle.specs_ChargingTimeHrs} hrs</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {!!featureList.length && (
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Features</h3>
                                <ul className="grid grid-cols-2 gap-2 text-sm">
                                    {featureList.map((f) => (
                                        <li key={f} className="flex items-center gap-2">
                                            {/* using Gauge icon subtly; swap to CheckCircle if you prefer */}
                                            <Gauge className="h-4 w-4 text-primary" /> {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div>
                            <h3 className="font-semibold text-lg mb-2">Pick a date</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Choose your start date to continue. Availability is based on current stock.
                            </p>
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="rounded-md border justify-center flex"
                                disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
                            />
                            <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full bg-green-500" /> In Stock
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full bg-amber-500" /> Limited (Qty ≤ 5)
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full bg-red-500" /> Out of Stock
                                </div>
                            </div>
                        </div>

                        {/* Ratings row (optional visual) */}
                        <div className="flex items-center gap-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                        i < filledStars ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                    }`}
                                />
                            ))}
                            <span className="text-xs text-muted-foreground">({rating.toFixed(1)})</span>
                        </div>
                    </div>
                </div>

                <SheetFooter className="p-6 border-t bg-background sticky bottom-0">
                    <Button
                        asChild
                        className="w-full"
                        disabled={!selectedDate || (vehicle.quantity || 0) <= 0}
                    >
                        <Link href={getBookNowLink()}>Book This Vehicle</Link>
                    </Button>
                </SheetFooter>
            </>
        );
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl flex flex-col p-0 gap-0">
                {renderContent()}
            </SheetContent>
        </Sheet>
    );
}

function VehicleDetailsSkeleton() {
    return (
        <div className="space-y-6 p-6">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="w-full h-64" />
            <div className="space-y-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-16 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-40 w-full" />
            </div>
        </div>
    );
}
