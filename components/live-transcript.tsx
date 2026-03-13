"use client";

import { useLiveTranscription } from "@/hooks/use-live-transcription";
import { Button } from "@/components/ui/button";

export function LiveTranscript() {
  const { transcript, isRunning, error, start, stop } = useLiveTranscription();

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Live VoiceVault Transcription</h1>
          <p className="text-sm text-muted-foreground">
            Click start, grant microphone access, and speak to see real-time transcription.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isRunning ? "outline" : "default"}
            onClick={isRunning ? stop : start}
          >
            {isRunning ? "Stop" : "Start"}
          </Button>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              isRunning ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-400"
            }`}
          >
            {isRunning ? "Listening" : "Idle"}
          </span>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-500 border border-red-500/30 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="border rounded-md p-4 h-64 overflow-y-auto bg-background/60 text-sm leading-relaxed">
        {transcript ? (
          <p className="whitespace-pre-wrap">{transcript}</p>
        ) : (
          <p className="text-muted-foreground">
            Waiting for audio... start speaking after you click Start and grant microphone
            permission.
          </p>
        )}
      </div>
    </div>
  );
}

