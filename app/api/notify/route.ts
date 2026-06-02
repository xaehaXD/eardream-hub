import { NextRequest, NextResponse } from "next/server";
import { categoryLabels } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      category,
      author,
      contactType,
      contactValue,
      deadline,
      postId,
    } = body;

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      console.log("[v0] DISCORD_WEBHOOK_URL not configured, skipping notification");
      return NextResponse.json({ success: true, skipped: true });
    }

    // Build the post URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://eardream-hub.vercel.app";
    const postUrl = `${baseUrl}/posters/${postId}`;

    // Build the embed message
    const embed = {
      title: "새 벽보가 붙었습니다!",
      color: 0x4ade80, // Green color
      fields: [
        {
          name: "제목",
          value: title,
          inline: false,
        },
        {
          name: "유형",
          value: categoryLabels[category as keyof typeof categoryLabels] || category,
          inline: true,
        },
        {
          name: "작성자",
          value: author,
          inline: true,
        },
        {
          name: "연락 방법",
          value: `${contactType}: ${contactValue}`,
          inline: false,
        },
      ],
      url: postUrl,
      timestamp: new Date().toISOString(),
      footer: {
        text: "이어드림 허브",
      },
    };

    // Add deadline field if exists
    if (deadline) {
      embed.fields.push({
        name: "마감일",
        value: deadline,
        inline: true,
      });
    }

    // Add link field
    embed.fields.push({
      name: "바로가기",
      value: `[벽보 보러가기](${postUrl})`,
      inline: false,
    });

    const discordPayload = {
      embeds: [embed],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(discordPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("[v0] Discord webhook failed:", response.status, errorText);
      // Don't throw - we don't want to fail the post creation
      return NextResponse.json({ success: false, error: "Webhook failed" });
    }

    console.log("[v0] Discord notification sent successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("[v0] Discord notification error:", error);
    // Don't throw - we don't want to fail the post creation
    return NextResponse.json({ success: false, error: "Notification error" });
  }
}
