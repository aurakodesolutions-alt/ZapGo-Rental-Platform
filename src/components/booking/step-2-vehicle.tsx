"use client";

import { useMemo, useState } from "react";
import { useBookingWizard } from "./booking-provider";
import { Vehicle } from "@/lib/types";
import { VehicleCard, VehicleCardSkeleton } from "../cards/vehicle/vehicle-card";
import {
    Pagination, PaginationContent, PaginationItem, PaginationLink,
    PaginationNext, PaginationPrevious,
} from "../ui/pagination";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { SearchX } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useVehicles } from "@/hooks/public/useVehicles";

interface Step2VehicleProps { onNext: () => void; }

function toISODate(value?: Date | string | null) {
    if (!value) return undefined;
    if (typeof value === "string") return value.slice(0, 10);
    try { return value.toISOString().slice(0, 10); } catch { return undefined; }
}

// 👉 helper to extract a consistent vehicleId/model/rentPerDay
function normVehicle(v: any) {
    const vehicleId = Number(v?.vehicleId ?? v?.id ?? v?.VehicleId ?? 0) || undefined;
    const model = v?.model ?? v?.Model ?? v?.name ?? "";
    const rentPerDay = Number(v?.rentPerDay ?? v?.RentPerDay ?? 0) || 0;
    const planId = v?.planId ?? v?.PlanId ?? undefined;
    return { ...v, vehicleId, model, rentPerDay, planId };
}

export function Step2_Vehicle({ onNext }: Step2VehicleProps) {
    const { draft, setDraft } = useBookingWizard();

    const [page, setPage] = useState(1);
    const pageSize = 6;

    const from = useMemo(() => toISODate(draft?.dates?.from), [draft?.dates?.from]);
    const to   = useMemo(() => toISODate(draft?.dates?.to),   [draft?.dates?.to]);
    const planId = undefined;

    const {
        vehicles = [], total = 0, isLoading, error,
    }: { vehicles: Vehicle[]; total: number; isLoading: boolean; error: any } =
        useVehicles({ from, to, planId, page, pageSize });

    const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setPage(newPage);
    };

    const handleSelectVehicle = (vehicle: Vehicle) => {
        const normalized = normVehicle(vehicle);
        setDraft({ vehicle: normalized });
        toast({ title: "Scooter Selected!", description: `${normalized.model} has been added to your booking.` });
        onNext();
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Choose Your Scooter</h1>
                <p className="text-muted-foreground">Select from our available fleet in {draft.city || "Siliguri"}.</p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                    {[...Array(6)].map((_, i) => <VehicleCardSkeleton key={i} />)}
                </div>
            ) : error ? (
                <Alert variant="destructive" className="mt-8">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error?.message || "Failed to load vehicles."}</AlertDescription>
                </Alert>
            ) : (vehicles?.length || 0) === 0 ? (
                <Alert className="mt-8">
                    <SearchX className="h-4 w-4" />
                    <AlertTitle>No Vehicles Found</AlertTitle>
                    <AlertDescription>
                        We couldn't find any vehicles matching your criteria for {draft.city}. Try adjusting your dates or plan.
                    </AlertDescription>
                </Alert>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                        {vehicles
                            .filter((v: any) => (typeof (v as any).remaining === "number" ? (v as any).remaining > 0 : true))
                            .map((vehicle: any) => {
                                const id = vehicle?.vehicleId ?? vehicle?.id ?? vehicle?.VehicleId ?? vehicle?.UniqueCode ?? `v-${vehicle?.model ?? ""}`;
                                return (
                                    <div key={String(id)} onClick={() => handleSelectVehicle(vehicle)} className="cursor-pointer">
                                        <VehicleCard vehicle={vehicle} />
                                    </div>
                                );
                            })}
                    </div>

                    {totalPages > 1 && (
                        <Pagination className="mt-12">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); handlePageChange(page - 1); }}
                                        aria-disabled={page <= 1}
                                    />
                                </PaginationItem>
                                {[...Array(totalPages)].map((_, i) => (
                                    <PaginationItem key={i}>
                                        <PaginationLink
                                            href="#"
                                            onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }}
                                            isActive={page === i + 1}
                                        >
                                            {i + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); handlePageChange(page + 1); }}
                                        aria-disabled={page >= totalPages}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </>
            )}
        </div>
    );
}
