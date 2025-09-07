
import { ContactForm } from "@/components/contact-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, MapPin, Phone, MessageSquare } from "lucide-react";

export default function ContactPage() {
    const showroomAddress = "ZapGo Showroom, Siliguri, West Bengal";
    const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(showroomAddress)}&output=embed`;

    return (
        <div className="bg-background">
            <div className="relative gradient-background noise-bg">
                <div className="container mx-auto max-w-7xl px-4 py-24 text-center text-primary-foreground">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                        We’re here to help
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl">
                        Questions about rentals, returns, or plans? Reach us anytime.
                    </p>
                    <div className="mt-8 flex justify-center gap-2 sm:gap-4 flex-wrap">
                        <Badge variant="secondary" className="text-sm sm:text-base px-4 py-2 rounded-lg">
                            <Phone className="mr-2 h-4 w-4" /> +91 12345 67890
                        </Badge>
                        <Badge variant="secondary" className="text-sm sm:text-base px-4 py-2 rounded-lg">
                            <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
                        </Badge>
                        <Badge variant="secondary" className="text-sm sm:text-base px-4 py-2 rounded-lg">
                            <Mail className="mr-2 h-4 w-4" /> support@zapgo.com
                        </Badge>
                    </div>
                </div>
            </div>

            <section className="py-20 sm:py-28">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
                        {/* Map and Details */}
                        <div className="lg:col-span-2">
                            <Card className="rounded-2xl h-full shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="text-primary"/>
                                        Our Showroom
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="aspect-video w-full">
                                        <iframe
                                            title="ZapGo Showroom"
                                            width="100%"
                                            height="100%"
                                            loading="lazy"
                                            allowFullScreen
                                            referrerPolicy="no-referrer-when-downgrade"
                                            src={mapSrc}
                                            className="rounded-xl border"
                                        />
                                    </div>
                                    <p className="mt-4 font-semibold text-foreground">
                                        ZapGo Showroom, Sevoke Road,
                                        <br />
                                        Siliguri, West Bengal, 734001
                                    </p>
                                    <Separator className="my-4"/>
                                    <p className="text-muted-foreground">
                                        <span className="font-semibold text-foreground">Hours:</span> Mon – Sun, 9:00 AM – 8:00 PM
                                    </p>
                                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                        <Button className="rounded-xl w-full" asChild>
                                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(showroomAddress)}`} target="_blank" rel="noopener noreferrer">
                                                Get Directions
                                            </a>
                                        </Button>
                                        <Button variant="outline" className="rounded-xl w-full" asChild>
                                            <a href="tel:+911234567890">Call Us</a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-3">
                            <Card className="rounded-2xl h-full shadow-lg">
                                <CardHeader>
                                    <CardTitle>Send us a Message</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ContactForm />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
