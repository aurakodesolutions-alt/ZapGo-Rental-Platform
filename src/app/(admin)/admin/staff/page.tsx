"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FileDown, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatIST } from "@/lib/format";

type Row = {
    staffId: number;
    fullName: string;
    email: string;
    position?: string | null;
    kycVerified: boolean;
    createdAtUtc: string;
};

export default function StaffPage() {
    const { toast } = useToast();

    const [rows, setRows] = React.useState<Row[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [q, setQ] = React.useState("");
    const [verified, setVerified] = React.useState<"" | "true" | "false">("");

    const debouncedQ = useDebounce(q, 300);

    const load = React.useCallback(async () => {
        setLoading(true);
        try {
            const qs = new URLSearchParams();
            if (debouncedQ) qs.set("q", debouncedQ);
            if (verified) qs.set("verified", verified);
            qs.set("limit", "100");

            const r = await fetch(`/api/v1/admin/staff?${qs.toString()}`, { cache: "no-store" });
            const j = await r.json();
            if (r.ok && j?.ok) setRows(j.data as Row[]);
            else setRows([]);
        } catch {
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedQ, verified]);

    React.useEffect(() => {
        void load();
    }, [load]);

    const exportHref = React.useMemo(() => {
        const qs = new URLSearchParams();
        if (q) qs.set("q", q);
        if (verified) qs.set("verified", verified);
        qs.set("format", "csv");
        qs.set("limit", "1000");
        return `/api/v1/admin/staff?${qs.toString()}`;
    }, [q, verified]);

    return (
        <>
            <PageHeader title="Staff" description="Manage admin users who can access the panel.">
                <Button asChild variant="outline">
                    <a href={exportHref}><FileDown className="mr-2 h-4 w-4" /> Export CSV</a>
                </Button>
                <CreateStaffButton onDone={load} />
            </PageHeader>

            <Card>
                <CardContent className="pt-6">
                    {/* Filters */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
                        <Input
                            className="sm:w-[360px]"
                            placeholder="Search by name / email / position…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                            <Label className="text-sm">Verified</Label>
                            <select
                                value={verified}
                                onChange={(e) => setVerified(e.target.value as "" | "true" | "false")}
                                className="h-9 rounded-md border bg-background px-2 text-sm"
                            >
                                <option value="">All</option>
                                <option value="true">Verified</option>
                                <option value="false">Unverified</option>
                            </select>
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Staff</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Verified</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : rows.length ? (
                                rows.map((s) => (
                                    <TableRow key={s.staffId}>
                                        <TableCell className="font-medium">{s.fullName}</TableCell>
                                        <TableCell>{s.email}</TableCell>
                                        <TableCell>{s.position || "—"}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={s.kycVerified}
                                                    onCheckedChange={async (val) => {
                                                        const next = Boolean(val);
                                                        const r = await fetch(`/api/v1/admin/staff/${s.staffId}`, {
                                                            method: "PATCH",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ kycVerified: next }),
                                                        });
                                                        if (r.ok) {
                                                            setRows((prev) =>
                                                                prev.map((row) =>
                                                                    row.staffId === s.staffId ? { ...row, kycVerified: next } : row
                                                                )
                                                            );
                                                        } else {
                                                            toast({ title: "Update failed", variant: "destructive" });
                                                        }
                                                    }}
                                                />
                                                <Badge variant={s.kycVerified ? "default" : "secondary"}>
                                                    {s.kycVerified ? "Verified" : "Unverified"}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatIST(s.createdAtUtc, "dd MMM yyyy, hh:mm a")}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <EditStaffButton staff={s} onDone={load} />
                                                <DeleteStaffButton staffId={s.staffId} onDone={load} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                                        No staff found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}

/* ---------- Create button & dialog ---------- */
function CreateStaffButton({ onDone }: { onDone: () => void }) {
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);

    const [fullName, setFullName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [position, setPosition] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [kycVerified, setKycVerified] = React.useState(false);

    async function handleCreate() {
        try {
            setSubmitting(true);
            const r = await fetch("/api/v1/admin/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, email, position, password, kycVerified }),
            });
            const j = await r.json();
            if (!r.ok || !j?.ok) throw new Error(j?.error || "Create failed");
            toast({ title: "Staff created", description: `#${j.data.staffId} added.` });
            setOpen(false);
            onDone();
        } catch (e: any) {
            toast({ title: "Error", description: String(e?.message || e), variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> New Staff</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Add Staff</DialogTitle></DialogHeader>
                <div className="grid gap-4">
                    <LabeledInput label="Full name" value={fullName} onChange={setFullName} />
                    <LabeledInput label="Email" type="email" value={email} onChange={setEmail} />
                    <LabeledInput label="Position" value={position} onChange={setPosition} />
                    <LabeledInput label="Password" type="password" value={password} onChange={setPassword} />
                    <div className="flex items-center gap-2">
                        <Switch checked={kycVerified} onCheckedChange={(v) => setKycVerified(Boolean(v))} />
                        <span className="text-sm">KYC Verified</span>
                    </div>
                    <Button disabled={submitting} onClick={handleCreate}>Create</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/* ---------- Edit button & dialog ---------- */
function EditStaffButton({ staff, onDone }: { staff: Row; onDone: () => void }) {
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);

    const [fullName, setFullName] = React.useState(staff.fullName);
    const [email, setEmail] = React.useState(staff.email);
    const [position, setPosition] = React.useState(staff.position || "");
    const [newPassword, setNewPassword] = React.useState("");

    async function handleSave() {
        try {
            setSubmitting(true);
            const body: Record<string, unknown> = { fullName, email, position };
            if (newPassword) body.password = newPassword;

            const r = await fetch(`/api/v1/admin/staff/${staff.staffId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const j = await r.json();
            if (!r.ok || !j?.ok) throw new Error(j?.error || "Update failed");

            toast({ title: "Updated" });
            setOpen(false);
            onDone();
        } catch (e: any) {
            toast({ title: "Error", description: String(e?.message || e), variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Edit Staff</DialogTitle></DialogHeader>
                <div className="grid gap-4">
                    <LabeledInput label="Full name" value={fullName} onChange={setFullName} />
                    <LabeledInput label="Email" type="email" value={email} onChange={setEmail} />
                    <LabeledInput label="Position" value={position} onChange={setPosition} />
                    <LabeledInput
                        label="New password"
                        type="password"
                        placeholder="(leave blank to keep current)"
                        value={newPassword}
                        onChange={setNewPassword}
                    />
                    <Button disabled={submitting} onClick={handleSave}>Save</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/* ---------- Delete button ---------- */
function DeleteStaffButton({ staffId, onDone }: { staffId: number; onDone: () => void }) {
    const { toast } = useToast();

    async function handleDelete() {
        const r = await fetch(`/api/v1/admin/staff/${staffId}`, { method: "DELETE" });
        const j = await r.json();
        if (!r.ok || !j?.ok) {
            toast({ title: "Delete failed", variant: "destructive" });
        } else {
            toast({ title: "Deleted" });
            onDone();
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete this staff?</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDelete}>
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

/* ---------- small helpers ---------- */
type LabeledInputProps = {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
};

function LabeledInput({ label, value, onChange, type = "text", placeholder }: LabeledInputProps) {
    return (
        <div className="grid gap-1">
            <label className="text-sm">{label}</label>
            <Input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

function useDebounce<T>(value: T, ms = 300) {
    const [v, setV] = React.useState(value);
    React.useEffect(() => {
        const id = setTimeout(() => setV(value), ms);
        return () => clearTimeout(id);
    }, [value, ms]);
    return v;
}
