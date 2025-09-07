"use client";

import useSWR from "swr";

const fetcher = (url: string) =>
    fetch(url, { credentials: "include" }).then(async (r) => {
        if (!r.ok) return null; // 401 -> not logged in
        return r.json();
    });

export function useRider() {
    const { data, error, isLoading, mutate } = useSWR("/api/v1/rider/me", fetcher, {
        shouldRetryOnError: false,
    });

    return {
        rider: data?.rider,                // { riderId, fullName, email, phone } | null
        loggedIn: !!data,
        isLoading,
        error,
        mutate,
    };
}
