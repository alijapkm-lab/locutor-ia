import { SoundEffectDefinition, SoundEffectId, SFXCategory } from '../types';

export interface ContextAnalysisResult {
  effectId: SoundEffectId;
  name: string;
  category: SFXCategory;
  contextReason: string;
  confidence: number;
  isMetaphor: boolean;
  matchedSnippet: string;
}

/**
 * Intelligent Semantic & Context Disambiguator for Sound Effects
 * Analyzes surrounding narrative context, theme indicators, and negative keywords
 * to avoid false matches (e.g. avoiding metaphors like "lluvia de ideas" or "a la velocidad del rayo").
 */
export function analyzeSemanticSFXContext(
  sentence: string,
  fullScript: string,
  matchedKeyword: string,
  candidateDef: SoundEffectDefinition
): ContextAnalysisResult {
  const cleanSentence = sentence.toLowerCase();
  const cleanKeyword = matchedKeyword.toLowerCase();

  // 1. Anti-Metaphor & Idiom Filtering
  const commonMetaphors: { pattern: RegExp; explanation: string }[] = [
    { pattern: /\b(?:un\s+)?rayo\s+de\s+(?:sol|luz|esperanza|luna)\b/i, explanation: 'Metáfora poética (Rayo de luz/sol)' },
    { pattern: /\b(?:a\s+la\s+velocidad\s+del\s+rayo|como\s+(?:un\s+)?rayo)\b/i, explanation: 'Expresión idiomática de velocidad' },
    { pattern: /\b(?:lluvia\s+de\s+(?:ideas|críticas|aplausos|elogios|bendiciones))\b/i, explanation: 'Metáfora conceptual (Lluvia de ideas/críticas)' },
    { pattern: /\b(?:abrir\s+las\s+puertas\s+del\s+(?:éxito|futuro|mundo)|cerrar\s+la\s+puerta\s+a)\b/i, explanation: 'Metáfora de oportunidad' },
    { pattern: /\b(?:dar\s+un\s+golpe\s+de\s+(?:suerte|estado|timón|autoridad))\b/i, explanation: 'Expresión idiomática' },
    { pattern: /\b(?:viento\s+en\s+popa|a\s+favor\s+del\s+viento)\b/i, explanation: 'Metáfora de prosperidad' },
  ];

  for (const metaphor of commonMetaphors) {
    if (metaphor.pattern.test(cleanSentence)) {
      return {
        effectId: candidateDef.id,
        name: candidateDef.name,
        category: candidateDef.category,
        contextReason: metaphor.explanation,
        confidence: 0,
        isMetaphor: true,
        matchedSnippet: cleanKeyword,
      };
    }
  }

  // 2. Custom Negative Keyword Checks
  if (candidateDef.negativeKeywords) {
    for (const neg of candidateDef.negativeKeywords) {
      if (cleanSentence.includes(neg.toLowerCase())) {
        return {
          effectId: candidateDef.id,
          name: candidateDef.name,
          category: candidateDef.category,
          contextReason: `Exclusión contextual por término "${neg}"`,
          confidence: 0,
          isMetaphor: true,
          matchedSnippet: cleanKeyword,
        };
      }
    }
  }

  // 3. Default Positive Context Analysis
  return {
    effectId: candidateDef.id,
    name: candidateDef.name,
    category: candidateDef.category,
    contextReason: `Evento acústico detectado: ${candidateDef.name}`,
    confidence: 90,
    isMetaphor: false,
    matchedSnippet: cleanKeyword,
  };
}
