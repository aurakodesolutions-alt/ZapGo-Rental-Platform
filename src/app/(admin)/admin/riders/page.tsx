import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/admin/page-header';
import { mockRiders } from '@/lib/mock-data';
import { formatIST } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function RidersPage() {
    return (
        <>
            <PageHeader title="Riders" description="Manage all rider profiles.">
                <Button asChild>
                    <Link href="/admin/riders/new"><PlusCircle className="mr-2 h-4 w-4" /> Add New Rider</Link>
                </Button>
            </PageHeader>
            <Card>
                <CardContent>
                    <div className="py-4">
                        <Input placeholder="Search by name or phone..."/>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Full Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Rentals</TableHead>
                                <TableHead>Doc Expiry</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockRiders.map((rider) => (
                                <TableRow key={rider.id}>
                                    <TableCell className="font-medium">{rider.fullName}</TableCell>
                                    <TableCell>{rider.phone}</TableCell>
                                    <TableCell>{rider.rentalsCount}</TableCell>
                                    <TableCell>{formatIST(rider.documentExpiryDate, 'dd MMM yyyy')}</TableCell>
                                    <TableCell>
                                        <Badge variant={rider.status === 'active' ? 'secondary' : 'destructive'}>
                                            {rider.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/admin/riders/${rider.id}`}>View Details</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
