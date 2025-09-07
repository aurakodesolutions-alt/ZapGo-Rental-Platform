// src/app/(marketing)/coming-soon/page.tsx
"use client";

import ComingSoon from "@/components/coming-soon";

export default function BlogPage() {
    // You can pass ?t=Title&eta=2025-10-01T09:00:00+05:30&pg=FeatureName
    const title =  "Rider Profile 2.0";
    const etaIso =  null;
    const page =  "rider-profile";

    return (
        <div className="container mx-auto px-4 py-10">
            <ComingSoon
                title={title}
                subtitle="We’re rolling this out shortly. Join the waitlist and we’ll notify you the moment it goes live."
                page={page}
                etaIso={etaIso}
            />
        </div>
    );
}
