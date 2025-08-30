"use client"

import Link from 'next/link';
import Image from 'next/image';
import { Vehicle } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Star, Zap, Gauge, BatteryCharging } from 'lucide-react';
import { Skeleton } from '../../ui/skeleton';
import { VehicleDetailsDrawer } from './vehicle-details-drawer';
import { useState } from 'react';

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    return (
        <>
            <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="p-0 relative">
                    <Image
                        src={vehicle.thumbnail}
                        alt={vehicle.name}
                        width={600}
                        height={400}
                        className="w-full h-48 object-cover"
                        data-ai-hint={`${vehicle.brand} ${vehicle.name}`}
                    />
                    <div className="absolute top-2 left-2 flex gap-2">
                        {vehicle.tags?.map(tag => (
                            <Badge key={tag} variant="secondary" className="capitalize backdrop-blur-sm bg-black/30 text-white border-white/20">{tag}</Badge>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow">
                    <CardDescription>{vehicle.brand}</CardDescription>
                    <CardTitle className="text-xl mb-2">{vehicle.name}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1"><Gauge className="h-4 w-4 text-primary"/> {vehicle.specs.rangeKm}km Range</div>
                        <div className="flex items-center gap-1"><Zap className="h-4 w-4 text-primary"/> {vehicle.specs.topSpeedKmph}km/h Top Speed</div>
                    </div>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < (vehicle.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">({vehicle.rating})</span>
                    </div>
                </CardContent>
                <CardFooter className="p-4 bg-muted/30 dark:bg-muted/20 flex-col items-start gap-4">
                    <div className="flex gap-2">
                        {vehicle.compatiblePlans.map(plan => (
                            <Badge key={plan} variant={plan === 'Pro' ? 'default' : 'outline'}>{plan}</Badge>
                        ))}
                    </div>
                    <div className="w-full flex gap-2">
                        <Button variant="outline" className="w-full" onClick={() => setIsDrawerOpen(true)}>View Details</Button>
                        <Button asChild className="w-full">
                            <Link href={`/book?vehicle=${vehicle.id}`}>Book Now</Link>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
            <VehicleDetailsDrawer vehicleId={vehicle.id} isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
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
