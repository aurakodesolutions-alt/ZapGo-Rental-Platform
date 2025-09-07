'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
    ArrowLeft, Eye, Pencil, Trash2, Upload, ExternalLink,
    File as FileIcon, X, Phone, Mail, User, IndianRupee, ClipboardList, CreditCard
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

import { useToast } from '@/hooks/use-toast';
import { useRider } from '@/hooks/api/use-riders';
import { RiderForm, RiderFormValues } from '@/components/admin/forms/rider-form';
import { cn } from '@/lib/utils';

/* ---------------- helpers ---------------- */
const fetcher = async <T,>(url: string) => {
    const r = await fetch(url);
    const j = await r.json();
    if (!r.ok || j?.ok === false) throw new Error(j?.error || 'Request failed');
    return j as { ok: true; data: T; page?: any };
};

const isPdf = (url?: string | null) => !!url && /\.pdf($|\?)/i.test(url);
const hasVal = (v?: string | null) => !!(v && String(v).trim().length);

type DocKey =
    | 'aadhaarImageUrl'
    | 'panCardImageUrl'
    | 'drivingLicenseImageUrl'
    | 'selfieImageUrl';

type UploadField = 'aadhaarFile' | 'panFile' | 'dlFile' | 'selfieFile';

const fieldMap: Record<UploadField, DocKey> = {
    aadhaarFile: 'aadhaarImageUrl',
    panFile: 'panCardImageUrl',
    dlFile: 'drivingLicenseImageUrl',
    selfieFile: 'selfieImageUrl',
};

const fmtINR = (n: number | null | undefined) =>
    typeof n === 'number' ? n.toLocaleString('en-IN') : '0';

const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString() : '—';

const initials = (name?: string | null) =>
    (name || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase() ?? '')
        .join('') || 'R';

/* ---------------- API Types ---------------- */
type RentalRow = {
    rentalId: number | string;
    riderId: number;
    vehicleId: number | string;
    planId: number;
    startDate: string;
    expectedReturnDate: string | null;
    actualReturnDate: string | null;
    status: string;
    ratePerDay: number;
    deposit: number;
    payableTotal: number;
    paidTotal: number;
    balanceDue: number;
    vehicle?: { model?: string | null; code?: string | null };
    plan?: { name?: string | null };
};

type PaymentRow = {
    paymentId: number | string;
    rentalId: number | string;
    riderId: number;
    amount: number;
    method: string;
    txnRef: string | null;
    transactionDate: string | null;
    transactionStatus: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    rider?: { name?: string | null; phone?: string | null };
    rental?: { status?: string | null };
    vehicle?: { model?: string | null; code?: string | null };
};

/* -------------------- Document Card -------------------- */
function DocCard({
                     title,
                     url,
                     accept = 'image/*,application/pdf',
                     uploadField,
                     riderName,
                     onPersist,
                     className,
                 }: {
    title: string;
    url?: string | null;
    accept?: string;
    uploadField: UploadField;
    riderName: string;
    onPersist: (key: DocKey, value: string | null) => Promise<void>;
    className?: string;
}) {
    const [busy, setBusy] = useState(false);

    const onUpload = async (file: File | null) => {
        if (!file) return;
        setBusy(true);
        try {
            const fd = new FormData();
            fd.set('riderName', riderName);
            fd.set(uploadField, file);

            const r = await fetch('/api/v1/admin/riders/upload', { method: 'POST', body: fd });
            const j = await r.json();
            if (!r.ok || !j?.ok) throw new Error(j?.error || 'Upload failed');

            const returnedUrl: string | undefined = j?.data?.[uploadField];
            if (!returnedUrl) throw new Error('Upload response missing URL');
            await onPersist(fieldMap[uploadField], returnedUrl);
        } catch (e: any) {
            alert(e?.message || 'Upload error');
        } finally {
            setBusy(false);
        }
    };

    const onRemove = async () => {
        if (!confirm(`Remove ${title}?`)) return;
        setBusy(true);
        try {
            await onPersist(fieldMap[uploadField], null);
        } catch (e: any) {
            alert(e?.message || 'Delete error');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Card className={cn('rounded-2xl', className)}>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{title}</CardTitle>
                <div className="flex items-center gap-2">
                    <label className="inline-flex">
                        <input
                            type="file"
                            className="hidden"
                            accept={accept}
                            onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
                        />
                        <Button size="sm" variant="outline" disabled={busy}>
                            <Upload className="mr-2 h-4 w-4" />
                            {url ? 'Replace' : 'Upload'}
                        </Button>
                    </label>
                    {url ? (
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={onRemove}
                            disabled={busy}
                            className="text-destructive"
                            title="Remove"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    ) : null}
                </div>
            </CardHeader>

            <CardContent>
                {!hasVal(url) ? (
                    <div className="rounded-md border bg-muted/40 p-6 text-sm text-muted-foreground text-center">
                        No file uploaded
                    </div>
                ) : isPdf(url!) ? (
                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <FileIcon className="h-5 w-5" />
                            <span>PDF Document</span>
                        </div>
                        <a href={url!} target="_blank" className="inline-flex items-center text-sm text-primary hover:underline" rel="noreferrer">
                            Open PDF <ExternalLink className="ml-1 h-4 w-4" />
                        </a>
                    </div>
                ) : (
                    <a href={url!} target="_blank" className="block group" rel="noreferrer">
                        <img
                            src={url!}
                            alt={`${title} preview`}
                            className="w-full max-h-[240px] object-cover rounded-lg border transition group-hover:opacity-90"
                        />
                    </a>
                )}
            </CardContent>
        </Card>
    );
}

/* -------------------- Page -------------------- */
export default function RiderDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const { toast } = useToast();

    const { rider, isLoading, isError, update, remove } = useRider(params.id);
    const [submitting, setSubmitting] = useState(false);
    const [editing, setEditing] = useState(false);

    const riderName = useMemo(() => rider?.fullName ?? 'rider', [rider]);
    const riderId = rider?.riderId;

    // Rentals & payments (admin APIs)
    const { data: rentalsResp } = useSWR<{ ok: true; data: RentalRow[] }>(
        riderId ? `/api/v1/admin/riders/rentals?riderId=${riderId}&limit=50&offset=0&order=start_desc` : null,
        fetcher
    );

    const { data: paymentsResp } = useSWR<{ ok: true; data: PaymentRow[] }>(
        riderId ? `/api/v1/admin/riders/payments?riderId=${riderId}&limit=50&offset=0&order=date_desc` : null,
        fetcher
    );

    const rentals = rentalsResp?.data ?? [];
    const payments = paymentsResp?.data ?? [];

    // Quick stats
    const rentalsCount = rentals.length;
    const totalPaidSuccessful = payments
        .filter((p) => (p.transactionStatus || '').toUpperCase() === 'SUCCESS')
        .reduce((acc, p) => acc + (p.amount || 0), 0);

    const outstanding = rentals.reduce((acc, r) => acc + Math.max(0, r.balanceDue || 0), 0);

    if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading rider…</div>;
    if (isError || !rider) {
        return (
            <div className="p-6 text-sm text-destructive">
                Failed to load rider.
                <div className="mt-3">
                    <Button variant="outline" asChild>
                        <Link href="/admin/riders">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    const kyc = rider.kyc;

    const persistDoc = async (key: DocKey, value: string | null) => {
        await update({
            kyc: {
                // keep numbers if present; send empty string to keep schema happy
                aadhaarNumber: kyc?.aadhaarNumber ?? '',
                panNumber: kyc?.panNumber ?? '',
                drivingLicenseNumber: kyc?.drivingLicenseNumber ?? undefined,
                aadhaarImageUrl: key === 'aadhaarImageUrl' ? (value ?? '') : (kyc?.aadhaarImageUrl ?? ''),
                panCardImageUrl: key === 'panCardImageUrl' ? (value ?? '') : (kyc?.panCardImageUrl ?? ''),
                drivingLicenseImageUrl: key === 'drivingLicenseImageUrl' ? (value ?? '') : (kyc?.drivingLicenseImageUrl ?? ''),
                selfieImageUrl: key === 'selfieImageUrl' ? (value ?? '') : ((kyc as any)?.selfieImageUrl ?? ''),
            },
        });
        toast({ title: 'Saved', description: `${key.replace(/ImageUrl/, '')} updated.` });
        router.refresh?.();
    };

    async function handleSave(values: RiderFormValues) {
        setSubmitting(true);
        try {
            // Upload any selected files first (works even if RiderForm doesn't type these fields)
            const vAny = values as any;
            const fd = new FormData();
            fd.set('riderName', values.fullName);
            if (vAny.aadhaarFile) fd.set('aadhaarFile', vAny.aadhaarFile);
            if (vAny.panFile) fd.set('panFile', vAny.panFile);
            if (vAny.dlFile) fd.set('dlFile', vAny.dlFile);
            if (vAny.selfieFile) fd.set('selfieFile', vAny.selfieFile);

            let urls: Partial<Record<UploadField, string>> = {};
            if ([vAny.aadhaarFile, vAny.panFile, vAny.dlFile, vAny.selfieFile].some(Boolean)) {
                const up = await fetch('/api/v1/public/riders/upload', { method: 'POST', body: fd });
                const j = await up.json();
                if (!up.ok || !j?.ok) throw new Error(j?.error || 'Upload failed');
                urls = j.data || {};
            }

            await update({
                fullName: values.fullName,
                phone: values.phone,
                email: values.email,
                // Optional admin password reset
                password: (vAny.password ? vAny.password : undefined) as string | undefined,
                kyc: {
                    aadhaarNumber: values.aadhaar,
                    panNumber: values.pan,
                    drivingLicenseNumber: values.dl || null,
                    aadhaarImageUrl: urls.aadhaarFile ?? kyc?.aadhaarImageUrl ?? '',
                    panCardImageUrl: urls.panFile ?? kyc?.panCardImageUrl ?? '',
                    drivingLicenseImageUrl: urls.dlFile ?? kyc?.drivingLicenseImageUrl ?? '',
                    selfieImageUrl: urls.selfieFile ?? (kyc as any)?.selfieImageUrl ?? '',
                },
            });

            toast({ title: 'Rider updated', description: `Saved changes for ${values.fullName}.` });
            setEditing(false);
            router.refresh?.();
        } catch (e: any) {
            toast({ title: 'Update failed', description: String(e?.message || e), variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        try {
            await remove();
            toast({ title: 'Rider deleted' });
            router.push('/admin/riders');
        } catch (e: any) {
            toast({ title: 'Delete failed', description: String(e?.message || e), variant: 'destructive' });
        }
    }

    /* ---------- UI helpers ---------- */
    const StatCard = ({
                          title, value, icon: Icon,
                      }: { title: string; value: string; icon: React.ComponentType<any> }) => (
        <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <PageHeader title={rider.fullName} description={`Manage ${rider.fullName}'s profile and history.`}>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/admin/riders">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>

                    {!editing ? (
                        <Button onClick={() => setEditing(true)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    ) : (
                        <Button variant="secondary" onClick={() => setEditing(false)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                        </Button>
                    )}

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete rider “{rider.fullName}”?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. Any historical rentals/payments remain in the system.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDelete}>
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </PageHeader>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="rentals">Rentals</TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                    <TabsTrigger value="kyc">KYC Documents</TabsTrigger>
                </TabsList>

                {/* PROFILE (revamped) */}
                <TabsContent value="profile" className="mt-4 space-y-6">
                    {!editing ? (
                        <>
                            {/* Top: identity + contact */}
                            <Card className="rounded-2xl">
                                <CardContent className="p-6">
                                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold">
                                                {initials(rider.fullName)}
                                            </div>
                                            <div>
                                                <div className="text-xl font-semibold">{rider.fullName}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Rider ID: <span className="font-mono">{rider.riderId}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-4 w-full md:w-auto">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span>{rider.phone || '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="truncate max-w-[220px]">{rider.email || '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span>Created {rider.createdAtUtc ? new Date(rider.createdAtUtc).toLocaleDateString() : '—'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* KYC summary chips */}
                                    <Separator className="my-4" />
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant={kyc?.aadhaarNumber ? 'secondary' : 'outline'}>Aadhaar</Badge>
                                        <Badge variant={kyc?.panNumber ? 'secondary' : 'outline'}>PAN</Badge>
                                        <Badge variant={kyc?.drivingLicenseNumber ? 'secondary' : 'outline'}>DL</Badge>
                                        <Badge variant={(kyc as any)?.selfieImageUrl ? 'secondary' : 'outline'}>Selfie</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Stats */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <StatCard title="Total Rentals" value={String(rentalsCount)} icon={ClipboardList} />
                                <StatCard title="Total Paid" value={`₹${fmtINR(totalPaidSuccessful)}`} icon={IndianRupee} />
                                <StatCard title="Outstanding" value={`₹${fmtINR(outstanding)}`} icon={CreditCard} />
                            </div>

                            {/* Recent activity previews */}
                            <div className="grid gap-6 md:grid-cols-2">
                                <Card className="rounded-2xl">
                                    <CardHeader>
                                        <CardTitle>Recent Rentals</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Vehicle</TableHead>
                                                    <TableHead>Period</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(rentals ?? []).slice(0, 5).map((r) => (
                                                    <TableRow key={String(r.rentalId)}>
                                                        <TableCell>#{r.rentalId}</TableCell>
                                                        <TableCell>{r.vehicle?.model || '—'}</TableCell>
                                                        <TableCell>
                                                            {new Date(r.startDate).toLocaleDateString()} →{' '}
                                                            {r.expectedReturnDate ? new Date(r.expectedReturnDate).toLocaleDateString() : '—'}
                                                        </TableCell>
                                                        <TableCell className="text-right">₹{fmtINR(r.payableTotal)}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {!rentals.length && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                            No rentals yet.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl">
                                    <CardHeader>
                                        <CardTitle>Recent Payments</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Method</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(payments ?? []).slice(0, 5).map((p) => (
                                                    <TableRow key={String(p.paymentId)}>
                                                        <TableCell>#{p.paymentId}</TableCell>
                                                        <TableCell>{fmtDate(p.transactionDate)}</TableCell>
                                                        <TableCell>{p.method}</TableCell>
                                                        <TableCell className="text-right">₹{fmtINR(p.amount)}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {!payments.length && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                            No payments yet.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Edit Profile</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RiderForm
                                    mode="edit"
                                    submitting={submitting}
                                    onSubmitAction={handleSave}
                                    onCancel={() => setEditing(false)}
                                    initialValues={{
                                        fullName: rider.fullName,
                                        phone: rider.phone,
                                        email: rider.email,
                                        aadhaar: kyc?.aadhaarNumber ?? '',
                                        pan: kyc?.panNumber ?? '',
                                        dl: kyc?.drivingLicenseNumber ?? '',
                                    }}
                                />
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* RENTALS tab */}
                <TabsContent value="rentals" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rental History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Vehicle</TableHead>
                                        <TableHead>Start</TableHead>
                                        <TableHead>Return</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Payable</TableHead>
                                        <TableHead className="text-right">Paid</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(rentals ?? []).map((r) => (
                                        <TableRow key={String(r.rentalId)}>
                                            <TableCell>#{r.rentalId}</TableCell>
                                            <TableCell>{r.vehicle?.model || '—'}</TableCell>
                                            <TableCell>{fmtDate(r.startDate)}</TableCell>
                                            <TableCell>{fmtDate(r.expectedReturnDate)}</TableCell>
                                            <TableCell>
                                                <Badge variant={r.status === 'ongoing' ? 'secondary' : 'outline'}>{r.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">₹{fmtINR(r.payableTotal)}</TableCell>
                                            <TableCell className="text-right">₹{fmtINR(r.paidTotal)}</TableCell>
                                            <TableCell className="text-right">₹{fmtINR(r.balanceDue)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {!rentals.length && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                                No rentals to display.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PAYMENTS tab */}
                <TabsContent value="payments" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(payments ?? []).map((p) => (
                                        <TableRow key={String(p.paymentId)}>
                                            <TableCell>#{p.paymentId}</TableCell>
                                            <TableCell>{fmtDate(p.transactionDate)}</TableCell>
                                            <TableCell>{p.method}</TableCell>
                                            <TableCell>
                                                <Badge variant={(p.transactionStatus || '').toUpperCase() === 'SUCCESS' ? 'secondary' : 'outline'}>
                                                    {p.transactionStatus || '—'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">₹{fmtINR(p.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {!payments.length && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                No payments to display.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* KYC DOCUMENTS */}
                <TabsContent value="kyc" className="mt-4">
                    <div className="grid md:grid-cols-2 gap-6">
                        <DocCard
                            title="Aadhaar"
                            url={kyc?.aadhaarImageUrl}
                            uploadField="aadhaarFile"
                            riderName={riderName}
                            onPersist={persistDoc}
                        />
                        <DocCard
                            title="PAN"
                            url={kyc?.panCardImageUrl}
                            uploadField="panFile"
                            riderName={riderName}
                            onPersist={persistDoc}
                        />
                        <DocCard
                            title="Driving License"
                            url={kyc?.drivingLicenseImageUrl}
                            uploadField="dlFile"
                            riderName={riderName}
                            onPersist={persistDoc}
                        />
                        <DocCard
                            title="Selfie"
                            url={(kyc as any)?.selfieImageUrl}
                            uploadField="selfieFile"
                            accept="image/*"
                            riderName={riderName}
                            onPersist={persistDoc}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
