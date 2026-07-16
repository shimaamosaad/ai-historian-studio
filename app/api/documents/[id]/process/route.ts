import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { createWorker, PSM } from "tesseract.js";
import sharp from "sharp";
import { pdf } from "pdf-to-img";
import { extractText, getDocumentProxy } from "unpdf";
import { prisma } from "@/lib/prisma";
import { analyzeDocument } from "@/lib/ai/analyzeDocument";
import { saveEntities } from "@/lib/ai/saveEntities";

export const runtime = "nodejs";
export const maxDuration = 300;
const PAGES_PER_REQUEST = 2;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await prisma.document.findUnique({ where: { id: Number(id) } });
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (document.processingStatus === "COMPLETED") return NextResponse.json(document);

  try {
    const filePath = path.join(process.cwd(), "public", document.url.replace(/^\//, ""));
    const buffer = await fs.readFile(filePath);
    const pdfProxy = await getDocumentProxy(new Uint8Array(buffer));
    const extracted = await extractText(pdfProxy, { mergePages: true });
    const totalPages = extracted.totalPages;

    if (extracted.text.trim()) {
      const ai = await analyzeDocument(extracted.text);
      await saveEntities(document.projectId, ai);
      await prisma.project.update({ where: { id: document.projectId }, data: { summary: ai.summary } });
      const completed = await prisma.document.update({ where: { id: document.id }, data: { content: extracted.text, summary: ai.summary, entities: JSON.stringify(ai), processingStatus: "COMPLETED", processedPages: totalPages, totalPages, processingError: null } });
      return NextResponse.json(completed);
    }

    const start = document.processedPages;
    const end = Math.min(start + PAGES_PER_REQUEST, totalPages);
    const rendered = await pdf(buffer, { scale: 2 });
    const worker = await createWorker("ara+eng", undefined, { workerPath: "./node_modules/tesseract.js/src/worker-script/node/index.js" });
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
    });
    let batchText = "";
    for (let page = start + 1; page <= end; page++) {
      const image = await rendered.getPage(page);
      const prepared = await sharp(image)
        .rotate()
        .grayscale()
        .resize({ width: 2400, withoutEnlargement: true })
        .median(1)
        .normalize()
        .linear(1.25, -20)
        .sharpen({ sigma: 1.2 })
        .threshold(175)
        .png()
        .toBuffer();
      batchText += `\n${(await worker.recognize(prepared)).data.text}`;
    }
    await worker.terminate();
    await rendered.destroy();
    const content = `${document.content}\n${batchText}`.trim();
    if (end < totalPages) {
      return NextResponse.json(await prisma.document.update({ where: { id: document.id }, data: { content, processingStatus: "PROCESSING", processedPages: end, totalPages, processingError: null } }));
    }
    const ai = await analyzeDocument(content);
    await saveEntities(document.projectId, ai);
    await prisma.project.update({ where: { id: document.projectId }, data: { summary: ai.summary } });
    return NextResponse.json(await prisma.document.update({ where: { id: document.id }, data: { content, summary: ai.summary, entities: JSON.stringify(ai), processingStatus: "COMPLETED", processedPages: totalPages, totalPages, processingError: null } }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Processing failed";
    await prisma.document.update({ where: { id: Number(id) }, data: { processingStatus: "FAILED", processingError: message } });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
