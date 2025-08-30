import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
    return (
        <div className="container mx-auto py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <Card className="rounded-2xl shadow-md">
                    <CardHeader className="text-center">
                        <CardTitle className="font-headline text-4xl">Get in Touch</CardTitle>
                        <CardDescription>We're here to help. Reach out to us with any questions or concerns.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-8 text-center">
                            <Card className="bg-background">
                                <CardHeader>
                                    <Mail className="h-10 w-10 mx-auto text-primary" />
                                    <CardTitle className="font-headline mt-2">Email Us</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">For general inquiries</p>
                                    <a href="mailto:support@zapgo.com" className="text-primary font-medium hover:underline">
                                        support@zapgo.com
                                    </a>
                                </CardContent>
                            </Card>
                            <Card className="bg-background">
                                <CardHeader>
                                    <Phone className="h-10 w-10 mx-auto text-primary" />
                                    <CardTitle className="font-headline mt-2">Call Us</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">For urgent support</p>
                                    <a href="tel:+911234567890" className="text-primary font-medium hover:underline">
                                        +91 12345 67890
                                    </a>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="text-center border-t pt-8">
                            <h3 className="font-headline text-2xl">Instant Support</h3>
                            <p className="text-muted-foreground mt-2">Chat with us directly on WhatsApp for the fastest response.</p>
                            <Button asChild size="lg" className="mt-4 rounded-xl">
                                <a href="https://wa.me/911234567890" target="_blank" rel="noopener noreferrer">
                                    <MessageSquare className="mr-2 h-5 w-5"/> Chat on WhatsApp
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
