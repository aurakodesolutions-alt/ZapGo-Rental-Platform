import { site } from "@/lib/seo";

export default function robots() {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/"], // keep server routes private
        },
        sitemap: `${site.url}/sitemap.xml`,
        host: site.url,
    };
}
