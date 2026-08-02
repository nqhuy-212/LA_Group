"use client";

import { type ReactNode } from "react";
import { OPEN_CHAT_EVENT } from "@/components/chatbot/ChatWidget";

export function OpenChatButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_CHAT_EVENT))}
    >
      {children}
    </button>
  );
}
