"use client";

import {
  ChangeEvent,
  DragEvent,
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

const MAX_FILE_SIZE =
  50 * 1024 * 1024;

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} بايت`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} كيلوبايت`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(2)} ميجابايت`;
}

function isSupportedFile(file: File) {
  const name = file.name.toLowerCase();

  return (
    file.type === "application/pdf" ||
    name.endsWith(".pdf") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  );
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

  const [dragging, setDragging] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<
      "info" | "success" | "error"
    >("info");

  const [progress, setProgress] =
    useState(0);

  function clearSelection() {
    if (uploading) {
      return;
    }

    setFile(null);
    setMessage("");
    setProgress(0);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function selectFile(
    selectedFile: File | null
  ) {
    if (!selectedFile) {
      return;
    }

    if (!isSupportedFile(selectedFile)) {
      setFile(null);
      setProgress(0);
      setMessageType("error");
      setMessage(
        "يمكن رفع ملفات PDF أو Word (.docx)."
      );

      return;
    }

    if (
      selectedFile.size >
      MAX_FILE_SIZE
    ) {
      setFile(null);
      setProgress(0);
      setMessageType("error");
      setMessage(
        "حجم الملف أكبر من الحد المسموح وهو 50 ميجابايت."
      );

      return;
    }

    setFile(selectedFile);
    setProgress(0);
    setMessage("");
    setMessageType("info");
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    selectFile(
      event.target.files?.[0] ??
        null
    );
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    if (!uploading) {
      setDragging(true);
    }
  }

  function handleDragLeave(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    setDragging(false);
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    setDragging(false);

    if (uploading) {
      return;
    }

    selectFile(
      event.dataTransfer.files?.[0] ??
        null
    );
  }

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
          cache: "no-store",
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
        setMessageType("success");
        setMessage(
          "اكتمل رفع المستند وتحليله بنجاح."
        );

        break;
      }

      setMessageType("info");

      setMessage(
        totalPages > 0
          ? `جارٍ تحليل الصفحات: ${processedPages} من ${totalPages}`
          : "جارٍ تجهيز المستند للتحليل..."
      );

      await wait(500);
    }
  }

  async function upload() {
    if (!file || uploading) {
      return;
    }

    setUploading(true);
    setProgress(0);
    setMessageType("info");
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

      setMessageType("info");
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

      setMessageType("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء رفع أو تحليل المستند"
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <section dir="rtl">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        disabled={uploading}
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        role="button"
        tabIndex={uploading ? -1 : 0}
        onClick={() => {
          if (!uploading) {
            inputRef.current?.click();
          }
        }}
        onKeyDown={(event) => {
          if (
            !uploading &&
            (event.key === "Enter" ||
              event.key === " ")
          ) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex min-h-[105px] cursor-pointer items-center justify-between gap-4 rounded-xl border border-dashed px-4 py-4 transition sm:px-5 ${
          dragging
            ? "border-amber-400 bg-amber-400/[0.08]"
            : "border-white/10 bg-white/[0.025] hover:border-amber-400/35 hover:bg-amber-400/[0.03]"
        } ${
          uploading
            ? "cursor-not-allowed opacity-70"
            : ""
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/[0.06] text-xl text-amber-300">
            ↑
          </div>

          <div className="min-w-0 text-right">
            <p className="truncate font-bold text-white">
              {file
                ? file.name
                : "اسحب الملف هنا أو اضغط للاختيار"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {file
                ? `${formatFileSize(file.size)} • ${
                    file.name
                      .toLowerCase()
                      .endsWith(".docx")
                      ? "Word"
                      : "PDF"
                  }`
                : "PDF أو Word • حد أقصى 50 ميجابايت"}
            </p>
          </div>
        </div>

        {!file && (
          <span className="hidden shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-300 sm:inline-flex">
            اختر ملفًا
          </span>
        )}
      </div>

      {file && !uploading && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={clearSelection}
            className="rounded-lg border border-red-400/15 bg-red-400/[0.06] px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/10"
          >
            إزالة الملف
          </button>

          <button
            type="button"
            onClick={upload}
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-300"
          >
            رفع وبدء التحليل
          </button>
        </div>
      )}

      {uploading && (
        <div className="mt-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.035] p-3">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-300">
              {message || "جارٍ رفع وتحليل المستند..."}
            </span>

            <span className="font-black text-amber-300">
              {progress}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-l from-amber-400 to-orange-500 transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      )}

      {message && !uploading && (
        <div
          aria-live="polite"
          className={`mt-3 rounded-xl border px-3 py-2 text-xs font-semibold leading-6 ${
            messageType === "success"
              ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"
              : messageType === "error"
                ? "border-red-400/20 bg-red-400/[0.06] text-red-300"
                : "border-sky-400/20 bg-sky-400/[0.06] text-sky-300"
          }`}
        >
          {message}
        </div>
      )}
    </section>
  );
}