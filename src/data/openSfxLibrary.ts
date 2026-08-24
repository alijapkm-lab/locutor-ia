export interface OpenAudioSource {
  id: string;
  name: string;
  description: string;
  license: string;
  website: string;
  badgeColor: string;
}

export const OPEN_AUDIO_REPOSITORIES: OpenAudioSource[] = [
  {
    id: 'wikimedia_commons',
    name: 'Wikimedia Commons (Dominio Público / CC0)',
    description: 'Repositorio abierto y libre con miles de grabaciones de audio y efectos de sonido bajo dominio público y licencias Creative Commons.',
    license: 'Creative Commons CC0 1.0 Universal / Public Domain Dedication',
    website: 'https://commons.wikimedia.org/wiki/Category:Audio_files',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    id: 'freesound_open',
    name: 'Freesound CC0 Archive',
    description: 'Archivo colaborativo de grabaciones de campo, foley y efectos acústicos reales grabados con micrófonos de condensador.',
    license: 'CC0 Public Domain (Sin regalías, 100% libre para uso comercial y personal)',
    website: 'https://freesound.org',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'bigsoundbank_cc0',
    name: 'BigSoundBank (Biblioteca Libre)',
    description: 'Banco de sonidos acústicos en alta definición grabados por sonidistas profesionales bajo licencia libre.',
    license: 'Licencia Abierta Libre de Derechos (Royalty-Free / CC0)',
    website: 'https://bigsoundbank.com',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    id: 'open_audio_lab',
    name: 'Open Audio Lab & Archive',
    description: 'Colección de muestras y grabaciones de efectos cinemáticos de acceso abierto.',
    license: 'Creative Commons Attribution 3.0 / CC0',
    website: 'https://archive.org/details/audio',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
];
