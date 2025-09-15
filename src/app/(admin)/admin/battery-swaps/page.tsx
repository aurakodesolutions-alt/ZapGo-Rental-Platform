"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import toast from "react-hot-toast";

type VehicleLite = { vehicleId: number; uniqueCode: string; model: string };
type SwapRow = {
    swapId: number;
    vehicle: { vehicleId: number; uniqueCode: string; model: string };
    amount: number; ownerUpiId: string; ownerName: string | null; note: string | null;
    paymentStatus: "pending" | "confirmed" | "canceled";
    paymentConfirmedAt: string | null;
    oldBatterySerial: string | null; newBatterySerial: string | null;
    oldBatteryPhotoUrl: string | null; newBatteryPhotoUrl: string | null;
    createdAt: string; completedAt: string | null;
};

const fmtINR = (n:number)=>`₹${(n||0).toLocaleString("en-IN")}`;

export default function BatterySwapsPage() {
    // left: create flow
    const [vehicles, setVehicles] = useState<VehicleLite[]>([]);
    const [vehicleId, setVehicleId] = useState<number | "">("");
    const [amount, setAmount] = useState<number | "">("");
    const [ownerUpiId, setOwnerUpiId] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [note, setNote] = useState("Battery Swap");

    const [createdSwapId, setCreatedSwapId] = useState<number | null>(null);
    const [upiUrl, setUpiUrl] = useState<string | null>(null);
    const [qrImg, setQrImg] = useState<string | null>(null);

    const [oldSerial, setOldSerial] = useState("");
    const [newSerial, setNewSerial] = useState("");

    // right: list
    const [rows, setRows] = useState<SwapRow[]>([]);
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        (async () => {
            const r = await fetch("/api/v1/admin/vehicles/minimal", { cache: "no-store" }).then(r=>r.json());
            if (r.ok) setVehicles(r.data);
        })();
    }, []);

    useEffect(() => {
        (async () => {
            const u = new URL("/api/v1/admin/battery-swaps", window.location.origin);
            u.searchParams.set("page", String(page));
            u.searchParams.set("pageSize", String(pageSize));
            if (statusFilter) u.searchParams.set("status", statusFilter);
            const j = await fetch(u, { cache: "no-store" }).then(r=>r.json());
            if (j.ok) setRows(j.data);
        })();
    }, [page, statusFilter]);

    async function handleCreate() {
        try {
            if (!vehicleId || !amount || !ownerUpiId) {
                toast.error("Vehicle, Amount and Owner UPI are required");
                return;
            }
            const res = await fetch("/api/v1/admin/battery-swaps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    vehicleId: Number(vehicleId),
                    amount: Number(amount),
                    ownerUpiId,
                    ownerName: ownerName || null,
                    note: note || "Battery Swap",
                }),
            }).then(r=>r.json());
            if (res.ok) {
                setCreatedSwapId(res.data.swapId);
                setUpiUrl(res.data.upiUrl);
                setQrImg(res.data.qrImage);
                toast.success("Swap created. Ask customer to pay.");
            } else {
                toast.error(res.error || "Create failed");
            }
        } catch {
            toast.error("Create failed");
        }
    }

    async function markPaymentReceived() {
        if (!createdSwapId) return;
        const r = await fetch(`/api/v1/admin/battery-swaps/${createdSwapId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "confirm_payment" }),
        }).then(r=>r.json());
        if (r.ok) toast.success("Payment marked as received");
        else toast.error(r.error || "Failed");
    }

    async function uploadPhotos(kind: "oldPhoto" | "newPhoto", file: File) {
        if (!createdSwapId) return;
        const fd = new FormData();
        fd.set(kind, file);
        const r = await fetch(`/api/v1/admin/battery-swaps/${createdSwapId}/photos`, { method: "POST", body: fd }).then(r=>r.json());
        if (r.ok) {
            toast.success(`${kind === "oldPhoto" ? "Old" : "New"} photo uploaded`);
        } else toast.error(r.error || "Upload failed");
    }

    async function saveSerialsAndComplete() {
        if (!createdSwapId) return;
        const r1 = await fetch(`/api/v1/admin/battery-swaps/${createdSwapId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "update", oldSerial, newSerial, note }),
        }).then(r=>r.json());
        if (!r1.ok) { toast.error(r1.error || "Save failed"); return; }

        const r2 = await fetch(`/api/v1/admin/battery-swaps/${createdSwapId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "complete" }),
        }).then(r=>r.json());
        if (r2.ok) {
            toast.success("Swap completed");
            // reset minimal state
            setCreatedSwapId(null);
            setUpiUrl(null);
            setQrImg(null);
            setOldSerial(""); setNewSerial("");
            // refresh right panel
            const j = await fetch("/api/v1/admin/battery-swaps?page=1&pageSize=10", { cache: "no-store" }).then(r=>r.json());
            if (j.ok) setRows(j.data);
        } else {
            toast.error(r2.error || "Complete failed");
        }
    }

    const selectedVehicle = useMemo(() => vehicles.find(v => v.vehicleId === Number(vehicleId)) || null, [vehicleId, vehicles]);

    return (
        <div className="px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: Create & run a swap */}
            <Card className="rounded-2xl">
                <CardContent className="p-6 space-y-5">
                    <h2 className="text-xl font-bold">Battery Swap</h2>

                    {!createdSwapId && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground">Vehicle</label>
                                    <select
                                        className="border rounded px-3 py-2 w-full"
                                        value={vehicleId}
                                        onChange={(e)=>setVehicleId(e.target.value ? Number(e.target.value) : "")}
                                    >
                                        <option value="">-- choose --</option>
                                        {vehicles.map(v => (
                                            <option key={v.vehicleId} value={v.vehicleId}>
                                                {v.uniqueCode} · {v.model}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Amount (INR)</label>
                                    <Input type="number" value={amount} onChange={(e)=>setAmount(e.target.value ? Number(e.target.value) : "")} />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Owner UPI ID (pa)</label>
                                    <Input placeholder="owner@upi" value={ownerUpiId} onChange={(e)=>setOwnerUpiId(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Owner Name (pn) – optional</label>
                                    <Input placeholder="Owner Name" value={ownerName} onChange={(e)=>setOwnerName(e.target.value)} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs text-muted-foreground">Note (tn) – optional</label>
                                    <Input placeholder="Battery Swap" value={note} onChange={(e)=>setNote(e.target.value)} />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleCreate} disabled={!vehicleId || !amount || !ownerUpiId}>Generate QR</Button>
                                {selectedVehicle && (
                                    <div className="text-xs text-muted-foreground self-center">
                                        Selected: <strong>{selectedVehicle.uniqueCode}</strong> · {selectedVehicle.model}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* After creation: show QR + actions */}
                    {createdSwapId && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-6">
                                <div className="p-3 border rounded-xl bg-white">
                                    {qrImg ? <img alt="qr" src={qrImg} className="w-[220px] h-[220px]" /> : null}
                                </div>
                                <div className="space-y-2">
                                    <div className="text-sm text-muted-foreground">Ask the customer to scan & pay</div>
                                    <div className="text-lg font-bold">{fmtINR(Number(amount))}</div>
                                    <div className="text-xs text-muted-foreground break-all">{upiUrl}</div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => { navigator.clipboard.writeText(upiUrl || ""); toast.success("UPI link copied"); }}>Copy link</Button>
                                        <a href={upiUrl || "#"} target="_blank" rel="noreferrer"><Button variant="outline">Open UPI App</Button></a>
                                    </div>
                                    <Button onClick={markPaymentReceived} className="mt-2">Mark payment received</Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="text-xs text-muted-foreground">Old Battery Serial</label>
                                    <Input value={oldSerial} onChange={(e)=>setOldSerial(e.target.value)} />
                                    <label className="text-xs text-muted-foreground mt-2 block">Old Battery Photo</label>
                                    <input type="file" accept="image/*" onChange={(e)=>{ const f = e.target.files?.[0]; if (f) uploadPhotos("oldPhoto", f); }} />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">New Battery Serial</label>
                                    <Input value={newSerial} onChange={(e)=>setNewSerial(e.target.value)} />
                                    <label className="text-xs text-muted-foreground mt-2 block">New Battery Photo</label>
                                    <input type="file" accept="image/*" onChange={(e)=>{ const f = e.target.files?.[0]; if (f) uploadPhotos("newPhoto", f); }} />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={saveSerialsAndComplete} variant="default">Complete Swap</Button>
                                <Button variant="outline" onClick={() => { setCreatedSwapId(null); setUpiUrl(null); setQrImg(null); }}>Cancel</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* RIGHT: Recent swaps */}
            <Card className="rounded-2xl">
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold">Recent Swaps</h2>
                            <div className="text-xs text-muted-foreground">Most recent first</div>
                        </div>
                        <select
                            className="border rounded px-3 py-2"
                            value={statusFilter}
                            onChange={(e)=>{ setStatusFilter(e.target.value); setPage(1); }}
                        >
                            <option value="">All</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="canceled">Canceled</option>
                        </select>
                    </div>

                    <ScrollArea className="h-[540px] w-full">
                        <Table className="text-[14px]">
                            <TableHeader>
                                <TableRow className="bg-muted sticky top-0 z-10">
                                    <TableHead>Swap</TableHead>
                                    <TableHead>Vehicle</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Old→New Serial</TableHead>
                                    <TableHead>Photos</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map(r => (
                                    <TableRow key={r.swapId}>
                                        <TableCell>#{r.swapId}</TableCell>
                                        <TableCell>{r.vehicle.uniqueCode} <span className="text-muted-foreground">· {r.vehicle.model}</span></TableCell>
                                        <TableCell className="capitalize">{r.paymentStatus}</TableCell>
                                        <TableCell>{fmtINR(r.amount)}</TableCell>
                                        <TableCell>
                                            {(r.oldBatterySerial || "-")} <span className="text-muted-foreground">→</span> {(r.newBatterySerial || "-")}
                                        </TableCell>
                                        <TableCell>
                                            {r.oldBatteryPhotoUrl ? <a className="underline" href={r.oldBatteryPhotoUrl} target="_blank">old</a> : "-"}{" "}/{" "}
                                            {r.newBatteryPhotoUrl ? <a className="underline" href={r.newBatteryPhotoUrl} target="_blank">new</a> : "-"}
                                        </TableCell>
                                        <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                                {rows.length === 0 && (
                                    <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No swaps</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
