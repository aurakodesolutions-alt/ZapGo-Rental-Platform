import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { ensureDir, UPLOAD_BASE_DIR, PUBLIC_UPLOAD_BASE_URL } from "@/lib/upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "application/pdf"]);
const ALLOWED_EXT  = new Set([".png", ".jpg", ".jpeg", ".pdf"]);
const FIELD_TO_DOCNAME: Record<string, string> = { aadhaarFile: "aadhaar", panFile: "pan", dlFile: "dl", selfieFile: "selfie" };

function slugify(s: string) {
    return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "").slice(0, 80) || "rider";
}
function extFromNameOrType(name?: string | null, mime?: string | null) {
    if (name) {
        const ext = path.extname(name).toLowerCase();
        if (ALLOWED_EXT.has(ext)) return ext;
    }
    if (mime === "image/jpeg") return ".jpg";
    if (mime === "image/png") return ".png";
    if (mime === "application/pdf") return ".pdf";
    return null;
}
async function ensureUnique(baseDir: string, baseName: string, ext: string) {
    let i = 0;
    while (true) {
        const fname = i ? `${baseName}-${i}${ext}` : `${baseName}${ext}`;
        const full = path.join(baseDir, fname);
        try { await fs.access(full); i++; } catch { return full; }
    }
}

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();
        const riderName = String(form.get("riderName") || "").trim();
        if (!riderName) return NextResponse.json({ ok: false, error: "Missing riderName" }, { status: 400 });

        const slug = slugify(riderName);
        const entries = (["aadhaarFile","panFile","dlFile","selfieFile"] as const)
            .map((f) => ({ field: f, file: form.get(f) as File | null }))
            .filter((x) => x.file instanceof File);

        if (entries.length === 0)
            return NextResponse.json({ ok: false, error: "No files provided" }, { status: 400 });

        const targetDir = path.join(UPLOAD_BASE_DIR, "images", "riders", slug);
        await ensureDir(targetDir);

        const out: Record<string, string> = {};
        for (const { field, file } of entries) {
            const mime = file!.type || null;
            if (mime && !ALLOWED_MIME.has(mime))
                return NextResponse.json({ ok: false, error: `Unsupported type for ${field}: ${mime}` }, { status: 415 });

            const ext = extFromNameOrType((file as any).name, mime);
            if (!ext) return NextResponse.json({ ok: false, error: `Unsupported extension for ${field}` }, { status: 415 });

            const baseName = FIELD_TO_DOCNAME[field] || "doc";
            const full = await ensureUnique(targetDir, baseName, ext);
            await fs.writeFile(full, Buffer.from(await file!.arrayBuffer()));

            const filename = path.basename(full);
            out[field] = `${PUBLIC_UPLOAD_BASE_URL}/images/riders/${slug}/${filename}`;
        }

        return NextResponse.json({ ok: true, data: out });
    } catch (err) {
        console.error("riders/upload error:", err);
        return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
    }
}
