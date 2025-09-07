// src/app/rider/dashboard/page.tsx
"use client";

import Link from "next/link";
import { useRider } from "@/hooks/public/useRider";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';


import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardHeader from "@/components/rider/dashboard-header";

// Tabs content (you already have these files)
import OverviewTab from "@/components/rider/overview/overview-tab";
import RentalsTab from "@/components/rider/rentals/rentals-tab";
import PaymentsTab from "@/components/rider/payments/payments-tab";
import KycTab from "@/components/rider/kyc/kyc-tab";
import SettingsTab from "@/components/rider/settings/settings-tab";

import { LogIn } from "lucide-react";

function DashboardSkeleton() {
    return (
        <div className="container mx-auto max-w-7xl px-4 py-8">
            <Skeleton className="h-8 w-1/3 mb-6" />
            <div className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
}

function SignInPrompt() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center bg-background">
            <Card className="w-full max-w-md text-center p-8 rounded-2xl shadow-lg">
                <CardContent>
                    <LogIn className="mx-auto h-12 w-12 text-primary mb-4" />
                    <h2 className="text-2xl font-bold">Please Sign In</h2>
                    <p className="text-muted-foreground mt-2 mb-6">
                        You need to be logged in to access your dashboard.
                    </p>
                    <Button asChild className="rounded-xl">
                        <Link href="/rider/login">Sign In</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function RiderDashboardPage() {
    const { rider, isLoading, error } = useRider();
    console.log(rider);

    // Loading
    if (isLoading) return <DashboardSkeleton />;

    // Not logged in
    if ((error as any)?.status === 401 || !rider) return <SignInPrompt />;

    const firstName =
        (rider.FullName || "Rider").split(" ").filter(Boolean)[0];

    return (
        <div className="bg-secondary/5 min-h-screen">
            <div className="container mx-auto max-w-7xl px-4 py-8">
                <DashboardHeader firstName={firstName} />

                {/* Main tabs */}
                <Tabs defaultValue="overview" className="mt-6">
                    {/* Mobile: horizontally scrollable tablist */}
                    <div className="md:hidden -mx-4">
                        <ScrollArea className="w-screen px-4">
                            <TabsList className="flex w-max gap-2 rounded-xl bg-muted/50 p-1">
                                <TabsTrigger className="flex-none whitespace-nowrap rounded-lg px-4 py-2" value="overview">
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger className="flex-none whitespace-nowrap rounded-lg px-4 py-2" value="rentals">
                                    Rentals
                                </TabsTrigger>
                                <TabsTrigger className="flex-none whitespace-nowrap rounded-lg px-4 py-2" value="payments">
                                    Payments
                                </TabsTrigger>
                                <TabsTrigger className="flex-none whitespace-nowrap rounded-lg px-4 py-2" value="kyc">
                                    KYC Documents
                                </TabsTrigger>
                                <TabsTrigger className="flex-none whitespace-nowrap rounded-lg px-4 py-2" value="settings">
                                    Settings
                                </TabsTrigger>
                            </TabsList>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>

                    {/* Desktop: fixed grid tablist */}
                    <div className="hidden md:block">
                        <TabsList className="grid w-full grid-cols-5 rounded-xl bg-muted/50 p-1">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="rentals">Rentals</TabsTrigger>
                            <TabsTrigger value="payments">Payments</TabsTrigger>
                            <TabsTrigger value="kyc">KYC &amp; Documents</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Content */}
                    <TabsContent value="overview" className="mt-4">
                        <OverviewTab />
                    </TabsContent>
                    <TabsContent value="rentals" className="mt-4">
                        <RentalsTab />
                    </TabsContent>
                    <TabsContent value="payments" className="mt-4">
                        <PaymentsTab />
                    </TabsContent>
                    <TabsContent value="kyc" className="mt-4">
                        <KycTab />
                    </TabsContent>
                    <TabsContent value="settings" className="mt-4">
                        <SettingsTab rider={rider} />
                    </TabsContent>
                </Tabs>

            </div>
        </div>
    );
}
