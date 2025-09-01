'use client';

import { useState } from 'react';
import Link from 'next/link';
import {useParams, useRouter} from 'next/navigation';
import { ArrowLeft, File, Trash2, Upload, Eye, Pencil } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { RiderForm, RiderFormValues } from '@/components/admin/forms/rider-form';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { useToast } from '@/hooks/use-toast';
import { useRider } from '@/hooks/api/use-riders';

export default function RiderDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();          // ✅ useParams in Client Components
    const id = Number(params?.id) ;                     // route param (string)
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [editing, setEditing] = useState(false);

    // fetch from API
    const { rider, isLoading, isError, update, remove } = useRider(params.id);

    if (isLoading) {
        return <div className="p-6 text-sm text-muted-foreground">Loading rider…</div>;
    }

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

    async function handleSave(values: RiderFormValues) {
        setSubmitting(true);
        try {
            // Map RiderFormValues -> RiderUpdateInput (basic + kyc)
            await update({
                fullName: values.fullName,
                phone: values.phone,
                email: values.email,
                kyc: {
                    aadhaarNumber: values.aadhaar,
                    panNumber: values.pan,
                    drivingLicenseNumber: values.dl || null,
                    // NOTE: hook your upload route to save files and put URLs here:
                    aadhaarImageUrl: "",
                    panCardImageUrl: "",
                    drivingLicenseImageUrl: "",
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

    const kyc = rider.kyc;

    return (
        <div className="space-y-6">
            <PageHeader
                title={rider.fullName}
                description={`Manage ${rider.fullName}'s profile and history.`}
            >
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

                {/* PROFILE */}
                <TabsContent value="profile" className="mt-4">
                    {!editing ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Rider Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Full Name</div>
                                        <div className="mt-1 font-medium">{rider.fullName}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Phone</div>
                                        <div className="mt-1 font-medium">{rider.phone}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Email</div>
                                        <div className="mt-1 font-medium">{rider.email}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground">Created</div>
                                        <div className="mt-1 text-sm">
                                            {new Date(rider.createdAtUtc).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm text-muted-foreground">KYC (summary)</div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <Badge variant={kyc?.aadhaarNumber ? 'secondary' : 'outline'}>Aadhaar</Badge>
                                        <Badge variant={kyc?.panNumber ? 'secondary' : 'outline'}>PAN</Badge>
                                        <Badge variant={kyc?.drivingLicenseNumber ? 'secondary' : 'outline'}>DL</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
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
                                        // Contact
                                        fullName: rider.fullName,
                                        phone: rider.phone,
                                        email: rider.email,

                                        // KYC (pre-fill from nested KYC if present)
                                        aadhaar: kyc?.aadhaarNumber ?? '',
                                        pan: kyc?.panNumber ?? '',
                                        dl: kyc?.drivingLicenseNumber ?? '',

                                    }}
                                />
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* RENTALS (placeholder for now) */}
                <TabsContent value="rentals" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rental History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">
                                Coming soon — wire this to <code>/api/v1/admin/rentals?riderId={rider.riderId}</code>.
                            </div>
                            <Table className="mt-4">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Vehicle</TableHead>
                                        <TableHead>Period</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            No rentals to display.
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PAYMENTS (placeholder for now) */}
                <TabsContent value="payments" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">
                                Coming soon — wire this to <code>/api/v1/admin/payments?riderId={rider.riderId}</code>.
                            </div>
                            <Table className="mt-4">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            No payments to display.
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* KYC DOCUMENTS */}
                <TabsContent value="kyc" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>KYC Documents</CardTitle>
                            <Button size="sm">
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Document
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {/* Replace with your KYC docs list once you persist URLs */}
                            {!(kyc?.aadhaarImageUrl || kyc?.panCardImageUrl || kyc?.drivingLicenseImageUrl) ? (
                                <p className="py-4 text-center text-muted-foreground">No KYC documents uploaded.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {kyc?.aadhaarImageUrl && (
                                        <li className="flex items-center justify-between rounded-md border p-3">
                                            <div className="flex items-center gap-2">
                                                <File className="h-5 w-5 text-muted-foreground" />
                                                <a href={kyc.aadhaarImageUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                    Aadhaar
                                                </a>
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Aadhaar document?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </li>
                                    )}

                                    {kyc?.panCardImageUrl && (
                                        <li className="flex items-center justify-between rounded-md border p-3">
                                            <div className="flex items-center gap-2">
                                                <File className="h-5 w-5 text-muted-foreground" />
                                                <a href={kyc.panCardImageUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                    PAN
                                                </a>
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete PAN document?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </li>
                                    )}

                                    {kyc?.drivingLicenseImageUrl && (
                                        <li className="flex items-center justify-between rounded-md border p-3">
                                            <div className="flex items-center gap-2">
                                                <File className="h-5 w-5 text-muted-foreground" />
                                                <a href={kyc.drivingLicenseImageUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                    Driving License
                                                </a>
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete DL document?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </li>
                                    )}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
