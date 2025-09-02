"use client";

import { useEffect, useMemo } from "react";
import { useBookingWizard } from "./booking-provider";
import { Button } from "../ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Check, ShieldAlert, BadgeIndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { usePlans } from "@/hooks/public/usePlans";

interface Step3PlanProps {
    onNext: () => void;
}

type UiPlan = {
    id: number;
    code?: "Lite" | "Pro" | string;
    name?: string;
    title?: string;
    description?: string;
    joiningFee?: number;
    securityDeposit?: number;
    requiredDocuments?: string | string[]; // optional in API
};

function docsFrom(p: UiPlan): string[] {
    // Prefer API-provided docs
    if (Array.isArray(p.requiredDocuments)) return p.requiredDocuments as string[];
    if (typeof p.requiredDocuments === "string" && p.requiredDocuments.trim()) {
        // split CSV or pipe-separated
        return p.requiredDocuments.split(/[,|]\s*/g).map((x) => x.trim()).filter(Boolean);
    }
    // Fallback by code
    const code = (p.code || p.name || p.title || "").toLowerCase();
    if (code.includes("pro")) return ["Aadhaar Card", "PAN Card", "Driving License"];
    return ["Aadhaar Card", "PAN Card"];
}

export function Step3_Plan({ onNext }: Step3PlanProps) {
    const { draft, setDraft } = useBookingWizard();
    const { plans = [], isLoading, error } = usePlans();

    // Normalize plans to a consistent shape
    const normPlans: UiPlan[] = useMemo(
        () =>
            plans.map((p: any) => ({
                id: Number(p.id),
                code: p.code || undefined,
                name: p.name || p.title,
                title: p.title || p.name,
                description: p.description,
                joiningFee: Number(p.joiningFee ?? 0),
                securityDeposit: Number(p.deposit ?? 0),
                requiredDocuments: p.requiredDocuments,
            })),
        [plans]
    );

    // Determine compatibility:
    // 1) If vehicle has a single planId -> only that plan is enabled
    // 2) Else if vehicle has compatiblePlans (Lite/Pro codes) -> enable matching codes
    // 3) Else -> enable all plans
    const compatiblePlanIds = useMemo(() => {
        const set = new Set<number>();
        const veh = draft.vehicle as any;
        if (veh?.planId) {
            set.add(Number(veh.planId));
            return set;
        }
        if (Array.isArray(veh?.compatiblePlans) && veh.compatiblePlans.length) {
            const codes: string[] = veh.compatiblePlans;
            normPlans.forEach((p) => {
                const code = (p.code || p.name || p.title || "").toString();
                if (codes.some((c) => code.toLowerCase().includes(c.toLowerCase()))) {
                    set.add(p.id);
                }
            });
            return set;
        }
        // default: allow all
        normPlans.forEach((p) => set.add(p.id));
        return set;
    }, [draft.vehicle, normPlans]);

    const selectedPlanId: number | undefined = useMemo(() => {
        // Prefer explicit planId on draft
        if (draft.planId != null) return Number(draft.planId);
        // Back-compat: if draft.plan is a code ("Lite"/"Pro"), map it to an id
        if (draft.planName && normPlans.length) {
            const hit = normPlans.find((p) => {
                const label = (p.code || p.name || p.title || "").toString().toLowerCase();
                return label.includes(String(draft.planName).toLowerCase());
            });
            return hit?.id;
        }
        return undefined;
    }, [draft.planId, draft.planName, normPlans]);

    // Auto-select the vehicle's associated plan (if any) when nothing is selected yet
    useEffect(() => {
        if (isLoading || !normPlans.length) return;
        if (selectedPlanId != null) return;

        const vehPlanId = (draft.vehicle as any)?.planId
            ? Number((draft.vehicle as any).planId)
            : undefined;

        if (vehPlanId) {
            const p = normPlans.find((x) => x.id === vehPlanId);
            if (p) {
                setDraft({
                    planId: p.id,
                    planName: p.name || p.title,
                    joiningFee: p.joiningFee,
                    deposit: p.securityDeposit,
                    // planCode: p.code, // helpful for later steps
                });
            }
        }
    }, [isLoading, normPlans, selectedPlanId, draft.vehicle, setDraft]);

    const selectedPlan = useMemo(
        () => normPlans.find((p) => p.id === selectedPlanId),
        [normPlans, selectedPlanId]
    );
    console.log(selectedPlan);
    const fees = useMemo(() => {
        const joining = Number(selectedPlan?.joiningFee ?? 0);
        const deposit = Number(selectedPlan?.securityDeposit ?? 0);
        return {
            joiningFee: joining,
            deposit,
            total: joining + deposit,
        };
    }, [selectedPlan]);

    const handleSelectPlan = (p: UiPlan) => {
        if (!compatiblePlanIds.has(p.id)) return; // block incompatible
        setDraft({
            planId: p.id,
            planName: p.name || p.title,
            joiningFee: p.joiningFee,
            deposit: p.securityDeposit,
            // planCode: p.code,
        });
        onNext();
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Choose Your Plan</h1>
                <p className="text-muted-foreground">
                    { (draft.vehicle as any)?.planId
                        ? "This scooter is tied to a specific plan."
                        : "This scooter is compatible with the following plans."}
                </p>
            </div>

            {isLoading ? (
                <div>Loading plans…</div>
            ) : error ? (
                <div className="text-destructive">Failed to load plans.</div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {normPlans.map((p) => {
                        const disabled = !compatiblePlanIds.has(p.id);
                        const isSelected = selectedPlanId === p.id;
                        const docs = docsFrom(p);

                        return (
                            <Card
                                key={p.id}
                                onClick={() => !disabled && handleSelectPlan(p)}
                                className={cn(
                                    "cursor-pointer transition-all",
                                    isSelected ? "ring-2 ring-primary" : "hover:shadow-md",
                                    disabled && "bg-muted/50 cursor-not-allowed opacity-60"
                                )}
                                aria-disabled={disabled}
                            >
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        {p.name || p.title}
                                        {isSelected && <Check className="h-6 w-6 text-primary" />}
                                    </CardTitle>
                                    {p.description && (
                                        <CardDescription>{p.description}</CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground mb-3">
                                        Joining ₹{Number(p.joiningFee ?? 0).toLocaleString("en-IN")} •
                                        {" "}
                                        Deposit ₹{Number(p.securityDeposit ?? 0).toLocaleString("en-IN")}
                                    </div>

                                    <p className="text-sm font-semibold mb-2">Documents Required:</p>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                        {docs.map((doc) => (
                                            <li key={doc}>{doc}</li>
                                        ))}
                                    </ul>

                                    {(p.code || p.name || p.title || "")
                                        .toString()
                                        .toLowerCase()
                                        .includes("pro") && (
                                        <Badge variant="destructive" className="mt-4 gap-1">
                                            <ShieldAlert className="h-3 w-3" />
                                            Driving License Required
                                        </Badge>
                                    )}

                                    {!compatiblePlanIds.has(p.id) && (
                                        <Badge variant="destructive" className="mt-3">
                                            Not compatible with selected vehicle
                                        </Badge>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <div>
                <h3 className="text-lg font-semibold mb-2">Fee Summary</h3>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <BadgeIndianRupee />
                            One-Time Payment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span>Joining Fee (Non-Refundable)</span>
                            <span className="font-medium">
                ₹{Number(fees.joiningFee).toLocaleString("en-IN")}
              </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Security Deposit (Refundable)</span>
                            <span className="font-medium">
                ₹{Number(fees.deposit).toLocaleString("en-IN")}
              </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-base">
                            <span>Total Payable Now</span>
                            <span>₹{Number(fees.total).toLocaleString("en-IN")}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
