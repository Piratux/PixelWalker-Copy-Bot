import {
  EERImportViewRoute,
  ExportEelvlViewRoute,
  HomeViewRoute,
  ImportEelvlViewRoute,
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
    link: ImportEelvlViewRoute.path,
  },
  {
    text: 'Export EELVL',
    link: ExportEelvlViewRoute.path,
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
    link: EERImportViewRoute.path,
  },
]
