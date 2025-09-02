'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useToast } from '@/hooks/use-toast';
import type { Vehicle } from '@/lib/types';
import { VehicleFormSchema } from "@/lib/schema";
import { useVehicle, useVehicles } from '@/hooks/api/use-vehicles';
import { usePlans } from '@/hooks/api/use-plans';

// ---------------- Schema ----------------
type VehicleFormValues = z.infer<typeof VehicleFormSchema>;

type Props = {
    vehicle?: Vehicle;       // edit mode if present
    onSuccess?: () => void;
};

export function VehicleForm({ vehicle, onSuccess }: Props) {
    const router = useRouter();
    const { toast } = useToast();

    const isEdit = !!vehicle;
    const { create } = useVehicles();
    const { update } = useVehicle(vehicle?.id);

    // --- Plans from DB
    const { plans, isLoading: plansLoading } = usePlans();

    // --- Image file state & previews
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    useEffect(() => {
        if (!files.length) {
            setPreviews([]);
            return;
        }
        const urls = files.map((f) => URL.createObjectURL(f));
        setPreviews(urls);
        return () => urls.forEach((u) => URL.revokeObjectURL(u));
    }, [files]);

    const defaults: Partial<VehicleFormValues> = useMemo(() => {
        if (!vehicle) {
            return {
                planId: plans?.[0]?.planId ?? 1,
                uniqueCode: '',
                model: '',
                vinNumber: '',
                status: 'Available',
                rentPerDay: 0,
                quantity: 1,

                lastServiceDate: undefined,
                serviceIntervalDays: undefined,

                tagsCsv: '',
                rating: undefined,

                specs_rangeKm: undefined,
                specs_topSpeedKmph: undefined,
                specs_battery: '',
                specs_chargingTimeHrs: undefined,
            };
        }
        return {
            planId: vehicle.planId,
            uniqueCode: vehicle.uniqueCode,
            model: vehicle.model,
            vinNumber: vehicle.vinNumber,
            status: vehicle.status,
            rentPerDay: vehicle.rentPerDay,
            quantity: vehicle.quantity ?? 1,

            lastServiceDate: vehicle.lastServiceDate ?? undefined,
            serviceIntervalDays: vehicle.serviceIntervalDays ?? undefined,

            tagsCsv: (vehicle.tags ?? []).join(', '),
            rating: vehicle.rating,

            specs_rangeKm: vehicle.specs?.rangeKm,
            specs_topSpeedKmph: vehicle.specs?.topSpeedKmph,
            specs_battery: vehicle.specs?.battery,
            specs_chargingTimeHrs: vehicle.specs?.chargingTimeHrs,
        };
    }, [vehicle, plans]);

    const form = useForm<VehicleFormValues>({
        resolver: zodResolver(VehicleFormSchema),
        defaultValues: defaults,
    });

    const toArray = (csv?: string) =>
        (csv ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

    // Upload currently selected files and return their public URLs from the API
    async function uploadSelectedFiles(): Promise<string[]> {
        if (!files.length) {
            // edit mode with no new files → keep existing images
            return vehicle?.vehicleImagesUrls ?? [];
        }

        const fd = new FormData();
        files.forEach((f) => fd.append("files", f, f.name));

        const res = await fetch("/api/v1/admin/vehicles/images", {
            method: "POST",
            body: fd,
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(text || "Image upload failed");
        }

        const json = await res.json();
        // API returns { ok: true, urls: string[] }
        return Array.isArray(json?.urls) ? (json.urls as string[]) : [];
    }


    async function onSubmit(values: VehicleFormValues) {
        try {
            // 1) Upload images first; get their public URLs
            const imageUrls = await uploadSelectedFiles();

            // 2) Build payload for create/update
            const payload = {
                planId: values.planId,
                uniqueCode: values.uniqueCode,
                model: values.model,
                vinNumber: values.vinNumber,
                status: values.status,
                rentPerDay: values.rentPerDay,
                quantity: values.quantity,

                lastServiceDate: values.lastServiceDate || null,
                serviceIntervalDays: values.serviceIntervalDays ?? null,

                vehicleImagesUrls: imageUrls,                       // <-- use uploaded URLs
                tags: (values.tagsCsv ?? "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                rating: values.rating,

                specs: {
                    rangeKm: values.specs_rangeKm,
                    topSpeedKmph: values.specs_topSpeedKmph,
                    battery: values.specs_battery,
                    chargingTimeHrs: values.specs_chargingTimeHrs,
                },
            };

            // 3) Create or update via your hooks
            if (isEdit) {
                await update(payload);
                toast({ title: "Vehicle Updated", description: `Saved changes for ${payload.uniqueCode}.` });
            } else {
                await create(payload);
                toast({ title: "Vehicle Created", description: `Vehicle ${payload.uniqueCode} has been added.` });
            }

            if (onSuccess) return onSuccess();
            if (isEdit) return router.refresh();
            router.push("/admin/vehicles");
        } catch (e: any) {
            toast({ title: "Error", description: String(e?.message || e), variant: "destructive" });
        }
    }


    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {/* Plan (from DB) */}
                    <FormField
                        control={form.control}
                        name="planId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Plan</FormLabel>
                                <Select
                                    onValueChange={(v) => field.onChange(Number(v))}
                                    defaultValue={String(field.value ?? '')}
                                    disabled={plansLoading}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={plansLoading ? 'Loading…' : 'Select plan'} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {(plans ?? []).map((p) => (
                                            <SelectItem key={p.planId} value={String(p.planId)}>
                                                {p.planName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Identity */}
                    <FormField
                        control={form.control}
                        name="uniqueCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unique Code</FormLabel>
                                <FormControl><Input placeholder="e.g., ZG-001" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Model</FormLabel>
                                <FormControl><Input placeholder="e.g., Ola S1 Pro" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="vinNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>VIN / Serial</FormLabel>
                                <FormControl><Input placeholder="OEM serial / VIN" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Status / pricing */}
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Available">Available</SelectItem>
                                        <SelectItem value="Rented">Rented</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="rentPerDay"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rent (per day)</FormLabel>
                                <FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Quantity */}
                    <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quantity</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={field.value ?? 1}
                                        onChange={(e) => field.onChange(Number(e.target.value || 1))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Maintenance */}
                    <FormField
                        control={form.control}
                        name="lastServiceDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Service Date</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        value={field.value ?? ''}
                                        onChange={(e) => field.onChange(e.target.value || undefined)}
                                        onBlur={field.onBlur}
                                        name={field.name}
                                        ref={field.ref}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="serviceIntervalDays"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Service Interval (days)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        value={field.value ?? ''}
                                        onChange={(e) => {
                                            const raw = e.target.value;
                                            field.onChange(raw === '' ? undefined : Number(raw));
                                        }}
                                        onBlur={field.onBlur}
                                        name={field.name}
                                        ref={field.ref}
                                        min={0}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Images (multi file) */}
                    <FormItem className="md:col-span-2">
                        <FormLabel>Vehicle Images</FormLabel>
                        <FormControl>
                            <Input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                    const list = e.target.files ? Array.from(e.target.files) : [];
                                    setFiles(list);
                                }}
                            />
                        </FormControl>
                        <FormMessage />
                        {/* Previews */}
                        {previews.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {previews.map((src, i) => (
                                    <div key={i} className="relative overflow-hidden rounded-md border">
                                        {/* use <img> for blob: URLs */}
                                        <img src={src} alt={`preview-${i}`} className="h-28 w-full object-cover" />
                                        <div className="p-2 text-[11px] text-muted-foreground truncate">
                                            {files[i]?.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                            Files will be saved to <code>/public/images/vehicles</code> by your upload API. We’re submitting the future paths
                            so the UI can render them once saved.
                        </p>
                    </FormItem>

                    {/* Tags / Rating */}
                    <FormField
                        control={form.control}
                        name="tagsCsv"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Tags (comma-separated)</FormLabel>
                                <FormControl><Input placeholder="e.g., premium, city, long-range" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="rating"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rating (0–5)</FormLabel>
                                <FormControl><Input type="number" min={0} max={5} step="0.1" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Specs */}
                    <FormField
                        control={form.control}
                        name="specs_rangeKm"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Range (km)</FormLabel>
                                <FormControl><Input type="number" min={0} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="specs_topSpeedKmph"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Top Speed (km/h)</FormLabel>
                                <FormControl><Input type="number" min={0} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="specs_battery"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Battery</FormLabel>
                                <FormControl><Input placeholder='e.g., "2.5 kWh"' {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="specs_chargingTimeHrs"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Charging Time (hours)</FormLabel>
                                <FormControl><Input type="number" min={0} step="0.1" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit">{isEdit ? 'Save Changes' : 'Create Vehicle'}</Button>
                </div>
            </form>
        </Form>
    );
}
