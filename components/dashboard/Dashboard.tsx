import Sidebar from "./Sidebar";
import Timeline from "./Timeline";
import SearchBox from "./SearchBox";
import Projects from "./Projects";

export default function Dashboard() {
  return (
    <main className="w-full min-h-screen">

      <div className="mx-auto max-w-[1800px] px-8 py-10">

        <div className="flex gap-8">

          {/* المحتوى الرئيسي */}
          <section className="flex-1 space-y-8">

            <SearchBox />

            <Projects />

          </section>

          {/* الشريط الجانبي */}
          <aside className="w-[320px] shrink-0">

            <Sidebar />

          </aside>

          {/* الخط الزمني */}
          <aside className="w-[280px] shrink-0">

            <Timeline />

          </aside>

        </div>

      </div>

    </main>
  );
}