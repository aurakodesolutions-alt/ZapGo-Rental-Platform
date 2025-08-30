"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

export default function AdminLoginPage() {
    const router = useRouter();
    const search = useSearchParams();
    const { toast } = useToast();
    const { status, data } = useSession();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // If already authenticated, bounce appropriately
    useEffect(() => {
        if (status === "authenticated") {
            const role = (data?.user as any)?.role;
            if (role === "admin") {
                router.replace("/admin"); // server gate will route to /admin/dashboard
            } else {
                router.replace("/");
            }
        }
    }, [status, data, router]);

    // Show error coming from NextAuth (e.g., CredentialsSignin)
    useEffect(() => {
        const err = search.get("error");
        if (err) {
            toast({
                title: "Login failed",
                description:
                    err === "CredentialsSignin"
                        ? "Invalid email or password."
                        : "Unable to sign in. Please try again.",
                variant: "destructive",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!email || !password) {
            toast({ title: "Email and password are required", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        try {
            const callbackUrl = search.get("callbackUrl") || "/admin";

            // Use redirect:false so we can handle the response and route ourselves
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl,
            });

            if (res?.error) {
                toast({
                    title: "Login failed",
                    description:
                        res.error === "CredentialsSignin"
                            ? "Invalid email or password."
                            : "Unexpected error. Please try again.",
                    variant: "destructive",
                });
                return;
            }

            // success → go to callbackUrl (or /admin which will server-redirect to dashboard)
            router.replace(res?.url || callbackUrl);
            router.refresh(); // ensure session is fresh
        } finally {
            setSubmitting(false);
        }
    }

    // While we check session, show the card (same as your skeleton pattern)
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Card className="mx-auto w-full max-w-sm rounded-2xl shadow-xl">
                <CardHeader className="text-center">
                    <div className="mb-2 flex items-center justify-center space-x-2">
                        <Image src="/logo.png" alt="ZapGo Rental Logo" width={110} height={32} className="dark:invert" />
                    </div>
                    <CardTitle className="font-headline text-2xl">ZapGo Admin Login</CardTitle>
                    <CardDescription>Enter your credentials to access the dashboard</CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={onSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@yourdomain.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                                disabled={submitting}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                                disabled={submitting}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting ? "Signing in..." : "Login"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
