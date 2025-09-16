"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then(r => r.json());

export function useMiscInventory(types: string[] = ["BATTERY","CHARGER"]) {
    const qs = new URLSearchParams({
        types: types.join(","),
        availableOnly: "1",
        limit: "200",
        offset: "0",
    });
    const { data, error, isLoading, mutate } = useSWR(`/api/v1/admin/inventory/list?${qs}`, fetcher);
    const items = (data?.data ?? []) as { itemId: number; itemType: string; serialNumber: string }[];
    const batteries = items.filter(i => i.itemType?.toUpperCase() === "BATTERY");
    const chargers  = items.filter(i => i.itemType?.toUpperCase() === "CHARGER");
    return { batteries, chargers, items, isLoading, error, mutate };
}
