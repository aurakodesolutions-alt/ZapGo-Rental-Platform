"use client";

import { create } from "zustand";

export type UserRole = "admin" | "staff" | undefined;

export type AuthUser = {
    name?: string | null;
    email?: string | null;
    role?: UserRole;
    dbId?: number;
    kycVerified?: boolean;
};

type AuthState = {
    status: "loading" | "authenticated" | "unauthenticated";
    user: AuthUser | null;

    // Internal setters
    setAuth: (status: AuthState["status"], user: AuthUser | null) => void;
    clear: () => void;
    signOut: () => void; // Add signOut method
};

export const useAuthStore = create<AuthState>((set) => ({
    status: "loading",
    user: null,
    setAuth: (status, user) => set({ status, user }),
    clear: () => set({ status: "unauthenticated", user: null }),
    signOut: () => {
        set({ status: "unauthenticated", user: null }); // Clears the authentication state
        // Add any additional session clear logic here if required, e.g., clearing cookies or localStorage
    },
}));

// A convenient selector hook
export function useAuth() {
    return useAuthStore((s) => ({
        status: s.status,
        user: s.user,
        isAuthenticated: s.status === "authenticated",
        role: s.user?.role,
    }));
}
