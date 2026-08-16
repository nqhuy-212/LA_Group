"use server";

import { revalidatePath } from "next/cache";

// Trang chi tiết công khai cache ISR 300s (serverFetch mặc định revalidate: 300)
// — không gọi revalidatePath sau khi lưu thì "xem kết quả" hiện bản cũ tới 5 phút.
export async function revalidateJobPaths(slug: string) {
  revalidatePath(`/viec-lam/${slug}`);
  revalidatePath("/viec-lam");
  revalidatePath("/");
}

export async function revalidatePostPaths(slug: string) {
  revalidatePath(`/tin-tuc/${slug}`);
  revalidatePath("/tin-tuc");
  revalidatePath("/");
}
