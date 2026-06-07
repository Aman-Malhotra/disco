import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { chatApi, chatKeys, useSessions } from "@/entities/chat";

import { lastOpen } from "../model/lastOpen";
import { useChatStream } from "../model/useChatStream";
import { MainArea } from "./MainArea";
import { SidePanel } from "./SidePanel";

export function WorkspaceShell() {
  const qc = useQueryClient();
  const stream = useChatStream();
  const { data: list } = useSessions();

  const [activeId, setActiveId] = useState<string | null>(() => lastOpen.get());
  const [inflight, setInflight] = useState<string | null>(null);

  // Clear optimistic state shortly after a turn ends (persisted refetch lands).
  useEffect(() => {
    if (!stream.streaming && inflight) {
      const t = setTimeout(() => {
        setInflight(null);
        stream.reset();
      }, 400);
      return () => clearTimeout(t);
    }
  }, [stream.streaming, inflight, stream]);

  // Drop a stale last-open id (e.g. after `make db-clean`) once the list loads.
  useEffect(() => {
    if (
      activeId &&
      list &&
      !stream.streaming &&
      !inflight &&
      !list.items.some((s) => s.id === activeId)
    ) {
      setActiveId(null);
      lastOpen.clear();
    }
  }, [activeId, list, stream.streaming, inflight]);

  const openConversation = (id: string) => {
    setActiveId(id);
    lastOpen.set(id);
  };

  const newConversation = () => {
    setActiveId(null);
    lastOpen.clear();
    stream.reset();
    setInflight(null);
  };

  const handleSend = async (message: string) => {
    setInflight(message);
    let id = activeId;
    if (!id) {
      const session = await chatApi.createSession();
      id = session.id;
      setActiveId(id);
      lastOpen.set(id);
      await qc.invalidateQueries({ queryKey: chatKeys.list() });
    }
    await stream.run(id, message);
  };

  return (
    <div className="flex h-dvh overflow-hidden">
      <SidePanel activeId={activeId} onSelect={openConversation} onNew={newConversation} />
      <main className="relative flex-1 overflow-hidden">
        <MainArea activeId={activeId} inflight={inflight} stream={stream} onSend={handleSend} />
      </main>
    </div>
  );
}
