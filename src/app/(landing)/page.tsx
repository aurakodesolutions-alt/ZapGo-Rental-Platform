// src/app/page.tsx
import Script from "next/script";
import { site } from "@/lib/seo";

import { HeroSlider } from "@/components/landing/hero-slider";               // ← new (below)
import { HowItWorks } from "@/components/landing/how-it-works";
import { Plans } from "@/components/landing/plans";
import { TrustAndBenefits } from "@/components/landing/trust-and-benefits";
import { Faq } from "@/components/landing/faq";
import FeaturedVehicles from "@/components/landing/featured-vehicles";

export default function Home() {
    const orgJsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: site.name,
        url: site.url,
        logo: `${site.url}/logo.png`,
        email: site.email,
        telephone: site.phone,
        address: {
            "@type": "PostalAddress",
            streetAddress: site.address.street,
            addressLocality: site.address.locality,
            addressRegion: site.address.region,
            postalCode: site.address.postalCode,
            addressCountry: site.address.country,
        },
    };

    const productJsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Electric Scooter Rental",
        brand: site.name,
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "120" },
        offers: {
            "@type": "AggregateOffer",
            priceCurrency: "INR",
            lowPrice: "199",
            highPrice: "399",
            offerCount: "2",
            url: `${site.url}/book`,
        },
    };

    return (
        <main role="main">
            {/* 1) LCP-friendly hero with priority image */}
            <HeroSlider />

            {/* 2) Sections with proper landmarks/headings */}
            <section aria-labelledby="how-heading">
                <HowItWorks />
            </section>

            <section aria-labelledby="how-heading">
                <FeaturedVehicles />
            </section>

            <section aria-labelledby="plans-heading">
                <Plans />
            </section>

            {/*<section aria-labelledby="pricing-heading">*/}
            {/*    <Pricing />*/}
            {/*</section>*/}

            <section aria-labelledby="trust-heading">
                <TrustAndBenefits />
            </section>

            {/* Keep your existing FAQ + mobile CTA */}
            <section aria-labelledby="faq-heading">
                <Faq />
            </section>

            {/*<MobileBottomBar />*/}

            {/* JSON-LD (helps rich results) */}
            <Script id="ld-org" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
            <Script id="ld-product" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
        </main>
    );
}
