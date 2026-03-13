// Speaker embedding extraction via SpeechBrain (ECAPA).
// In production, this calls a Python endpoint that wraps:
// speechbrain/spkrec-ecapa-voxceleb to compute d-vectors.

import type { DiarizationSegment } from "./pyannote.ts";

export type SpeakerEmbedding = {
  speaker: string;
  start: number;
  end: number;
  vector: number[]; // 192-dim embedding
};

type EmbedParams = {
  audioUrl: string;
  segments: DiarizationSegment[];
};

export async function extractSpeakerEmbeddings(
  _params: EmbedParams,
): Promise<SpeakerEmbedding[]> {
  // TODO: HTTP POST to Python embedding microservice.
  // Stub: return zero vectors per segment to keep types sound.
  return _params.segments.map((seg) => ({
    speaker: seg.speaker,
    start: seg.start,
    end: seg.end,
    vector: new Array(192).fill(0),
  }));
}

