"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import EditorShell from "@/components/editor/editor-shell";

// Next 16 Cache Components: hook dinamis (useParams) harus dalam <Suspense>
// saat prerender — shell statis dirender dulu, id masuk setelah streaming.
export default function EditorPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Memuat editor…</div>}>
      <EditorInner />
    </Suspense>
  );
}

function EditorInner() {
  const params = useParams<{ id: string }>();
  return <EditorShell siteId={params?.id ?? "draft"} />;
}
