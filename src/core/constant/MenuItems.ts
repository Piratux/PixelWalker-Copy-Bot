import { RouteName } from '@/router/RouteName'

interface MenuItem {
  text: string
  routeName: RouteName
}

export const MENU_ITEMS: MenuItem[] = [
  {
    text: 'Home',
    routeName: RouteName.HOME,
  },
  {
    text: 'Import EELVL',
    routeName: RouteName.IMPORT_EELVL,
  },
  {
    text: 'Export EELVL',
    routeName: RouteName.EXPORT_EELVL,
  },
  {
    text: 'Import PNG',
    routeName: RouteName.IMPORT_PNG,
  },
  {
    text: 'Import MIDI',
    routeName: RouteName.IMPORT_MIDI,
  },
  {
    text: 'Import EER',
    routeName: RouteName.IMPORT_EER,
  },
  {
    text: 'Block finder',
    routeName: RouteName.BLOCK_FINDER,
  },
  {
    text: 'Minimap teleporter',
    routeName: RouteName.MINIMAP_TELEPORTER,
  },
]
