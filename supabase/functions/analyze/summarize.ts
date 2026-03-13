// Gemini-based transcript cleanup and meeting intelligence summary.

export type SpeakerText = {
  speaker: string;
  text: string;
};

export type MeetingSummary = {
  executive_summary: string;
  key_decisions: string[];
  action_items: { owner: string; task: string; deadline: string | null }[];
  open_questions: string[];
  topics_discussed: string[];
  sentiment: "positive" | "neutral" | "mixed" | "tense";
  meeting_type:
    | "standup"
    | "planning"
    | "review"
    | "1on1"
    | "all-hands"
    | "other";
  follow_up_required: boolean;
  key_quotes: { speaker: string; quote: string; timestamp: string }[];
};

type SummarizeParams = {
  transcript: string;
};

export async function summarizeMeeting(
  params: SummarizeParams,
): Promise<MeetingSummary> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  const systemPrompt =
    "You are a professional transcript editor and meeting analyst. " +
    "Given a full meeting transcript, you must (1) clean up grammar and punctuation " +
    "without changing meaning, and (2) produce a structured JSON object describing the meeting. " +
    "Return ONLY strict JSON with this shape and no extra text:\n" +
    JSON.stringify({
      executive_summary: "3 sentence summary",
      key_decisions: ["decision 1", "decision 2"],
      action_items: [{ owner: "Sarah", task: "...", deadline: "..." }],
      open_questions: ["..."],
      topics_discussed: ["..."],
      sentiment: "positive|neutral|mixed|tense",
      meeting_type: "standup|planning|review|1on1|all-hands|other",
      follow_up_required: true,
      key_quotes: [{ speaker: "...", quote: "...", timestamp: "HH:MM:SS" }],
    });

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: systemPrompt },
          { text: "\n\nTranscript:\n" + params.transcript },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
    },
  };

  const url = `${endpoint}?key=${encodeURIComponent(apiKey)}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gemini summarizeMeeting failed: ${resp.status} ${text}`);
  }

  const json = await resp.json();

  const candidate = json.candidates?.[0];
  const partText: string | undefined = candidate?.content?.parts?.[0]?.text;
  if (!partText) {
    throw new Error("Gemini summarizeMeeting returned no text");
  }

  // Gemini may wrap JSON in markdown; attempt to extract JSON substring.
  const jsonMatch = partText.match(/\{[\s\S]*\}/);
  const raw = jsonMatch ? jsonMatch[0] : partText;

  let parsed: MeetingSummary;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Failed to parse Gemini meeting summary JSON: ${(err as Error).message}`,
    );
  }

  return parsed;
}

