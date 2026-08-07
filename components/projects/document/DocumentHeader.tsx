import {
  CheckCircle2,
  FileText,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";

type Props = {
  documentName: string;
  documentType: string;
  uploadDate: string;
  displayedPages: number | null;
  processingStatus?: string | null;
};

function getStatusInfo(
  processingStatus?: string | null
) {
  switch (processingStatus) {
    case "QUEUED":
    case "PENDING":
      return {
        label: "في انتظار التحليل",
        icon: (
          <LoaderCircle className="h-4 w-4" />
        ),
        className:
          "border-slate-400/15 bg-slate-400/[0.06] text-slate-300",
      };

    case "PROCESSING":
      return {
        label: "جاري التحليل",
        icon: (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ),
        className:
          "border-amber-400/15 bg-amber-400/[0.06] text-amber-300",
      };

    case "FAILED":
    case "ERROR":
      return {
        label: "فشل التحليل",
        icon: (
          <TriangleAlert className="h-4 w-4" />
        ),
        className:
          "border-red-400/15 bg-red-400/[0.06] text-red-300",
      };

    case "COMPLETED":
      return {
        label: "اكتمل التحليل",
        icon: (
          <CheckCircle2 className="h-4 w-4" />
        ),
        className:
          "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300",
      };

    default:
      return {
        label: "جاهز",
        icon: (
          <FileText className="h-4 w-4" />
        ),
        className:
          "border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300",
      };
  }
}

export default function DocumentHeader({
  documentName,
  documentType,
  uploadDate,
  displayedPages,
  processingStatus,
}: Props) {
  const status =
    getStatusInfo(
      processingStatus
    );

  return (
    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-300/10 bg-amber-300/[0.05] text-amber-300">
          <FileText className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h3 className="break-words font-bold text-slate-100 sm:text-lg">
            {documentName}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>
              {documentType}
            </span>

            <span className="text-slate-700">
              •
            </span>

            <span>
              {uploadDate}
            </span>

            {displayedPages !==
              null && (
              <>
                <span className="text-slate-700">
                  •
                </span>

                <span>
                  {
                    displayedPages
                  }{" "}
                  صفحة
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className={`flex w-fit shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.className}`}
      >
        {status.icon}

        <span>
          {status.label}
        </span>
      </div>
    </div>
  );
}