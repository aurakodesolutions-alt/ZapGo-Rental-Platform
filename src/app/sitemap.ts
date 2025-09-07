// src/app/sitemap.ts
import { site } from "@/lib/seo";
export default async function sitemap() {
    const now = new Date().toISOString();
    return [
        { url: site.url, lastModified: now, changeFrequency: "daily", priority: 1 },
        { url: `${site.url}/vehicles`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
        { url: `${site.url}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
        { url: `${site.url}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
        { url: `${site.url}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    ];
}
