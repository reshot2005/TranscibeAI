// Align word-level transcript with diarization segments.

import type { DiarizationSegment } from "./pyannote.ts";

export type WordToken = {
  text: string;
  start: number; // ms
  end: number; // ms
  speaker?: string;
};

export type AlignedSegment = {
  speaker: string;
  start: number; // ms
  end: number; // ms
  text: string;
  words: WordToken[];
};

export function alignWordsToSpeakers(
  words: WordToken[],
  diarization: DiarizationSegment[],
): AlignedSegment[] {
  const segments: AlignedSegment[] = [];

  for (const d of diarization) {
    const segStartMs = d.start * 1000;
    const segEndMs = d.end * 1000;
    const segWords = words.filter(
      (w) => w.start >= segStartMs && w.end <= segEndMs,
    );

    if (segWords.length === 0) continue;

    const text = segWords.map((w) => w.text).join(" ");
    segments.push({
      speaker: d.speaker,
      start: segWords[0].start,
      end: segWords[segWords.length - 1].end,
      text,
      words: segWords.map((w) => ({ ...w, speaker: d.speaker })),
    });
  }

  return segments;
}

