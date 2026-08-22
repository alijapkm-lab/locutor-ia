import React, { useState } from 'react';
import {
  Download,
  Terminal,
  Laptop,
  CheckCircle2,
  ExternalLink,
  X,
  FileCode,
  Sparkles,
  Zap,
  HardDrive,
  FolderArchive,
  Loader2,
} from 'lucide-react';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedOS, setSelectedOS] = useState<'windows' | 'mac' | 'linux'>('windows');

  if (!isOpen) return null;

  const handleDownloadZip = () => {
    setIsDownloading(true);
    // Create an invisible anchor to trigger direct browser download
    const link = document.createElement('a');
    link.href = '/api/download-app-zip';
    link.download = 'Estudio-Locucion-IA-App.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloading(false);
    }, 2500);
  };

  return (
    <div
      id="download-app-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="download-app-modal-content"
        className="w-full max-w-2xl bg-[#0D0D0F] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-left relative max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Title */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-950/30">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Descargar Aplicación para Escritorio
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                1 Clic
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Empaqueta todo el estudio de locución con su ejecutable para correrlo 100% en tu computadora con conexión a Internet.
            </p>
          </div>
        </div>

        {/* Main Big Download Button */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-600/5 to-transparent border border-amber-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <FolderArchive className="w-4 h-4" /> Paquete Completo Portable
              </span>
              <h4 className="text-sm font-bold text-white mt-1">
                Estudio-Locucion-IA-App.zip
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Incluye todo el código fuente, servidor local y el lanzador <strong>iniciar_app.bat</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm shadow-xl shadow-amber-950/40 transition-all active:scale-98 cursor-pointer shrink-0"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparando Descarga...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Aplicación (.ZIP)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Operating System Instructions Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-slate-400" /> Guía de Ejecución Local:
            </span>
            <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setSelectedOS('windows')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedOS === 'windows'
                    ? 'bg-amber-400 text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🪟 Windows (.bat)
              </button>
              <button
                type="button"
                onClick={() => setSelectedOS('mac')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedOS === 'mac'
                    ? 'bg-amber-400 text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🍏 Mac (.sh)
              </button>
              <button
                type="button"
                onClick={() => setSelectedOS('linux')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedOS === 'linux'
                    ? 'bg-amber-400 text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🐧 Linux (.sh)
              </button>
            </div>
          </div>

          {/* Steps Display */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 text-xs">
            {selectedOS === 'windows' && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-slate-300">
                    <strong className="text-white">Descomprime el archivo .zip:</strong> Extrae la carpeta descargada en tu ubicación preferida (por ejemplo, en Documentos o Escritorio).
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-slate-300">
                    <strong className="text-white">Verifica tener Node.js:</strong> Si no lo tienes instalado, descárgalo gratis desde{' '}
                    <a
                      href="https://nodejs.org/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      nodejs.org <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    (versión recomendada LTS).
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-slate-300">
                    <strong className="text-white">Haz doble clic en:</strong>{' '}
                    <code className="px-2 py-0.5 rounded bg-black/60 border border-white/15 text-amber-300 font-mono">
                      iniciar_app.bat
                    </code>
                    <p className="text-[11px] text-slate-400 mt-1">
                      El ejecutable instalará los paquetes automáticamente por primera vez, compilará la aplicación y abrirá tu navegador web en <code className="text-slate-300">http://localhost:3000</code>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(selectedOS === 'mac' || selectedOS === 'linux') && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-slate-300">
                    <strong className="text-white">Extrae el archivo .zip</strong> en tu carpeta de preferencia.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-slate-300">
                    <strong className="text-white">Abre la Terminal en esa carpeta</strong> y ejecuta:
                    <div className="mt-1.5 p-2 rounded-lg bg-black/60 border border-white/10 font-mono text-[11px] text-amber-300 select-all">
                      chmod +x iniciar_app.sh && ./iniciar_app.sh
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-slate-300">
                    <strong className="text-white">¡Listo!</strong> La app se iniciará y abrirá tu navegador automáticamente en <code className="text-slate-300">http://localhost:3000</code>.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Benefits & Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-2.5 text-xs">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-slate-300">
              <strong className="text-emerald-300 block">Voces Gratuitas Ilimitadas:</strong>
              El motor de voz neuronal local funciona directamente sin necesidad de saldo ni claves API.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-start gap-2.5 text-xs">
            <HardDrive className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-slate-300">
              <strong className="text-indigo-300 block">100% Autónomo y Seguro:</strong>
              Todo el procesamiento de audio, mezclas y pistas de tensión se ejecutan en tu máquina.
            </div>
          </div>
        </div>

        {/* Footer info & Direct Scripts download */}
        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Descarga directa de lanzadores sueltos:</span>
            <a
              href="/api/download-launcher/windows"
              download="iniciar_app.bat"
              className="text-amber-400 hover:text-amber-300 font-semibold underline flex items-center gap-1"
            >
              iniciar_app.bat
            </a>
            <span>•</span>
            <a
              href="/api/download-launcher/unix"
              download="iniciar_app.sh"
              className="text-amber-400 hover:text-amber-300 font-semibold underline flex items-center gap-1"
            >
              iniciar_app.sh
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
