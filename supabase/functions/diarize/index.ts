import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { runDiarization } from "./pyannote.ts";
import { extractSpeakerEmbeddings } from "./embed.ts";

type Env = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

type DiarizeRequest = {
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

  let payload: DiarizeRequest;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  try {
    const { data: recording, error: recErr } = await supabase
      .from("recordings")
      .select("*")
      .eq("id", payload.recordingId)
      .single();

    if (recErr || !recording) {
      console.error("Recording fetch error", recErr);
      return new Response("Recording not found", { status: 404 });
    }

    const processedBucket = "recordings-processed";
    const processedPath: string = recording.processed_storage_path;

    const { data: signed, error: signedErr } = await supabase.storage
      .from(processedBucket)
      .createSignedUrl(processedPath, 60 * 60);

    if (signedErr || !signed) {
      console.error("Failed to create signed URL", signedErr);
      return new Response("Failed to sign audio URL", { status: 500 });
    }

    const audioUrl = signed.signedUrl;

    const diarization = await runDiarization({
      audioUrl,
      config: {
        minSpeakers: 1,
        maxSpeakers: 10,
        minDurationOn: 0.3,
        minDurationOff: 0.1,
      },
    });

    const embeddings = await extractSpeakerEmbeddings({
      audioUrl,
      segments: diarization,
    });

    // Persist diarization + embeddings
    await supabase.from("diarization_segments").insert(
      diarization.map((seg) => ({
        recording_id: payload.recordingId,
        speaker_label: seg.speaker,
        start_sec: seg.start,
        end_sec: seg.end,
      })),
    );

    await supabase.from("speaker_embeddings").insert(
      embeddings.map((emb) => ({
        recording_id: payload.recordingId,
        speaker_label: emb.speaker,
        start_sec: emb.start,
        end_sec: emb.end,
        embedding: emb.vector,
      })),
    );

    await supabase
      .from("recordings")
      .update({
        diarization_status: "completed",
      })
      .eq("id", payload.recordingId);

    return new Response(
      JSON.stringify({
        ok: true,
        recordingId: payload.recordingId,
        segmentCount: diarization.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("diarize fatal error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});

