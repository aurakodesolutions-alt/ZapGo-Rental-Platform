import { FileText, CheckCircle, IndianRupee, Bell, KeyRound, Bike } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Step {
    icon: LucideIcon
    title: string
    description: string
}

const steps: Step[] = [
    {
        icon: Bike,
        title: "Choose Your Plan",
        description: "Select from our Lite or Pro plans based on your daily commute and needs.",
    },
    {
        icon: FileText,
        title: "Upload Documents",
        description: "Submit your Aadhaar, PAN, and DL (for Pro) for instant verification.",
    },
    {
        icon: CheckCircle,
        title: "Accept Terms & Pay",
        description: "Agree to our terms and pay the one-time joining fee and refundable deposit.",
    },
    {
        icon: Bell,
        title: "Instant Verification",
        description: "Our system verifies your documents in minutes. You'll get a notification once done.",
    },
    {
        icon: KeyRound,
        title: "Pick Up Your Scooter",
        description: "Collect your ride from a nearby ZapGo hub or opt for doorstep delivery.",
    },
    {
        icon: IndianRupee,
        title: "Ride & Get Deposit Back",
        description: "Enjoy your ride! Your deposit is refunded once you return the scooter safely.",
    },
]

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-16 lg:py-24 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-secondary dark:text-white">
                        Get Your ZapGo in 6 Easy Steps
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        From signing up to riding out, our process is designed to be simple, fast, and secure.
                    </p>
                </div>
                <div className="relative">
                    {/* Dotted line for desktop */}
                    <div className="hidden lg:block absolute top-8 left-0 w-full h-0.5 bg-border -z-10"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                        {steps.map((step, index) => (
                            <div key={step.title} className="relative flex flex-col items-center text-center lg:text-left lg:items-start p-4">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary border-2 border-primary/20 mb-4">
                                    <step.icon className="w-8 h-8" />
                                    <span className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-white font-bold text-sm border-4 border-background">
                    {index + 1}
                  </span>
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-secondary dark:text-white">{step.title}</h3>
                                <p className="text-muted-foreground">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
