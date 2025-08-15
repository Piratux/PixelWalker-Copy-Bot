import {
  EerImportViewRoute,
  EelvlExportViewRoute,
  HomeViewRoute,
  EelvlImportViewRoute,
  MidiImportViewRoute,
  PngImportViewRoute,
} from '@/router/Routes.ts'

export const MENU_ITEMS = [
  {
    text: 'Home',
    link: HomeViewRoute.path,
  },
  {
    text: 'Import EELVL',
    link: EelvlImportViewRoute.path,
  },
  {
    text: 'Export EELVL',
    link: EelvlExportViewRoute.path,
  },
  {
    text: 'Import PNG',
    link: PngImportViewRoute.path,
  },
  {
    text: 'Import MIDI',
    link: MidiImportViewRoute.path,
  },
  {
    text: 'Import EER',
    link: EerImportViewRoute.path,
  },
]
