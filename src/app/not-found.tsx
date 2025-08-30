// /app/not-found.tsx
import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
    return (
        <main className="min-h-screen grid place-content-center px-6 text-center">
            <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="ZapGo Rental Logo" width={110} height={32} />
                    <h1 className="text-2xl font-headline font-bold text-primary">ZapGo Admin</h1>
                </div>

                <h2 className="text-4xl font-bold tracking-tight">404 — Page not found</h2>
                <p className="text-muted-foreground max-w-md">
                    The page you’re looking for doesn’t exist or may have moved.
                </p>

                <div className="flex gap-3">
                    <Link
                        href="/"
                        className="inline-flex items-center rounded-lg bg-primary text-primary-foreground px-4 py-2"
                    >
                        Go home
                    </Link>
                    {/*<Link*/}
                    {/*    href="/admin/login"*/}
                    {/*    className="inline-flex items-center rounded-lg border px-4 py-2"*/}
                    {/*>*/}
                    {/*    Admin login*/}
                    {/*</Link>*/}
                </div>
            </div>
        </main>
    );
}
