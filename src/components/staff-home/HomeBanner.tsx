"use client";

import { useEffect, useState } from "react";

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
}

const ROTATE_MS = 6000;

export function HomeBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/banners")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setBanners(data.banners);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const current = banners[index % banners.length];
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current.imageUrl}
      alt="배너"
      className="h-[140px] w-full object-cover transition-opacity duration-500"
    />
  );

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {current.linkUrl ? (
        <a href={current.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
          {image}
        </a>
      ) : (
        <div className="block">{image}</div>
      )}
      {banners.length > 1 && (
        <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setIndex(i)}
              className={`h-1.5 cursor-pointer rounded-full transition-all ${
                i === index ? "w-4 bg-white" : "w-1.5 bg-white/50"
              }`}
              aria-label={`배너 ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
