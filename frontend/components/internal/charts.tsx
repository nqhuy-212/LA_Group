// Biểu đồ thuần SVG/CSS cho Dashboard nội bộ — cố tình KHÔNG thêm dependency
// (recharts...) vì 4 biểu đồ ở đây chỉ là bar chart đơn giản, đủ dùng bằng div/SVG
// (xem docs/PLAN.md § P7-fe: "Nếu chỉ cần bar chart thì SVG/CSS thuần, khỏi thêm dep").

type BarDatum = {
  label: string;
  value: number;
};

export function HorizontalBarList({
  data,
  emptyText = "Chưa có dữ liệu",
}: {
  data: BarDatum[];
  emptyText?: string;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-text-muted">{emptyText}</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className="flex flex-col gap-2.5">
      {data.map((d) => (
        <li key={d.label} className="flex items-center gap-3">
          <span className="w-28 flex-shrink-0 truncate text-xs font-semibold text-text-muted sm:w-36">
            {d.label}
          </span>
          <span className="h-3 flex-1 overflow-hidden rounded-full bg-bg">
            <span
              className="block h-full rounded-full bg-primary-600"
              style={{ width: `${Math.max((d.value / max) * 100, 3)}%` }}
            />
          </span>
          <span className="w-10 flex-shrink-0 text-right text-xs font-bold text-text">
            {d.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function TimeSeriesBars({
  data,
  emptyText = "Chưa có dữ liệu",
}: {
  data: { period: string; count: number }[];
  emptyText?: string;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-text-muted">{emptyText}</p>;
  }
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    // overflow-x-auto CHỈ trên khung biểu đồ (không phải cả trang) — dãy ngày dài
    // hơn 375px vẫn không gây tràn ngang toàn trang (design-system.md).
    <div className="overflow-x-auto">
      <div className="flex h-32 min-w-max items-end gap-1.5 pb-1">
        {data.map((d) => (
          <div
            key={d.period}
            className="flex w-6 flex-shrink-0 flex-col items-center gap-1"
            title={`${d.period}: ${d.count}`}
          >
            <div className="flex h-24 w-full items-end">
              <div
                className="w-full rounded-t bg-primary-600"
                style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 6 : 0)}%` }}
              />
            </div>
            <span className="w-full truncate text-center text-[9px] text-text-muted">
              {d.period.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-brand">
      <p className="text-xs font-semibold text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-primary-800">{value}</p>
    </div>
  );
}
