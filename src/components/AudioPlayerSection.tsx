import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Download,
  Volume2,
  VolumeX,
  Music,
  SlidersHorizontal,
  Wand2,
  FileAudio,
  Check,
  Flame,
  Clock,
  Sparkles,
  Zap,
  Info,
} from 'lucide-react';
import { NarrationResult } from '../types';
import { audioBufferToMp3, audioBufferToWavBlob, downloadBlob, formatTime, mixVoiceAndMusic } from '../utils/audioUtils';
import { generateProceduralTensionTrack } from '../utils/tensionMusicGenerator';

interface AudioPlayerSectionProps {
  result: NarrationResult;
  onOpenCorrection: () => void;
}

export const AudioPlayerSection: React.FC<AudioPlayerSectionProps> = ({
  result,
  onOpenCorrection,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(result.audioDurationSec || 0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [voiceVolume, setVoiceVolume] = useState(1.0);
  const [musicVolume, setMusicVolume] = useState(result.settings.musicVolume || 0.22);
  const [isMuted, setIsMuted] = useState(false);
  const [includeMusicInExport, setIncludeMusicInExport] = useState(result.settings.tensionMusicEnabled);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const voiceBufferRef = useRef<AudioBuffer | null>(null);
  const musicBufferRef = useRef<AudioBuffer | null>(null);
  const voiceSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const voiceGainRef = useRef<GainNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize Web Audio graph
  useEffect(() => {
    let active = true;

    async function initAudio() {
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        // Decode Base64 WAV
        const binary = atob(result.audioWavBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        const decodedVoice = await ctx.decodeAudioData(bytes.buffer.slice(0));
        if (!active) return;
        voiceBufferRef.current = decodedVoice;
        setDuration(decodedVoice.duration);

        // Generate matching tension background music if enabled
        if (result.settings.tensionMusicEnabled) {
          const generatedMusic = generateProceduralTensionTrack(
            ctx,
            result.settings.tensionMusicStyle,
            decodedVoice.duration + 2.0
          );
          musicBufferRef.current = generatedMusic;
        } else {
          musicBufferRef.current = null;
        }

        drawWaveform(decodedVoice);
      } catch (err) {
        console.error('Error decoding audio:', err);
      }
    }

    initAudio();

    return () => {
      active = false;
      stopAudio();
    };
  }, [result]);

  // Waveform visualization
  const drawWaveform = (buffer: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Gradient background
    ctx.fillStyle = '#0A0A0B';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Bars
    const barWidth = 2.5;
    const gap = 1.5;
    const numBars = Math.floor(width / (barWidth + gap));
    const blockStep = Math.floor(data.length / numBars);

    for (let i = 0; i < numBars; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < blockStep; j++) {
        const datum = data[i * blockStep + j] || 0;
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const barHeight = Math.max(4, (max - min) * amp * 0.85);
      const x = i * (barWidth + gap);
      const y = (height - barHeight) / 2;

      // Color based on play progress
      const progressRatio = currentTime / (duration || 1);
      const isPast = x / width <= progressRatio;

      ctx.fillStyle = isPast ? '#f59e0b' : '#3f3f46';
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    }
  };

  // Live timer loop
  const updateProgress = () => {
    if (!audioCtxRef.current || !isPlaying) return;
    const elapsed = (audioCtxRef.current.currentTime - startTimeRef.current) * playbackRate + pausedAtRef.current;
    if (elapsed >= duration) {
      setIsPlaying(false);
      setCurrentTime(0);
      pausedAtRef.current = 0;
      return;
    }
    setCurrentTime(elapsed);
    if (voiceBufferRef.current) {
      drawWaveform(voiceBufferRef.current);
    }
    animFrameRef.current = requestAnimationFrame(updateProgress);
  };

  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(updateProgress);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, currentTime]);

  const playAudio = (startFrom = currentTime) => {
    if (!audioCtxRef.current || !voiceBufferRef.current) return;
    const ctx = audioCtxRef.current;

    stopAudioSources();

    const masterGain = ctx.createGain();
    masterGain.gain.value = isMuted ? 0 : 1;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // Voice node
    const vGain = ctx.createGain();
    vGain.gain.value = voiceVolume;
    vGain.connect(masterGain);
    voiceGainRef.current = vGain;

    const vSource = ctx.createBufferSource();
    vSource.buffer = voiceBufferRef.current;
    vSource.playbackRate.value = playbackRate;
    vSource.connect(vGain);
    vSource.start(0, startFrom);
    voiceSourceRef.current = vSource;

    // Music node
    if (result.settings.tensionMusicEnabled && musicBufferRef.current) {
      const mGain = ctx.createGain();
      mGain.gain.value = musicVolume;
      mGain.connect(masterGain);
      musicGainRef.current = mGain;

      const mSource = ctx.createBufferSource();
      mSource.buffer = musicBufferRef.current;
      mSource.loop = true;
      mSource.connect(mGain);
      mSource.start(0, startFrom % musicBufferRef.current.duration);
      musicSourceRef.current = mSource;
    }

    startTimeRef.current = ctx.currentTime;
    pausedAtRef.current = startFrom;
    setIsPlaying(true);
  };

  const stopAudioSources = () => {
    if (voiceSourceRef.current) {
      try { voiceSourceRef.current.stop(); } catch (e) {}
      voiceSourceRef.current.disconnect();
      voiceSourceRef.current = null;
    }
    if (musicSourceRef.current) {
      try { musicSourceRef.current.stop(); } catch (e) {}
      musicSourceRef.current.disconnect();
      musicSourceRef.current = null;
    }
  };

  const stopAudio = () => {
    stopAudioSources();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
      pausedAtRef.current = currentTime;
    } else {
      playAudio(currentTime >= duration ? 0 : currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    pausedAtRef.current = newTime;
    if (isPlaying) {
      playAudio(newTime);
    } else if (voiceBufferRef.current) {
      drawWaveform(voiceBufferRef.current);
    }
  };

  const skipSeconds = (secs: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + secs));
    setCurrentTime(newTime);
    pausedAtRef.current = newTime;
    if (isPlaying) {
      playAudio(newTime);
    }
  };

  // Export handlers
  const handleDownloadMp3 = async () => {
    if (!audioCtxRef.current || !voiceBufferRef.current) return;
    setIsExporting(true);
    try {
      let finalBuffer = voiceBufferRef.current;
      if (includeMusicInExport && musicBufferRef.current) {
        finalBuffer = mixVoiceAndMusic(
          audioCtxRef.current,
          voiceBufferRef.current,
          musicBufferRef.current,
          musicVolume,
          true
        );
      }
      const mp3Blob = audioBufferToMp3(finalBuffer, 256);
      const filename = `locucion_${result.settings.voice}_${Date.now()}.mp3`;
      downloadBlob(mp3Blob, filename);
      setExportSuccess('MP3 descargado con alta calidad');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err) {
      console.error('Error generating MP3:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadWav = async () => {
    if (!audioCtxRef.current || !voiceBufferRef.current) return;
    setIsExporting(true);
    try {
      let finalBuffer = voiceBufferRef.current;
      if (includeMusicInExport && musicBufferRef.current) {
        finalBuffer = mixVoiceAndMusic(
          audioCtxRef.current,
          voiceBufferRef.current,
          musicBufferRef.current,
          musicVolume,
          true
        );
      }
      const wavBlob = audioBufferToWavBlob(finalBuffer);
      const filename = `locucion_${result.settings.voice}_master.wav`;
      downloadBlob(wavBlob, filename);
      setExportSuccess('WAV descargado con calidad máster');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err) {
      console.error('Error generating WAV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-[#0D0D0F] text-white rounded-2xl shadow-2xl p-6 border border-white/10 space-y-6">
      {/* Top Bar: Title, Badges & Correction Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-sm">
            <FileAudio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Narración Masterizada
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                Voz: {result.settings.voice}
              </span>
              {/* Engine Badge */}
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border ${
                  result.isPartial
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : result.isHybrid
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : result.engineUsed === 'free_fallback'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                }`}
              >
                {result.isPartial ? (
                  <Zap className="w-3 h-3 text-amber-400" />
                ) : result.isHybrid ? (
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                ) : result.engineUsed === 'free_fallback' ? (
                  <Zap className="w-3 h-3 text-amber-400" />
                ) : (
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                )}
                {result.isPartial
                  ? `Parcial (${result.chunksProcessed}/${result.totalChunks || result.chunksProcessed} partes)`
                  : result.isHybrid
                  ? 'Híbrido (Gemini HD + Neuronal)'
                  : result.engineLabel || (result.engineUsed === 'free_fallback' ? 'Motor Gratuito' : 'Google Gemini HD')}
              </span>
              {result.tensionDetected && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  Tensión Sonora
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {result.tensionSummary || 'Audio listo para reproducción y descarga en alta fidelidad.'}
            </p>
          </div>
        </div>

        {/* PROMINENT "CORRECCIÓN" BUTTON */}
        <button
          type="button"
          onClick={onOpenCorrection}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-md shadow-amber-950/30 cursor-pointer"
        >
          <Wand2 className="w-4 h-4 text-amber-400" />
          <span>Pedir Corrección / Ajustar Audio</span>
        </button>
      </div>

      {/* Partial / Quota Failover Notice Banner if applicable */}
      {result.isPartial && (
        <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-3 shadow-lg shadow-amber-950/20">
          <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-300 uppercase tracking-wider text-[10px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                Producción Parcial por Límite de Tokens
              </span>
              <span className="text-[11px] text-amber-300 font-mono">
                {formatTime(duration)} generados
              </span>
            </div>
            <p className="text-xs text-amber-100/90 leading-relaxed">
              {result.quotaNotice ||
                `Tus tokens de Google Gemini se agotaron tras generar los primeros ${formatTime(duration)} de locución. El audio producido está listo para reproducir y descargar.`}
            </p>
          </div>
        </div>
      )}

      {!result.isPartial && result.quotaNotice && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-300">
              {result.isHybrid ? 'Conmutación Inteligente Híbrida:' : 'Aviso de Motor de Respaldo:'}
            </span>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">{result.quotaNotice}</p>
          </div>
        </div>
      )}

      {/* Waveform Canvas */}
      <div className="relative rounded-xl overflow-hidden bg-[#0A0A0B] border border-white/10">
        <canvas
          ref={canvasRef}
          width={800}
          height={85}
          className="w-full h-22 block"
        />
        <div className="absolute bottom-2 right-3 px-2 py-0.5 rounded bg-black/80 text-[10px] text-slate-400 font-mono border border-white/10">
          24.0 kHz PCM 16-Bit
        </div>
      </div>

      {/* Timeline Scrubbing Bar */}
      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
        />
        <div className="flex justify-between text-xs font-mono text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls and Volume */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => skipSeconds(-10)}
            title="Retroceder 10s"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-500/20 font-bold transition-transform active:scale-95 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => skipSeconds(10)}
            title="Avanzar 10s"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Speed selector */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 text-xs">
            {[0.8, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => {
                  setPlaybackRate(rate);
                  if (voiceSourceRef.current) voiceSourceRef.current.playbackRate.value = rate;
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                  playbackRate === rate ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Dual Track Mixer: Voice vs Tension Music */}
        <div className="flex items-center gap-4 bg-[#0A0A0B] p-2.5 rounded-xl border border-white/10 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Voz:</span>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={voiceVolume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVoiceVolume(v);
                if (voiceGainRef.current) voiceGainRef.current.gain.value = v;
              }}
              className="w-16 accent-amber-500 cursor-pointer"
            />
          </div>

          {result.settings.tensionMusicEnabled && (
            <div className="flex items-center gap-1.5 text-slate-300 border-l border-white/10 pl-3">
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span>Música Tensión:</span>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={musicVolume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setMusicVolume(v);
                  if (musicGainRef.current) musicGainRef.current.gain.value = v;
                }}
                className="w-16 accent-amber-500 cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Export Section (MP3 & WAV) */}
      <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeMusicInExport}
              onChange={(e) => setIncludeMusicInExport(e.target.checked)}
              className="accent-amber-500 rounded"
            />
            <span>Incluir mezcla de música de fondo en la descarga</span>
          </label>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {exportSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/50">
              <Check className="w-3.5 h-3.5" />
              {exportSuccess}
            </span>
          )}

          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadMp3}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md shadow-amber-950/30 active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar MP3 (Alta Calidad)</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadWav}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-medium transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar WAV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
