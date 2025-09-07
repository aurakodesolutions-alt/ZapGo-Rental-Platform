// src/lib/seo.ts
import type { Metadata } from "next";

export const site = {
    name: "ZapGo Rental",
    shortName: "ZapGo",
    description:
        "Electric scooter rentals for commuters in Siliguri. Transparent pricing, instant KYC, zero fuel, zero hassle.",
    url: "https://zap-go-rental-platform.vercel.app",      // ← set your prod URL
    ogImage: "/images/hero_11.png",             // 1200x630
    twitter: "@zapgorental",                 // ← if you have one
    address: {
        street: "Holding No. 100/C/32, Sarada Pally, Ghoghomali Main Road",
        locality: "Siliguri",
        region: "West Bengal",
        postalCode: "734006",
        country: "IN",
    },
    phone: "+91 00000 00000",
    email: "support@zapgorental.com",
};

export const defaultMetadata: Metadata = {
    metadataBase: new URL(site.url),
    title: {
        default: `${site.name} — Electric Scooter Rentals`,
        template: `%s | ${site.name}`,
    },
    description: site.description,
    applicationName: site.name,
    robots: { index: true, follow: true },
    alternates: { canonical: site.url },
    openGraph: {
        type: "website",
        url: site.url,
        title: site.name,
        description: site.description,
        siteName: site.name,
        images: [{ url: site.ogImage, width: 1200, height: 630, alt: `${site.name} cover` }],
        locale: "en_IN",
    },
    twitter: {
        card: "summary_large_image",
        site: site.twitter,
        creator: site.twitter,
        title: site.name,
        description: site.description,
        images: [site.ogImage],
    },
    icons: {
        icon: [
            { url: "/favicon.ico" },
            { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
};
