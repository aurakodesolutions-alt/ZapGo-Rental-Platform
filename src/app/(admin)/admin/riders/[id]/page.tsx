'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/admin/page-header';
import { mockRiders, mockRentals, mockPayments } from '@/lib/mock-data';
import { notFound, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, File, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatINR, formatIST } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import * as mockApi from '@/lib/mock-data';
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
} from "@/components/ui/alert-dialog"

// 🔁 use the shared RiderForm (refactor)
import { useState } from 'react';
import { RiderForm, RiderFormValues } from '@/components/admin/forms/rider-form';

export default function RiderDetailPage({ params }: { params: { id: string } }) {
    const rider = mockRiders.find((r) => r.id === params.id); // This will be updated to use the API
    const router = useRouter();

    if (!rider) {
        notFound();
    }

    const riderRentals = mockRentals.filter((r) => r.riderId === rider.id);
    const riderPayments = mockPayments.filter((p) => p.riderId === rider.id);

    const [submitting, setSubmitting] = useState(false);

    async function handleSave(values: RiderFormValues) {
        setSubmitting(true);
        try {
            // Wire to your backend later
            // await mockApi.updateRider(rider.id, values as any);
            router.refresh();
        } finally {
            setSubmitting(false);
        }
    }

    const handleDelete = async () => {
        // In a real app, you'd show a toast on success/error
        router.push('/riders');
    }

    return (
        <div className="space-y-6">
            <PageHeader title={rider.fullName} description={`Manage ${rider.fullName}'s profile and history.`}>
                <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Riders</Button>
            </PageHeader>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="rentals">Rentals ({riderRentals.length})</TabsTrigger>
                    <TabsTrigger value="payments">Payments ({riderPayments.length})</TabsTrigger>
                    <TabsTrigger value="kyc">KYC Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
                        <CardContent>
                            <RiderForm
                                mode="edit"
                                submitting={submitting}
                                onSubmitAction={handleSave}
                                onCancel={() => router.back()}
                                initialValues={{
                                    // Contact
                                    fullName: rider.fullName ?? "",
                                    phone: rider.phone ?? "",
                                    email: rider.email ?? "",
                                    // KYC
                                    aadhaar: (rider as any).aadhaar ?? "",
                                    pan: (rider as any).pan ?? "",
                                    dl: (rider as any).dl ?? "",
                                    // Plan & vehicle
                                    plan: ((rider as any).plan as "Lite" | "Pro") ?? "Lite",
                                    vehicleId: (rider as any).vehicleId ?? "",
                                    // Schedule
                                    startDate: (rider as any).startDate
                                        ? new Date((rider as any).startDate).toISOString().slice(0, 10)
                                        : "",
                                    durationUnit: ((rider as any).durationUnit as "days" | "weeks" | "months") ?? "months",
                                    durationValue: (rider as any).durationValue ?? 1,
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rentals" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Rental History</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
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
                                    {riderRentals.map(r => (
                                        <TableRow key={r.id}>
                                            <TableCell><Link href={`/rentals/${r.id}`} className="text-primary hover:underline">#{r.id.substring(0, 7)}...</Link></TableCell>
                                            <TableCell>{r?.vehicle?.code}</TableCell>
                                            <TableCell>{formatIST(r.startDate, 'dd MMM')} - {formatIST(r.expectedReturnDate, 'dd MMM')}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={r.status === 'completed' ? 'default' : r.status === 'ongoing' ? 'secondary' : 'destructive'}
                                                    className={cn(r.status === 'ongoing' && 'bg-blue-500 text-white')}
                                                >
                                                    {r.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-code">{formatINR(r.payableTotal)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
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
                                    {riderPayments.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell><Link href={`/payments/${p.id}`} className="text-primary hover:underline">#{p.id.substring(0, 7)}...</Link></TableCell>
                                            <TableCell>{formatIST(p.transactionDate, 'dd MMM yyyy')}</TableCell>
                                            <TableCell><Badge variant="secondary">{p.method.toUpperCase()}</Badge></TableCell>
                                            <TableCell className="text-right font-code">{formatINR(p.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="kyc" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>KYC Documents</CardTitle>
                            <Button size="sm"><Upload className="mr-2 h-4 w-4" /> Upload Document</Button>
                        </CardHeader>
                        <CardContent>
                            {rider.kycDocuments && rider.kycDocuments.length > 0 ? (
                                <ul className="space-y-2">
                                    {rider.kycDocuments.map((doc, i) => (
                                        <li key={i} className="flex items-center justify-between rounded-md border p-3">
                                            <div className="flex items-center gap-2">
                                                <File className="h-5 w-5 text-muted-foreground" />
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{doc.name}</a>
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the document {doc.name}.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="py-4 text-center text-muted-foreground">No KYC documents uploaded.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
