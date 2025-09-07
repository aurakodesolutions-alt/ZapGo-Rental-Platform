'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Pencil, Eye, Trash2, Star, DollarSign, Wrench, Calendar,
    Gauge, Battery, Zap, Hash, Box, Car, Tag, CircleCheckBig, TriangleAlert,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import { VehicleForm } from '@/components/admin/forms/vehicle-form';
import { useVehicle } from '@/hooks/api/use-vehicles';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ImgLike = string;

export default function VehicleDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { toast } = useToast();
    const { vehicle, isLoading, isError, remove, update } = useVehicle(params.id);
    const [editing, setEditing] = useState(false);

    // ✅ hooks declared unconditionally
    const images = useMemo<ImgLike[]>(
        () => (vehicle?.vehicleImagesUrls ?? []).filter(Boolean),
        [vehicle?.vehicleImagesUrls]
    );
    const [activeImg, setActiveImg] = useState(0);

    // ✅ this was the culprit — make sure it’s also above the early returns
    const tagList = useMemo<string[]>(() => {
        const tags = (vehicle as any)?.tags as unknown;

        if (Array.isArray(tags)) {
            return (tags as unknown[])
                .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
                .map((t) => t.trim());
        }

        if (typeof tags === 'string') {
            return tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);
        }

        return [];
    }, [vehicle?.tags]);


    if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading vehicle…</div>;
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

    const {
        model,
        uniqueCode,
        vehicleId,
        planId,
        plan,
        vinNumber,
        status,
        rentPerDay,
        quantity,
        rating,
        specs,
        lastServiceDate,
        serviceIntervalDays,
        isServiceDue,
        createdAt,
        updatedAt,
    } = vehicle as any;

    const fmtMoney = (n?: number | null) =>
        typeof n === 'number' ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';

    // Maintenance helpers (no hooks here)
    const lastService = lastServiceDate ? new Date(lastServiceDate) : null;
    const nextService =
        lastService && serviceIntervalDays
            ? new Date(lastService.getTime() + Number(serviceIntervalDays) * 24 * 60 * 60 * 1000)
            : null;
    const daysToNext =
        nextService ? Math.ceil((nextService.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null;

    const onEdited = () => {
        setEditing(false);
        router.refresh?.();
    };

    const handleAvailabilityToggle = async (checked: boolean) => {
        try {
            const newStatus = checked ? 'Available' : 'Rented';
            await update({ status: newStatus });
            toast({ title: 'Success', description: `Vehicle marked as ${newStatus}.` });
        } catch (e: any) {
            toast({ title: 'Error', description: String(e?.message || e), variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${model} (${uniqueCode})`}
                description={`Vehicle #${vehicleId} — manage details, status, and specifications.`}
            >
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/admin/vehicles"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
                    </Button>

                    {!editing ? (
                        <Button onClick={() => setEditing(true)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
                    ) : (
                        <Button variant="secondary" onClick={() => setEditing(false)}>
                            <Eye className="mr-2 h-4 w-4" /> View
                        </Button>
                    )}

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete vehicle “{model} ({uniqueCode})”?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. Existing rentals won’t be affected, but this vehicle
                                    will be removed from your fleet.
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

            {/* Stats strip */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard icon={DollarSign} label="Rent / Day" value={fmtMoney(rentPerDay)} />
                <StatCard icon={Box} label="Quantity" value={String(quantity ?? '—')} />
                <StatCard icon={Star} label="Rating" value={typeof rating === 'number' ? rating.toFixed(1) : '—'} />
                <StatCard
                    icon={status === 'Available' ? CircleCheckBig : TriangleAlert}
                    label="Status"
                    value={status}
                    tone={status === 'Available' ? 'ok' : 'warn'}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left: Overview + Gallery + Specs */}
                <div className="lg:col-span-2 space-y-6">
                    {!editing ? (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Overview</CardTitle>
                                    <CardDescription>Primary info, images, and quick labels.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Gallery */}
                                    <div className="rounded-xl border p-3">
                                        {images.length ? (
                                            <>
                                                <div className="aspect-[16/9] w-full overflow-hidden rounded-lg border bg-muted/30">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        alt="Vehicle image"
                                                        src={images[activeImg]}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                {images.length > 1 && (
                                                    <div className="mt-3 grid grid-cols-5 gap-2">
                                                        {images.map((src, idx) => (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                key={idx}
                                                                src={src}
                                                                alt={`thumb-${idx}`}
                                                                onClick={() => setActiveImg(idx)}
                                                                className={cn(
                                                                    'h-16 w-full cursor-pointer rounded-md object-cover border',
                                                                    activeImg === idx ? 'ring-2 ring-primary ring-offset-2' : 'opacity-80 hover:opacity-100'
                                                                )}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex h-48 items-center justify-center rounded-lg border bg-muted/20 text-sm text-muted-foreground">
                                                No images uploaded
                                            </div>
                                        )}
                                    </div>

                                    {/* Rows */}
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <InfoRow icon={Car} label="Model" value={model} />
                                        <InfoRow icon={Hash} label="Unique Code" value={uniqueCode} />
                                        <InfoRow icon={Hash} label="VIN / Serial" value={vinNumber ?? '—'} />
                                        <InfoRow icon={Tag} label="Plan" value={plan?.planName ?? `Plan #${planId}`} />
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <div className="mb-2 text-sm text-muted-foreground">Tags</div>
                                        {tagList.length ? (
                                            <div className="flex flex-wrap gap-2">
                                                {tagList.map((t:any) => (
                                                    <Badge key={t} variant="secondary">
                                                        {t}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">—</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Specifications</CardTitle>
                                    <CardDescription>Performance & tech details.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4 sm:grid-cols-2">
                                    <SpecItem icon={Gauge} label="Top Speed" value={specs?.topSpeedKmph ? `${specs.topSpeedKmph} km/h` : '—'} />
                                    <SpecItem icon={RulerIcon} label="Range" value={specs?.rangeKm ? `${specs.rangeKm} km` : '—'} />
                                    <SpecItem icon={Battery} label="Battery" value={specs?.battery ?? '—'} />
                                    <SpecItem icon={Zap} label="Charging Time" value={specs?.chargingTimeHrs ? `${specs.chargingTimeHrs} hrs` : '—'} />
                                </CardContent>
                            </Card>
                        </>
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

                {/* Right: Availability + Maintenance */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Availability</CardTitle>
                            <CardDescription>Make the vehicle visible for new rentals.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="availability-toggle"
                                    checked={status === 'Available'}
                                    onCheckedChange={handleAvailabilityToggle}
                                    disabled={status === 'Rented'}
                                />
                                <Label htmlFor="availability-toggle">
                                    {status === 'Available' ? 'Available' : 'Unavailable'}
                                </Label>
                            </div>
                            {status === 'Rented' && (
                                <p className="text-sm text-destructive mt-2">
                                    Cannot change availability while rental is ongoing.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Maintenance</CardTitle>
                            <CardDescription>Service schedule & health.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <MiniRow icon={Calendar} label="Last Service" value={lastService ? lastService.toLocaleDateString() : '—'} />
                            <MiniRow icon={Calendar} label="Next Service" value={nextService ? nextService.toLocaleDateString() : '—'} />
                            <MiniRow icon={Wrench} label="Interval" value={serviceIntervalDays ? `${serviceIntervalDays} days` : '—'} />
                            <div className="flex items-center gap-2">
                                <Badge variant={isServiceDue ? 'destructive' : 'default'}>
                                    {isServiceDue ? 'Service Due' : 'OK'}
                                </Badge>
                                {typeof daysToNext === 'number' && !isServiceDue && (
                                    <span className="text-sm text-muted-foreground">~{daysToNext} days remaining</span>
                                )}
                            </div>
                            <div className="pt-2 border-t mt-2 text-xs text-muted-foreground">
                                <div>Created: {createdAt ? new Date(createdAt).toLocaleString() : '—'}</div>
                                <div>Updated: {updatedAt ? new Date(updatedAt).toLocaleString() : '—'}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

/* ----------------------------- UI bits ----------------------------- */

function StatCard({
                      icon: Icon,
                      label,
                      value,
                      tone,
                  }: {
    icon: any;
    label: string;
    value: string;
    tone?: 'ok' | 'warn';
}) {
    return (
        <Card className="rounded-2xl">
            <CardContent className="flex items-center gap-3 p-4">
                <div
                    className={cn(
                        'rounded-xl p-3 ring-1',
                        tone === 'ok' && 'bg-emerald-50/70 ring-emerald-100 text-emerald-700',
                        tone === 'warn' && 'bg-amber-50/70 ring-amber-100 text-amber-700',
                        !tone && 'bg-muted/40 ring-muted'
                    )}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="text-base font-semibold">{value}</div>
                </div>
            </CardContent>
        </Card>
    );
}

function InfoRow({
                     icon: Icon,
                     label,
                     value,
                 }: {
    icon: any;
    label: string;
    value?: string | null;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-muted/50 p-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-sm font-medium">{value ?? '—'}</div>
            </div>
        </div>
    );
}

function SpecItem({
                      icon: Icon,
                      label,
                      value,
                  }: {
    icon: any;
    label: string;
    value?: string | null;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="rounded-md bg-muted/40 p-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-sm font-medium">{value ?? '—'}</div>
            </div>
        </div>
    );
}

function MiniRow({
                     icon: Icon,
                     label,
                     value,
                 }: {
    icon: any;
    label: string;
    value?: string | null;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="rounded-md bg-muted/40 p-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-sm">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="font-medium">{value ?? '—'}</div>
            </div>
        </div>
    );
}

/** Simple ruler icon since lucide’s “Ruler” may not be imported by name */
function RulerIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
            <path
                d="M2 7a2 2 0 0 1 2-2h16v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path d="M6 9h2M6 12h4M6 15h6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}
