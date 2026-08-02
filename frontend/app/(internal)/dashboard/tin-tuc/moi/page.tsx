import { PostForm } from "../PostForm";

export const metadata = { title: "Đăng bài mới | LA Group nội bộ" };

export default function NewPostPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-5 text-lg font-extrabold text-text">Đăng bài tin tức/chính sách mới</h1>
      <PostForm />
    </div>
  );
}
