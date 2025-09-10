import path from "path";
import { promises as fs } from "fs";

export const UPLOAD_BASE_DIR =
    process.env.UPLOAD_BASE_DIR || path.join(process.cwd(), ".uploads");

export const PUBLIC_UPLOAD_BASE_URL =
    process.env.UPLOAD_BASE_URL || "/uploads";

// ensure a directory exists
export async function ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true });
}

export function mimeFromExt(ext: string) {
    ext = ext.toLowerCase();
    if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
    if (ext === ".png") return "image/png";
    if (ext === ".pdf") return "application/pdf";
    return "application/octet-stream";
}
