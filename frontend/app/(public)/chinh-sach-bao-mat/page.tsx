import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách bảo mật thông tin | LA Group (LAHR)",
  description:
    "Chính sách bảo mật và bảo vệ dữ liệu cá nhân của LA Group (LAHR) khi thu thập hồ sơ ứng tuyển, tuân thủ Nghị định 13/2023/NĐ-CP.",
  alternates: { canonical: "/chinh-sach-bao-mat" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto w-full max-w-[820px] px-4 py-8 md:py-12">
      <h1 className="text-xl font-extrabold md:text-2xl">Chính sách bảo mật thông tin</h1>
      <p className="mt-2 text-sm text-text-muted">Cập nhật lần cuối: 02/08/2026</p>

      <div className="mt-6 flex flex-col gap-6 text-[15px] leading-relaxed text-text">
        <p>
          Công ty Cổ phần Dịch vụ Cung ứng Nhân lực LA (LAHR/LA Group), mã số doanh nghiệp
          0801411964, trụ sở tại Số 72, phố Hải Hưng, Khu đô thị Ecorivers, P. Hải Tân, TP. Hải
          Dương, T. Hải Dương (&quot;LAHR&quot;, &quot;chúng tôi&quot;) tôn trọng và cam kết bảo vệ
          dữ liệu cá nhân của người lao động, ứng viên truy cập và sử dụng website theo đúng quy
          định của Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
        </p>

        <section>
          <h2 className="mb-2 text-base font-extrabold">1. Mục đích thu thập dữ liệu</h2>
          <p>
            LAHR thu thập thông tin của người lao động (họ tên, số điện thoại, email, ngày sinh,
            quê quán, CV/hồ sơ đính kèm) nhằm mục đích duy nhất là tư vấn, giới thiệu và kết nối
            việc làm giữa người lao động với các doanh nghiệp, nhà máy đối tác mà LAHR đang cung
            ứng, cho thuê lại lao động. Chúng tôi không sử dụng dữ liệu cho mục đích nào khác
            ngoài mục đích này nếu không có sự đồng ý riêng của người lao động.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-extrabold">2. Dữ liệu được thu thập</h2>
          <p>
            Tuỳ vào hình thức ứng tuyển (qua website, chatbot AI, Zalo, Facebook hoặc nộp hồ sơ
            trực tiếp), LAHR có thể thu thập: họ tên, số điện thoại, email, ngày sinh, giới tính,
            quê quán/nơi thường trú, và bản chụp/scan CV hoặc hồ sơ ứng tuyển do người lao động
            tự nguyện cung cấp.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-extrabold">3. Chia sẻ dữ liệu với bên thứ ba</h2>
          <p>
            Do LAHR hoạt động theo mô hình cung ứng/cho thuê lại lao động, thông tin hồ sơ có thể
            được chia sẻ với doanh nghiệp, nhà máy đối tác đang có nhu cầu tuyển dụng phù hợp với
            hồ sơ của người lao động, nhằm phục vụ đúng mục đích tuyển dụng đã nêu ở Mục 1. LAHR
            không bán, cho thuê hay trao đổi dữ liệu cá nhân cho bất kỳ bên thứ ba nào ngoài mục
            đích này.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-extrabold">4. Thời gian lưu trữ</h2>
          <p>
            Dữ liệu được lưu trữ trong thời gian cần thiết để phục vụ mục đích tuyển dụng và theo
            yêu cầu lưu trữ hồ sơ lao động của pháp luật hiện hành. Người lao động có quyền yêu
            cầu xoá dữ liệu sớm hơn theo hướng dẫn tại Mục 5.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-extrabold">5. Quyền của người lao động</h2>
          <p>Người lao động có quyền:</p>
          <ul className="ml-5 mt-2 list-disc">
            <li>Được biết về hoạt động xử lý dữ liệu cá nhân của mình;</li>
            <li>Yêu cầu chỉnh sửa thông tin không chính xác;</li>
            <li>Yêu cầu xoá dữ liệu cá nhân đã cung cấp;</li>
            <li>Rút lại sự đồng ý đã cung cấp trước đó bất kỳ lúc nào.</li>
          </ul>
          <p className="mt-2">
            Để thực hiện các quyền trên, người lao động vui lòng liên hệ theo thông tin tại Mục 6.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-extrabold">6. Liên hệ</h2>
          <p>
            Công ty Cổ phần Dịch vụ Cung ứng Nhân lực LA (LAHR)
            <br />
            Địa chỉ: Số 72, phố Hải Hưng, Khu đô thị Ecorivers, P. Hải Tân, TP. Hải Dương, T. Hải
            Dương
            <br />
            Điện thoại: <a href="tel:0922869966">0922.86.99.66</a>
            <br />
            Email: <a href="mailto:lahrservice2023@gmail.com">lahrservice2023@gmail.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}
