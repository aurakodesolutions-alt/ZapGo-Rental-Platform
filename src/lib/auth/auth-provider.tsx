"use client";

import { ReactNode, useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { useAuthStore, AuthUser } from "./auth-store";

function SyncSessionToStore() {
    const { data, status } = useSession();
    const setAuth = useAuthStore((s) => s.setAuth);

    useEffect(() => {
        // Map NextAuth session.user → store’s AuthUser
        const user: AuthUser | null = data?.user
            ? {
                name: data.user.name ?? null,
                email: data.user.email ?? null,
                role: (data.user as any).role,
                dbId: (data.user as any).dbId,
                kycVerified: (data.user as any).kycVerified,
            }
            : null;

        setAuth(status, user);
    }, [data, status, setAuth]);

    return null;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <SyncSessionToStore />
            {children}
        </SessionProvider>
    );
}
