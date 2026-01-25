
export const extractAudioFromVideo = async (videoFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Convert AudioBuffer to WAV
        const wavBlob = audioBufferToWav(audioBuffer);
        const base64 = await blobToBase64(wavBlob);
        resolve(base64);
      } catch (error) {
        reject(new Error("Failed to decode audio from video file."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read video file."));
    reader.readAsArrayBuffer(videoFile);
  });
};

export const base64ToWavBlob = (base64: string, sampleRate: number = 24000): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  
  // The Gemini TTS output is raw PCM, we need to add a WAV header
  // Note: Gemini 2.5 Flash TTS output is 24kHz mono (usually)
  return encodeWAV(byteArray, sampleRate, 1);
};

// Helper to convert Blob to Base64 (stripping header)
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:audio/wav;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Simple WAV Encoder
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = 1; // Mix down to mono for transcription to save tokens
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const data = buffer.getChannelData(0); // Use first channel
  
  // Int16 Array
  const samples = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const bufferBytes = samples.buffer;
  const header = buildWavHeader(samples.byteLength, sampleRate, numChannels, bitDepth);
  
  return new Blob([header, bufferBytes], { type: 'audio/wav' });
}

function encodeWAV(samples: Uint8Array, sampleRate: number, numChannels: number): Blob {
    const byteLength = samples.length;
    const header = buildWavHeader(byteLength, sampleRate, numChannels, 16);
    return new Blob([header, samples], { type: 'audio/wav' });
}

function buildWavHeader(dataLength: number, sampleRate: number, numChannels: number, bitDepth: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + dataLength, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataLength, true);

  return buffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
