"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase-client";

type Product = {
  id?: string;
  name?: string;
  image_url?: string | null;
  image_urls?: string[] | null;
};

const FALLBACK_IMAGES = [
  {
    src: "/product-carousel-1.png",
    alt: "KP Naturals Hair Oil with Hibiscus and Coconuts",
  },
  {
    src: "/product-carousel-2.png",
    alt: "KP Pure Coconut Rosemary Hair Oil Logo",
  },
  {
    src: "/coconut-farm-harvest.png",
    alt: "Fresh Coconut Harvesting at KP Farm",
  },
  {
    src: "/coconut-shells-processed.png",
    alt: "Processed Coconut Shells After Oil Extraction",
  },
  {
    src: "/fresh-coconut-halves.png",
    alt: "Fresh Coconut Halves Ready for Oil Processing",
  },
  {
    src: "/product-carousel-3.png",
    alt: "KP Naturals Hair Oil with Natural Ingredients",
  },
];

export function ProductCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] =
    useState<{ src: string; alt: string }[]>(FALLBACK_IMAGES);

  useEffect(() => {
    let mounted = true;

    async function fetchProductsClient() {
      try {
        if (!isSupabaseConfigured()) return; // keep fallbacks
        const supabase = getSupabase();
        if (!supabase) return;

        const { data, error } = await supabase
          .from("products")
          .select("name,image_url,image_urls")
          .order("created_at", { ascending: false })
          .limit(12);

        if (error) {
          console.warn("ProductCarousel: supabase error", error);
          return; // keep fallbacks
        }

        const products: Product[] = data || [];
        const uploaded: { src: string; alt: string }[] = [];

        for (const p of products) {
          const arr = (p as any).image_urls as string[] | undefined;
          if (Array.isArray(arr) && arr.length) {
            for (const u of arr)
              if (u) uploaded.push({ src: u, alt: p.name || "Product image" });
            continue;
          }
          if (p.image_url)
            uploaded.push({ src: p.image_url, alt: p.name || "Product image" });
        }

        if (mounted) {
          if (uploaded.length) {
            const seen = new Set<string>();
            const combined: { src: string; alt: string }[] = [];
            for (const u of uploaded) {
              if (!seen.has(u.src)) {
                combined.push(u);
                seen.add(u.src);
              }
            }
            // Fill with fallbacks to reach at least 6 slides
            for (const f of FALLBACK_IMAGES) {
              if (combined.length >= 6) break;
              if (!seen.has(f.src)) {
                combined.push(f);
                seen.add(f.src);
              }
            }
            setImages(combined);
            setCurrentIndex(0);
          } else {
            // no uploads -> keep defaults already set
          }
        }
      } catch (e) {
        // Network failure on client: keep fallbacks silently
        console.warn("ProductCarousel: client fetch failed", e);
      }
    }

    fetchProductsClient();
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (!images || images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [images]);

  const goToPrevious = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>

      <div className="relative w-full max-w-3xl h-56 sm:h-64 md:h-[32rem] rounded-3xl overflow-hidden shadow-2xl glass transition-shadow duration-500 mx-auto">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-transparent via-transparent to-primary/10 pointer-events-none z-10"></div>

        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === currentIndex
                ? "opacity-100 transform translate-x-0"
                : index < currentIndex
                ? "opacity-0 transform -translate-x-full"
                : "opacity-0 transform translate-x-full"
            }`}
          >
            <img
              src={image.src || "/placeholder.svg"}
              alt={image.alt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-colors duration-300 text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-colors duration-300 text-white"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
