"use client";

import useSWR, { mutate as globalMutate } from "swr";
import type { Rider, RiderCreateInput, RiderUpdateInput } from "@/lib/types";
import { listRiders, getRider, createRider, updateRider,  deleteRider } from "@/lib/api/rider";

type UseRiderOpts = {
    q?: string;
    limit?: number;
    offset?: number;
};

export function useRiders(opts?: UseRiderOpts) {
    const key = ["/api/v1/admin/riders", opts] as const;

    const { data, error, isLoading, mutate } = useSWR(key, async () => {
        const res = await listRiders(opts);
        return res.data;
    });

    return {
        riders: data ?? [],
        isLoading,
        isError: !!error,
        error: error as Error | undefined,
        mutate, // local revalidate
        // helpers
        async create(input: RiderCreateInput) {
            const res = await createRider(input);
            // refresh list
            await mutate();
            return res.data;
        },
        async remove(riderId: number | string) {
            await deleteRider(riderId);
            await mutate();
        },
    };
}

export function useRider(id?: number | string) {
    const shouldFetch = !!id;
    const key = shouldFetch ? ["/api/v1/admin/riders/:id", id] : null;

    const { data, error, isLoading, mutate } = useSWR(key, async () => {
        if (!id) return null;
        const res = await getRider(id);
        return res.data;
    });

    return {
        rider: (data as Rider | null) ?? null,
        isLoading: shouldFetch && isLoading,
        isError: !!error,
        error: error as Error | undefined,
        mutate,
        async update(input: RiderUpdateInput) {
            if (!id) throw new Error("Missing id");
            const res = await updateRider(id, input);
            await mutate();
            // also refresh list caches if needed
            await globalMutate((k: any) => Array.isArray(k) && k[0] === "/api/v1/admin/plans");
            return res.data;
        },
        async remove() {
            if (!id) throw new Error("Missing id");
            await deleteRider(id);
            // clear this record & refresh lists
            await mutate(null, { revalidate: false });
            await globalMutate((k: any) => Array.isArray(k) && k[0] === "/api/v1/admin/plans");
        },
    };
}
