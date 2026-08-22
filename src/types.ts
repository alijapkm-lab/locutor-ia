export type VoiceId = 'Kore' | 'Fenrir' | 'Puck' | 'Charon' | 'Zephyr';

export type EngineMode = 'auto' | 'gemini_only' | 'free_only';

export interface QuotaStatus {
  geminiAvailable: boolean;
  isCooldownActive: boolean;
  cooldownRemainingSec: number;
  totalCooldownSec: number;
  lastError: string | null;
  activeEngine: 'gemini_tts' | 'free_fallback';
  geminiGenerationsCount: number;
  fallbackGenerationsCount: number;
  nextRefillEstimatedAt: string | null;
  hasDefaultKey: boolean;
}

export interface VoiceOption {
  id: VoiceId;
  name: string;
  gender: 'Femenina' | 'Masculina';
  description: string;
  timbre: string;
  recommendedFor: string;
  avatarColor: string;
  samplePhrase: string;
}

export type EmotionalTone =
  | 'locutor_clasico'
  | 'dramatico'
  | 'epico'
  | 'documental'
  | 'entusiasta'
  | 'misterio'
  | 'calido'
  | 'noticiero';

export interface ToneOption {
  id: EmotionalTone;
  label: string;
  description: string;
  icon: string;
  badge: string;
  color: string;
}

export type TensionMusicStyle =
  | 'cinematic_suspense'
  | 'dark_drone'
  | 'pulse_thriller'
  | 'noir_strings'
  | 'ambient_tension'
  | 'none';

export interface ScriptAnalysis {
  wordCount: number;
  estimatedMinutes: number;
  chunksCount: number;
  tensionScore: number; // 0 to 100
  tensionMoments: string[];
  detectedGenre: string;
}

export type FreeVoiceGender = 'auto' | 'male' | 'female';
export type ApiProvider = 'gemini' | 'groq' | 'openai' | 'elevenlabs';

export interface MultiApiKeyConfig {
  gemini?: string;
  groq?: string;
  openai?: string;
  elevenlabs?: string;
  activeProvider: ApiProvider;
}

export interface NarrationSettings {
  voice: VoiceId;
  tone: EmotionalTone;
  language: string;
  speed: number; // 0.75 - 1.5
  pitch: number; // -5 to +5 semitones or 0.8 to 1.2
  speedLabel: 'muy_lento' | 'lento' | 'normal' | 'rapido' | 'muy_rapido';
  pitchLabel: 'muy_grave' | 'grave' | 'neutro' | 'agudo' | 'muy_agudo';
  tensionMusicEnabled: boolean;
  tensionMusicStyle: TensionMusicStyle;
  musicVolume: number; // 0.0 to 1.0 (default 0.20)
  engineMode?: EngineMode;
  freeVoiceGender?: FreeVoiceGender;
  customInstructions?: string;
  customApiKey?: string;
  customApiProvider?: ApiProvider;
}

export interface NarrationResult {
  id: string;
  createdAt: string;
  script: string;
  audioWavBase64: string;
  audioDurationSec: number;
  settings: NarrationSettings;
  chunksProcessed: number;
  tensionDetected: boolean;
  tensionSummary?: string;
  engineUsed: 'gemini_tts' | 'free_fallback';
  engineLabel: string;
  quotaNotice?: string;
  customKeyNotice?: string;
  musicAudioBase64?: string;
  correctionHistory?: {
    feedback: string;
    appliedAdjustments: string;
    timestamp: string;
  }[];
}

export interface CorrectionRequest {
  originalScript: string;
  currentSettings: NarrationSettings;
  userFeedback: string;
  previousResultId?: string;
  customApiKey?: string;
}

export interface RefinementResponse {
  refinedInstructions: string;
  modificationsSummary: string;
  adjustedSettings: Partial<NarrationSettings>;
  audioWavBase64: string;
  audioDurationSec: number;
  engineUsed?: 'gemini_tts' | 'free_fallback';
  tensionSummary?: string;
  customKeyExhausted?: boolean;
  customKeyNotice?: string;
}

export interface VoicePreviewResponse {
  success: boolean;
  voice: VoiceId;
  audioWavBase64: string;
  durationSec: number;
  samplePhrase: string;
  engineUsed: string;
}


