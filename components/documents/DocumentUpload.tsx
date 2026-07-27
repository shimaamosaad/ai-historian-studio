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
    <section
      className="overflow-hidden rounded-[28px] border border-white/10 bg-[#081525] shadow-xl shadow-black/20"
      dir="rtl"
    >
      <div className="border-b border-white/10 bg-white/[0.025] px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-amber-400">
              DOCUMENT UPLOAD
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              رفع مستند جديد
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-400">
              ارفع ملف PDF ليقوم أثر
              باستخراج النص وتحليل
              الشخصيات والأماكن
              والأحداث والعلاقات.
            </p>
          </div>

          <div className="w-fit rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-300">
            PDF حتى 50 ميجابايت
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7">
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
          className={`group relative flex min-h-[250px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed px-6 py-10 text-center transition ${
            dragging
              ? "border-amber-400 bg-amber-400/10"
              : "border-white/15 bg-white/[0.025] hover:border-amber-400/45 hover:bg-amber-400/[0.04]"
          } ${
            uploading
              ? "cursor-not-allowed opacity-70"
              : ""
          }`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08),transparent_58%)]" />

          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/10 text-4xl shadow-lg shadow-amber-950/20 transition group-hover:scale-105">
            ↑
          </div>

          <h3 className="relative mt-5 text-xl font-black text-white">
          اسحب ملف PDF أو Word هنا
          </h3>

          <p className="relative mt-2 text-sm leading-7 text-slate-400">
            أو اضغط لاختيار الملف
            من جهازك
          </p>

          <div className="relative mt-5 flex flex-wrap justify-center gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
              ملفات PDF
            </span>

            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
              حد أقصى 50 MB
            </span>

            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
              يدعم المستندات المصورة
            </span>
          </div>
        </div>

        {file && (
          <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 text-sm font-black text-red-300">
  {file.name.toLowerCase().endsWith(".docx") ? "DOCX" : "PDF"}
</div>

              <div className="min-w-0">
                <p className="truncate font-bold text-white">
                  {file.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {formatFileSize(
                    file.size
                  )}
                </p>
              </div>
            </div>

            {!uploading && (
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-400/20"
              >
                إزالة الملف
              </button>
            )}
          </div>
        )}

        {uploading && (
          <div className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
            <div className="mb-3 flex items-center justify-between gap-4 text-sm">
              <span className="font-bold text-slate-300">
                تقدم المعالجة
              </span>

              <span className="font-black text-amber-400">
                {progress}%
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-l from-amber-400 to-orange-500 transition-all duration-500"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        )}

        {message && (
          <div
            aria-live="polite"
            className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-bold leading-7 ${
              messageType === "success"
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                : messageType ===
                    "error"
                  ? "border-red-400/20 bg-red-400/10 text-red-300"
                  : "border-sky-400/20 bg-sky-400/10 text-sky-300"
            }`}
          >
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={upload}
          disabled={!file || uploading}
          className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-l from-amber-400 to-orange-500 px-6 py-4 text-base font-black text-slate-950 shadow-lg shadow-amber-950/20 transition hover:-translate-y-0.5 hover:shadow-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          {uploading
            ? "جارٍ رفع وتحليل المستند..."
            : file
              ? "رفع المستند وبدء التحليل"
              : "اختر ملف PDF أو Word أولًا"}
        </button>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <p className="font-bold text-slate-200">
              المستندات النصية
            </p>

            <p className="mt-1 text-xs leading-6 text-slate-500">
              عادةً يتم استخراج نصها
              وتحليلها بسرعة أكبر.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <p className="font-bold text-slate-200">
              المستندات المصورة
            </p>

            <p className="mt-1 text-xs leading-6 text-slate-500">
              تحتاج إلى OCR وقد يستغرق
              تحليلها وقتًا أطول بحسب
              عدد الصفحات وجودة الصور.
            </p>
          </div>
        </div>

        {uploading && (
          <p className="mt-4 text-center text-xs leading-6 text-slate-500">
            اترك الصفحة والسيرفر مفتوحين
            حتى انتهاء تحليل جميع الصفحات.
          </p>
        )}
      </div>
    </section>
  );
}