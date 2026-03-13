// Named Entity Recognition combining AssemblyAI entities + spaCy backend.

export type Entity = {
  type: string;
  text: string;
  start: number; // ms
  end: number; // ms
  metadata?: Record<string, unknown>;
};

type NerParams = {
  transcript: string;
};

export async function extractEntities(
  _params: NerParams,
): Promise<Entity[]> {
  // TODO: combine AssemblyAI entity payload with spaCy en_core_web_trf
  // via a Python microservice.
  return [];
}

