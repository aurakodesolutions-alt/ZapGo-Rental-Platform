// /lib/auth-options.ts
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getConnection } from "@/lib/db";
import sql from "mssql";

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            name: "Email & Password",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (creds) => {
                if (!creds?.email || !creds?.password) return null;

                const pool = await getConnection();

                // Try Admin first
                const admin = await pool.request()
                    .input("Email", sql.NVarChar(256), String(creds.email).toLowerCase())
                    .query(`
            SELECT TOP 1 AdminId AS Id, FullName, Email, PasswordHash
            FROM dbo.Admins
            WHERE Email = @Email
          `);

                if (admin.recordset.length) {
                    const r = admin.recordset[0];
                    const hash = (r.PasswordHash as Buffer)?.toString("utf8") || "";
                    const ok = await bcrypt.compare(String(creds.password), hash);
                    if (!ok) return null;

                    return {
                        id: `admin:${Number(r.Id)}`,
                        name: r.FullName as string,
                        email: r.Email as string,
                        role: "admin",
                        dbId: Number(r.Id),
                    } as any;
                }

                // Then Staff
                const staff = await pool.request()
                    .input("Email", sql.NVarChar(256), String(creds.email).toLowerCase())
                    .query(`
            SELECT TOP 1 StaffId AS Id, FullName, Email, PasswordHash, KycVerified
            FROM dbo.Staff
            WHERE Email = @Email
          `);

                if (staff.recordset.length) {
                    const r = staff.recordset[0];
                    const hash = (r.PasswordHash as Buffer)?.toString("utf8") || "";
                    const ok = await bcrypt.compare(String(creds.password), hash);
                    if (!ok) return null;

                    return {
                        id: `staff:${Number(r.Id)}`,
                        name: r.FullName as string,
                        email: r.Email as string,
                        role: "staff",
                        dbId: Number(r.Id),
                        kycVerified: !!r.KycVerified,
                    } as any;
                }

                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.dbId = (user as any).dbId;
                token.kycVerified = (user as any).kycVerified;
            }
            return token;
        },
        async session({ session, token }) {
            (session.user as any) = {
                ...session.user,
                role: token.role,
                dbId: token.dbId,
                kycVerified: token.kycVerified,
            };
            return session;
        },
    },
};
