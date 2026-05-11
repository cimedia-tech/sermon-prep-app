import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const weekDate = formData.get("week_date") as string;
    const anchorScripture = formData.get("anchor_scripture") as string;
    const userEmail = formData.get("user_email") as string;
    const sermonTitle = formData.get("sermon_title") as string;

    if (!file || !weekDate || !anchorScripture || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Upload PDF to Supabase Storage
    const fileName = `${Date.now()}_${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("scripture-sheets")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("scripture-sheets").getPublicUrl(fileName);

    // Save record to database
    const { data, error } = await supabase.from("scripture_sheets").insert({
      pdf_url: publicUrl,
      week_date: weekDate,
      anchor_scripture: anchorScripture,
      user_email: userEmail,
      sermon_title: sermonTitle || null,
    }).select().single();

    if (error) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Scripture sheet uploaded successfully",
      data,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
