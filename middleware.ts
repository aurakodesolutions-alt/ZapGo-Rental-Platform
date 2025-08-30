// /middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
    callbacks: {
        authorized: ({ token, req }) => {
            const pathname = req.nextUrl.pathname;

            // allow public auth endpoints
            if (pathname.startsWith("/api/auth")) return true;

            // allow admin login page
            if (pathname === "/login") return true;

            // admin area: must be admin
            if (pathname.startsWith("/admin")) {
                return token?.role === "admin";
            }

            // staff area: any signed-in user
            if (pathname.startsWith("/staff")) {
                return !!token;
            }

            // public otherwise
            return true;
        },
    },
});

export const config = {
    matcher: [
        "/admin/:path*",
        "/staff/:path*",
        // include login if you want the authorized() callback to run there:
        // "/admin/login",
    ],
};
