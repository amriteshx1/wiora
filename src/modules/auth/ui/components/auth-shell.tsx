import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export const authPrimaryBtn =
  "rounded-full bg-[#141414] text-white hover:bg-black h-10 px-5 text-sm font-medium shadow-none";

export const authGhostBtn =
  "rounded-full border border-[var(--wiora-rule)] bg-[var(--wiora-paper)] text-[#141414] hover:bg-[var(--wiora-mist)] h-10 px-5 text-sm font-medium shadow-none";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid min-h-[min(640px,calc(100svh-5rem))] overflow-hidden rounded-[24px] border border-[var(--wiora-rule)] bg-[var(--wiora-paper)] md:grid-cols-2">
        <div className="flex flex-col justify-center px-7 py-10 md:px-14 md:py-14">
          <Link href="/" className="mb-10 flex w-fit items-center gap-2">
            <Image
              src="/logo-black.svg"
              alt="Wiora"
              width={22}
              height={22}
              className="size-[22px]"
            />
            <span className="text-[15px] font-medium leading-none tracking-tight">
              Wiora
            </span>
          </Link>
          <h1 className="text-[1.85rem] font-normal tracking-[-0.03em] md:text-[2.1rem]">
            {title}
          </h1>
          <p className="mt-2 max-w-[36ch] text-[15px] leading-relaxed text-[var(--wiora-mute)]">
            {subtitle}
          </p>
          <div className="mt-8">{children}</div>
        </div>

        <div className="auth-stage relative hidden overflow-hidden md:flex">
          <div className="mt-auto max-w-[22rem] p-10">
            <p className="text-[1.65rem] font-normal leading-snug tracking-[-0.03em] text-white">
              Meet the other side before it matters.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              One real conversation. Then the report of what to do next.
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs leading-relaxed text-[var(--wiora-mute)] *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-[var(--wiora-ink)]">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>
      </p>
    </div>
  );
}
