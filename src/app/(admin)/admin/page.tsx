'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { useAuthStore } from '@/store/auth';
import { Skeleton } from '@/components/ui/skeleton';
import {cn} from "@/lib/utils";
import Image from "next/image";

export default function Home() {
    const router = useRouter();
    // const { token, user } = useAuthStore((state) => ({ token: state.token, user: state.user }));
    // const isLoading = useAuthStore((state) => state.isLoading);
    let bool = true;
    const isLoading = !bool

    useEffect(() => {
        if (!isLoading) {
            router.replace('/admin/login');
        }
    }, [router, isLoading]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-2">
                    <Image src="/logo.png" alt="ZapGo Rental Logo" width={110} height={32} className={""} />
                    <h1 className="text-2xl font-headline font-bold text-primary">ZapGo Admin</h1>
                </div>
                <Skeleton className="h-4 w-48" />
            </div>
        </div>
    );
}
