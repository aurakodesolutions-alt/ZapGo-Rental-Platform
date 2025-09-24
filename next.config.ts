import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
    /* config options here */
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
                port: '',
                pathname: '/**',
            },
            { protocol: 'https', hostname: 'zapgorental.in', pathname: '/uploads/**' },
        ],
    },
    // devIndicators: {
    //     allowedDevOrigins: [
    //         "*.cluster-mwsteha33jfdowtvzffztbjcj6.cloudworkstations.dev"
    //     ],
    // },
};

export default nextConfig;

