import type { RouteLocationNormalizedGeneric } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { Routes } from './Routes.ts'
import { RouteName } from './RouteName.ts'

function buildRouter() {
  const router = createRouter({
    history: createWebHistory(),
    routes: Routes,
  })

  router.beforeEach((to: RouteLocationNormalizedGeneric) => {
    // handleAlert(to)

    if (to.name === RouteName.NOT_FOUND) {
      return { name: RouteName.HOME }
    }
  })

  return router
}

// function handleAlert(to: RouteLocationNormalizedGeneric) {
//   AlertService.clear()

// TODO: Add back when /version endpoint function is added
// if (
//   [
//     RouteName.IMPORT_EELVL,
//     RouteName.EXPORT_EELVL,
//     RouteName.IMPORT_MIDI,
//     RouteName.IMPORT_PNG,
//     RouteName.IMPORT_EER,
//   ].includes(to.name as RouteName) &&
//   usePwClientStore().roomType !== '' &&
//   LAST_TESTED_VERSION !== usePwClientStore().roomType
// ) {
//   AlertService.warning(
//     'This functionality was not tested with latest PixelWalker version, so it may not work or work incorrectly',
//   )
// }
// }

export { buildRouter as createRouter }
