import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const COOKIE = "rider_session";
const secret = new TextEncoder().encode(process.env.RIDER_JWT_SECRET || "dev_rider_secret");
const MAX_AGE = 60 * 60 * 24 * 30; // 30d

export type RiderClaims = { rid: number; name: string; iat: number };

export async function issueRiderSession(res: NextResponse, rid: number, name: string) {
    const token = await new SignJWT({ rid, name })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${MAX_AGE}s`)
        .sign(secret);

    res.cookies.set(COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: MAX_AGE,
    });
}

export function clearRiderSession(res: NextResponse) {
    res.cookies.set(COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getRiderIdFromRequest(req: NextRequest): Promise<number | null> {
    const token = req.cookies.get(COOKIE)?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, secret);
        return Number(payload.rid) || null;
    } catch {
        return null;
    }
}
