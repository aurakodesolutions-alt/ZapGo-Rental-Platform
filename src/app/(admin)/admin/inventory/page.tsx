"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatIST } from "@/lib/format";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ItemType = "Battery" | "Charger" | "Controller" | "Converter" | "Motor";
type Status   = "InStock" | "Assigned" | "Damaged" | "Retired" | "Lost";

const ITEM_TYPES: ItemType[] = ["Battery","Charger","Controller","Converter","Motor"];
const STATUSES: Status[] = ["InStock","Assigned","Damaged","Retired","Lost"];

type Row = {
    itemId: number;
    itemType: ItemType;
    serialNumber: string;
    status: Status;
    assignedRentalId: number | null;
    notes: string | null;
    createdAt: string; updatedAt: string;
    rider?: { riderId: number; fullName: string; phone: string } | null;
};

export default function InventoryPage() {
    const { toast } = useToast();
    const [rows, setRows] = React.useState<Row[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [q, setQ] = React.useState("");
    const [type, setType] = React.useState<string>("");
    const [status, setStatus] = React.useState<string>("");

    const [draft, setDraft] = React.useState<{[id: number]: Partial<Row>}>({});
    const [adding, setAdding] = React.useState<{ itemType: ItemType; serialNumber: string; status: Status; notes: string }>({
        itemType: "Battery", serialNumber: "", status: "InStock", notes: ""
    });

    const debouncedQ = useDebounce(q, 300);
    const dirty = (id: number) => !!draft[id] && Object.keys(draft[id]).length > 0;

    React.useEffect(() => {
        let aborted = false;
        async function load() {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (debouncedQ) params.set("q", debouncedQ);
                if (type) params.set("type", type);
                if (status) params.set("status", status);
                params.set("limit", "200");
                const r = await fetch(`/api/v1/admin/inventory?${params.toString()}`, { cache: "no-store" });
                const j = await r.json();
                if (!aborted && r.ok && j?.ok) setRows(j.data);
            } catch {
                if (!aborted) setRows([]);
            } finally {
                if (!aborted) setLoading(false);
            }
        }
        load();
        return () => { aborted = true; };
    }, [debouncedQ, type, status]);

    const setCell = (id: number, patch: Partial<Row>) =>
        setDraft(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch }}));

    async function saveRow(id: number) {
        const patch = draft[id];
        if (!patch || Object.keys(patch).length === 0) return;
        try {
            const r = await fetch(`/api/v1/admin/inventory/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itemType: patch.itemType,
                    serialNumber: patch.serialNumber,
                    status: patch.status,
                    assignedRentalId: patch.assignedRentalId ?? null,
                    notes: patch.notes ?? null,
                }),
            });
            const j = await r.json();
            if (!r.ok || !j?.ok) throw new Error(j?.error || "Update failed");
            setRows(prev => prev.map(x => x.itemId === id ? { ...x, ...j.data } : x));
            setDraft(prev => { const d = { ...prev }; delete d[id]; return d; });
            toast({ title: "Saved", description: `Item #${id} updated.` });
        } catch (e: any) {
            toast({ title: "Error", description: String(e.message || e), variant: "destructive" });
        }
    }

    async function deleteRow(id: number) {
        try {
            const r = await fetch(`/api/v1/admin/inventory/${id}`, { method: "DELETE" });
            const j = await r.json();
            if (!r.ok || !j?.ok) throw new Error(j?.error || "Delete failed");
            setRows(prev => prev.filter(x => x.itemId !== id));
            setDraft(prev => { const d = { ...prev }; delete d[id]; return d; });
            toast({ title: "Deleted", description: `Item #${id} removed.` });
        } catch (e: any) {
            toast({ title: "Error", description: String(e.message || e), variant: "destructive" });
        }
    }

    async function addOne() {
        try {
            if (!adding.serialNumber.trim()) {
                toast({ title: "Serial required", description: "Please enter serial number.", variant: "destructive" });
                return;
            }
            const r = await fetch("/api/v1/admin/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itemType: adding.itemType,
                    serialNumber: adding.serialNumber.trim(),
                    status: adding.status,
                    notes: adding.notes?.trim() || null,
                }),
            });
            const j = await r.json();
            if (!r.ok || !j?.ok) throw new Error(j?.error || "Create failed");
            // reload (simplest)
            setAdding({ itemType: "Battery", serialNumber: "", status: "InStock", notes: "" });
            const r2 = await fetch("/api/v1/admin/inventory?limit=1"); // quickest: fetch latest added
            const j2 = await r2.json();
            if (r2.ok && j2?.ok && j2.data?.length) {
                setRows(prev => [j2.data[0], ...prev]);
            } else {
                // fallback: just refetch list
                const params = new URLSearchParams(); params.set("limit","200");
                const r3 = await fetch(`/api/v1/admin/inventory?${params.toString()}`);
                const j3 = await r3.json();
                if (r3.ok && j3?.ok) setRows(j3.data);
            }
            toast({ title: "Added", description: "New inventory item created." });
        } catch (e: any) {
            toast({ title: "Error", description: String(e.message || e), variant: "destructive" });
        }
    }

    const exportHref = React.useMemo(() => {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (type) params.set("type", type);
        if (status) params.set("status", status);
        params.set("format", "csv");
        return `/api/v1/admin/inventory?${params.toString()}`;
    }, [q, type, status]);

    return (
        <>
            <PageHeader title="Misc Inventory" description="Batteries, chargers, controllers, converters and motors. Inline-editable table.">
                <Button asChild variant="outline"><a href={exportHref}>Export CSV</a></Button>
            </PageHeader>

            <Card>
                <CardContent className="pt-6">

                    {/* Filters */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
                        <Input
                            className="sm:w-[360px]"
                            placeholder="Search serial / notes / id…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <select className="h-9 rounded-md border bg-background px-2 text-sm" value={type} onChange={(e)=>setType(e.target.value)}>
                                <option value="">All Types</option>
                                {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <select className="h-9 rounded-md border bg-background px-2 text-sm" value={status} onChange={(e)=>setStatus(e.target.value)}>
                                <option value="">All Status</option>
                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Inline add row */}
                    <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
                        <select className="h-9 rounded-md border bg-background px-2 text-sm"
                                value={adding.itemType}
                                onChange={(e)=>setAdding(v => ({...v, itemType: e.target.value as ItemType}))}
                        >
                            {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <Input placeholder="Serial number" value={adding.serialNumber}
                               onChange={e=>setAdding(v=>({...v, serialNumber: e.target.value}))}/>
                        <select className="h-9 rounded-md border bg-background px-2 text-sm"
                                value={adding.status}
                                onChange={(e)=>setAdding(v => ({...v, status: e.target.value as Status}))}
                        >
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <Input placeholder="Notes (optional)" value={adding.notes}
                               onChange={e=>setAdding(v=>({...v, notes: e.target.value}))}/>
                        <Button onClick={addOne}>Add</Button>
                    </div>

                    {/* Table */}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Serial</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Assigned</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                ))
                            ) : rows.length ? (
                                rows.map(r => (
                                    <TableRow key={r.itemId}>
                                        <TableCell className="font-medium">#{r.itemId}</TableCell>

                                        <TableCell>
                                            <select
                                                className="h-8 rounded-md border bg-background px-2 text-sm"
                                                defaultValue={r.itemType}
                                                onChange={(e) => setCell(r.itemId, { itemType: e.target.value as ItemType })}
                                            >
                                                {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </TableCell>

                                        <TableCell>
                                            <Input
                                                className="h-8"
                                                defaultValue={r.serialNumber}
                                                onChange={(e)=>setCell(r.itemId, { serialNumber: e.target.value })}
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <select
                                                className="h-8 rounded-md border bg-background px-2 text-sm"
                                                defaultValue={r.status}
                                                onChange={(e) => setCell(r.itemId, { status: e.target.value as Status })}
                                            >
                                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </TableCell>

                                        <TableCell>
                                            {r.assignedRentalId
                                                ? <Link className="text-primary hover:underline" href={`/admin/rentals/${r.assignedRentalId}`}>#{r.assignedRentalId}</Link>
                                                : <span className="text-muted-foreground">—</span>}
                                        </TableCell>

                                        <TableCell>
                                            <Input
                                                className="h-8"
                                                defaultValue={r.notes ?? ""}
                                                onChange={(e)=>setCell(r.itemId, { notes: e.target.value })}
                                            />
                                        </TableCell>

                                        <TableCell className="whitespace-nowrap">{formatIST(r.updatedAt, "dd MMM yyyy, hh:mm a")}</TableCell>

                                        <TableCell className="text-right space-x-2">
                                            <Button size="sm" disabled={!dirty(r.itemId)} onClick={()=>saveRow(r.itemId)}>Save</Button>
                                            <Button size="sm" variant="outline" disabled={!dirty(r.itemId)}
                                                    onClick={()=>setDraft(prev=>{ const d={...prev}; delete d[r.itemId]; return d; })}>
                                                Reset
                                            </Button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="sm" variant="destructive">Delete</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete item #{r.itemId}?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently remove the record. This won’t touch any past rentals.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={()=>deleteRow(r.itemId)}>
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={8} className="text-center py-12 text-sm text-muted-foreground">No items found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}

/* small debounce */
function useDebounce<T>(value: T, ms = 300) {
    const [v, setV] = React.useState(value);
    React.useEffect(() => { const id = setTimeout(()=>setV(value), ms); return () => clearTimeout(id); }, [value, ms]);
    return v;
}
