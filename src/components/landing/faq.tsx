"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
    {
        question: "Is the security deposit refundable?",
        answer: "Yes, the ₹1750 security deposit is fully refundable after you return the scooter, provided there are no damages. The amount is credited back to your original payment method within 5-7 business days."
    },
    {
        question: "Which documents are required for verification?",
        answer: "For the ZapGo Lite plan, you need your Aadhaar and PAN card. For the ZapGo Pro plan, you'll need an Aadhaar, PAN card, and a valid Driving License. All documents can be uploaded directly through our app."
    },
    {
        question: "Do I need a Driving License for the ZapGo Lite plan?",
        answer: "No, a Driving License is not required for the ZapGo Lite plan as it consists of low-mileage, non-registered vehicles. However, you must be 18 years or older."
    },
    {
        question: "How soon is the document verification completed?",
        answer: "Our KYC verification is instant! As soon as you upload clear documents, our system verifies them in minutes, allowing you to book your ride right away."
    },
    {
        question: "What if I need to cancel my booking?",
        answer: "You can cancel your booking up to 1 hour before your scheduled pickup time for a full refund of any rental fees paid. The joining fee is non-refundable. Please refer to our Refund Policy for more details."
    },
    {
        question: "Are there any fees for late returns?",
        answer: "Yes, late returns are subject to a penalty to ensure availability for other users. The fee is calculated on an hourly basis. We recommend extending your booking through the app if you anticipate a delay."
    }
]

export function Faq() {
    return (
        <section id="faq" className="py-16 lg:py-24 bg-background dark:bg-muted/20">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-secondary dark:text-white">
                        Frequently Asked Questions
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Have questions? We've got answers. If you can't find what you're looking for, feel free to contact us.
                    </p>
                </div>
                <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto mt-12">
                    {faqs.map((faq, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-base text-muted-foreground">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    )
}
