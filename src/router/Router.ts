import type { RouteLocationNormalizedGeneric, RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import * as Routes from './Routes.ts'
import {
  EelvlExportViewRoute,
  EelvlImportViewRoute,
  EerImportViewRoute,
  HomeViewRoute,
  MidiImportViewRoute,
  NotFoundViewRoute,
  PngImportViewRoute,
} from './Routes.ts'
import { LAST_TESTED_ROOM_TYPE_VERSION } from '@/core/constant/General.ts'
import { usePwClientStore } from '@/core/store/PwClientStore.ts'
import { AlertService } from '@/core/service/AlertService.ts'

function buildRouter() {
  const routes: RouteRecordRaw[] = [...Object.values(Routes)].sort((a, b): number => {
    return a.path.length < b.path.length ? 1 : -1
  })

  const router = createRouter({
    history: createWebHistory(),
    routes: [...routes],
  })

  router.beforeEach((to: RouteLocationNormalizedGeneric) => {
    handleAlert(to)

    if (to.name === NotFoundViewRoute.name) {
      return { name: HomeViewRoute.name }
    }
  })

  return router
}

function handleAlert(to: RouteLocationNormalizedGeneric) {
  AlertService.clear()

  console.log('usePwClientStore().roomType: ', usePwClientStore().roomType)

  if (
    [
      EelvlImportViewRoute.name,
      EelvlExportViewRoute.name,
      MidiImportViewRoute.name,
      PngImportViewRoute.name,
      EerImportViewRoute.name,
    ].includes(to.name as string) &&
    usePwClientStore().roomType !== '' &&
    LAST_TESTED_ROOM_TYPE_VERSION !== usePwClientStore().roomType
  ) {
    AlertService.warning(
      'This functionality was not tested with latest PixelWalker version, so it may not work or work incorrectly',
    )
  }
}

export { buildRouter as createRouter }
