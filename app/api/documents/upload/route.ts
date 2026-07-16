import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const projectId = Number(formData.get("projectId"));
    if (!file || typeof file === "string" || !Number.isInteger(projectId)) {
      return NextResponse.json({ error: "Invalid file or project" }, { status: 400 });
    }
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const safeName = `${Date.now()}-${file.name.replace(/[^\w.\-\u0600-\u06FF]+/gu, "-")}`;
    await fs.writeFile(path.join(uploadDir, safeName), Buffer.from(await file.arrayBuffer()));
    const document = await prisma.document.create({
      data: { name: file.name, url: `/uploads/${safeName}`, content: "", type: "pdf", projectId, processingStatus: "QUEUED" },
    });
    return NextResponse.json({ document }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 });
  }
}
