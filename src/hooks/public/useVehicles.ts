
import useSWR from "swr";
const fetcher = (u:string)=>fetch(u).then(r=>r.json());
export function useVehicles(params: { from?: string; to?: string; planId?: number; page?: number; pageSize?: number }) {
    const qs = new URLSearchParams();
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    if (params.planId) qs.set("planId", String(params.planId));
    qs.set("page", String(params.page ?? 1));
    qs.set("pageSize", String(params.pageSize ?? 6));
    const key = `/api/v1/public/vehicles?${qs.toString()}`;
    const { data, error, isLoading, mutate } = useSWR(key, fetcher, { revalidateOnFocus: false });
    return { vehicles: data?.items ?? [], total: data?.total ?? 0, error, isLoading, mutate };
}