import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getConnection } from "@/lib/db";
import sql from "mssql";

async function findUserByEmail(email: string) {
    const pool = await getConnection();

    // Try Admin first
    const admin = await pool.request()
        .input("Email", sql.NVarChar(256), email.toLowerCase())
        .query(`
      SELECT TOP 1 AdminId AS Id, FullName, Email, PasswordHash
      FROM dbo.Admins
      WHERE Email = @Email
    `);

    if (admin.recordset.length) {
        const r = admin.recordset[0];
        return {
            id: `admin:${r.Id}`,
            dbId: Number(r.Id),
            name: r.FullName as string,
            email: r.Email as string,
            role: "admin" as const,
            passwordHashString: (r.PasswordHash as Buffer)?.toString("utf8") || "",
        };
    }

    // Then Staff
    const staff = await pool.request()
        .input("Email", sql.NVarChar(256), email.toLowerCase())
        .query(`
      SELECT TOP 1 StaffId AS Id, FullName, Email, PasswordHash, KycVerified
      FROM dbo.Staff
      WHERE Email = @Email
    `);

    if (staff.recordset.length) {
        const r = staff.recordset[0];
        return {
            id: `staff:${r.Id}`,
            dbId: Number(r.Id),
            name: r.FullName as string,
            email: r.Email as string,
            role: "staff" as const,
            kycVerified: Boolean(r.KycVerified),
            passwordHashString: (r.PasswordHash as Buffer)?.toString("utf8") || "",
        };
    }

    return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    secret: process.env.NEXTAUTH_SECRET,      // allow Vercel/localhost flexible host headers
    session: { strategy: "jwt" }, // stateless sessions
    pages: { signIn: "/signin" }, // optional custom sign-in page (below)
    providers: [
        Credentials({
            name: "Email & Password",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (creds) => {
                if (!creds?.email || !creds?.password) return null;

                const user = await findUserByEmail(creds.email);
                if (!user || !user.passwordHashString) return null;

                const ok = await bcrypt.compare(creds.password, user.passwordHashString);
                if (!ok) return null;

                // Return only safe fields; rest goes into JWT via callbacks
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    dbId: user.dbId,
                    kycVerified: (user as any).kycVerified ?? undefined,
                } as any;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            // On sign in, merge our custom fields
            if (user) {
                token.role = (user as any).role;
                token.dbId = (user as any).dbId;
                token.name = user.name;
                token.email = user.email;
                token.kycVerified = (user as any).kycVerified;
            }
            return token;
        },
        async session({ session, token }) {
            // Expose role/id in session.user
            session.user = {
                ...session.user,
                name: token.name as string,
                email: token.email as string,
                role: token.role as "admin" | "staff",
                dbId: token.dbId as number,
                kycVerified: token.kycVerified as boolean | undefined,
            } as any;
            return session;
        },
    },
});
