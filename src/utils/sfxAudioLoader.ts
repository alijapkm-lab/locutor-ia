import { SOUND_EFFECTS_CATALOG } from '../data/soundEffectsCatalog';
import { DetectedSFX, SoundEffectId } from '../types';
import { generateSoundEffectBuffer } from './sfxGenerator';

// In-memory cache for decoded AudioBuffers (real recordings from Open Sound Library)
const sfxBufferCache = new Map<string, AudioBuffer>();
let sharedAudioContext: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioContext = new AudioCtxClass();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch((err) => console.warn('Could not resume AudioContext:', err));
  }
  return sharedAudioContext;
}

/**
 * Loads a real open-access CC0 sound effect audio buffer from the open library,
 * decoding MP3/WAV/OGG into Web Audio API. Falls back to pristine procedural synthesis if offline.
 */
export async function loadAndCacheSFXBuffer(
  effectId: SoundEffectId,
  customAudioUrl?: string,
  audioCtx?: AudioContext
): Promise<AudioBuffer> {
  const ctx = audioCtx || getSharedAudioContext();
  const cacheKey = `${effectId}_${customAudioUrl || 'default'}`;

  // 1. Return from in-memory cache if already decoded
  if (sfxBufferCache.has(cacheKey)) {
    return sfxBufferCache.get(cacheKey)!;
  }

  const def = SOUND_EFFECTS_CATALOG.find((item) => item.id === effectId);
  const targetUrl = customAudioUrl || def?.audioUrl;

  // 2. Try fetching the real open-access audio recording from CDN or server proxy
  if (targetUrl) {
    try {
      // First try proxy endpoint or direct URL with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      // Direct local fetch or proxied fetch
      const fetchUrl = targetUrl.startsWith('http')
        ? `/api/sfx/sample?id=${effectId}&url=${encodeURIComponent(targetUrl)}`
        : targetUrl;

      const response = await fetch(fetchUrl, {
        signal: controller.signal,
      }).catch(async () => {
        return await fetch(targetUrl);
      });

      clearTimeout(timeoutId);

      if (response && response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > 100) {
          const decodedBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
          sfxBufferCache.set(cacheKey, decodedBuffer);
          return decodedBuffer;
        }
      }
    } catch (fetchErr) {
      console.warn(`[Open SFX Library] Could not fetch remote sample for "${effectId}", switching to high-definition local studio synthesizer:`, fetchErr);
    }
  }

  // 3. Robust Offline Fallback: Generate pristine high-definition audio buffer using procedural synthesizer
  const synthBuffer = generateSoundEffectBuffer(ctx, effectId);
  sfxBufferCache.set(cacheKey, synthBuffer);
  return synthBuffer;
}

/**
 * Plays an audition preview of a sound effect from the Open Free Audio Library
 */
export async function playSFXPreview(
  effectId: SoundEffectId,
  volume = 0.7,
  customAudioUrl?: string
): Promise<() => void> {
  const ctx = getSharedAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const buffer = await loadAndCacheSFXBuffer(effectId, customAudioUrl, ctx);

  const sourceNode = ctx.createBufferSource();
  sourceNode.buffer = buffer;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(Math.max(0.01, Math.min(1.0, volume)), ctx.currentTime);

  sourceNode.connect(gainNode);
  gainNode.connect(ctx.destination);

  sourceNode.start(0);

  // Return a stop function
  return () => {
    try {
      sourceNode.stop();
      sourceNode.disconnect();
    } catch {
      // ignore if already finished
    }
  };
}

/**
 * Pre-caches all detected audio effects in the background so they play instantly
 */
export async function preloadDetectedSFXList(
  sfxList: DetectedSFX[],
  audioCtx?: AudioContext
): Promise<void> {
  const ctx = audioCtx || getSharedAudioContext();
  const promises = sfxList.map((sfx) =>
    loadAndCacheSFXBuffer(sfx.effectId, sfx.audioUrl, ctx).catch((err) => {
      console.warn(`Could not preload SFX ${sfx.name}:`, err);
    })
  );
  await Promise.all(promises);
}
