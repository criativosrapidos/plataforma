import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./Logo";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-off">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-6">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex flex-1 flex-col justify-center py-10">{children}</div>
      </div>
    </main>
  );
}

export function Campo({ label, ...props }: { label: string } & React.ComponentProps<"input">) {
  return (
    <label className="block">
      <span className="text-sm font-extrabold">{label}</span>
      <input
        className="mt-1.5 h-12 w-full rounded-xl border border-linha bg-white px-4 outline-none transition placeholder:text-cinza/60 focus:border-preto"
        {...props}
      />
    </label>
  );
}
