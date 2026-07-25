"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowDownAZ,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import DeleteDocumentButton from "@/components/documents/DeleteDocumentButton";
import DocumentQuestion from "@/components/documents/DocumentQuestion";

type DocumentItem = {
  id: number;
  name?: string | null;
  fileName?: string | null;
  type?: string | null;
  url?: string | null;
  createdAt?: string | null;
  processingStatus?: string | null;
  processedPages?: number | null;
  totalPages?: number | null;
  processingError?: string | null;
};

type Props = {
  documents: DocumentItem[];
};

type ProcessingStatus = {
  label: string;
  className: string;
};

type StatusFilter =
  | "ALL"
  | "COMPLETED"
  | "PROCESSING"
  | "FAILED";

type SortOption =
  | "NEWEST"
  | "OLDEST"
  | "NAME_ASC"
  | "NAME_DESC";

function getDocumentName(document: DocumentItem) {
  return (
    document.name ||
    document.fileName ||
    `مستند رقم ${document.id}`
  );
}

function getProcessingLabel(
  status?: string | null
): ProcessingStatus {
  switch (status) {
    case "QUEUED":
    case "PENDING":
      return {
        label: "في انتظار التحليل",
        className:
          "border-slate-400/20 bg-slate-400/10 text-slate-300",
      };

    case "PROCESSING":
      return {
        label: "جاري التحليل",
        className:
          "border-amber-400/20 bg-amber-400/10 text-amber-300",
      };

    case "FAILED":
    case "ERROR":
      return {
        label: "فشل التحليل",
        className:
          "border-red-400/20 bg-red-400/10 text-red-300",
      };

    case "COMPLETED":
      return {
        label: "مكتمل",
        className:
          "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      };

    default:
      return {
        label: "جاهز",
        className:
          "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
      };
  }
}

function calculateProgress(document: DocumentItem) {
  const processedPages =
    document.processedPages ?? 0;

  const totalPages =
    document.totalPages ?? 0;

  if (
    document.processingStatus ===
    "COMPLETED"
  ) {
    return 100;
  }

  if (totalPages <= 0) {
    return document.processingStatus ===
      "PROCESSING"
      ? 5
      : 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (processedPages / totalPages) *
          100
      )
    )
  );
}

function isActiveStatus(
  status?: string | null
) {
  return (
    status === "QUEUED" ||
    status === "PENDING" ||
    status === "PROCESSING"
  );
}

function matchesStatusFilter(
  document: DocumentItem,
  filter: StatusFilter
) {
  if (filter === "ALL") {
    return true;
  }

  if (filter === "COMPLETED") {
    return (
      document.processingStatus ===
        "COMPLETED" ||
      !document.processingStatus
    );
  }

  if (filter === "PROCESSING") {
    return isActiveStatus(
      document.processingStatus
    );
  }

  if (filter === "FAILED") {
    return (
      document.processingStatus ===
        "FAILED" ||
      document.processingStatus ===
        "ERROR"
    );
  }

  return true;
}

function getDocumentTimestamp(
  document: DocumentItem
) {
  if (!document.createdAt) {
    return 0;
  }

  const timestamp = new Date(
    document.createdAt
  ).getTime();

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
}

export default function ProjectDocumentsList({
  documents: initialDocuments,
}: Props) {
  const [documents, setDocuments] =
    useState<DocumentItem[]>(
      initialDocuments
    );

  const [searchQuery, setSearchQuery] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [sortOption, setSortOption] =
    useState<SortOption>("NEWEST");

  const processingIds =
    useRef<Set<number>>(new Set());

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  const visibleDocuments = useMemo(
    () => {
      const normalizedSearch =
        searchQuery
          .trim()
          .toLocaleLowerCase("ar");

      const filteredDocuments =
        documents.filter((document) => {
          const documentName =
            getDocumentName(document);

          const documentType =
            document.type || "";

          const matchesSearch =
            normalizedSearch.length === 0 ||
            documentName
              .toLocaleLowerCase("ar")
              .includes(normalizedSearch) ||
            documentType
              .toLocaleLowerCase("ar")
              .includes(normalizedSearch);

          const matchesStatus =
            matchesStatusFilter(
              document,
              statusFilter
            );

          return (
            matchesSearch &&
            matchesStatus
          );
        });

      return [...filteredDocuments].sort(
        (firstDocument, secondDocument) => {
          if (sortOption === "NEWEST") {
            return (
              getDocumentTimestamp(
                secondDocument
              ) -
              getDocumentTimestamp(
                firstDocument
              )
            );
          }

          if (sortOption === "OLDEST") {
            return (
              getDocumentTimestamp(
                firstDocument
              ) -
              getDocumentTimestamp(
                secondDocument
              )
            );
          }

          const firstName =
            getDocumentName(firstDocument);

          const secondName =
            getDocumentName(secondDocument);

          if (
            sortOption === "NAME_ASC"
          ) {
            return firstName.localeCompare(
              secondName,
              "ar"
            );
          }

          return secondName.localeCompare(
            firstName,
            "ar"
          );
        }
      );
    },
    [
      documents,
      searchQuery,
      sortOption,
      statusFilter,
    ]
  );

  function updateDocument(
    updatedDocument: DocumentItem
  ) {
    setDocuments(
      (currentDocuments) =>
        currentDocuments.map(
          (document) =>
            document.id ===
            updatedDocument.id
              ? {
                  ...document,
                  ...updatedDocument,
                }
              : document
        )
    );
  }

  async function processDocument(
    documentId: number
  ) {
    if (
      processingIds.current.has(
        documentId
      )
    ) {
      return;
    }

    processingIds.current.add(
      documentId
    );

    try {
      const response = await fetch(
        `/api/documents/${documentId}/process`,
        {
          method: "POST",
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "تعذر استكمال تحليل المستند"
        );
      }

      updateDocument(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء معالجة المستند";

      setDocuments(
        (currentDocuments) =>
          currentDocuments.map(
            (document) =>
              document.id === documentId
                ? {
                    ...document,
                    processingStatus:
                      "FAILED",
                    processingError:
                      message,
                  }
                : document
          )
      );
    } finally {
      processingIds.current.delete(
        documentId
      );
    }
  }

  useEffect(() => {
    const activeDocuments =
      documents.filter((document) =>
        isActiveStatus(
          document.processingStatus
        )
      );

    if (
      activeDocuments.length === 0
    ) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        activeDocuments.forEach(
          (document) => {
            void processDocument(
              document.id
            );
          }
        );
      }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [documents]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "ALL" ||
    sortOption !== "NEWEST";

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("ALL");
    setSortOption("NEWEST");
  }

  return (
    <section
      id="documents"
      className="mt-6 scroll-mt-6 overflow-hidden rounded-3xl border border-white/10 bg-[#081526] shadow-2xl shadow-black/20"
      dir="rtl"
    >
      <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-300">
            إدارة المصادر
          </p>

          <h2 className="mt-1 text-2xl font-black text-white">
            المستندات
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            ابحث في المصادر التاريخية
            وراجع حالة المعالجة والنتائج.
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-400">
          <FileText className="h-4 w-4 text-amber-300" />

          <span>
            {documents.length} مستند
          </span>
        </div>
      </div>

      {documents.length > 0 && (
        <div className="border-b border-white/10 bg-black/10 p-5 md:p-6">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_200px]">
            <label className="relative block">
              <span className="sr-only">
                البحث عن مستند
              </span>

              <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(
                    event.target.value
                  );
                }}
                placeholder="ابحث باسم المستند..."
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] pr-12 pl-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-400/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-amber-400/5"
              />
            </label>

            <label className="relative block">
              <span className="sr-only">
                فلترة المستندات
              </span>

              <SlidersHorizontal className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target
                      .value as StatusFilter
                  );
                }}
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#0b1a2c] pr-11 pl-4 text-sm text-slate-200 outline-none transition focus:border-amber-400/40 focus:ring-4 focus:ring-amber-400/5"
              >
                <option value="ALL">
                  جميع الحالات
                </option>

                <option value="COMPLETED">
                  مكتمل
                </option>

                <option value="PROCESSING">
                  جاري التحليل
                </option>

                <option value="FAILED">
                  فشل التحليل
                </option>
              </select>
            </label>

            <label className="relative block">
              <span className="sr-only">
                ترتيب المستندات
              </span>

              <ArrowDownAZ className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <select
                value={sortOption}
                onChange={(event) => {
                  setSortOption(
                    event.target
                      .value as SortOption
                  );
                }}
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#0b1a2c] pr-11 pl-4 text-sm text-slate-200 outline-none transition focus:border-amber-400/40 focus:ring-4 focus:ring-amber-400/5"
              >
                <option value="NEWEST">
                  الأحدث أولًا
                </option>

                <option value="OLDEST">
                  الأقدم أولًا
                </option>

                <option value="NAME_ASC">
                  الاسم: أ – ي
                </option>

                <option value="NAME_DESC">
                  الاسم: ي – أ
                </option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              يتم عرض{" "}
              <span className="font-bold text-slate-300">
                {visibleDocuments.length}
              </span>{" "}
              من أصل{" "}
              <span className="font-bold text-slate-300">
                {documents.length}
              </span>{" "}
              مستند
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-amber-400/20 hover:bg-amber-400/10 hover:text-amber-300"
              >
                مسح البحث والفلاتر
              </button>
            )}
          </div>
        </div>
      )}

      <div className="p-5 md:p-6">
        {documents.length > 0 ? (
          visibleDocuments.length > 0 ? (
            <div className="space-y-4">
              {visibleDocuments.map(
                (doc) => {
                  const documentName =
                    getDocumentName(doc);

                  const documentType =
                    doc.type?.toUpperCase() ||
                    documentName
                      .split(".")
                      .pop()
                      ?.toUpperCase() ||
                    "FILE";

                  const uploadDate =
                    doc.createdAt
                      ? new Intl.DateTimeFormat(
                          "ar-EG",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        ).format(
                          new Date(
                            doc.createdAt
                          )
                        )
                      : "غير متوفر";

                  const processedPages =
                    doc.processedPages ??
                    0;

                  const totalPages =
                    doc.totalPages ?? 0;

                  const displayedPages =
                    totalPages ||
                    processedPages ||
                    null;

                  const status =
                    getProcessingLabel(
                      doc.processingStatus
                    );

                  const progress =
                    calculateProgress(doc);

                  const isProcessing =
                    isActiveStatus(
                      doc.processingStatus
                    );

                  const isCompleted =
                    doc.processingStatus ===
                      "COMPLETED" ||
                    !doc.processingStatus;

                  const hasFailed =
                    doc.processingStatus ===
                      "FAILED" ||
                    doc.processingStatus ===
                      "ERROR";

                  return (
                    <article
                      key={doc.id}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0b1a2c] transition duration-300 hover:-translate-y-0.5 hover:border-amber-400/25 hover:shadow-xl hover:shadow-black/20"
                    >
                      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10 text-red-300 transition group-hover:scale-105">
                            <FileText className="h-6 w-6" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="break-words text-lg font-bold text-white">
                              {documentName}
                            </h3>

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
                                {documentType}
                              </span>

                              <span>
                                {uploadDate}
                              </span>

                              <span>
                                {displayedPages !==
                                null
                                  ? `${displayedPages} صفحة`
                                  : "جارٍ حساب عدد الصفحات"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`w-fit rounded-full border px-3 py-1.5 text-sm font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      {(isProcessing ||
                        hasFailed ||
                        doc.processingStatus ===
                          "COMPLETED") && (
                        <div className="border-t border-white/10 px-5 py-5">
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-200">
                                تقدم معالجة
                                المستند
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {totalPages > 0
                                  ? `${processedPages} من ${totalPages} صفحة`
                                  : isProcessing
                                    ? "جارٍ تجهيز صفحات المستند"
                                    : "لم يتم تحديد عدد الصفحات"}
                              </p>
                            </div>

                            <span
                              className={`text-sm font-bold ${
                                hasFailed
                                  ? "text-red-300"
                                  : progress ===
                                      100
                                    ? "text-emerald-300"
                                    : "text-amber-300"
                              }`}
                            >
                              {progress}%
                            </span>
                          </div>

                          <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-black/30">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                hasFailed
                                  ? "bg-red-500"
                                  : progress ===
                                      100
                                    ? "bg-emerald-500"
                                    : "bg-gradient-to-l from-amber-400 to-yellow-600"
                              }`}
                              style={{
                                width: `${Math.max(
                                  progress,
                                  isProcessing
                                    ? 3
                                    : 0
                                )}%`,
                              }}
                            />
                          </div>

                          {progress === 100 &&
                            !hasFailed && (
                              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-300">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15">
                                  ✓
                                </span>

                                اكتمل تحليل
                                المستند وأصبح
                                جاهزًا للبحث.
                              </div>
                            )}

                          {isProcessing && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-amber-300">
                              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />

                              يمكنك مغادرة
                              الصفحة والعودة
                              لاحقًا، وسيُحفظ
                              التقدم بعد كل
                              دفعة.
                            </div>
                          )}

                          {hasFailed && (
                            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4">
                              <p className="text-sm font-semibold text-red-300">
                                تعذر استكمال
                                التحليل
                              </p>

                              <p className="mt-2 break-words text-xs leading-6 text-red-200/70">
                                {doc.processingError ||
                                  "حدث خطأ غير معروف أثناء معالجة المستند."}
                              </p>

                              <button
                                type="button"
                                onClick={() => {
                                  setDocuments(
                                    (
                                      currentDocuments
                                    ) =>
                                      currentDocuments.map(
                                        (
                                          document
                                        ) =>
                                          document.id ===
                                          doc.id
                                            ? {
                                                ...document,
                                                processingStatus:
                                                  "PROCESSING",
                                                processingError:
                                                  null,
                                              }
                                            : document
                                      )
                                  );

                                  void processDocument(
                                    doc.id
                                  );
                                }}
                                className="mt-3 rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-400/20"
                              >
                                إعادة المحاولة
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 border-t border-white/10 px-5 py-4">
                        {doc.url && (
                          <>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15"
                            >
                              <ExternalLink className="h-4 w-4" />
                              فتح الملف
                            </a>

                            <a
                              href={doc.url}
                              download={
                                documentName
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                            >
                              <Download className="h-4 w-4" />
                              تنزيل
                            </a>
                          </>
                        )}

                        <DeleteDocumentButton
                          documentId={doc.id}
                          documentName={
                            documentName
                          }
                        />
                      </div>

                      {isCompleted ? (
                        <div className="border-t border-white/10 bg-black/10 p-5">
                          <DocumentQuestion
                            documentId={
                              doc.id
                            }
                          />
                        </div>
                      ) : (
                        <div className="border-t border-white/10 bg-black/10 p-5">
                          <p className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-sm text-slate-500">
                            البحث داخل
                            المستند سيصبح
                            متاحًا بعد اكتمال
                            التحليل.
                          </p>
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-400/20 bg-white/[0.02] p-10 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-400/20 bg-slate-400/10 text-slate-400">
                <Search className="h-9 w-9" />
              </div>

              <h3 className="mt-4 text-xl font-bold text-white">
                لا توجد نتائج مطابقة
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-400">
                غيّر كلمة البحث أو اختر
                حالة مختلفة للمستندات.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
              >
                عرض جميع المستندات
              </button>
            </div>
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-amber-400/20 bg-amber-400/[0.03] p-10 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
              <FolderOpen className="h-10 w-10" />
            </div>

            <h3 className="mt-4 text-xl font-bold text-white">
              لا توجد مستندات حتى الآن
            </h3>

            <p className="mt-2 text-sm leading-7 text-slate-400">
              ارفع أول مستند تاريخي لبدء
              استخراج النصوص والكيانات.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}