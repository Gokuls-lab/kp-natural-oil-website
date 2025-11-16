"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Leaf,
  Shield,
  Heart,
  CheckCircle,
  Users,
  Award,
  ArrowLeft,
  Zap,
  Loader2,
  ShoppingCart,
  Eye,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { useLanguage } from "@/components/language-provider";
import Link from "next/link";
import { ProductImageCarousel } from "@/components/product-image-carousel";

interface PricingData {
  currentPrice: string;
  currentOffer: string;
  isOfferActive: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  image_urls?: string[] | null;
  created_at: string;
}

export default function ProductsPage() {
  const { t } = useLanguage();
  const [pricingData, setPricingData] = useState<PricingData>({
    currentPrice: "₹145",
    currentOffer: "20% OFF",
    isOfferActive: true,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        const response = await fetch("/api/public/pricing");
        if (response.ok) {
          const data = await response.json();
          setPricingData(data);
        }
      } catch (error) {
        console.error("Failed to fetch pricing data:", error);
      }
    };

    fetchPricingData();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchPricingData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = (productName?: string, productPrice?: number) => {
    const name = productName || "KP Naturals";
    const price = productPrice ? `₹${productPrice}` : pricingData.currentPrice;
    const message = encodeURIComponent(
      `Hi! I'm interested in ${name} at ${price}. Can you tell me more about your sulfur-free hair oil?`
    );
    window.open(`https://wa.me/916381248615?text=${message}`, "_blank");
  };

  const benefits = [
    {
      icon: Shield,
      title: t("product.benefit.sulfur.title"),
      description: t("product.benefit.sulfur.desc"),
    },
    {
      icon: Heart,
      title: t("product.benefit.nourish.title"),
      description: t("product.benefit.nourish.desc"),
    },
    {
      icon: Leaf,
      title: t("product.benefit.natural.title"),
      description: t("product.benefit.natural.desc"),
    },
    {
      icon: CheckCircle,
      title: t("product.benefit.results.title"),
      description: t("product.benefit.results.desc"),
    },
    {
      icon: Users,
      title: t("product.benefit.types.title"),
      description: t("product.benefit.types.desc"),
    },
    {
      icon: Award,
      title: t("product.benefit.quality.title"),
      description: t("product.benefit.quality.desc"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Global SiteHeader is rendered from app/layout.tsx */}
      <div className="container mx-auto px-3 sm:px-4 py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">{t("product.back")}</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>

      <section className="py-6 sm:py-12 md:py-20 bg-gradient-to-br from-card to-background">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-12 md:mb-16">
            <Badge className="bg-accent text-accent-foreground w-fit mx-auto text-xs sm:text-sm px-2 sm:px-3 py-1 mb-4">
              {t("product.badge")}
            </Badge>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-serif font-black text-foreground leading-tight mb-4">
              {t("product.title")}
              <span className="text-primary block sm:inline">
                {" "}
                {t("product.subtitle")}
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
              {t("product.description")}
            </p>
          </div>

          {/* Products Grid from Supabase */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="border-border bg-card hover:shadow-xl transition-all duration-300 group"
                >
                  <CardHeader className="p-0">
                    <div className="relative overflow-hidden rounded-t-lg h-64">
                      {(() => {
                        const carouselImages = (product as any).image_urls
                          ?.length
                          ? (product as any).image_urls
                          : product.image_url
                          ? [
                              product.image_url,
                              "/product-carousel-1.png",
                              "/product-carousel-2.png",
                              "/product-carousel-3.png",
                            ]
                          : [
                              "/product-carousel-1.png",
                              "/product-carousel-2.png",
                              "/product-carousel-3.png",
                            ];
                        return (
                          <ProductImageCarousel
                            images={carouselImages}
                            alt={product.name}
                          />
                        );
                      })()}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <CardTitle className="font-serif font-bold text-card-foreground text-xl mb-2">
                        {product.name}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground leading-relaxed text-sm line-clamp-3">
                        {product.description}
                      </CardDescription>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        ₹{product.price}
                      </span>
                      {pricingData.isOfferActive && (
                        <Badge className="bg-red-600 text-white border-0 text-xs shadow-sm">
                          <Zap className="w-3 h-3 mr-1" />
                          {pricingData.currentOffer}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/product/${product.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          className="w-full border-primary text-primary hover:bg-primary hover:text-white"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <Button
                        onClick={() =>
                          handleWhatsAppClick(product.name, product.price)
                        }
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="max-w-md mx-auto">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No products available at the moment. Check back soon!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <section className="py-6 sm:py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-12 md:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-black text-foreground mb-3 sm:mb-4">
              {t("product.benefits.title")}
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4">
              {t("product.benefits.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="border-border bg-card hover:shadow-lg transition-shadow"
              >
                <CardHeader className="p-4 sm:p-6">
                  <benefit.icon className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary mb-3 sm:mb-4" />
                  <CardTitle className="font-serif font-bold text-card-foreground text-base sm:text-lg md:text-xl">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <CardDescription className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-6 sm:py-12 md:py-20 bg-card/30">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-12 md:mb-16">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-black text-foreground mb-3 sm:mb-4">
              {t("product.ingredients.title")}
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4">
              {t("product.ingredients.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
            {[
              {
                name: t("product.ingredient.hibiscus"),
                benefit: t("product.ingredient.hibiscus.benefit"),
                image: "/red-hibiscus-ingredient.png",
              },
              {
                name: t("product.ingredient.coconut"),
                benefit: t("product.ingredient.coconut.benefit"),
                image: "/coconut-oil-natural-organic.png",
              },
              {
                name: t("product.ingredient.secret"),
                benefit: t("product.ingredient.secret.benefit"),
                image: "/natural-herbs-blend.png",
              },
              {
                name: t("product.ingredient.rosemary"),
                benefit: t("product.ingredient.rosemary.benefit"),
                image: "/fresh-rosemary.png",
              },
            ].map((ingredient, index) => (
              <Card
                key={index}
                className="border-border bg-card hover:shadow-lg transition-shadow text-center"
              >
                <CardHeader className="p-2 sm:p-3 md:p-4 lg:p-6">
                  <img
                    src={ingredient.image}
                    alt={ingredient.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto rounded-full object-cover mb-2 sm:mb-3"
                  />
                  <CardTitle className="font-serif font-bold text-card-foreground text-xs sm:text-sm md:text-base lg:text-lg">
                    {ingredient.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-3 md:p-4 lg:p-6 pt-0">
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                    {ingredient.benefit}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-6 sm:py-12 md:py-20">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6 sm:mb-12 md:mb-16">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-black text-foreground mb-3 sm:mb-4">
                How to Use
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                Follow these simple steps for best results
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <Card className="border-border bg-card text-center">
                <CardHeader>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl sm:text-2xl font-bold text-primary">
                      1
                    </span>
                  </div>
                  <CardTitle className="font-serif font-bold text-card-foreground text-lg sm:text-xl">
                    Apply
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Apply oil to scalp and hair roots. Massage gently for 5-10
                    minutes.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card text-center">
                <CardHeader>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl sm:text-2xl font-bold text-primary">
                      2
                    </span>
                  </div>
                  <CardTitle className="font-serif font-bold text-card-foreground text-lg sm:text-xl">
                    Wait
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Leave oil for 2-3 hours or overnight for deep nourishment.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card text-center sm:col-span-2 lg:col-span-1">
                <CardHeader>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl sm:text-2xl font-bold text-primary">
                      3
                    </span>
                  </div>
                  <CardTitle className="font-serif font-bold text-card-foreground text-lg sm:text-xl">
                    Wash
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Wash with mild shampoo. Use 2-3 times per week for 3 months.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 sm:mt-12 text-center">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 sm:p-6 rounded-lg border border-amber-200 dark:border-amber-800">
                <h3 className="font-serif font-bold text-foreground mb-2 text-base sm:text-lg">
                  Important Note
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  For best results, use consistently for 3 months. Natural
                  ingredients take time to show their full benefits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-foreground mb-4">
            Ready to Transform Your Hair?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of satisfied customers who have experienced the
            natural benefits of our sulfur-free hair oil.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <Button
              size="lg"
              onClick={() => handleWhatsAppClick()}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg border-0 w-full sm:w-auto"
            >
              Order Now - {pricingData.currentPrice}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent w-full sm:w-auto"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      <WhatsAppButton />
    </div>
  );
}
