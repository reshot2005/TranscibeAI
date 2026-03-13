import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type Env = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

type ExportFormat = "srt" | "vtt" | "json" | "txt";

type ExportRequest = {
  recordingId: string;
  format: ExportFormat;
};

function toSrt(segments: any[]): string {
  return segments
    .map((s, idx) => {
      const start = msToSrtTime(s.start_ms);
      const end = msToSrtTime(s.end_ms);
      return `${idx + 1}\n${start} --> ${end}\n[${s.speaker}]: ${s.text}\n`;
    })
    .join("\n");
}

function toVtt(segments: any[]): string {
  const body = segments
    .map((s) => {
      const start = msToVttTime(s.start_ms);
      const end = msToVttTime(s.end_ms);
      return `${start} --> ${end}\n<${s.speaker}>${s.text}</${s.speaker}>\n`;
    })
    .join("\n");
  return `WEBVTT\n\n${body}`;
}

function toTxt(segments: any[]): string {
  return segments
    .map((s) => {
      const t = msToHms(s.start_ms);
      return `[${s.speaker}] (${t}) ${s.text}`;
    })
    .join("\n");
}

function msToSrtTime(ms: number): string {
  const date = new Date(ms);
  const h = String(date.getUTCHours()).padStart(2, "0");
  const m = String(date.getUTCMinutes()).padStart(2, "0");
  const s = String(date.getUTCSeconds()).padStart(2, "0");
  const msPart = String(date.getUTCMilliseconds()).padStart(3, "0");
  return `${h}:${m}:${s},${msPart}`;
}

function msToVttTime(ms: number): string {
  const date = new Date(ms);
  const h = String(date.getUTCHours()).padStart(2, "0");
  const m = String(date.getUTCMinutes()).padStart(2, "0");
  const s = String(date.getUTCSeconds()).padStart(2, "0");
  const msPart = String(date.getUTCMilliseconds()).padStart(3, "0");
  return `${h}:${m}:${s}.${msPart}`;
}

function msToHms(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const env: Env = {
    SUPABASE_URL: Deno.env.get("SUPABASE_URL") ?? "",
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Supabase env vars missing");
    return new Response("Server misconfigured", { status: 500 });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  let payload: ExportRequest;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  try {
    const { data: segments, error: segErr } = await supabase
      .from("transcript_segments")
      .select("*")
      .eq("recording_id", payload.recordingId)
      .order("start_ms", { ascending: true });

    if (segErr || !segments || segments.length === 0) {
      console.error("No transcript segments found", segErr);
      return new Response("Transcript not found", { status: 404 });
    }

    let body = "";
    let contentType = "text/plain";

    if (payload.format === "srt") {
      body = toSrt(segments);
      contentType = "application/x-subrip";
    } else if (payload.format === "vtt") {
      body = toVtt(segments);
      contentType = "text/vtt";
    } else if (payload.format === "txt") {
      body = toTxt(segments);
      contentType = "text/plain";
    } else if (payload.format === "json") {
      body = JSON.stringify({ segments });
      contentType = "application/json";
    }

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (err) {
    console.error("export fatal error", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});

