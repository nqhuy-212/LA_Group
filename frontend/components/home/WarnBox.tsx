import { IconAlertTriangle } from "@/components/ui/icons";

const rules = [
  "LA Group và các doanh nghiệp đối tác không bao giờ yêu cầu ứng viên nộp tiền, đặt cọc để được nhận việc.",
  "Không cung cấp thông tin CMND/CCCD, tài khoản ngân hàng cho người lạ tự xưng là nhà tuyển dụng.",
  "Chỉ tin tưởng thông tin tuyển dụng đăng trên website chính thức hoặc do trợ lý AI của LA Group cung cấp.",
];

export function WarnBox() {
  return (
    <div
      data-reveal
      className="reveal mt-[18px] flex gap-3 rounded-xl border-[1.5px] border-[#f3b9b5] bg-[#fdf1f0] p-4"
    >
      <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-lg bg-accent text-white">
        <IconAlertTriangle className="h-4 w-4" />
      </div>
      <div>
        <h3 className="text-[14.5px] font-extrabold text-accent-dark">
          Ghi nhớ để tránh bị lừa
        </h3>
        <ul className="mt-2 flex flex-col gap-1.5">
          {rules.map((rule) => (
            <li key={rule} className="relative pl-3.5 text-[13px] text-[#7a2b26]">
              <span className="absolute left-0 font-black text-accent">•</span>
              {rule}
            </li>
          ))}
          <li className="relative pl-3.5 text-[13px] text-[#7a2b26]">
            <span className="absolute left-0 font-black text-accent">•</span>
            Liên hệ hotline <strong>0922.86.99.66</strong> ngay nếu phát hiện dấu hiệu lừa đảo
            liên quan đến tên LA Group.
          </li>
        </ul>
      </div>
    </div>
  );
}
