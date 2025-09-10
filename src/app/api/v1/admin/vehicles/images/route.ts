import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { ensureDir, UPLOAD_BASE_DIR, PUBLIC_UPLOAD_BASE_URL } from "@/lib/upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ ok: false, error: "No files uploaded" }, { status: 400 });
        }

        const vehicleDir = path.join(UPLOAD_BASE_DIR, "images", "vehicles");
        await ensureDir(vehicleDir);

        const urls: string[] = [];

        for (const file of files) {
            const bytes = Buffer.from(await file.arrayBuffer());
            const filename = `${Date.now()}-${(file as any).name || "file"}`.replace(/\s+/g, "_");
            const fullPath = path.join(vehicleDir, filename);
            await fs.writeFile(fullPath, bytes);

            urls.push(`${PUBLIC_UPLOAD_BASE_URL}/images/vehicles/${filename}`);
        }

        return NextResponse.json({ ok: true, urls });
    } catch (err) {
        console.error("Vehicle upload error:", err);
        return NextResponse.json({ ok: false, error: "Failed to upload" }, { status: 500 });
    }
}
