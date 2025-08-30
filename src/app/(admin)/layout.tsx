import type {Metadata} from 'next';
import '../globals.css';
import { Toaster } from "@/components/ui/toaster"
// import { DevTools } from '@/components/DevTools';

export const metadata: Metadata = {
    title: 'ZapGo Admin',
    description: 'Admin CRM for ZapGo Rental business',
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            <script
                type="application/ld+json"
                // dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <script
                type="application/ld+json"
                // dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <meta name="theme-color" content="#80C42F" />
        </head>
        <body className="font-body bg-background text-foreground antialiased">
        {children}
        <Toaster />
        {/*<DevTools />*/}
        </body>
        </html>
    );
}
