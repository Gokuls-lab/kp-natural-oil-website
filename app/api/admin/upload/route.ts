import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Admin operations not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Ensure bucket exists (auto-create if missing)
    const BUCKET = "product-images";
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const exists = buckets?.some((b: any) => b.name === BUCKET);
      if (!exists) {
        const { error: createErr } = await supabase.storage.createBucket(
          BUCKET,
          {
            public: true,
          }
        );
        if (createErr) {
          console.error("[upload POST] Failed to create bucket", createErr);
          return NextResponse.json(
            { error: "Bucket creation failed" },
            { status: 500 }
          );
        }
      }
    } catch (e) {
      console.error("[upload POST] Bucket ensure failed", e);
      return NextResponse.json(
        { error: "Failed to access storage" },
        { status: 500 }
      );
    }

    const contentType = file.type || "application/octet-stream";
    const ext = contentType.split("/")[1] || "bin";
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;
    const filePath = `products/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Retry logic for transient network failures (e.g., ECONNRESET)
    const MAX_RETRIES = 3;
    let attempt = 0;
    let uploadError: any = null;
    let uploadData: any = null;
    while (attempt < MAX_RETRIES) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, bytes, {
          contentType,
          upsert: false,
        });
      if (!error) {
        uploadData = data;
        uploadError = null;
        break;
      }
      uploadError = error;
      // Only retry on connection-related errors
      const msg = String(error.message || "").toLowerCase();
      if (
        !msg.includes("reset") &&
        !msg.includes("timeout") &&
        !msg.includes("terminated")
      ) {
        break; // non-transient error
      }
      attempt++;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }

    if (uploadError) {
      console.error("[upload POST] Error uploading file", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image after retries" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    return NextResponse.json(
      {
        success: true,
        path: uploadData?.path || filePath,
        publicUrl,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[upload POST] Unexpected error", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        diagnostics: { message: err?.message },
      },
      { status: 500 }
    );
  }
}
