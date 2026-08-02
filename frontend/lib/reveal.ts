import type { CSSProperties } from "react";

export function revealStyle(index: number): CSSProperties {
  return { "--reveal-i": index } as CSSProperties;
}
