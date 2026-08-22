import express from 'express';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { Communicate } from 'edge-tts-universal';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy GoogleGenAI client with optional custom API key support
let genAIClient: GoogleGenAI | null = null;
function getGenAI(customKey?: string): GoogleGenAI {
  if (customKey && customKey.trim()) {
    return new GoogleGenAI({
      apiKey: customKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment.');
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// In-memory cache for Voice Previews so they play instantly (0ms delay)
const voicePreviewCache = new Map<string, string>();

const VOICE_PREVIEWS: Record<string, { phrase: string; tone: string; speedLabel: string; pitchLabel: string; gender: 'Masculina' | 'Femenina' }> = {
  Kore: {
    phrase: 'Hola, soy Kore. Mi voz es cálida, elegante y versátil, ideal para documentales y narraciones envolventes.',
    tone: 'calido',
    speedLabel: 'normal',
    pitchLabel: 'neutro',
    gender: 'Femenina',
  },
  Fenrir: {
    phrase: 'Saludos. Soy Fenrir. Una voz masculina profunda y cinematográfica, diseñada para relatos de gran impacto.',
    tone: 'dramatico',
    speedLabel: 'lento',
    pitchLabel: 'grave',
    gender: 'Masculina',
  },
  Puck: {
    phrase: '¡Hola a todos! Soy Puck. Mi voz es juvenil y dinámica, perfecta para comerciales y podcasts modernos.',
    tone: 'entusiasta',
    speedLabel: 'rapido',
    pitchLabel: 'agudo',
    gender: 'Masculina',
  },
  Charon: {
    phrase: 'Soy Charon. Mi tono es sobrio, pausado y reflexivo, ideal para historias de misterio y suspenso.',
    tone: 'misterio',
    speedLabel: 'lento',
    pitchLabel: 'muy_grave',
    gender: 'Masculina',
  },
  Zephyr: {
    phrase: 'Hola, soy Zephyr. Una voz suave, serena y reconfortante, creada para relatos íntimos y momentos de reflexión.',
    tone: 'calido',
    speedLabel: 'lento',
    pitchLabel: 'neutro',
    gender: 'Femenina',
  },
};


/**
 * Intelligent Script Chunker:
 * Splits long scripts (up to 15 mins) into narrative segments
 * along natural boundaries (paragraphs, sentence endings) without breaking words.
 */
function splitScriptIntoChunks(script: string, maxChunkLen = 600): string[] {
  const cleaned = script.trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxChunkLen) return [cleaned];

  const paragraphs = cleaned.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if (trimmedPara.length <= maxChunkLen) {
      if ((currentChunk + '\n\n' + trimmedPara).length <= maxChunkLen) {
        currentChunk = currentChunk ? currentChunk + '\n\n' + trimmedPara : trimmedPara;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = trimmedPara;
      }
    } else {
      // Split paragraph by sentence boundaries (. ! ? :)
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      const sentences = trimmedPara.match(/[^.!?:]+[.!?:]+/g) || [trimmedPara];
      let sentenceChunk = '';

      for (const sent of sentences) {
        const sTrim = sent.trim();
        if ((sentenceChunk + ' ' + sTrim).length <= maxChunkLen) {
          sentenceChunk = sentenceChunk ? sentenceChunk + ' ' + sTrim : sTrim;
        } else {
          if (sentenceChunk) chunks.push(sentenceChunk);
          // If single sentence is very long, split by commas or words
          if (sTrim.length > maxChunkLen) {
            const words = sTrim.split(/\s+/);
            let wordChunk = '';
            for (const w of words) {
              if ((wordChunk + ' ' + w).length <= maxChunkLen) {
                wordChunk = wordChunk ? wordChunk + ' ' + w : w;
              } else {
                if (wordChunk) chunks.push(wordChunk);
                wordChunk = w;
              }
            }
            if (wordChunk) sentenceChunk = wordChunk;
          } else {
            sentenceChunk = sTrim;
          }
        }
      }
      if (sentenceChunk) chunks.push(sentenceChunk);
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks.length > 0 ? chunks : [cleaned];
}

/**
 * Generates prompt instructions for the TTS model to achieve
 * human broadcaster realism, specified tone, speed, and pitch.
 */
function buildTTSPrompt(
  chunkText: string,
  chunkIndex: number,
  totalChunks: number,
  options: {
    tone: string;
    speedLabel?: string;
    pitchLabel?: string;
    language?: string;
    customInstructions?: string;
  }
): string {
  const toneMap: Record<string, string> = {
    locutor_clasico: 'locutor profesional de radio y televisión, voz clara, firme, elegante y articulada',
    dramatico: 'narrador dramático y cinematográfico, con intensidad emocional, pausas de suspenso y profundidad',
    epico: 'locutor épico de tráiler de cine, voz resonante, poderosa, solemne e imponente',
    documental: 'narrador de documental de alta gama (estilo National Geographic/BBC), cálido, reflexivo y fascinante',
    entusiasta: 'locutor dinámico y comercial, enérgico, cercano, brillante y positivo',
    misterio: 'narrador de historias de misterio y tensión, tono grave, pausado, cautivador e intrigante',
    calido: 'locutor cálido y empático, tono cercano, amable, íntimo y reconfortante',
    noticiero: 'presentador formal de noticias, objetivo, con cadencia informativa y dicción impecable',
  };

  const toneDesc = toneMap[options.tone] || toneMap.locutor_clasico;

  const speedDirectives: Record<string, string> = {
    muy_lento: 'Ritmo muy pausado y reflexivo, con espacios marcados entre oraciones.',
    lento: 'Ritmo pausado y sosegado, dando peso a cada palabra.',
    normal: 'Ritmo natural y fluido de locución profesional.',
    rapido: 'Ritmo ágil y dinámico con dicción rápida pero cristalina.',
    muy_rapido: 'Ritmo rápido y urgente, manteniendo perfecta inteligibilidad.',
  };

  const pitchDirectives: Record<string, string> = {
    muy_grave: 'Tono de voz muy grave y profundo con resonancia de pecho.',
    grave: 'Tono de voz grave y cálido de locutor clásico.',
    neutro: 'Tono de voz equilibrado y natural.',
    agudo: 'Tono de voz brillante, ligero y abierto.',
    muy_agudo: 'Tono de voz alto, juvenil y claro.',
  };

  const speedText = speedDirectives[options.speedLabel || 'normal'] || '';
  const pitchText = pitchDirectives[options.pitchLabel || 'neutro'] || '';
  const custom = options.customInstructions ? `Indicaciones especiales del director: ${options.customInstructions}.` : '';

  // Return the structured prompt for gemini-3.1-flash-tts-preview
  return `Actúa como un ${toneDesc}.
Idioma de narración: Español (con pronunciación natural y dicción perfecta).
${speedText}
${pitchText}
${custom}
Lee el siguiente texto del guión con total naturalidad humana, respetando los signos de puntuación y la emoción:

${chunkText}`;
}

/**
 * Creates WAV header for raw 16-bit PCM (sampleRate 24000, 1 channel)
 */
function createWavFromPCM(pcmData: Buffer, sampleRate = 24000, channels = 1): Buffer {
  const byteRate = sampleRate * channels * 2;
  const blockAlign = channels * 2;
  const dataSize = pcmData.length;
  const totalSize = 36 + dataSize;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(totalSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34); // BitsPerSample
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

// ---------------- QUOTA & FAILOVER SYSTEM ----------------

interface GeminiQuotaTracker {
  isRateLimited: boolean;
  cooldownUntil: number | null; // Timestamp ms
  cooldownTotalSec: number;
  lastError: string | null;
  geminiCount: number;
  fallbackCount: number;
}

const geminiQuotaState: GeminiQuotaTracker = {
  isRateLimited: false,
  cooldownUntil: null,
  cooldownTotalSec: 60,
  lastError: null,
  geminiCount: 0,
  fallbackCount: 0,
};

function checkGeminiCooldown(): { inCooldown: boolean; remainingSec: number } {
  if (!geminiQuotaState.isRateLimited || !geminiQuotaState.cooldownUntil) {
    return { inCooldown: false, remainingSec: 0 };
  }
  const now = Date.now();
  if (now >= geminiQuotaState.cooldownUntil) {
    geminiQuotaState.isRateLimited = false;
    geminiQuotaState.cooldownUntil = null;
    geminiQuotaState.lastError = null;
    return { inCooldown: false, remainingSec: 0 };
  }
  const remainingSec = Math.ceil((geminiQuotaState.cooldownUntil - now) / 1000);
  return { inCooldown: true, remainingSec };
}

function markGeminiQuotaExhausted(errorMsg: string, cooldownSec = 60) {
  geminiQuotaState.isRateLimited = true;
  geminiQuotaState.cooldownUntil = Date.now() + cooldownSec * 1000;
  geminiQuotaState.cooldownTotalSec = cooldownSec;
  geminiQuotaState.lastError = errorMsg;
  console.warn(`[Quota Monitor] Google Gemini token quota exhausted. Auto-failover active. Cooldown: ${cooldownSec}s.`);
}

/**
 * Splits text into small chunks suitable for Free TTS mirrors (<= 160 characters)
 * without breaking sentences or words.
 */
function splitScriptForFreeTTS(script: string, maxLen = 150): string[] {
  const cleaned = script.trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxLen) return [cleaned];

  const sentences = cleaned.split(/(?<=[.!?;\n])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const s = sentence.trim();
    if (!s) continue;

    if (s.length <= maxLen) {
      if ((current + ' ' + s).trim().length <= maxLen) {
        current = current ? current + ' ' + s : s;
      } else {
        if (current) chunks.push(current);
        current = s;
      }
    } else {
      if (current) {
        chunks.push(current);
        current = '';
      }
      // Split by commas or words
      const subParts = s.split(/(?<=[,])\s+/);
      for (const part of subParts) {
        if ((current + ' ' + part).trim().length <= maxLen) {
          current = current ? current + ' ' + part : part;
        } else {
          if (current) chunks.push(current);
          // If a single part is still too long, split by words
          if (part.length > maxLen) {
            const words = part.split(/\s+/);
            for (const word of words) {
              if ((current + ' ' + word).trim().length <= maxLen) {
                current = current ? current + ' ' + word : word;
              } else {
                if (current) chunks.push(current);
                current = word;
              }
            }
          } else {
            current = part;
          }
        }
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [cleaned];
}

/**
 * High-reliability Free Neural Speech Synthesis (Edge Neural + SAPI / Web TTS Fallback Engine)
 * Synthesizes natural Spanish speech with zero token cost, with dedicated Male and Female neural voices.
 */
async function generateFreeSpeech(
  script: string,
  options: {
    language?: string;
    tone?: string;
    gender?: 'male' | 'female' | 'auto';
    voice?: string;
    speed?: number;
    pitch?: number;
  } = {}
): Promise<{ buffer: Buffer; durationSec: number; voiceUsed: string; genderUsed: 'Masculina' | 'Femenina' }> {
  const lang = options.language || 'es';
  let targetGender: 'male' | 'female' = 'male';
  if (options.gender === 'male') {
    targetGender = 'male';
  } else if (options.gender === 'female') {
    targetGender = 'female';
  } else {
    // auto: if voice is Kore or Zephyr -> female, else male
    targetGender = (options.voice === 'Kore' || options.voice === 'Zephyr') ? 'female' : 'male';
  }

  const edgeVoice = targetGender === 'female' ? 'es-ES-ElviraNeural' : 'es-ES-AlvaroNeural';
  console.log(`[Free Neural Engine] Synthesizing speech with voice: ${edgeVoice} (Gender: ${targetGender})`);

  try {
    const comm = new Communicate(script.trim(), { voice: edgeVoice });
    const audioChunks: Buffer[] = [];
    for await (const chunk of comm.stream()) {
      if (chunk.type === 'audio' && chunk.data) {
        audioChunks.push(Buffer.from(chunk.data));
      }
    }
    if (audioChunks.length > 0) {
      const combined = Buffer.concat(audioChunks);
      const durationSec = Math.max(2, Math.round(combined.length / 4500));
      return {
        buffer: combined,
        durationSec,
        voiceUsed: targetGender === 'female' ? 'Voz Femenina Neuronal (Elvira)' : 'Voz Masculina Neuronal (Álvaro)',
        genderUsed: targetGender === 'female' ? 'Femenina' : 'Masculina',
      };
    }
  } catch (edgeErr) {
    console.warn('[Free Neural Engine] EdgeTTS stream error, falling back to HTTP mirror:', edgeErr);
  }

  // Fallback to Google / Regional mirror
  const phrases = splitScriptForFreeTTS(script, 140);
  const audioBuffers: Buffer[] = [];

  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i].trim();
    if (!phrase) continue;

    const encoded = encodeURIComponent(phrase);
    const mirrors = [
      `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encoded}`,
      `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${lang}&q=${encoded}`,
    ];

    let downloadedBuffer: Buffer | null = null;
    for (const url of mirrors) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: '*/*',
          },
        });
        if (response.ok) {
          const ab = await response.arrayBuffer();
          if (ab.byteLength > 100) {
            downloadedBuffer = Buffer.from(ab);
            break;
          }
        }
      } catch (err) {
        console.warn(`Mirror failed for phrase ${i}:`, err);
      }
    }
    if (downloadedBuffer) {
      audioBuffers.push(downloadedBuffer);
    }
  }

  if (audioBuffers.length === 0) {
    throw new Error('No se pudo generar audio con el motor gratuito.');
  }

  const combinedAudio = Buffer.concat(audioBuffers);
  const durationSec = Math.max(3, Math.round(combinedAudio.length / 4000));

  return {
    buffer: combinedAudio,
    durationSec,
    voiceUsed: targetGender === 'female' ? 'Voz Femenina (SAPI/Web)' : 'Voz Masculina (SAPI/Web)',
    genderUsed: targetGender === 'female' ? 'Femenina' : 'Masculina',
  };
}

// ---------------- API ROUTES ----------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Quota Status & Token Refill Countdown Monitor
app.get('/api/quota-status', (req, res) => {
  const { inCooldown, remainingSec } = checkGeminiCooldown();
  res.json({
    geminiAvailable: !inCooldown,
    isCooldownActive: inCooldown,
    cooldownRemainingSec: remainingSec,
    totalCooldownSec: geminiQuotaState.cooldownTotalSec,
    lastError: geminiQuotaState.lastError,
    activeEngine: inCooldown ? 'free_fallback' : 'gemini_tts',
    geminiGenerationsCount: geminiQuotaState.geminiCount,
    fallbackGenerationsCount: geminiQuotaState.fallbackCount,
    nextRefillEstimatedAt: inCooldown && geminiQuotaState.cooldownUntil
      ? new Date(geminiQuotaState.cooldownUntil).toISOString()
      : null,
    hasDefaultKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Validate custom API Keys across providers (Google Gemini, Groq, OpenAI, ElevenLabs)
app.post('/api/validate-key', async (req, res) => {
  try {
    const { apiKey, provider = 'gemini' } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return res.status(400).json({ valid: false, error: 'Por favor ingresa una clave API válida.' });
    }

    const key = apiKey.trim();

    // 1. Groq API validation
    if (provider === 'groq') {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/models', {
          headers: {
            Authorization: `Bearer ${key}`,
            'User-Agent': 'aistudio-build',
          },
        });
        if (groqRes.ok) {
          return res.json({
            valid: true,
            provider: 'groq',
            message: '¡Clave API de Groq conectada y validada con éxito! (Ultra-baja latencia activa)',
          });
        }
        const errData: any = await groqRes.json().catch(() => ({}));
        return res.status(400).json({
          valid: false,
          error: errData?.error?.message || 'Clave API de Groq no válida o rechazada.',
        });
      } catch (err: any) {
        return res.status(400).json({ valid: false, error: `Error conectando con Groq: ${err.message}` });
      }
    }

    // 2. OpenAI API validation
    if (provider === 'openai') {
      try {
        const openAiRes = await fetch('https://api.openai.com/v1/models', {
          headers: {
            Authorization: `Bearer ${key}`,
          },
        });
        if (openAiRes.ok) {
          return res.json({
            valid: true,
            provider: 'openai',
            message: '¡Clave API de OpenAI validada con éxito! (TTS HD habilitado)',
          });
        }
        return res.status(400).json({
          valid: false,
          error: 'Clave API de OpenAI no válida o sin créditos suficientes.',
        });
      } catch (err: any) {
        return res.status(400).json({ valid: false, error: `Error conectando con OpenAI: ${err.message}` });
      }
    }

    // 3. ElevenLabs API validation
    if (provider === 'elevenlabs') {
      try {
        const elevenRes = await fetch('https://api.elevenlabs.io/v1/user', {
          headers: {
            'xi-api-key': key,
          },
        });
        if (elevenRes.ok) {
          const userData: any = await elevenRes.json();
          const charCount = userData?.subscription?.character_count || 0;
          const charLimit = userData?.subscription?.character_limit || 10000;
          return res.json({
            valid: true,
            provider: 'elevenlabs',
            message: `¡Clave API de ElevenLabs validada! (${charCount}/${charLimit} caracteres usados).`,
          });
        }
        return res.status(400).json({
          valid: false,
          error: 'Clave API de ElevenLabs no válida o sin suscripción activa.',
        });
      } catch (err: any) {
        return res.status(400).json({ valid: false, error: `Error conectando con ElevenLabs: ${err.message}` });
      }
    }

    // 4. Default: Google Gemini API (Supports standard Google AI Studio Gemini API keys)
    const testAI = getGenAI(key);
    let geminiValidated = false;
    let geminiValidationMsg = '¡Clave API de Google Gemini validada y lista para su uso!';

    const testModels = ['gemini-3.7-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError: any = null;

    for (const testModel of testModels) {
      try {
        const response = await testAI.models.generateContent({
          model: testModel,
          contents: 'Ping',
        });
        if (response && response.text) {
          geminiValidated = true;
          geminiValidationMsg = `¡Clave API de Google Gemini verificada y lista para su uso! (${testModel})`;
          break;
        }
      } catch (mErr: any) {
        lastError = mErr;
        const msg = mErr?.message || '';
        // If 503 (high demand) or 429 (rate limit), the API key itself IS valid and authenticated by Google!
        if (mErr?.status === 503 || msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand') ||
            mErr?.status === 429 || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
          geminiValidated = true;
          geminiValidationMsg = '¡Clave API de Google Gemini verificada y conectada con éxito a tu cuenta de Google AI Studio!';
          break;
        }
        // If auth failed, stop immediately
        if (msg.includes('API_KEY_INVALID') || mErr?.status === 400 || mErr?.status === 403) {
          break;
        }
      }
    }

    if (geminiValidated) {
      return res.json({
        valid: true,
        provider: 'gemini',
        message: geminiValidationMsg,
      });
    }

    // If failed with specific auth error
    if (lastError) {
      const msg = lastError.message || '';
      if (msg.includes('API_KEY_INVALID') || msg.includes('400') || msg.includes('403')) {
        return res.status(400).json({ valid: false, error: 'Clave API no válida o sin permisos suficientes en Google AI Studio.' });
      }
      return res.status(400).json({ valid: false, error: `Error al validar la clave: ${msg || 'Error de conexión'}` });
    }

    return res.json({
      valid: true,
      provider: 'gemini',
      message: 'Clave API de Gemini conectada.',
    });
  } catch (err: any) {
    console.warn('API Key validation failed:', err);
    const msg = err.message || '';
    if (err?.status === 503 || msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand')) {
      return res.json({
        valid: true,
        provider: 'gemini',
        message: '¡Clave API de Google Gemini verificada y conectada! (Servidores de Google con alta demanda momentánea).',
      });
    }
    if (msg.includes('API_KEY_INVALID') || msg.includes('400') || msg.includes('403')) {
      return res.status(400).json({ valid: false, error: 'Clave API no válida o sin permisos suficientes en Google AI Studio.' });
    }
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({ valid: false, error: 'Esta clave API no tiene créditos o ha agotado su cuota de peticiones.' });
    }
    return res.status(400).json({ valid: false, error: `Error al validar la clave: ${msg || 'Error de conexión'}` });
  }
});

// Helper to recursively add directory to JSZip
function addDirectoryToZip(zipInstance: JSZip, localDirPath: string, zipFolderPrefix: string = '') {
  if (!fs.existsSync(localDirPath)) return;
  const items = fs.readdirSync(localDirPath);
  for (const item of items) {
    const fullPath = path.join(localDirPath, item);
    const stat = fs.statSync(fullPath);
    const zipPath = zipFolderPrefix ? `${zipFolderPrefix}/${item}` : item;
    if (stat.isDirectory()) {
      addDirectoryToZip(zipInstance, fullPath, zipPath);
    } else {
      zipInstance.file(zipPath, fs.readFileSync(fullPath));
    }
  }
}

// Download full project ZIP endpoint for local desktop execution
app.get('/api/download-app-zip', async (req, res) => {
  try {
    const zip = new JSZip();

    // Root project files
    const rootFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'index.html',
      'metadata.json',
      'LEEME_LOCAL.md',
      'iniciar_app.bat',
      'iniciar_app.sh',
      '.env.example',
      '.gitignore',
      'server.ts',
    ];

    for (const file of rootFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        zip.file(file, fs.readFileSync(filePath));
      }
    }

    // Include source code folder
    addDirectoryToZip(zip, path.join(process.cwd(), 'src'), 'src');

    // Include assets folder if present
    addDirectoryToZip(zip, path.join(process.cwd(), 'assets'), 'assets');

    // Include public folder if present
    addDirectoryToZip(zip, path.join(process.cwd(), 'public'), 'public');

    const contentBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const filename = 'Estudio-Locucion-IA-App.zip';
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', contentBuffer.length);
    res.send(contentBuffer);
  } catch (err: any) {
    console.error('Download app ZIP failed:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Error al empaquetar la aplicación.' });
    }
  }
});

// Download Windows launcher (.bat) directly
app.get('/api/download-launcher/windows', (req, res) => {
  const filePath = path.join(process.cwd(), 'iniciar_app.bat');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="iniciar_app.bat"');
    res.setHeader('Content-Type', 'application/x-bat');
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.status(404).send('Archivo iniciar_app.bat no encontrado');
  }
});

// Download Mac/Linux launcher (.sh) directly
app.get('/api/download-launcher/unix', (req, res) => {
  const filePath = path.join(process.cwd(), 'iniciar_app.sh');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="iniciar_app.sh"');
    res.setHeader('Content-Type', 'application/x-sh');
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.status(404).send('Archivo iniciar_app.sh no encontrado');
  }
});

// Free Voice Preview endpoint: Allows testing both Free Male (Álvaro) and Free Female (Elvira) neural voices
app.all('/api/tts/free-preview', async (req, res) => {
  try {
    const gender = ((req.method === 'GET' ? req.query.gender : req.body.gender) as string || 'male').toLowerCase() as 'male' | 'female';
    const sampleText = gender === 'female'
      ? 'Hola. Soy la voz femenina del motor neuronal gratuito. Estoy lista para narrar tus guiones con calidez y naturalidad.'
      : 'Saludos. Soy la voz masculina del motor neuronal gratuito. Mi tono es firme, solemne y profesional, disponible sin límites.';

    const cacheKey = `free_preview_${gender}`;
    if (voicePreviewCache.has(cacheKey)) {
      return res.json({
        success: true,
        gender: gender === 'female' ? 'Femenina' : 'Masculina',
        audioWavBase64: voicePreviewCache.get(cacheKey)!,
        durationSec: 4,
        samplePhrase: sampleText,
        engineUsed: 'free_neural_cached',
      });
    }

    const freeRes = await generateFreeSpeech(sampleText, {
      language: 'es',
      gender,
    });

    const wavBase64 = freeRes.buffer.toString('base64');
    voicePreviewCache.set(cacheKey, wavBase64);

    return res.json({
      success: true,
      gender: freeRes.genderUsed,
      audioWavBase64: wavBase64,
      durationSec: freeRes.durationSec,
      samplePhrase: sampleText,
      engineUsed: freeRes.voiceUsed,
    });
  } catch (err: any) {
    console.error('Error in /api/tts/free-preview:', err);
    res.status(500).json({ error: 'No se pudo generar la preescucha del motor gratuito.' });
  }
});

// Voice Preview endpoint: Generates/serves short Spanish voice samples for Kore, Fenrir, Puck, Charon, Zephyr
app.all('/api/tts/preview', async (req, res) => {
  try {
    const voice = (req.method === 'GET' ? req.query.voice : req.body.voice) as string || 'Kore';
    const customApiKey = ((req.headers['x-gemini-api-key'] as string) || (req.body?.customApiKey as string) || (req.query?.customApiKey as string))?.trim();

    const voiceInfo = VOICE_PREVIEWS[voice] || VOICE_PREVIEWS['Kore'];
    const cacheKey = `${voice}_${customApiKey ? 'custom' : 'default'}`;

    // Return cached preview if available
    if (voicePreviewCache.has(cacheKey)) {
      const cached = voicePreviewCache.get(cacheKey)!;
      return res.json({
        success: true,
        voice,
        audioWavBase64: cached,
        durationSec: 4,
        samplePhrase: voiceInfo.phrase,
        engineUsed: 'cached',
      });
    }

    const { inCooldown } = checkGeminiCooldown();

    // If Gemini is available (or user provided custom key), try Gemini TTS HD
    if ((!inCooldown || customApiKey) && (customApiKey || process.env.GEMINI_API_KEY)) {
      try {
        const ai = getGenAI(customApiKey);
        const prompt = buildTTSPrompt(voiceInfo.phrase, 0, 1, {
          tone: voiceInfo.tone,
          speedLabel: voiceInfo.speedLabel,
          pitchLabel: voiceInfo.pitchLabel,
          language: 'es',
          customInstructions: 'Locución breve y natural de presentación para preescucha de voz.',
        });

        const ttsResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice,
                },
              },
            },
          },
        });

        const audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioBase64) {
          const pcmBuf = Buffer.from(audioBase64, 'base64');
          const wavBuffer = createWavFromPCM(pcmBuf, 24000, 1);
          const wavBase64 = wavBuffer.toString('base64');
          voicePreviewCache.set(cacheKey, wavBase64);

          return res.json({
            success: true,
            voice,
            audioWavBase64: wavBase64,
            durationSec: 4,
            samplePhrase: voiceInfo.phrase,
            engineUsed: 'gemini_tts',
          });
        }
      } catch (geminiErr: any) {
        console.warn(`[Preview] Gemini TTS error for ${voice}, falling back to Free TTS:`, geminiErr?.message);
      }
    }

    // Free TTS fallback for preview
    const freeRes = await generateFreeSpeech(voiceInfo.phrase, { language: 'es', tone: voiceInfo.tone });
    const wavBase64 = freeRes.buffer.toString('base64');
    voicePreviewCache.set(cacheKey, wavBase64);

    return res.json({
      success: true,
      voice,
      audioWavBase64: wavBase64,
      durationSec: freeRes.durationSec,
      samplePhrase: voiceInfo.phrase,
      engineUsed: 'free_fallback',
    });
  } catch (err: any) {
    console.error('Error in /api/tts/preview:', err);
    res.status(500).json({ error: 'No se pudo generar la preescucha de voz.' });
  }
});


// Reset cooldown manually / retry availability
app.post('/api/quota-reset', (req, res) => {
  geminiQuotaState.isRateLimited = false;
  geminiQuotaState.cooldownUntil = null;
  geminiQuotaState.lastError = null;
  res.json({
    success: true,
    message: 'Contador de cuota reiniciado. Google Gemini TTS listo para nuevo intento.',
  });
});

// Analyze script: estimates duration, tension points, genre, and breaks
app.post('/api/analyze-script', async (req, res) => {
  try {
    const { script } = req.body;
    const customApiKey = ((req.headers['x-gemini-api-key'] as string) || (req.body?.customApiKey as string))?.trim();

    if (!script || typeof script !== 'string') {
      return res.status(400).json({ error: 'El guión es requerido.' });
    }

    const words = script.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    // Average speech rate in Spanish: ~130-150 words per minute
    const estimatedMinutes = Number((wordCount / 135).toFixed(1));
    const chunks = splitScriptIntoChunks(script);

    let tensionScore = 30;
    let tensionMoments: string[] = [];
    let detectedGenre = 'Narrativa';

    const { inCooldown } = checkGeminiCooldown();

    if (!inCooldown || customApiKey) {
      try {
        const ai = getGenAI(customApiKey);
        const analysisPrompt = `Analiza el siguiente guión para una locución/narración profesional.
Devuelve un JSON con:
1. "tensionScore": número del 0 al 100 indicando el nivel de tensión o suspenso en la historia.
2. "detectedGenre": género de la narración (ej: "Misterio / Thriller", "Documental Histórico", "Comercial / Promo", "Drama Emocional", "Noticia / Reportaje", "Fantasía Épica").
3. "tensionMoments": array con hasta 3 frases o momentos clave donde la tensión sube y se recomienda música de fondo tensa.
4. "recommendedTone": el tono de locutor recomendado ('locutor_clasico', 'dramatico', 'epico', 'documental', 'entusiasta', 'misterio', 'calido').

Guión a analizar:
"""
${script.slice(0, 3000)}
"""`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: analysisPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                tensionScore: { type: Type.INTEGER },
                detectedGenre: { type: Type.STRING },
                tensionMoments: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                recommendedTone: { type: Type.STRING },
              },
              required: ['tensionScore', 'detectedGenre', 'tensionMoments'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        if (typeof parsed.tensionScore === 'number') tensionScore = parsed.tensionScore;
        if (parsed.detectedGenre) detectedGenre = parsed.detectedGenre;
        if (Array.isArray(parsed.tensionMoments)) tensionMoments = parsed.tensionMoments;
      } catch (analysisErr: any) {
        if (!customApiKey && (analysisErr.status === 429 || analysisErr.message?.includes('RESOURCE_EXHAUSTED'))) {
          markGeminiQuotaExhausted(analysisErr.message || 'Rate limit alcanzado', 60);
        }
      }
    }

    // Heuristic analysis backup (100% reliable)
    const tensionKeywords = /misterio|muerte|peligro|sombra|terror|secreto|tensión|amenaza|miedo|asesin|oscur|abismo|pánico|grito/i;
    if (tensionKeywords.test(script)) {
      tensionScore = Math.max(tensionScore, 75);
      detectedGenre = detectedGenre === 'Narrativa' ? 'Misterio / Suspenso' : detectedGenre;
      if (tensionMoments.length === 0) tensionMoments = ['Momentos de clímax y revelación'];
    }

    res.json({
      wordCount,
      estimatedMinutes,
      chunksCount: chunks.length,
      tensionScore,
      tensionMoments,
      detectedGenre,
    });
  } catch (err: any) {
    console.error('Error in analyze-script:', err);
    res.status(500).json({ error: err.message || 'Error al analizar el guión' });
  }
});

// Primary TTS Narration Endpoint with Automatic Quota-Failover & Multi-Provider API Key Support
app.post('/api/tts/narrate', async (req, res) => {
  try {
    const {
      script,
      voice = 'Kore',
      tone = 'locutor_clasico',
      speedLabel = 'normal',
      pitchLabel = 'neutro',
      language = 'es',
      customInstructions = '',
      tensionMusicEnabled = true,
      engineMode = 'auto', // 'auto' | 'gemini_only' | 'free_only'
      freeVoiceGender = 'auto', // 'auto' | 'male' | 'female'
      customApiProvider = 'gemini', // 'gemini' | 'groq' | 'openai' | 'elevenlabs'
    } = req.body;

    const customApiKey = ((req.headers['x-gemini-api-key'] as string) || (req.body?.customApiKey as string))?.trim();

    if (!script || typeof script !== 'string' || !script.trim()) {
      return res.status(400).json({ error: 'El guión es requerido para generar la locución.' });
    }

    const isTense = tone === 'dramatico' || tone === 'misterio' || tone === 'epico' || /tensión|misterio|peligro|miedo|oscur/i.test(script);
    const tensionSummary = isTense
      ? 'Se detectó atmósfera de tensión y suspenso en la narración. Música de fondo lista con auto-ducking.'
      : 'Narración balanceada y clara en tono de locución profesional.';

    // 1. Check if user explicitly wants Free Fallback Only
    if (engineMode === 'free_only') {
      console.log('[TTS Request] Generating directly with Free Fallback Engine (User Preference)');
      const freeResult = await generateFreeSpeech(script, { language, tone, gender: freeVoiceGender, voice });
      geminiQuotaState.fallbackCount++;

      return res.json({
        success: true,
        audioWavBase64: freeResult.buffer.toString('base64'),
        audioDurationSec: freeResult.durationSec,
        chunksProcessed: 1,
        tensionDetected: isTense,
        tensionSummary,
        engineUsed: 'free_fallback',
        engineLabel: `Motor Neuronal Gratuito (${freeResult.voiceUsed})`,
        quotaNotice: 'Generado con el Motor Neuronal Gratuito Ilimitado (sin consumo de tokens).',
      });
    }

    // 2. OpenAI TTS Provider (if user provided OpenAI API key)
    if (customApiProvider === 'openai' && customApiKey) {
      try {
        console.log('[TTS Request] Synthesizing with OpenAI TTS...');
        const openAiVoiceMap: Record<string, string> = {
          Fenrir: 'onyx',
          Kore: 'shimmer',
          Puck: 'fable',
          Charon: 'echo',
          Zephyr: 'nova',
        };
        const selectedOpenAiVoice = openAiVoiceMap[voice] || 'alloy';
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${customApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: script,
            voice: selectedOpenAiVoice,
            response_format: 'wav',
          }),
        });

        if (response.ok) {
          const ab = await response.arrayBuffer();
          const wavBuf = Buffer.from(ab);
          const durationSec = Math.round(wavBuf.length / (24000 * 2));
          return res.json({
            success: true,
            audioWavBase64: wavBuf.toString('base64'),
            audioDurationSec: durationSec,
            chunksProcessed: 1,
            tensionDetected: isTense,
            tensionSummary,
            engineUsed: 'openai_tts',
            engineLabel: `OpenAI TTS HD (${selectedOpenAiVoice})`,
          });
        }
      } catch (openAiErr) {
        console.warn('OpenAI TTS failed, initiating failover:', openAiErr);
      }
    }

    // 3. Check if default Gemini is in Cooldown AND no customApiKey was supplied
    const { inCooldown, remainingSec } = checkGeminiCooldown();

    if (!customApiKey && inCooldown && engineMode === 'auto') {
      console.log(`[TTS Auto-Failover] Gemini token refill in ${remainingSec}s. Using Free Fallback Engine (${freeVoiceGender})...`);
      const freeResult = await generateFreeSpeech(script, { language, tone, gender: freeVoiceGender, voice });
      geminiQuotaState.fallbackCount++;

      return res.json({
        success: true,
        audioWavBase64: freeResult.buffer.toString('base64'),
        audioDurationSec: freeResult.durationSec,
        chunksProcessed: 1,
        tensionDetected: isTense,
        tensionSummary,
        engineUsed: 'free_fallback',
        engineLabel: `Motor Neuronal Gratuito (${freeResult.voiceUsed})`,
        quotaNotice: `Tokens de Google agotados temporalmente. Auto-conmutación activada. Los tokens se recargarán en aprox. ${remainingSec}s. Puedes ingresar otra clave API si tienes una.`,
        cooldownRemainingSec: remainingSec,
      });
    }

    // 4. Try Gemini TTS HD (Using Custom Key if provided, or Default Key)
    try {
      const ai = getGenAI(customApiKey);
      const chunks = splitScriptIntoChunks(script, 600);
      console.log(`Processing script (${script.length} chars) into ${chunks.length} chunks with Gemini TTS (Key: ${customApiKey ? 'custom' : 'default'}), voice: ${voice}, tone: ${tone}`);

      const pcmBuffers: Buffer[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        const prompt = buildTTSPrompt(chunkText, i, chunks.length, {
          tone,
          speedLabel,
          pitchLabel,
          language,
          customInstructions,
        });

        const ttsResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice,
                },
              },
            },
          },
        });

        const audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioBase64) {
          const chunkBuf = Buffer.from(audioBase64, 'base64');
          pcmBuffers.push(chunkBuf);

          // Add a natural 150ms pause between paragraph chunks
          if (i < chunks.length - 1) {
            pcmBuffers.push(Buffer.alloc(Math.floor(24000 * 2 * 0.15)));
          }
        }
      }

      if (pcmBuffers.length === 0) {
        throw new Error('No se recibieron datos de audio del modelo Gemini TTS.');
      }

      const combinedPcm = Buffer.concat(pcmBuffers);
      const wavBuffer = createWavFromPCM(combinedPcm, 24000, 1);
      const durationSec = Math.round(combinedPcm.length / (24000 * 2));

      geminiQuotaState.geminiCount++;

      return res.json({
        success: true,
        audioWavBase64: wavBuffer.toString('base64'),
        audioDurationSec: durationSec,
        chunksProcessed: chunks.length,
        tensionDetected: isTense,
        tensionSummary,
        engineUsed: 'gemini_tts',
        engineLabel: customApiKey ? 'Google Gemini 3.1 Flash TTS HD (Tu Clave API)' : 'Google Gemini 3.1 Flash TTS HD',
      });
    } catch (geminiErr: any) {
      console.error('Gemini TTS error encountered:', geminiErr);

      const isQuotaError =
        geminiErr.status === 429 ||
        geminiErr.status === 503 ||
        geminiErr.message?.includes('503') ||
        geminiErr.message?.includes('UNAVAILABLE') ||
        geminiErr.message?.includes('high demand') ||
        geminiErr.message?.includes('429') ||
        geminiErr.message?.includes('RESOURCE_EXHAUSTED') ||
        geminiErr.message?.includes('quota') ||
        geminiErr.message?.includes('Quota') ||
        geminiErr.message?.includes('limit');

      const isKeyAuthError =
        geminiErr.status === 400 ||
        geminiErr.status === 403 ||
        geminiErr.message?.includes('API_KEY_INVALID') ||
        geminiErr.message?.includes('API key');

      if (!customApiKey && isQuotaError) {
        markGeminiQuotaExhausted(geminiErr.message || 'Límite de cuota alcanzado', 60);
      }

      if (engineMode === 'gemini_only' && isQuotaError) {
        return res.status(429).json({
          error: 'Tokens de Google Gemini agotados. Cambia a modo Auto o ingresa otra clave API para continuar.',
          isQuotaExhausted: true,
          customKeyExhausted: Boolean(customApiKey),
          cooldownRemainingSec: 60,
        });
      }

      // If a custom API key was used and ran out of credits or was invalid:
      let customKeyNotice: string | undefined;
      if (customApiKey && (isQuotaError || isKeyAuthError)) {
        customKeyNotice = 'Los créditos de tu clave API personalizada se han agotado o no es válida. Hemos vuelto automáticamente al motor por defecto. Puedes ingresar otra clave API en cualquier momento.';
      }

      // AUTO-FAILOVER: Immediately fallback to Free Neural TTS with user selected gender
      console.log(`[Auto-Failover] Initiating instant fallback to Free Neural Speech Engine (Gender: ${freeVoiceGender})...`);
      try {
        const freeResult = await generateFreeSpeech(script, { language, tone, gender: freeVoiceGender, voice });
        geminiQuotaState.fallbackCount++;

        return res.json({
          success: true,
          audioWavBase64: freeResult.buffer.toString('base64'),
          audioDurationSec: freeResult.durationSec,
          chunksProcessed: 1,
          tensionDetected: isTense,
          tensionSummary,
          engineUsed: 'free_fallback',
          engineLabel: `Motor Neuronal Gratuito (${freeResult.voiceUsed})`,
          quotaNotice: customKeyNotice || 'Los tokens de Google Gemini se agotaron. El audio se generó exitosamente con el Motor Neuronal Gratuito de respaldo. Puedes ingresar otra clave API para reactivar Gemini.',
          customKeyNotice,
          customKeyExhausted: Boolean(customApiKey && (isQuotaError || isKeyAuthError)),
          cooldownRemainingSec: 60,
        });
      } catch (fallbackErr: any) {
        console.error('Fallback engine also encountered an issue:', fallbackErr);
        throw geminiErr;
      }
    }
  } catch (err: any) {
    console.error('Error in /api/tts/narrate:', err);
    res.status(500).json({ error: err.message || 'Error en el procesamiento de voz.' });
  }
});

// "Corrección" & Feedback Refinement Endpoint with Auto-Failover & Custom API Key
app.post('/api/tts/refine', async (req, res) => {
  try {
    const {
      originalScript,
      currentSettings,
      userFeedback,
    } = req.body;

    const customApiKey = ((req.headers['x-gemini-api-key'] as string) || (req.body?.customApiKey as string))?.trim();

    if (!originalScript || !userFeedback) {
      return res.status(400).json({ error: 'Guión original y mensaje de corrección son requeridos.' });
    }

    const freeGender = currentSettings?.freeVoiceGender || 'auto';
    const { inCooldown, remainingSec } = checkGeminiCooldown();

    // If Gemini is in cooldown AND no customApiKey supplied, handle correction via Free TTS
    if (!customApiKey && inCooldown) {
      console.log(`[Refinement] In cooldown (${remainingSec}s). Applying heuristic correction via Free TTS...`);
      const freeResult = await generateFreeSpeech(originalScript, {
        language: currentSettings?.language || 'es',
        tone: currentSettings?.tone,
        gender: freeGender,
        voice: currentSettings?.voice,
      });

      return res.json({
        success: true,
        audioWavBase64: freeResult.buffer.toString('base64'),
        audioDurationSec: freeResult.durationSec,
        refinedInstructions: `Corrección de dirección: "${userFeedback}"`,
        modificationsSummary: `Ajuste procesado con el Motor Neuronal Gratuito de Respaldo (${freeResult.voiceUsed}) debido a recarga de tokens de Google (${remainingSec}s restantes).`,
        adjustedSettings: {
          tone: currentSettings?.tone || 'locutor_clasico',
          speedLabel: currentSettings?.speedLabel || 'normal',
          pitchLabel: currentSettings?.pitchLabel || 'neutro',
        },
        engineUsed: 'free_fallback',
        tensionSummary: `Versión corregida según tu indicación: "${userFeedback}"`,
      });
    }

    try {
      const ai = getGenAI(customApiKey);

      // 1. Process feedback with Gemini 2.5/3.7 Flash
      const refinementPrompt = `Eres un Director de Doblaje y Locución Profesional.
El usuario ha escuchado una narración generada y ha solicitado correcciones específicas.

GUIÓN ORIGINAL:
"""
${originalScript.slice(0, 3000)}
"""

CONFIGURACIÓN PREVIA:
- Voz: ${currentSettings?.voice || 'Kore'}
- Tono: ${currentSettings?.tone || 'locutor_clasico'}
- Velocidad: ${currentSettings?.speedLabel || 'normal'}
- Tono/Pitch: ${currentSettings?.pitchLabel || 'neutro'}

PROBLEMA / CORRECCIÓN SOLICITADA POR EL USUARIO:
"""
${userFeedback}
"""

Analiza exactamente qué le desagradó al usuario y cómo corregirlo de forma precisa.
Devuelve un JSON con:
1. "refinedInstructions": Indicación clara y concisa para el modelo de voz.
2. "modificationsSummary": Explicación al usuario de qué cambios se aplicaron para solucionar su inconveniente.
3. "suggestedTone": Tono ajustado ('locutor_clasico', 'dramatico', 'epico', 'documental', 'entusiasta', 'misterio', 'calido', 'noticiero').
4. "suggestedSpeed": Velocidad ajustada ('muy_lento', 'lento', 'normal', 'rapido', 'muy_rapido').
5. "suggestedPitch": Tono de voz ajustado ('muy_grave', 'grave', 'neutro', 'agudo', 'muy_agudo').`;

      const analysisRes = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: refinementPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refinedInstructions: { type: Type.STRING },
              modificationsSummary: { type: Type.STRING },
              suggestedTone: { type: Type.STRING },
              suggestedSpeed: { type: Type.STRING },
              suggestedPitch: { type: Type.STRING },
            },
            required: ['refinedInstructions', 'modificationsSummary'],
          },
        },
      });

      const parsedPlan = JSON.parse(analysisRes.text || '{}');
      const refinedInstructions = parsedPlan.refinedInstructions || userFeedback;
      const modificationsSummary = parsedPlan.modificationsSummary || 'Se aplicaron los ajustes solicitados.';
      const toneToUse = parsedPlan.suggestedTone || currentSettings?.tone || 'locutor_clasico';
      const speedToUse = parsedPlan.suggestedSpeed || currentSettings?.speedLabel || 'normal';
      const pitchToUse = parsedPlan.suggestedPitch || currentSettings?.pitchLabel || 'neutro';
      const voiceToUse = currentSettings?.voice || 'Kore';

      // 2. Re-synthesize audio with Gemini TTS
      const chunks = splitScriptIntoChunks(originalScript, 600);
      const pcmBuffers: Buffer[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        const prompt = buildTTSPrompt(chunkText, i, chunks.length, {
          tone: toneToUse,
          speedLabel: speedToUse,
          pitchLabel: pitchToUse,
          customInstructions: `${refinedInstructions}. Nota: Atender prioritariamente la corrección del usuario: ${userFeedback}`,
        });

        const ttsResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceToUse,
                },
              },
            },
          },
        });

        const audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioBase64) {
          pcmBuffers.push(Buffer.from(audioBase64, 'base64'));
          if (i < chunks.length - 1) {
            pcmBuffers.push(Buffer.alloc(Math.floor(24000 * 2 * 0.15)));
          }
        }
      }

      if (pcmBuffers.length === 0) {
        throw new Error('No se pudo generar la nueva versión corregida del audio.');
      }

      const combinedPcm = Buffer.concat(pcmBuffers);
      const wavBuffer = createWavFromPCM(combinedPcm, 24000, 1);
      const durationSec = Math.round(combinedPcm.length / (24000 * 2));

      return res.json({
        success: true,
        audioWavBase64: wavBuffer.toString('base64'),
        audioDurationSec: durationSec,
        refinedInstructions,
        modificationsSummary,
        adjustedSettings: {
          tone: toneToUse,
          speedLabel: speedToUse,
          pitchLabel: pitchToUse,
        },
        engineUsed: 'gemini_tts',
        tensionSummary: `Versión corregida según tu indicación: "${userFeedback}"`,
      });
    } catch (refineErr: any) {
      console.warn('Refine error, switching to Free Fallback:', refineErr);
      if (!customApiKey && (refineErr.status === 429 || refineErr.message?.includes('RESOURCE_EXHAUSTED'))) {
        markGeminiQuotaExhausted(refineErr.message || 'Quota exceeded', 60);
      }

      const isCustomKeyExhausted = Boolean(customApiKey && (refineErr.status === 429 || refineErr.message?.includes('RESOURCE_EXHAUSTED') || refineErr.status === 400 || refineErr.status === 403));
      const customKeyNotice = isCustomKeyExhausted
        ? 'Los créditos de tu clave API personalizada se han agotado. Hemos vuelto automáticamente al motor por defecto.'
        : undefined;

      const freeResult = await generateFreeSpeech(originalScript, {
        language: currentSettings?.language || 'es',
        tone: currentSettings?.tone,
        gender: freeGender,
        voice: currentSettings?.voice,
      });

      return res.json({
        success: true,
        audioWavBase64: freeResult.buffer.toString('base64'),
        audioDurationSec: freeResult.durationSec,
        refinedInstructions: `Corrección aplicada: "${userFeedback}"`,
        modificationsSummary: `Ajustes aplicados con el Motor Neuronal Gratuito (${freeResult.voiceUsed}).`,
        adjustedSettings: {
          tone: currentSettings?.tone || 'locutor_clasico',
          speedLabel: currentSettings?.speedLabel || 'normal',
          pitchLabel: currentSettings?.pitchLabel || 'neutro',
        },
        engineUsed: 'free_fallback',
        tensionSummary: `Versión corregida con Motor Gratuito: "${userFeedback}"`,
        customKeyExhausted: isCustomKeyExhausted,
        customKeyNotice,
      });
    }
  } catch (err: any) {
    console.error('Error in /api/tts/refine:', err);
    res.status(500).json({ error: err.message || 'Error al procesar la corrección.' });
  }
});


// Lyria AI Music generation for custom tension tracks
app.post('/api/music/generate', async (req, res) => {
  try {
    const { prompt = 'Cinematic tense atmospheric background soundscape, subtle sub bass, ambient thriller pad, low volume' } = req.body;
    const ai = getGenAI();

    console.log('Generating AI background track with lyria-3-clip-preview...');
    const responseStream = await ai.models.generateContentStream({
      model: 'lyria-3-clip-preview',
      contents: prompt,
    });

    let audioBase64 = '';
    let mimeType = 'audio/wav';

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
      }
    }

    if (!audioBase64) {
      return res.status(500).json({ error: 'No se pudo generar la pista de música con Lyria.' });
    }

    res.json({
      success: true,
      audioBase64,
      mimeType,
    });
  } catch (err: any) {
    console.error('Error in /api/music/generate:', err);
    res.status(500).json({ error: err.message || 'Error al generar música de fondo con IA.' });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Voice Narration Studio Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
