import { SOUND_EFFECTS_CATALOG } from '../data/soundEffectsCatalog';
import { DetectedSFX, SoundEffectDefinition, SoundEffectId } from '../types';
import { analyzeSemanticSFXContext } from './sfxContextAnalyzer';

/**
 * Intelligent Sound Effects Script Detector (Option A - Zero Token Cost)
 * Scans narrative text for environmental, dramatic, and action cues,
 * performs full semantic context disambiguation, and calculates exact timestamps.
 */
export function detectSoundEffectsInScript(
  script: string,
  wordsPerMinute = 135
): DetectedSFX[] {
  if (!script || typeof script !== 'string' || !script.trim()) {
    return [];
  }

  const detected: DetectedSFX[] = [];
  const words = script.trim().split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  if (totalWords === 0) return [];

  const secondsPerWord = 60 / wordsPerMinute;
  const usedTimestamps: number[] = [];

  // 1. Process by sentence / paragraph blocks
  const sentences = script.split(/(?<=[.!?;\n])\s+/);
  let currentWordOffset = 0;

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    const sentenceWords = trimmedSentence.split(/\s+/).filter(Boolean);
    const sentenceWordCount = sentenceWords.length;

    // Check each SFX definition in catalog against this sentence
    for (const def of SOUND_EFFECTS_CATALOG) {
      let matched = false;
      let matchedSnippet = '';

      // Test regex pattern first
      const regexMatch = def.pattern.exec(trimmedSentence);
      if (regexMatch) {
        matched = true;
        matchedSnippet = regexMatch[0];
      } else {
        // Test direct keywords
        for (const kw of def.keywords) {
          const kwRegex = new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i');
          const kwMatch = kwRegex.exec(trimmedSentence);
          if (kwMatch) {
            matched = true;
            matchedSnippet = kwMatch[0];
            break;
          }
        }
      }

      if (matched) {
        // 2. Perform Deep Semantic Context Disambiguation
        const contextAnalysis = analyzeSemanticSFXContext(
          trimmedSentence,
          script,
          matchedSnippet || def.name,
          def
        );

        // If it's identified as an idiom/metaphor or zero confidence, ignore
        if (contextAnalysis.isMetaphor || contextAnalysis.confidence <= 0) {
          continue;
        }

        // Target definition from catalog (might be disambiguated, e.g. laser_beam vs thunder)
        const targetDef =
          SOUND_EFFECTS_CATALOG.find((item) => item.id === contextAnalysis.effectId) || def;

        // Calculate estimated timestamp based on word position
        let keywordWordIndex = 0;
        if (matchedSnippet) {
          const matchIndexInSentence = trimmedSentence.toLowerCase().indexOf(matchedSnippet.toLowerCase());
          if (matchIndexInSentence > 0) {
            const wordsBefore = trimmedSentence.slice(0, matchIndexInSentence).split(/\s+/).filter(Boolean).length;
            keywordWordIndex = wordsBefore;
          }
        }

        const exactWordIndex = currentWordOffset + keywordWordIndex;
        let estimatedSec = Math.max(0.5, Number((exactWordIndex * secondsPerWord).toFixed(1)));

        // Avoid clustering two identical or loud effects within 2.5 seconds
        const isTooClose = usedTimestamps.some(
          (t) => Math.abs(t - estimatedSec) < 2.5
        );

        if (!isTooClose) {
          usedTimestamps.push(estimatedSec);
          detected.push({
            id: `sfx_${targetDef.id}_${Math.round(estimatedSec)}_${Math.random().toString(36).substring(2, 6)}`,
            effectId: targetDef.id,
            name: targetDef.name,
            category: targetDef.category,
            timestampSec: estimatedSec,
            matchedText: matchedSnippet || trimmedSentence.slice(0, 40),
            enabled: true,
            volume: targetDef.defaultVolume,
            icon: targetDef.icon,
            description: targetDef.description,
            contextReason: contextAnalysis.contextReason,
            contextConfidence: contextAnalysis.confidence,
            audioUrl: targetDef.audioUrl,
            sourceName: targetDef.sourceName,
            licenseType: targetDef.licenseType,
            isRealSample: targetDef.isRealSample,
          });
        }
      }
    }

    currentWordOffset += sentenceWordCount;
  }

  // Sort chronologically by timestamp
  return detected.sort((a, b) => a.timestampSec - b.timestampSec);
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates a manual SFX event at a specific timestamp
 */
export function createManualSFX(
  effectDef: SoundEffectDefinition,
  timestampSec: number
): DetectedSFX {
  return {
    id: `sfx_${effectDef.id}_${Math.round(timestampSec)}_${Math.random().toString(36).substring(2, 6)}`,
    effectId: effectDef.id,
    name: effectDef.name,
    category: effectDef.category,
    timestampSec: Math.max(0, Number(timestampSec.toFixed(1))),
    matchedText: 'Efecto añadido manualmente',
    enabled: true,
    volume: effectDef.defaultVolume,
    icon: effectDef.icon,
    description: effectDef.description,
  };
}
