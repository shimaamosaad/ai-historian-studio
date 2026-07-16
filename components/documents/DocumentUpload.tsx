"use client";

import { useRef, useState } from "react";

type Props = { projectId: number; onUploaded: () => void };
type ProcessingDocument = { id: number; processingStatus: string; processedPages: number; totalPages: number; processingError?: string | null };

export default function DocumentUpload({ projectId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function processDocument(document: ProcessingDocument) {
    let current = document;
    while (current.processingStatus !== "COMPLETED") {
      const response = await fetch(`/api/documents/${current.id}/process`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Processing failed");
      current = data;
      setMessage(current.processingStatus === "COMPLETED" ? "✅ اكتمل تحليل المستند" : `جارٍ تحليل الصفحات: ${current.processedPages} من ${current.totalPages}`);
    }
  }

  async function upload() {
    if (!file) return;
    setUploading(true); setMessage("جارٍ رفع المستند...");
    try {
      const formData = new FormData(); formData.append("file", file); formData.append("projectId", String(projectId));
      const response = await fetch("/api/documents/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      setMessage("تم الرفع. جارٍ تحليل المستند...");
      await processDocument(data.document);
      setFile(null); if (inputRef.current) inputRef.current.value = "";
      onUploaded();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ أثناء الرفع");
    } finally { setUploading(false); }
  }

  return <div className="rounded-xl border bg-white p-6 shadow-sm" dir="rtl">
    <h2 className="mb-4 text-xl font-bold">رفع مستند PDF</h2>
    <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="mb-4 block w-full rounded border border-gray-300 bg-white p-2 text-black" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
    {file && <p className="mb-4 text-sm text-gray-600">{file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
    <button onClick={upload} disabled={!file || uploading} className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50">{uploading ? "جارٍ المعالجة..." : "رفع وتحليل"}</button>
    {message && <p className="mt-4 text-sm" aria-live="polite">{message}</p>}
  </div>;
}
