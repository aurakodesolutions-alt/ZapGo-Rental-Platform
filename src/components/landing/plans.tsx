"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";

const plans = [
    {
        name: 'Lite' as const,
        title: 'ZapGo Lite',
        description: 'Perfect for city hops, daily errands, and low-mileage rides.',
        features: [
            'Up to 45km range',
            '25 km/h top speed',
            'Non-registered vehicle',
            'One BIS-certified helmet'
        ],
        docs: ['Aadhaar Card', 'PAN Card']
    },
    {
        name: 'Pro' as const,
        title: 'ZapGo Pro',
        description: 'Ideal for long commutes with registered vehicles and higher performance.',
        features: [
            'Up to 85km range',
            '55 km/h top speed',
            'RTO registered vehicle',
            'Two BIS-certified helmets'
        ],
        docs: ['Aadhaar Card', 'PAN Card', 'Driving License']
    }
];

export function Plans() {
    return (
        <section id="plans" className="py-16 lg:py-24 bg-muted/30 dark:bg-muted/20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-secondary dark:text-white">
                        Choose Your Ride
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        We have two simple plans designed for every kind of rider. Pick one and start your journey.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {plans.map((plan) => (
                        <Card key={plan.name} className="flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                        <Zap className="w-8 h-8"/>
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
                                        <CardDescription>{plan.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="font-semibold mb-3">Features:</p>
                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <Check className="h-5 w-5 text-green-500" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <p className="font-semibold mb-3">Documents Required:</p>
                                <ul className="space-y-3">
                                    {plan.docs.map((doc, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <Check className="h-5 w-5 text-green-500" />
                                            <span>{doc}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter className="p-6 bg-muted/30 dark:bg-muted/20 rounded-b-lg">
                                <Button size="lg" asChild className="w-full">
                                    <Link href={`/book?plan=${plan.name.toLowerCase()}`}>Book {plan.name} Plan</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
