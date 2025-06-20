import { ExportEelvlViewRoute, HomeViewRoute, ImportEelvlViewRoute } from '@/router/Routes.ts'

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
]
