import { useEffect, useRef, useState } from "react";
import type { Person } from "@irlnow/domain";
import { nextReply } from "@irlnow/domain";
import { useApp } from "@/lib/store";

/**
 * Simulates the other side of a conversation: after you send, someone
 * starts typing and then replies. Replies persist in the store.
 */
export function useLiveThread(p: { threadId: string; responders: Person[]; dm: boolean }) {
  const { liveReplies, pushLiveReply, markThreadRead } = useApp();
  const [typing, setTyping] = useState<Person | null>(null);
  const turn = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    markThreadRead(p.threadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.threadId]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  function triggerReply() {
    const reply = nextReply({
      threadId: p.threadId,
      turn: turn.current++,
      responders: p.responders,
      dm: p.dm,
    });
    if (!reply) return;
    timers.current.push(
      setTimeout(() => {
        setTyping(reply.author);
        timers.current.push(
          setTimeout(() => {
            setTyping(null);
            pushLiveReply({
              id: `${p.threadId}-live-${Date.now()}`,
              threadId: p.threadId,
              authorId: reply.author.id,
              text: reply.text,
              at: Date.now(),
            });
          }, reply.typingMs),
        );
      }, reply.delayMs),
    );
  }

  return { typing, triggerReply, replies: liveReplies[p.threadId] ?? [] };
}
