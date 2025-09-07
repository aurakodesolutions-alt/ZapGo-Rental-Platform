'use client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Briefcase, Heart, Leaf, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const faqItems = [
    {
        question: "What do I need to rent a scooter?",
        answer: "You'll need a valid driver's license, a national ID (like Aadhaar), and to be at least 18 years old. The entire KYC process can be completed online through our app.",
    },
    {
        question: "What is included in the rental price?",
        answer: "The rental price includes the scooter, a helmet, third-party insurance, and regular maintenance. There are no hidden fees. You only pay for the electricity you use.",
    },
    {
        question: "Can I extend my rental period?",
        answer: "Yes! You can easily extend your rental through the rider dashboard. Our AI assistant can even help you choose the best extension plan based on your needs.",
    },
    {
        question: "What happens if the scooter breaks down?",
        answer: "Don't worry! We offer 24/7 roadside assistance. Just give us a call through the app, and we'll be there to help you out or provide a replacement vehicle.",
    },
    {
        question: "Are the scooters insured?",
        answer: "Yes, all our vehicles come with comprehensive insurance covering third-party liability. Optional personal accident coverage is also available as an add-on.",
    },
    {
        question: "Where can I charge my scooter?",
        answer: "Our scooters come with a portable charger that can be plugged into any standard home socket. You can also visit any of our partner charging stations across the city."
    }
];

const teamMembers = [
    { name: 'Rohan Sharma', role: 'Founder &amp; CEO', image: 'https://picsum.photos/100/100?random=5' },
    { name: 'Priya Singh', role: 'Head of Operations', image: 'https://picsum.photos/100/100?random=6' },
    { name: 'Amit Patel', role: 'Chief Technology Officer', image: 'https://picsum.photos/100/100?random=7' },
    { name: 'Sneha Gupta', role: 'Head of Customer Experience', image: 'https://picsum.photos/100/100?random=8' },
]

export default function AboutPage() {
    return (
        <div className="bg-background">
            {/* Hero Section */}
            <section className="relative gradient-background noise-bg">
                <div className="container mx-auto max-w-7xl px-4 py-24 text-center text-primary-foreground">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                        Move smarter with ZapGo
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl">
                        We're revolutionizing urban mobility by providing affordable, flexible, and sustainable electric vehicle rentals.
                    </p>
                </div>
            </section>

            {/* Mission &amp; Values */}
            <section className="py-20 sm:py-28">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Our Mission &amp; Values</h2>
                        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-lg">
                            We are driven by a simple yet powerful mission: to make cities greener and more accessible.
                        </p>
                    </div>
                    <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                        <Card className="rounded-2xl text-center shadow-sm border-0 bg-secondary/5">
                            <CardContent className="p-8">
                                <div className="inline-block rounded-full bg-primary/10 p-4 text-primary"><Leaf className="h-8 w-8" /></div>
                                <h3 className="mt-6 text-xl font-bold">Sustainability</h3>
                                <p className="mt-2 text-muted-foreground">Every ride with ZapGo is a step towards a cleaner planet. We are committed to a zero-emissions future.</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl text-center shadow-sm border-0 bg-secondary/5">
                            <CardContent className="p-8">
                                <div className="inline-block rounded-full bg-primary/10 p-4 text-primary"><Briefcase className="h-8 w-8" /></div>
                                <h3 className="mt-6 text-xl font-bold">Reliability</h3>
                                <p className="mt-2 text-muted-foreground">Our fleet is meticulously maintained to ensure your safety and comfort on every journey.</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl text-center shadow-sm border-0 bg-secondary/5">
                            <CardContent className="p-8">
                                <div className="inline-block rounded-full bg-primary/10 p-4 text-primary"><Users className="h-8 w-8" /></div>
                                <h3 className="mt-6 text-xl font-bold">Community</h3>
                                <p className="mt-2 text-muted-foreground">We're more than a service; we're a community of riders committed to smarter urban living.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-20 sm:py-28 bg-background">
                <div className="container mx-auto max-w-5xl px-4">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Meet the Team</h2>
                        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-lg">
                            The passionate individuals driving ZapGo forward.
                        </p>
                    </div>
                    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                        {teamMembers.map((member) => (
                            <div key={member.name} className="text-center">
                                <Avatar className="h-24 w-24 mx-auto">
                                    <AvatarImage src={member.image} alt={member.name} data-ai-hint="person photo" />
                                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <h4 className="mt-4 font-semibold text-lg">{member.name}</h4>
                                <p className="text-sm text-primary">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 sm:py-28 bg-secondary/5">
                <div className="container mx-auto max-w-3xl px-4">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Frequently Asked Questions</h2>
                        <p className="mt-4 text-muted-foreground md:text-lg">
                            Have questions? We've got answers.
                        </p>
                    </div>
                    <Accordion type="single" collapsible className="mt-12 w-full">
                        {faqItems.map((item, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <AccordionTrigger className="text-lg font-medium text-left">{item.question}</AccordionTrigger>
                                <AccordionContent className="text-base text-muted-foreground">
                                    {item.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 sm:py-28">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="bg-card p-10 rounded-2xl shadow-lg border">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to Ride?</h2>
                            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground md:text-lg">
                                Join the ZapGo community today and experience the future of urban mobility.
                            </p>
                            <Button asChild size="lg" className="mt-8 rounded-xl">
                                <Link href="/book">Book Your EV Now</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
