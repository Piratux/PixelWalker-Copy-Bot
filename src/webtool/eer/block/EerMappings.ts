export interface EerListBlockResult {
  PaletteId: string
  Layer: number
  LegacyId: number
  LegacyMorph?: number[]
}

// Data in same format as /listblocks but only contains EER blocks that are not in EELVL
// This preferably should be put in PW endpoint (possibly /listblocks-eer ?)
// NOTE: Id here is ignored, but left, because ListBlockResult type expects it.
export const EER_MAPPINGS: EerListBlockResult[] = [
  {
    PaletteId: 'hazard_spikes_purple_up',
    Layer: 1,
    LegacyId: 1683,
    LegacyMorph: [1],
  },
  {
    PaletteId: 'hazard_spikes_purple_right',
    Layer: 1,
    LegacyId: 1683,
    LegacyMorph: [2],
  },
  {
    PaletteId: 'hazard_spikes_purple_down',
    Layer: 1,
    LegacyId: 1683,
    LegacyMorph: [3],
  },
  {
    PaletteId: 'hazard_spikes_purple_left',
    Layer: 1,
    LegacyId: 1683,
    LegacyMorph: [0],
  },
  {
    PaletteId: 'hazard_spikes_purple_center',
    Layer: 1,
    LegacyId: 1684,
  },
  {
    PaletteId: 'hazard_spikes_cyan_up',
    Layer: 1,
    LegacyId: 1687,
    LegacyMorph: [1],
  },
  {
    PaletteId: 'hazard_spikes_cyan_right',
    Layer: 1,
    LegacyId: 1687,
    LegacyMorph: [2],
  },
  {
    PaletteId: 'hazard_spikes_cyan_down',
    Layer: 1,
    LegacyId: 1687,
    LegacyMorph: [3],
  },
  {
    PaletteId: 'hazard_spikes_cyan_left',
    Layer: 1,
    LegacyId: 1687,
    LegacyMorph: [0],
  },
  {
    PaletteId: 'hazard_spikes_cyan_center',
    Layer: 1,
    LegacyId: 1688,
  },
  {
    PaletteId: 'minerals_purple',
    Layer: 1,
    LegacyId: 1185,
  },
  {
    PaletteId: 'hazard_fire',
    Layer: 1,
    LegacyId: 1682,
  },
  // Orange Spikes (EER)
  {
    PaletteId: 'hazard_spikes_brown_up',
    Layer: 1,
    LegacyId: 1685,
    LegacyMorph: [1],
  },
  {
    PaletteId: 'hazard_spikes_brown_right',
    Layer: 1,
    LegacyId: 1685,
    LegacyMorph: [2],
  },
  {
    PaletteId: 'hazard_spikes_brown_down',
    Layer: 1,
    LegacyId: 1685,
    LegacyMorph: [3],
  },
  {
    PaletteId: 'hazard_spikes_brown_left',
    Layer: 1,
    LegacyId: 1685,
    LegacyMorph: [0],
  },
  {
    PaletteId: 'hazard_spikes_brown_center',
    Layer: 1,
    LegacyId: 1686,
  },
  // Magenta Spikes (EER)
  {
    PaletteId: 'hazard_spikes_purple_up',
    Layer: 1,
    LegacyId: 1689,
    LegacyMorph: [1],
  },
  {
    PaletteId: 'hazard_spikes_purple_right',
    Layer: 1,
    LegacyId: 1689,
    LegacyMorph: [2],
  },
  {
    PaletteId: 'hazard_spikes_purple_down',
    Layer: 1,
    LegacyId: 1689,
    LegacyMorph: [3],
  },
  {
    PaletteId: 'hazard_spikes_purple_left',
    Layer: 1,
    LegacyId: 1689,
    LegacyMorph: [0],
  },
  {
    PaletteId: 'hazard_spikes_purple_center',
    Layer: 1,
    LegacyId: 1690,
  },
  // Black Spikes (EER)
  {
    PaletteId: 'hazard_spikes_gray_up',
    Layer: 1,
    LegacyId: 1691,
    LegacyMorph: [1],
  },
  {
    PaletteId: 'hazard_spikes_gray_right',
    Layer: 1,
    LegacyId: 1691,
    LegacyMorph: [2],
  },
  {
    PaletteId: 'hazard_spikes_gray_down',
    Layer: 1,
    LegacyId: 1691,
    LegacyMorph: [3],
  },
  {
    PaletteId: 'hazard_spikes_gray_left',
    Layer: 1,
    LegacyId: 1691,
    LegacyMorph: [0],
  },
  {
    PaletteId: 'hazard_spikes_gray_center',
    Layer: 1,
    LegacyId: 1692,
  },
  // Snow Bricks (EER)
  {
    PaletteId: 'winter_ice_dark_left',
    Layer: 1,
    LegacyId: 1170,
  },
  {
    PaletteId: 'winter_ice_dark_middle',
    Layer: 1,
    LegacyId: 1171,
  },
  {
    PaletteId: 'winter_ice_dark_right',
    Layer: 1,
    LegacyId: 1172,
  },
  // Missing Glass Bricks (EER)
  {
    PaletteId: 'tiles_white',
    Layer: 1,
    LegacyId: 1189,
  },
  {
    PaletteId: 'tiles_gray',
    Layer: 1,
    LegacyId: 1190,
  },
  {
    PaletteId: 'tiles_black',
    Layer: 1,
    LegacyId: 1191,
  },
  // Missing Minerals Bricks (EER)
  {
    PaletteId: 'brick_white',
    Layer: 1,
    LegacyId: 1186,
  },
  {
    PaletteId: 'brick_gray',
    Layer: 1,
    LegacyId: 1187,
  },
  {
    PaletteId: 'brick_black',
    Layer: 1,
    LegacyId: 1188,
  },
  // Missing Sci-Fi Bricks (EER)
  {
    PaletteId: 'cloud_white_center',
    Layer: 1,
    LegacyId: 1177,
  },
  {
    PaletteId: 'cloud_gray_center',
    Layer: 1,
    LegacyId: 1178,
  },
  // Missing Sci-Fi Oneways (EER)
  {
    PaletteId: 'scifi_oneway_cyan_top',
    Layer: 1,
    LegacyId: 1179,
  },
  {
    PaletteId: 'scifi_oneway_cyan_top',
    Layer: 1,
    LegacyId: 1180,
  },
  // Missing Plastic Blocks (EER)
  {
    PaletteId: 'checker_white',
    Layer: 1,
    LegacyId: 1193,
  },
  {
    PaletteId: 'checker_gray',
    Layer: 1,
    LegacyId: 1194,
  },
  {
    PaletteId: 'checker_black',
    Layer: 1,
    LegacyId: 1195,
  },
  {
    PaletteId: 'checker_magenta',
    Layer: 1,
    LegacyId: 1192,
  },
  // Missing Gemstone Blocks (EER)
  {
    PaletteId: 'stone_gray',
    Layer: 1,
    LegacyId: 1181,
  },
  {
    PaletteId: 'minerals_red', // TODO: Add CENTER shadow on top.
    Layer: 1,
    LegacyId: 1201,
  },
  // Missing Orange Easter Egg (EER)
  {
    PaletteId: 'easter_egg_red',
    Layer: 1,
    LegacyId: 1586,
  },
  // Exclusive Nature Pack (EER)
  {
    PaletteId: 'factory_wood',
    Layer: 1,
    LegacyId: 1693,
  },
  {
    PaletteId: 'environment_log',
    Layer: 1,
    LegacyId: 1694,
  },
  {
    PaletteId: 'environment_log',
    Layer: 1,
    LegacyId: 1695,
  },
  {
    PaletteId: 'garden_grass',
    Layer: 1,
    LegacyId: 1696,
  },
  {
    PaletteId: 'garden_leaves',
    Layer: 1,
    LegacyId: 1697,
  },
  {
    PaletteId: 'garden_oneway_leaf_left',
    Layer: 1,
    LegacyId: 1698,
  },
  {
    PaletteId: 'garden_oneway_leaf_branch',
    Layer: 1,
    LegacyId: 1699,
  },
  {
    PaletteId: 'garden_oneway_leaf_branch',
    Layer: 1,
    LegacyId: 1700,
  },
  {
    PaletteId: 'environment_log_bg',
    Layer: 0,
    LegacyId: 813,
  },
  {
    PaletteId: 'environment_log_bg',
    Layer: 0,
    LegacyId: 814,
  },
  {
    PaletteId: 'garden_grass_bg',
    Layer: 0,
    LegacyId: 815,
  },
  {
    PaletteId: 'garden_leaves_bg',
    Layer: 0,
    LegacyId: 816,
  },
  // Missing Caution Decorations (EER)
  {
    PaletteId: 'industrial_caution_tape_vertical',
    Layer: 1,
    LegacyId: 1587,
  },

  // Missing Outerspace Decorations (EER)
  {
    PaletteId: 'outerspace_light_cyan',
    Layer: 1,
    LegacyId: 1572,
  },
  {
    PaletteId: 'outerspace_light_red',
    Layer: 1,
    LegacyId: 1573,
  },

  // Missing Domestic Decorations (EER)
  {
    PaletteId: 'restaurant_glass_empty',
    Layer: 1,
    LegacyId: 1551,
  },
  {
    PaletteId: 'monster_eye_yellow',
    Layer: 1,
    LegacyId: 1552,
  },
  {
    PaletteId: 'monster_scales_purple_dark_bg',
    Layer: 0,
    LegacyId: 807,
  },
]
