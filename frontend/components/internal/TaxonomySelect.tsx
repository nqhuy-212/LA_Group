"use client";

import { useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { createPortal } from "react-dom";

// isClient — cùng pattern useSyncExternalStore với InternalEntryLink.tsx thay vì
// useEffect(() => setState(true), []) (bị lint react-hooks/set-state-in-effect
// chặn); getServerSnapshot cố định `false` để khớp HTML server lúc hydrate.
function subscribeNoop() {
  return () => {};
}
function isClientTrue() {
  return true;
}
function isClientFalseOnServer() {
  return false;
}

export type TaxonomyOption = { value: string; label: string };

export type TaxonomyCreateField =
  | { kind: "text"; name: string; label: string; placeholder?: string; maxLength?: number }
  | { kind: "select"; name: string; label: string; options: TaxonomyOption[] };

export type TaxonomyCreateResult =
  | { ok: true; option: TaxonomyOption }
  | { ok: false; error: string };

export type TaxonomyDeleteResult = { ok: true } | { ok: false; error: string };

const fieldClass =
  "min-h-11 w-full rounded-lg border border-border bg-white px-3 text-[16px] text-text outline-none focus:border-primary-500";

/**
 * `<select>` danh mục dùng chung cho công ty/ngành nghề/KCN/tỉnh trong JobForm
 * (P10.2) — thêm/xoá nhanh ngay cạnh dropdown, không phải rời trang. Dùng
 * `<dialog>` native (`showModal()`) thay Radix Dialog: `@radix-ui/*` thực tế chưa
 * từng được cài vào project (không component nào dùng), native đã có sẵn
 * focus-trap/Esc/backdrop với 0 dependency mới — hợp tinh thần "tải nhanh trên
 * mạng 3G/4G" của code-conventions.md.
 *
 * `createFields` khai báo các trường cần cho form thêm mới — mỗi taxonomy có
 * payload tạo khác nhau (công ty/ngành nghề chỉ cần `name`, KCN cần thêm
 * `province_code`, tỉnh cần `code`+`name`+`type` vì mã tỉnh do người dùng nhập
 * chứ không tự sinh) — `onCreate` nhận đúng object các giá trị đó, tự map sang
 * payload thật của từng endpoint admin.
 *
 * Thêm xong CHỈ cập nhật state cục bộ (options + value) rồi đóng dialog — không
 * reload trang, không mất dữ liệu đang nhập dở ở các trường khác của JobForm.
 */
export function TaxonomySelect({
  label,
  selectName,
  required,
  options: initialOptions,
  value,
  onChange,
  canManage,
  createTitle,
  createFields,
  onCreate,
  onDelete,
  emptyOptionLabel,
}: {
  label: string;
  selectName: string;
  required?: boolean;
  options: TaxonomyOption[];
  value: string;
  onChange: (value: string) => void;
  canManage: boolean;
  createTitle: string;
  createFields: TaxonomyCreateField[];
  onCreate: (values: Record<string, string>) => Promise<TaxonomyCreateResult>;
  onDelete: (value: string) => Promise<TaxonomyDeleteResult>;
  emptyOptionLabel?: string;
}) {
  const dialogId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [options, setOptions] = useState(initialOptions);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // TaxonomySelect luôn đứng bên trong <form> chính của JobForm — dialog chứa
  // form riêng của nó KHÔNG được lồng trong DOM tree của form ngoài (HTML không
  // hợp lệ khi lồng <form>, và sự kiện submit của form trong sẽ nổi bọt lên
  // form ngoài, khiến handleSubmit của JobForm chạy luôn theo, xoá dữ liệu đang
  // nhập dở — bug thật phát hiện qua test trình duyệt). Portal ra document.body
  // để dialog nằm ngoài cây DOM của form ngoài; chỉ portal sau khi mount vì
  // document không tồn tại lúc render trên server.
  const mounted = useSyncExternalStore(subscribeNoop, isClientTrue, isClientFalseOnServer);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  function openCreateDialog() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function closeCreateDialog() {
    dialogRef.current?.close();
  }

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Phòng vệ kép: dù đã portal ra ngoài form JobForm, chặn nổi bọt để chắc
    // chắn submit ở đây không bao giờ kích hoạt onSubmit của form cha.
    event.stopPropagation();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const values: Record<string, string> = {};
    for (const field of createFields) {
      values[field.name] = String(form.get(field.name) ?? "").trim();
    }

    const result = await onCreate(values);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setOptions((prev) => [...prev, result.option]);
    onChange(result.option.value);
    closeCreateDialog();
  }

  async function handleDeleteSelected() {
    if (!value || !selectedLabel) return;
    if (!confirm(`Xoá "${selectedLabel}"? Không thể hoàn tác.`)) return;

    setPending(true);
    const result = await onDelete(value);
    setPending(false);
    if (!result.ok) {
      alert(`Không xoá được: ${result.error}`);
      return;
    }

    setOptions((prev) => prev.filter((o) => o.value !== value));
    onChange("");
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm font-semibold text-text">
      <label htmlFor={dialogId}>{label}</label>
      <div className="flex gap-2">
        <select
          id={dialogId}
          name={selectName}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
        >
          <option value="" disabled={required}>
            {emptyOptionLabel ?? "-- Chọn --"}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {canManage ? (
          <>
            <button
              type="button"
              onClick={openCreateDialog}
              aria-label={`Thêm ${label.toLowerCase()}`}
              className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-lg border border-border text-lg font-bold text-primary-700 hover:bg-primary-50"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={!value || pending}
              aria-label={`Xoá ${label.toLowerCase()} đang chọn`}
              className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-lg border border-accent/30 text-sm font-semibold text-accent-dark hover:bg-accent/10 disabled:opacity-40"
            >
              ✕
            </button>
          </>
        ) : null}
      </div>

      {canManage && mounted
        ? createPortal(
            <dialog
              ref={dialogRef}
              className="w-full max-w-sm rounded-xl border border-border p-0 shadow-brand-lg backdrop:bg-black/40"
              onClose={() => setError(null)}
            >
              <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 p-5">
                <h2 className="text-base font-extrabold text-text">{createTitle}</h2>

                {createFields.map((field) =>
                  field.kind === "text" ? (
                    <label
                      key={field.name}
                      className="flex flex-col gap-1.5 text-sm font-semibold text-text"
                    >
                      {field.label}
                      <input
                        name={field.name}
                        required
                        maxLength={field.maxLength}
                        placeholder={field.placeholder}
                        className={fieldClass}
                      />
                    </label>
                  ) : (
                    <label
                      key={field.name}
                      className="flex flex-col gap-1.5 text-sm font-semibold text-text"
                    >
                      {field.label}
                      <select name={field.name} required className={fieldClass}>
                        <option value="" disabled>
                          -- Chọn --
                        </option>
                        {field.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ),
                )}

                {error ? <p className="text-sm font-semibold text-accent-dark">{error}</p> : null}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeCreateDialog}
                    className="flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-text-muted hover:bg-bg"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex min-h-11 items-center rounded-lg bg-primary-600 px-4 text-sm font-bold text-white shadow-brand hover:bg-primary-700 disabled:opacity-60"
                  >
                    {pending ? "Đang lưu..." : "Thêm"}
                  </button>
                </div>
              </form>
            </dialog>,
            document.body,
          )
        : null}
    </div>
  );
}
