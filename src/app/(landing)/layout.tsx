import type { Metadata } from "next";
import { Inter, Poppins, Roboto_Mono } from "next/font/google";
import "../globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
// import { MobileCta } from "@/components/landing/mobile-cta";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { TopNoticeBar } from "@/components/landing/top-notice-bar";
import AuthProvider from "@/lib/auth/auth-provider";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import FloatingCta from "@/components/floating-cta";
import LoadingScreen from "@/components/loading-screen";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:9002";

const fontBody = Inter({ subsets: ["latin"], display: "swap", variable: "--font-body" });
const fontHeadline = Poppins({
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "500", "600", "700"],
    variable: "--font-headline",
});
const fontCode = Roboto_Mono({ subsets: ["latin"], display: "swap", variable: "--font-code" });

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: "ZapGo Rental - Your City, Your Ride",
        template: "%s | ZapGo",
    },
    description:
        "Fast, affordable, and eco-friendly electric scooter rentals. Book your ride in seconds and unlock your city with ZapGo.",
    keywords: ["electric scooter", "scooter rental", "urban mobility", "eco-friendly transport", "ZapGo", "zapgo","zapgo rental","zapgo rental in siliguri", "electric scooter rental in siliguri", "Siliguri Zapgo Rental", "Siliguri Electric Scooter Rentals"],
    openGraph: {
        title: "ZapGo Rental - Electric Scooter Rentals",
        description: "The easiest way to get around the city. Fast, fun, and eco-friendly.",
        url: siteUrl,
        siteName: "ZapGo",
        images: [
            {
                url: new URL("/images/hero_2.png", siteUrl).toString(),
                width: 1200,
                height: 630,
                alt: "A ZapGo electric scooter parked in a vibrant city street.",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "ZapGo Rental - Your City, Your Ride",
        description: "Unlock your city with ZapGo. Fast, affordable, and eco-friendly scooter rentals.",
        creator: "@zapgo",
        images: [new URL("/images/hero_11.png", siteUrl).toString()],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    manifest: "/manifest.json",
    icons: {
        icon: [
            { url: "/favicon.ico" },
            { url: "/logo.png", sizes: "192x192", type: "image/png" },
            { url: "/logo.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
    },
    alternates: { canonical: siteUrl },
};

const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}#organization`,
    name: "ZapGo Rental",
    url: siteUrl,
    logo: new URL("/rental_logo.png", siteUrl).toString(),
    contactPoint: {
        "@type": "ContactPoint",
        telephone: "+91-637-458-0290",
        contactType: "customer service",
        areaServed: "IN",
        availableLanguage: ["en", "hi"],
    },
};

const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}#local`,
    name: "ZapGo Rental - Siliguri",
    url: siteUrl,
    image: new URL("/logo.png", siteUrl).toString(),
    address: {
        "@type": "PostalAddress",
        streetAddress: "Holding No. 100/C/32, Sarada Pally, Ghoghomali Main Road",
        addressLocality: "Siliguri",
        addressRegion: "West Bengal",
        postalCode: "734006",
        addressCountry: "IN",
    },
    telephone: "+91-637-458-0290",
    openingHours: "Mo-Sa 10:00-19:00",
    areaServed: "Siliguri",
};

const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    url: siteUrl,
    name: "ZapGo Rental - Siliguri",
    potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            {/* Use next/font — no external Google CSS needed (keeps CLS/LCP tight) */}
            <meta name="theme-color" content="#80C42F" />
            <link rel="preload" as="video" href="/loading/loading.mp4" type="video/mp4" />

            {/* JSON-LD (sitewide): Organization, LocalBusiness, WebSite */}
            <Script
                id="ld-org"
                type="application/ld+json"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
            />
            <Script
                id="ld-local"
                type="application/ld+json"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <Script
                id="ld-website"
                type="application/ld+json"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
            />
            <Script
                id="ld-faq"
                type="application/ld+json"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{ __html: {} }}
            />
        </head>
        <body
            className={cn(
                "min-h-screen bg-background font-body antialiased",
                fontBody.variable,
                fontHeadline.variable,
                fontCode.variable
            )}
        >
        <LoadingScreen />
        <AuthProvider>
            <ThemeProvider>
                <div className="relative flex min-h-screen flex-col">
                    <TopNoticeBar />
                    <SiteHeader />
                    <main className="flex-1">{children}</main>
                    <SiteFooter />
                    <FloatingCta variant={"green"} />
                    {/*<MobileCta />*/}
                </div>
                <Toaster />
            </ThemeProvider>
        </AuthProvider>

        <SpeedInsights />

        {/* Load Cashfree only after hydration; consider moving to the specific payment page for perf */}
        <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="afterInteractive" />
        </body>
        </html>
    );
}
