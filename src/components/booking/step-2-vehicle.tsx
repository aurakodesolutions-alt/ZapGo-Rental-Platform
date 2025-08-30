"use client"

import { useState, useEffect } from 'react';
import { useBookingWizard } from './booking-provider';
import { Vehicle } from '@/lib/types';
import { VehicleCard, VehicleCardSkeleton } from '../cards/vehicle/vehicle-card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../ui/pagination';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { SearchX } from 'lucide-react';
import {vehicles as vehicleList} from "@/lib/constants";
import { toast } from '@/hooks/use-toast';

interface Step2VehicleProps {
    onNext: () => void;
}

export function Step2_Vehicle({ onNext }: Step2VehicleProps) {
    const { draft, setDraft } = useBookingWizard();
    const [vehicles, setVehicles] = useState<Vehicle[]>(vehicleList);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 6,
        total: 0,
    });
    const totalPages = Math.ceil(pagination.total / pagination.pageSize);

    // useEffect(() => {
    //     const fetchVehicles = async () => {
    //         setIsLoading(true);
    //         setError(null);
    //         try {
    //             const params = new URLSearchParams({
    //                 page: pagination.page.toString(),
    //                 pageSize: pagination.pageSize.toString(),
    //                 sort: 'popular',
    //                 city: draft.city || 'Siliguri',
    //             });
    //
    //             const response = await fetch(`/api/vehicles?${params.toString()}`);
    //             if (!response.ok) throw new Error('Failed to fetch vehicles.');
    //
    //             const data = await response.json();
    //             setVehicles(vehicles);
    //             setPagination(prev => ({ ...prev, total: data.total }));
    //         } catch (err: any) {
    //             setError(err.message || 'An unknown error occurred.');
    //         } finally {
    //             setIsLoading(false);
    //         }
    //     };
    //
    //     fetchVehicles();
    // }, [pagination.page, pagination.pageSize, draft.city]);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleSelectVehicle = async (vehicle: Vehicle) => {
        // TODO: Implement inventory hold
        setDraft({ vehicle });
        toast({ title: "Scooter Selected!", description: `${vehicle.name} has been added to your booking.`})
        onNext();
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Choose Your Scooter</h1>
                <p className="text-muted-foreground">Select from our available fleet in {draft.city || 'Siliguri'}.</p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                    {[...Array(3)].map((_, i) => <VehicleCardSkeleton key={i} />)}
                </div>
            ) : error ? (
                <Alert variant="destructive" className="mt-8">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : vehicles.length === 0 ? (
                <Alert className="mt-8">
                    <SearchX className="h-4 w-4" />
                    <AlertTitle>No Vehicles Found</AlertTitle>
                    <AlertDescription>
                        We couldn't find any vehicles matching your criteria for {draft.city}. Try adjusting your filters or changing city.
                    </AlertDescription>
                </Alert>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                        {vehicles.map(vehicle => (
                            <div key={vehicle.id} onClick={() => handleSelectVehicle(vehicle)} className="cursor-pointer">
                                <VehicleCard vehicle={vehicle} />
                            </div>
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <Pagination className="mt-12">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(pagination.page - 1)}} aria-disabled={pagination.page <= 1} />
                                </PaginationItem>
                                {[...Array(totalPages)].map((_, i) => (
                                    <PaginationItem key={i}>
                                        <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i + 1)}} isActive={pagination.page === i + 1}>
                                            {i + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(pagination.page + 1)}} aria-disabled={pagination.page >= totalPages}/>
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </>
            )}
        </div>
    );
}
