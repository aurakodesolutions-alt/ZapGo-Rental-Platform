import { fetchJson } from "./fetch-json";
import type { Plan, PlanCreateInput, PlanUpdateInput } from "@/lib/types";

type ListResp = { ok: true; data: Plan[] };
type OneResp  = { ok: true; data: Plan };
type OkResp   = { ok: true };

export async function listPlans(params?: { q?: string; limit?: number; offset?: number }) {
    const usp = new URLSearchParams();
    if (params?.q) usp.set("q", params.q);
    if (params?.limit) usp.set("limit", String(params.limit));
    if (params?.offset) usp.set("offset", String(params.offset));
    const qs = usp.toString();
    const url = `/api/v1/admin/plans${qs ? `?${qs}` : ""}`;
    return fetchJson<ListResp>(url);
}

export async function getPlan(id: number | string) {
    return fetchJson<OneResp>(`/api/v1/admin/plans/${id}`);
}

export async function createPlan(input: PlanCreateInput) {
    return fetchJson<OneResp>(`/api/v1/admin/plans`, { method: "POST", body: input });
}

export async function updatePlan(id: number | string, input: PlanUpdateInput) {
    return fetchJson<OneResp>(`/api/v1/admin/plans/${id}`, { method: "PUT", body: input });
}

export async function deletePlan(id: number | string) {
    return fetchJson<OkResp>(`/api/v1/admin/plans/${id}`, { method: "DELETE" });
}
