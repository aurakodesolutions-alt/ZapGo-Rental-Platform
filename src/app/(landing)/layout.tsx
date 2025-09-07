import type { Metadata } from 'next';
import { Inter, Poppins, Roboto_Mono } from 'next/font/google';
import '../globals.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { MobileCta } from '@/components/landing/mobile-cta';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import {ThemeProvider} from "@/components/theme-provider";
import {TopNoticeBar} from "@/components/landing/top-notice-bar";
import AuthProvider from "@/lib/auth/auth-provider";
import { SpeedInsights } from "@vercel/speed-insights/next"


const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';
const fontBody = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-body',
});

const fontHeadline = Poppins({
    subsets: ['latin'],
    display: 'swap',
    weight: ['400', '500', '600', '700'],
    variable: '--font-headline',
});

const fontCode = Roboto_Mono({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-code',
});

export const metadata: Metadata = {
    title: {
        default: 'ZapGo - Your City, Your Ride',
        template: '%s | ZapGo',
    },
    description: 'Fast, affordable, and eco-friendly electric scooter rentals. Book your ride in seconds and unlock your city with ZapGo.',
    keywords: ['electric scooter', 'scooter rental', 'urban mobility', 'eco-friendly transport', 'ZapGo'],
    openGraph: {
        title: 'ZapGo - Electric Scooter Rentals',
        description: 'The easiest way to get around the city. Fast, fun, and eco-friendly.',
        url: 'https://zapgo.rentals', // Replace with your actual domain
        siteName: 'ZapGo',
        images: [
            {
                url: 'https://zapgo.rentals/og-image.png', // Replace with your actual OG image URL
                width: 1200,
                height: 630,
                alt: 'A ZapGo electric scooter parked in a vibrant city street.',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'ZapGo - Your City, Your Ride',
        description: 'Unlock your city with ZapGo. Fast, affordable, and eco-friendly scooter rentals.',
        creator: '@zapgo', // Replace with your Twitter handle
        images: ['https://zapgo.rentals/twitter-image.png'], // Replace with your actual Twitter image URL
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    manifest: '/manifest.json',
};

const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ZapGo Rental",
    "url": siteUrl,
    "logo": new URL('/rental_logo.png', siteUrl).toString(),
    "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+91-900-000-0000",
        "contactType": "customer service"
    }
};

const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "Is the security deposit refundable?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, the ₹1750 security deposit is fully refundable after you return the scooter, provided there are no damages."
            }
        },
        {
            "@type": "Question",
            "name": "Which documents are required for verification?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "For the ZapGo Lite plan, you need your Aadhaar and PAN card. For the ZapGo Pro plan, you'll need an Aadhaar, PAN card, and a valid Driving License."
            }
        },
        {
            "@type": "Question",
            "name": "Do I need a Driving License for the ZapGo Lite plan?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "No, a Driving License is not required for the ZapGo Lite plan as it consists of low-mileage, non-registered vehicles."
            }
        },
        {
            "@type": "Question",
            "name": "How soon is the document verification completed?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our KYC verification is instant! As soon as you upload clear documents, our system verifies them in minutes, allowing you to book your ride right away."
            }
        }
    ]
};


export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <meta name="theme-color" content="#80C42F" />
        </head>
        <body
            className={cn(
                'min-h-screen bg-background font-body antialiased',
                fontBody.variable,
                fontHeadline.variable,
                fontCode.variable
            )}
        >
        {/*<div className="relative flex min-h-screen flex-col">*/}
            {/*<SiteHeader />*/}
            {/*<main className="flex-1">{children}</main>*/}
            {/*<SiteFooter />*/}
            {/*<MobileCta />*/}
        {/*</div>*/}
        <AuthProvider>
        <ThemeProvider>
            <div className="relative flex min-h-screen flex-col">
                <TopNoticeBar />
            <SiteHeader />
            <main className="flex-1">
                {children}
            </main>
            <SiteFooter />
            <MobileCta />
            </div>
            <Toaster />
        </ThemeProvider>
        </AuthProvider>
        <Toaster />
        <SpeedInsights />
        <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
        </body>
        </html>
    );
}
