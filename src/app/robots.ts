// src/app/robots.ts
import { site } from "@/lib/seo";
export default function robots() {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/"],
        },
        sitemap: `${site.url}/sitemap.xml`,
    };
}
