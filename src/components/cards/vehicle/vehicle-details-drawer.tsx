"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Vehicle } from '@/lib/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../../ui/sheet';
import { Skeleton } from '../../ui/skeleton';
import Image from 'next/image';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../../ui/carousel';
import { Table, TableBody, TableCell, TableRow } from '../../ui/table';
import { Star, Zap, Gauge, BatteryCharging, CheckCircle, MapPin, Package, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Calendar } from '../../ui/calendar';
import { format, addDays, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface VehicleDetailsDrawerProps {
    vehicleId: string;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function VehicleDetailsDrawer({ vehicleId, isOpen, onOpenChange }: VehicleDetailsDrawerProps) {
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [availability, setAvailability] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();

    useEffect(() => {
        if (isOpen && vehicleId) {
            const fetchDetails = async () => {
                setIsLoading(true);
                try {
                    const [vehicleRes, availRes] = await Promise.all([
                        fetch(`/api/vehicles/${vehicleId}`),
                        fetch(`/api/vehicles/${vehicleId}/availability?from=${format(new Date(), 'yyyy-MM-dd')}&to=${format(addDays(new Date(), 13), 'yyyy-MM-dd')}`)
                    ]);
                    if (!vehicleRes.ok) throw new Error("Failed to fetch vehicle details.");
                    if (!availRes.ok) throw new Error("Failed to fetch availability.");

                    const vehicleData = await vehicleRes.json();
                    const availData = await availRes.json();

                    setVehicle(vehicleData);
                    const availMap = availData.reduce((acc: any, curr: any) => {
                        acc[curr.date] = curr.available;
                        return acc;
                    }, {});
                    setAvailability(availMap);

                } catch (error) {
                    console.error(error);
                    toast({ title: 'Error', description: 'Could not load vehicle details.', variant: 'destructive' });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchDetails();
        }
    }, [isOpen, vehicleId]);

    const getBookNowLink = () => {
        if (!vehicle) return "/book";
        const params = new URLSearchParams();
        params.set('vehicle', vehicle.id);
        if (selectedDate) {
            params.set('from', format(selectedDate, 'yyyy-MM-dd'));
            params.set('to', format(selectedDate, 'yyyy-MM-dd')); // Assuming 1-day rental for now
        }
        return `/book?${params.toString()}`;
    }

    const renderContent = () => {
        if (isLoading) {
            return <VehicleDetailsSkeleton />;
        }
        if (!vehicle) {
            return <div className="p-6 text-center">Vehicle not found.</div>;
        }

        return (
            <>
                <div className="p-0 overflow-y-auto">
                    <SheetHeader className="p-6 pb-0">
                        <SheetTitle className="text-2xl">{vehicle.name}</SheetTitle>
                        <SheetDescription>{vehicle.brand}</SheetDescription>
                    </SheetHeader>

                    <Carousel className="w-full my-4">
                        <CarouselContent>
                            {vehicle.images.map((img, i) => (
                                <CarouselItem key={i}>
                                    <Image src={img} alt={`${vehicle.name} view ${i+1}`} width={800} height={600} className="w-full aspect-video object-cover" />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-4"/>
                        <CarouselNext className="right-4"/>
                    </Carousel>

                    <div className="p-6 space-y-6">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Specifications</h3>
                            <Table>
                                <TableBody>
                                    <TableRow><TableCell>Range</TableCell><TableCell>{vehicle.specs.rangeKm} km</TableCell></TableRow>
                                    <TableRow><TableCell>Top Speed</TableCell><TableCell>{vehicle.specs.topSpeedKmph} km/h</TableCell></TableRow>
                                    <TableRow><TableCell>Battery</TableCell><TableCell>{vehicle.specs.battery}</TableCell></TableRow>
                                    <TableRow><TableCell>Charging Time</TableCell><TableCell>{vehicle.specs.chargingTimeHrs} hrs</TableCell></TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        <div>
                            <h3 className="font-semibold text-lg mb-2">Features</h3>
                            <ul className="grid grid-cols-2 gap-2 text-sm">
                                {vehicle.features.map(f => <li key={f} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> {f}</li>)}
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-lg mb-2">Availability Calendar</h3>
                            <p className="text-sm text-muted-foreground mb-4">Select a date to book this vehicle.</p>
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => isBefore(date, new Date()) || isBefore(date, addDays(new Date(), -1)) || isBefore(addDays(new Date(), 14), date) }
                                className="rounded-md border justify-center flex"
                                // components={{
                                //     DayContent: (props) => {
                                //         const dateKey = format(props.date, 'yyyy-MM-dd');
                                //         const availableCount = availability[dateKey];
                                //         const isAvailable = availableCount > 0;
                                //         return (
                                //             <div className="relative w-full h-full flex items-center justify-center">
                                //                 <span>{props.date.getDate()}</span>
                                //                 {availableCount !== undefined && (
                                //                     <div className={cn("absolute bottom-0.5 h-1.5 w-1.5 rounded-full",
                                //                         availableCount > 3 ? 'bg-green-500' :
                                //                             availableCount > 0 ? 'bg-amber-500' : 'bg-red-500'
                                //                     )}/>
                                //                 )}
                                //             </div>
                                //         );
                                //     }
                                // }}
                            />
                            <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-500" /> Available</div>
                                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-amber-500" /> Limited</div>
                                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-red-500" /> Sold Out</div>
                            </div>
                        </div>
                    </div>
                </div>
                <SheetFooter className="p-6 border-t bg-background sticky bottom-0">
                    <Button asChild className="w-full" disabled={!selectedDate || (selectedDate && availability[format(selectedDate, 'yyyy-MM-dd')] === 0)}>
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
