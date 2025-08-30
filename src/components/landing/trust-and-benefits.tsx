import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Leaf, ShieldCheck, IndianRupee, Zap, BatteryCharging, Trophy } from "lucide-react";
import { Star } from "lucide-react";
import Image from "next/image";

const benefits = [
    { icon: Leaf, title: "Eco-Friendly", description: "Reduce your carbon footprint with every ride." },
    { icon: IndianRupee, title: "Low Running Cost", description: "Save money on fuel and maintenance." },
    { icon: Zap, title: "24/7 Support", description: "Our team is always here to help you out." },
    { icon: BatteryCharging, title: "BIS-Certified Chargers", description: "Safe and reliable charging for your peace of mind." },
    { icon: Trophy, title: "Helmets Provided", description: "We provide high-quality helmets with every scooter." },
    { icon: ShieldCheck, title: "Secure & Insured", description: "All rides are covered by our comprehensive insurance." },
];

const testimonials = [
    {
        name: "Priya Sharma",
        role: "Daily Commuter",
        avatar: "https://i.pravatar.cc/150?u=priya",
        text: "ZapGo has changed my daily commute! It's affordable, convenient, and I love that I'm helping the environment. The instant verification was a huge plus.",
        rating: 5,
    },
    {
        name: "Rohan Kumar",
        role: "University Student",
        avatar: "https://i.pravatar.cc/150?u=rohan",
        text: "The ZapGo Lite is perfect for getting around campus. No license needed and the pricing is very student-friendly. Highly recommend!",
        rating: 5,
    },
    {
        name: "Anjali Mehta",
        role: "Freelance Designer",
        avatar: "https://i.pravatar.cc/150?u=anjali",
        text: "I use ZapGo for client meetings across the city. It's so much faster than being stuck in traffic. The Pro plan has great range and the scooter is very zippy.",
        rating: 4,
    },
];

export function TrustAndBenefits() {
    return (
        <section id="benefits" className="py-16 lg:py-24 bg-muted/30 dark:bg-muted/20">
            <div className="container mx-auto px-4">
                {/* Benefits Section */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-secondary dark:text-white">
                        More Than Just a Ride
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Experience a smarter, cleaner, and more affordable way to travel.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {benefits.map((benefit) => (
                        <div key={benefit.title} className="flex items-start gap-4 p-4 rounded-lg hover:bg-background/80 transition-colors">
                            <div className="flex-shrink-0 text-primary bg-primary/10 p-3 rounded-full">
                                <benefit.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">{benefit.title}</h3>
                                <p className="text-muted-foreground">{benefit.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Testimonials Section */}
                <div className="mt-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-secondary dark:text-white">
                            Loved by Riders Like You
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                            Don't just take our word for it. Here's what our customers are saying.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {testimonials.map((testimonial) => (
                            <Card key={testimonial.name} className="flex flex-col shadow-lg">
                                <CardContent className="pt-6 flex-grow">
                                    <div className="flex items-center mb-4">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-5 w-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                            />
                                        ))}
                                    </div>
                                    <blockquote className="italic text-muted-foreground">"{testimonial.text}"</blockquote>
                                </CardContent>
                                <CardFooter>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{testimonial.name}</p>
                                            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
