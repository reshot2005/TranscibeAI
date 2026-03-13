import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// NOTE: Supabase Edge Functions do not currently provide a full
// WebSocket server runtime; this file documents the intended shape
// of a streaming handler that would sit in front of AssemblyAI's
// real-time WebSocket and broadcast via Supabase Realtime.

serve((_req) => {
  return new Response(
    "stream-transcribe is a placeholder. Implement real-time WebSocket relay using a compatible runtime (e.g. Vercel Edge, custom Node server) that:\n" +
      "- Accepts 16kHz mono PCM Int16 frames from client\n" +
      "- Forwards to AssemblyAI realtime websocket\n" +
      "- Broadcasts final transcripts via Supabase Realtime.",
    { status: 200, headers: { "Content-Type": "text/plain" } },
  );
});

