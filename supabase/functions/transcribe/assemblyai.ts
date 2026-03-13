// AssemblyAI transcription client for VoiceVault AI.
// PRIMARY ENGINE: Universal-2 (nano-2 / best-2 configurable)

export type AssemblyAIMode = "nano-2" | "best-2";

export type AssemblyAIConfig = {
  apiKey: string;
  model: AssemblyAIMode;
  webhookUrl?: string;
  customVocabulary?: string[];
  speakersExpected?: number | null;
};

export type AssemblyAIWord = {
  text: string;
  start: number; // ms
  end: number; // ms
  confidence: number; // 0..1
};

export type AssemblyAISegment = {
  text: string;
  start: number;
  end: number;
  confidence: number;
  words: AssemblyAIWord[];
};

export type AssemblyAITranscript = {
  id: string;
  languageCode?: string;
  segments: AssemblyAISegment[];
  confidence: number;
};

type CreateParams = {
  audioUrl: string;
  config: AssemblyAIConfig;
};

// For long-form async transcription we create a job and poll or rely on webhooks.
export async function createAssemblyAIJob(
  params: CreateParams,
): Promise<{ id: string }> {
  const endpoint = "https://api.assemblyai.com/v2/transcript";

  const body: Record<string, unknown> = {
    audio_url: params.audioUrl,
    language_detection: true,
    speaker_labels: true,
    auto_chapters: true,
    sentiment_analysis: true,
    entity_detection: true,
    auto_highlights: true,
    content_safety: true,
    punctuate: true,
    format_text: true,
    speakers_expected: params.config.speakersExpected ?? null,
    word_boost: params.config.customVocabulary ?? [],
    model: params.config.model === "nano-2"
      ? "universal-nano-2"
      : "universal-best-2",
  };

  if (params.config.webhookUrl) {
    body.webhook_url = params.config.webhookUrl;
  }

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": params.config.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AssemblyAI job creation failed: ${resp.status} ${text}`);
  }

  const json = await resp.json();
  return { id: json.id as string };
}

