// Speaker analytics computation (talk time, WPM, interruptions, etc.).

export type SpeakerStats = {
  speaker: string;
  total_talk_time_seconds: number;
  talk_percentage: number;
  words_per_minute: number;
  average_sentence_length: number;
  question_count: number;
  interruption_count: number;
  longest_monologue_seconds: number;
  sentiment_score: number;
  vocabulary_richness: number;
};

type Segment = {
  speaker: string;
  start: number; // ms
  end: number; // ms
  text: string;
};

type AnalyticsParams = {
  segments: Segment[];
};

export function computeSpeakerAnalytics(
  params: AnalyticsParams,
): SpeakerStats[] {
  const bySpeaker = new Map<string, Segment[]>();

  for (const s of params.segments) {
    if (!bySpeaker.has(s.speaker)) bySpeaker.set(s.speaker, []);
    bySpeaker.get(s.speaker)!.push(s);
  }

  const totalDurationMs = params.segments.reduce(
    (sum, s) => sum + (s.end - s.start),
    0,
  );

  const stats: SpeakerStats[] = [];

  for (const [speaker, segs] of bySpeaker) {
    let talkMs = 0;
    let wordCount = 0;
    let sentenceCount = 0;
    let questionCount = 0;
    let longestMonologueMs = 0;

    for (const s of segs) {
      const dur = s.end - s.start;
      talkMs += dur;
      if (dur > longestMonologueMs) longestMonologueMs = dur;

      const words = s.text.trim().split(/\s+/).filter(Boolean);
      wordCount += words.length;

      const sentences = s.text.split(/[.!?]/).filter((x) =>
        x.trim().length > 0
      );
      sentenceCount += sentences.length;

      if (s.text.trim().endsWith("?")) {
        questionCount += 1;
      }
    }

    const talkSeconds = talkMs / 1000;
    const totalMinutes = talkSeconds / 60;
    const talkPercentage = totalDurationMs
      ? (talkMs / totalDurationMs) * 100
      : 0;
    const wpm = totalMinutes > 0 ? wordCount / totalMinutes : 0;
    const avgSentenceLength = sentenceCount > 0
      ? wordCount / sentenceCount
      : 0;

    // Stub for sentiment and vocabulary richness
    const sentimentScore = 0;
    const vocabularyRichness = 0;

    stats.push({
      speaker,
      total_talk_time_seconds: talkSeconds,
      talk_percentage: talkPercentage,
      words_per_minute: wpm,
      average_sentence_length: avgSentenceLength,
      question_count: questionCount,
      interruption_count: 0,
      longest_monologue_seconds: longestMonologueMs / 1000,
      sentiment_score: sentimentScore,
      vocabulary_richness: vocabularyRichness,
    });
  }

  return stats;
}

