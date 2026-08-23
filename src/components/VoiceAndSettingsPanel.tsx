import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Sliders,
  Volume2,
  Music,
  Gauge,
  Sparkles,
  CheckCircle2,
  Radio,
  Flame,
  Moon,
  Compass,
  Zap,
  Heart,
  ShieldAlert,
  Play,
  Square,
  Loader2,
  VolumeX,
} from 'lucide-react';
import { AVAILABLE_VOICES, EMOTIONAL_TONES, TENSION_MUSIC_STYLES } from '../data/voicesAndTones';
import { EmotionalTone, NarrationSettings, TensionMusicStyle, VoiceId } from '../types';

interface VoiceAndSettingsPanelProps {
  settings: NarrationSettings;
  onChange: (updated: Partial<NarrationSettings>) => void;
  disabled?: boolean;
}

export const VoiceAndSettingsPanel: React.FC<VoiceAndSettingsPanelProps> = ({
  settings,
  onChange,
  disabled = false,
}) => {
  // Voice Preview Audio Player State
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const handlePlayPreview = async (voiceId: VoiceId, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger card selection if only listening
    setPreviewError(null);

    // If already playing this voice, stop it
    if (playingVoice === voiceId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingVoice(null);
      return;
    }

    // If another voice is playing, stop it first
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setLoadingVoice(voiceId);
    setPlayingVoice(null);

    try {
      const res = await fetch(`/api/tts/preview?voice=${voiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice: voiceId,
          customApiKey: settings.customApiKey,
          customApiProvider: settings.customApiProvider,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.audioWavBase64) {
        throw new Error(data.error || 'No se pudo cargar la muestra de voz.');
      }

      const audioSrc = `data:audio/wav;base64,${data.audioWavBase64}`;
      const audio = new Audio(audioSrc);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingVoice(null);
      };

      audio.onerror = () => {
        setPlayingVoice(null);
        setPreviewError(`Error al reproducir voz ${voiceId}`);
      };

      await audio.play();
      setPlayingVoice(voiceId);
    } catch (err: any) {
      console.warn('Voice preview failed:', err);
      setPreviewError(err.message || 'No se pudo reproducir la preescucha.');
      setPlayingVoice(null);
    } finally {
      setLoadingVoice(null);
    }
  };

  const handlePlayFreePreview = async (gender: 'male' | 'female', e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewError(null);
    const key = `free_${gender}`;

    if (playingVoice === key) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingVoice(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setLoadingVoice(key);
    setPlayingVoice(null);

    try {
      const res = await fetch(`/api/tts/free-preview?gender=${gender}`, {
        method: 'GET',
      });
      const data = await res.json();
      if (!res.ok || !data.audioWavBase64) {
        throw new Error(data.error || 'No se pudo cargar la muestra del motor gratuito.');
      }

      const audioSrc = `data:audio/wav;base64,${data.audioWavBase64}`;
      const audio = new Audio(audioSrc);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingVoice(null);
      };

      audio.onerror = () => {
        setPlayingVoice(null);
        setPreviewError('Error al reproducir la muestra de voz gratuita.');
      };

      await audio.play();
      setPlayingVoice(key);
    } catch (err: any) {
      console.warn('Free voice preview failed:', err);
      setPreviewError(err.message || 'No se pudo reproducir la preescucha gratuita.');
      setPlayingVoice(null);
    } finally {
      setLoadingVoice(null);
    }
  };

  const getToneIcon = (iconName: string) => {
    switch (iconName) {
      case 'Radio': return <Radio className="w-4 h-4" />;
      case 'Flame': return <Flame className="w-4 h-4" />;
      case 'Moon': return <Moon className="w-4 h-4" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4" />;
      case 'Compass': return <Compass className="w-4 h-4" />;
      case 'Zap': return <Zap className="w-4 h-4" />;
      case 'Heart': return <Heart className="w-4 h-4" />;
      case 'Mic': default: return <Mic className="w-4 h-4" />;
    }
  };

  const speedOptions: { id: NarrationSettings['speedLabel']; label: string; val: number }[] = [
    { id: 'muy_lento', label: 'Muy Lento (0.8x)', val: 0.8 },
    { id: 'lento', label: 'Pausado (0.9x)', val: 0.9 },
    { id: 'normal', label: 'Normal (1.0x)', val: 1.0 },
    { id: 'rapido', label: 'Ágil (1.15x)', val: 1.15 },
    { id: 'muy_rapido', label: 'Rápido (1.3x)', val: 1.3 },
  ];

  const pitchOptions: { id: NarrationSettings['pitchLabel']; label: string; desc: string }[] = [
    { id: 'muy_grave', label: 'Muy Grave', desc: 'Profundo y cavernoso' },
    { id: 'grave', label: 'Grave', desc: 'Resonancia de pecho clásica' },
    { id: 'neutro', label: 'Neutro', desc: 'Tono natural equilibrado' },
    { id: 'agudo', label: 'Brillante', desc: 'Ligero y abierto' },
    { id: 'muy_agudo', label: 'Agudo', desc: 'Alto y juvenil' },
  ];

  return (
    <div className="bg-[#0D0D0F] rounded-2xl border border-white/10 shadow-xl p-5 space-y-6">
      {/* 1. SELECCIÓN DE VOZ CON PREESCUCHA */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-white">
              1. Selección de Voz & Preescucha
            </h3>
          </div>
          <span className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
            <Volume2 className="w-3 h-3" /> Haz clic en ▶ para escuchar la voz
          </span>
        </div>

        {previewError && (
          <div className="mb-3 p-2 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-[11px]">
            {previewError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {AVAILABLE_VOICES.map((voice) => {
            const isSelected = settings.voice === voice.id;
            const isPlaying = playingVoice === voice.id;
            const isLoading = loadingVoice === voice.id;

            return (
              <div
                key={voice.id}
                onClick={() => !disabled && onChange({ voice: voice.id })}
                className={`p-3 rounded-xl text-left border transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-amber-500/80 bg-amber-500/15 ring-1 ring-amber-500/40 shadow-md'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5 bg-white/[0.02]'
                } ${isPlaying ? 'ring-2 ring-amber-400 bg-amber-950/30' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${voice.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow-xs relative`}>
                      {voice.name[0]}
                      {isPlaying && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      voice.gender === 'Femenina' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {voice.gender}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      {voice.name}
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                    {voice.timbre}
                  </p>
                </div>

                {/* Preescucha Button & Wave Animation */}
                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={(e) => handlePlayPreview(voice.id, e)}
                    title={`Escuchar muestra de voz de ${voice.name}`}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-amber-400 text-black shadow-sm'
                        : 'bg-white/10 hover:bg-amber-500 hover:text-black text-slate-300'
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : isPlaying ? (
                      <Square className="w-3 h-3 fill-current" />
                    ) : (
                      <Play className="w-3 h-3 fill-current" />
                    )}
                    <span>{isPlaying ? 'Detener' : 'Preescucha'}</span>
                  </button>

                  {/* Playing Sound Wave Bars Animation */}
                  {isPlaying ? (
                    <div className="flex items-end gap-0.5 h-3.5">
                      <span className="w-1 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
                      <span className="w-1 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s] h-4" />
                      <span className="w-1 bg-amber-400 rounded-full animate-bounce h-2" />
                      <span className="w-1 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.2s] h-3.5" />
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-500 truncate max-w-[65px]">
                      {voice.recommendedFor.split(',')[0]}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Free Neural Fallback Voice Gender Customization & Preview */}
        <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-[#111115] to-[#16161c] border border-white/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  Voz del Motor Gratuito Ilimitado (Respaldo Neuronal)
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    Sin Tokens
                  </span>
                </span>
                <p className="text-[11px] text-slate-400">
                  Escoge el género de voz que se usará en el motor gratuito si se agota la cuota o deseas locuciones ilimitadas:
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* Auto Mode */}
            <div
              onClick={() => !disabled && onChange({ freeVoiceGender: 'auto' })}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                (settings.freeVoiceGender || 'auto') === 'auto'
                  ? 'border-emerald-500/80 bg-emerald-500/15 ring-1 ring-emerald-500/40 text-white'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/5 text-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>⚡ Automático</span>
                  {(settings.freeVoiceGender || 'auto') === 'auto' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Se empareja automáticamente con el género del personaje que hayas seleccionado arriba.
                </p>
              </div>
            </div>

            {/* Male Voice */}
            <div
              onClick={() => !disabled && onChange({ freeVoiceGender: 'male' })}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                settings.freeVoiceGender === 'male'
                  ? 'border-blue-500/80 bg-blue-500/15 ring-1 ring-blue-500/40 text-white'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/5 text-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1">
                    👤 Voz Masculina
                    <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold">Álvaro</span>
                  </span>
                  {settings.freeVoiceGender === 'male' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Tono firme, solemne, profesional y cinematográfico.
                </p>
              </div>

              <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={(e) => handlePlayFreePreview('male', e)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                    playingVoice === 'free_male'
                      ? 'bg-blue-400 text-black shadow-xs'
                      : 'bg-white/10 hover:bg-blue-500 hover:text-black text-slate-300'
                  }`}
                >
                  {loadingVoice === 'free_male' ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : playingVoice === 'free_male' ? (
                    <Square className="w-2.5 h-2.5 fill-current" />
                  ) : (
                    <Play className="w-2.5 h-2.5 fill-current" />
                  )}
                  <span>{playingVoice === 'free_male' ? 'Detener' : 'Preescucha'}</span>
                </button>
                {playingVoice === 'free_male' && (
                  <span className="text-[9px] text-blue-400 font-semibold animate-pulse">Reproduciendo...</span>
                )}
              </div>
            </div>

            {/* Female Voice */}
            <div
              onClick={() => !disabled && onChange({ freeVoiceGender: 'female' })}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                settings.freeVoiceGender === 'female'
                  ? 'border-rose-500/80 bg-rose-500/15 ring-1 ring-rose-500/40 text-white'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/5 text-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1">
                    👩 Voz Femenina
                    <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-semibold">Elvira</span>
                  </span>
                  {settings.freeVoiceGender === 'female' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Tono cálido, articulado, elegante y natural.
                </p>
              </div>

              <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={(e) => handlePlayFreePreview('female', e)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                    playingVoice === 'free_female'
                      ? 'bg-rose-400 text-black shadow-xs'
                      : 'bg-white/10 hover:bg-rose-500 hover:text-black text-slate-300'
                  }`}
                >
                  {loadingVoice === 'free_female' ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : playingVoice === 'free_female' ? (
                    <Square className="w-2.5 h-2.5 fill-current" />
                  ) : (
                    <Play className="w-2.5 h-2.5 fill-current" />
                  )}
                  <span>{playingVoice === 'free_female' ? 'Detener' : 'Preescucha'}</span>
                </button>
                {playingVoice === 'free_female' && (
                  <span className="text-[9px] text-rose-400 font-semibold animate-pulse">Reproduciendo...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* 2. TONO EMOCIONAL */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              2. Tono Emocional y Estilo de Narración
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Modula la entonación y las pausas
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {EMOTIONAL_TONES.map((tone) => {
            const isSelected = settings.tone === tone.id;
            return (
              <button
                key={tone.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ tone: tone.id })}
                className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? `${tone.color} ring-1 ring-amber-500/40 shadow-sm`
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5 bg-white/[0.02] text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="p-1 rounded-md bg-white/10 text-white shadow-2xs">
                      {getToneIcon(tone.icon)}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-slate-300 border border-white/5">
                      {tone.badge}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white">
                    {tone.label}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                    {tone.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. VELOCIDAD Y TONO DE VOZ (PITCH) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-white/10">
        {/* Velocidad */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <label className="text-xs font-bold text-white">
                Velocidad de Lectura
              </label>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-200">
              {speedOptions.find((o) => o.id === settings.speedLabel)?.label || 'Normal'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {speedOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ speedLabel: opt.id, speed: opt.val })}
                className={`py-1.5 px-1 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                  settings.speedLabel === opt.id
                    ? 'border-emerald-500/80 bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'border-white/10 hover:bg-white/5 text-slate-400'
                }`}
              >
                {opt.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Tono / Pitch */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <label className="text-xs font-bold text-white">
                Tono de Voz (Pitch)
              </label>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-200">
              {pitchOptions.find((o) => o.id === settings.pitchLabel)?.label || 'Neutro'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {pitchOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ pitchLabel: opt.id })}
                className={`py-1.5 px-1 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                  settings.pitchLabel === opt.id
                    ? 'border-amber-500/80 bg-amber-500/20 text-amber-300 font-bold'
                    : 'border-white/10 hover:bg-white/5 text-slate-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. MÚSICA DE FONDO EN SITUACIONES DE TENSIÓN */}
      <div className="pt-2 border-t border-white/10 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Música de Fondo en Momentos de Tensión
              </h3>
              <p className="text-[11px] text-slate-400">
                Genera atmósfera musical cinematográfica con atenuación automática (auto-ducking) para que no tape la voz.
              </p>
            </div>
          </div>

          {/* Toggle button */}
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.tensionMusicEnabled}
              disabled={disabled}
              onChange={(e) => onChange({ tensionMusicEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-700 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {settings.tensionMusicEnabled && (
          <div className="p-3.5 rounded-xl bg-[#131317] border border-white/10 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TENSION_MUSIC_STYLES.slice(0, 3).map((style) => (
                <button
                  key={style.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ tensionMusicStyle: style.id })}
                  className={`p-2.5 rounded-lg text-left border text-xs transition-all cursor-pointer ${
                    settings.tensionMusicStyle === style.id
                      ? 'border-amber-500/80 bg-amber-500/15 text-amber-200 font-medium shadow-sm'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="font-bold text-white">{style.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{style.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 text-xs pt-1">
              <div className="flex items-center gap-2 text-slate-300">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>Volumen de la música: <strong className="text-white">{Math.round((settings.musicVolume || 0.22) * 100)}%</strong></span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.45"
                step="0.01"
                value={settings.musicVolume || 0.22}
                disabled={disabled}
                onChange={(e) => onChange({ musicVolume: parseFloat(e.target.value) })}
                className="w-40 accent-amber-500 cursor-pointer"
              />
              <span className="text-[11px] text-amber-300 font-medium bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                Auto-Ducking Activo
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

