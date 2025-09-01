'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Eye, Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import { VehicleForm } from '@/components/admin/forms/vehicle-form';
import { useVehicle } from '@/hooks/api/use-vehicles';
import type { Vehicle } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const { toast } = useToast();

    const { vehicle, isLoading, isError, remove, update } = useVehicle(params.id);

    const onEdited = () => {
        setEditing(false);
        router.refresh();
    };

    if (isLoading) {
        return <div className="p-6 text-sm text-muted-foreground">Loading vehicle…</div>;
    }

    if (isError || !vehicle) {
        return (
            <div className="p-6 text-sm text-destructive">
                Failed to load vehicle.
                <div className="mt-3">
                    <Button variant="outline" asChild>
                        <Link href="/admin/vehicles"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const handleAvailabilityToggle = async (checked: boolean) => {
        try {
            const newStatus = checked ? 'Available' : 'Rented';
            await update({ status: newStatus });
            toast({
                title: 'Success',
                description: `Vehicle marked as ${newStatus}.`,
            });
        } catch (e: any) {
            toast({
                title: 'Error',
                description: String(e?.message || e),
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${vehicle.model} (${vehicle.uniqueCode})`}
                description={`Vehicle #${vehicle.vehicleId} — manage details, status, and specifications.`}
            >
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/admin/vehicles"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
                    </Button>

                    {!editing ? (
                        <Button onClick={() => setEditing(true)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                    ) : (
                        <Button variant="secondary" onClick={() => setEditing(false)}>
                            <Eye className="mr-2 h-4 w-4" /> View
                        </Button>
                    )}

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete vehicle “{vehicle.model} ({vehicle.uniqueCode})”?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. Existing rentals won’t be affected, but this vehicle will no longer appear in your fleet.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={async () => {
                                        await remove();
                                        router.push('/admin/vehicles');
                                    }}
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </PageHeader>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left: Details / Form */}
                <div className="md:col-span-2">
                    {!editing ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Vehicle Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <Detail label="Unique Code" value={vehicle.uniqueCode} />
                                    <Detail label="Model" value={vehicle.model} />
                                    <Detail label="VIN / Serial" value={vehicle.vinNumber} />
                                    <Detail label="Plan" value={vehicle.plan?.planName ?? `Plan #${vehicle.planId}`} />
                                    <Detail label="Quantity" value={String(vehicle.quantity)} />
                                    <div>
                                        <div className="text-sm text-muted-foreground">Status</div>
                                        <Badge variant={vehicle.status === 'Available' ? 'default' : 'secondary'} className="mt-1">
                                            {vehicle.status}
                                        </Badge>
                                    </div>
                                    <Detail label="Rent / Day" value={`₹${vehicle.rentPerDay}`} />
                                </div>

                                <div>
                                    <div className="text-sm text-muted-foreground">Specs</div>
                                    <ul className="list-disc pl-5 space-y-1 mt-2 text-sm">
                                        {vehicle.specs?.rangeKm && <li>Range: {vehicle.specs.rangeKm} km</li>}
                                        {vehicle.specs?.topSpeedKmph && <li>Top Speed: {vehicle.specs.topSpeedKmph} km/h</li>}
                                        {vehicle.specs?.battery && <li>Battery: {vehicle.specs.battery}</li>}
                                        {vehicle.specs?.chargingTimeHrs && <li>Charging Time: {vehicle.specs.chargingTimeHrs} hrs</li>}
                                    </ul>
                                    {!vehicle.specs && <p className="text-muted-foreground text-sm">—</p>}
                                </div>

                                <div>
                                    <div className="text-sm text-muted-foreground">Images</div>
                                    {vehicle.vehicleImagesUrls?.length ? (
                                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {vehicle.vehicleImagesUrls.map((src, i) => (
                                                <img
                                                    key={i}
                                                    src={src}
                                                    alt={`vehicle-img-${i}`}
                                                    className="rounded-md border h-28 w-full object-cover"
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">No images uploaded</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Edit Vehicle</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <VehicleForm vehicle={vehicle} onSuccess={onEdited} />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right: Availability toggle */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Availability</CardTitle>
                            <CardDescription>Toggle availability for new rentals.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="availability-toggle"
                                    checked={vehicle.status === 'Available'}
                                    onCheckedChange={handleAvailabilityToggle}
                                    disabled={vehicle.status === 'Rented'} // optional: prevent toggling if actively rented
                                />
                                <Label htmlFor="availability-toggle">
                                    {vehicle.status === 'Available' ? 'Available' : 'Unavailable'}
                                </Label>
                            </div>
                            {vehicle.status === 'Rented' && (
                                <p className="text-sm text-destructive mt-2">
                                    Cannot change availability while rental is ongoing.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

/* Helper component for consistency */
function Detail({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-sm">{value ?? '—'}</div>
        </div>
    );
}
