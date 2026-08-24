import * as lamejs from 'lamejs';
import { DetectedSFX } from '../types';
import { generateSoundEffectBuffer } from './sfxGenerator';

/**
 * Creates a standard WAV file header for 16-bit PCM audio.
 */
export function pcmToWav(
  pcm16Bytes: Uint8Array,
  sampleRate = 24000,
  numChannels = 1
): Uint8Array {
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = pcm16Bytes.length;
  const totalSize = 36 + dataSize;

  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize, true);
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size for PCM
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const wavBytes = new Uint8Array(44 + dataSize);
  wavBytes.set(new Uint8Array(header), 0);
  wavBytes.set(pcm16Bytes, 44);

  return wavBytes;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Encodes an AudioBuffer into MP3 format using lamejs
 */
export function audioBufferToMp3(
  audioBuffer: AudioBuffer,
  bitrate = 256
): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  
  // Mp3Encoder from lamejs
  // @ts-ignore
  const Mp3EncoderClass = lamejs.Mp3Encoder || (lamejs as any).default?.Mp3Encoder;
  const mp3encoder = new Mp3EncoderClass(numChannels, sampleRate, bitrate);
  
  const mp3Data: Int8Array[] = [];
  const sampleBlockSize = 1152;

  if (numChannels === 1) {
    const channelData = audioBuffer.getChannelData(0);
    const samples = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    for (let i = 0; i < samples.length; i += sampleBlockSize) {
      const chunk = samples.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(chunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }
  } else {
    const leftData = audioBuffer.getChannelData(0);
    const rightData = audioBuffer.getChannelData(1);
    const leftSamples = new Int16Array(leftData.length);
    const rightSamples = new Int16Array(rightData.length);

    for (let i = 0; i < leftData.length; i++) {
      const sl = Math.max(-1, Math.min(1, leftData[i]));
      const sr = Math.max(-1, Math.min(1, rightData[i]));
      leftSamples[i] = sl < 0 ? sl * 0x8000 : sl * 0x7fff;
      rightSamples[i] = sr < 0 ? sr * 0x8000 : sr * 0x7fff;
    }

    for (let i = 0; i < leftSamples.length; i += sampleBlockSize) {
      const leftChunk = leftSamples.subarray(i, i + sampleBlockSize);
      const rightChunk = rightSamples.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }
  }

  const mp3Flush = mp3encoder.flush();
  if (mp3Flush.length > 0) {
    mp3Data.push(mp3Flush);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

/**
 * Encodes an AudioBuffer into standard 16-bit PCM WAV Blob
 */
export function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length * numChannels * 2;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);

  // RIFF
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  // fmt
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  // data
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  let offset = 44;
  if (numChannels === 1) {
    const channel = audioBuffer.getChannelData(0);
    for (let i = 0; i < channel.length; i++) {
      const s = Math.max(-1, Math.min(1, channel[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  } else {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    for (let i = 0; i < left.length; i++) {
      const sl = Math.max(-1, Math.min(1, left[i]));
      const sr = Math.max(-1, Math.min(1, right[i]));
      view.setInt16(offset, sl < 0 ? sl * 0x8000 : sl * 0x7fff, true);
      offset += 2;
      view.setInt16(offset, sr < 0 ? sr * 0x8000 : sr * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Mixes voice AudioBuffer, tension music AudioBuffer, and sound effects with smooth ducking and limiter
 */
export function mixMultiTrackAudio(
  audioCtx: AudioContext,
  voiceBuffer: AudioBuffer,
  musicBuffer: AudioBuffer | null,
  musicVolume = 0.22,
  sfxList: DetectedSFX[] = [],
  masterSfxVolume = 0.35,
  applyDucking = true,
  sfxBufferMap?: Map<string, AudioBuffer>
): AudioBuffer {
  const sampleRate = voiceBuffer.sampleRate;
  const duration = voiceBuffer.duration;
  const numSamples = Math.ceil(duration * sampleRate);
  
  // Output stereo buffer
  const mixedBuffer = audioCtx.createBuffer(2, numSamples, sampleRate);
  const mixedL = mixedBuffer.getChannelData(0);
  const mixedR = mixedBuffer.getChannelData(1);

  const voiceL = voiceBuffer.getChannelData(0);
  const voiceR = voiceBuffer.numberOfChannels > 1 ? voiceBuffer.getChannelData(1) : voiceL;

  // Pre-render and overlay enabled sound effects into a dedicated SFX stereo track
  const sfxTrackL = new Float32Array(numSamples);
  const sfxTrackR = new Float32Array(numSamples);

  for (const sfx of sfxList) {
    if (!sfx.enabled) continue;
    try {
      const sfxBuffer = sfxBufferMap?.get(sfx.effectId) || generateSoundEffectBuffer(audioCtx, sfx.effectId);
      const startSample = Math.floor(sfx.timestampSec * sampleRate);
      const sfxDurationSamples = sfxBuffer.length;
      const sfxVol = (sfx.volume ?? 0.7) * masterSfxVolume;

      const sBufL = sfxBuffer.getChannelData(0);
      const sBufR = sfxBuffer.numberOfChannels > 1 ? sfxBuffer.getChannelData(1) : sBufL;

      for (let s = 0; s < sfxDurationSamples; s++) {
        const destIdx = startSample + s;
        if (destIdx >= numSamples) break;
        sfxTrackL[destIdx] += (sBufL[s] || 0) * sfxVol;
        sfxTrackR[destIdx] += (sBufR[s] || 0) * sfxVol;
      }
    } catch (e) {
      console.warn('Error mixing SFX item:', sfx, e);
    }
  }

  // Compute voice envelope for ducking
  const voiceEnvelope = new Float32Array(numSamples);
  let currentEnergy = 0;
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.abs(voiceL[i] || 0);
    currentEnergy = currentEnergy * 0.999 + sample * 0.001;
    voiceEnvelope[i] = currentEnergy;
  }

  let musicL: Float32Array | null = null;
  let musicR: Float32Array | null = null;
  if (musicBuffer) {
    musicL = musicBuffer.getChannelData(0);
    musicR = musicBuffer.numberOfChannels > 1 ? musicBuffer.getChannelData(1) : musicL;
  }

  for (let i = 0; i < numSamples; i++) {
    const vL = voiceL[i] || 0;
    const vR = voiceR[i] || 0;

    let mL = 0;
    let mR = 0;

    if (musicL && musicR) {
      // Loop music if voice is longer
      const musicIdx = i % musicBuffer!.length;
      mL = musicL[musicIdx];
      mR = musicR[musicIdx];

      // Ducking logic: when voice or loud SFX is playing, subtly lower background music
      let duckFactor = 1.0;
      if (applyDucking) {
        const env = Math.min(1.0, voiceEnvelope[i] * 3.5);
        duckFactor = 1.0 - env * 0.35;
      }

      // Smooth fade in at start and fade out at the end
      const fadeIn = Math.min(1.0, i / (sampleRate * 1.5));
      const fadeOut = Math.min(1.0, (numSamples - i) / (sampleRate * 2.0));
      const envelopeModifier = fadeIn * fadeOut;

      mL = mL * musicVolume * duckFactor * envelopeModifier;
      mR = mR * musicVolume * duckFactor * envelopeModifier;
    }

    const sL = sfxTrackL[i] || 0;
    const sR = sfxTrackR[i] || 0;

    // Mix with limiter/soft clipper
    mixedL[i] = Math.max(-1.0, Math.min(1.0, vL + mL + sL));
    mixedR[i] = Math.max(-1.0, Math.min(1.0, vR + mR + sR));
  }

  return mixedBuffer;
}

/**
 * Mixes voice AudioBuffer and tension music AudioBuffer with smooth ducking
 */
export function mixVoiceAndMusic(
  audioCtx: AudioContext,
  voiceBuffer: AudioBuffer,
  musicBuffer: AudioBuffer | null,
  musicVolume = 0.22,
  applyDucking = true
): AudioBuffer {
  return mixMultiTrackAudio(audioCtx, voiceBuffer, musicBuffer, musicVolume, [], 0, applyDucking);
}

/**
 * Triggers a browser download for a Blob
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Formats seconds to mm:ss
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
