
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { PaymentSchema } from '@/lib/schema';
import { useToast } from '@/hooks/use-toast';
import { mockRentals } from '@/lib/mock-data';

type PaymentFormValues = z.infer<typeof PaymentSchema>;

export function PaymentForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const rentalIdFromQuery = searchParams.get('rentalId');
    const { toast } = useToast();

    const selectedRental = rentalIdFromQuery ? mockRentals.find(r => r.id === rentalIdFromQuery) : undefined;

    const defaultValues: Partial<PaymentFormValues> = {
        rentalId: rentalIdFromQuery || '',
        amount: selectedRental?.balanceDue,
        method: 'cash',
        transactionDate: new Date().toISOString().split('T')[0],
    };

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(PaymentSchema),
        defaultValues,
    });

    function onSubmit(data: PaymentFormValues) {
        console.log(data);
        toast({
            title: 'Payment Recorded',
            description: `Payment of ${data.amount} for rental #${data.rentalId.substring(0,7)}... has been successfully recorded.`,
        });
        router.push('/payments');
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="rentalId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rental</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a rental to associate payment with" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {mockRentals.filter(r => r.balanceDue > 0).map((rental) => (
                                        <SelectItem key={rental.id} value={rental.id}>
                                            Rental #{rental.id.substring(0,7)}... - {rental?.rider?.fullName} (Balance: {formatINR(rental.balanceDue)})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount (₹)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Enter amount" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select payment method" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="upi">UPI</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="bank">Bank Transfer</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="transactionDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Transaction Date</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="txnRef"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Transaction Reference (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., UPI transaction ID" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit">Save Payment</Button>
                </div>
            </form>
        </Form>
    );
}

function formatINR(amount: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}
