import Image from "next/image";

export function LoindLogoFull({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/loind-logo-full.png"
      alt="LOIND CREATOR GROUND"
      width={900}
      height={900}
      priority
      className={className}
    />
  );
}
