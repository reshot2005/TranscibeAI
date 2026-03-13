import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { summarizeMeeting } from "./summarize.ts";
import { extractEntities } from "./entities.ts";
import { computeSpeakerAnalytics } from "./analytics.ts";
import { buildEmbeddings } from "./embeddings.ts";

type Env = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

type AnalyzeRequest = {
  recordingId: string;
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const env: Env = {
    SUPABASE_URL: Deno.env.get("SUPABASE_URL") ?? "",
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase env vars missing");
    return new Response("Server misconfigured", { status: 500 });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  let payload: AnalyzeRequest;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  try {
    // 1) Load merged transcript with speaker labels
    const { data: segments, error: segErr } = await supabase
      .from("transcript_segments")
      .select("*")
      .eq("recording_id", payload.recordingId)
      .order("start_ms", { ascending: true });

    if (segErr || !segments || segments.length === 0) {
      console.error("No transcript segments found", segErr);
      return new Response("Transcript not found", { status: 404 });
    }

    const fullTranscript = segments.map((s: any) =>
      `[${s.speaker}] ${s.text}`
    ).join("\n");

    const summary = await summarizeMeeting({ transcript: fullTranscript });
    const entities = await extractEntities({ transcript: fullTranscript });

    const analytics = computeSpeakerAnalytics({
      segments: segments.map((s: any) => ({
        speaker: s.speaker,
        start: s.start_ms,
        end: s.end_ms,
        text: s.text,
      })),
    });

    const embeddingChunks = await buildEmbeddings({
      transcript: fullTranscript,
    });

    // Persist analysis results
    await supabase.from("meeting_analysis").insert({
      recording_id: payload.recordingId,
      summary,
      entities,
      analytics,
    });

    if (embeddingChunks.length > 0) {
      await supabase.from("transcript_embeddings").insert(
        embeddingChunks.map((c) => ({
          recording_id: payload.recordingId,
          chunk_index: c.index,
          text: c.text,
          embedding: c.embedding,
        })),
      );
    }

    await supabase
      .from("recordings")
      .update({
        analysis_status: "completed",
      })
      .eq("id", payload.recordingId);

    return new Response(
      JSON.stringify({
        ok: true,
        recordingId: payload.recordingId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("analyze fatal error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});

