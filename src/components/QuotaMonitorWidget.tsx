import React, { useEffect, useState } from 'react';
import { QuotaStatus, EngineMode } from '../types';
import { Sparkles, Zap, Clock, RefreshCw, ShieldCheck, AlertTriangle, Key, ChevronRight } from 'lucide-react';

interface QuotaMonitorWidgetProps {
  quotaStatus: QuotaStatus | null;
  engineMode: EngineMode;
  customApiKey?: string;
  onEngineModeChange: (mode: EngineMode) => void;
  onRefreshQuota: () => void;
  onOpenApiKeyModal: () => void;
}

export const QuotaMonitorWidget: React.FC<QuotaMonitorWidgetProps> = ({
  quotaStatus,
  engineMode,
  customApiKey,
  onEngineModeChange,
  onRefreshQuota,
  onOpenApiKeyModal,
}) => {
  const [countdown, setCountdown] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (quotaStatus?.cooldownRemainingSec) {
      setCountdown(quotaStatus.cooldownRemainingSec);
    } else {
      setCountdown(0);
    }
  }, [quotaStatus?.cooldownRemainingSec]);

  // Live 1-second countdown ticker
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onRefreshQuota();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown, onRefreshQuota]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/quota-reset', { method: 'POST' });
      onRefreshQuota();
    } catch (e) {
      console.warn('Failed to reset quota:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCooldown = quotaStatus?.isCooldownActive || countdown > 0;
  const progressPercent = quotaStatus?.totalCooldownSec
    ? Math.max(0, Math.min(100, ((quotaStatus.totalCooldownSec - countdown) / quotaStatus.totalCooldownSec) * 100))
    : 100;

  return (
    <div
      id="quota-monitor-widget"
      className={`rounded-2xl border transition-all p-4 space-y-3 ${
        isCooldown
          ? 'bg-amber-950/25 border-amber-500/40 shadow-lg shadow-amber-950/30'
          : 'bg-[#0D0D0F] border-white/10 shadow-xl'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Engine & Token Status */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border ${
              isCooldown
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            {isCooldown ? <Zap className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                {isCooldown
                  ? 'Modo Salto Automático Activo (Motor Gratuito)'
                  : 'Motor Principal: Google Gemini TTS HD'}
              </span>

              {isCooldown ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Tokens en recarga
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Cuota Disponible
                </span>
              )}

              {/* Custom API Key Badge */}
              {customApiKey ? (
                <button
                  type="button"
                  onClick={onOpenApiKeyModal}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition-colors cursor-pointer"
                >
                  <Key className="w-2.5 h-2.5" />
                  Clave Personalizada Activa
                </button>
              ) : null}
            </div>

            <p className="text-[11px] text-slate-400 max-w-xl">
              {isCooldown
                ? 'Los tokens de Gemini alcanzaron su ventana temporal. El motor de respaldo gratuito genera tus audios sin esperas ni límites.'
                : 'Generación con voces ultra-realistas. Si los tokens se agotan, el sistema conmuta automáticamente al motor gratuito.'}
            </p>
          </div>
        </div>

        {/* Right: Live Countdown & Engine Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Real-time Countdown when in Cooldown */}
          {isCooldown && (
            <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-amber-500/30 text-amber-300 font-mono text-xs shadow-inner">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Recarga en:</span>
              <strong className="text-white text-sm font-bold">{formatCountdown(countdown)}s</strong>
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden ml-1">
                <div
                  className="h-full bg-amber-400 transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Key Management Button */}
          <button
            type="button"
            onClick={onOpenApiKeyModal}
            title="Configurar clave API de Google Gemini personalizada"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              customApiKey
                ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/50'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>{customApiKey ? 'Gestionar Clave API' : 'Poner Clave API'}</span>
          </button>

          {/* Engine Selector Dropdown / Toggle */}
          <div className="flex items-center bg-[#0A0A0B] p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => onEngineModeChange('auto')}
              title="Prioriza Gemini HD y salta al motor gratuito si se agotan tokens"
              className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                engineMode === 'auto'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Auto-Salto
            </button>
            <button
              type="button"
              onClick={() => onEngineModeChange('free_only')}
              title="Siempre usar el motor gratuito sin gastar ningún token"
              className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                engineMode === 'free_only'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🆓 100% Gratuito
            </button>
            <button
              type="button"
              onClick={() => onEngineModeChange('gemini_only')}
              title="Solo usar Google Gemini TTS HD"
              className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                engineMode === 'gemini_only'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ✨ Solo Gemini
            </button>
          </div>

          {/* Re-check / Reset Button */}
          <button
            type="button"
            disabled={isRefreshing}
            onClick={handleManualRefresh}
            title="Comprobar disponibilidad de Google Gemini"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Helpful Prompt in Free/Cooldown Mode */}
      {isCooldown && !customApiKey && (
        <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-200/90">
          <div className="flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>¿Tienes otra cuenta de Google AI Studio? Puedes agregar su clave API para seguir usando Gemini HD de inmediato.</span>
          </div>
          <button
            type="button"
            onClick={onOpenApiKeyModal}
            className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer flex-shrink-0"
          >
            <span>Agregar clave Gemini</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

