// Confidence arbitration system between AssemblyAI and Groq Whisper.

import type {
  AssemblyAITranscript,
  AssemblyAIWord,
} from "./assemblyai.ts";
import type {
  WhisperGroqTranscript,
  WhisperGroqWord,
} from "./whisper-groq.ts";

export type ArbitrationToken = {
  text: string;
  start: number;
  end: number;
  confidence: number;
  source: "assemblyai" | "whisper" | "hybrid";
  lowConfidence: boolean;
};

export type ArbitrationResult = {
  tokens: ArbitrationToken[];
  estimatedAccuracy: number;
};

function flattenAssemblyWords(t: AssemblyAITranscript): AssemblyAIWord[] {
  const out: AssemblyAIWord[] = [];
  for (const seg of t.segments) {
    for (const w of seg.words) out.push(w);
  }
  return out;
}

function flattenWhisperWords(t: WhisperGroqTranscript): WhisperGroqWord[] {
  const out: WhisperGroqWord[] = [];
  for (const seg of t.segments) {
    for (const w of seg.words) out.push(w);
  }
  return out;
}

// Very simple word-level alignment based on time overlap.
function findClosestWhisperWord(
  word: AssemblyAIWord,
  whisperWords: WhisperGroqWord[],
): WhisperGroqWord | undefined {
  let best: WhisperGroqWord | undefined;
  let bestOverlap = 0;
  for (const w of whisperWords) {
    const startMs = w.start * 1000;
    const endMs = w.end * 1000;
    const overlap = Math.min(word.end, endMs) - Math.max(word.start, startMs);
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      best = w;
    }
  }
  return best;
}

export function arbitrateTranscripts(
  assembly: AssemblyAITranscript,
  whisper: WhisperGroqTranscript,
): ArbitrationResult {
  const assemblyWords = flattenAssemblyWords(assembly);
  const whisperWords = flattenWhisperWords(whisper);

  const tokens: ArbitrationToken[] = [];

  for (const a of assemblyWords) {
    const w = findClosestWhisperWord(a, whisperWords);
    const assemblyConf = a.confidence ?? 0;
    const whisperConf = w?.confidence ?? assemblyConf;

    let chosenText = a.text;
    let chosenConf = assemblyConf;
    let source: ArbitrationToken["source"] = "assemblyai";

    if (assemblyConf < 0.7 && w) {
      // Check Whisper when AssemblyAI confidence is low
      if (whisperConf > assemblyConf) {
        chosenText = w.word;
        chosenConf = whisperConf;
        source = "whisper";
      }
    }

    const lowConfidence = chosenConf < 0.7;

    tokens.push({
      text: chosenText,
      start: a.start,
      end: a.end,
      confidence: chosenConf,
      source,
      lowConfidence,
    });
  }

  const meanConf =
    tokens.reduce((sum, t) => sum + t.confidence, 0) /
    Math.max(tokens.length, 1);

  // Heuristic mapping from confidence to "estimated accuracy"
  const estimatedAccuracy = Math.round(meanConf * 1000) / 10;

  return {
    tokens,
    estimatedAccuracy,
  };
}

