import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

const buildVuetify = () =>
  createVuetify({
    ssr: true,
    components,
    directives,
    icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
  })

export { buildVuetify as createVuetify }
