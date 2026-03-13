// Groq Whisper Large-v3 transcription client for VoiceVault AI.
// SECONDARY ENGINE: high-speed Whisper via Groq.

export type WhisperGroqConfig = {
  apiKey: string;
  language?: string;
  initialPrompt?: string;
};

export type WhisperGroqWord = {
  word: string;
  start: number; // seconds
  end: number; // seconds
  confidence?: number;
};

export type WhisperGroqSegment = {
  text: string;
  start: number; // seconds
  end: number; // seconds
  words: WhisperGroqWord[];
};

export type WhisperGroqTranscript = {
  segments: WhisperGroqSegment[];
  language?: string;
};

type TranscribeParams = {
  audioUrl: string;
  config: WhisperGroqConfig;
};

export async function transcribeWithWhisperGroq(
  params: TranscribeParams,
): Promise<WhisperGroqTranscript> {
  const endpoint = "https://api.groq.com/openai/v1/audio/transcriptions";

  const form = new FormData();
  // Groq expects file upload; this function assumes the URL is fetchable
  // from the Edge Function, then re-uploaded as multipart.
  const audioResp = await fetch(params.audioUrl);
  if (!audioResp.ok) {
    throw new Error(
      `Failed to download audio for Groq: ${audioResp.status} ${await audioResp
        .text()}`,
    );
  }
  const blob = await audioResp.blob();
  form.append("file", blob, "audio.wav");
  form.append("model", "whisper-large-v3");
  form.append("response_format", "verbose_json");

  if (params.config.language) form.append("language", params.config.language);
  if (params.config.initialPrompt) {
    form.append("prompt", params.config.initialPrompt);
  }

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${params.config.apiKey}`,
    },
    body: form,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Groq Whisper failed: ${resp.status} ${text}`);
  }

  const json = await resp.json();

  const segments: WhisperGroqSegment[] = (json.segments ?? []).map(
    (seg: any) => ({
      text: seg.text,
      start: seg.start,
      end: seg.end,
      words: (seg.words ?? []).map((w: any) => ({
        word: w.word,
        start: w.start,
        end: w.end,
        confidence: w.probability,
      })),
    }),
  );

  return {
    segments,
    language: json.language,
  };
}

