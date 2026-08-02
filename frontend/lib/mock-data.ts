export type JobCategorySlug = "sx" | "kt" | "dv" | "kv";

export type Job = {
  id: string;
  title: string;
  company: string;
  logoInitials: string;
  category: JobCategorySlug;
  hot?: boolean;
  salaryLabel: string;
  location: string;
  deadlineLabel: string;
};

export const jobCategories: { slug: "all" | JobCategorySlug; label: string }[] = [
  { slug: "all", label: "Tất cả" },
  { slug: "sx", label: "Sản xuất – Lắp ráp" },
  { slug: "kt", label: "Cơ khí – Kỹ thuật" },
  { slug: "dv", label: "Dịch vụ – Bán hàng" },
  { slug: "kv", label: "Kho vận – Logistics" },
];

export const jobs: Job[] = [
  {
    id: "cn-lap-rap-dien-tu",
    title: "Công nhân lắp ráp điện tử",
    company: "Công ty TNHH Điện tử Việt Phát",
    logoInitials: "CTY",
    category: "sx",
    hot: true,
    salaryLabel: "9 – 12 triệu",
    location: "KCN Kỹ thuật cao An Phát, Hải Dương",
    deadlineLabel: "Hạn nộp: 15/08/2026",
  },
  {
    id: "ky-thuat-vien-cnc",
    title: "Kỹ thuật viên bảo trì máy CNC",
    company: "Công ty Cơ khí Chính xác An Phát",
    logoInitials: "KT",
    category: "kt",
    salaryLabel: "12 – 16 triệu",
    location: "KCN Đại An, Hải Dương",
    deadlineLabel: "Hạn nộp: 20/08/2026",
  },
  {
    id: "nhan-vien-ban-hang-sieu-thi",
    title: "Nhân viên bán hàng siêu thị",
    company: "Chuỗi Siêu thị Bình Minh Mart",
    logoInitials: "SV",
    category: "dv",
    hot: true,
    salaryLabel: "7 – 9 triệu",
    location: "P. Hải Tân, TP. Hải Dương",
    deadlineLabel: "Hạn nộp: 10/08/2026",
  },
  {
    id: "nhan-vien-kho-boc-xep",
    title: "Nhân viên kho – bốc xếp hàng hóa",
    company: "Công ty Logistics Đại Dương",
    logoInitials: "LG",
    category: "kv",
    salaryLabel: "8 – 10 triệu",
    location: "KCN Phúc Điền, Hải Dương",
    deadlineLabel: "Hạn nộp: 25/08/2026",
  },
  {
    id: "cn-may-cong-nghiep",
    title: "Công nhân may công nghiệp",
    company: "Công ty May mặc Thành Đạt",
    logoInitials: "MM",
    category: "sx",
    salaryLabel: "8 – 11 triệu",
    location: "KCN Cẩm Điền – Lương Điền (Vsip Hải Dương)",
    deadlineLabel: "Hạn nộp: 18/08/2026",
  },
  {
    id: "tho-dien-cong-nghiep",
    title: "Thợ điện công nghiệp",
    company: "Công ty TNHH Cơ điện Phú Thành",
    logoInitials: "DT",
    category: "kt",
    hot: true,
    salaryLabel: "11 – 15 triệu",
    location: "KCN Tân Trường, Hải Dương",
    deadlineLabel: "Hạn nộp: 30/08/2026",
  },
];

export type JobCategoryCard = {
  slug: JobCategorySlug;
  label: string;
  countLabel: string;
};

export const jobCategoryCards: JobCategoryCard[] = [
  { slug: "sx", label: "Sản xuất – Lắp ráp", countLabel: "320 việc làm" },
  { slug: "kt", label: "Cơ khí – Kỹ thuật", countLabel: "180 việc làm" },
  { slug: "dv", label: "Dịch vụ – Bán hàng", countLabel: "240 việc làm" },
  { slug: "kv", label: "Kho vận – Logistics", countLabel: "150 việc làm" },
];

export type EventItem = {
  id: string;
  title: string;
  dateLabel: string;
  icon: "calendar" | "graduation" | "users";
};

export const events: EventItem[] = [
  {
    id: "ky-ket-hop-tac-2026",
    title: "Lễ ký kết hợp tác cung ứng lao động đầu năm 2026",
    dateLabel: "28/07/2026",
    icon: "calendar",
  },
  {
    id: "dao-tao-ky-nang-nghe",
    title: "Chương trình đào tạo kỹ năng nghề miễn phí cho người lao động",
    dateLabel: "22/07/2026",
    icon: "graduation",
  },
  {
    id: "mo-rong-5-kcn",
    title: "LA Group mở rộng cung ứng lao động cho 5 khu công nghiệp tại Hải Dương",
    dateLabel: "15/07/2026",
    icon: "users",
  },
];

export type NewsPost = {
  id: string;
  tag: string;
  title: string;
  excerpt: string;
  dateLabel: string;
};

export const newsPosts: NewsPost[] = [
  {
    id: "chinh-sach-bao-hiem-2026",
    tag: "Chính sách",
    title: "Chính sách bảo hiểm và phúc lợi cho người lao động 2026",
    excerpt:
      "Tổng hợp các chế độ bảo hiểm xã hội, y tế và phúc lợi áp dụng cho người lao động tại LA Group.",
    dateLabel: "20/07/2026",
  },
  {
    id: "5-buoc-chuan-bi-ho-so",
    tag: "Hướng dẫn",
    title: "5 bước chuẩn bị hồ sơ ứng tuyển gây ấn tượng",
    excerpt:
      "Hướng dẫn chi tiết cách chuẩn bị CV và hồ sơ để tăng cơ hội trúng tuyển tại các doanh nghiệp đối tác.",
    dateLabel: "15/07/2026",
  },
  {
    id: "ky-ket-20-doanh-nghiep",
    tag: "Tin tức",
    title: "LA Group (LAHR) ký kết cung ứng lao động cùng 20 doanh nghiệp mới",
    excerpt:
      "Mở rộng mạng lưới nhà máy đối tác nhận lao động do LAHR cung ứng tại các KCN Hải Dương, mang đến thêm hàng trăm cơ hội việc làm mới cho người lao động.",
    dateLabel: "08/07/2026",
  },
];

export type FeedItem = {
  id: string;
  title: string;
  dateLabel: string;
  icon: "store" | "factory" | "truck" | "alert-triangle" | "alert-circle" | "mail";
};

export const newPartnerFeed: FeedItem[] = [
  {
    id: "viet-phat-hop-tac",
    title: "Công ty TNHH Điện tử Việt Phát chính thức hợp tác tuyển dụng cùng LA Group",
    dateLabel: "26/07/2026",
    icon: "store",
  },
  {
    id: "an-phat-mo-rong",
    title: "Công ty Cơ khí Chính xác An Phát mở rộng tuyển dụng 50 vị trí kỹ thuật",
    dateLabel: "24/07/2026",
    icon: "factory",
  },
  {
    id: "binh-minh-mart",
    title: "Chuỗi Siêu thị Bình Minh Mart tham gia mạng lưới đối tác tuyển dụng",
    dateLabel: "20/07/2026",
    icon: "store",
  },
  {
    id: "logistics-dai-duong",
    title: "Công ty Logistics Đại Dương tuyển dụng nhân sự cho kho hàng mới",
    dateLabel: "16/07/2026",
    icon: "truck",
  },
];

export const scamAlertFeed: FeedItem[] = [
  {
    id: "mao-danh-thu-phi",
    title: "Cảnh giác chiêu trò mạo danh LA Group để thu phí giới thiệu việc làm",
    dateLabel: "27/07/2026",
    icon: "alert-triangle",
  },
  {
    id: "viec-nhe-luong-cao",
    title: 'Không có chuyện "việc nhẹ lương cao" không yêu cầu kinh nghiệm',
    dateLabel: "19/07/2026",
    icon: "alert-circle",
  },
  {
    id: "nhan-biet-tin-gia",
    title: "Hướng dẫn nhận biết tin tuyển dụng giả mạo trên mạng xã hội",
    dateLabel: "10/07/2026",
    icon: "mail",
  },
];
