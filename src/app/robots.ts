// app/robots.ts
import type { MetadataRoute } from "next";
import { site } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/(landing)/",
                disallow: ["/api/", "/(admin)"], // OK if you don’t want APIs crawled
            },
        ],
        sitemap: `${site.url}/sitemap.xml`,
        host: site.url,
    };
}
