import type {Metadata} from 'next';
import '../globals.css';
import { Toaster } from "@/components/ui/toaster"
import AuthProvider from "@/lib/auth/auth-provider";
import {Sidebar} from "@/components/admin/layout/sidebar";
import {Topbar} from "@/components/admin/layout/topbar";
import {Footer} from "@/components/admin/layout/footer";
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
        <AuthProvider>
            <div className="grid min-h-screen w-full md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
                <Sidebar />
                <div className="flex flex-col">
                    <Topbar />
                    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
                        {children}
                    </main>
                    <Footer />
                </div>
            </div>
        </AuthProvider>
        <Toaster />
        {/*<DevTools />*/}
        </body>
        </html>
    );
}
