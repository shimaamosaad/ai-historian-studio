import ProjectDocuments from "@/components/documents/ProjectDocuments";
import Link from "next/link";
import ProjectHero from "@/components/projects/ProjectHero";
import ProjectStats from "@/components/projects/ProjectStats";
import ProjectDocumentsList from "@/components/projects/ProjectDocumentsList";
import ProjectQuestion from "@/components/projects/ProjectQuestion";
import AIResearchReport from "@/components/reports/AIResearchReport";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const projectId = Number(id);

  if (Number.isNaN(projectId)) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#06101d] px-6 text-white"
      >
        <div className="w-full max-w-lg rounded-3xl border border-amber-400/15 bg-[#0a1727] p-10 text-center">
          <h1 className="text-3xl font-black">
            رابط المشروع غير صحيح
          </h1>

          <Link
            href="/projects"
            className="mt-7 inline-flex rounded-xl bg-amber-500 px-6 py-3 font-bold text-slate-950"
          >
            العودة إلى مشاريعي
          </Link>
        </div>
      </main>
    );
  }

  const project =
    await prisma.project.findFirst({
      where: {
        id: projectId,
        userId:
          session.user.id,
      },

      include: {
        documents: {
          orderBy: {
            createdAt: "desc",
          },

          select: {
            id: true,
            name: true,
            url: true,
            type: true,
            processingStatus:
              true,
            processedPages:
              true,
            totalPages: true,
            processingError:
              true,
            createdAt: true,
            summary: true,
            entities: true,
          },
        },

        projectEntities: {
          include: {
            entity: true,
          },
        },
      },
    });

  if (!project) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#06101d] px-6 text-white"
      >
        <div className="w-full max-w-lg rounded-3xl border border-amber-400/15 bg-[#0a1727] p-10 text-center shadow-2xl shadow-black/30">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-3xl">
            📜
          </div>

          <h1 className="mt-6 text-3xl font-black">
            المشروع غير موجود
          </h1>

          <p className="mt-3 leading-7 text-slate-400">
            ربما تم حذف المشروع أو أن الرابط المستخدم غير صحيح.
          </p>

          <Link
            href="/projects"
            className="mt-7 inline-flex items-center justify-center rounded-xl bg-gradient-to-l from-amber-500 to-yellow-600 px-6 py-3 font-bold text-slate-950 transition hover:brightness-110"
          >
            العودة إلى مشاريعي
          </Link>
        </div>
      </main>
    );
  }

  const projectEntities =
    project.projectEntities ??
    [];

  const documents =
    project.documents ?? [];

  const people =
    projectEntities.filter(
      (item: any) =>
        item.entity?.type ===
        "person"
    );

  const completedDocuments =
    documents.filter(
      (doc: any) =>
        !doc.processingStatus ||
        doc.processingStatus ===
          "COMPLETED"
    ).length;

  const processingDocuments =
    documents.filter(
      (doc: any) =>
        doc.processingStatus ===
        "PROCESSING"
    ).length;

  const projectStatus =
    processingDocuments > 0
      ? "جاري تحليل بعض المستندات"
      : documents.length >
            0 &&
          completedDocuments ===
            documents.length
        ? "اكتملت معالجة المستندات"
        : "جاهز للبدء";

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#06101d] text-white"
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#081526]/90 px-5 py-4 shadow-xl shadow-black/20 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <Link
            href="/"
            className="group flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/20 to-amber-700/10 text-2xl font-black text-amber-400 shadow-lg shadow-amber-950/20">
              أ
            </div>

            <div>
              <p className="text-2xl font-black tracking-wide text-amber-400">
                أثر
              </p>

              <p className="text-xs tracking-[0.24em] text-slate-500">
                ATHAR AI
              </p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-slate-300 transition hover:border-amber-400/30 hover:text-amber-300"
            >
              الرئيسية
            </Link>

            <Link
              href="/projects"
              className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 font-semibold text-amber-300 transition hover:bg-amber-400/15"
            >
              مشاريعي
            </Link>
          </nav>
        </header>

        <ProjectHero
          project={project}
          projectState={
            projectStatus
          }
        />

        <ProjectStats
          documents={documents}
          projectEntities={
            projectEntities
          }
          people={people}
          completedDocuments={
            completedDocuments
          }
          projectStatus={
            projectStatus
          }
        />

        <section
          id="document-upload"
          className="mt-6 scroll-mt-24"
        >
          <ProjectDocuments
            projectId={
              project.id
            }
          />
        </section>

        <ProjectDocumentsList
          documents={documents}
        />

        <ProjectQuestion
          projectId={project.id}
          documentCount={
            completedDocuments
          }
        />

        <section
          id="ai-research-report"
          className="mt-10"
        >
          <AIResearchReport
            project={project}
          />
        </section>

        <footer className="mt-8 flex flex-col gap-3 border-t border-white/10 py-6 text-center text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-right">
          <p>
            © 2026 أثر للذكاء الاصطناعي — جميع الحقوق محفوظة
          </p>

          <p>
            منصة بحثية لفهم التاريخ وبناء المعرفة
          </p>
        </footer>
      </div>
    </main>
  );
}