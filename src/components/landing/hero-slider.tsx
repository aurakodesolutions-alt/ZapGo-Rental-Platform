"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";

// import { Card, CardContent } from "@/components/ui/card";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { IndianRupee, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
    {
        image: "/images/hero_2.png",
        imageHint: "electric scooter city",
        headline: "Ride Electric. Save More.",
        subtext: "Book an e-scooter in minutes. Pay a small joining fee and a refundable deposit.",
        badges: [
            { icon: ShieldCheck, text: "Secure Payment by Razorpay" },
            { icon: Zap, text: "Instant KYC Verification" },
            { icon: IndianRupee, text: "Refundable Deposit" },
        ],
    },
    {
        image: "/images/hero_11.png",
        imageHint: "scooter charging",
        headline: "Instant Verification & Refunds.",
        subtext: "Our AI-powered KYC gets you riding in minutes. Deposits are refunded promptly.",
        badges: [
            { icon: Zap, text: "AI-Powered KYC" },
            { icon: IndianRupee, text: "Prompt Refunds" },
            { icon: ShieldCheck, text: "Trusted & Secure" },
        ],
    },
    {
        image: "/images/hero_12.png",
        imageHint: "modern city street",
        headline: "Eco-Friendly Rides For Your City.",
        subtext: "Join the green revolution. Reduce your carbon footprint with every ride you take.",
        badges: [
            { icon: Zap, text: "Zero Emissions" },
            { icon: IndianRupee, text: "Affordable" },
            { icon: ShieldCheck, text: "Fully Insured" },
        ],
    },
];

export function HeroSlider() {
    const [api, setApi] = React.useState<CarouselApi>();
    const [current, setCurrent] = React.useState(0);

    const plugin = React.useRef(
        Autoplay({ delay: 6000, stopOnInteraction: true })
    );

    React.useEffect(() => {
        if (!api) {
            return;
        }

        setCurrent(api.selectedScrollSnap());

        const onSelect = (api: CarouselApi) => {
            api && setCurrent(api.selectedScrollSnap());
        };

        api.on("select", onSelect);

        return () => {
            api.off("select", onSelect);
        };
    }, [api]);

    const scrollTo = (index: number) => {
        api?.scrollTo(index);
    };

    return (
        <section id="hero" className="relative w-full">
            <Carousel
                setApi={setApi}
                plugins={[plugin.current]}
                className="w-full"
                onMouseEnter={plugin.current.stop}
                onMouseLeave={plugin.current.reset}
            >
                <CarouselContent>
                    {slides.map((slide, index) => (
                        <CarouselItem key={index}>
                            <div className="relative w-full h-[80vh] md:h-[90vh] max-h-[1080px] text-white">
                                <Image
                                    src={slide.image}
                                    alt={slide.headline}
                                    fill
                                    priority={index === 0}
                                    className="object-cover"
                                    data-ai-hint={slide.imageHint}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-secondary/50 to-transparent"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-secondary/30 to-transparent"></div>
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #14386380, #80C42F80)' }}></div>

                                <div className="relative h-full w-full flex flex-col justify-end pb-20 md:pb-24">
                                    <div className="container mx-auto px-4 text-center md:text-left">
                                        <div className="max-w-3xl">
                                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter !leading-tight drop-shadow-lg">
                                                {slide.headline}
                                            </h1>
                                            <p className="mt-4 max-w-2xl text-lg md:text-xl text-primary-foreground/80 drop-shadow-md">
                                                {slide.subtext}
                                            </p>
                                            <div className="mt-8 flex flex-col sm:flex-row justify-center md:justify-start items-center gap-4">
                                                <Button size="lg" asChild className="w-full sm:w-auto shadow-lg hover:scale-105 transition-transform duration-300">
                                                    <Link href="/book">Book Now</Link>
                                                </Button>
                                                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-secondary shadow-lg hover:scale-105 transition-transform duration-300 bg-transparent">
                                                    <Link href="#pricing">View Pricing</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
            </Carousel>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => scrollTo(index)}
                        aria-label={`Go to slide ${index + 1}`}
                        className={cn(
                            "h-2 w-2 rounded-full transition-all duration-300",
                            current === index ? "w-6 bg-primary" : "bg-white/50 hover:bg-white"
                        )}
                    />
                ))}
            </div>
        </section>
    );
}
