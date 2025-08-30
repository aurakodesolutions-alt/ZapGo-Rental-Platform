'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { useAuthStore } from '@/store/auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
    const router = useRouter();
    // const { token, user } = useAuthStore((state) => ({ token: state.token, user: state.user }));
    // const isLoading = useAuthStore((state) => state.isLoading);
    const isLoading = true;

    // useEffect(() => {
    //     if (!isLoading) {
    //         if (token && user) {
    //             router.replace('/dashboard');
    //         } else {
    //             router.replace('/login');
    //         }
    //     }
    // }, [token, user, router, isLoading]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-8 w-8 text-primary"
                    >
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                        <path d="M5 3v4" />
                        <path d="M19 17v4" />
                        <path d="M3 5h4" />
                        <path d="M17 19h4" />
                    </svg>
                    <h1 className="text-2xl font-headline font-bold text-primary">ZapGo Admin</h1>
                </div>
                <Skeleton className="h-4 w-48" />
            </div>
        </div>
    );
}
