import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ ok: false, error: "No files uploaded" }, { status: 400 });
        }

        const savedUrls: string[] = [];

        for (const file of files) {
            const bytes = Buffer.from(await file.arrayBuffer());
            const uploadDir = path.join(process.cwd(), "public", "images", "vehicles");
            await fs.mkdir(uploadDir, { recursive: true });

            const filename = `${Date.now()}-${file.name}`;
            const filepath = path.join(uploadDir, filename);

            await fs.writeFile(filepath, bytes);

            // public URL
            savedUrls.push(`/images/vehicles/${filename}`);
        }

        return NextResponse.json({ ok: true, urls: savedUrls });
    } catch (err: any) {
        console.error("Upload error:", err);
        return NextResponse.json({ ok: false, error: "Failed to upload" }, { status: 500 });
    }
}
