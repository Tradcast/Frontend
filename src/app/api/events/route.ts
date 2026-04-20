import { getRoundState, subscribeRound } from "@/lib/telegram-round-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      send({ type: "round-state", ...getRoundState() });

      unsubscribe = subscribeRound(({ active, endTimeMs }) => {
        send({ type: "new-round", active, endTimeMs });
      });

      heartbeat = setInterval(() => {
        send({ type: "heartbeat", now: Date.now() });
      }, 25_000);
    },
    cancel() {
      if (unsubscribe) unsubscribe();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
