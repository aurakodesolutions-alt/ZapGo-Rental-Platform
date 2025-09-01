'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/admin/page-header';
import { mockAlerts } from '@/lib/mock-data';
import { formatIST } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { Alert } from '@/lib/types';

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);

    const toggleStatus = (id: string) => {
        setAlerts(
            alerts.map((alert) =>
                alert.id === id ? { ...alert, status: alert.status === 'read' ? 'unread' : 'read' } : alert
            )
        );
    };

    const renderAlertsTable = (type: Alert['type']) => {
        const filteredAlerts = alerts.filter((alert) => alert.type === type);
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Message</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredAlerts.length > 0 ? (
                        filteredAlerts.map((alert) => (
                            <TableRow key={alert.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/${alert.type.toLowerCase().includes('rental') ? 'rentals' : 'riders'}/${alert.relatedId}`} className="hover:underline">
                                        {alert.message}
                                    </Link>
                                </TableCell>
                                <TableCell>{formatIST(alert.dueDate, 'dd MMM yyyy')}</TableCell>
                                <TableCell>
                                    <Badge variant={alert.status === 'read' ? 'secondary' : 'destructive'}>
                                        {alert.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => toggleStatus(alert.id)}>
                                        Mark as {alert.status === 'read' ? 'Unread' : 'Read'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center">No alerts of this type.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        );
    };

    return (
        <>
            <PageHeader title="Alerts" description="Manage and view important notifications." />
            <Card>
                <CardContent className="p-0">
                    <Tabs defaultValue="paymentDue" className="w-full">
                        <div className="p-4 border-b">
                            <TabsList>
                                <TabsTrigger value="paymentDue">Payment Due</TabsTrigger>
                                <TabsTrigger value="overdueRental">Overdue Rentals</TabsTrigger>
                                <TabsTrigger value="documentExpiry">Document Expiry</TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="paymentDue" className="p-4">{renderAlertsTable('Payment Due')}</TabsContent>
                        <TabsContent value="overdueRental" className="p-4">{renderAlertsTable('Overdue Rental')}</TabsContent>
                        <TabsContent value="documentExpiry" className="p-4">{renderAlertsTable('Document Expiry')}</TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </>
    );
}
