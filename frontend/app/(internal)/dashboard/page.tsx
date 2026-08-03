import { serverFetchAuthed } from "@/lib/api/server-auth-client";
import type { components } from "@/lib/api/schema";
import { HorizontalBarList, StatCard, TimeSeriesBars } from "@/components/internal/charts";

type StatsOverviewOutDTO = components["schemas"]["StatsOverviewOut"];
type ProvinceStatOutDTO = components["schemas"]["ProvinceStatOut"];
type AgeGroupStatOutDTO = components["schemas"]["AgeGroupStatOut"];
type IndustrialParkStatOutDTO = components["schemas"]["IndustrialParkStatOut"];

export const metadata = { title: "Tổng quan | LA Group nội bộ" };

const STATUS_LABEL: Record<string, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  interviewing: "Đang phỏng vấn",
  hired: "Đã tuyển",
  rejected: "Từ chối",
};

export default async function DashboardHomePage() {
  const [overviewRes, provinceRes, ageRes, parkRes] = await Promise.all([
    serverFetchAuthed<StatsOverviewOutDTO>("/api/admin/stats/overview"),
    serverFetchAuthed<ProvinceStatOutDTO[]>("/api/admin/stats/by-province"),
    serverFetchAuthed<AgeGroupStatOutDTO[]>("/api/admin/stats/by-age-group"),
    serverFetchAuthed<IndustrialParkStatOutDTO[]>("/api/admin/stats/by-industrial-park"),
  ]);

  if (!overviewRes.ok || !provinceRes.ok || !ageRes.ok || !parkRes.ok) {
    return (
      <div>
        <h1 className="mb-4 text-lg font-extrabold text-text">Tổng quan</h1>
        <p className="rounded-xl border border-border bg-white p-5 text-sm text-text-muted">
          Không tải được số liệu thống kê. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  const overview = overviewRes.data;
  const byStatus = Object.entries(overview.by_status).map(([status, count]) => ({
    label: STATUS_LABEL[status] ?? status,
    value: count,
  }));

  return (
    <div>
      <h1 className="mb-1 text-lg font-extrabold text-text">Tổng quan</h1>
      <p className="mb-5 text-sm text-text-muted">
        Số liệu 30 ngày gần nhất ({overview.date_from} → {overview.date_to}).
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Hồ sơ mới nhận" value={overview.total} />
        {byStatus.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-white p-4 shadow-brand">
          <h2 className="mb-3 text-sm font-bold text-text">Hồ sơ theo ngày</h2>
          <TimeSeriesBars data={overview.series} />
        </section>

        <section className="rounded-xl border border-border bg-white p-4 shadow-brand">
          <h2 className="mb-3 text-sm font-bold text-text">Theo tỉnh/thành</h2>
          <HorizontalBarList
            data={provinceRes.data.map((p) => ({
              label: p.province_name,
              value: p.count,
            }))}
          />
        </section>

        <section className="rounded-xl border border-border bg-white p-4 shadow-brand">
          <h2 className="mb-3 text-sm font-bold text-text">Theo độ tuổi</h2>
          <HorizontalBarList
            data={ageRes.data.map((a) => ({ label: a.label, value: a.count }))}
          />
        </section>

        <section className="rounded-xl border border-border bg-white p-4 shadow-brand">
          <h2 className="mb-3 text-sm font-bold text-text">Theo khu công nghiệp</h2>
          <HorizontalBarList
            data={parkRes.data.map((p) => ({
              label: p.industrial_park_name,
              value: p.count,
            }))}
          />
        </section>
      </div>
    </div>
  );
}
