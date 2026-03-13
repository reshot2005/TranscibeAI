// Audio ingestion & validation utilities for VoiceVault AI.
// This runs inside a Supabase Edge Function (Deno).

export type ValidationMetadata = {
  codec?: string;
  bitrateKbps?: number;
  sampleRate?: number;
  channels?: number;
  durationSeconds?: number;
  snr?: number;
};

export type ValidationResult =
  | {
      ok: true;
      snr: number;
      metadata: ValidationMetadata;
    }
  | {
      ok: false;
      message: string;
      errorCode?: string;
      metadata?: ValidationMetadata;
      snr: number;
    };

type ValidationOptions = {
  minSeconds: number;
  maxSeconds: number;
};

// Placeholder: wire this to a real ffmpeg CLI invocation via Deno.Command
// in a Supabase Edge Function (Node-compatible runtime) or a separate worker.
async function ffprobeIntrospect(
  _file: Blob,
): Promise<ValidationMetadata> {
  // In production, call ffprobe (or ffmpeg -i) and parse JSON output.
  // For now we return minimal stub data to make the pipeline type-safe.
  return {
    codec: "unknown",
    bitrateKbps: undefined,
    sampleRate: 16000,
    channels: 1,
    durationSeconds: undefined,
    snr: undefined,
  };
}

// Very rough SNR estimation using the first 0.5s as "noise floor".
// For high-accuracy SNR, move this into a Python DSP microservice.
async function estimateSnrDb(_file: Blob): Promise<number> {
  // TODO: implement real SNR computation over PCM samples.
  // For now, return a neutral mid-range SNR so the pipeline can proceed.
  return 20;
}

export async function validateAndIntrospect(
  file: Blob,
  options: ValidationOptions,
): Promise<ValidationResult> {
  const meta = await ffprobeIntrospect(file);

  // Duration guardrails (if available)
  if (meta.durationSeconds != null) {
    if (meta.durationSeconds < options.minSeconds) {
      return {
        ok: false,
        message: "Audio too short. Minimum 3 seconds required.",
        errorCode: "audio_too_short",
        metadata: meta,
        snr: 0,
      };
    }
    if (meta.durationSeconds > options.maxSeconds) {
      return {
        ok: false,
        message: "Audio too long. Maximum 4 hours supported.",
        errorCode: "audio_too_long",
        metadata: meta,
        snr: 0,
      };
    }
  }

  const snr = await estimateSnrDb(file);

  const mergedMeta: ValidationMetadata = {
    ...meta,
    snr,
  };

  return {
    ok: true,
    snr,
    metadata: mergedMeta,
  };
}

