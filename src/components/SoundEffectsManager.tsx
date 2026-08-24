import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Zap,
  Flame,
  CloudRain,
  Wind,
  Waves,
  DoorOpen,
  Footprints,
  HeartPulse,
  Clock,
  TrendingUp,
  Ghost,
  Bomb,
  Crosshair,
  Swords,
  Sparkle,
  FastForward,
  Bell,
  Siren,
  Award,
  Camera,
  Radio,
  Plus,
  Trash2,
  Check,
  Layers,
  Sliders,
  Filter,
  ShieldCheck,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { SOUND_EFFECTS_CATALOG } from '../data/soundEffectsCatalog';
import { OPEN_AUDIO_REPOSITORIES } from '../data/openSfxLibrary';
import { DetectedSFX, SFXCategory, SoundEffectDefinition, SoundEffectId } from '../types';
import { playSFXPreview, loadAndCacheSFXBuffer } from '../utils/sfxAudioLoader';
import { formatTime } from '../utils/audioUtils';
import { createManualSFX } from '../utils/sfxDetector';

interface SoundEffectsManagerProps {
  sfxList: DetectedSFX[];
  onChangeSFXList: (updatedList: DetectedSFX[]) => void;
  sfxEnabled: boolean;
  onToggleSFXEnabled: (enabled: boolean) => void;
  sfxVolume: number;
  onChangeSFXVolume: (volume: number) => void;
  estimatedDurationSec?: number;
  compact?: boolean;
}

// Icon mapper for catalog items
export const getSFXIcon = (iconName: string, className = 'w-4 h-4') => {
  switch (iconName) {
    case 'Zap': return <Zap className={className} />;
    case 'CloudRain': return <CloudRain className={className} />;
    case 'Wind': return <Wind className={className} />;
    case 'Waves': return <Waves className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'DoorOpen': return <DoorOpen className={className} />;
    case 'Footprints': return <Footprints className={className} />;
    case 'HeartPulse': return <HeartPulse className={className} />;
    case 'Clock': return <Clock className={className} />;
    case 'TrendingUp': return <TrendingUp className={className} />;
    case 'Ghost': return <Ghost className={className} />;
    case 'Bomb': return <Bomb className={className} />;
    case 'Crosshair': return <Crosshair className={className} />;
    case 'Swords': return <Swords className={className} />;
    case 'Sparkle': return <Sparkle className={className} />;
    case 'FastForward': return <FastForward className={className} />;
    case 'Bell': return <Bell className={className} />;
    case 'Siren': return <Siren className={className} />;
    case 'Award': return <Award className={className} />;
    case 'Camera': return <Camera className={className} />;
    case 'Radio': return <Radio className={className} />;
    default: return <Sparkles className={className} />;
  }
};

export const SoundEffectsManager: React.FC<SoundEffectsManagerProps> = ({
  sfxList,
  onChangeSFXList,
  sfxEnabled,
  onToggleSFXEnabled,
  sfxVolume,
  onChangeSFXVolume,
  estimatedDurationSec = 60,
  compact = false,
}) => {
  const [playingSfxId, setPlayingSfxId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SFXCategory | 'todos'>('todos');
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showLibraryInfoModal, setShowLibraryInfoModal] = useState(false);
  const [manualTimeSec, setManualTimeSec] = useState<number>(5);

  const stopCurrentPreviewRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (stopCurrentPreviewRef.current) {
        stopCurrentPreviewRef.current();
      }
    };
  }, []);

  const playPreviewEffect = async (effectId: SoundEffectId, instanceKey: string, customAudioUrl?: string) => {
    // If already playing this one, stop
    if (playingSfxId === instanceKey) {
      if (stopCurrentPreviewRef.current) {
        stopCurrentPreviewRef.current();
        stopCurrentPreviewRef.current = null;
      }
      setPlayingSfxId(null);
      return;
    }

    // Stop any previously playing preview
    if (stopCurrentPreviewRef.current) {
      stopCurrentPreviewRef.current();
      stopCurrentPreviewRef.current = null;
    }

    try {
      setPlayingSfxId(instanceKey);
      const stopFn = await playSFXPreview(effectId, sfxVolume, customAudioUrl);
      stopCurrentPreviewRef.current = stopFn;

      // Auto-clear active indicator after duration
      const def = SOUND_EFFECTS_CATALOG.find((item) => item.id === effectId);
      const durationMs = (def?.durationSec || 4) * 1000;
      setTimeout(() => {
        setPlayingSfxId((prev) => (prev === instanceKey ? null : prev));
      }, durationMs);
    } catch (err) {
      console.warn('SFX preview error:', err);
      setPlayingSfxId(null);
    }
  };

  const handleToggleItem = (id: string) => {
    onChangeSFXList(
      sfxList.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleVolumeItem = (id: string, vol: number) => {
    onChangeSFXList(
      sfxList.map((item) => (item.id === id ? { ...item, volume: vol } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    onChangeSFXList(sfxList.filter((item) => item.id !== id));
  };

  const handleAddFromCatalog = (def: SoundEffectDefinition) => {
    const newItem = createManualSFX(def, manualTimeSec);
    onChangeSFXList([...sfxList, newItem].sort((a, b) => a.timestampSec - b.timestampSec));
    setShowCatalogModal(false);
  };

  const categories: { id: SFXCategory | 'todos'; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'clima', label: 'Clima & Ambiente' },
    { id: 'accion', label: 'Acción & Combate' },
    { id: 'voces', label: 'Voces & Drama' },
    { id: 'suspenso', label: 'Suspenso' },
    { id: 'cinematico', label: 'Cinemático' },
  ];

  const filteredCatalog = selectedCategory === 'todos'
    ? SOUND_EFFECTS_CATALOG
    : SOUND_EFFECTS_CATALOG.filter((item) => item.category === selectedCategory);

  return (
    <div className="space-y-4">
      {/* SFX Header & Master Switch */}
      <div className="bg-[#131316] p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-white">Catálogo Curado de Efectos Reales</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Grabaciones 100% Acústicas
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Colección limitada de efectos esenciales (lluvia, viento, truenos, espadas, explosiones, golpes, gritos, puertas) con archivos de audio reales y sincronización precisa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Library Info Button */}
          <button
            type="button"
            onClick={() => setShowLibraryInfoModal(true)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 transition-colors cursor-pointer"
            title="Ver información de licencias y fuentes libres"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Fuentes Libres</span>
          </button>

          {/* Master Volume */}
          {sfxEnabled && (
            <div className="flex items-center gap-2 bg-[#0A0A0B] px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-300">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Vol. SFX:</span>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={sfxVolume}
                onChange={(e) => onChangeSFXVolume(parseFloat(e.target.value))}
                className="w-20 accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-slate-400 w-7">
                {Math.round(sfxVolume * 100)}%
              </span>
            </div>
          )}

          {/* Master Toggle */}
          <button
            type="button"
            onClick={() => onToggleSFXEnabled(!sfxEnabled)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              sfxEnabled
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            {sfxEnabled ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{sfxEnabled ? 'SFX Activados' : 'SFX Desactivados'}</span>
          </button>
        </div>
      </div>

      {sfxEnabled && (
        <div className="space-y-3">
          {/* Detected list for current script */}
          <div className="bg-[#0D0D10] p-4 rounded-xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Efectos Programados ({sfxList.filter((s) => s.enabled).length} activos de {sfxList.length})
                </h5>
              </div>

              <button
                type="button"
                onClick={() => setShowCatalogModal(true)}
                className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir SFX Manual</span>
              </button>
            </div>

            {sfxList.length === 0 ? (
              <div className="p-4 rounded-lg bg-white/5 border border-white/5 text-center text-xs text-slate-400 space-y-1">
                <p>No se detectaron efectos acústicos específicos en el texto actual.</p>
                <p className="text-[11px] text-slate-500">
                  Prueba escribir palabras como "cayó un rayo", "la puerta se abrió", "pasos sigilosos" o añade uno desde el catálogo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {sfxList.map((sfx) => (
                  <div
                    key={sfx.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      sfx.enabled
                        ? 'bg-[#151518] border-amber-500/30 shadow-sm'
                        : 'bg-[#101012]/60 border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Play Preview Button (Uses Real Open Audio Sample) */}
                      <button
                        type="button"
                        onClick={() => playPreviewEffect(sfx.effectId, sfx.id, sfx.audioUrl)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 cursor-pointer ${
                          playingSfxId === sfx.id
                            ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                            : 'bg-white/5 hover:bg-amber-500/20 text-amber-400 border border-white/10'
                        }`}
                        title="Escuchar grabación de audio real de la biblioteca libre"
                      >
                        {playingSfxId === sfx.id ? (
                          <Square className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 ml-0.5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {formatTime(sfx.timestampSec)}
                          </span>
                          <span className="text-xs font-semibold text-white truncate">
                            {sfx.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Audio Real CC0
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {sfx.matchedText ? `"${sfx.matchedText}"` : sfx.description}
                        </p>
                        {sfx.contextReason && (
                          <p className="text-[10px] text-amber-400/90 font-medium truncate mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            {sfx.contextReason}
                          </p>
                        )}
                        {sfx.sourceName && (
                          <p className="text-[9px] text-slate-500 truncate">
                            Fuente: {sfx.sourceName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Volume Slider */}
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={sfx.volume}
                        onChange={(e) => handleVolumeItem(sfx.id, parseFloat(e.target.value))}
                        title="Volumen relativo del efecto"
                        className="w-14 accent-amber-500 cursor-pointer"
                      />

                      {/* Enable/Disable Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleItem(sfx.id)}
                        className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                          sfx.enabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-white/5 text-slate-400 border border-white/10'
                        }`}
                      >
                        {sfx.enabled ? 'ON' : 'OFF'}
                      </button>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(sfx.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Eliminar efecto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Sound FX Soundboard Catalog Preview Grid */}
          <div className="bg-[#0A0A0B] p-4 rounded-xl border border-white/10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h5 className="text-xs font-bold text-white">Catálogo de Grabaciones Libres (Dominio Público)</h5>
                <span className="text-[11px] text-slate-400">(Audios reales preescuchables)</span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-amber-500 text-black font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pt-1">
              {filteredCatalog.map((def) => {
                const isPlayingThis = playingSfxId === `cat_${def.id}`;
                return (
                  <button
                    key={def.id}
                    type="button"
                    onClick={() => playPreviewEffect(def.id, `cat_${def.id}`, def.audioUrl)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all group cursor-pointer ${
                      isPlayingThis
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-950/40'
                        : 'bg-[#121215] border-white/10 hover:border-amber-500/40 hover:bg-[#16161a]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div className={`p-1.5 rounded-lg ${isPlayingThis ? 'bg-amber-500 text-black' : 'bg-white/5 text-amber-400'}`}>
                        {getSFXIcon(def.icon, 'w-3.5 h-3.5')}
                      </div>
                      <div className="w-5 h-5 rounded-full bg-white/5 group-hover:bg-amber-500/20 flex items-center justify-center text-slate-400 group-hover:text-amber-300 text-[10px]">
                        {isPlayingThis ? <Square className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 ml-0.5" />}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-200 group-hover:text-white leading-tight truncate">
                        {def.name}
                      </div>
                      <div className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">
                        {def.description}
                      </div>
                      <div className="text-[8px] text-emerald-400/80 font-medium mt-1 truncate">
                        {def.sourceName?.split(' ')[0] || 'Libre CC0'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Free Sound Library Information Modal */}
      {showLibraryInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121216] border border-white/15 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Bibliotecas de Acceso Libre & Licencias</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowLibraryInfoModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-white/5 cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p>
                Todos los efectos de sonido provienen exclusivamente de <strong>grabaciones de dominio público y licencias Creative Commons CC0</strong> sin restricciones de derechos ni costos de tokens de IA.
              </p>
            </div>

            <div className="space-y-2.5">
              {OPEN_AUDIO_REPOSITORIES.map((repo) => (
                <div key={repo.id} className="p-3 rounded-xl bg-[#18181D] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{repo.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${repo.badgeColor}`}>
                      {repo.license.split(' ')[0]}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{repo.description}</p>
                  <p className="text-[10px] text-slate-500">Licencia: {repo.license}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLibraryInfoModal(false)}
                className="px-4 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-bold cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Insert Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121216] border border-white/15 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold text-white">Insertar Efecto de Sonido Manual</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-white/5 cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Momento exacto de activación en la narración:
              </label>
              <div className="flex items-center gap-3 bg-[#0A0A0B] p-2.5 rounded-xl border border-white/10">
                <input
                  type="range"
                  min="0"
                  max={Math.max(30, estimatedDurationSec)}
                  step="0.5"
                  value={manualTimeSec}
                  onChange={(e) => setManualTimeSec(parseFloat(e.target.value))}
                  className="flex-1 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-amber-400 w-12 text-right">
                  {formatTime(manualTimeSec)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Selecciona el efecto a insertar:
              </label>
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {SOUND_EFFECTS_CATALOG.map((def) => (
                  <div
                    key={def.id}
                    className="p-2.5 rounded-xl bg-[#18181D] hover:bg-[#202026] border border-white/10 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                        {getSFXIcon(def.icon, 'w-4 h-4')}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{def.name}</div>
                        <div className="text-[10px] text-slate-400">{def.description}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => playPreviewEffect(def.id, `modal_${def.id}`, def.audioUrl)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-amber-400 text-xs cursor-pointer"
                        title="Probar sonido real"
                      >
                        {playingSfxId === `modal_${def.id}` ? (
                          <Square className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddFromCatalog(def)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all cursor-pointer"
                      >
                        Insertar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

