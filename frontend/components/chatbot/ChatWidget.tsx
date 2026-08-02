"use client";

import { useEffect, useRef, useState } from "react";
import { IconChatBubble, IconClose, IconSend } from "@/components/ui/icons";

export const OPEN_CHAT_EVENT = "la-group:open-chat";

type Message = {
  id: number;
  from: "bot" | "user";
  text: string;
};

const initialMessages: Message[] = [
  {
    id: 0,
    from: "bot",
    text: "Xin chào! Mình là trợ lý AI của LA Group 👋 Bạn đang tìm công việc như thế nào?",
  },
];

const suggestions = [
  "Tôi muốn tìm việc sản xuất, lắp ráp",
  "Tôi muốn tìm việc gần khu vực Hải Dương",
  "Mức lương mong muốn 8-10 triệu",
];

const DEMO_REPLY =
  "Cảm ơn bạn! Đây là bản demo giao diện — trợ lý AI thực tế sẽ gợi ý việc làm phù hợp dựa trên dữ liệu tuyển dụng của LA Group.";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOpen() {
      setOpen(true);
    }
    window.addEventListener(OPEN_CHAT_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [messages]);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { id: prev.length, from: "user", text: trimmed }]);
    setInput("");
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { id: prev.length, from: "bot", text: DEMO_REPLY }]);
    }, 500);
  }

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-[85] bg-[rgba(10,20,40,.4)] md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mở trợ lý AI"
        className="fixed bottom-4 right-4 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-[0_10px_26px_rgba(15,60,120,.35)] active:scale-95"
      >
        <IconChatBubble className="h-6 w-6" />
      </button>

      <div
        className={`fixed inset-x-0 bottom-0 z-[90] flex h-[78vh] flex-col rounded-t-2xl bg-white shadow-[0_-10px_40px_rgba(10,30,60,.25)] transition-transform duration-300 ${
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
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => sendMessage(suggestion)}
                className="rounded-full border border-primary-600 bg-white px-3.5 py-2 text-xs font-bold text-primary-700"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-shrink-0 gap-2 border-t border-border bg-white p-3">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") sendMessage(input);
            }}
            placeholder="Nhập câu hỏi của bạn..."
            className="min-h-11 flex-1 rounded-full border border-border px-4 text-[13.5px] outline-none"
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            aria-label="Gửi"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-white"
          >
            <IconSend className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
