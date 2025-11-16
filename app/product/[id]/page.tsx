"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { ProductImageCarousel } from "@/components/product-image-carousel";
import { useLanguage } from "@/components/language-provider";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  created_at: string;
}

interface Review {
  id: string;
  product_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [reviewForm, setReviewForm] = useState({
    user_name: "",
    rating: 5,
    comment: "",
  });

  useEffect(() => {
    fetchProductAndReviews();
  }, [productId]);

  const fetchProductAndReviews = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch product details
      const productRes = await fetch(`/api/products/${productId}`);
      if (!productRes.ok) {
        throw new Error("Product not found");
      }
      const productData = await productRes.json();
      setProduct(productData.product);

      // Fetch reviews
      const reviewsRes = await fetch(`/api/reviews?product_id=${productId}`);
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData.reviews || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          user_name: reviewForm.user_name,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      setMessage({ type: "success", text: "Review submitted successfully!" });
      setReviewForm({ user_name: "", rating: 5, comment: "" });

      // Refresh reviews
      const reviewsRes = await fetch(`/api/reviews?product_id=${productId}`);
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData.reviews || []);
      }

      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to submit review",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppOrder = () => {
    if (!product) return;
    const message = encodeURIComponent(
      `Hi! I'd like to order ${product.name} at ₹${product.price}. Can you provide more details?`
    );
    window.open(`https://wa.me/916381248615?text=${message}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Product Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error || "The product you're looking for doesn't exist."}
            </p>
            <Button onClick={() => router.push("/products")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>

        {message && (
          <Alert
            className={`mb-6 ${
              message.type === "success"
                ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <AlertDescription
              className={
                message.type === "success"
                  ? "text-green-700 dark:text-green-200"
                  : "text-red-700 dark:text-red-200"
              }
            >
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Product Details */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="relative rounded-lg overflow-hidden shadow-lg h-[320px] sm:h-[400px] md:h-[500px] bg-muted">
            {(() => {
              const images = (product as any).image_urls?.length
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
                  images={images}
                  alt={product.name}
                  intervalMs={4000}
                />
              );
            })()}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-serif font-black text-foreground mb-4">
                {product.name}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-primary">
                ₹{product.price}
              </span>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(averageRating)
                            ? "fill-accent text-accent"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({reviews.length} reviews)
                  </span>
                </div>
              )}
            </div>

            <Button
              onClick={handleWhatsAppOrder}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Order via WhatsApp
            </Button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-serif font-black text-foreground mb-6">
              Customer Reviews
            </h2>

            {/* Review Form */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Write a Review</CardTitle>
                <CardDescription>
                  Share your experience with this product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Your Name
                    </label>
                    <Input
                      value={reviewForm.user_name}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          user_name: e.target.value,
                        })
                      }
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Rating
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setReviewForm({ ...reviewForm, rating: star })
                          }
                          className="p-1"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= reviewForm.rating
                                ? "fill-accent text-accent"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Your Review
                    </label>
                    <Textarea
                      value={reviewForm.comment}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          comment: e.target.value,
                        })
                      }
                      placeholder="Tell us about your experience..."
                      rows={4}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Review"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {review.user_name}
                        </CardTitle>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? "fill-accent text-accent"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <CardDescription>
                        {new Date(review.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.comment}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No reviews yet. Be the first to review this product!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
