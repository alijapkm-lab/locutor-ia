import React, { useMemo } from 'react';
import { FileText, Clock, Sparkles, Trash2, Copy, Check, Flame, Zap } from 'lucide-react';
import { SAMPLE_SCRIPTS } from '../data/voicesAndTones';
import { EmotionalTone, VoiceId, DetectedSFX } from '../types';
import { detectSoundEffectsInScript } from '../utils/sfxDetector';
import { formatTime } from '../utils/audioUtils';

interface ScriptInputAreaProps {
  script: string;
  onChange: (value: string) => void;
  onApplySample: (sample: { text: string; tone: EmotionalTone; voice: VoiceId }) => void;
  isGenerating: boolean;
  tensionScore?: number;
  detectedGenre?: string;
  detectedSFX?: DetectedSFX[];
  sfxEnabled?: boolean;
}

export const ScriptInputArea: React.FC<ScriptInputAreaProps> = ({
  script,
  onChange,
  onApplySample,
  isGenerating,
  tensionScore = 0,
  detectedGenre,
  detectedSFX,
  sfxEnabled = true,
}) => {
  const [copied, setCopied] = React.useState(false);

  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const charCount = script.length;
  // Estimated minutes based on 135 words/min
  const estimatedMin = Math.max(0.1, Number((wordCount / 135).toFixed(1)));
  const estimatedSec = Math.round((wordCount / 135) * 60);

  // Live client-side detected sound effects
  const liveSFX = useMemo(() => {
    if (detectedSFX && detectedSFX.length > 0) return detectedSFX;
    return detectSoundEffectsInScript(script);
  }, [script, detectedSFX]);

  const handleCopy = () => {
    if (!script) return;
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    onChange('');
  };

  const isTense = tensionScore > 50 || /misterio|terror|sombra|tensión|asesin|miedo|peligro/i.test(script);

  return (
    <div className="bg-[#0F0F12] rounded-2xl border border-white/10 shadow-xl p-5 flex flex-col gap-4">
      {/* Header of Text Area */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm font-semibold text-white">
            Guión de Locución
          </h2>
          <span className="text-xs text-slate-400">
            (Hasta 15 minutos continuos)
          </span>
        </div>

        {/* Quick Sample Scripts Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-slate-500 mr-1 hidden sm:inline">
            Ejemplos:
          </span>
          {SAMPLE_SCRIPTS.slice(0, 3).map((sample, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isGenerating}
              onClick={() => onApplySample(sample)}
              className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/15 hover:text-amber-300 text-slate-300 transition-colors font-medium border border-white/10 cursor-pointer"
            >
              {sample.category}
            </button>
          ))}
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          value={script}
          onChange={(e) => onChange(e.target.value)}
          disabled={isGenerating}
          rows={7}
          placeholder="Escribe o pega aquí el guión que deseas transformar en voz de locutor... La aplicación dividirá el texto en segmentos de forma invisible para garantizar una narración fluida y sin cortes, modulando las pausas y la emoción humana según el tono seleccionado."
          className="w-full text-sm leading-relaxed p-4 rounded-xl border border-white/10 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none resize-y min-h-[160px] text-slate-200 placeholder:text-slate-500 font-normal bg-[#0A0A0B]/80"
        />

        {script && (
          <div className="absolute right-3 top-3 flex items-center gap-1 bg-[#131316]/90 backdrop-blur-sm p-1 rounded-lg border border-white/10 shadow-md">
            <button
              type="button"
              onClick={handleCopy}
              title="Copiar texto"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleClear}
              title="Limpiar guión"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Live Detected Sound Effects Bar */}
      {sfxEnabled && liveSFX.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-2.5 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mr-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>SFX Detectados ({liveSFX.length}):</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {liveSFX.map((sfx) => (
              <span
                key={sfx.id}
                title={sfx.contextReason ? `${sfx.name} • ${sfx.contextReason}` : sfx.description}
                className="text-[11px] px-2 py-0.5 rounded-lg bg-[#141418] border border-amber-500/30 text-amber-200 flex items-center gap-1.5 cursor-help"
              >
                <span className="font-mono text-amber-400 font-bold">[{formatTime(sfx.timestampSec)}]</span>
                <span>{sfx.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer stats & indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <Clock className="w-4 h-4 text-amber-500/80" />
            <span>Duración estimada: <strong className="text-white">{estimatedSec < 60 ? `${estimatedSec} seg` : `${estimatedMin} min`}</strong></span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span><strong className="text-slate-200">{wordCount}</strong> palabras</span>
            <span>•</span>
            <span><strong className="text-slate-200">{charCount}</strong> caracteres</span>
          </div>
        </div>

        {/* Tension & Genre detector badge */}
        <div className="flex items-center gap-2">
          {detectedGenre && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-medium border border-amber-500/20">
              {detectedGenre}
            </span>
          )}
          {isTense && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 font-medium border border-rose-500/30 animate-pulse">
              <Flame className="w-3 h-3 text-rose-400" />
              Tensión Detectada
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

