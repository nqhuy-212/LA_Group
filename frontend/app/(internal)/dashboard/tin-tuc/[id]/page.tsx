import { notFound } from "next/navigation";
import { serverFetchAuthed } from "@/lib/api/server-auth-client";
import type { components } from "@/lib/api/schema";
import { PostForm } from "../PostForm";

type PostAdminOutDTO = components["schemas"]["PostAdminOut"];

export const metadata = { title: "Sửa bài viết | LA Group nội bộ" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postRes = await serverFetchAuthed<PostAdminOutDTO>(`/api/admin/posts/${id}`);
  if (!postRes.ok) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-5 text-lg font-extrabold text-text">Sửa bài viết</h1>
      <PostForm initialPost={postRes.data} />
    </div>
  );
}
