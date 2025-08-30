'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const data = [
    { name: 'Mon', available: 12, inUse: 8 },
    { name: 'Tue', available: 15, inUse: 5 },
    { name: 'Wed', available: 10, inUse: 10 },
    { name: 'Thu', available: 9, inUse: 11 },
    { name: 'Fri', available: 5, inUse: 15 },
    { name: 'Sat', available: 3, inUse: 17 },
    { name: 'Sun', available: 4, inUse: 16 },
];

export function VehicleUtilizationChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Vehicle Utilization - Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-80 w-full">
                    <ResponsiveContainer>
                        <BarChart data={data} stackOffset="none">
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                            />
                            <Legend wrapperStyle={{paddingTop: '20px'}}/>
                            <Bar dataKey="inUse" stackId="a" fill="hsl(var(--primary))" name="In Use" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="available" stackId="a" fill="hsl(var(--secondary))" name="Available" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
