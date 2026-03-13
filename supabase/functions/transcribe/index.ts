import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { createAssemblyAIJob } from "./assemblyai.ts";
import { transcribeWithWhisperGroq } from "./whisper-groq.ts";
import { arbitrateTranscripts } from "./arbitrate.ts";

type Env = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ASSEMBLYAI_API_KEY: string;
  GROQ_API_KEY: string;
};

type TranscribeRequest = {
  recordingId: string;
  teamId: string;
  mode?: "speed" | "accuracy"; // controls nano-2 vs best-2
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const env: Env = {
    SUPABASE_URL: Deno.env.get("SUPABASE_URL") ?? "",
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    ASSEMBLYAI_API_KEY: Deno.env.get("ASSEMBLYAI_API_KEY") ?? "",
    GROQ_API_KEY: Deno.env.get("GROQ_API_KEY") ?? "",
  };

  if (
    !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY ||
    !env.ASSEMBLYAI_API_KEY || !env.GROQ_API_KEY
  ) {
    console.error("Required env vars missing");
    return new Response("Server misconfigured", { status: 500 });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  let payload: TranscribeRequest;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  try {
    // 1) Load recording + processed path
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

    // Create a signed URL for AssemblyAI and Groq to fetch audio
    const { data: signed, error: signedErr } = await supabase.storage
      .from(processedBucket)
      .createSignedUrl(processedPath, 60 * 60); // 1 hour

    if (signedErr || !signed) {
      console.error("Failed to create signed URL", signedErr);
      return new Response("Failed to sign audio URL", { status: 500 });
    }

    const audioUrl = signed.signedUrl;

    // 2) Fetch custom vocabulary for this team
    const { data: vocabRows } = await supabase
      .from("team_vocab")
      .select("term")
      .eq("team_id", payload.teamId);

    const vocabulary = (vocabRows ?? []).map((r: any) => r.term as string);

    const assemblyModel = payload.mode === "speed" ? "nano-2" : "best-2";

    // 3) Kick off AssemblyAI job
    const webhookUrl = `${env.SUPABASE_URL}/functions/v1/webhook-assemblyai`;
    const { id: assemblyJobId } = await createAssemblyAIJob({
      audioUrl,
      config: {
        apiKey: env.ASSEMBLYAI_API_KEY,
        model: assemblyModel,
        webhookUrl,
        customVocabulary: vocabulary,
        speakersExpected: null,
      },
    });

    // 4) In parallel, run Groq Whisper on the same audio
    // (In a real deployment, prefer to enqueue this to a background job)
    const whisperPromise = transcribeWithWhisperGroq({
      audioUrl,
      config: {
        apiKey: env.GROQ_API_KEY,
        initialPrompt: undefined, // can be populated with domain context
      },
    });

    const whisperTranscript = await whisperPromise;

    // 5) Persist secondary engine result for later arbitration when AssemblyAI webhook arrives
    await supabase.from("secondary_transcripts").insert({
      recording_id: payload.recordingId,
      engine: "whisper_groq",
      payload: whisperTranscript,
      created_at: new Date().toISOString(),
    });

    // AssemblyAI webhook will later fetch the Whisper result and call arbitrateTranscripts()
    // in the webhook handler function.

    return new Response(
      JSON.stringify({
        ok: true,
        recordingId: payload.recordingId,
        assemblyJobId,
      }),
      { status: 202, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("transcribe fatal error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});

