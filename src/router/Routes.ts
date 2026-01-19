import type { RouteRecordRaw } from 'vue-router'
import MidiImportView from '@/view/MidiImportView.vue'
import LoginView from '@/view/LoginView.vue'
import HomeView from '@/view/HomeView.vue'
import EelvlImportView from '@/view/EelvlImportView.vue'
import EelvlExportView from '@/view/EelvlExportView.vue'
import PngImportView from '@/view/PngImportView.vue'
import DevView from '@/view/DevView.vue'
import EerImportView from '@/view/EerImportView.vue'
import PortalListView from '@/view/PortalListView.vue'
import NotFoundView from '@/view/NotFoundView.vue'
import { RouteName } from './RouteName.ts'
import AdminLoginView from '@/view/AdminLoginView.vue'
import MinimapTeleporterView from '@/view/MinimapTeleporterView.vue'

const basePath = '/PixelWalker-Copy-Bot'

export const Routes: RouteRecordRaw[] = [
  ...[
    {
      name: RouteName.LOGIN,
      component: LoginView,
    },
    {
      name: RouteName.ADMIN_LOGIN,
      component: AdminLoginView,
    },
    {
      name: RouteName.HOME,
      component: HomeView,
    },
    {
      name: RouteName.IMPORT_EELVL,
      component: EelvlImportView,
    },
    {
      name: RouteName.EXPORT_EELVL,
      component: EelvlExportView,
    },
    {
      name: RouteName.IMPORT_PNG,
      component: PngImportView,
    },
    {
      name: RouteName.IMPORT_MIDI,
      component: MidiImportView,
    },
    {
      name: RouteName.DEV,
      component: DevView,
    },
    {
      name: RouteName.IMPORT_EER,
      component: EerImportView,
    },
    {
      name: RouteName.LIST_PORTALS,
      component: PortalListView,
    },
    {
      name: RouteName.MINIMAP_TELEPORTER,
      component: MinimapTeleporterView,
    },
  ].map((route) => ({ ...route, path: `${basePath}/${route.name}` })),
  {
    path: '/:pathMatch(.*)*',
    name: RouteName.NOT_FOUND,
    component: NotFoundView,
  },
]
