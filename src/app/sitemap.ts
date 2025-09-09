// app/sitemap.ts
import type { MetadataRoute } from "next";
import { site } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    let vehicleUrls: MetadataRoute.Sitemap = [];
    try {
        const res = await fetch(`${site.url}/api/v1/public/vehicles?page=1&pageSize=50`, {
            next: { revalidate: 60 * 60 }, // 1h
        });

        if (res.ok) {
            const data = await res.json();
            const items: any[] = Array.isArray(data?.items) ? data.items : [];
            vehicleUrls = items.map((v) => ({
                url: `${site.url}/vehicles/${encodeURIComponent(v.id)}`,
                lastModified: now, // replace with v.updatedAt if available
                changeFrequency: "weekly",
                priority: 0.7,
            }));
        }
    } catch {
        // ignore; still return core pages
    }

    return [
        { url: site.url, lastModified: now, changeFrequency: "daily", priority: 1 },
        { url: `${site.url}/vehicles`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
        { url: `${site.url}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
        { url: `${site.url}/about-us`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
        { url: `${site.url}/contact-us`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
        { url: `${site.url}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
        { url: `${site.url}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
        { url: `${site.url}/legal/refund`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
        ...vehicleUrls,
    ];
}
