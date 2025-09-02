import useSWR from "swr";
const fetcher = (u:string)=>fetch(u).then(r=>r.json());
export function usePlans() {
    const { data, error, isLoading, mutate } = useSWR("/api/v1/public/plans", fetcher);
    return { plans: data?.items ?? [], error, isLoading, mutate };
}