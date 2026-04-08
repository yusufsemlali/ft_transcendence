"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatShell } from "@/components/chat/ChatShell";

function ChatPageInner() {
  const searchParams = useSearchParams();
  const room = searchParams.get("room");

  return <ChatShell initialRoom={room ?? undefined} />;
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}
