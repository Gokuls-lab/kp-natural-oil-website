"use client";

import { useEffect, useState, useMemo } from "react";

interface Props {
  images: string[];
  intervalMs?: number;
  alt: string;
  minSlides?: number;
}

const FALLBACK_SOURCES = [
  "/product-carousel-1.png",
  "/product-carousel-2.png",
  "/product-carousel-3.png",
  "/coconut-farm-harvest.png",
  "/coconut-shells-processed.png",
];

export function ProductImageCarousel({
  images,
  intervalMs = 3500,
  alt = "Product image",
  minSlides = 3,
}: Props) {
  // Combine uploaded images with fallback web images to ensure carousel looks full
  const combined = useMemo(() => {
    const safe = (images ?? []).filter(Boolean);
    const out: string[] = [];
    const seen = new Set<string>();
    for (const s of safe) {
      if (!seen.has(s)) {
        out.push(s);
        seen.add(s);
      }
    }
    // append fallbacks until minSlides reached
    for (const f of FALLBACK_SOURCES) {
      if (out.length >= minSlides) break;
      if (!seen.has(f)) {
        out.push(f);
        seen.add(f);
      }
    }
    // if still empty (unlikely), add a placeholder
    if (out.length === 0) out.push("/placeholder.svg");
    return out;
  }, [images, minSlides]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (combined.length <= 1) return; // no rotation needed
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % combined.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [combined.length, intervalMs]);

  // Keep index in range when slide set changes
  useEffect(() => {
    setIndex(0);
  }, [combined.join("|")]);

  const current = combined[index] || "/placeholder.svg";

  return (
    <div className="relative h-full w-full overflow-hidden group">
      <img
        src={current}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      {/* Simple dots */}
      {combined.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {combined.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i === index ? "bg-white" : "bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
