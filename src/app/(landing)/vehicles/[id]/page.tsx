// app/vehicles/[id]/page.tsx
"use client";
import useSWR from "swr";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function VehicleDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const { data, isLoading } = useSWR<any>(`/api/v1/public/vehicles/${id}`, fetcher);

    const v = data?.vehicle ?? data; // support either shape
    const images: string[] =
        v?.vehicleImagesUrls ?? v?.images ?? [""];

    return (
        <div className="container mx-auto px-4 py-8">
            {/* gallery */}
            <div className="grid gap-6 lg:grid-cols-2">
                <div>
                    <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted">
                        {!isLoading && (
                            <Image
                                src={images[0]}
                                alt={v?.model ?? "Vehicle"}
                                fill
                                className="object-cover"
                            />
                        )}
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                        {images.slice(0, 8).map((src, idx) => (
                            <div key={`thumb-${idx}`} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                                <Image src={src} alt={`${v?.model} ${idx + 1}`} fill className="object-cover" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">{v?.planName ?? v?.plan?.planName ?? "Plan"}</Badge>
                        <Badge>{(v?.remaining ?? 1) > 0 ? "Available" : "Rented"}</Badge>
                    </div>
                    <h1 className="font-headline text-3xl">{v?.model ?? "Vehicle"}</h1>
                    <div className="text-2xl font-bold">₹{Number(v?.rentPerDay ?? 0).toLocaleString("en-IN")}/day</div>

                    {/* specs */}
                    <Card className="rounded-2xl">
                        <CardContent className="p-4 grid grid-cols-2 gap-3 text-sm">
                            {[
                                ["Range", v?.specs?.rangeKm ?? v?.specs_RangeKm ? `${v?.specs?.rangeKm ?? v?.specs_RangeKm} km` : "—"],
                                ["Top speed", v?.specs?.topSpeedKmph ?? v?.specs_TopSpeedKmph ? `${v?.specs?.topSpeedKmph ?? v?.specs_TopSpeedKmph} km/h` : "—"],
                                ["Battery", v?.specs?.battery ?? v?.specs_Battery ?? "—"],
                                ["Charge time", v?.specs?.chargingTimeHrs ?? v?.specs_ChargingTimeHrs ? `${v?.specs?.chargingTimeHrs ?? v?.specs_ChargingTimeHrs} hrs` : "—"],
                            ].map(([label, value], i) => (
                                <div key={`spec-${i}`} className="flex items-center justify-between rounded-md bg-muted/40 p-2">
                                    <span className="text-muted-foreground">{label}</span>
                                    <span className="font-medium">{value as string}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="flex gap-2">
                        <Button className="rounded-xl" asChild><a href={`/book?vehicle=${id}`}>Book now</a></Button>
                        <Button className="rounded-xl" variant="outline" asChild><a href="/faq">FAQ</a></Button>
                    </div>
                </div>
            </div>

            {/* tags */}
            {Array.isArray(v?.tags) && v.tags.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                    {v.tags.map((t: string) => (
                        <Badge key={`tag-${t}`} variant="outline">{t}</Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
