 "use client";

import { useEffect, useRef, useState } from "react";

function float32ToInt16(float32: Float32Array): ArrayBuffer {
  const len = float32.length;
  const int16 = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16.buffer;
}

export function useLiveTranscription() {
  const [transcript, setTranscript] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      wsRef.current?.close();
      audioContextRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const start = async () => {
    if (isRunning) return;
    setError(null);

    try {
      const wsUrl = process.env.NEXT_PUBLIC_LIVE_TRANSCRIBE_WS_URL;
      if (!wsUrl) {
        throw new Error("NEXT_PUBLIC_LIVE_TRANSCRIBE_WS_URL is not set");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      await audioContext.audioWorklet.addModule("/worklets/pcm-processor.js");

      const source = audioContext.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(audioContext, "pcm-processor");

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      worklet.port.onmessage = (event) => {
        const float32 = event.data as Float32Array;
        const int16 = float32ToInt16(float32);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(int16);
        }
      };

      source.connect(worklet);

      ws.onopen = () => {
        setIsRunning(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data.toString());
          // AssemblyAI realtime sends messages with 'text' and message_type
          if (data.text && data.message_type === "FinalTranscript") {
            setTranscript((prev) => (prev ? prev + " " + data.text : data.text));
          }
        } catch {
          // ignore non-JSON
        }
      };

      ws.onerror = () => {
        setError("WebSocket error");
      };

      ws.onclose = () => {
        setIsRunning(false);
      };
    } catch (err: any) {
      console.error("Live transcription start error", err);
      setError(err.message ?? "Failed to start live transcription");
    }
  };

  const stop = () => {
    wsRef.current?.close();
    audioContextRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    wsRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;
    setIsRunning(false);
  };

  return {
    transcript,
    isRunning,
    error,
    start,
    stop,
  };
}

