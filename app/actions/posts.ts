"use server";

import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Server-side SHA-256 hashing. Produces identical output to the client-side
// hashPassword() in lib/supabase.ts (Web Crypto SHA-256, hex-encoded), so
// hashes created at post-creation time verify correctly here.
function hashPasswordServer(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export interface PostUpdateInput {
  category: "teamup" | "test";
  title: string;
  description: string;
  tags: string[];
  author: string;
  contact_type: string;
  contact_value: string;
  external_link: string | null;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

// Fetch a post's password hash using the admin client (server-only).
async function getPasswordHash(postId: string): Promise<string | null | undefined> {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("edit_password_hash")
    .eq("id", postId)
    .single();

  if (error || !data) return undefined; // post not found
  return data.edit_password_hash;
}

// Verify a post edit password on the server. Used by the detail page modal
// before allowing navigation to the edit form.
export async function verifyPostPassword(
  postId: string,
  password: string
): Promise<ActionResult> {
  if (!password) {
    return { success: false, error: "비밀번호를 입력해주세요" };
  }

  const storedHash = await getPasswordHash(postId);

  if (storedHash === undefined) {
    return { success: false, error: "벽보를 찾을 수 없습니다" };
  }
  if (storedHash === null) {
    return { success: false, error: "이 게시물은 수정할 수 없습니다" };
  }

  if (hashPasswordServer(password) !== storedHash) {
    return { success: false, error: "비밀번호가 일치하지 않습니다" };
  }

  return { success: true };
}

// Securely update a post. Re-verifies the password on the server before
// performing the UPDATE with the service-role client (bypasses RLS).
export async function updatePost(
  postId: string,
  password: string,
  input: PostUpdateInput
): Promise<ActionResult> {
  // 1. Re-verify the password server-side (never trust the client).
  const verification = await verifyPostPassword(postId, password);
  if (!verification.success) {
    return verification;
  }

  // 2. Basic server-side validation.
  if (!input.title?.trim() || !input.description?.trim() || !input.author?.trim()) {
    return { success: false, error: "필수 항목을 모두 입력해주세요" };
  }
  if (!input.contact_type?.trim() || !input.contact_value?.trim()) {
    return { success: false, error: "연락 정보를 입력해주세요" };
  }

  // 3. Perform the UPDATE with the admin client and confirm 1 row changed.
  const { data: updatedRows, error } = await supabaseAdmin
    .from("posts")
    .update({
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      tags: input.tags,
      author: input.author.trim(),
      contact_type: input.contact_type.trim(),
      contact_value: input.contact_value.trim(),
      external_link: input.external_link?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .select("id");

  if (error) {
    return { success: false, error: "수정 실패: " + error.message };
  }
  if (!updatedRows || updatedRows.length !== 1) {
    return { success: false, error: "수정이 저장되지 않았습니다" };
  }

  return { success: true };
}

// Securely close a post (모집 마감). Verifies the password server-side, then
// updates status with the service-role client.
export async function closePost(
  postId: string,
  password: string
): Promise<ActionResult> {
  const verification = await verifyPostPassword(postId, password);
  if (!verification.success) {
    return verification;
  }

  const { data: updatedRows, error } = await supabaseAdmin
    .from("posts")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .select("id");

  if (error) {
    return { success: false, error: "마감 처리 실패: " + error.message };
  }
  if (!updatedRows || updatedRows.length !== 1) {
    return { success: false, error: "마감 처리가 저장되지 않았습니다" };
  }

  return { success: true };
}
