import { MetadataRoute } from 'next';

const URL = 'https://zapgo.rentals'; // Replace with your actual domain

export default function sitemap(): MetadataRoute.Sitemap {
    const routes = ['/', '/availability', '/track', '/faq', '/contact', '/privacy', '/terms', '/book'].map((route) => ({
        url: `${URL}${route}`,
        lastModified: new Date().toISOString(),
    }));

    return routes;
}
