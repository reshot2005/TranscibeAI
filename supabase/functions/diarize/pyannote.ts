// PyAnnote-based diarization client.
// In production, call a Python service running pyannote/speaker-diarization-3.1.

export type DiarizationSegment = {
  speaker: string;
  start: number; // seconds
  end: number; // seconds
};

export type DiarizationConfig = {
  minSpeakers?: number;
  maxSpeakers?: number;
  minDurationOn?: number;
  minDurationOff?: number;
};

type DiarizeParams = {
  audioUrl: string;
  config: DiarizationConfig;
};

export async function runDiarization(
  _params: DiarizeParams,
): Promise<DiarizationSegment[]> {
  // TODO: HTTP POST to Python diarization microservice.
  // For now, return a single-speaker stub covering full audio.
  return [
    {
      speaker: "SPEAKER_00",
      start: 0,
      end: 0, // to be filled by server based on duration
    },
  ];
}

