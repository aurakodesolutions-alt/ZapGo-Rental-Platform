"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Stars from "./stars";

export type VehicleCardProps = {
    id: number;
    model: string;
    price: number;
    status: "Available" | "Rented";
    rating?: number;
    image?: string;
    planName?: string;
};

export default function VehicleCard(props: VehicleCardProps) {
    const { id, model, price, status, rating, image, planName } = props;
    return (
        <Card className="group overflow-hidden rounded-2xl transition-shadow hover:shadow-lg">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                <Image
                    src={image || "/images/vehicles/placeholder.webp"}
                    alt={model}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3 flex gap-2">
                    {planName ? <Badge className="rounded-xl bg-secondary text-secondary-foreground">{planName}</Badge> : null}
                    <Badge variant={status === "Available" ? "default" : "secondary"} className="rounded-xl capitalize">
                        {status.toLowerCase()}
                    </Badge>
                </div>
            </div>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="line-clamp-1 font-semibold">{model}</h3>
                        {typeof rating === "number" ? (
                            <div className="mt-1"><Stars value={rating} /></div>
                        ) : null}
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-muted-foreground">from</div>
                        <div className="text-lg font-bold">₹{Number(price).toLocaleString("en-IN")}/day</div>
                    </div>
                </div>
                <div className="mt-3 flex gap-2">
                    <Button asChild size="sm" className="rounded-xl">
                        <Link href={`/vehicles/${id}`}>View</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="rounded-xl" disabled={status !== "Available"}>
                        <Link href={`/book?vehicle=${id}`}>Book</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
