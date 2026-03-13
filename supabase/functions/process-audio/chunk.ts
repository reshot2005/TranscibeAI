// Chunking strategy for long audio as described in LAYER 2.
// Splits 16kHz mono PCM WAV buffers into overlapping windows.

type ChunkingOptions = {
  sampleRate: number; // e.g. 16000
  maxChunkSeconds: number; // e.g. 600 (10 minutes)
  overlapSeconds: number; // e.g. 30
};

export type AudioChunk = {
  index: number;
  startSeconds: number;
  endSeconds: number;
  buffer: ArrayBuffer;
};

type ChunkingResult = {
  chunks: AudioChunk[];
  metadata: {
    maxChunkSeconds: number;
    overlapSeconds: number;
    totalDurationSeconds?: number;
  };
};

export async function chunkLongAudio(
  wavBuffer: ArrayBuffer,
  opts: ChunkingOptions,
): Promise<ChunkingResult> {
  const bytesPerSample = 2; // 16-bit PCM
  const bytesPerSecond = opts.sampleRate * bytesPerSample;
  const totalSeconds = wavBuffer.byteLength / bytesPerSecond;

  if (totalSeconds <= opts.maxChunkSeconds) {
    return {
      chunks: [
        {
          index: 0,
          startSeconds: 0,
          endSeconds: totalSeconds,
          buffer: wavBuffer,
        },
      ],
      metadata: {
        maxChunkSeconds: opts.maxChunkSeconds,
        overlapSeconds: opts.overlapSeconds,
        totalDurationSeconds: totalSeconds,
      },
    };
  }

  const chunks: AudioChunk[] = [];
  const max = opts.maxChunkSeconds;
  const overlap = opts.overlapSeconds;

  let idx = 0;
  let start = 0;

  while (start < totalSeconds) {
    const end = Math.min(start + max, totalSeconds);

    const startByte = Math.floor(start * bytesPerSecond);
    const endByte = Math.floor(end * bytesPerSecond);

    const chunkBuffer = wavBuffer.slice(startByte, endByte);
    chunks.push({
      index: idx,
      startSeconds: start,
      endSeconds: end,
      buffer: chunkBuffer,
    });

    if (end >= totalSeconds) break;

    // Next window starts max - overlap seconds after current start
    start = start + max - overlap;
    idx += 1;
  }

  return {
    chunks,
    metadata: {
      maxChunkSeconds: opts.maxChunkSeconds,
      overlapSeconds: opts.overlapSeconds,
      totalDurationSeconds: totalSeconds,
    },
  };
}

