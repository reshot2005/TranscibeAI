import WebSocket, { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT ?? 8080);
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

if (!ASSEMBLYAI_API_KEY) {
  console.error("ASSEMBLYAI_API_KEY is not set");
  process.exit(1);
}

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (client) => {
  const sampleRate = 16000;
  const url = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${sampleRate}`;

  const aai = new WebSocket(url, {
    headers: { Authorization: ASSEMBLYAI_API_KEY },
  });

  client.on("close", () => {
    if (aai.readyState === WebSocket.OPEN) aai.close();
  });

  client.on("message", (data) => {
    if (aai.readyState === WebSocket.OPEN) {
      aai.send(data);
    }
  });

  aai.on("open", () => {
    console.log("Connected to AssemblyAI realtime");
  });

  aai.on("message", (msg) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg.toString());
    }
  });

  aai.on("close", () => {
    if (client.readyState === WebSocket.OPEN) client.close();
  });

  aai.on("error", (err) => {
    console.error("AssemblyAI websocket error", err);
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({ type: "error", message: "AssemblyAI error" }),
      );
    }
  });
});

console.log(`VoiceVault live relay listening on ws://localhost:${PORT}`);

