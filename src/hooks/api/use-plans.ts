"use client";

import useSWR, { mutate as globalMutate } from "swr";
import type { Plan, PlanCreateInput, PlanUpdateInput } from "@/lib/types";
import { listPlans, getPlan, createPlan, updatePlan, deletePlan } from "@/lib/api/plans";

type UsePlansOpts = {
    q?: string;
    limit?: number;
    offset?: number;
};

export function usePlans(opts?: UsePlansOpts) {
    const key = ["/api/v1/admin/plans", opts] as const;

    const { data, error, isLoading, mutate } = useSWR(key, async () => {
        const res = await listPlans(opts);
        return res.data;
    });

    return {
        plans: data ?? [],
        isLoading,
        isError: !!error,
        error: error as Error | undefined,
        mutate, // local revalidate
        // helpers
        async create(input: PlanCreateInput) {
            const res = await createPlan(input);
            // refresh list
            await mutate();
            return res.data;
        },
        async remove(planId: number | string) {
            await deletePlan(planId);
            await mutate();
        },
    };
}

export function usePlan(id?: number | string) {
    const shouldFetch = !!id;
    const key = shouldFetch ? ["/api/v1/admin/plans/:id", id] : null;

    const { data, error, isLoading, mutate } = useSWR(key, async () => {
        if (!id) return null;
        const res = await getPlan(id);
        return res.data;
    });

    return {
        plan: (data as Plan | null) ?? null,
        isLoading: !!shouldFetch && isLoading,
        isError: !!error,
        error: error as Error | undefined,
        mutate,
        async update(input: PlanUpdateInput) {
            if (!id) throw new Error("Missing id");
            const res = await updatePlan(id, input);
            await mutate();
            // also refresh list caches if needed
            await globalMutate((k: any) => Array.isArray(k) && k[0] === "/api/v1/admin/plans");
            return res.data;
        },
        async remove() {
            if (!id) throw new Error("Missing id");
            await deletePlan(id);
            // clear this record & refresh lists
            await mutate(null, { revalidate: false });
            await globalMutate((k: any) => Array.isArray(k) && k[0] === "/api/v1/admin/plans");
        },
    };
}
