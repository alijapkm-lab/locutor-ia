import React, { useState } from 'react';
import {
  Key,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  X,
  Sparkles,
  ExternalLink,
  Trash2,
  Loader2,
  Cpu,
  Zap,
} from 'lucide-react';
import { ApiProvider } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentApiKey: string;
  currentProvider?: ApiProvider;
  onSaveApiKey: (key: string, provider: ApiProvider) => void;
  onRemoveApiKey: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  currentApiKey,
  currentProvider = 'gemini',
  onSaveApiKey,
  onRemoveApiKey,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider>(currentProvider);
  const [inputKey, setInputKey] = useState(currentApiKey || '');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const providersConfig: Record<ApiProvider, {
    name: string;
    badge: string;
    description: string;
    placeholder: string;
    link: string;
    linkLabel: string;
    modelInfo: string;
  }> = {
    gemini: {
      name: 'Google Gemini AI',
      badge: 'Recomendado (Capa Gratuita)',
      description: 'Clave estándar de Google AI Studio. Funciona perfectamente con Gemini 3.7 Flash y Gemini 3.1 Flash TTS.',
      placeholder: 'AIzaSy...',
      link: 'https://aistudio.google.com/app/apikey',
      linkLabel: 'Obtener clave en Google AI Studio',
      modelInfo: 'Gemini 3.1 Flash TTS HD + Gemini 3.7 Flash',
    },
    groq: {
      name: 'Groq Cloud',
      badge: 'Ultra-Rápido (Capa Gratuita)',
      description: 'Inferencia de ultra-baja latencia con Groq LPU. Capa gratuita generosa sin costes.',
      placeholder: 'gsk_...',
      link: 'https://console.groq.com/keys',
      linkLabel: 'Obtener clave en Groq Console',
      modelInfo: 'Llama-3.3 70B Versatile / Whisper Large',
    },
    openai: {
      name: 'OpenAI',
      badge: 'TTS HD',
      description: 'Modelos de síntesis de voz natural y alta fidelidad de OpenAI (tts-1 / tts-1-hd).',
      placeholder: 'sk-...',
      link: 'https://platform.openai.com/api-keys',
      linkLabel: 'Obtener clave en OpenAI Platform',
      modelInfo: 'OpenAI TTS-1 HD (Onyx, Shimmer, Echo, Nova, Fable)',
    },
    elevenlabs: {
      name: 'ElevenLabs',
      badge: 'Voces Humanoides',
      description: 'Plataforma líder en voces ultra-realistas con entonación emocional profunda.',
      placeholder: 'xi-...',
      link: 'https://elevenlabs.io/app/settings/api-keys',
      linkLabel: 'Obtener clave en ElevenLabs',
      modelInfo: 'Eleven Multilingual v2 / Turbo v2.5',
    },
  };

  const currentConfig = providersConfig[selectedProvider];

  const handleValidateAndSave = async () => {
    const trimmed = inputKey.trim();
    if (!trimmed) {
      setValidationResult({
        valid: false,
        message: 'Por favor introduce una clave API válida para el proveedor seleccionado.',
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: trimmed,
          provider: selectedProvider,
        }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setValidationResult({
          valid: true,
          message: data.message || `¡Clave API de ${currentConfig.name} verificada exitosamente!`,
        });
        onSaveApiKey(trimmed, selectedProvider);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setValidationResult({
          valid: false,
          message: data.error || 'La clave API no es válida o no tiene cuota disponible.',
        });
      }
    } catch (e: any) {
      setValidationResult({
        valid: false,
        message: 'Error al conectar con los servidores de validación.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    setInputKey('');
    setValidationResult(null);
    onRemoveApiKey();
  };

  return (
    <div
      id="api-key-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div
        id="api-key-modal-content"
        className="w-full max-w-lg bg-[#0D0D0F] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 text-left relative max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Conexión de Clave API Alternativa
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Multi-Proveedor
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Conecta tu propia clave de Gemini, Groq, OpenAI o ElevenLabs si se agota la cuota por defecto
            </p>
          </div>
        </div>

        {/* Provider Selector Tabs */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Selecciona el Proveedor de IA / Voces:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(providersConfig) as ApiProvider[]).map((prov) => {
              const cfg = providersConfig[prov];
              const isSelected = selectedProvider === prov;
              return (
                <button
                  key={prov}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(prov);
                    setValidationResult(null);
                  }}
                  className={`p-2.5 rounded-xl text-left border text-xs transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500/80 bg-amber-500/15 text-white ring-1 ring-amber-500/40 shadow-sm'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/5 text-slate-400'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{cfg.name.split(' ')[0]}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <span className="text-[9px] text-slate-400 truncate mt-1">{cfg.badge.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Provider Details Card */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> {currentConfig.name}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
              {currentConfig.badge}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {currentConfig.description}
          </p>
          <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-1 border-t border-white/5">
            <Cpu className="w-3 h-3 text-slate-400" />
            <span>Motor activo: <strong className="text-slate-300">{currentConfig.modelInfo}</strong></span>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Pega tu clave API ({currentConfig.placeholder}):
          </label>
          <div className="relative">
            <input
              type="password"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setValidationResult(null);
              }}
              placeholder={currentConfig.placeholder}
              className="w-full bg-[#050507] border border-white/15 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-hidden font-mono transition-all"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>Se almacena de forma 100% privada en tu navegador.</span>
            <a
              href={currentConfig.link}
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium hover:underline"
            >
              {currentConfig.linkLabel} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Auto-Failover Guarantee Note */}
        <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Garantía de Salto Automático:</strong> Si cualquier clave API se agota o falla, el sistema salta de forma instantánea al <strong>Motor Neuronal Gratuito</strong> con la voz que configuraste (Hombre / Mujer).
          </span>
        </div>

        {/* Validation Feedback */}
        {validationResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
              validationResult.valid
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            {validationResult.valid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span className="leading-tight">{validationResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {currentApiKey ? (
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Quitar clave</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isValidating || !inputKey.trim()}
              onClick={handleValidateAndSave}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-xs font-bold transition-all shadow-md shadow-amber-950/40 cursor-pointer"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Validando...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Conectar Clave</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
