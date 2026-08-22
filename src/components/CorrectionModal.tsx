import React, { useState } from 'react';
import { Wand2, X, AlertCircle, Sparkles, Send, MessageSquare } from 'lucide-react';
import { NarrationSettings } from '../types';

interface CorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitCorrection: (feedback: string) => void;
  currentSettings: NarrationSettings;
  isProcessing: boolean;
}

export const CorrectionModal: React.FC<CorrectionModalProps> = ({
  isOpen,
  onClose,
  onSubmitCorrection,
  currentSettings,
  isProcessing,
}) => {
  const [feedback, setFeedback] = useState('');

  const quickSuggestionChips = [
    'Quiero la voz más grave y profunda',
    'Habla más pausado con silencios dramáticos',
    'Más energía y entusiasmo en el cierre',
    'La pronunciación sonó un poco apresurada',
    'Aumentar la sensación de misterio y tensión',
    'Tono más cálido y empático',
    'Voz más formal de noticiero',
  ];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    onSubmitCorrection(feedback.trim());
  };

  const handleChipClick = (chip: string) => {
    setFeedback((prev) => (prev ? `${prev}. ${chip}` : chip));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl bg-[#0F0F12] rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/10 flex flex-col gap-5 relative text-white">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Solicitar Corrección de Locución
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Describe qué aspecto de la narración no cumple con tus expectativas. La IA procesará tu indicación y re-dirigirá la voz para un resultado exacto.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>¿Qué problema hubo o qué deseas mejorar?</span>
            </label>
            <textarea
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={isProcessing}
              placeholder="Ejemplo: En el segundo párrafo la voz sonó muy alegre cuando debía ser de terror, por favor hazla más grave, con pausas más largas entre oraciones y que susurre ligeramente al final..."
              className="w-full text-xs leading-relaxed p-3.5 rounded-xl border border-white/10 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none text-slate-200 placeholder:text-slate-500 bg-[#0A0A0B]"
            />
          </div>

          {/* Quick suggestions */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Ajustes Rápidos Frecuentes:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickSuggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  disabled={isProcessing}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/15 hover:text-amber-300 text-slate-300 border border-white/10 font-medium transition-colors cursor-pointer"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Current Active Config summary */}
          <div className="p-3 rounded-xl bg-[#0A0A0B] border border-white/10 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span>Voz actual: <strong className="text-white">{currentSettings.voice}</strong></span>
              <span>•</span>
              <span>Tono: <strong className="text-white">{currentSettings.tone}</strong></span>
            </div>
            <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Dirección Inteligente
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!feedback.trim() || isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-bold transition-all shadow-md shadow-amber-950/30 active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Procesar Corrección y Re-grabar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

