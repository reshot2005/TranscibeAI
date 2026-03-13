class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.bufferSize = 0;
    this.targetSamples = 16000 * 0.25; // 250ms at 16kHz
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channelData = input[0]; // mono
    for (let i = 0; i < channelData.length; i++) {
      this.buffer.push(channelData[i]);
      this.bufferSize++;
      if (this.bufferSize >= this.targetSamples) {
        const buf = new Float32Array(this.buffer);
        this.port.postMessage(buf);
        this.buffer = [];
        this.bufferSize = 0;
      }
    }

    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);

