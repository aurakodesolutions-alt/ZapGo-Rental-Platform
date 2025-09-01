
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/admin/page-header';
import { mockRentals } from '@/lib/mock-data';
import { formatINR, formatIST } from '@/lib/format';
import { notFound, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Printer, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import QRCode from 'qrcode.react';
// import * as mockApi from '@/lib/mock-data';

export default function RentalDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const rental = mockRentals.find((r) => r.id === id); // This will be updated to use the API
    const router = useRouter();
    const { toast } = useToast();

    if (!rental) {
        notFound();
    }

    const handleReturn = async () => {
        try {
            // await mockApi.returnRental(rental.id);
            toast({
                title: 'Vehicle Returned',
                description: `${rental?.vehicle?.code} has been marked as returned and is now available.`,
            });
            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleCollectPayment = () => {
        router.push(`/payments/new?rentalId=${rental.id}&amount=${rental.balanceDue}`);
    };

    return (
        <div className="space-y-6">
            <PageHeader title={`Rental #${rental.id.substring(0, 7)}...`} description={`Manage rental for ${rental?.rider?.fullName}.`}>
                <Button variant="outline" asChild>
                    <Link href="/rentals"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Rentals</Link>
                </Button>
            </PageHeader>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rental Summary</CardTitle>
                            <CardDescription>
                                Status: <Badge variant={rental.status === 'completed' ? 'default' : rental.status === 'ongoing' ? 'secondary' : 'destructive'} className={cn(rental.status === 'ongoing' && 'bg-blue-500 text-white')}>{rental.status}</Badge>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <h4 className="font-semibold">Rider</h4>
                                <Link href={`/riders/${rental?.rider?.id}`} className="text-primary hover:underline">{rental?.rider?.fullName}</Link>
                                <p className="text-sm text-muted-foreground">{rental?.rider?.phone}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold">Vehicle</h4>
                                <Link href={`/vehicles/${rental?.vehicle?.id}`} className="text-primary hover:underline">{rental?.vehicle?.brand} {rental?.vehicle?.name}</Link>
                                <p className="text-sm text-muted-foreground">{rental?.vehicle?.registrationNumber}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold">Plan</h4>
                                <p>{rental.plan.charAt(0).toUpperCase() + rental.plan.slice(1)}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold">Rental Period</h4>
                                <p>{formatIST(rental.startDate)} - {formatIST(rental.expectedReturnDate)}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /><span>Rental created on {formatIST(rental.createdAt)}</span></li>
                                {/*{mockApi.listPayments({filters: {rentalId: rental.id}}).then(res => res.rows.map(p => (*/}
                                {/*    <li key={p.id} className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-blue-500" /><span>Payment of {formatINR(p.amount)} received on {formatIST(p.transactionDate)}</span></li>*/}
                                {/*)))}*/}
                                {rental.actualReturnDate && <li className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-gray-500" /><span>Vehicle returned on {formatIST(rental.actualReturnDate)}</span></li>}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-primary text-primary-foreground">
                        <CardHeader>
                            <CardTitle>Balance Due</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold font-code">{formatINR(rental.balanceDue)}</p>
                            <p className="text-sm">Total: {formatINR(rental.payableTotal)} | Paid: {formatINR(rental.paidTotal)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <Button onClick={handleCollectPayment} disabled={rental.balanceDue <= 0}><CreditCard className="mr-2 h-4 w-4" /> Collect Payment</Button>
                            <Button variant="outline" onClick={handleReturn} disabled={rental.status === 'completed'}><RotateCcw className="mr-2 h-4 w-4" /> Return Vehicle</Button>
                            <Dialog>
                                <DialogTrigger asChild><Button variant="secondary"><Printer className="mr-2 h-4 w-4" /> Print Receipt</Button></DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Rental Receipt #{rental.id.substring(0,7)}...</DialogTitle>
                                        <DialogDescription>{rental?.rider?.fullName}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4 text-sm">
                                        <p><strong>Company:</strong> ZapGo Rentals Pvt. Ltd.</p>
                                        <p><strong>Rider:</strong> {rental?.rider?.fullName}</p>
                                        <p><strong>Vehicle:</strong> {rental?.vehicle?.brand} {rental?.vehicle?.name}</p>
                                        <p><strong>Total Amount:</strong> {formatINR(rental.payableTotal)}</p>
                                        <p><strong>Amount Paid:</strong> {formatINR(rental.paidTotal)}</p>
                                        <p className="font-bold"><strong>Balance Due:</strong> {formatINR(rental.balanceDue)}</p>
                                        <div className="flex justify-center pt-4">
                                            <QRCode value={`rental:${rental.id}`} size={128} />
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
