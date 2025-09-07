"use client";

import useSWR from "swr";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Kyc = {
    aadhaarNumber?: string | null;
    panNumber?: string | null;
    drivingLicenseNumber?: string | null;
    aadhaarImageUrl?: string | null;
    panCardImageUrl?: string | null;
    drivingLicenseImageUrl?: string | null;
    status?: "VERIFIED" | "PENDING" | "REJECTED";
};

const fetcher = (url: string) => fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed");
    return r.json();
});

export default function KycTab() {
    const { data, mutate } = useSWR<Kyc>("/api/v1/rider/kyc", fetcher);
    const [files, setFiles] = useState<{ aadhaar?: File; pan?: File; dl?: File }>({});
    const [loading, setLoading] = useState(false);

    const onUpload = async () => {
        if (!files.aadhaar && !files.pan && !files.dl) return;
        setLoading(true);
        try {
            const fd = new FormData();
            if (files.aadhaar) fd.append("aadhaarFile", files.aadhaar);
            if (files.pan) fd.append("panFile", files.pan);
            if (files.dl) fd.append("dlFile", files.dl);

            // Reuse your public/admin upload route if rider one isn’t ready.
            const r = await fetch("/api/v1/rider/kyc/upload", { method: "POST", body: fd });
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || "Upload failed");

            // Let backend persist URLs → merge + revalidate
            await mutate();
            alert("Documents uploaded.");
        } catch (e: any) {
            alert(e.message || "Upload error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Aadhaar
                        {data?.aadhaarNumber ? <Badge>Provided</Badge> : <Badge variant="secondary">Missing</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">Number: {data?.aadhaarNumber || "—"}</div>
                    {data?.aadhaarImageUrl ? (
                        <a className="text-primary underline text-sm" href={data.aadhaarImageUrl} target="_blank">View file</a>
                    ) : null}
                    <Separator />
                    <Label>Upload</Label>
                    <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFiles((f) => ({ ...f, aadhaar: e.target.files?.[0] }))} />
                </CardContent>
            </Card>

            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        PAN
                        {data?.panNumber ? <Badge>Provided</Badge> : <Badge variant="secondary">Missing</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">Number: {data?.panNumber || "—"}</div>
                    {data?.panCardImageUrl ? (
                        <a className="text-primary underline text-sm" href={data.panCardImageUrl} target="_blank">View file</a>
                    ) : null}
                    <Separator />
                    <Label>Upload</Label>
                    <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFiles((f) => ({ ...f, pan: e.target.files?.[0] }))} />
                </CardContent>
            </Card>

            <Card className="rounded-2xl md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Driving License
                        {data?.drivingLicenseNumber ? <Badge>Provided</Badge> : <Badge variant="secondary">Missing</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">Number: {data?.drivingLicenseNumber || "—"}</div>
                    {data?.drivingLicenseImageUrl ? (
                        <a className="text-primary underline text-sm" href={data.drivingLicenseImageUrl} target="_blank">View file</a>
                    ) : null}
                    <Separator />
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <Label>Upload</Label>
                            <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFiles((f) => ({ ...f, dl: e.target.files?.[0] }))} />
                        </div>
                        <div className="flex items-end">
                            <Button disabled={loading} className="rounded-xl w-full" onClick={onUpload}>
                                {loading ? "Uploading…" : "Upload Documents"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
