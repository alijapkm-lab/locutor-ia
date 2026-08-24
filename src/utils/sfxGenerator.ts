import { SoundEffectId } from '../types';

/**
 * Procedural High-Definition Sound Effect Synthesizer (Option A - Zero Token Cost)
 * Generates cinematic acoustic and environmental sound effects dynamically
 * using Web Audio synthesis equations and physics modelling.
 */
export function generateSoundEffectBuffer(
  audioCtx: AudioContext,
  effectId: SoundEffectId,
  customDurationSec?: number
): AudioBuffer {
  const sampleRate = audioCtx.sampleRate;
  const duration = customDurationSec || getDefaultDuration(effectId);
  const numSamples = Math.ceil(duration * sampleRate);

  const buffer = audioCtx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  switch (effectId) {
    case 'thunder':
      renderThunder(left, right, sampleRate, duration);
      break;
    case 'rain':
      renderRain(left, right, sampleRate, duration);
      break;
    case 'wind':
      renderWind(left, right, sampleRate, duration);
      break;
    case 'sword_clash':
      renderSwordClash(left, right, sampleRate, duration);
      break;
    case 'explosion':
      renderExplosion(left, right, sampleRate, duration);
      break;
    case 'punch_impact':
    case 'whoosh':
      renderWhooshImpact(left, right, sampleRate, duration);
      break;
    case 'scream':
      renderSiren(left, right, sampleRate, duration);
      break;
    case 'creaking_door':
      renderCreakingDoor(left, right, sampleRate, duration);
      break;
    default:
      renderWhooshImpact(left, right, sampleRate, duration);
      break;
  }

  return buffer;
}

function getDefaultDuration(id: SoundEffectId): number {
  switch (id) {
    case 'thunder': return 4.0;
    case 'rain': return 5.0;
    case 'wind': return 4.5;
    case 'sword_clash': return 2.5;
    case 'explosion': return 3.5;
    case 'punch_impact': return 1.5;
    case 'scream': return 2.2;
    case 'creaking_door': return 3.0;
    case 'whoosh': return 1.2;
    default: return 3.0;
  }
}

// 1. Rayo & Trueno Atmosférico: Authentic acoustic lightning strike with explosive shockwave + rolling low-frequency seismic storm rumble
function renderThunder(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  let lpFilteredNoise = 0;

  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;

    // Phase 1: Massive explosive thunderstrike shockwave (broadband acoustic thunderclap)
    const strikeEnv = Math.max(0, Math.exp(-(t - 0.05) * 18) * (t >= 0.05 ? 1 : 0));
    const rawNoise = (Math.random() * 2 - 1);
    // Low-pass filter the noise so it sounds like an explosive thunderclap in open air, not an electronic beep
    lpFilteredNoise = lpFilteredNoise * 0.82 + rawNoise * 0.18;
    const thunderStrike = lpFilteredNoise * strikeEnv * 0.95;

    // Secondary thunder echoes bouncing off terrain/clouds at t=0.4s and t=0.85s
    const echo1Env = Math.max(0, Math.exp(-(t - 0.4) * 8) * (t >= 0.4 ? 1 : 0));
    const echo2Env = Math.max(0, Math.exp(-(t - 0.85) * 6) * (t >= 0.85 ? 1 : 0));
    const echoes = (rawNoise * echo1Env * 0.4) + (rawNoise * echo2Env * 0.25);

    // Phase 2: Deep rolling seismic sub-bass rumble (25Hz - 55Hz natural thunder roll)
    const rumbleEnv = Math.min(1.0, t * 3.5) * Math.exp(-t * 0.55);
    const sub1 = Math.sin(2 * Math.PI * (32 + Math.sin(2 * Math.PI * 0.7 * t) * 6) * t);
    const sub2 = Math.sin(2 * Math.PI * (45 + Math.cos(2 * Math.PI * 0.5 * t) * 8) * t) * 0.5;
    const lowThunderRumble = (sub1 + sub2) * rumbleEnv * 0.75;

    // Combine natural components
    const totalThunder = (thunderStrike + echoes + lowThunderRumble) * 0.85;

    // Stereo atmospheric dispersion
    left[i] = Math.max(-1, Math.min(1, totalThunder * (0.95 + 0.1 * Math.sin(t * 4))));
    right[i] = Math.max(-1, Math.min(1, totalThunder * (0.95 - 0.1 * Math.sin(t * 4))));
  }
}

// 1b. Rayo Láser Sci-Fi: High-tech concentrated plasma discharge with frequency pitch sweep
function renderLaser(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const zapDuration = 0.45;

    if (t < zapDuration) {
      // Rapid downward exponential pitch dive from 1600Hz to 120Hz
      const freq = 120 + 1480 * Math.exp(-t * 16);
      const phase = 2 * Math.PI * freq * t;
      const env = Math.exp(-t * 8);

      // Sci-fi square/saw harmonics + high ping
      const osc1 = Math.sin(phase);
      const osc2 = (osc1 > 0 ? 0.3 : -0.3); // slight square overdrive
      const ping = Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-t * 35) * 0.4;
      const zap = (osc1 * 0.6 + osc2 + ping) * env * 0.75;

      left[i] = zap * 0.95;
      right[i] = zap * 0.95;
    } else {
      // Subtle dissipating plasma tail
      const tailT = t - zapDuration;
      const tailEnv = Math.exp(-tailT * 3.5);
      const tailNoise = (Math.random() * 2 - 1) * 0.08 * tailEnv;
      left[i] = tailNoise;
      right[i] = tailNoise;
    }
  }
}

// 2. Lluvia: Continuous multi-scale pink noise & droplet clicks
function renderRain(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  let pinkL = 0;
  let pinkR = 0;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const fade = Math.min(1, t * 2) * Math.min(1, (duration - t) * 2);

    const whiteL = Math.random() * 2 - 1;
    const whiteR = Math.random() * 2 - 1;
    pinkL = (pinkL * 0.95 + whiteL * 0.05);
    pinkR = (pinkR * 0.95 + whiteR * 0.05);

    // Random micro-droplet clicks
    const drop = Math.random() > 0.992 ? (Math.random() * 2 - 1) * 0.4 : 0;

    left[i] = (pinkL * 0.5 + drop) * fade * 0.6;
    right[i] = (pinkR * 0.5 + drop) * fade * 0.6;
  }
}

// 3. Viento Aullante: Resonant bandpass sweep with howling pitch LFO
function renderWind(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const fade = Math.min(1, t * 1.5) * Math.min(1, (duration - t) * 1.5);
    const howl = Math.sin(2 * Math.PI * (180 + Math.sin(2 * Math.PI * 0.4 * t) * 90) * t) * 0.25;
    const noise = (Math.random() * 2 - 1) * 0.3 * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.25 * t));

    const out = (howl + noise) * fade * 0.6;
    left[i] = out * (0.9 + 0.1 * Math.cos(t * 2));
    right[i] = out * (0.9 - 0.1 * Math.cos(t * 2));
  }
}

// 4. Olas del Mar: Smooth swell envelope with rolling foam
function renderOceanWaves(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const swell = Math.pow(Math.sin((Math.PI * t) / duration), 2.2);
    const noise = (Math.random() * 2 - 1) * 0.45;
    const sub = Math.sin(2 * Math.PI * 40 * t) * 0.2;
    const out = (noise + sub) * swell * 0.7;

    left[i] = out;
    right[i] = out;
  }
}

// 5. Fuego Crepitante: Low warm hum + random sharp wood pops
function renderCampfire(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const fade = Math.min(1, t * 2) * Math.min(1, (duration - t) * 2);
    const hum = Math.sin(2 * Math.PI * 65 * t) * 0.1;
    const hiss = (Math.random() * 2 - 1) * 0.15;
    // Wood snap pop
    const isPop = Math.random() > 0.997;
    const pop = isPop ? (Math.random() * 2 - 1) * 0.85 : 0;

    const out = (hum + hiss + pop) * fade * 0.6;
    left[i] = out;
    right[i] = out;
  }
}

// 6. Puerta Rechinando: Friction modulated harmonic grating
function renderCreakingDoor(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    if (t < 0.2 || t > 2.8) {
      left[i] = 0;
      right[i] = 0;
      continue;
    }
    const relT = t - 0.2;
    const env = Math.sin((Math.PI * relT) / 2.6);
    const freq = 420 + Math.sin(2 * Math.PI * 6.0 * relT) * 180 + relT * 120;
    const creak = Math.sin(2 * Math.PI * freq * t) * 0.35;
    const grit = ((i % 120) > 60 ? 1 : -1) * 0.15 * Math.sin(freq * t);

    const out = (creak + grit) * env * 0.7;
    left[i] = out;
    right[i] = out;
  }
}

// 7. Pasos Sigilosos: Rhythmic wood floor thuds with creak
function renderFootsteps(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  const stepInterval = 0.9; // One step every 0.9s
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const stepPhase = (t % stepInterval) / stepInterval;
    const stepTime = t % stepInterval;

    if (stepTime < 0.25) {
      const env = Math.exp(-stepTime * 28.0);
      const thud = Math.sin(2 * Math.PI * 60 * t) * env * 0.6;
      const heelClick = (Math.random() * 2 - 1) * Math.exp(-stepTime * 65.0) * 0.3;
      const out = (thud + heelClick) * 0.7;
      left[i] = out;
      right[i] = out;
    } else {
      left[i] = 0;
      right[i] = 0;
    }
  }
}

// 8. Latido Cardíaco (Heartbeat): Realistic 'Lub-Dub' double pulse
function renderHeartbeat(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  const beatCycle = 0.95; // ~63 BPM
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const cycleT = t % beatCycle;

    // First thump (Lub) at 0.0s
    let lub = 0;
    if (cycleT < 0.2) {
      const env = Math.exp(-cycleT * 22.0);
      lub = Math.sin(2 * Math.PI * 45 * t) * env * 0.8;
    }

    // Second thump (Dub) at 0.22s
    let dub = 0;
    if (cycleT >= 0.22 && cycleT < 0.42) {
      const rel = cycleT - 0.22;
      const env = Math.exp(-rel * 25.0);
      dub = Math.sin(2 * Math.PI * 52 * t) * env * 0.65;
    }

    const out = (lub + dub) * 0.8;
    left[i] = out;
    right[i] = out;
  }
}

// 9. Reloj de Péndulo (Tic-Tac)
function renderClockTick(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  const interval = 0.8;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const cycle = Math.floor(t / interval);
    const cycleT = t % interval;

    if (cycleT < 0.08) {
      const isTick = cycle % 2 === 0;
      const freq = isTick ? 1400 : 1100;
      const env = Math.exp(-cycleT * 70.0);
      const wood = Math.sin(2 * Math.PI * freq * t) * env * 0.6;
      const click = (Math.random() * 2 - 1) * Math.exp(-cycleT * 120.0) * 0.3;
      const out = (wood + click) * 0.7;
      left[i] = out;
      right[i] = out;
    } else {
      left[i] = 0;
      right[i] = 0;
    }
  }
}

// 10. Crescendo / Riser de Suspenso: Exponential pitch and tension rise
function renderSuspenseRiser(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const progress = t / duration;
    const env = Math.pow(progress, 2.2);
    const freq = 60 + Math.pow(progress, 3.0) * 800;

    const osc1 = Math.sin(2 * Math.PI * freq * t);
    const osc2 = Math.sin(2 * Math.PI * (freq * 1.5) * t) * 0.5;
    const dissonant = Math.sin(2 * Math.PI * (freq * 1.06) * t) * 0.4;
    const noise = (Math.random() * 2 - 1) * 0.2 * progress;

    const out = (osc1 + osc2 + dissonant + noise) * env * 0.65;
    left[i] = out;
    right[i] = out;
  }
}

// 11. Susurros Espectrales
function renderWhisperAmbience(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const fade = Math.min(1, t * 1.5) * Math.min(1, (duration - t) * 1.5);
    const lfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.6 * t);
    const voiceFormant = Math.sin(2 * Math.PI * (320 + Math.sin(t * 8) * 40) * t) * 0.15;
    const breath = (Math.random() * 2 - 1) * 0.25 * lfo;

    const out = (voiceFormant + breath) * fade * 0.5;
    left[i] = out * (0.8 + 0.2 * Math.sin(t * 3));
    right[i] = out * (0.8 - 0.2 * Math.sin(t * 3));
  }
}

// 12. Explosión Devastadora: Transient blast burst + heavy sub-bass decay
function renderExplosion(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    // Initial blast shockwave (t < 0.3s)
    const blastEnv = Math.exp(-t * 14.0);
    const blast = (Math.random() * 2 - 1) * blastEnv * 0.95;

    // Sub rumble decay (30Hz - 60Hz)
    const subEnv = Math.exp(-t * 0.8);
    const sub = Math.sin(2 * Math.PI * (42 / (1 + t * 0.5)) * t) * subEnv * 0.85;
    const debris = (Math.random() * 2 - 1) * Math.exp(-t * 1.2) * 0.25;

    const out = (blast + sub + debris) * 0.85;
    left[i] = Math.max(-1, Math.min(1, out));
    right[i] = Math.max(-1, Math.min(1, out));
  }
}

// 13. Disparo de Arma de Fuego
function renderGunshot(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const crackEnv = Math.exp(-t * 60.0);
    const crack = (Math.random() * 2 - 1) * crackEnv * 0.95;

    const thumpEnv = Math.exp(-t * 18.0);
    const thump = Math.sin(2 * Math.PI * 110 * Math.exp(-t * 25) * t) * thumpEnv * 0.8;

    const tailEnv = Math.exp(-t * 2.2);
    const tail = (Math.random() * 2 - 1) * tailEnv * 0.15;

    const out = (crack + thump + tail) * 0.85;
    left[i] = Math.max(-1, Math.min(1, out));
    right[i] = Math.max(-1, Math.min(1, out));
  }
}

// 14. Choque de Espadas / Metal
function renderSwordClash(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 4.5);
    // Inharmonic metallic ring
    const ring1 = Math.sin(2 * Math.PI * 2420 * t) * 0.4;
    const ring2 = Math.sin(2 * Math.PI * 3860 * t) * 0.25;
    const ring3 = Math.sin(2 * Math.PI * 5120 * t) * 0.15;
    const strike = (Math.random() * 2 - 1) * Math.exp(-t * 80.0) * 0.8;

    const out = (strike + (ring1 + ring2 + ring3) * env) * 0.8;
    left[i] = Math.max(-1, Math.min(1, out));
    right[i] = Math.max(-1, Math.min(1, out));
  }
}

// 15. Cristales Rotos
function renderGlassShatter(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const impact = (Math.random() * 2 - 1) * Math.exp(-t * 40.0) * 0.8;
    const shrapnelEnv = Math.exp(-t * 2.5);
    const shrapnel = (Math.random() * 2 - 1) * shrapnelEnv * 0.3 * Math.sin(2 * Math.PI * 4500 * t);
    const tinkle = (Math.sin(2 * Math.PI * 6200 * t) + Math.sin(2 * Math.PI * 7800 * t)) * shrapnelEnv * 0.15;

    const out = (impact + shrapnel + tinkle) * 0.75;
    left[i] = Math.max(-1, Math.min(1, out));
    right[i] = Math.max(-1, Math.min(1, out));
  }
}

// 16. Whoosh Rápido y Golpe
function renderWhooshImpact(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    if (t < 0.6) {
      const whooshProg = t / 0.6;
      const env = Math.sin(Math.PI * whooshProg);
      const freq = 120 + whooshProg * 800;
      const noise = (Math.random() * 2 - 1) * env * 0.5;
      const tone = Math.sin(2 * Math.PI * freq * t) * env * 0.3;
      left[i] = (noise + tone) * 0.7;
      right[i] = (noise + tone) * 0.7;
    } else {
      const relT = t - 0.6;
      const thump = Math.sin(2 * Math.PI * 55 * relT) * Math.exp(-relT * 15.0) * 0.8;
      left[i] = thump * 0.7;
      right[i] = thump * 0.7;
    }
  }
}

// 17. Campanada de Iglesia
function renderChurchBell(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  const f0 = 261.63; // C4 Bell strike
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const strike = (Math.random() * 2 - 1) * Math.exp(-t * 90) * 0.4;
    const hum = Math.sin(2 * Math.PI * (f0 * 0.5) * t) * Math.exp(-t * 0.5) * 0.35;
    const prime = Math.sin(2 * Math.PI * f0 * t) * Math.exp(-t * 1.0) * 0.4;
    const tierce = Math.sin(2 * Math.PI * (f0 * 1.2) * t) * Math.exp(-t * 1.4) * 0.25;
    const quint = Math.sin(2 * Math.PI * (f0 * 1.5) * t) * Math.exp(-t * 1.8) * 0.2;
    const nominal = Math.sin(2 * Math.PI * (f0 * 2.0) * t) * Math.exp(-t * 2.5) * 0.15;

    const out = (strike + hum + prime + tierce + quint + nominal) * 0.75;
    left[i] = out;
    right[i] = out;
  }
}

// 18. Sirena Lejana
function renderSiren(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const fade = Math.min(1, t * 1.5) * Math.min(1, (duration - t) * 1.5);
    const sirenPitch = 650 + Math.sin(2 * Math.PI * 0.5 * t) * 220;
    const tone = Math.sin(2 * Math.PI * sirenPitch * t) * 0.3;
    const dist = (Math.random() * 2 - 1) * 0.05;

    const out = (tone + dist) * fade * 0.55;
    left[i] = out;
    right[i] = out;
  }
}

// 19. Aplausos del Público
function renderApplause(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const fade = Math.min(1, t * 1.2) * Math.min(1, (duration - t) * 1.2);
    // Overlapping clap stochastic impulses
    const clapL = Math.random() > 0.985 ? (Math.random() * 2 - 1) * 0.7 : 0;
    const clapR = Math.random() > 0.985 ? (Math.random() * 2 - 1) * 0.7 : 0;
    const bedL = (Math.random() * 2 - 1) * 0.2;
    const bedR = (Math.random() * 2 - 1) * 0.2;

    left[i] = (clapL + bedL) * fade * 0.6;
    right[i] = (clapR + bedR) * fade * 0.6;
  }
}

// 20. Click de Cámara
function renderCameraShutter(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    let out = 0;
    // Click 1 at 0.1s
    if (t >= 0.08 && t < 0.2) {
      const rel = t - 0.08;
      out += (Math.random() * 2 - 1) * Math.exp(-rel * 90) * 0.8;
      out += Math.sin(2 * Math.PI * 1800 * rel) * Math.exp(-rel * 60) * 0.4;
    }
    // Click 2 (shutter close) at 0.22s
    if (t >= 0.22 && t < 0.35) {
      const rel = t - 0.22;
      out += (Math.random() * 2 - 1) * Math.exp(-rel * 100) * 0.7;
    }
    left[i] = out * 0.75;
    right[i] = out * 0.75;
  }
}

// 21. Interferencia / Glitch
function renderTechGlitch(left: Float32Array, right: Float32Array, sampleRate: number, duration: number) {
  const len = left.length;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const isGlitch = ((t * 20) % 1) > 0.4;
    const staticNoise = isGlitch ? (Math.random() * 2 - 1) * 0.6 : 0;
    const squareTone = isGlitch ? (Math.sin(2 * Math.PI * 220 * t) > 0 ? 0.3 : -0.3) : 0;
    const out = (staticNoise + squareTone) * 0.7;
    left[i] = out;
    right[i] = out;
  }
}
