'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/admin/page-header';
import { FileDown } from 'lucide-react';

export default function ReportsPage() {

    // In a real app, this would trigger a CSV download via an API call or a client-side library
    const handleExport = (reportType: string) => {
        alert(`Exporting ${reportType} report...`);
    };

    return (
        <>
            <PageHeader title="Reports" description="Generate and export data from your system." />
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Rentals Report</CardTitle>
                        <CardDescription>Export a CSV file of all rentals within a date range.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="rental-start-date">Start Date</Label>
                                <Input id="rental-start-date" type="date" />
                            </div>
                            <div>
                                <Label htmlFor="rental-end-date">End Date</Label>
                                <Input id="rental-end-date" type="date" />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => handleExport('Rentals')}><FileDown className="mr-2 h-4 w-4"/> Export Rentals</Button>
                    </CardFooter>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Payments Report</CardTitle>
                        <CardDescription>Export a CSV file of all payments within a date range.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="payment-start-date">Start Date</Label>
                                <Input id="payment-start-date" type="date" />
                            </div>
                            <div>
                                <Label htmlFor="payment-end-date">End Date</Label>
                                <Input id="payment-end-date" type="date" />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => handleExport('Payments')}><FileDown className="mr-2 h-4 w-4"/> Export Payments</Button>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
}
