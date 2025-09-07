"use client";

import useSWR from "swr";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, FileText, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Kyc = {
    aadhaarNumber?: string | null;
    panNumber?: string | null;
    drivingLicenseNumber?: string | null;
    aadhaarImageUrl?: string | null;
    panCardImageUrl?: string | null;
    drivingLicenseImageUrl?: string | null;
    selfieImageUrl?: string | null;
    status?: "VERIFIED" | "PENDING" | "REJECTED";
};

const fetcher = (url: string) =>
    fetch(url).then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
    });

// ---- helpers ---------------------------------------------------------------

const imageExts = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"]);
const isImageUrl = (src?: string | null) => {
    if (!src) return false;
    try {
        const clean = src.split("?")[0].split("#")[0];
        const ext = clean.split(".").pop()?.toLowerCase() || "";
        return imageExts.has(ext) || src.startsWith("blob:");
    } catch {
        return false;
    }
};

function useObjectUrl(file?: File | null) {
    const prev = useRef<string | null>(null);
    useEffect(() => {
        return () => {
            if (prev.current) URL.revokeObjectURL(prev.current);
        };
    }, []);
    return useMemo(() => {
        if (!file) return null;
        if (prev.current) URL.revokeObjectURL(prev.current);
        const url = URL.createObjectURL(file);
        prev.current = url;
        return url;
    }, [file]);
}

function DocPreview({
                        label,
                        src,
                        isPdf,
                        className,
                        onClear,
                    }: {
    label: string;
    src?: string | null;
    isPdf?: boolean;
    className?: string;
    onClear?: () => void;
}) {
    if (!src) {
        return (
            <div
                className={cn(
                    "relative grid place-items-center rounded-xl border bg-muted/40 aspect-[4/3]",
                    className
                )}
            >
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <ImageIcon className="h-4 w-4" />
                    No file
                </div>
            </div>
        );
    }

    const image = !isPdf && isImageUrl(src);

    return (
        <div className={cn("relative rounded-xl border overflow-hidden", className)}>
            {image ? (
                // Show as image
                <img
                    src={src}
                    alt={`${label} preview`}
                    className="w-full h-full object-cover aspect-[4/3] bg-black/5"
                />
            ) : (
                // PDF / non-image tile
                <div className="flex h-full min-h-[12rem] items-center justify-center gap-3 bg-muted/40">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground truncate max-w-[70%]">
            {label}
          </span>
                </div>
            )}

            <div className="absolute top-2 right-2 flex gap-2">
                <a
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-background/80 px-2 py-1 text-xs ring-1 ring-border backdrop-blur hover:bg-background"
                    aria-label="Open file"
                >
                    <Eye className="h-3.5 w-3.5" />
                    Open
                </a>
                {onClear ? (
                    <button
                        type="button"
                        onClick={onClear}
                        className="inline-flex items-center gap-1 rounded-md bg-background/80 px-2 py-1 text-xs ring-1 ring-border backdrop-blur hover:bg-background"
                        aria-label="Remove selected file"
                    >
                        <X className="h-3.5 w-3.5" />
                        Clear
                    </button>
                ) : null}
            </div>
        </div>
    );
}

// ---- component -------------------------------------------------------------

export default function KycTab() {
    const { data, mutate } = useSWR<Kyc>("/api/v1/rider/kyc", fetcher);

    const [files, setFiles] = useState<{
        aadhaar?: File;
        pan?: File;
        dl?: File;
        selfie?: File;
    }>({});
    const [loading, setLoading] = useState(false);

    // blob previews for selected files
    const aadhaarPreview = useObjectUrl(files.aadhaar);
    const panPreview = useObjectUrl(files.pan);
    const dlPreview = useObjectUrl(files.dl);
    const selfiePreview = useObjectUrl(files.selfie);

    const onUpload = async () => {
        if (!files.aadhaar && !files.pan && !files.dl && !files.selfie) return;
        setLoading(true);
        try {
            const fd = new FormData();
            if (files.aadhaar) fd.append("aadhaarFile", files.aadhaar);
            if (files.pan) fd.append("panFile", files.pan);
            if (files.dl) fd.append("dlFile", files.dl);
            if (files.selfie) fd.append("selfieFile", files.selfie);

            const r = await fetch("/api/v1/rider/kyc/upload", { method: "POST", body: fd });
            const j = await r.json();
            if (!r.ok || !j?.ok) throw new Error(j?.error || "Upload failed");

            setFiles({});
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
            {/* Aadhaar */}
            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Aadhaar
                        {data?.aadhaarNumber ? <Badge>Provided</Badge> : <Badge variant="secondary">Missing</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">Number: {data?.aadhaarNumber || "—"}</div>

                    <DocPreview
                        label="Aadhaar"
                        src={aadhaarPreview ?? data?.aadhaarImageUrl ?? undefined}
                        isPdf={files.aadhaar ? files.aadhaar.type === "application/pdf" : false}
                        onClear={files.aadhaar ? () => setFiles((f) => ({ ...f, aadhaar: undefined })) : undefined}
                    />

                    <Separator />
                    <Label>Replace / Upload</Label>
                    <Input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setFiles((f) => ({ ...f, aadhaar: e.target.files?.[0] }))}
                    />
                </CardContent>
            </Card>

            {/* PAN */}
            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        PAN
                        {data?.panNumber ? <Badge>Provided</Badge> : <Badge variant="secondary">Missing</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">Number: {data?.panNumber || "—"}</div>

                    <DocPreview
                        label="PAN"
                        src={panPreview ?? data?.panCardImageUrl ?? undefined}
                        isPdf={files.pan ? files.pan.type === "application/pdf" : false}
                        onClear={files.pan ? () => setFiles((f) => ({ ...f, pan: undefined })) : undefined}
                    />

                    <Separator />
                    <Label>Replace / Upload</Label>
                    <Input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setFiles((f) => ({ ...f, pan: e.target.files?.[0] }))}
                    />
                </CardContent>
            </Card>

            {/* Driving License */}
            <Card className="rounded-2xl md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Driving License
                        {data?.drivingLicenseNumber ? <Badge>Provided</Badge> : <Badge variant="secondary">Missing</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                        Number: {data?.drivingLicenseNumber || "—"}
                    </div>

                    <DocPreview
                        label="Driving License"
                        src={dlPreview ?? data?.drivingLicenseImageUrl ?? undefined}
                        isPdf={files.dl ? files.dl.type === "application/pdf" : false}
                        onClear={files.dl ? () => setFiles((f) => ({ ...f, dl: undefined })) : undefined}
                    />

                    <Separator />
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <Label>Replace / Upload</Label>
                            <Input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => setFiles((f) => ({ ...f, dl: e.target.files?.[0] }))}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button disabled={loading} className="w-full rounded-xl" onClick={onUpload}>
                                {loading ? "Uploading…" : "Upload Documents"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Selfie */}
            <Card className="rounded-2xl md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Selfie (Face Photo)
                        {data?.selfieImageUrl ? <Badge>Uploaded</Badge> : <Badge variant="secondary">Missing</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <DocPreview
                        label="Selfie"
                        src={selfiePreview ?? data?.selfieImageUrl ?? undefined}
                        isPdf={false}
                        onClear={files.selfie ? () => setFiles((f) => ({ ...f, selfie: undefined })) : undefined}
                    />

                    <Separator />
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <Label>Replace / Upload</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFiles((f) => ({ ...f, selfie: e.target.files?.[0] }))}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button disabled={loading} className="w-full rounded-xl" onClick={onUpload}>
                                {loading ? "Uploading…" : "Upload Selfie"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
