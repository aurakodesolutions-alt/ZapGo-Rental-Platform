"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function RiderLoginPage() {
    const [q, setQ] = useState("");
    const [pw, setPw] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const router = useRouter();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr(null);
        setLoading(true);
        try {
            const r = await fetch("/api/v1/public/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneOrEmail: q.trim(), password: pw }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || "Login failed");
            router.replace("/rider/profile");
        } catch (e: any) {
            setErr(e?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto flex justify-center py-12 px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>Use your email & password created during booking.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={onSubmit}>
                        <Input placeholder="Email" value={q} onChange={(e) => setQ(e.target.value)} />
                        <Input placeholder="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
                        {err && <p className="text-sm text-destructive">{err}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
