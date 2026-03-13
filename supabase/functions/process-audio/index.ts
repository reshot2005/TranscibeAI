import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { validateAndIntrospect } from "./validate.ts";
import { preprocessAndNormalize } from "./preprocess.ts";
import { chunkLongAudio } from "./chunk.ts";

type Env = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

type ProcessAudioRequest = {
  recordingId: string;
  teamId: string;
  userId: string;
  originalBucket?: string;
  processedBucket?: string;
};

const DEFAULT_ORIGINAL_BUCKET = "recordings-original";
const DEFAULT_PROCESSED_BUCKET = "recordings-processed";

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

  let payload: ProcessAudioRequest;
  try {
    payload = await req.json();
  } catch (_err) {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const originalBucket = payload.originalBucket ?? DEFAULT_ORIGINAL_BUCKET;
  const processedBucket = payload.processedBucket ?? DEFAULT_PROCESSED_BUCKET;

  try {
    // 1) Fetch original file metadata from DB
    const { data: recording, error: recErr } = await supabase
      .from("recordings")
      .select("*")
      .eq("id", payload.recordingId)
      .single();

    if (recErr || !recording) {
      console.error("Recording fetch error", recErr);
      return new Response("Recording not found", { status: 404 });
    }

    const storagePath: string = recording.storage_path;

    // 2) Download original file from storage
    const { data: originalFile, error: downloadErr } = await supabase.storage
      .from(originalBucket)
      .download(storagePath);

    if (downloadErr || !originalFile) {
      console.error("Original download error", downloadErr);
      return new Response("Failed to download audio", { status: 500 });
    }

    // 3) Validation + basic introspection (codec, duration, SNR, etc.)
    const validationResult = await validateAndIntrospect(originalFile, {
      minSeconds: 3,
      maxSeconds: 4 * 60 * 60,
    });

    if (!validationResult.ok) {
      await supabase
        .from("recordings")
        .update({
          status: "failed",
          failure_reason: validationResult.errorCode ?? "validation_failed",
          validation_metadata: validationResult.metadata ?? null,
        })
        .eq("id", payload.recordingId);

      return new Response(
        JSON.stringify({ error: validationResult.message }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // 4) Preprocess / normalize audio (DSP chain)
    const {
      wavBuffer,
      snr,
      vadSpeechMap,
      preprocessingMetadata,
    } = await preprocessAndNormalize(originalFile, {
      snrScore: validationResult.snr,
      needsEnhancedPreprocessing: validationResult.snr < 10,
    });

    // 5) Upload processed WAV to storage
    const processedPath = storagePath.replace(/\.[^/.]+$/, "") + ".wav";

    const { error: uploadErr } = await supabase.storage
      .from(processedBucket)
      .upload(processedPath, wavBuffer, {
        contentType: "audio/wav",
        upsert: true,
      });

    if (uploadErr) {
      console.error("Processed upload error", uploadErr);
      return new Response("Failed to upload processed audio", { status: 500 });
    }

    // 6) Chunking strategy for long audio
    const chunkingResult = await chunkLongAudio(wavBuffer, {
      sampleRate: 16000,
      maxChunkSeconds: 600,
      overlapSeconds: 30,
    });

    // 7) Persist processing metadata
    await supabase
      .from("recordings")
      .update({
        status: "preprocessed",
        snr,
        vad_speech_map: vadSpeechMap,
        processed_storage_path: processedPath,
        preprocessing_metadata: preprocessingMetadata,
        chunking_metadata: chunkingResult.metadata,
      })
      .eq("id", payload.recordingId);

    // 8) Enqueue transcription job in pgmq / jobs table
    const { error: jobErr } = await supabase.from("transcription_jobs").insert({
      recording_id: payload.recordingId,
      team_id: payload.teamId,
      user_id: payload.userId,
      status: "queued",
      priority: "normal",
      created_at: new Date().toISOString(),
    });

    if (jobErr) {
      console.error("Failed to enqueue transcription job", jobErr);
      return new Response("Failed to enqueue transcription job", { status: 500 });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        recordingId: payload.recordingId,
        snr,
        vadSpeechMap,
        chunkCount: chunkingResult.chunks.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("process-audio fatal error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});

