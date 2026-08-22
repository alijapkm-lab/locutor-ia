import { TensionMusicStyle } from '../types';

/**
 * Procedurally generates cinematic ambient tension music tracks
 * tailored to play under voiceovers without overpowering them.
 */
export function generateProceduralTensionTrack(
  audioCtx: AudioContext,
  style: TensionMusicStyle,
  targetDurationSec: number
): AudioBuffer {
  const sampleRate = audioCtx.sampleRate;
  const length = Math.ceil(targetDurationSec * sampleRate);
  const buffer = audioCtx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  switch (style) {
    case 'cinematic_suspense':
      renderCinematicSuspense(left, right, sampleRate, targetDurationSec);
      break;
    case 'dark_drone':
      renderDarkDrone(left, right, sampleRate, targetDurationSec);
      break;
    case 'pulse_thriller':
      renderPulseThriller(left, right, sampleRate, targetDurationSec);
      break;
    case 'noir_strings':
      renderNoirStrings(left, right, sampleRate, targetDurationSec);
      break;
    case 'ambient_tension':
    default:
      renderAmbientTension(left, right, sampleRate, targetDurationSec);
      break;
  }

  return buffer;
}

/**
 * 1. Cinematic Suspense: Sub-bass drone + slow evolving dissonant minor chords + vinyl warmth
 */
function renderCinematicSuspense(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  duration: number
) {
  const len = left.length;
  // Fundamental frequencies (D minor / A minor dark cinematic pedal)
  const baseFreq1 = 55.0; // A1
  const baseFreq2 = 82.4; // E2
  const chordFreqs = [110.0, 130.81, 164.81, 220.0]; // A2, C3, E3, A3

  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    
    // Slow LFOs
    const lfo1 = Math.sin(2 * Math.PI * 0.08 * t);
    const lfo2 = Math.cos(2 * Math.PI * 0.05 * t);
    const lfoFast = Math.sin(2 * Math.PI * 1.5 * t);

    // Deep sub drone
    const sub = Math.sin(2 * Math.PI * (baseFreq1 + lfo1 * 0.5) * t) * 0.45;
    const fifth = Math.sin(2 * Math.PI * (baseFreq2 + lfo2 * 0.3) * t) * 0.25;

    // Atmospheric pad with subtle chorus detune
    let padL = 0;
    let padR = 0;
    chordFreqs.forEach((f, idx) => {
      const panOffset = idx % 2 === 0 ? 0.3 : -0.3;
      const mod = Math.sin(2 * Math.PI * (f + (idx + 1) * 0.2 * lfo1) * t);
      const overtone = Math.sin(2 * Math.PI * (f * 1.5) * t) * 0.15;
      padL += (mod + overtone) * (0.12 / chordFreqs.length) * (1 - panOffset);
      padR += (mod + overtone) * (0.12 / chordFreqs.length) * (1 + panOffset);
    });

    // Subtle filtered suspense noise
    const noise = (Math.random() * 2 - 1) * 0.02 * (0.5 + 0.5 * lfo2);

    // Heartbeat-like soft distant pulse every 3 seconds
    const pulsePhase = (t % 3.0) / 3.0;
    const pulseEnv = Math.exp(-pulsePhase * 8.0) * Math.sin(2 * Math.PI * 45 * t) * 0.15;

    const outL = (sub + fifth + padL + noise + pulseEnv) * 0.7;
    const outR = (sub + fifth + padR + noise + pulseEnv) * 0.7;

    left[i] = outL;
    right[i] = outR;
  }
}

/**
 * 2. Dark Drone: Deep subterranean rumbling + evolving metallic harmonics
 */
function renderDarkDrone(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  duration: number
) {
  const len = left.length;
  const f0 = 43.65; // F1
  const f1 = 65.41; // C2

  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const sweep = Math.sin(2 * Math.PI * 0.03 * t);
    const tremolo = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.2 * t);

    const bass = Math.sin(2 * Math.PI * (f0 + sweep * 0.8) * t) * 0.5;
    const sub = Math.sin(2 * Math.PI * (f0 / 2) * t) * 0.3;
    const fifth = Math.sin(2 * Math.PI * f1 * t) * 0.2;

    // Metallic overtone
    const metallicL = Math.sin(2 * Math.PI * (f0 * 4.02 + sweep * 2) * t) * 0.04;
    const metallicR = Math.sin(2 * Math.PI * (f0 * 4.07 - sweep * 2) * t) * 0.04;

    left[i] = (bass + sub + fifth + metallicL) * tremolo * 0.65;
    right[i] = (bass + sub + fifth + metallicR) * tremolo * 0.65;
  }
}

/**
 * 3. Pulse Thriller: Rhythmic ticking & muted synth tension pulse
 */
function renderPulseThriller(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  duration: number
) {
  const len = left.length;
  const bpm = 75;
  const beatDuration = 60 / bpm; // 0.8s
  const fBass = 58.27; // Bb1

  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const beatPos = (t % beatDuration) / beatDuration;
    
    // Ticking click / high hat muted pulse
    const clickEnv = Math.exp(-beatPos * 30.0);
    const click = (Math.random() * 2 - 1) * clickEnv * 0.05;

    // Plucked synth bass pulse
    const synthEnv = Math.exp(-beatPos * 12.0);
    const synthBass = Math.sin(2 * Math.PI * fBass * t) * synthEnv * 0.35;

    // Ambient background pad
    const pad = Math.sin(2 * Math.PI * 116.54 * t) * 0.08 + Math.sin(2 * Math.PI * 174.61 * t) * 0.05;

    left[i] = (synthBass + click + pad) * 0.6;
    right[i] = (synthBass - click + pad) * 0.6;
  }
}

/**
 * 4. Noir Strings: Slow dramatic bowed tension strings
 */
function renderNoirStrings(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  duration: number
) {
  const len = left.length;
  const notes = [73.42, 110.0, 146.83, 174.61]; // D2, A2, D3, F3 (D minor tension)

  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const vibrato = 1 + 0.008 * Math.sin(2 * Math.PI * 4.5 * t);
    const bowLFO = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.15 * t);

    let sumL = 0;
    let sumR = 0;

    notes.forEach((freq, idx) => {
      const f = freq * vibrato;
      // Sawtooth-like rich string harmonics with roll-off
      const h1 = Math.sin(2 * Math.PI * f * t);
      const h2 = Math.sin(2 * Math.PI * (f * 2) * t) * 0.5;
      const h3 = Math.sin(2 * Math.PI * (f * 3) * t) * 0.25;
      const wave = (h1 + h2 + h3) * (0.12 / notes.length);

      if (idx % 2 === 0) {
        sumL += wave * 1.2;
        sumR += wave * 0.8;
      } else {
        sumL += wave * 0.8;
        sumR += wave * 1.2;
      }
    });

    left[i] = sumL * bowLFO * 0.65;
    right[i] = sumR * bowLFO * 0.65;
  }
}

/**
 * 5. Ambient Tension: Subtle atmospheric drone with mysterious shimmer
 */
function renderAmbientTension(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  duration: number
) {
  const len = left.length;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const lfo1 = Math.sin(2 * Math.PI * 0.04 * t);
    const lfo2 = Math.sin(2 * Math.PI * 0.07 * t);

    const bass = Math.sin(2 * Math.PI * (60 + lfo1 * 1.5) * t) * 0.4;
    const sub = Math.sin(2 * Math.PI * 30 * t) * 0.3;
    const shimmerL = Math.sin(2 * Math.PI * (360 + lfo1 * 5) * t) * 0.03;
    const shimmerR = Math.sin(2 * Math.PI * (362 + lfo2 * 5) * t) * 0.03;

    left[i] = (bass + sub + shimmerL) * 0.65;
    right[i] = (bass + sub + shimmerR) * 0.65;
  }
}
