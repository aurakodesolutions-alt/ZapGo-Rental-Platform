// src/components/landing/trust-and-benefits.tsx
"use client";

import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Leaf,
    ShieldCheck,
    IndianRupee,
    Zap,
    BatteryCharging,
    Trophy,
    Star,
} from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

const benefits = [
    { icon: Leaf, title: "Eco-Friendly", description: "Reduce your carbon footprint with every ride." },
    { icon: IndianRupee, title: "Low Running Cost", description: "Save money on fuel and maintenance." },
    { icon: Zap, title: "24/7 Support", description: "Our team is always here to help you out." },
    { icon: BatteryCharging, title: "BIS-Certified Chargers", description: "Safe and reliable charging for peace of mind." },
    { icon: Trophy, title: "Helmets Provided", description: "High-quality helmets with every scooter." },
    { icon: ShieldCheck, title: "Secure & Insured", description: "Comprehensive insurance & protected payments." },
];

const testimonials = [
    {
        name: "Priya Sharma",
        role: "Daily Commuter",
        avatar: "https://i.pravatar.cc/150?u=priya",
        text:
            "ZapGo changed my daily commute! Affordable, convenient, and greener. Instant verification was a huge plus.",
        rating: 5,
    },
    {
        name: "Rohan Kumar",
        role: "University Student",
        avatar: "https://i.pravatar.cc/150?u=rohan",
        text:
            "Lite plan is perfect for campus. No license needed and super student-friendly pricing. Highly recommend!",
        rating: 5,
    },
    {
        name: "Anjali Mehta",
        role: "Freelance Designer",
        avatar: "https://i.pravatar.cc/150?u=anjali",
        text:
            "I zip across the city for client meetings. Pro plan’s range is great and the scooter feels zippy.",
        rating: 4,
    },
];

export function TrustAndBenefits() {
    return (
        <section id="benefits" className="py-16 lg:py-24 bg-muted/30 dark:bg-muted/20">
            <div className="container mx-auto px-4">
                {/* Section header with brand gradient */}
                <div className="gradient-background noise-bg relative overflow-hidden rounded-3xl">
                    <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
                    <div className="relative p-8 sm:p-12">
                        <Badge className="rounded-xl bg-white/15 text-white">Why ZapGo</Badge>
                        <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-primary-foreground drop-shadow">
                            More Than Just a Ride
                        </h2>
                        <p className="mt-2 max-w-2xl text-primary-foreground/90">
                            Experience a smarter, cleaner, and more affordable way to travel.
                        </p>
                    </div>
                </div>

                {/* Benefits grid */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {benefits.map((benefit) => (
                        <BenefitCard key={benefit.title} {...benefit} />
                    ))}
                </div>

                {/* Subtle divider */}
                <div className="my-12">
                    <Separator className="opacity-50" />
                </div>

                {/* Testimonials with carousel */}
                <div className="text-center mb-6">
                    <Badge className="rounded-xl bg-secondary text-secondary-foreground">Testimonials</Badge>
                    <h3 className="mt-3 text-2xl md:text-3xl font-extrabold text-secondary">
                        Loved by Riders Like You
                    </h3>
                    <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                        Don’t just take our word for it—here’s what our customers say.
                    </p>
                </div>

                <div className="relative">
                    <Carousel
                        opts={{ align: "start" }}
                        className="w-full"
                    >
                        <CarouselContent>
                            {testimonials.map((t) => (
                                <CarouselItem key={t.name} className="basis-full md:basis-1/2 lg:basis-1/3">
                                    <TestimonialCard {...t} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden md:flex" />
                        <CarouselNext className="hidden md:flex" />
                    </Carousel>
                </div>
            </div>
        </section>
    );
}

function BenefitCard({
                         icon: Icon,
                         title,
                         description,
                     }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
}) {
    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-2xl border bg-card p-5",
                "transition-all hover:shadow-xl"
            )}
        >
            {/* soft glow */}
            <div className="pointer-events-none absolute -inset-0.5 rounded-2xl opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                 style={{ background: "radial-gradient(600px circle at var(--x,50%) var(--y,50%), hsl(var(--primary)/0.10), transparent 40%)" }} />
            <div className="flex items-start gap-4 relative">
                <div className="grid place-items-center h-12 w-12 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="text-muted-foreground mt-1">{description}</p>
                </div>
            </div>
        </div>
    );
}

function TestimonialCard({
                             name,
                             role,
                             avatar,
                             text,
                             rating,
                         }: {
    name: string;
    role: string;
    avatar: string;
    text: string;
    rating: number;
}) {
    return (
        <Card className="flex h-full flex-col rounded-2xl border shadow-sm hover:shadow-xl transition-shadow">
            <CardContent className="pt-6 flex-1">
                <div className="flex items-center mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={`${name}-star-${i}`}
                            className={cn(
                                "h-5 w-5",
                                i < rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
                            )}
                        />
                    ))}
                </div>
                <blockquote className="italic text-foreground/90 leading-relaxed">
                    “{text}”
                </blockquote>
            </CardContent>
            <CardFooter className="border-t bg-muted/30 dark:bg-muted/20">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={avatar} alt={name} />
                        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{name}</p>
                        <p className="text-sm text-muted-foreground">{role}</p>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
