import React, { useEffect, useState } from 'react';
import { Mic2, Radio, Sparkles, Wand2, CheckCircle2 } from 'lucide-react';

interface GenerationModalProps {
  isOpen: boolean;
  stepMessage?: string;
  isCorrection?: boolean;
}

export const GenerationModal: React.FC<GenerationModalProps> = ({
  isOpen,
  stepMessage,
  isCorrection = false,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = isCorrection
    ? [
        { title: 'Analizando corrección del usuario...', desc: 'Gemini interpreta las indicaciones y formula nuevas pautas de locución.' },
        { title: 'Re-segmentando y modulando el guión...', desc: 'Ajustando velocidad, entonación, pausas y resonancia vocal.' },
        { title: 'Sintetizando locución corregida...', desc: 'Generando audio de alta definición con el modelo de voz humana.' },
        { title: 'Masterizando y equilibrando música...', desc: 'Compilando pista final en 24kHz y codificación MP3.' },
      ]
    : [
        { title: 'Procesando y segmentando guión...', desc: 'División oculta del texto en bloques narrativos naturales.' },
        { title: 'Generando locución con voz humana...', desc: 'Invocando modelo de síntesis con el tono emocional y ritmo deseado.' },
        { title: 'Analizando curvas de tensión...', desc: 'Generando pista de música de suspenso adaptativa con auto-ducking.' },
        { title: 'Masterizando audio final...', desc: 'Uniendo segmentos en flujo continuo y ecualizando salida MP3.' },
      ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2800);
    return () => clearInterval(interval);
  }, [isOpen, steps.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-[#0F0F12] rounded-3xl p-7 shadow-2xl border border-white/10 flex flex-col items-center text-center space-y-6">
        {/* Animated Studio Logo / Mic */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-white shadow-xl shadow-amber-950/40 animate-pulse">
            {isCorrection ? <Wand2 className="w-10 h-10 text-amber-400" /> : <Mic2 className="w-10 h-10 text-amber-400" />}
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-[#0F0F12] shadow-sm">
            <Radio className="w-3.5 h-3.5 animate-spin" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-white">
            {isCorrection ? 'Aplicando Corrección y Re-grabando' : 'Creando Locución Profesional'}
          </h3>
          <p className="text-xs text-slate-400">
            {stepMessage || steps[currentStep]?.desc}
          </p>
        </div>

        {/* Multi-step progress bar */}
        <div className="w-full space-y-2.5 text-left">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-xs transition-all flex items-center gap-3 ${
                  isCurrent
                    ? 'border-amber-500/80 bg-amber-500/15 text-amber-200 font-bold shadow-sm'
                    : isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-medium'
                    : 'border-white/5 bg-white/[0.02] text-slate-500'
                }`}
              >
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-zinc-700" />
                  )}
                </div>
                <div className="flex-1 truncate">
                  <div className="truncate">{step.title}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quality notice */}
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Generación sin cortes con modelo Gemini TTS HD</span>
        </div>
      </div>
    </div>
  );
};

