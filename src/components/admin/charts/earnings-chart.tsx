'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatINR } from '@/lib/format';

const data = [
    { month: 'Jan', earnings: 18600 },
    { month: 'Feb', earnings: 30500 },
    { month: 'Mar', earnings: 23700 },
    { month: 'Apr', earnings: 27800 },
    { month: 'May', earnings: 18900 },
    { month: 'Jun', earnings: 23900 },
    { month: 'Jul', earnings: 34900 },
    { month: 'Aug', earnings: 29800 },
    { month: 'Sep', earnings: 24500 },
    { month: 'Oct', earnings: 31200 },
    { month: 'Nov', earnings: 28700 },
    { month: 'Dec', earnings: 38900 },
];

export function EarningsChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Earnings - Last 12 Months</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-80 w-full">
                    <ResponsiveContainer>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => formatINR(Number(value) / 1000) + 'k'}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                                formatter={(value) => formatINR(Number(value))}
                            />
                            <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
