// Semantic search indexing using Gemini text-embedding-004.

export type EmbeddingChunk = {
  index: number;
  startToken: number;
  endToken: number;
  text: string;
  embedding: number[];
};

type BuildEmbeddingsParams = {
  transcript: string;
};

export async function buildEmbeddings(
  params: BuildEmbeddingsParams,
): Promise<EmbeddingChunk[]> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const encoder = new TextEncoder();
  const fullTokens = params.transcript.split(/\s+/).filter(Boolean);

  const windowSize = 512;
  const overlap = 50;

  const chunks: { index: number; text: string }[] = [];
  let startIdx = 0;
  let chunkIndex = 0;

  while (startIdx < fullTokens.length) {
    const endIdx = Math.min(startIdx + windowSize, fullTokens.length);
    const text = fullTokens.slice(startIdx, endIdx).join(" ");
    chunks.push({
      index: chunkIndex,
      text,
    });
    if (endIdx === fullTokens.length) break;
    startIdx += windowSize - overlap;
    chunkIndex += 1;
  }

  if (chunks.length === 0) return [];

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

  const url = `${endpoint}?key=${encodeURIComponent(apiKey)}`;

  const results: EmbeddingChunk[] = [];

  for (const chunk of chunks) {
    const body = {
      model: "models/text-embedding-004",
      content: {
        parts: [{ text: chunk.text }],
      },
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(
        `Gemini embeddings failed (chunk ${chunk.index}): ${resp.status} ${text}`,
      );
    }

    const json = await resp.json();
    const embedding: number[] | undefined = json.embedding?.values;
    if (!embedding) {
      throw new Error(
        `Gemini embeddings response missing 'embedding.values' for chunk ${chunk.index}`,
      );
    }

    // We don't have true token indices; approximate by word indices.
    const approxTokens = chunk.text.split(/\s+/).filter(Boolean);

    results.push({
      index: chunk.index,
      startToken: 0,
      endToken: approxTokens.length,
      text: chunk.text,
      embedding,
    });
  }

  return results;
}

