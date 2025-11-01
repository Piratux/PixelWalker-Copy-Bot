import type { RouteLocationNormalizedGeneric } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { Routes } from './Routes.ts'
import { LAST_TESTED_ROOM_TYPE_VERSION } from '@/core/constant/General.ts'
import { usePwClientStore } from '@/core/store/PwClientStore.ts'
import { AlertService } from '@/core/service/AlertService.ts'
import { RouteName } from './RouteName.ts'

function buildRouter() {
  const router = createRouter({
    history: createWebHistory(),
    routes: Routes,
  })

  router.beforeEach((to: RouteLocationNormalizedGeneric) => {
    handleAlert(to)

    if (to.name === RouteName.NotFound) {
      return { name: RouteName.Home }
    }
  })

  return router
}

function handleAlert(to: RouteLocationNormalizedGeneric) {
  AlertService.clear()

  console.log('usePwClientStore().roomType: ', usePwClientStore().roomType)

  if (
    [
      RouteName.ImportEelvl,
      RouteName.ExportEelvl,
      RouteName.ImportMidi,
      RouteName.ImportPng,
      RouteName.ImportEer,
    ].includes(to.name as RouteName) &&
    usePwClientStore().roomType !== '' &&
    LAST_TESTED_ROOM_TYPE_VERSION !== usePwClientStore().roomType
  ) {
    AlertService.warning(
      'This functionality was not tested with latest PixelWalker version, so it may not work or work incorrectly',
    )
  }
}

export { buildRouter as createRouter }
