// app/admin/alerts/page.tsx
import { Suspense } from "react";
import AlertsClient from "@/components/admin/alerts-client";

export const dynamic = "force-dynamic";

export default function AlertsPage() {
    return (
        <div className="p-4 lg:p-6">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-headline font-semibold">Alerts</h1>
                    <p className="text-sm text-muted-foreground">Overdue, due soon, and starting soon.</p>
                </div>
            </div>
            <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-muted" />}>
                <AlertsClient />
            </Suspense>
        </div>
    );
}
