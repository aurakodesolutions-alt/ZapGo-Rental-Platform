// /app/(admin)/admin/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const revalidate = 0;

export default async function AdminEntry() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/admin/login?callbackUrl=/admin");
    }

    if ((session.user as any)?.role !== "admin") {
        redirect("/");
    }

    redirect("/admin/dashboard");
}
