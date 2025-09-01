"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
    RiderForm,
    RiderFormValues,
} from "@/components/admin/forms/rider-form";

export default function AdminAddRiderPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);

    async function handleCreate(values: RiderFormValues) {
        setSubmitting(true);
        try {
            // TODO: replace with your API call
            // await fetch("/api/admin/riders", { method: "POST", body: JSON.stringify(values) });
            console.log("Create Rider payload:", values);

            toast({
                title: "Rider created",
                description: `${values.fullName} registered on ${values.plan} plan.`,
            });

            router.push("/admin/riders");
        } catch (e: any) {
            toast({
                title: "Failed to create rider",
                description: String(e?.message || e),
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Add Rider</h1>
                <p className="text-muted-foreground">
                    Create a new rider, pick a plan and assign a vehicle.
                </p>
            </div>

            <RiderForm
                mode="create"
                // If you want a specific default vehicle, start date, etc., pass them here:
                // initialValues={{ plan: "Basic", startDate: "2025-09-01" }}
                // onSubmit={handleCreate}
                onCancel={() => router.back()}
                submitting={submitting}
                // vehicles={yourVehicleOptions}  // optional, otherwise uses fallback list
            />
        </div>
    );
}
