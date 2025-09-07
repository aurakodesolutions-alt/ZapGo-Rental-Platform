import { NextResponse } from "next/server";
import { clearRiderSession } from "@/lib/auth/auth-rider";

export async function POST() {
    const res = NextResponse.json({ ok: true });
    clearRiderSession(res);
    return res;
}
