import type { AiResponse, Category } from "@/services/ai/types";
import { supabase } from "@/services/supabase";

export interface SaveHistoryParams {
  userId: string;
  category: Category;
  submittedText?: string | null;
  localImageUri?: string | null;
  aiResponse: AiResponse;
}

export async function saveHistoryWithImage(params: SaveHistoryParams) {
  let imagePath: string | null = null;

  // 1. Upload image to Supabase Storage if a local URI exists
  if (params.localImageUri) {
    try {
      const fileExt =
        params.localImageUri.split(".").pop()?.toLowerCase() || "jpg";

      // CRITICAL: Must start with userId/ to satisfy the storage RLS policy
      const fileName = `${params.userId}/${Date.now()}.${fileExt}`;

      const response = await fetch(params.localImageUri);
      const blob = await response.blob();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("history-images")
        .upload(fileName, blob, {
          contentType: `image/${fileExt === "png" ? "png" : "jpeg"}`,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      if (uploadData) {
        imagePath = uploadData.path; // e.g., "uuid/timestamp.jpg"
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      throw err;
    }
  }

  // 2. Insert the record into the public.history table
  const { data, error } = await supabase
    .from("history")
    .insert({
      user_id: params.userId,
      category: params.category,
      submitted_text: params.submittedText || null,
      image_reference: imagePath,
      ai_response: params.aiResponse, // Handled as JSONB by Supabase
    })
    .select()
    .single();

  if (error) {
    console.error("Database insert error:", error.message);
    throw error;
  }

  return data;
}
