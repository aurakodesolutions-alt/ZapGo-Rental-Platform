import { fetchJson } from "./fetch-json";
import type { Rider, RiderCreateInput, RiderUpdateInput } from "@/lib/types";

type ListResp = { ok: true; data: Rider[] };
type OneResp  = { ok: true; data: Rider };
type OkResp   = { ok: true };

export async function listRiders(params?: { q?: string; limit?: number; offset?: number }) {
    const usp = new URLSearchParams();
    if (params?.q) usp.set("q", params.q);
    if (params?.limit) usp.set("limit", String(params.limit));
    if (params?.offset) usp.set("offset", String(params.offset));
    const qs = usp.toString();
    const url = `/api/v1/admin/riders${qs ? `?${qs}` : ""}`;
    return fetchJson<ListResp>(url);
}

export async function getRider(id: number | string) {
    return fetchJson<OneResp>(`/api/v1/admin/riders/${id}`);
}

export async function createRider(input: RiderCreateInput) {
    return fetchJson<OneResp>(`/api/v1/admin/riders`, { method: "POST", body: input });
}

export async function updateRider(id: number | string, input: RiderUpdateInput) {
    return fetchJson<OneResp>(`/api/v1/admin/riders/${id}`, { method: "PUT", body: input });
}

export async function deleteRider(id: number | string) {
    return fetchJson<OkResp>(`/api/v1/admin/riders/${id}`, { method: "DELETE" });
}
