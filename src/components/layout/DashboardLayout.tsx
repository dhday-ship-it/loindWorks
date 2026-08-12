"use client";

import { ParticleBackground } from "@/components/ParticleBackground";

interface DashboardLayoutProps {
  nav: React.ReactNode;
  sidebar: React.ReactNode;
  main: React.ReactNode;
  rightPanel: React.ReactNode;
}

export function DashboardLayout({
  nav,
  sidebar,
  main,
  rightPanel,
}: DashboardLayoutProps) {
  return (
    <div className="font-[family-name:var(--font-dm-sans)] relative flex min-h-screen flex-col text-white">
      <ParticleBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        {nav}

        <div className="w-full px-6 pb-4 pt-6 md:px-10">
          <h2 className="font-[family-name:var(--font-quicksand)] text-3xl font-bold leading-none tracking-tight text-white/90 md:text-4xl">
            LOIND CORPORATION
          </h2>
        </div>

        <div className="flex flex-1 items-stretch gap-6 px-6 pb-6 md:px-10 md:pb-8">
          <div className="glass-panel flex flex-1 overflow-hidden rounded-2xl shadow-2xl">
            {sidebar}
            {main}
          </div>

          <div className="glass-panel hidden h-full w-[340px] shrink-0 flex-col gap-6 rounded-2xl p-7 shadow-2xl md:flex">
            {rightPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
