import { ListBlockResult } from 'pw-js-api'

// Data in same format as /listblocks but only contains EER blocks that are not in EELVL
// This preferably should be put in PW endpoint (possibly /listblocks-eer ?)
// NOTE: Id here is ignored, but left, because ListBlockResult type expects it.
export const EER_MAPPINGS: ListBlockResult[] = [
  {
    Id: 0,
    PaletteId: 'hazard_spikes_purple_up',
    Layer: 1,
    LegacyId: 1683,
    LegacyMorph: [1],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_purple_right',
    Layer: 1,
    LegacyId: 1683,
    LegacyMorph: [2],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_purple_down',
    Layer: 1,
    LegacyId: 1683,
    LegacyMorph: [3],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_purple_left',
    Layer: 1,
    LegacyId: 1683,
    LegacyMorph: [0],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_purple_center',
    Layer: 1,
    LegacyId: 1684,
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_cyan_up',
    Layer: 1,
    LegacyId: 1687,
    LegacyMorph: [1],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_cyan_right',
    Layer: 1,
    LegacyId: 1687,
    LegacyMorph: [2],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_cyan_down',
    Layer: 1,
    LegacyId: 1687,
    LegacyMorph: [3],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_cyan_left',
    Layer: 1,
    LegacyId: 1687,
    LegacyMorph: [0],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_cyan_center',
    Layer: 1,
    LegacyId: 1688,
  },
  {
    Id: 0,
    PaletteId: 'minerals_purple',
    Layer: 1,
    LegacyId: 1185,
  },
  {
    Id: 0,
    PaletteId: 'hazard_fire',
    Layer: 1,
    LegacyId: 1682,
  },
  // Orange Spikes (EER)
  {
    Id: 0,
    PaletteId: 'hazard_spikes_brown_up',
    Layer: 1,
    LegacyId: 1685,
    LegacyMorph: [1],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_brown_right',
    Layer: 1,
    LegacyId: 1685,
    LegacyMorph: [2],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_brown_down',
    Layer: 1,
    LegacyId: 1685,
    LegacyMorph: [3],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_brown_left',
    Layer: 1,
    LegacyId: 1685,
    LegacyMorph: [0],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_brown_center',
    Layer: 1,
    LegacyId: 1686,
  },
  // Magenta Spikes (EER)
  {
    Id: 0,
    PaletteId: 'hazard_spikes_purple_up',
    Layer: 1,
    LegacyId: 1689,
    LegacyMorph: [1],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_purple_right',
    Layer: 1,
    LegacyId: 1689,
    LegacyMorph: [2],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_purple_down',
    Layer: 1,
    LegacyId: 1689,
    LegacyMorph: [3],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_purple_left',
    Layer: 1,
    LegacyId: 1689,
    LegacyMorph: [0],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_purple_center',
    Layer: 1,
    LegacyId: 1690,
  },
  // Black Spikes (EER)
  {
    Id: 0,
    PaletteId: 'hazard_spikes_gray_up',
    Layer: 1,
    LegacyId: 1691,
    LegacyMorph: [1],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_gray_right',
    Layer: 1,
    LegacyId: 1691,
    LegacyMorph: [2],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_gray_down',
    Layer: 1,
    LegacyId: 1691,
    LegacyMorph: [3],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_gray_left',
    Layer: 1,
    LegacyId: 1691,
    LegacyMorph: [0],
  },
  {
    Id: 0,
    PaletteId: 'hazard_spikes_gray_center',
    Layer: 1,
    LegacyId: 1692,
  },
  // Snow Bricks (EER)
  {
    Id: 0,
    PaletteId: 'winter_ice_dark_left',
    Layer: 1,
    LegacyId: 1170,
  },
  {
    Id: 0,
    PaletteId: 'winter_ice_dark_middle',
    Layer: 1,
    LegacyId: 1171,
  },
  {
    Id: 0,
    PaletteId: 'winter_ice_dark_right',
    Layer: 1,
    LegacyId: 1172,
  },
  // Missing Glass Bricks (EER)
  {
    Id: 0,
    PaletteId: 'tiles_white',
    Layer: 1,
    LegacyId: 1189,
  },
  {
    Id: 0,
    PaletteId: 'tiles_gray',
    Layer: 1,
    LegacyId: 1190,
  },
  {
    Id: 0,
    PaletteId: 'tiles_black',
    Layer: 1,
    LegacyId: 1191,
  },
  // Missing Minerals Bricks (EER)
  {
    Id: 0,
    PaletteId: 'brick_white',
    Layer: 1,
    LegacyId: 1186,
  },
  {
    Id: 0,
    PaletteId: 'brick_gray',
    Layer: 1,
    LegacyId: 1187,
  },
  {
    Id: 0,
    PaletteId: 'brick_black',
    Layer: 1,
    LegacyId: 1188,
  },
  // Missing Sci-Fi Bricks (EER)
  {
    Id: 0,
    PaletteId: 'cloud_white_center',
    Layer: 1,
    LegacyId: 1177,
  },
  {
    Id: 0,
    PaletteId: 'cloud_gray_center',
    Layer: 1,
    LegacyId: 1178,
  },
  // Missing Sci-Fi Oneways (EER)
  {
    Id: 0,
    PaletteId: 'scifi_oneway_cyan_top',
    Layer: 1,
    LegacyId: 1179,
  },
  {
    Id: 0,
    PaletteId: 'scifi_oneway_cyan_top',
    Layer: 1,
    LegacyId: 1180,
  },
  // Missing Plastic Blocks (EER)
  {
    Id: 0,
    PaletteId: 'checker_white',
    Layer: 1,
    LegacyId: 1193,
  },
  {
    Id: 0,
    PaletteId: 'checker_gray',
    Layer: 1,
    LegacyId: 1194,
  },
  {
    Id: 0,
    PaletteId: 'checker_black',
    Layer: 1,
    LegacyId: 1195,
  },
  {
    Id: 0,
    PaletteId: 'checker_magenta',
    Layer: 1,
    LegacyId: 1192,
  },
  // Missing Gemstone Blocks (EER)
  {
    Id: 0,
    PaletteId: 'stone_gray',
    Layer: 1,
    LegacyId: 1181,
  },
  {
    Id: 0,
    PaletteId: 'minerals_red', // TODO: Add CENTER shadow on top.
    Layer: 1,
    LegacyId: 1201,
  },
  // Missing Orange Easter Egg (EER)
  {
    Id: 0,
    PaletteId: 'easter_egg_red',
    Layer: 1,
    LegacyId: 1586,
  },
  // Exclusive Nature Pack (EER)
  {
    Id: 0,
    PaletteId: 'factory_wood',
    Layer: 1,
    LegacyId: 1693,
  },
  {
    Id: 0,
    PaletteId: 'environment_log',
    Layer: 1,
    LegacyId: 1694,
  },
  {
    Id: 0,
    PaletteId: 'environment_log',
    Layer: 1,
    LegacyId: 1695,
  },
  {
    Id: 0,
    PaletteId: 'garden_grass',
    Layer: 1,
    LegacyId: 1696,
  },
  {
    Id: 0,
    PaletteId: 'garden_leaves',
    Layer: 1,
    LegacyId: 1697,
  },
  {
    Id: 0,
    PaletteId: 'garden_oneway_leaf_left',
    Layer: 1,
    LegacyId: 1698,
  },
  {
    Id: 0,
    PaletteId: 'garden_oneway_leaf_branch',
    Layer: 1,
    LegacyId: 1699,
  },
  {
    Id: 0,
    PaletteId: 'garden_oneway_leaf_branch',
    Layer: 1,
    LegacyId: 1700,
  },
  {
    Id: 0,
    PaletteId: 'environment_log_bg',
    Layer: 0,
    LegacyId: 813,
  },
  {
    Id: 0,
    PaletteId: 'environment_log_bg',
    Layer: 0,
    LegacyId: 814,
  },
  {
    Id: 0,
    PaletteId: 'garden_grass_bg',
    Layer: 0,
    LegacyId: 815,
  },
  {
    Id: 0,
    PaletteId: 'garden_leaves_bg',
    Layer: 0,
    LegacyId: 816,
  },
  // Missing Caution Decorations (EER)
  {
    Id: 0,
    PaletteId: 'industrial_caution_tape_vertical',
    Layer: 1,
    LegacyId: 1587,
  },
  
  // Missing Outerspace Decorations (EER)
  {
    Id: 0,
    PaletteId: 'outerspace_light_cyan',
    Layer: 1,
    LegacyId: 1572,
  },
  {
    Id: 0,
    PaletteId: 'outerspace_light_red',
    Layer: 1,
    LegacyId: 1573,
  },
  
  // Missing Domestic Decorations (EER)
  {
    Id: 0,
    PaletteId: 'restaurant_glass_empty',
    Layer: 1,
    LegacyId: 1551,
  },
  {
    Id: 0,
    PaletteId: 'monster_eye_yellow',
    Layer: 1,
    LegacyId: 1552,
  },
  {
    Id: 0,
    PaletteId: 'monster_scales_purple_dark_bg',
    Layer: 0,
    LegacyId: 807,
  },
]
