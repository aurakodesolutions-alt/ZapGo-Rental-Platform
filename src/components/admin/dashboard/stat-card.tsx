import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string;
    icon: ReactNode;
    comparison?: string;
    comparisonColor?: 'green' | 'red';
}

export function StatCard({ title, value, icon, comparison, comparisonColor }: StatCardProps) {
    return (
        <Card className="rounded-2xl shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className="text-muted-foreground">{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold font-headline">{value}</div>
                {comparison && (
                    <p className={cn(
                        "text-xs text-muted-foreground",
                        comparisonColor === 'green' && 'text-emerald-600',
                        comparisonColor === 'red' && 'text-red-600'
                    )}>
                        {comparison}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
