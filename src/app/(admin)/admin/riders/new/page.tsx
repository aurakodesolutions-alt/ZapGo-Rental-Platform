"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
    RiderForm,
    RiderFormValues,
} from "@/components/admin/forms/rider-form";
import { useRiders } from "@/hooks/api/use-riders";

export default function AdminAddRiderPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { create } = useRiders();
    const [submitting, setSubmitting] = useState(false);

    async function handleCreate(values: RiderFormValues) {
        setSubmitting(true);
        try {
            // 1) Try uploading KYC files (if any)
            let urls: Partial<Record<"aadhaarFile" | "panFile" | "dlFile", string>> = {};
            try {
                const fd = new FormData();
                fd.append("riderName", values.fullName);
                if (values.aadhaarFile) fd.append("aadhaarFile", values.aadhaarFile);
                if (values.panFile) fd.append("panFile", values.panFile);
                if (values.dlFile) fd.append("dlFile", values.dlFile);

                // Only call upload if at least one file is present
                if (fd.has("aadhaarFile") || fd.has("panFile") || fd.has("dlFile")) {
                    const res = await fetch("/api/v1/admin/riders/upload", {
                        method: "POST",
                        body: fd,
                    });
                    const json = await res.json();
                    if (!res.ok || !json?.ok) {
                        throw new Error(json?.error || "Upload failed");
                    }
                    urls = json.data || {};
                }
            } catch (e: any) {
                // If upload fails, continue with empty URLs (you can choose to block instead)
                console.warn("KYC upload failed:", e);
                toast({
                    title: "KYC upload failed",
                    description: "Continuing without document URLs. You can upload later.",
                    variant: "destructive",
                });
            }

            // 2) Build payload for Rider create
            const payload = {
                fullName: values.fullName,
                phone: values.phone,
                email: values.email,
                kyc: {
                    aadhaarNumber: values.aadhaar,
                    aadhaarImageUrl: urls.aadhaarFile ?? "",
                    panNumber: values.pan,
                    panCardImageUrl: urls.panFile ?? "",
                    drivingLicenseNumber: values.dl || null,
                    drivingLicenseImageUrl: urls.dlFile ?? "",
                },
            };

            // 3) Create rider
            await create(payload);

            toast({
                title: "Rider created",
                description: `${values.fullName} registered successfully.`,
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
                submitting={submitting}
                onSubmitAction={handleCreate}
                onCancel={() => router.back()}
            />
        </div>
    );
}
