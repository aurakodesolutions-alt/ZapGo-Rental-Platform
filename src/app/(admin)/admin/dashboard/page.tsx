
'use client';

import { DollarSign, Bike, Clock, AlertTriangle, Battery, BatteryWarning } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { StatCard } from '@/components/admin/dashboard/stat-card';
import { EarningsChart } from '@/components/admin/charts/earnings-chart';
import { VehicleUtilizationChart } from '@/components/admin/charts/vehicle-utilization-chart';
import { RecentActivity } from '@/components/admin/dashboard/recent-activity';
import { formatINR } from '@/lib/format';
import { useEffect, useState } from 'react';
import * as mockApi from '@/lib/mock-data';
import Link from 'next/link';
import { RecentReturns } from '@/components/admin/dashboard/recent-returns';

interface DashboardStats {
    earningsToday: number;
    vehiclesAvailable: number;
    totalVehicles: number;
    ongoingRentals: number;
    overdueRentals: number;
    batteries: {
        total: number;
        available: number;
        assigned: number;
        charging: number;
        service_due: number;
    };
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);

    return (
        <div className="flex flex-1 flex-col gap-4">
            <PageHeader title="Dashboard" description="Here's a snapshot of your business today." />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Today's Earnings"
                    value={formatINR(stats?.earningsToday ?? 0)}
                    icon={<DollarSign className="h-5 w-5" />}
                />
                <StatCard
                    title="Vehicles Available"
                    value={`${stats?.vehiclesAvailable ?? 0} / ${stats?.totalVehicles ?? 0}`}
                    icon={<Bike className="h-5 w-5" />}
                />
                <StatCard
                    title="Ongoing Rentals"
                    value={String(stats?.ongoingRentals ?? 0)}
                    icon={<Clock className="h-5 w-5" />}
                />
                <StatCard
                    title="Overdue Rentals"
                    value={String(stats?.overdueRentals ?? 0)}
                    icon={<AlertTriangle className="h-5 w-5" />}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/batteries?filters.status=available">
                    <StatCard title="Batteries Available" value={String(stats?.batteries.available ?? 0)} icon={<Battery className="h-5 w-5"/>}/>
                </Link>
                <Link href="/batteries?filters.status=assigned">
                    <StatCard title="Batteries Assigned" value={String(stats?.batteries.assigned ?? 0)} icon={<Battery className="h-5 w-5"/>}/>
                </Link>
                <Link href="/batteries?filters.status=charging">
                    <StatCard title="Batteries Charging" value={String(stats?.batteries.charging ?? 0)} icon={<Battery className="h-5 w-5"/>}/>
                </Link>
                <Link href="/batteries?filters.status=service_due">
                    <StatCard title="Batteries Service Due" value={String(stats?.batteries.service_due ?? 0)} icon={<BatteryWarning className="h-5 w-5"/>}/>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <EarningsChart />
                </div>
                <div className="lg:col-span-3 grid gap-4">
                    <RecentActivity />
                    <RecentReturns />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                <VehicleUtilizationChart />
            </div>
        </div>
    );
}
