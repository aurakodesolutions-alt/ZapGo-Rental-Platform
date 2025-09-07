"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";

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
        subtext:
            "Book an e-scooter in minutes. Pay a small joining fee and a refundable deposit.",
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
        subtext:
            "Our AI-powered KYC gets you riding in minutes. Deposits are refunded promptly.",
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
        subtext:
            "Join the green revolution. Reduce your carbon footprint with every ride you take.",
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

    // Respect reduced motion and still allow manual swipes/arrows
    const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const plugin = React.useRef(
        Autoplay({ delay: 6000, stopOnInteraction: true, stopOnMouseEnter: true })
    );

    React.useEffect(() => {
        if (!api) return;

        // safe: api exists here
        setCurrent(api.selectedScrollSnap());

        const onSelect = (embla: CarouselApi) => {
            // embla is always passed by Embla; no need for optional chaining
            setCurrent(embla?.selectedScrollSnap() ?? 0);
        };

        api.on("select", onSelect);
        return () => {
            api.off("select", onSelect);
        };
    }, [api]);


    const scrollTo = (index: number) => api?.scrollTo(index);

    return (
        <section
            id="hero"
            className="relative w-full"
            aria-roledescription="carousel"
            aria-label="Featured highlights"
        >
            <Carousel
                setApi={setApi}
                plugins={prefersReduced ? [] : [plugin.current]}
                className="w-full"
            >
                <CarouselContent>
                    {slides.map((slide, index) => (
                        <CarouselItem key={slide.headline}>
                            <div className="relative w-full h-[76vh] md:h-[88vh] max-h-[1080px] text-white overflow-hidden rounded-none sm:rounded-3xl">
                                {/* Background image (LCP-first, others lazy) */}
                                <Image
                                    src={slide.image}
                                    alt={slide.headline}
                                    fill
                                    priority={index === 0}
                                    sizes="100vw"
                                    className="object-cover"
                                    decoding="async"
                                    data-ai-hint={slide.imageHint}
                                />

                                {/* Contrast layers for readability */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-secondary/50 to-transparent" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-secondary/30 to-transparent" />
                                    <div
                                        className="absolute inset-0"
                                        style={{ background: "linear-gradient(135deg, #14386380, #80C42F80)" }}
                                    />
                                </div>

                                {/* Content */}
                                <div className="relative h-full w-full flex flex-col justify-end pb-20 md:pb-24">
                                    <div className="container mx-auto px-4">
                                        {/* Glass panel for mobile readability */}
                                        <div className="max-w-3xl rounded-2xl bg-black/10 backdrop-blur-[2px] p-4 sm:p-0 sm:bg-transparent sm:backdrop-blur-0">
                                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.07] drop-shadow">
                                                {slide.headline}
                                            </h1>

                                            <p className="mt-4 max-w-2xl text-base md:text-xl text-primary-foreground/90 drop-shadow-sm">
                                                {slide.subtext}
                                            </p>

                                            {/* Trust row */}
                                            <div className="mt-5 flex flex-wrap items-center gap-2">
                                                {slide.badges.map(({ icon: Icon, text }) => (
                                                    <Badge
                                                        key={text}
                                                        variant="secondary"
                                                        className="rounded-xl bg-white/15 text-white backdrop-blur px-3 py-1 flex items-center gap-1"
                                                    >
                                                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                                                        <span className="text-xs md:text-sm">{text}</span>
                                                    </Badge>
                                                ))}
                                            </div>

                                            {/* CTAs */}
                                            <div className="mt-7 flex flex-col sm:flex-row items-center gap-4">
                                                <Button
                                                    size="lg"
                                                    asChild
                                                    className="w-full sm:w-auto rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-transform"
                                                >
                                                    <Link href="/book">Book Now</Link>
                                                </Button>

                                                <Button
                                                    size="lg"
                                                    variant="outline"
                                                    asChild
                                                    className={cn(
                                                        "w-full sm:w-auto rounded-xl",
                                                        "text-white border-white/70 hover:bg-white hover:text-secondary",
                                                        "shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-transform bg-transparent"
                                                    )}
                                                >
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

                {/* Arrows (hidden on small, keyboard/focusable on large) */}
                <CarouselPrevious
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex"
                    aria-label="Previous slide"
                />
                <CarouselNext
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex"
                    aria-label="Next slide"
                />
            </Carousel>

            {/* Pagination bullets */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                {slides.map((_, index) => {
                    const isActive = current === index;
                    return (
                        <button
                            key={`dot-${index}`}
                            onClick={() => scrollTo(index)}
                            onFocus={() => plugin.current.stop()}
                            onBlur={() => !prefersReduced && plugin.current.reset()}
                            aria-label={`Go to slide ${index + 1}`}
                            aria-current={isActive ? "true" : "false"}
                            className={cn(
                                "h-2 w-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                                isActive ? "w-6 bg-primary" : "bg-white/55 hover:bg-white"
                            )}
                        />
                    );
                })}
            </div>
        </section>
    );
}
