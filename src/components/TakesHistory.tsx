import React from 'react';
import { History, Play, Clock, Sparkles, Wand2 } from 'lucide-react';
import { NarrationResult } from '../types';
import { formatTime } from '../utils/audioUtils';

interface TakesHistoryProps {
  takes: NarrationResult[];
  activeTakeId: string | null;
  onSelectTake: (take: NarrationResult) => void;
}

export const TakesHistory: React.FC<TakesHistoryProps> = ({
  takes,
  activeTakeId,
  onSelectTake,
}) => {
  if (takes.length <= 1) return null;

  return (
    <div className="bg-[#0D0D0F] rounded-2xl border border-white/10 shadow-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-white">
            Historial de Tomas y Versiones ({takes.length})
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          Compara versiones corregidas
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {takes.map((take, index) => {
          const isActive = take.id === activeTakeId;
          const isCorrected = (take.correctionHistory?.length || 0) > 0;
          return (
            <button
              key={take.id}
              type="button"
              onClick={() => onSelectTake(take)}
              className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                isActive
                  ? 'border-amber-500/80 bg-amber-500/15 shadow-md ring-1 ring-amber-500/30'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5 bg-white/[0.02]'
              }`}
            >
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">
                    Toma #{takes.length - index}
                  </span>
                  {take.isPartial ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/25 text-amber-300 border border-amber-500/40 font-semibold flex items-center gap-0.5">
                      Parcial
                    </span>
                  ) : isCorrected ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-0.5">
                      <Wand2 className="w-2.5 h-2.5" />
                      Corregida
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-medium">
                      Original
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>Voz: {take.settings.voice}</span>
                  <span>•</span>
                  <span>{formatTime(take.audioDurationSec)}</span>
                </div>
              </div>

              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isActive ? 'bg-amber-500 text-black font-bold' : 'bg-white/10 text-slate-300'
              }`}>
                <Play className="w-3.5 h-3.5 ml-0.5" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

