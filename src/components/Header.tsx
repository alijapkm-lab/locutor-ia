import React from 'react';
import { Mic2, Radio, Sparkles, Volume2, Key, Download } from 'lucide-react';

interface HeaderProps {
  onSelectSample: (index: number) => void;
  customApiKey?: string;
  onOpenApiKeyModal: () => void;
  onOpenDownloadModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  customApiKey,
  onOpenApiKeyModal,
  onOpenDownloadModal,
}) => {
  return (
    <header className="border-b border-white/10 bg-[#0D0D0F]/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-950/20">
            <Mic2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Estudio de Locución IA
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3 h-3 mr-1 text-amber-400" />
                Voz Humana HD
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Conversión de guiones a narración profesional, música de tensión inteligente y exportación MP3
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          {/* Download App for Local Desktop Button */}
          <button
            type="button"
            onClick={onOpenDownloadModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 border border-amber-500/40 text-amber-300 hover:text-white font-semibold transition-all cursor-pointer shadow-xs hover:shadow-amber-500/10"
            title="Descargar la aplicación para ejecutarla en tu computador"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Descargar App (.exe / .zip)</span>
          </button>

          {/* API Key Modal Button */}
          <button
            type="button"
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              customApiKey
                ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/50'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Configurar clave API alternativa (Gemini, Groq, OpenAI, ElevenLabs)"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>{customApiKey ? 'Clave Activa' : 'Claves API'}</span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-medium">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Mastering 24kHz</span>
          </div>
        </div>
      </div>
    </header>
  );
};


