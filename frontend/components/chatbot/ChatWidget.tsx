"use client";

import { useEffect, useRef, useState } from "react";
import { ChatQuiz } from "@/components/chatbot/ChatQuiz";
import { IconChatBubble, IconClose, IconSend } from "@/components/ui/icons";

export const OPEN_CHAT_EVENT = "la-group:open-chat";

type Message = {
  id: number;
  from: "bot" | "user";
  text: string;
  telHref?: string;
};

const initialMessages: Message[] = [
  {
    id: 0,
    from: "bot",
    text: "Xin chào! Mình là trợ lý AI của LA Group 👋 Trả lời nhanh 4 câu dưới đây để mình tìm việc phù hợp cho bạn nhé — hoặc bạn cứ gõ câu hỏi tự do bất cứ lúc nào.",
  },
];

const CONNECTION_ERROR_TEXT =
  "Xin lỗi, không kết nối được trợ lý AI. Vui lòng thử lại sau hoặc gọi hotline 0922.86.99.66.";

const AUTO_OPENED_KEY = "la-group:chat-auto-opened";
const AUTO_OPEN_DELAY_MS = 2500;
const GREETING_VISIBLE_MS = 8000;

type ChatEvent =
  { type: "token"; text: string } | { type: "done" } | { type: "error"; message: string };

export function ChatWidget({
  industrialParks = [],
}: {
  industrialParks?: { slug: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [greetingShown, setGreetingShown] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(1);

  function pushMessage(from: "bot" | "user", text: string, telHref?: string) {
    const id = nextIdRef.current++;
    setMessages((prev) => [...prev, { id, from, text, telHref }]);
  }

  useEffect(() => {
    function handleOpen() {
      setOpen(true);
    }
    window.addEventListener(OPEN_CHAT_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handleOpen);
  }, []);

  // Chủ động chào khi người dùng vừa vào site, nhưng CHỈ bằng bóng chữ nhỏ cạnh
  // nút chat — không tự mở panel. Panel chiếm 78% màn hình điện thoại và overlay
  // của nó nuốt mất cú chạm đầu tiên (đo bằng trình duyệt thật: người đang định
  // bấm "Tìm việc làm" thì chat đè lên). `sessionStorage` để chỉ chào một lần
  // mỗi phiên, kể cả khi người dùng chuyển sang trang khác trong site.
  useEffect(() => {
    if (sessionStorage.getItem(AUTO_OPENED_KEY)) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem(AUTO_OPENED_KEY, "1");
      setGreetingShown(true);
    }, AUTO_OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Tự thu lại nếu người dùng không tương tác — bóng chào nằm đè lên góc dưới
  // phải, nơi có CTA "Xem việc làm mới" của trang chủ.
  useEffect(() => {
    if (!greetingShown) return;
    const timer = setTimeout(() => setGreetingShown(false), GREETING_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [greetingShown]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    // Lịch sử gửi kèm mỗi lần gọi — server không lưu session (P8). Bỏ lời chào tĩnh
    // ban đầu (id 0) vì đó không phải lượt hội thoại thật của model.
    const history = messages
      .filter((m) => m.id !== 0)
      .map((m): { role: "assistant" | "user"; content: string } => ({
        role: m.from === "bot" ? "assistant" : "user",
        content: m.text,
      }));

    const userMsgId = nextIdRef.current++;
    const botMsgId = nextIdRef.current++;
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, from: "user", text: trimmed },
      { id: botMsgId, from: "bot", text: "" },
    ]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });
      if (!res.ok || !res.body) throw new Error("request-failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          const event = JSON.parse(line.slice(5).trim()) as ChatEvent;
          if (event.type === "token") {
            setMessages((prev) =>
              prev.map((m) => (m.id === botMsgId ? { ...m, text: m.text + event.text } : m)),
            );
          } else if (event.type === "error") {
            setMessages((prev) =>
              prev.map((m) => (m.id === botMsgId ? { ...m, text: event.message } : m)),
            );
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === botMsgId ? { ...m, text: CONNECTION_ERROR_TEXT } : m)),
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-[85] bg-[rgba(10,20,40,.4)] md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {/* Lời chào chủ động: bóng chữ nhỏ, KHÔNG che nội dung và không chặn thao
          tác — khác hẳn việc tự bật panel (xem ghi chú ở effect auto-greeting). */}
      {greetingShown && !open ? (
        <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-[80] max-w-[230px]">
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setGreetingShown(false);
            }}
            className="block w-full rounded-2xl rounded-br-sm bg-white px-3.5 py-2.5 text-left text-[13px] leading-snug text-text shadow-[0_10px_26px_rgba(15,60,120,.2)] ring-1 ring-border active:bg-primary-50"
          >
            Chào bạn! Cần tìm việc phù hợp? Bấm vào đây để mình tư vấn nhé 👋
          </button>
          <button
            type="button"
            onClick={() => setGreetingShown(false)}
            aria-label="Đóng lời chào"
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-text-muted text-white shadow-brand"
          >
            <IconClose className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {/* `bottom-4` thuần khiến nút nằm lọt dưới thanh công cụ của trình duyệt
          di động (Chrome/Safari trên iOS vẽ đè lên viewport) — người dùng bấm
          trúng thanh công cụ chứ không trúng nút, tưởng là chat hỏng. Cộng thêm
          `env(safe-area-inset-bottom)` để tránh cả home indicator. */}
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setGreetingShown(false);
        }}
        aria-label="Mở trợ lý AI"
        aria-hidden={open}
        className={`fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-4 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-[0_10px_26px_rgba(15,60,120,.35)] transition-opacity active:scale-95 ${
          open ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <IconChatBubble className="h-6 w-6" />
      </button>

      <div
        className={`fixed inset-x-0 bottom-0 z-[90] flex h-[78dvh] flex-col rounded-t-2xl bg-white shadow-[0_-10px_40px_rgba(10,30,60,.25)] transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        } md:inset-x-auto md:bottom-[88px] md:right-6 md:h-[560px] md:w-[380px] md:rounded-2xl md:transition-[transform,opacity] ${
          open
            ? "md:translate-y-0 md:scale-100 md:opacity-100"
            : "md:pointer-events-none md:translate-y-6 md:scale-[0.97] md:opacity-0"
        }`}
        role="dialog"
        aria-label="Trợ lý AI LA Group"
        aria-hidden={!open}
      >
        <div className="flex flex-shrink-0 items-center gap-2.5 rounded-t-2xl bg-gradient-to-br from-primary-700 to-primary-600 px-4 py-3.5 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-extrabold text-primary-700">
            AI
          </div>
          <div>
            <strong className="block text-sm">Trợ lý AI LA Group</strong>
            <small className="flex items-center gap-1 text-[11px] text-primary-100">
              ● Sẵn sàng tư vấn
            </small>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Đóng"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/15"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        <div ref={bodyRef} className="flex flex-1 flex-col gap-3 overflow-y-auto bg-bg p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-snug ${
                message.from === "bot"
                  ? "self-start rounded-bl-sm border border-border bg-white"
                  : "self-end rounded-br-sm bg-primary-600 text-white"
              }`}
            >
              {message.text}
              {message.telHref ? (
                <a
                  href={message.telHref}
                  className="mt-2 flex min-h-11 items-center justify-center rounded-full bg-accent px-4 text-sm font-bold text-white"
                >
                  📞 Gọi ngay: 0922.86.99.66
                </a>
              ) : null}
            </div>
          ))}
          <ChatQuiz industrialParks={industrialParks} onPushMessage={pushMessage} />
        </div>

        {/* pb thêm safe-area: trên iPhone home indicator che mất ô nhập nếu chỉ `p-3`. */}
        <div className="flex flex-shrink-0 gap-2 border-t border-border bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-3">
          <input
            type="text"
            value={input}
            maxLength={1000}
            disabled={sending}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") sendMessage(input);
            }}
            placeholder="Nhập câu hỏi của bạn..."
            className="min-h-11 flex-1 rounded-full border border-border px-4 text-[13.5px] outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={sending}
            aria-label="Gửi"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-white disabled:opacity-50"
          >
            <IconSend className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
