import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { ensureDir, UPLOAD_BASE_DIR, PUBLIC_UPLOAD_BASE_URL } from "@/lib/upload";
import { getConnection, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg"]);
const ALLOWED_EXT  = new Set([".png", ".jpg", ".jpeg"]);

function extFromNameOrType(name?: string | null, mime?: string | null) {
    if (name) {
        const ext = path.extname(name).toLowerCase();
        if (ALLOWED_EXT.has(ext)) return ext;
    }
    if (mime === "image/jpeg") return ".jpg";
    if (mime === "image/png") return ".png";
    return null;
}

async function uniquePath(baseDir: string, baseName: string, ext: string) {
    let i = 0;
    while (true) {
        const fname = i === 0 ? `${baseName}${ext}` : `${baseName}-${i}${ext}`;
        const full = path.join(baseDir, fname);
        try { await fs.access(full); i++; } catch { return full; }
    }
}

/**
 * POST form-data: oldPhoto?:File, newPhoto?:File
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const swapId = Number(params.id);
        if (!swapId) return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });

        const form = await req.formData();
        const entries = (["oldPhoto", "newPhoto"] as const)
            .map((f) => ({ field: f, file: form.get(f) as File | null }))
            .filter(x => x.file instanceof File);

        if (!entries.length)
            return NextResponse.json({ ok: false, error: "No files" }, { status: 400 });

        const baseDir = path.join(UPLOAD_BASE_DIR, "images", "battery-swaps", String(swapId));
        await ensureDir(baseDir);
        const out: Record<string, string> = {};

        for (const { field, file } of entries) {
            if (!file) continue;
            const mime = file.type || null;
            if (mime && !ALLOWED_MIME.has(mime)) {
                return NextResponse.json({ ok: false, error: `Unsupported type for ${field}` }, { status: 415 });
            }
            const ext = extFromNameOrType((file as any).name, mime);
            if (!ext || !ALLOWED_EXT.has(ext)) {
                return NextResponse.json({ ok: false, error: `Unsupported extension for ${field}` }, { status: 415 });
            }
            const baseName = field === "oldPhoto" ? "old" : "new";
            const fullPath = await uniquePath(baseDir, baseName, ext);
            const buf = Buffer.from(await file.arrayBuffer());
            await fs.writeFile(fullPath, buf);

            const filename = path.basename(fullPath);
            const url = `${PUBLIC_UPLOAD_BASE_URL}/images/battery-swaps/${swapId}/${filename}`;
            out[field] = url;

            // update row
            const pool = await getConnection();
            const col = field === "oldPhoto" ? "OldBatteryPhotoUrl" : "NewBatteryPhotoUrl";
            await pool.request()
                .input("id", sql.BigInt, swapId)
                .input("url", sql.NVarChar(400), url)
                .query(`UPDATE dbo.BatterySwaps SET ${col}=@url, UpdatedAt=SYSUTCDATETIME() WHERE SwapId=@id`);
        }

        return NextResponse.json({ ok: true, data: out });
    } catch (err) {
        console.error("POST /battery-swaps/:id/photos error:", err);
        return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
    }
}
