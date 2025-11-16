"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  LogOut,
  Edit3,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Zap,
} from "lucide-react";
import { getAdminSession, clearAdminSession } from "@/lib/admin-auth";
import { Mail, Plus, UserPlus, Trash2, Edit } from "lucide-react";

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

export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [pricingData, setPricingData] = useState<PricingData>({
    currentPrice: "₹145",
    currentOffer: "20% OFF",
    isOfferActive: true,
  });
  const [editingPrice, setEditingPrice] = useState(false);
  const [editingOffer, setEditingOffer] = useState(false);
  const [tempPrice, setTempPrice] = useState("");
  const [tempOffer, setTempOffer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    image_urls: [] as string[],
  });
  const [selectedImages, setSelectedImages] = useState<FileList | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const session = await getAdminSession();
      if (!session) {
        router.push("/admin/login");
        return;
      }
      setAdminUser(session);
      fetchPricingData();
      fetchUsers();
      fetchProducts();
    })();
  }, [router]);

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

  const fetchUsers = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch(`/api/admin/users?page=1&perPage=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error("Failed to fetch users", e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error("Failed to fetch products", e);
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const { getSupabase } = await import("@/lib/supabase-client");
      const supabase = getSupabase?.();
      if (!supabase) return null;
      const result = await supabase.auth.getSession();
      return result.data.session?.access_token || null;
    } catch {
      return null;
    }
  };

  const handleCreateUser = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
        }),
      });
      if (res.ok) {
        setNewUserEmail("");
        setNewUserPassword("");
        await fetchUsers();
        setMessage({ type: "success", text: "User created successfully" });
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to create user");
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to create user" });
    }
    setIsLoading(false);
  };

  const handleCreateProduct = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      let imageUrl = productForm.image_url;
      let imageUrls: string[] = [];

      // If local files selected, upload each and collect URLs
      if (selectedImages && selectedImages.length > 0) {
        for (let i = 0; i < selectedImages.length; i++) {
          const file = selectedImages[i];
          const form = new FormData();
          form.append("file", file);
          const uploadRes = await fetch("/api/admin/upload", {
            method: "POST",
            body: form,
          });
          if (!uploadRes.ok) {
            const data = await uploadRes.json().catch(() => null);
            throw new Error(data?.error || `Failed to upload image ${i + 1}`);
          }
          const uploadData = await uploadRes.json();
          if (uploadData.publicUrl) imageUrls.push(uploadData.publicUrl);
        }
        if (imageUrls.length) imageUrl = imageUrls[0];
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productForm,
          image_url: imageUrl,
          image_urls: imageUrls.length ? imageUrls : undefined,
        }),
      });
      if (res.ok) {
        setProductForm({
          name: "",
          description: "",
          price: "",
          image_url: "",
          image_urls: [],
        });
        setSelectedImages(null);
        await fetchProducts();
        setMessage({ type: "success", text: "Product created successfully" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to create product");
      }
    } catch (e: any) {
      setMessage({
        type: "error",
        text: e.message || "Failed to create product",
      });
      setTimeout(() => setMessage(null), 3000);
    }
    setIsLoading(false);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    setIsLoading(true);
    setMessage(null);
    try {
      let imageUrl = productForm.image_url;
      let imageUrls = productForm.image_urls ? [...productForm.image_urls] : [];

      // If new local images chosen, upload and replace arrays
      if (selectedImages && selectedImages.length > 0) {
        imageUrls = [];
        for (let i = 0; i < selectedImages.length; i++) {
          const file = selectedImages[i];
          const form = new FormData();
          form.append("file", file);
          const uploadRes = await fetch("/api/admin/upload", {
            method: "POST",
            body: form,
          });
          if (!uploadRes.ok) {
            const data = await uploadRes.json().catch(() => null);
            throw new Error(data?.error || `Failed to upload image ${i + 1}`);
          }
          const uploadData = await uploadRes.json();
          if (uploadData.publicUrl) imageUrls.push(uploadData.publicUrl);
        }
        if (imageUrls.length) imageUrl = imageUrls[0];
      }

      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProduct.id,
          name: productForm.name,
          description: productForm.description,
          price: productForm.price,
          image_url: imageUrl,
          image_urls: imageUrls.length ? imageUrls : undefined,
        }),
      });
      if (res.ok) {
        setEditingProduct(null);
        setProductForm({
          name: "",
          description: "",
          price: "",
          image_url: "",
          image_urls: [],
        });
        await fetchProducts();
        setMessage({ type: "success", text: "Product updated successfully" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error("Failed to update product");
      }
    } catch (e: any) {
      setMessage({
        type: "error",
        text: e.message || "Failed to update product",
      });
      setTimeout(() => setMessage(null), 3000);
    }
    setIsLoading(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchProducts();
        setMessage({ type: "success", text: "Product deleted successfully" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error("Failed to delete product");
      }
    } catch (e: any) {
      setMessage({
        type: "error",
        text: e.message || "Failed to delete product",
      });
      setTimeout(() => setMessage(null), 3000);
    }
    setIsLoading(false);
  };

  const startEditingProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image_url: product.image_url || "",
      image_urls: product.image_urls || [],
    });
  };

  const cancelEditingProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      description: "",
      price: "",
      image_url: "",
      image_urls: [],
    });
  };

  const handleLogout = async () => {
    await clearAdminSession();
    router.push("/admin/login");
  };

  const handlePriceUpdate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/public/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: `₹${tempPrice}`,
          offer: pricingData.currentOffer,
          offerActive: pricingData.isOfferActive,
        }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setPricingData({
          currentPrice: updatedData.currentPrice,
          currentOffer: updatedData.currentOffer,
          isOfferActive: updatedData.isOfferActive,
        });
        setEditingPrice(false);
        setMessage({ type: "success", text: "Price updated successfully!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error("Failed to update price");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to update price. Please try again.",
      });
      setTimeout(() => setMessage(null), 3000);
    }
    setIsLoading(false);
  };

  const handleOfferUpdate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/public/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: pricingData.currentPrice,
          offer: tempOffer,
          offerActive: pricingData.isOfferActive,
        }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setPricingData({
          currentPrice: updatedData.currentPrice,
          currentOffer: updatedData.currentOffer,
          isOfferActive: updatedData.isOfferActive,
        });
        setEditingOffer(false);
        setMessage({ type: "success", text: "Offer updated successfully!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error("Failed to update offer");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to update offer. Please try again.",
      });
      setTimeout(() => setMessage(null), 3000);
    }
    setIsLoading(false);
  };

  const toggleOfferStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/public/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: pricingData.currentPrice,
          offer: pricingData.currentOffer,
          offerActive: !pricingData.isOfferActive,
        }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setPricingData({
          currentPrice: updatedData.currentPrice,
          currentOffer: updatedData.currentOffer,
          isOfferActive: updatedData.isOfferActive,
        });
        setMessage({
          type: "success",
          text: `Offer ${
            !pricingData.isOfferActive ? "activated" : "deactivated"
          } successfully!`,
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error("Failed to toggle offer status");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to update offer status. Please try again.",
      });
      setTimeout(() => setMessage(null), 3000);
    }
    setIsLoading(false);
  };

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      <div className="absolute inset-0 bg-[url('/coconut-palm-grove.jpg')] bg-cover bg-center opacity-10 dark:opacity-5 pointer-events-none"></div>

      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-emerald-200/50 dark:border-emerald-800/40 relative">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-black text-emerald-700 dark:text-emerald-100">
                Admin Dashboard
              </h1>
              <p className="text-emerald-600/70 dark:text-emerald-300/80 text-sm font-medium">
                KP Naturals Management
              </p>
            </div>
          </div>

          <div className="flex w-full sm:w-auto items-center gap-4 justify-between sm:justify-end flex-wrap">
            <div className="text-right">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-100">
                Welcome back!
              </p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-300/80">
                {adminUser.email}
              </p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 bg-transparent shrink-0"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        {message && (
          <Alert
            role="status"
            aria-live="polite"
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass border-emerald-200/50 dark:border-emerald-800/40 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-100">
                  Current Price
                </CardTitle>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {pricingData.currentPrice}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-emerald-200/50 dark:border-emerald-800/40 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-100">
                  Active Offer
                </CardTitle>
                <Zap className="w-4 h-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {pricingData.currentOffer}
              </div>
              <Badge
                className={`mt-2 ${
                  pricingData.isOfferActive
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300"
                }`}
              >
                {pricingData.isOfferActive ? "Active" : "Inactive"}
              </Badge>
            </CardContent>
          </Card>

          <Card className="glass border-emerald-200/50 dark:border-emerald-800/40 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-100">
                  Products
                </CardTitle>
                <Package className="w-4 h-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                3
              </div>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-300/80">
                Hair oil variants
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-emerald-200/50 dark:border-emerald-800/40 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-100">
                  Reviews
                </CardTitle>
                <Users className="w-4 h-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                500+
              </div>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-300/80">
                Customer reviews
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pricing" className="space-y-6">
          <TabsList className="glass border-emerald-200/50 dark:border-emerald-800/40 w-full overflow-x-auto whitespace-nowrap">
            <TabsTrigger
              value="pricing"
              className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/50 dark:data-[state=active]:text-emerald-100"
            >
              Price Management
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/50 dark:data-[state=active]:text-emerald-100"
            >
              Products
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/50 dark:data-[state=active]:text-emerald-100"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/50 dark:data-[state=active]:text-emerald-100"
            >
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pricing" className="space-y-6">
            <Card className="glass border-emerald-200/50 dark:border-emerald-800/40 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-serif font-black text-emerald-800 dark:text-emerald-100">
                  Product Pricing Control
                </CardTitle>
                <CardDescription className="text-emerald-600/70 dark:text-emerald-300/80">
                  Update product prices and offers. Changes will reflect
                  immediately on the website.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price Management */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Label className="text-emerald-700 dark:text-emerald-100 font-medium">
                        Product Price
                      </Label>
                      {!editingPrice && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPrice(true);
                            setTempPrice(
                              pricingData.currentPrice.replace("₹", "")
                            );
                          }}
                          className="border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/40"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>

                    {editingPrice ? (
                      <div className="flex flex-wrap gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600 dark:text-emerald-300">
                            ₹
                          </span>
                          <Input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            className="pl-8 border-emerald-200 focus:border-emerald-400 dark:border-emerald-800 dark:focus:border-emerald-600"
                            placeholder="145"
                          />
                        </div>
                        <Button
                          onClick={handlePriceUpdate}
                          disabled={isLoading}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingPrice(false)}
                          className="border-emerald-200 dark:border-emerald-800"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4 text-center">
                        {pricingData.currentPrice}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Label className="text-emerald-700 dark:text-emerald-100 font-medium">
                        Special Offer
                      </Label>
                      {!editingOffer && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingOffer(true);
                            setTempOffer(pricingData.currentOffer);
                          }}
                          className="border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/40"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>

                    {editingOffer ? (
                      <div className="flex flex-wrap gap-2">
                        <Input
                          value={tempOffer}
                          onChange={(e) => setTempOffer(e.target.value)}
                          className="border-emerald-200 focus:border-emerald-400 dark:border-emerald-800 dark:focus:border-emerald-600"
                          placeholder="20% OFF"
                        />
                        <Button
                          onClick={handleOfferUpdate}
                          disabled={isLoading}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingOffer(false)}
                          className="border-emerald-200 dark:border-emerald-800"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-4 text-center">
                        <Badge
                          className={`text-lg px-4 py-2 ${
                            pricingData.isOfferActive
                              ? "bg-red-500 text-white dark:bg-red-600"
                              : "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          <Zap className="w-4 h-4 mr-1" />
                          {pricingData.currentOffer}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Offer Toggle */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                  <div>
                    <h4 className="font-medium text-emerald-800 dark:text-emerald-100">
                      Offer Status
                    </h4>
                    <p className="text-sm text-emerald-600/70 dark:text-emerald-300/80">
                      {pricingData.isOfferActive
                        ? "Offer is currently active and visible to customers"
                        : "Offer is currently inactive"}
                    </p>
                  </div>
                  <Button
                    onClick={toggleOfferStatus}
                    disabled={isLoading}
                    className={`${
                      pricingData.isOfferActive
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600"
                    } text-white disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto`}
                  >
                    {pricingData.isOfferActive
                      ? "Deactivate Offer"
                      : "Activate Offer"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="glass border-emerald-200/50 dark:border-emerald-800/40 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-serif font-black text-emerald-800 dark:text-emerald-100">
                  Analytics Overview
                </CardTitle>
                <CardDescription className="text-emerald-600/70 dark:text-emerald-300/80">
                  Monitor your website performance and customer engagement.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-emerald-300 dark:text-emerald-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-emerald-700 dark:text-emerald-100 mb-2">
                    Analytics Coming Soon
                  </h3>
                  <p className="text-emerald-600/70 dark:text-emerald-300/80">
                    Detailed analytics and reporting features will be available
                    in the next update.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card className="glass border-emerald-200/50 dark:border-emerald-800/40 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-serif font-black text-emerald-800 dark:text-emerald-100">
                  Product Management
                </CardTitle>
                <CardDescription className="text-emerald-600/70 dark:text-emerald-300/80">
                  Add, edit, and manage your product catalog.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Form */}
                <div className="p-4 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-900/30">
                  <h4 className="font-medium text-emerald-800 dark:text-emerald-100 mb-4">
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-emerald-700 dark:text-emerald-100">
                        Name
                      </Label>
                      <Input
                        value={productForm.name}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="Product name"
                        className="border-emerald-200 focus:border-emerald-400 dark:border-emerald-800 dark:focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <Label className="text-emerald-700 dark:text-emerald-100">
                        Description
                      </Label>
                      <Textarea
                        value={productForm.description}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Product description"
                        className="border-emerald-200 focus:border-emerald-400 dark:border-emerald-800 dark:focus:border-emerald-600"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="text-emerald-700 dark:text-emerald-100">
                        Price (₹)
                      </Label>
                      <Input
                        type="number"
                        value={productForm.price}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            price: e.target.value,
                          })
                        }
                        placeholder="145"
                        className="border-emerald-200 focus:border-emerald-400 dark:border-emerald-800 dark:focus:border-emerald-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-emerald-700 dark:text-emerald-100">
                          Image URL (optional, legacy)
                        </Label>
                        <Input
                          value={productForm.image_url}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              image_url: e.target.value,
                            })
                          }
                          placeholder="/product1.png"
                          className="border-emerald-200 focus:border-emerald-400 dark:border-emerald-800 dark:focus:border-emerald-600 mb-2"
                        />
                      </div>
                      <div>
                        <Label className="text-emerald-700 dark:text-emerald-100">
                          Upload Images (multiple)
                        </Label>
                        <Input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => setSelectedImages(e.target.files)}
                          className="border-emerald-200 focus:border-emerald-400 dark:border-emerald-800 dark:focus:border-emerald-600"
                        />
                        {selectedImages && selectedImages.length > 0 && (
                          <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                            {selectedImages.length} image(s) selected
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {editingProduct ? (
                        <>
                          <Button
                            onClick={handleUpdateProduct}
                            disabled={
                              isLoading ||
                              !productForm.name ||
                              !productForm.description ||
                              !productForm.price
                            }
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Save className="w-4 h-4 mr-1" /> Update Product
                          </Button>
                          <Button
                            onClick={cancelEditingProduct}
                            variant="outline"
                            className="border-emerald-200 dark:border-emerald-800"
                          >
                            <X className="w-4 h-4 mr-1" /> Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={handleCreateProduct}
                          disabled={
                            isLoading ||
                            !productForm.name ||
                            !productForm.description ||
                            !productForm.price
                          }
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add Product
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Products List */}
                <div>
                  <h4 className="font-medium text-emerald-800 dark:text-emerald-100 mb-4">
                    Products ({products.length})
                  </h4>
                  {products.length === 0 ? (
                    <p className="text-emerald-700/70 dark:text-emerald-300/80 text-center py-8">
                      No products found. Add your first product above.
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {products.map((product) => (
                        <Card
                          key={product.id}
                          className="border-emerald-200/50 dark:border-emerald-800/40"
                        >
                          <CardHeader className="p-0">
                            <div className="relative h-48 overflow-hidden rounded-t-lg">
                              <img
                                src={product.image_url || "/placeholder.svg"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <CardTitle className="text-lg mb-2 text-emerald-800 dark:text-emerald-100">
                              {product.name}
                            </CardTitle>
                            <CardDescription className="text-sm mb-3 line-clamp-2">
                              {product.description}
                            </CardDescription>
                            <div className="flex items-center justify-between">
                              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                ₹{product.price}
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditingProduct(product)}
                                  className="border-emerald-200 dark:border-emerald-800"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDeleteProduct(product.id)
                                  }
                                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="glass border-emerald-200/50 dark:border-emerald-800/40 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-serif font-black text-emerald-800 dark:text-emerald-100">
                  User Management
                </CardTitle>
                <CardDescription className="text-emerald-600/70 dark:text-emerald-300/80">
                  Create new users and review existing accounts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 grid grid-cols-1 gap-3">
                    {users.length === 0 ? (
                      <p className="text-emerald-700/70 dark:text-emerald-300/80">
                        No users found.
                      </p>
                    ) : (
                      <div className="divide-y divide-emerald-100 dark:divide-emerald-900/50 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40 bg-white/60 dark:bg-gray-900/60">
                        {users.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center justify-between p-3"
                          >
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-emerald-500" />
                              <span className="text-sm text-emerald-900 dark:text-emerald-100 truncate max-w-[60vw] sm:max-w-none">
                                {u.email}
                              </span>
                            </div>
                            <span className="text-xs text-emerald-600/70 dark:text-emerald-300/80">
                              {u.role || "user"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-1">
                    <div className="space-y-3 p-4 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-900/30">
                      <h4 className="font-medium text-emerald-800 dark:text-emerald-100 flex items-center gap-2">
                        <UserPlus className="w-4 h-4" /> Add New User
                      </h4>
                      <div className="space-y-2">
                        <Label className="text-emerald-700 dark:text-emerald-100">
                          Email
                        </Label>
                        <Input
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="user@example.com"
                          className="border-emerald-200 focus:border-emerald-400 dark:border-emerald-800 dark:focus:border-emerald-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-emerald-700 dark:text-emerald-100">
                          Password
                        </Label>
                        <Input
                          type="password"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          placeholder="Minimum 8 characters"
                          className="border-emerald-200 focus:border-emerald-400 dark:border-emerald-800 dark:focus:border-emerald-600"
                        />
                      </div>
                      <Button
                        onClick={handleCreateUser}
                        disabled={
                          isLoading ||
                          !newUserEmail ||
                          newUserPassword.length < 8
                        }
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Create User
                      </Button>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-300/80">
                        New users are created with email confirmed.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
