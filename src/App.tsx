import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ScriptInputArea } from './components/ScriptInputArea';
import { VoiceAndSettingsPanel } from './components/VoiceAndSettingsPanel';
import { AudioPlayerSection } from './components/AudioPlayerSection';
import { QuotaMonitorWidget } from './components/QuotaMonitorWidget';
import { GenerationModal } from './components/GenerationModal';
import { CorrectionModal } from './components/CorrectionModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { DownloadAppModal } from './components/DownloadAppModal';
import { TakesHistory } from './components/TakesHistory';
import { SAMPLE_SCRIPTS } from './data/voicesAndTones';
import { NarrationResult, NarrationSettings, QuotaStatus, EngineMode, ApiProvider } from './types';
import { Mic2, Sparkles, AlertCircle, Wand2, Zap, Key, Info } from 'lucide-react';

export default function App() {
  const [script, setScript] = useState(SAMPLE_SCRIPTS[0].text);
  const [engineMode, setEngineMode] = useState<EngineMode>('auto');
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);

  // Custom API Key & Provider State
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('gemini_custom_api_key') || '';
    } catch {
      return '';
    }
  });
  const [customApiProvider, setCustomApiProvider] = useState<ApiProvider>(() => {
    try {
      return (localStorage.getItem('gemini_custom_api_provider') as ApiProvider) || 'gemini';
    } catch {
      return 'gemini';
    }
  });
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [keyNotice, setKeyNotice] = useState<string | null>(null);

  const [settings, setSettings] = useState<NarrationSettings>({
    voice: 'Fenrir',
    tone: 'misterio',
    language: 'es',
    speed: 1.0,
    pitch: 0,
    speedLabel: 'normal',
    pitchLabel: 'grave',
    tensionMusicEnabled: true,
    tensionMusicStyle: 'cinematic_suspense',
    musicVolume: 0.22,
    engineMode: 'auto',
    freeVoiceGender: 'auto',
    customApiKey: customApiKey || undefined,
    customApiProvider,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [isProcessingCorrection, setIsProcessingCorrection] = useState(false);
  const [currentResult, setCurrentResult] = useState<NarrationResult | null>(null);
  const [takes, setTakes] = useState<NarrationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scriptAnalysis, setScriptAnalysis] = useState<{
    tensionScore: number;
    detectedGenre: string;
  } | null>(null);

  const handleSaveApiKey = (newKey: string, provider: ApiProvider = 'gemini') => {
    setCustomApiKey(newKey);
    setCustomApiProvider(provider);
    setSettings((prev) => ({ ...prev, customApiKey: newKey, customApiProvider: provider }));
    try {
      localStorage.setItem('gemini_custom_api_key', newKey);
      localStorage.setItem('gemini_custom_api_provider', provider);
    } catch {}
    const providerNames: Record<ApiProvider, string> = {
      gemini: 'Google Gemini',
      groq: 'Groq Cloud',
      openai: 'OpenAI TTS',
      elevenlabs: 'ElevenLabs',
    };
    setKeyNotice(`Tu clave API de ${providerNames[provider] || provider} está activa y lista.`);
  };

  const handleRemoveApiKey = () => {
    setCustomApiKey('');
    setCustomApiProvider('gemini');
    setSettings((prev) => ({ ...prev, customApiKey: undefined, customApiProvider: 'gemini' }));
    try {
      localStorage.removeItem('gemini_custom_api_key');
      localStorage.removeItem('gemini_custom_api_provider');
    } catch {}
    setKeyNotice('Has restablecido la clave. La app usará la cuota por defecto del sistema.');
  };

  // Poll Quota & Token status
  const fetchQuotaStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/quota-status');
      if (res.ok) {
        const data: QuotaStatus = await res.json();
        setQuotaStatus(data);
      }
    } catch (e) {
      console.warn('Quota poll failed:', e);
    }
  }, []);

  useEffect(() => {
    fetchQuotaStatus();
    const interval = setInterval(fetchQuotaStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchQuotaStatus]);

  // Debounced script analysis for tension and genre
  useEffect(() => {
    if (!script.trim()) {
      setScriptAnalysis(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/analyze-script', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(customApiKey ? { 'x-gemini-api-key': customApiKey } : {}),
          },
          body: JSON.stringify({ script, customApiKey, customApiProvider }),
        });
        if (res.ok) {
          const data = await res.json();
          setScriptAnalysis({
            tensionScore: data.tensionScore,
            detectedGenre: data.detectedGenre,
          });
        }
      } catch (e) {
        // Fallback heuristics
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [script, customApiKey]);

  const handleApplySample = (sample: (typeof SAMPLE_SCRIPTS)[0]) => {
    setScript(sample.text);
    setSettings((prev) => ({
      ...prev,
      tone: sample.tone,
      voice: sample.voice,
    }));
  };

  const handleGenerateNarration = async () => {
    if (!script.trim()) {
      setError('Por favor introduce un guión en la caja de texto.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/tts/narrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-gemini-api-key': customApiKey } : {}),
        },
        body: JSON.stringify({
          script: script.trim(),
          voice: settings.voice,
          tone: settings.tone,
          speedLabel: settings.speedLabel,
          pitchLabel: settings.pitchLabel,
          language: settings.language,
          tensionMusicEnabled: settings.tensionMusicEnabled,
          engineMode,
          freeVoiceGender: settings.freeVoiceGender || 'auto',
          customApiKey: customApiKey || undefined,
          customApiProvider: customApiProvider || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar la narración.');
      }

      if (data.customKeyNotice) {
        setKeyNotice(data.customKeyNotice);
      }

      const newTake: NarrationResult = {
        id: `take_${Date.now()}`,
        createdAt: new Date().toISOString(),
        script: script.trim(),
        audioWavBase64: data.audioWavBase64,
        audioDurationSec: data.audioDurationSec,
        settings: { ...settings, engineMode, customApiKey },
        chunksProcessed: data.chunksProcessed,
        tensionDetected: data.tensionDetected,
        tensionSummary: data.tensionSummary,
        engineUsed: data.engineUsed || 'gemini_tts',
        engineLabel: data.engineLabel,
        quotaNotice: data.quotaNotice,
      };

      setCurrentResult(newTake);
      setTakes((prev) => [newTake, ...prev]);
      fetchQuotaStatus();
    } catch (err: any) {
      console.error('Narration generation error:', err);
      setError(err.message || 'Error al conectar con el motor de voz.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitCorrection = async (userFeedback: string) => {
    if (!currentResult) return;
    setIsProcessingCorrection(true);
    setError(null);

    try {
      const response = await fetch('/api/tts/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-gemini-api-key': customApiKey } : {}),
        },
        body: JSON.stringify({
          originalScript: currentResult.script,
          currentSettings: currentResult.settings,
          userFeedback,
          freeVoiceGender: settings.freeVoiceGender || 'auto',
          customApiKey: customApiKey || undefined,
          customApiProvider: customApiProvider || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo aplicar la corrección.');
      }

      if (data.customKeyNotice) {
        setKeyNotice(data.customKeyNotice);
      }

      const correctedTake: NarrationResult = {
        id: `take_corrected_${Date.now()}`,
        createdAt: new Date().toISOString(),
        script: currentResult.script,
        audioWavBase64: data.audioWavBase64,
        audioDurationSec: data.audioDurationSec,
        settings: {
          ...currentResult.settings,
          ...(data.adjustedSettings || {}),
        },
        chunksProcessed: currentResult.chunksProcessed,
        tensionDetected: currentResult.tensionDetected,
        tensionSummary: data.modificationsSummary || data.tensionSummary,
        engineUsed: data.engineUsed || currentResult.engineUsed,
        engineLabel: data.engineUsed === 'free_fallback' ? 'Motor Gratuito (Salto Automático)' : 'Google Gemini HD',
        quotaNotice: data.engineUsed === 'free_fallback' ? 'Ajuste procesado con el Motor Gratuito de respaldo.' : undefined,
        correctionHistory: [
          ...(currentResult.correctionHistory || []),
          {
            feedback: userFeedback,
            appliedAdjustments: data.refinedInstructions || data.modificationsSummary,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      setCurrentResult(correctedTake);
      setTakes((prev) => [correctedTake, ...prev]);
      setIsCorrectionOpen(false);
      fetchQuotaStatus();
    } catch (err: any) {
      console.error('Correction error:', err);
      setError(err.message || 'Error al procesar la corrección.');
    } finally {
      setIsProcessingCorrection(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* App Header */}
      <Header
        onSelectSample={(idx) => handleApplySample(SAMPLE_SCRIPTS[idx])}
        customApiKey={customApiKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
      />

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Token Quota & Auto-Failover Monitor Bar */}
        <QuotaMonitorWidget
          quotaStatus={quotaStatus}
          engineMode={engineMode}
          customApiKey={customApiKey}
          onEngineModeChange={setEngineMode}
          onRefreshQuota={fetchQuotaStatus}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        />

        {/* Informational Key Notice Banner */}
        {keyNotice && (
          <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-200 text-xs flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>{keyNotice}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(true)}
                className="text-xs font-bold text-indigo-300 hover:text-white underline cursor-pointer"
              >
                Gestionar Clave
              </button>
              <button
                type="button"
                onClick={() => setKeyNotice(null)}
                className="text-xs text-indigo-400 hover:text-indigo-200 cursor-pointer ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs font-bold text-rose-400 hover:text-rose-200 underline cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Top Section: Script Editor & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Top (Script Input) */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <ScriptInputArea
              script={script}
              onChange={setScript}
              onApplySample={handleApplySample}
              isGenerating={isGenerating}
              tensionScore={scriptAnalysis?.tensionScore}
              detectedGenre={scriptAnalysis?.detectedGenre}
            />

            {/* Primary Action Button */}
            <div className="bg-[#0D0D0F] rounded-2xl border border-white/10 shadow-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-white">
                  Listo para transformar el guión
                </h4>
                <p className="text-[11px] text-slate-400">
                  {engineMode === 'free_only'
                    ? 'Motor Gratuito activo: Sin consumo de tokens de Google.'
                    : 'Segmentación oculta automática y renderizado de audio en 24kHz.'}
                </p>
              </div>

              <button
                type="button"
                disabled={isGenerating || !script.trim()}
                onClick={handleGenerateNarration}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-xs font-bold transition-all shadow-lg shadow-amber-950/40 active:scale-95 cursor-pointer"
              >
                {engineMode === 'free_only' ? (
                  <Zap className="w-4 h-4 text-black" />
                ) : (
                  <Mic2 className="w-4 h-4 text-black" />
                )}
                <span>
                  {engineMode === 'free_only'
                    ? 'Generar con Motor Gratuito (0 Tokens)'
                    : 'Generar Narración con Voz Humana'}
                </span>
              </button>
            </div>
          </div>

          {/* Right / Bottom (Voice, Tone, Speed, Pitch & Tension Controls) */}
          <div className="lg:col-span-6">
            <VoiceAndSettingsPanel
              settings={{ ...settings, customApiKey }}
              onChange={(updated) => setSettings((prev) => ({ ...prev, ...updated }))}
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Audio Player Result Section (Shown when audio is generated) */}
        {currentResult && (
          <div className="space-y-6 pt-2 animate-fadeIn">
            <AudioPlayerSection
              result={currentResult}
              onOpenCorrection={() => setIsCorrectionOpen(true)}
            />

            {/* Takes and Correction History */}
            <TakesHistory
              takes={takes}
              activeTakeId={currentResult.id}
              onSelectTake={(take) => setCurrentResult(take)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0D0D0F] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Estudio de Locución IA • Síntesis realista de voz humana con exportación MP3 y Failover Gratuito</span>
          <div className="flex items-center gap-3">
            <span>Google Gemini TTS HD + Motor Gratuito SAPI</span>
          </div>
        </div>
      </footer>

      {/* Loading Modal */}
      <GenerationModal
        isOpen={isGenerating || isProcessingCorrection}
        isCorrection={isProcessingCorrection}
      />

      {/* Correction Feedback Modal */}
      <CorrectionModal
        isOpen={isCorrectionOpen}
        onClose={() => setIsCorrectionOpen(false)}
        onSubmitCorrection={handleSubmitCorrection}
        currentSettings={currentResult?.settings || settings}
        isProcessing={isProcessingCorrection}
      />

      {/* Multi-Provider API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        currentApiKey={customApiKey}
        currentProvider={customApiProvider}
        onSaveApiKey={handleSaveApiKey}
        onRemoveApiKey={handleRemoveApiKey}
      />

      {/* Desktop App Download & Local Launcher Modal */}
      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
}

