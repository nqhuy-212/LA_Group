"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { IconClose, IconMenu } from "@/components/ui/icons";

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/viec-lam", label: "Việc làm" },
  { href: "#chatbot-ai", label: "Tư vấn AI" },
  { href: "/tin-tuc", label: "Chính sách & Tin tức" },
  { href: "#lien-he", label: "Liên hệ" },
];

export function MainNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-gradient-to-b from-primary-800 to-primary-700 shadow-brand">
      <div className="mx-auto flex h-16 w-full max-w-brand items-center justify-between gap-3 px-4">
        <Link href="/" className="flex flex-shrink-0 items-center gap-2.5 text-white">
          <Image
            src="/logo-icon.png"
            alt="LA Group"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
          />
          <span className="font-extrabold leading-tight">
            LA Group
            <span className="block text-[10px] font-semibold tracking-wide text-primary-100">
              Human Resources
            </span>
          </span>
        </Link>

        <nav className="hidden md:block">
          <ul className="flex gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg px-3.5 py-2.5 text-sm font-semibold text-primary-100 transition-colors hover:bg-white/15 hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-white md:hidden"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <IconClose className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
        </button>
      </div>

      {open ? (
        <nav className="border-t border-white/10 bg-primary-800 md:hidden">
          <ul className="p-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg px-3 py-3.5 text-[15px] font-semibold text-primary-100 active:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
