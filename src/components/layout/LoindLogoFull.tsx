import Image from "next/image";

export function LoindLogoFull({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/LOIND BLACK_WHITE.png"
      alt="LOIND"
      width={1024}
      height={1024}
      priority
      className={className}
    />
  );
}
