// middleware.ts
export { auth as middleware } from "@/lib/auth-options";

export const config = {
    matcher: [
        // Protect everything under /admin EXCEPT /admin/login (and /admin/login/* if you add subpaths)
        "/admin/(?!login$)(?!login/).*",
        "/staff/:path*",
    ],
};
