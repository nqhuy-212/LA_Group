import Link from "next/link";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "accent" | "ghost" | "outline-light";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white shadow-brand hover:bg-primary-700",
  accent: "bg-accent text-white shadow-brand hover:bg-accent-dark",
  ghost: "bg-white text-primary-700 border border-border hover:bg-primary-100",
  "outline-light":
    "bg-transparent text-white border border-white/50 hover:bg-white/10",
};

const baseClasses =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-5 text-sm font-bold transition-colors active:scale-[0.97]";

type BaseProps = {
  variant?: Variant;
  block?: boolean;
  className?: string;
  children: ReactNode;
};

function classes({ variant = "primary", block, className }: BaseProps) {
  return [baseClasses, variantClasses[variant], block ? "w-full" : "", className]
    .filter(Boolean)
    .join(" ");
}

type LinkButtonProps = BaseProps & { href: string; target?: string; rel?: string };

export function ButtonLink({ href, target, rel, ...props }: LinkButtonProps) {
  return (
    <Link href={href} target={target} rel={rel} className={classes(props)}>
      {props.children}
    </Link>
  );
}

type ButtonProps = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Button({ variant, block, className, children, ...rest }: ButtonProps) {
  return (
    <button className={classes({ variant, block, className, children })} {...rest}>
      {children}
    </button>
  );
}
