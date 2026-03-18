import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { arbitrateTranscripts } from "../transcribe/arbitrate.ts";

type Env = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ASSEMBLYAI_WEBHOOK_SECRET: string;
};

// Allow unauthenticated webhook calls (AssemblyAI can't send Supabase JWTs).
export const config = {
  auth: {
    verifyJWT: false,
  },
};

// Shape of AssemblyAI webhook payload (simplified)
type AssemblyAIWebhook = {
  id: string;
  status: "completed" | "error" | string;
  text: string;
  words?: { text: string; start: number; end: number; confidence: number }[];
  confidence?: number;
  metadata?: { recording_id?: string };
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const env: Env = {
    SUPABASE_URL: Deno.env.get("SUPABASE_URL") ?? "",
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    ASSEMBLYAI_WEBHOOK_SECRET: Deno.env.get("ASSEMBLYAI_WEBHOOK_SECRET") ?? "",
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase env vars missing");
    return new Response("Server misconfigured", { status: 500 });
  }

  if (!env.ASSEMBLYAI_WEBHOOK_SECRET) {
    console.error("ASSEMBLYAI_WEBHOOK_SECRET missing");
    return new Response("Server misconfigured", { status: 500 });
  }

  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("x-webhook-secret");
  if (authHeader !== `Bearer ${env.ASSEMBLYAI_WEBHOOK_SECRET}`) {
    console.error("webhook auth failed", {
      route: "webhook-assemblyai",
      time: new Date().toISOString(),
    });
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  let payload: AssemblyAIWebhook;
  try {
    payload = await req.json();
  } catch {
    console.error("Invalid JSON in webhook");
    return new Response("Invalid JSON", { status: 400 });
  }

  if (payload.status !== "completed") {
    return new Response("Ignored", { status: 200 });
  }

  const url = new URL(req.url);
  const recordingId =
    payload.metadata?.recording_id ?? url.searchParams.get("recording_id") ?? undefined;
  if (!recordingId) {
    console.error("Missing recording_id in webhook metadata");
    return new Response("Missing metadata", { status: 400 });
  }

  try {
    // 1) Load Whisper secondary transcript
    const { data: secondary, error: secErr } = await supabase
      .from("secondary_transcripts")
      .select("*")
      .eq("recording_id", recordingId)
      .eq("engine", "whisper_groq")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (secErr) {
      console.error("Secondary transcript fetch error", secErr);
    }

    // 2) Build AssemblyAITranscript + WhisperGroqTranscript views
    const assemblyTranscript = {
      id: payload.id,
      languageCode: undefined,
      segments: [
        {
          text: payload.text,
          start: payload.words?.[0]?.start ?? 0,
          end: payload.words?.[payload.words.length - 1]?.end ?? 0,
          confidence: payload.confidence ?? 0.9,
          words: (payload.words ?? []).map((w) => ({
            text: w.text,
            start: w.start,
            end: w.end,
            confidence: w.confidence,
          })),
        },
      ],
      confidence: payload.confidence ?? 0.9,
    };

    const whisperTranscript = secondary?.payload ?? {
      segments: [],
      language: undefined,
    };

    const arbitration = arbitrateTranscripts(
      assemblyTranscript,
      whisperTranscript,
    );

    const durationSeconds =
      arbitration.tokens.length > 0
        ? arbitration.tokens[arbitration.tokens.length - 1].end / 1000
        : null;

    // 3) Persist merged transcript as segments
    const segments = arbitration.tokens.map((t, idx) => ({
      recording_id: recordingId,
      index: idx,
      speaker: "UNKNOWN", // will be filled after diarization+alignment
      start_ms: t.start,
      end_ms: t.end,
      text: t.text,
      confidence: t.confidence,
      source: t.source,
      low_confidence: t.lowConfidence,
    }));

    await supabase.from("transcript_segments").insert(segments);

    await supabase
      .from("recordings")
      .update({
        transcription_status: "completed",
        status: "processed",
        estimated_accuracy: arbitration.estimatedAccuracy,
        duration_seconds: durationSeconds,
      })
      .eq("id", recordingId);

    // 4) Optionally trigger downstream diarize + analyze
    // (Can also be scheduled via pg_cron/pgmq instead of direct HTTP)
    await fetch(
      `${env.SUPABASE_URL}/functions/v1/diarize`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordingId }),
      },
    ).catch((err) => console.error("Failed to trigger diarize", err));

    await fetch(
      `${env.SUPABASE_URL}/functions/v1/analyze`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordingId }),
      },
    ).catch((err) => console.error("Failed to trigger analyze", err));

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("webhook-assemblyai fatal error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});

