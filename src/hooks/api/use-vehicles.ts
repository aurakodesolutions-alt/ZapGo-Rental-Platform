"use client";

import useSWR, { mutate as globalMutate } from "swr";
import type { VehicleCreateInput, VehicleUpdateInput, Vehicle} from "@/lib/types";
import { listVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle } from "@/lib/api/vehicles";

type UseVehicleOpts = {
    q?: string;
    limit?: number;
    offset?: number;
};

export function useVehicles(opts?: UseVehicleOpts) {
    const key = ["/api/v1/admin/vehicles", opts] as const;

    const { data, error, isLoading, mutate } = useSWR(key, async () => {
        const res = await listVehicles(opts);
        return res.data;
    });

    return {
        vehicles: data ?? [],
        isLoading,
        isError: !!error,
        error: error as Error | undefined,
        mutate, // local revalidate
        // helpers
        async create(input: VehicleCreateInput) {
            const res = await createVehicle(input);
            // refresh list
            await mutate();
            return res.data;
        },
        async remove(planId: number | string) {
            await deleteVehicle(planId);
            await mutate();
        },
    };
}

export function useVehicle(id?: number | string) {
    const shouldFetch = !!id;
    const key = shouldFetch ? ["/api/v1/admin/vehicles/:id", id] : null;

    const { data, error, isLoading, mutate } = useSWR(key, async () => {
        if (!id) return null;
        const res = await getVehicle(id);
        return res.data;
    });

    return {
        vehicle: (data as Vehicle | null) ?? null,
        isLoading: !!shouldFetch && isLoading,
        isError: !!error,
        error: error as Error | undefined,
        mutate,
        async update(input: VehicleUpdateInput) {
            if (!id) throw new Error("Missing id");
            const res = await updateVehicle(id, input);
            await mutate();
            // also refresh list caches if needed
            await globalMutate((k: any) => Array.isArray(k) && k[0] === "/api/v1/admin/vehicles");
            return res.data;
        },
        async remove() {
            if (!id) throw new Error("Missing id");
            await deleteVehicle(id);
            // clear this record & refresh lists
            await mutate(null, { revalidate: false });
            await globalMutate((k: any) => Array.isArray(k) && k[0] === "/api/v1/admin/vehicles");
        },
    };
}
