export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"
        role="status"
        aria-label="Đang tải"
      />
    </div>
  );
}
