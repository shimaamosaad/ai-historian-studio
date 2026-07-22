"use client";

import {
  useRef,
  useState,
} from "react";

type Props = {
  projectId: number;
  onUploaded: () => void;
};

type ProcessingDocument = {
  id: number;
  processingStatus:
    | "QUEUED"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED"
    | string;
  processedPages: number;
  totalPages: number;
  processingError?: string | null;
};

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export default function DocumentUpload({
  projectId,
  onUploaded,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [file, setFile] =
    useState<File | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [progress, setProgress] =
    useState(0);

  async function processDocument(
    document: ProcessingDocument
  ) {
    let current = document;

    while (
      current.processingStatus !==
      "COMPLETED"
    ) {
      if (
        current.processingStatus ===
        "FAILED"
      ) {
        throw new Error(
          current.processingError ||
            "فشلت معالجة المستند"
        );
      }

      const response = await fetch(
        `/api/documents/${current.id}/process`,
        {
          method: "POST",
        }
      );

      const data =
        (await response.json()) as ProcessingDocument & {
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.processingError ||
            "حدث خطأ أثناء معالجة المستند"
        );
      }

      current = data;

      const processedPages =
        current.processedPages ?? 0;

      const totalPages =
        current.totalPages ?? 0;

      const percentage =
        totalPages > 0
          ? Math.min(
              100,
              Math.round(
                (processedPages /
                  totalPages) *
                  100
              )
            )
          : 0;

      setProgress(percentage);

      if (
        current.processingStatus ===
        "COMPLETED"
      ) {
        setProgress(100);

        setMessage(
          "✅ اكتمل تحليل المستند"
        );

        break;
      }

      setMessage(
        totalPages > 0
          ? `جارٍ تحليل الصفحات: ${processedPages} من ${totalPages} — ${percentage}%`
          : "جارٍ تجهيز المستند للتحليل..."
      );

      /*
       * فاصل صغير بين دفعات المعالجة
       * لتقليل الضغط على السيرفر.
       */
      await wait(500);
    }
  }

  async function upload() {
    if (!file || uploading) {
      return;
    }

    setUploading(true);
    setProgress(0);
    setMessage(
      "جارٍ رفع المستند..."
    );

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      formData.append(
        "projectId",
        String(projectId)
      );

      const response = await fetch(
        "/api/documents/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "حدث خطأ أثناء رفع المستند"
        );
      }

      setMessage(
        "تم رفع المستند. جارٍ بدء التحليل..."
      );

      await processDocument(
        data.document
      );

      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      onUploaded();
    } catch (error) {
      console.error(
        "DOCUMENT UPLOAD ERROR:",
        error
      );

      setMessage(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ حدث خطأ أثناء رفع أو تحليل المستند"
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="rounded-xl border bg-white p-6 shadow-sm"
      dir="rtl"
    >
      <h2 className="mb-4 text-xl font-bold text-slate-900">
        رفع مستند PDF
      </h2>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        disabled={uploading}
        className="mb-4 block w-full rounded border border-gray-300 bg-white p-2 text-black disabled:cursor-not-allowed disabled:opacity-60"
        onChange={(event) => {
          setFile(
            event.target.files?.[0] ??
              null
          );

          setMessage("");
          setProgress(0);
        }}
      />

      {file && (
        <p className="mb-4 text-sm text-gray-600">
          {file.name} —{" "}
          {(
            file.size /
            1024 /
            1024
          ).toFixed(2)}{" "}
          MB
        </p>
      )}

      <button
        type="button"
        onClick={upload}
        disabled={!file || uploading}
        className="rounded bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading
          ? "جارٍ المعالجة..."
          : "رفع وتحليل"}
      </button>

      {uploading &&
        progress > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
              <span>
                تقدم المعالجة
              </span>

              <span>
                {progress}%
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        )}

      {message && (
        <p
          className="mt-4 text-sm text-slate-700"
          aria-live="polite"
        >
          {message}
        </p>
      )}

      {uploading && (
        <p className="mt-2 text-xs leading-6 text-slate-500">
          اتركي الصفحة والسيرفر
          مفتوحين حتى انتهاء تحليل
          جميع الصفحات.
        </p>
      )}
    </div>
  );
}