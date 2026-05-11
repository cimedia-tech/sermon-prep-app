import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    // Find upcoming sermons within 3 days that haven't been alerted
    const today = new Date();
    const threeDaysOut = new Date(today);
    threeDaysOut.setDate(today.getDate() + 3);

    const { data: upcoming, error } = await supabase
      .from("scripture_sheets")
      .select("*")
      .gte("week_date", today.toISOString().split("T")[0])
      .lte("week_date", threeDaysOut.toISOString().split("T")[0])
      .eq("is_processed", false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!upcoming || upcoming.length === 0) {
      return NextResponse.json({
        message: "No upcoming sermons needing alerts",
      });
    }

    const results = [];

    for (const sheet of upcoming) {
      // Send email reminder
      const { error: emailError } = await resend.emails.send({
        from: "Sermon Prep <alerts@sermonprep.app>",
        to: sheet.user_email,
        subject: `📖 Sermon Prep Reminder: ${sheet.sermon_title || sheet.anchor_scripture}`,
        html: `
          <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1a1a2e; font-size: 24px; border-bottom: 2px solid #e0d4b8; padding-bottom: 12px;">
              Sermon Prep Reminder
            </h1>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Your sermon is coming up on <strong>${new Date(sheet.week_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</strong>.
            </p>
            <div style="background: #f8f5ef; border-left: 4px solid #c9a96e; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #555; font-size: 14px;">Anchor Scripture</p>
              <p style="margin: 4px 0 0; color: #1a1a2e; font-size: 18px; font-weight: 600;">${sheet.anchor_scripture}</p>
              ${sheet.sermon_title ? `<p style="margin: 8px 0 0; color: #666; font-size: 14px;">Title: ${sheet.sermon_title}</p>` : ""}
            </div>
            <a href="${sheet.pdf_url}" style="display: inline-block; background: #1a1a2e; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">
              View Scripture Sheet →
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 32px;">
              Sent by Sermon Prep App
            </p>
          </div>
        `,
      });

      if (!emailError) {
        // Mark as processed
        await supabase
          .from("scripture_sheets")
          .update({ is_processed: true })
          .eq("id", sheet.id);

        results.push({ id: sheet.id, status: "sent" });
      } else {
        results.push({ id: sheet.id, status: "failed", error: emailError.message });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("Alert error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
