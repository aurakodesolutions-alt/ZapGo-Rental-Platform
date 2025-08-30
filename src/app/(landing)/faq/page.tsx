import { FaqSection } from "@/components/landing/faq-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FaqPage() {
    return (
        <div className="container mx-auto py-12 px-4">
            <Card className="max-w-4xl mx-auto rounded-2xl shadow-md">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-4xl">Frequently Asked Questions</CardTitle>
                    <CardDescription>
                        Find answers to common questions about ZapGo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FaqSection />
                </CardContent>
            </Card>
        </div>
    );
}
