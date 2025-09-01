import { fetchJson } from "./fetch-json";
import type { Vehicle, VehicleCreateInput, VehicleUpdateInput } from "@/lib/types";

type ListResp = { ok: true; data: Vehicle[] };
type OneResp  = { ok: true; data: Vehicle };
type OkResp   = { ok: true };

export async function listVehicles(params?: { q?: string; limit?: number; offset?: number }) {
    const usp = new URLSearchParams();
    if (params?.q) usp.set("q", params.q);
    if (params?.limit) usp.set("limit", String(params.limit));
    if (params?.offset) usp.set("offset", String(params.offset));
    const qs = usp.toString();
    const url = `/api/v1/admin/vehicles${qs ? `?${qs}` : ""}`;
    return fetchJson<ListResp>(url);
}

export async function getVehicle(id: number | string) {
    return fetchJson<OneResp>(`/api/v1/admin/vehicles/${id}`);
}

export async function createVehicle(input: VehicleCreateInput) {
    return fetchJson<OneResp>(`/api/v1/admin/vehicles`, { method: "POST", body: input });
}

export async function updateVehicle(id: number | string, input: VehicleUpdateInput) {
    return fetchJson<OneResp>(`/api/v1/admin/vehicles/${id}`, { method: "PUT", body: input });
}

export async function deleteVehicle(id: number | string) {
    return fetchJson<OkResp>(`/api/v1/admin/vehicles/${id}`, { method: "DELETE" });
}
