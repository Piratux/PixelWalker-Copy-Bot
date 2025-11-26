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

const basePath = '/PixelWalker-Copy-Bot'

export const Routes: RouteRecordRaw[] = [
  {
    path: `${basePath}/login`,
    name: RouteName.LOGIN,
    component: LoginView,
  },
  {
    path: `${basePath}/home`,
    name: RouteName.HOME,
    component: HomeView,
  },
  {
    path: `${basePath}/import-eelvl`,
    name: RouteName.IMPORT_EELVL,
    component: EelvlImportView,
  },
  {
    path: `${basePath}/export-eelvl`,
    name: RouteName.EXPORT_EELVL,
    component: EelvlExportView,
  },
  {
    path: `${basePath}/import-png`,
    name: RouteName.IMPORT_PNG,
    component: PngImportView,
  },
  {
    path: `${basePath}/import-midi`,
    name: RouteName.IMPORT_MIDI,
    component: MidiImportView,
  },
  {
    path: `${basePath}/dev`,
    name: RouteName.DEV,
    component: DevView,
  },
  {
    path: `${basePath}/import-eer`,
    name: RouteName.IMPORT_EER,
    component: EerImportView,
  },
  {
    path: `${basePath}/list-portals`,
    name: RouteName.LIST_PORTALS,
    component: PortalListView,
  },
  {
    path: '/:pathMatch(.*)*',
    name: RouteName.NOT_FOUND,
    component: NotFoundView,
  },
]
