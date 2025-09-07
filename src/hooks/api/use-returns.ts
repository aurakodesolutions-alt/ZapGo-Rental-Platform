import useSWR from "swr";

export type ReturnRow = {
    rentalId: number;
    rider: { riderId: number; fullName: string; phone?: string };
    vehicle: { vehicleId: number; uniqueCode: string; model: string };
    plan: { planId: number; planName?: string | null };
    startDate: string;
    expectedReturnDate: string;
    actualReturnDate?: string | null;
    status: "ongoing" | "completed" | "overdue" | "cancelled" | string;
    payableTotal: number;
    paidTotal: number;
    balanceDue: number;
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useReturns(scope: "due-today" | "overdue" | "recent", q: string) {
    const url = `/api/v1/admin/returns?scope=${encodeURIComponent(scope)}&q=${encodeURIComponent(q || "")}`;
    const { data, error, isLoading, mutate } = useSWR(url, fetcher, { revalidateOnFocus: false });

    return {
        rows: (data?.ok ? data.data : []) as ReturnRow[],
        isLoading,
        isError: !!error || data?.ok === false,
        refresh: mutate,
    };
}
