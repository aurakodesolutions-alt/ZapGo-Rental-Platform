"use client";

import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR, formatIST } from "@/lib/format";
import { useReturns } from "@/hooks/api/use-returns";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReturnsPage() {
    const [search, setSearch] = React.useState("");
    const dueToday = useReturns("due-today", search);
    const overdue  = useReturns("overdue", search);
    const recent   = useReturns("recent", search);

    const loading = dueToday.isLoading || overdue.isLoading || recent.isLoading;

    const renderTable = (rows: any) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Rental</TableHead>
                    <TableHead>Rider</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                        </TableRow>
                    ))
                ) : rows.length ? (
                    rows.map((r:any) => (
                        <TableRow key={r.rentalId}>
                            <TableCell className="font-medium">
                                <Link href={`/admin/rentals/${r.rentalId}`} className="text-primary hover:underline">
                                    #{r.rentalId}
                                </Link>
                            </TableCell>
                            <TableCell>{r.rider.fullName}</TableCell>
                            <TableCell>{r.vehicle.uniqueCode} · {r.vehicle.model}</TableCell>
                            <TableCell>{formatIST(r.expectedReturnDate, "dd MMM yy")}</TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        r.status === "completed" ? "default" :
                                            r.status === "ongoing"   ? "secondary" : "destructive"
                                    }
                                    className={cn(r.status === "ongoing" && "bg-blue-500 text-white")}
                                >
                                    {r.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right font-code">{formatINR(r.balanceDue)}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/admin/returns/${r.rentalId}`}>
                                        {r.status === "completed" ? "View" : "Process"}
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow><TableCell colSpan={7} className="text-center">No rentals found.</TableCell></TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <>
            <PageHeader title="Return Center" description="Process vehicle returns and manage settlements.">
                <Button variant="outline"><FileDown className="mr-2 h-4 w-4" /> Export CSV</Button>
            </PageHeader>

            <Card>
                <CardContent>
                    <Tabs defaultValue="overdue">
                        <div className="flex items-center justify-between py-4">
                            <TabsList>
                                <TabsTrigger value="due-today">Due Today ({dueToday.rows.length})</TabsTrigger>
                                <TabsTrigger value="overdue">Overdue ({overdue.rows.length})</TabsTrigger>
                                <TabsTrigger value="recent">Recently Returned ({recent.rows.length})</TabsTrigger>
                            </TabsList>
                            <div className="w-72">
                                <Input
                                    placeholder="Search rider / vehicle / rental id…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <TabsContent value="due-today">{renderTable(dueToday.rows)}</TabsContent>
                        <TabsContent value="overdue">{renderTable(overdue.rows)}</TabsContent>
                        <TabsContent value="recent">{renderTable(recent.rows)}</TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </>
    );
}
