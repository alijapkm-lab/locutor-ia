import { VoiceOption, ToneOption, TensionMusicStyle } from '../types';

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Femenina',
    description: 'Voz femenina cálida, elegante, versátil y con impecable dicción.',
    timbre: 'Cálido, claro y articulado',
    recommendedFor: 'Documentales, audiolibros, historias dramáticas y locución corporativa.',
    avatarColor: 'from-amber-500 to-rose-500',
    samplePhrase: 'Hola, soy Kore. Mi voz es cálida, elegante y versátil, ideal para documentales y narraciones envolventes.',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Masculina',
    description: 'Voz masculina profunda, autoritaria y cinematográfica con gran presencia.',
    timbre: 'Profundo, resonante y solemne',
    recommendedFor: 'Tráilers de cine, relatos de tensión, misterio y épica.',
    avatarColor: 'from-indigo-600 to-slate-900',
    samplePhrase: 'Saludos. Soy Fenrir. Una voz masculina profunda y cinematográfica, diseñada para relatos de gran impacto.',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Masculina',
    description: 'Voz masculina juvenil, dinámica, entusiasta y de ritmo ágil.',
    timbre: 'Brillante, enérgico y moderno',
    recommendedFor: 'Comerciales, podcasts, vídeos de YouTube y relatos de ritmo vivo.',
    avatarColor: 'from-emerald-500 to-teal-700',
    samplePhrase: '¡Hola a todos! Soy Puck. Mi voz es juvenil y dinámica, perfecta para comerciales y podcasts modernos.',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Masculina',
    description: 'Voz masculina madura, sobria, reflexiva y misteriosa.',
    timbre: 'Grave, pausado y envolvente',
    recommendedFor: 'Historias de suspenso, novelas negras, filosofía y crónicas.',
    avatarColor: 'from-slate-700 to-zinc-900',
    samplePhrase: 'Soy Charon. Mi tono es sobrio, pausado y reflexivo, ideal para historias de misterio y suspenso.',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Femenina',
    description: 'Voz femenina suave, serena, envolvente y meditativa.',
    timbre: 'Suave, sutil y reconfortante',
    recommendedFor: 'Relatos nocturnos, poesía, relajación y momentos reflexivos.',
    avatarColor: 'from-cyan-500 to-blue-600',
    samplePhrase: 'Hola, soy Zephyr. Una voz suave, serena y reconfortante, creada para relatos íntimos y momentos de reflexión.',
  },
];

export const EMOTIONAL_TONES: ToneOption[] = [
  {
    id: 'locutor_clasico',
    label: 'Locutor Clásico',
    description: 'Firme, elegante, dicción cristalina y cadencia profesional.',
    icon: 'Radio',
    badge: 'Estándar',
    color: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
  },
  {
    id: 'dramatico',
    label: 'Dramático & Tensión',
    description: 'Intensidad emocional profunda, suspenso y pausas calculadas.',
    icon: 'Flame',
    badge: 'Cinematográfico',
    color: 'border-rose-500/50 bg-rose-500/10 text-rose-300',
  },
  {
    id: 'misterio',
    label: 'Misterio & Suspenso',
    description: 'Tono grave, intrigante, silencios estratégicos y atmósfera oscura.',
    icon: 'Moon',
    badge: 'Suspenso',
    color: 'border-purple-500/50 bg-purple-500/10 text-purple-300',
  },
  {
    id: 'epico',
    label: 'Épico & Tráiler',
    description: 'Voz poderosa, imponente, resonante y de clímax cinematográfico.',
    icon: 'Sparkles',
    badge: 'Impacto',
    color: 'border-amber-400/60 bg-amber-400/15 text-amber-200',
  },
  {
    id: 'documental',
    label: 'Documental & Ciencia',
    description: 'Cálido, reflexivo, envolvente y con cadencia explicativa.',
    icon: 'Compass',
    badge: 'National Geo',
    color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
  },
  {
    id: 'entusiasta',
    label: 'Comercial & Dinámico',
    description: 'Enérgico, positivo, convincente y de ritmo ágil.',
    icon: 'Zap',
    badge: 'Publicidad',
    color: 'border-orange-500/50 bg-orange-500/10 text-orange-300',
  },
  {
    id: 'calido',
    label: 'Cálido & Cercano',
    description: 'Íntimo, empático, natural y reconfortante.',
    icon: 'Heart',
    badge: 'Emotivo',
    color: 'border-teal-500/50 bg-teal-500/10 text-teal-300',
  },
  {
    id: 'noticiero',
    label: 'Noticias & Reportaje',
    description: 'Objetivo, informativo, seguro y de ritmo periodístico.',
    icon: 'Mic',
    badge: 'Informativo',
    color: 'border-slate-400/50 bg-slate-500/10 text-slate-200',
  },
];

export const TENSION_MUSIC_STYLES: { id: TensionMusicStyle; name: string; desc: string }[] = [
  {
    id: 'cinematic_suspense',
    name: 'Suspenso Cinematográfico',
    desc: 'Bajo sub-grave oscuro, acordes menores flotantes y latido tenue.',
  },
  {
    id: 'dark_drone',
    name: 'Dark Drone Profundo',
    desc: 'Atmósfera abisal de tensión pura, ideal para revelaciones oscuras.',
  },
  {
    id: 'pulse_thriller',
    name: 'Pulso de Thriller',
    desc: 'Reloj continuo y pulsación rítmica sutil para momentos de persecución.',
  },
  {
    id: 'noir_strings',
    name: 'Cuerdas Noir Dramáticas',
    desc: 'Melancolía y tensión con chelos y violines lentos.',
  },
  {
    id: 'ambient_tension',
    name: 'Tensión Ambiental Sutil',
    desc: 'Sombra sonora etérea que no satura el espectro vocal.',
  },
];

export const SAMPLE_SCRIPTS = [
  {
    title: '⚡ Tormenta y Misterio (SFX: Rayo, Puerta y Pasos)',
    category: 'Efectos SFX',
    tone: 'misterio' as const,
    voice: 'Fenrir' as const,
    text: `La lluvia azotaba los ventanales de la mansión en plena madrugada. De repente, cayó un rayo que iluminó cada rincón de la sala en penumbra.
En ese instante, la pesada puerta de roble se abrió con un chirrido espeluznante. Unos pasos lentos comenzaron a resonar en el pasillo, acompañados por el latido desbocado de un corazón en suspenso.`,
  },
  {
    title: '🌙 Suspenso en la Niebla (Tensión Alta)',
    category: 'Misterio',
    tone: 'misterio' as const,
    voice: 'Fenrir' as const,
    text: `La densa niebla de medianoche envolvía el antiguo faro abandonado en la costa norte. Nadie había entrado en aquella torre desde el invierno de 1974, cuando los tres guardianes desaparecieron sin dejar rastro alguno.

De repente, una luz mortecina comenzó a parpadear en la cúspide de la torre. Un sonido metálico, lento y rítmico, descendía por la escalera de caracol. Paso a paso. Cada crujido de la madera helada aumentaba la certeza de que algo... o alguien... acababa de despertar en la oscuridad.`,
  },
  {
    title: '🌌 Documental del Cosmos (Cálido y Reflexivo)',
    category: 'Documental',
    tone: 'documental' as const,
    voice: 'Kore' as const,
    text: `Mirar hacia el cielo nocturno es emprender un viaje directo hacia el pasado remoto. La luz que hoy acaricia nuestras retinas partió de estrellas distantes hace miles de millones de años, cruzando océanos insondables de vacío cósmico.

Cada átomo de hierro en nuestra sangre y cada partícula de calcio en nuestros huesos fueron forjados en el corazón incandescente de supernovas que murieron antes del nacimiento de nuestro sol. No solo estamos en el universo; el universo late dentro de nosotros.`,
  },
  {
    title: '⚡ Tráiler Cinematográfico: El Despertar',
    category: 'Épico',
    tone: 'epico' as const,
    voice: 'Fenrir' as const,
    text: `Durante siglos, el reino permaneció en una calma aparente. Los sabios advirtieron que la profecía no era un mito, sino una cuenta regresiva inexorable. 

Hoy, las montañas tiemblan. Las sombras avanzan desde las profundidades del abismo. Y solo aquellos con la valentía de desafiar al destino podrán sostener la última llama de la humanidad. En cines este verano: El Despertar del Titán.`,
  },
  {
    title: '🎙️ Locución Comercial: Innovación Sonora',
    category: 'Comercial',
    tone: 'entusiasta' as const,
    voice: 'Puck' as const,
    text: `Descubre una nueva forma de experimentar el sonido de alta definición. Diseñados con ingeniería acústica de vanguardia y cancelación activa de ruido inteligente, los nuevos auriculares Studio Pro te transportan al centro mismo de cada nota. Siente la música como nunca antes. Disponible hoy con envío express.`,
  },
];
