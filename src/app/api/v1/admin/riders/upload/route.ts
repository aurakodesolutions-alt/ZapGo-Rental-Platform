import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Force Node runtime (fs required)
export const runtime = "nodejs";
// Always run on server
export const dynamic = "force-dynamic";

// Allowed file types
const ALLOWED_MIME = new Set([
    "image/png",
    "image/jpeg",
    "application/pdf",
]);
const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".pdf"]);

// Map input field -> document base filename
const FIELD_TO_DOCNAME: Record<string, string> = {
    aadhaarFile: "aadhaar",
    panFile: "pan",
    dlFile: "dl",
};

function slugify(input: string) {
    return input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 80) || "rider";
}

function extFromNameOrType(name?: string | null, mime?: string | null) {
    // 1) try name
    if (name) {
        const ext = path.extname(name).toLowerCase();
        if (ALLOWED_EXT.has(ext)) return ext;
    }
    // 2) fallback from MIME
    if (mime === "image/jpeg") return ".jpg";
    if (mime === "image/png") return ".png";
    if (mime === "application/pdf") return ".pdf";
    // default reject
    return null;
}

async function ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true });
}

async function uniquePath(baseDir: string, baseName: string, ext: string) {
    let attempt = 0;
    while (true) {
        const fname = attempt === 0 ? `${baseName}${ext}` : `${baseName}-${attempt}${ext}`;
        const full = path.join(baseDir, fname);
        try {
            await fs.access(full);
            // exists -> iterate
            attempt++;
            continue;
        } catch {
            return full;
        }
    }
}

export async function POST(req: NextRequest) {
    try {
        const form = await req.formData();

        const riderName = String(form.get("riderName") || "").trim();
        if (!riderName) {
            return NextResponse.json(
                { ok: false, error: "Missing riderName" },
                { status: 400 }
            );
        }

        const slug = slugify(riderName);

        // Pick out the three optional files
        const entries: Array<{ field: string; file: File | null }> = [
            { field: "aadhaarFile", file: form.get("aadhaarFile") as File | null },
            { field: "panFile", file: form.get("panFile") as File | null },
            { field: "dlFile", file: form.get("dlFile") as File | null },
        ].filter((e) => e.file instanceof File);

        if (entries.length === 0) {
            return NextResponse.json(
                { ok: false, error: "No files provided. Use fields: aadhaarFile | panFile | dlFile." },
                { status: 400 }
            );
        }

        const publicRoot = path.join(process.cwd(), "public");
        const targetDir = path.join(publicRoot, "images", "riders", slug);
        await ensureDir(targetDir);

        const out: Record<string, string> = {};

        for (const { field, file } of entries) {
            if (!file) continue;

            const docName = FIELD_TO_DOCNAME[field] || "doc";
            const mime = file.type || null;
            if (mime && !ALLOWED_MIME.has(mime)) {
                return NextResponse.json(
                    { ok: false, error: `Unsupported file type for ${field}: ${mime}` },
                    { status: 415 }
                );
            }

            const ext = extFromNameOrType((file as any).name, mime);
            if (!ext || !ALLOWED_EXT.has(ext)) {
                return NextResponse.json(
                    { ok: false, error: `Unsupported file extension for ${field}.` },
                    { status: 415 }
                );
            }

            const fullPath = await uniquePath(targetDir, docName, ext);
            const buf = Buffer.from(await file.arrayBuffer());
            await fs.writeFile(fullPath, buf);

            // make public URL
            const publicUrl = fullPath
                .replace(publicRoot, "")
                .replace(/\\/g, "/"); // windows fix

            out[field] = publicUrl; // e.g. /images/riders/aman-sharma/aadhaar.pdf
        }

        return NextResponse.json({ ok: true, data: out });
    } catch (err: any) {
        console.error("Rider upload error:", err);
        return NextResponse.json(
            { ok: false, error: "Failed to upload files" },
            { status: 500 }
        );
    }
}
