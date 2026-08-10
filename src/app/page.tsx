import Image from "next/image";
import Link from "next/link";

import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#1a1a1a] text-white">
      <nav className="absolute left-8 top-10 flex flex-col gap-1 text-lg font-light text-white/60 md:left-16 md:top-16 md:text-xl">
        <span>Creative</span>
        <span>Agency</span>
        <span>Studio</span>
        <span>Impact</span>
      </nav>

      <Link
        href={session?.user ? "/dashboard" : "/login"}
        className="absolute right-8 top-10 text-xs tracking-[0.3em] text-white/40 transition hover:text-white/80 md:right-16 md:top-16"
      >
        {session?.user ? "DASHBOARD" : "LOGIN"}
      </Link>

      <div className="absolute bottom-14 right-6 w-[70vw] max-w-2xl md:bottom-20 md:right-16">
        <Image
          src="/brand/loind-logo.png"
          alt="LOIND Corporation"
          width={589}
          height={234}
          className="h-auto w-full"
          priority
        />
      </div>
    </main>
  );
}
