import { ListBlockResult } from 'pw-js-api'

// Data in same format as /listblocks but only contains EER blocks that are not in EELVL
// This preferably should be put in PW endpoint (possibly /listblocks-eer ?)
// NOTE: Id here is ignored, but left, because ListBlockResult type expects it.
export const EER_MAPPINGS: ListBlockResult[] = [
  {
    Id: 117,
    PaletteId: 'hazard_spikes_purple_up',
    Layer: 1,
    LegacyId: 1683,
    LegacyMorph: [1],
  },
  {
    Id: 118,
    PaletteId: 'hazard_spikes_purple_right',
    Layer: 1,
    LegacyId: 1683,
    LegacyMorph: [2],
  },
  {
    Id: 119,
    PaletteId: 'hazard_spikes_purple_down',
    Layer: 1,
    LegacyId: 1683,
    LegacyMorph: [3],
  },
  {
    Id: 120,
    PaletteId: 'hazard_spikes_purple_left',
    Layer: 1,
    LegacyId: 1683,
    LegacyMorph: [0],
  },
  {
    Id: 121,
    PaletteId: 'hazard_spikes_purple_center',
    Layer: 1,
    LegacyId: 1684,
  },
  {
    Id: 117,
    PaletteId: 'hazard_spikes_cyan_up',
    Layer: 1,
    LegacyId: 1687,
    LegacyMorph: [1],
  },
  {
    Id: 118,
    PaletteId: 'hazard_spikes_cyan_right',
    Layer: 1,
    LegacyId: 1687,
    LegacyMorph: [2],
  },
  {
    Id: 119,
    PaletteId: 'hazard_spikes_cyan_down',
    Layer: 1,
    LegacyId: 1687,
    LegacyMorph: [3],
  },
  {
    Id: 120,
    PaletteId: 'hazard_spikes_cyan_left',
    Layer: 1,
    LegacyId: 1687,
    LegacyMorph: [0],
  },
  {
    Id: 121,
    PaletteId: 'hazard_spikes_cyan_center',
    Layer: 1,
    LegacyId: 1688,
  },
  {
    Id: 121,
    PaletteId: 'minerals_purple',
    Layer: 1,
    LegacyId: 1185,
  },
  {
    Id: 121,
    PaletteId: 'hazard_fire',
    Layer: 1,
    LegacyId: 1682,
  },
]
