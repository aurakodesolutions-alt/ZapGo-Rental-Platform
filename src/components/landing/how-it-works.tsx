"use client";

import { FileText, CheckCircle, IndianRupee, Bell, KeyRound, Bike } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Step {
    icon: LucideIcon;
    title: string;
    description: string;
}

const steps: Step[] = [
    { icon: Bike,       title: "Choose Your Plan",         description: "Select from our Lite or Pro plans based on your daily commute and needs." },
    { icon: FileText,   title: "Upload Documents",         description: "Submit your Aadhaar, PAN, and DL (for Pro) for instant verification." },
    { icon: CheckCircle,title: "Accept Terms & Pay",       description: "Agree to our terms and pay the one-time joining fee and refundable deposit." },
    { icon: Bell,       title: "Instant Verification",     description: "Our system verifies your documents in minutes. You'll get a notification once done." },
    { icon: KeyRound,   title: "Pick Up Your Scooter",     description: "Collect your ride from a nearby ZapGo hub or opt for doorstep delivery." },
    { icon: IndianRupee,title: "Ride & Get Deposit Back",  description: "Enjoy your ride! Your deposit is refunded once you return the scooter safely." },
];

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-16 lg:py-24 bg-background">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-10">
                    <Badge className="rounded-xl bg-secondary text-secondary-foreground">How it works</Badge>
                    <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-secondary">
                        Get Your ZapGo in 6 Easy Steps
                    </h2>
                    <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
                        From signing up to riding out, our process is simple, fast, and secure.
                    </p>
                </div>

                {/* Mobile: horizontal snap-scroller */}
                <div
                    className={cn(
                        "relative -mx-4 px-4 lg:hidden",
                        "overflow-x-auto snap-x snap-mandatory scroll-smooth"
                    )}
                    style={{ scrollbarWidth: "none" }} // Hide scrollbar on Firefox
                >
                    {/* progress rail */}
                    <div className="pointer-events-none absolute left-4 right-4 -bottom-2 h-1 rounded-full bg-border" />

                    <ol className="flex gap-4 pb-6">
                        {steps.map((step, i) => (
                            <li
                                key={step.title}
                                className={cn(
                                    "snap-start shrink-0 w-[88%] sm:w-[70%]",
                                    "rounded-2xl border bg-card/80 backdrop-blur",
                                    "p-5 ring-1 ring-border hover:ring-primary/40 transition-shadow"
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="relative">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                                            <step.icon className="h-6 w-6" />
                                        </div>
                                        <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-bold ring-4 ring-card">
                      {i + 1}
                    </span>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* Desktop / Large screens: 3×2 timeline grid with connectors */}
                <div className="hidden lg:block relative">
                    {/* horizontal connector line */}
                    <div className="absolute left-0 right-0 top-8 h-0.5 bg-border -z-10" />
                    <div className="grid grid-cols-3 gap-x-8 gap-y-12">
                        {steps.map((step, i) => (
                            <div key={step.title} className="relative">
                                {/* connector dot */}
                                <div className="absolute left-0 right-0 mx-auto -top-1 h-2 w-2 rounded-full bg-primary/70" />
                                <div className="flex items-start gap-4 p-5 rounded-2xl border bg-card hover:shadow-md transition">
                                    <div className="relative">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                                            <step.icon className="h-7 w-7" />
                                        </div>
                                        <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-bold ring-4 ring-card">
                      {i + 1}
                    </span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">{step.title}</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Optional: tiny helper to hide scrollbars on WebKit (if you want it globally, put this in your globals.css) */}
            <style jsx>{`
        @media (max-width: 1023px) {
          section#how-it-works ::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
        </section>
    );
}
