import { EerLayer } from '@/eer/enum/EerLayer.ts'

export interface EerBlock {
  name: string
  id: number
  layer: EerLayer
}

export const EER_BLOCKS: EerBlock[] = [
  {
    name: 'EMPTY',
    id: 0,
    layer: 1,
  },

  {
    name: 'GRAVITY_LEFT',
    id: 1,
    layer: 1,
  },

  {
    name: 'GRAVITY_UP',
    id: 2,
    layer: 1,
  },

  {
    name: 'GRAVITY_RIGHT',
    id: 3,
    layer: 1,
  },

  {
    name: 'GRAVITY_DOWN',
    id: 1518,
    layer: 1,
  },

  {
    name: 'GRAVITY_DOT',
    id: 4,
    layer: 1,
  },

  {
    name: 'GRAVITY_SLOW_DOT',
    id: 459,
    layer: 1,
  },

  {
    name: 'INVISIBLE_GRAVITY_LEFT',
    id: 411,
    layer: 1,
  },

  {
    name: 'INVISIBLE_GRAVITY_UP',
    id: 412,
    layer: 1,
  },

  {
    name: 'INVISIBLE_GRAVITY_RIGHT',
    id: 413,
    layer: 1,
  },

  {
    name: 'INVISIBLE_GRAVITY_DOWN',
    id: 1519,
    layer: 1,
  },

  {
    name: 'INVISIBLE_GRAVITY_DOT',
    id: 414,
    layer: 1,
  },

  {
    name: 'INVISIBLE_GRAVITY_SLOW_DOT',
    id: 460,
    layer: 1,
  },

  {
    name: 'TOOL_SPAWN_LOBBY',
    id: 255,
    layer: 1,
  },

  {
    name: 'TOOL_CHECKPOINT',
    id: 360,
    layer: 1,
  },

  {
    name: 'TOOL_RESET',
    id: 466,
    layer: 1,
  },

  {
    name: 'TOOL_GOD_MODE_ACTIVATOR',
    id: 1516,
    layer: 1,
  },

  {
    name: 'TOOL_PORTAL_WORLD_SPAWN',
    id: 1644,
    layer: 1,
  },

  {
    name: 'TOOL_ACTIVATE_MINIMAP',
    id: 1585,
    layer: 1,
  },

  {
    name: 'BOOST_LEFT',
    id: 114,
    layer: 1,
  },

  {
    name: 'BOOST_UP',
    id: 116,
    layer: 1,
  },

  {
    name: 'BOOST_RIGHT',
    id: 115,
    layer: 1,
  },

  {
    name: 'BOOST_DOWN',
    id: 117,
    layer: 1,
  },

  {
    name: 'CLIMBABLE_VINE_VERTICAL',
    id: 98,
    layer: 1,
  },

  {
    name: 'CLIMBABLE_VINE_HORIZONTAL',
    id: 99,
    layer: 1,
  },

  {
    name: 'CLIMBABLE_CHAIN_LIGHT_VERTICAL',
    id: 118,
    layer: 1,
  },

  {
    name: 'CLIMBABLE_CHAIN_DARK_VERTICAL',
    id: 1632,
    layer: 1,
  },

  {
    name: 'CLIMBABLE_LADDER_METAL',
    id: 1534,
    layer: 1,
  },

  {
    name: 'CLIMBABLE_LADDER_WOOD',
    id: 120,
    layer: 1,
  },

  {
    name: 'CLIMBABLE_ROPE_VERTICAL',
    id: 424,
    layer: 1,
  },

  {
    name: 'CLIMBABLE_LADDER_STALK_SMALL',
    id: 472,
    layer: 1,
  },

  {
    name: 'CLIMBABLE_LADDER_STALK_LARGE',
    id: 1165,
    layer: 1,
  },

  {
    name: 'CLIMBABLE_LATTICE_VINE',
    id: 1146,
    layer: 1,
  },

  {
    name: 'SPECIAL_HOLOGRAM',
    id: 397,
    layer: 1,
  },

  {
    name: 'SPECIAL_DIAMOND',
    id: 241,
    layer: 1,
  },

  {
    name: 'SPECIAL_CAKE',
    id: 337,
    layer: 1,
  },

  {
    name: 'CROWN_GOLD',
    id: 5,
    layer: 1,
  },

  {
    name: 'CROWN_SILVER',
    id: 121,
    layer: 1,
  },

  {
    name: 'CROWN_GOLD_DOOR',
    id: 1094,
    layer: 1,
  },

  {
    name: 'CROWN_GOLD_GATE',
    id: 1095,
    layer: 1,
  },

  {
    name: 'CROWN_SILVER_DOOR',
    id: 1183,
    layer: 1,
  },

  {
    name: 'CROWN_SILVER_GATE',
    id: 1184,
    layer: 1,
  },

  {
    name: 'KEY_RED',
    id: 6,
    layer: 1,
  },

  {
    name: 'KEY_GREEN',
    id: 7,
    layer: 1,
  },

  {
    name: 'KEY_BLUE',
    id: 8,
    layer: 1,
  },

  {
    name: 'KEY_CYAN',
    id: 408,
    layer: 1,
  },

  {
    name: 'KEY_MAGENTA',
    id: 409,
    layer: 1,
  },

  {
    name: 'KEY_YELLOW',
    id: 410,
    layer: 1,
  },

  {
    name: 'KEY_RED_DOOR',
    id: 23,
    layer: 1,
  },

  {
    name: 'KEY_GREEN_DOOR',
    id: 24,
    layer: 1,
  },

  {
    name: 'KEY_BLUE_DOOR',
    id: 25,
    layer: 1,
  },

  {
    name: 'KEY_CYAN_DOOR',
    id: 1005,
    layer: 1,
  },

  {
    name: 'KEY_MAGENTA_DOOR',
    id: 1006,
    layer: 1,
  },

  {
    name: 'KEY_YELLOW_DOOR',
    id: 1007,
    layer: 1,
  },

  {
    name: 'KEY_RED_GATE',
    id: 26,
    layer: 1,
  },

  {
    name: 'KEY_GREEN_GATE',
    id: 27,
    layer: 1,
  },

  {
    name: 'KEY_BLUE_GATE',
    id: 28,
    layer: 1,
  },

  {
    name: 'KEY_CYAN_GATE',
    id: 1008,
    layer: 1,
  },

  {
    name: 'KEY_MAGENTA_GATE',
    id: 1009,
    layer: 1,
  },

  {
    name: 'KEY_YELLOW_GATE',
    id: 1010,
    layer: 1,
  },

  {
    name: 'COIN_GOLD',
    id: 100,
    layer: 1,
  },

  {
    name: 'COIN_BLUE',
    id: 101,
    layer: 1,
  },

  {
    name: 'COIN_GOLD_DOOR',
    id: 43,
    layer: 1,
  },

  {
    name: 'COIN_GOLD_GATE',
    id: 165,
    layer: 1,
  },

  {
    name: 'COIN_BLUE_DOOR',
    id: 213,
    layer: 1,
  },

  {
    name: 'COIN_BLUE_GATE',
    id: 214,
    layer: 1,
  },

  {
    name: 'EFFECTS_JUMP_HEIGHT',
    id: 417,
    layer: 1,
  },

  {
    name: 'EFFECTS_FLY',
    id: 418,
    layer: 1,
  },

  {
    name: 'EFFECTS_SPEED',
    id: 419,
    layer: 1,
  },

  {
    name: 'EFFECTS_INVULNERABILITY',
    id: 420,
    layer: 1,
  },

  {
    name: 'EFFECTS_CURSE',
    id: 421,
    layer: 1,
  },

  {
    name: 'EFFECTS_ZOMBIE',
    id: 422,
    layer: 1,
  },

  {
    name: 'EFFECTS_GRAVITYFORCE',
    id: 453,
    layer: 1,
  },

  {
    name: 'EFFECTS_MULTI_JUMP',
    id: 461,
    layer: 1,
  },

  {
    name: 'EFFECTS_GRAVITY_DOWN',
    id: 1517,
    layer: 1,
  },

  {
    name: 'EFFECTS_OFF',
    id: 1550,
    layer: 1,
  },

  {
    name: 'EFFECTS_ZOMBIE_DOOR',
    id: 207,
    layer: 1,
  },

  {
    name: 'EFFECTS_ZOMBIE_GATE',
    id: 206,
    layer: 1,
  },

  {
    name: 'SIGN_NORMAL',
    id: 385,
    layer: 1,
  },

  {
    name: 'PORTAL_VISIBLE_LEFT',
    id: 242,
    layer: 1,
  },

  {
    name: 'PORTAL_INVISIBLE_LEFT',
    id: 381,
    layer: 1,
  },

  {
    name: 'PORTAL_WORLD',
    id: 374,
    layer: 1,
  },

  {
    name: 'LIQUID_WATER',
    id: 119,
    layer: 1,
  },

  {
    name: 'LIQUID_WATER_SURFACE',
    id: 300,
    layer: 1,
  },

  {
    name: 'LIQUID_WASTE',
    id: 1641,
    layer: 1,
  },

  {
    name: 'LIQUID_WASTE_SURFACE',
    id: 1642,
    layer: 1,
  },

  {
    name: 'LIQUID_LAVA',
    id: 416,
    layer: 1,
  },

  {
    name: 'LIQUID_LAVA_SURFACE',
    id: 415,
    layer: 1,
  },

  {
    name: 'LIQUID_MUD',
    id: 369,
    layer: 1,
  },

  {
    name: 'LIQUID_MUD_SURFACE',
    id: 370,
    layer: 1,
  },

  {
    name: 'SWITCH_LOCAL_TOGGLE',
    id: 113,
    layer: 1,
  },

  {
    name: 'SWITCH_LOCAL_ACTIVATOR',
    id: 1665,
    layer: 1,
  },

  {
    name: 'SWITCH_LOCAL_DOOR',
    id: 184,
    layer: 1,
  },

  {
    name: 'SWITCH_LOCAL_GATE',
    id: 185,
    layer: 1,
  },

  {
    name: 'SWITCH_GLOBAL_TOGGLE',
    id: 467,
    layer: 1,
  },

  {
    name: 'SWITCH_GLOBAL_ACTIVATOR',
    id: 1666,
    layer: 1,
  },

  {
    name: 'SWITCH_GLOBAL_DOOR',
    id: 1079,
    layer: 1,
  },

  {
    name: 'SWITCH_GLOBAL_GATE',
    id: 1080,
    layer: 1,
  },

  {
    name: 'HAZARD_SPIKES_WHITE_UP',
    id: 1653,
    layer: 1,
  },

  {
    name: 'HAZARD_SPIKES_WHITE_CENTER',
    id: 1654,
    layer: 1,
  },

  {
    name: 'HAZARD_SPIKES_GRAY_UP',
    id: 1655,
    layer: 1,
  },

  {
    name: 'HAZARD_SPIKES_GRAY_CENTER',
    id: 1656,
    layer: 1,
  },

  {
    name: 'HAZARD_SPIKES_RED_UP',
    id: 1657,
    layer: 1,
  },

  {
    name: 'HAZARD_SPIKES_RED_CENTER',
    id: 1658,
    layer: 1,
  },

  {
    name: 'HAZARD_SPIKES_BROWN_UP',
    id: 361,
    layer: 1,
  },

  {
    name: 'HAZARD_SPIKES_BROWN_CENTER',
    id: 1643,
    layer: 1,
  },

  {
    name: 'HAZARD_SPIKES_YELLOW_UP',
    id: 1659,
    layer: 1,
  },

  {
    name: 'HAZARD_SPIKES_YELLOW_CENTER',
    id: 1660,
    layer: 1,
  },

  {
    name: 'HAZARD_SPIKES_GREEN_UP',
    id: 1661,
    layer: 1,
  },

  {
    name: 'HAZARD_SPIKES_GREEN_CENTER',
    id: 1662,
    layer: 1,
  },

  {
    name: 'HAZARD_SPIKES_BLUE_UP',
    id: 1663,
    layer: 1,
  },

  {
    name: 'HAZARD_SPIKES_BLUE_CENTER',
    id: 1664,
    layer: 1,
  },

  {
    name: 'HAZARD_FIRE',
    id: 368,
    layer: 1,
  },

  {
    name: 'HAZARD_DEATH_DOOR',
    id: 1011,
    layer: 1,
  },

  {
    name: 'HAZARD_DEATH_GATE',
    id: 1012,
    layer: 1,
  },

  {
    name: 'NOTE_DRUM',
    id: 83,
    layer: 1,
  },

  {
    name: 'NOTE_PIANO',
    id: 77,
    layer: 1,
  },

  {
    name: 'NOTE_GUITAR',
    id: 1520,
    layer: 1,
  },

  {
    name: 'TEAM_EFFECT_NONE',
    id: 423,
    layer: 1,
  },

  {
    name: 'TEAM_NONE_DOOR',
    id: 1027,
    layer: 1,
  },

  {
    name: 'TEAM_NONE_GATE',
    id: 1028,
    layer: 1,
  },

  {
    name: 'BASIC_WHITE',
    id: 1088,
    layer: 1,
  },

  {
    name: 'BASIC_GRAY',
    id: 9,
    layer: 1,
  },

  {
    name: 'BASIC_BLACK',
    id: 182,
    layer: 1,
  },

  {
    name: 'BASIC_RED',
    id: 12,
    layer: 1,
  },

  {
    name: 'BASIC_ORANGE',
    id: 1018,
    layer: 1,
  },

  {
    name: 'BASIC_YELLOW',
    id: 13,
    layer: 1,
  },

  {
    name: 'BASIC_GREEN',
    id: 14,
    layer: 1,
  },

  {
    name: 'BASIC_CYAN',
    id: 15,
    layer: 1,
  },

  {
    name: 'BASIC_BLUE',
    id: 10,
    layer: 1,
  },

  {
    name: 'BASIC_MAGENTA',
    id: 11,
    layer: 1,
  },

  {
    name: 'BASIC_WHITE_BG',
    id: 715,
    layer: 0,
  },

  {
    name: 'BASIC_GRAY_BG',
    id: 500,
    layer: 0,
  },

  {
    name: 'BASIC_BLACK_BG',
    id: 645,
    layer: 0,
  },

  {
    name: 'BASIC_RED_BG',
    id: 503,
    layer: 0,
  },

  {
    name: 'BASIC_ORANGE_BG',
    id: 644,
    layer: 0,
  },

  {
    name: 'BASIC_YELLOW_BG',
    id: 504,
    layer: 0,
  },

  {
    name: 'BASIC_GREEN_BG',
    id: 505,
    layer: 0,
  },

  {
    name: 'BASIC_CYAN_BG',
    id: 506,
    layer: 0,
  },

  {
    name: 'BASIC_BLUE_BG',
    id: 501,
    layer: 0,
  },

  {
    name: 'BASIC_MAGENTA_BG',
    id: 502,
    layer: 0,
  },

  {
    name: 'BEVELED_WHITE',
    id: 1089,
    layer: 1,
  },

  {
    name: 'BEVELED_GRAY',
    id: 42,
    layer: 1,
  },

  {
    name: 'BEVELED_BLACK',
    id: 1021,
    layer: 1,
  },

  {
    name: 'BEVELED_RED',
    id: 40,
    layer: 1,
  },

  {
    name: 'BEVELED_ORANGE',
    id: 1020,
    layer: 1,
  },

  {
    name: 'BEVELED_YELLOW',
    id: 41,
    layer: 1,
  },

  {
    name: 'BEVELED_GREEN',
    id: 38,
    layer: 1,
  },

  {
    name: 'BEVELED_CYAN',
    id: 1019,
    layer: 1,
  },

  {
    name: 'BEVELED_BLUE',
    id: 39,
    layer: 1,
  },

  {
    name: 'BEVELED_MAGENTA',
    id: 37,
    layer: 1,
  },

  {
    name: 'BEVELED_WHITE_BG',
    id: 743,
    layer: 0,
  },

  {
    name: 'BEVELED_GRAY_BG',
    id: 744,
    layer: 0,
  },

  {
    name: 'BEVELED_BLACK_BG',
    id: 745,
    layer: 0,
  },

  {
    name: 'BEVELED_RED_BG',
    id: 746,
    layer: 0,
  },

  {
    name: 'BEVELED_ORANGE_BG',
    id: 747,
    layer: 0,
  },

  {
    name: 'BEVELED_YELLOW_BG',
    id: 748,
    layer: 0,
  },

  {
    name: 'BEVELED_GREEN_BG',
    id: 749,
    layer: 0,
  },

  {
    name: 'BEVELED_CYAN_BG',
    id: 750,
    layer: 0,
  },

  {
    name: 'BEVELED_BLUE_BG',
    id: 751,
    layer: 0,
  },

  {
    name: 'BEVELED_MAGENTA_BG',
    id: 752,
    layer: 0,
  },

  {
    name: 'BRICK_WHITE',
    id: 1090,
    layer: 1,
  },

  {
    name: 'BRICK_GRAY',
    id: 1022,
    layer: 1,
  },

  {
    name: 'BRICK_BLACK',
    id: 1024,
    layer: 1,
  },

  {
    name: 'BRICK_RED',
    id: 20,
    layer: 1,
  },

  {
    name: 'BRICK_BROWN',
    id: 16,
    layer: 1,
  },

  {
    name: 'BRICK_OLIVE',
    id: 21,
    layer: 1,
  },

  {
    name: 'BRICK_GREEN',
    id: 19,
    layer: 1,
  },

  {
    name: 'BRICK_TEAL',
    id: 17,
    layer: 1,
  },

  {
    name: 'BRICK_BLUE',
    id: 1023,
    layer: 1,
  },

  {
    name: 'BRICK_PURPLE',
    id: 18,
    layer: 1,
  },

  {
    name: 'BRICK_WHITE_BG',
    id: 716,
    layer: 0,
  },

  {
    name: 'BRICK_GRAY_BG',
    id: 646,
    layer: 0,
  },

  {
    name: 'BRICK_BLACK_BG',
    id: 648,
    layer: 0,
  },

  {
    name: 'BRICK_RED_BG',
    id: 511,
    layer: 0,
  },

  {
    name: 'BRICK_BROWN_BG',
    id: 507,
    layer: 0,
  },

  {
    name: 'BRICK_OLIVE_BG',
    id: 512,
    layer: 0,
  },

  {
    name: 'BRICK_GREEN_BG',
    id: 510,
    layer: 0,
  },

  {
    name: 'BRICK_TEAL_BG',
    id: 508,
    layer: 0,
  },

  {
    name: 'BRICK_BLUE_BG',
    id: 647,
    layer: 0,
  },

  {
    name: 'BRICK_PURPLE_BG',
    id: 509,
    layer: 0,
  },

  {
    name: 'NORMAL_WHITE_BG',
    id: 717,
    layer: 0,
  },

  {
    name: 'NORMAL_GRAY_BG',
    id: 610,
    layer: 0,
  },

  {
    name: 'NORMAL_BLACK_BG',
    id: 654,
    layer: 0,
  },

  {
    name: 'NORMAL_RED_BG',
    id: 613,
    layer: 0,
  },

  {
    name: 'NORMAL_ORANGE_BG',
    id: 653,
    layer: 0,
  },

  {
    name: 'NORMAL_YELLOW_BG',
    id: 614,
    layer: 0,
  },

  {
    name: 'NORMAL_GREEN_BG',
    id: 615,
    layer: 0,
  },

  {
    name: 'NORMAL_CYAN_BG',
    id: 616,
    layer: 0,
  },

  {
    name: 'NORMAL_BLUE_BG',
    id: 611,
    layer: 0,
  },

  {
    name: 'NORMAL_MAGENTA_BG',
    id: 612,
    layer: 0,
  },

  {
    name: 'DARK_WHITE_BG',
    id: 719,
    layer: 0,
  },

  {
    name: 'DARK_GRAY_BG',
    id: 520,
    layer: 0,
  },

  {
    name: 'DARK_BLACK_BG',
    id: 652,
    layer: 0,
  },

  {
    name: 'DARK_RED_BG',
    id: 523,
    layer: 0,
  },

  {
    name: 'DARK_ORANGE_BG',
    id: 651,
    layer: 0,
  },

  {
    name: 'DARK_YELLOW_BG',
    id: 524,
    layer: 0,
  },

  {
    name: 'DARK_GREEN_BG',
    id: 525,
    layer: 0,
  },

  {
    name: 'DARK_CYAN_BG',
    id: 526,
    layer: 0,
  },

  {
    name: 'DARK_BLUE_BG',
    id: 521,
    layer: 0,
  },

  {
    name: 'DARK_MAGENTA_BG',
    id: 522,
    layer: 0,
  },

  {
    name: 'CHECKER_WHITE',
    id: 1091,
    layer: 1,
  },

  {
    name: 'CHECKER_GRAY',
    id: 186,
    layer: 1,
  },

  {
    name: 'CHECKER_BLACK',
    id: 1026,
    layer: 1,
  },

  {
    name: 'CHECKER_RED',
    id: 189,
    layer: 1,
  },

  {
    name: 'CHECKER_ORANGE',
    id: 1025,
    layer: 1,
  },

  {
    name: 'CHECKER_YELLOW',
    id: 190,
    layer: 1,
  },

  {
    name: 'CHECKER_GREEN',
    id: 191,
    layer: 1,
  },

  {
    name: 'CHECKER_CYAN',
    id: 192,
    layer: 1,
  },

  {
    name: 'CHECKER_BLUE',
    id: 187,
    layer: 1,
  },

  {
    name: 'CHECKER_MAGENTA',
    id: 188,
    layer: 1,
  },

  {
    name: 'CHECKER_WHITE_BG',
    id: 718,
    layer: 0,
  },

  {
    name: 'CHECKER_GRAY_BG',
    id: 513,
    layer: 0,
  },

  {
    name: 'CHECKER_BLACK_BG',
    id: 650,
    layer: 0,
  },

  {
    name: 'CHECKER_RED_BG',
    id: 516,
    layer: 0,
  },

  {
    name: 'CHECKER_ORANGE_BG',
    id: 649,
    layer: 0,
  },

  {
    name: 'CHECKER_YELLOW_BG',
    id: 517,
    layer: 0,
  },

  {
    name: 'CHECKER_GREEN_BG',
    id: 518,
    layer: 0,
  },

  {
    name: 'CHECKER_CYAN_BG',
    id: 519,
    layer: 0,
  },

  {
    name: 'CHECKER_BLUE_BG',
    id: 514,
    layer: 0,
  },

  {
    name: 'CHECKER_MAGENTA_BG',
    id: 515,
    layer: 0,
  },

  {
    name: 'PASTEL_RED_BG',
    id: 532,
    layer: 0,
  },

  {
    name: 'PASTEL_ORANGE_BG',
    id: 676,
    layer: 0,
  },

  {
    name: 'PASTEL_YELLOW_BG',
    id: 527,
    layer: 0,
  },

  {
    name: 'PASTEL_LIME_BG',
    id: 529,
    layer: 0,
  },

  {
    name: 'PASTEL_GREEN_BG',
    id: 528,
    layer: 0,
  },

  {
    name: 'PASTEL_CYAN_BG',
    id: 530,
    layer: 0,
  },

  {
    name: 'PASTEL_BLUE_BG',
    id: 531,
    layer: 0,
  },

  {
    name: 'PASTEL_PURPLE_BG',
    id: 677,
    layer: 0,
  },

  {
    name: 'GRASS_BRICK_LEFT',
    id: 34,
    layer: 1,
  },

  {
    name: 'GRASS_BRICK_MIDDLE',
    id: 35,
    layer: 1,
  },

  {
    name: 'GRASS_BRICK_RIGHT',
    id: 36,
    layer: 1,
  },

  {
    name: 'METAL_SILVER',
    id: 29,
    layer: 1,
  },

  {
    name: 'METAL_COPPER',
    id: 30,
    layer: 1,
  },

  {
    name: 'METAL_GOLD',
    id: 31,
    layer: 1,
  },

  {
    name: 'GENERIC_STRIPED_HAZARD_YELLOW',
    id: 22,
    layer: 1,
  },

  {
    name: 'GENERIC_STRIPED_HAZARD_BLACK',
    id: 1058,
    layer: 1,
  },

  {
    name: 'GENERIC_YELLOW_FACE',
    id: 32,
    layer: 1,
  },

  {
    name: 'GENERIC_YELLOW',
    id: 1057,
    layer: 1,
  },

  {
    name: 'GENERIC_BLACK',
    id: 33,
    layer: 1,
  },

  {
    name: 'GENERIC_BLACK_TRANSPARENT',
    id: 44,
    layer: 1,
  },

  {
    name: 'SECRET_APPEAR',
    id: 50,
    layer: 1,
  },

  {
    name: 'SECRET_DISAPPEAR',
    id: 243,
    layer: 1,
  },

  {
    name: 'SECRET_INVISIBLE',
    id: 136,
    layer: 1,
  },

  {
    name: 'GLASS_RED',
    id: 51,
    layer: 1,
  },

  {
    name: 'GLASS_ORANGE',
    id: 58,
    layer: 1,
  },

  {
    name: 'GLASS_YELLOW',
    id: 57,
    layer: 1,
  },

  {
    name: 'GLASS_GREEN',
    id: 56,
    layer: 1,
  },

  {
    name: 'GLASS_CYAN',
    id: 55,
    layer: 1,
  },

  {
    name: 'GLASS_BLUE',
    id: 54,
    layer: 1,
  },

  {
    name: 'GLASS_PURPLE',
    id: 53,
    layer: 1,
  },

  {
    name: 'GLASS_MAGENTA',
    id: 52,
    layer: 1,
  },

  {
    name: 'MINERALS_RED',
    id: 70,
    layer: 1,
  },

  {
    name: 'MINERALS_ORANGE',
    id: 76,
    layer: 1,
  },

  {
    name: 'MINERALS_YELLOW',
    id: 75,
    layer: 1,
  },

  {
    name: 'MINERALS_GREEN',
    id: 74,
    layer: 1,
  },

  {
    name: 'MINERALS_CYAN',
    id: 73,
    layer: 1,
  },

  {
    name: 'MINERALS_BLUE',
    id: 72,
    layer: 1,
  },

  {
    name: 'MINERALS_MAGENTA',
    id: 71,
    layer: 1,
  },

  {
    name: 'FACTORY_CRATE_METAL',
    id: 45,
    layer: 1,
  },

  {
    name: 'FACTORY_CRATE_WOOD',
    id: 48,
    layer: 1,
  },

  {
    name: 'FACTORY_STONE',
    id: 46,
    layer: 1,
  },

  {
    name: 'FACTORY_WOOD',
    id: 47,
    layer: 1,
  },

  {
    name: 'FACTORY_SCALES',
    id: 49,
    layer: 1,
  },

  {
    name: 'MEADOW_GRASS_LEFT',
    id: 233,
    layer: 1,
  },

  {
    name: 'MEADOW_GRASS_MIDDLE',
    id: 234,
    layer: 1,
  },

  {
    name: 'MEADOW_GRASS_RIGHT',
    id: 235,
    layer: 1,
  },

  {
    name: 'MEADOW_BUSH_LEFT',
    id: 236,
    layer: 1,
  },

  {
    name: 'MEADOW_BUSH_MIDDLE',
    id: 237,
    layer: 1,
  },

  {
    name: 'MEADOW_BUSH_RIGHT',
    id: 238,
    layer: 1,
  },

  {
    name: 'MEADOW_YELLOW_FLOWER',
    id: 239,
    layer: 1,
  },

  {
    name: 'MEADOW_SMALL_BUSH',
    id: 240,
    layer: 1,
  },

  {
    name: 'EASTER_EGG_BLUE',
    id: 256,
    layer: 1,
  },

  {
    name: 'EASTER_EGG_PINK',
    id: 257,
    layer: 1,
  },

  {
    name: 'EASTER_EGG_YELLOW',
    id: 258,
    layer: 1,
  },

  {
    name: 'EASTER_EGG_RED',
    id: 259,
    layer: 1,
  },

  {
    name: 'EASTER_EGG_GREEN',
    id: 260,
    layer: 1,
  },

  {
    name: 'CANDY_PINK',
    id: 60,
    layer: 1,
  },

  {
    name: 'CANDY_BLUE',
    id: 1168,
    layer: 1,
  },

  {
    name: 'CANDY_ONEWAY_PINK_TOP',
    id: 61,
    layer: 1,
  },

  {
    name: 'CANDY_ONEWAY_RED_TOP',
    id: 62,
    layer: 1,
  },

  {
    name: 'CANDY_ONEWAY_CYAN_TOP',
    id: 63,
    layer: 1,
  },

  {
    name: 'CANDY_ONEWAY_GREEN_TOP',
    id: 64,
    layer: 1,
  },

  {
    name: 'CANDY_CANE',
    id: 65,
    layer: 1,
  },

  {
    name: 'CANDY_LICORICE',
    id: 66,
    layer: 1,
  },

  {
    name: 'CANDY_CHOCOLATE',
    id: 67,
    layer: 1,
  },

  {
    name: 'CANDY_CREAM_SMALL',
    id: 227,
    layer: 1,
  },

  {
    name: 'CANDY_CREAM_LARGE',
    id: 431,
    layer: 1,
  },

  {
    name: 'CANDY_GUMDROP_RED',
    id: 432,
    layer: 1,
  },

  {
    name: 'CANDY_GUMDROP_GREEN',
    id: 433,
    layer: 1,
  },

  {
    name: 'CANDY_GUMDROP_PINK',
    id: 434,
    layer: 1,
  },

  {
    name: 'CANDY_PINK_BG',
    id: 539,
    layer: 0,
  },

  {
    name: 'CANDY_BLUE_BG',
    id: 540,
    layer: 0,
  },

  {
    name: 'BEACH_SAND',
    id: 59,
    layer: 1,
  },

  {
    name: 'BEACH_PARASOL',
    id: 228,
    layer: 1,
  },

  {
    name: 'BEACH_SAND_DRIFT_BOTTOM_LEFT',
    id: 230,
    layer: 1,
  },

  {
    name: 'BEACH_SAND_DRIFT_BOTTOM_RIGHT',
    id: 229,
    layer: 1,
  },

  {
    name: 'BEACH_ROCK',
    id: 231,
    layer: 1,
  },

  {
    name: 'BEACH_DRY_BUSH',
    id: 232,
    layer: 1,
  },

  {
    name: 'SUMMER_BEACH',
    id: 307,
    layer: 1,
  },

  {
    name: 'SUMMER_PAIL',
    id: 308,
    layer: 1,
  },

  {
    name: 'SUMMER_SHOVEL',
    id: 309,
    layer: 1,
  },

  {
    name: 'SUMMER_DRINK',
    id: 310,
    layer: 1,
  },

  {
    name: 'BEACH_LIFE_PRESERVER_RING_RED',
    id: 441,
    layer: 1,
  },

  {
    name: 'BEACH_ANCHOR',
    id: 442,
    layer: 1,
  },

  {
    name: 'BEACH_DOCK_ROPE_LEFT',
    id: 443,
    layer: 1,
  },

  {
    name: 'BEACH_DOCK_ROPE_RIGHT',
    id: 444,
    layer: 1,
  },

  {
    name: 'BEACH_TREE_PALM',
    id: 445,
    layer: 1,
  },

  {
    name: 'JUNGLE_FACE_BLOCK',
    id: 193,
    layer: 1,
  },

  {
    name: 'JUNGLE_ONEWAY_TOP',
    id: 194,
    layer: 1,
  },

  {
    name: 'JUNGLE_GRAY',
    id: 195,
    layer: 1,
  },

  {
    name: 'JUNGLE_RED',
    id: 196,
    layer: 1,
  },

  {
    name: 'JUNGLE_BLUE',
    id: 197,
    layer: 1,
  },

  {
    name: 'JUNGLE_OLIVE',
    id: 198,
    layer: 1,
  },

  {
    name: 'JUNGLE_POT',
    id: 199,
    layer: 1,
  },

  {
    name: 'JUNGLE_PLANT',
    id: 357,
    layer: 1,
  },

  {
    name: 'JUNGLE_POT_BROKEN',
    id: 358,
    layer: 1,
  },

  {
    name: 'JUNGLE_STATUE',
    id: 359,
    layer: 1,
  },

  {
    name: 'JUNGLE_GRAY_BG',
    id: 617,
    layer: 0,
  },

  {
    name: 'JUNGLE_RED_BG',
    id: 618,
    layer: 0,
  },

  {
    name: 'JUNGLE_BLUE_BG',
    id: 619,
    layer: 0,
  },

  {
    name: 'JUNGLE_OLIVE_BG',
    id: 620,
    layer: 0,
  },

  {
    name: 'JUNGLE_LEAVES_LIGHT_BG',
    id: 621,
    layer: 0,
  },

  {
    name: 'JUNGLE_LEAVES_MEDIUM_BG',
    id: 622,
    layer: 0,
  },

  {
    name: 'JUNGLE_LEAVES_DARK_BG',
    id: 623,
    layer: 0,
  },

  {
    name: 'ENVIRONMENT_LOG',
    id: 1030,
    layer: 1,
  },

  {
    name: 'ENVIRONMENT_GRASS',
    id: 1031,
    layer: 1,
  },

  {
    name: 'ENVIRONMENT_BAMBOO',
    id: 1032,
    layer: 1,
  },

  {
    name: 'ENVIRONMENT_OBSIDIAN',
    id: 1033,
    layer: 1,
  },

  {
    name: 'ENVIRONMENT_LAVA',
    id: 1034,
    layer: 1,
  },

  {
    name: 'ENVIRONMENT_LOG_BG',
    id: 678,
    layer: 0,
  },

  {
    name: 'ENVIRONMENT_GRASS_BG',
    id: 679,
    layer: 0,
  },

  {
    name: 'ENVIRONMENT_BAMBOO_BG',
    id: 680,
    layer: 0,
  },

  {
    name: 'ENVIRONMENT_OBSIDIAN_BG',
    id: 681,
    layer: 0,
  },

  {
    name: 'ENVIRONMENT_LAVA_BG',
    id: 682,
    layer: 0,
  },

  {
    name: 'WINDOW_CLEAR',
    id: 262,
    layer: 1,
  },

  {
    name: 'WINDOW_RED',
    id: 268,
    layer: 1,
  },

  {
    name: 'WINDOW_ORANGE',
    id: 269,
    layer: 1,
  },

  {
    name: 'WINDOW_YELLOW',
    id: 270,
    layer: 1,
  },

  {
    name: 'WINDOW_GREEN',
    id: 263,
    layer: 1,
  },

  {
    name: 'WINDOW_TEAL',
    id: 264,
    layer: 1,
  },

  {
    name: 'WINDOW_BLUE',
    id: 265,
    layer: 1,
  },

  {
    name: 'WINDOW_PURPLE',
    id: 266,
    layer: 1,
  },

  {
    name: 'WINDOW_PINK',
    id: 267,
    layer: 1,
  },

  {
    name: 'CANVAS_RED',
    id: 1037,
    layer: 1,
  },

  {
    name: 'CANVAS_GREEN',
    id: 1039,
    layer: 1,
  },

  {
    name: 'CANVAS_BLUE',
    id: 1038,
    layer: 1,
  },

  {
    name: 'CANVAS_GRAY_BG',
    id: 538,
    layer: 0,
  },

  {
    name: 'CANVAS_RED_BG',
    id: 671,
    layer: 0,
  },

  {
    name: 'CANVAS_ORANGE_BG',
    id: 533,
    layer: 0,
  },

  {
    name: 'CANVAS_TAN_BG',
    id: 534,
    layer: 0,
  },

  {
    name: 'CANVAS_YELLOW_BG',
    id: 535,
    layer: 0,
  },

  {
    name: 'CANVAS_GREEN_BG',
    id: 536,
    layer: 0,
  },

  {
    name: 'CANVAS_CYAN_BG',
    id: 537,
    layer: 0,
  },

  {
    name: 'CANVAS_BLUE_BG',
    id: 606,
    layer: 0,
  },

  {
    name: 'CANVAS_PURPLE_BG',
    id: 672,
    layer: 0,
  },

  {
    name: 'STONE_GRAY',
    id: 95,
    layer: 1,
  },

  {
    name: 'STONE_GREEN',
    id: 1044,
    layer: 1,
  },

  {
    name: 'STONE_BROWN',
    id: 1045,
    layer: 1,
  },

  {
    name: 'STONE_BLUE',
    id: 1046,
    layer: 1,
  },

  {
    name: 'STONE_GRAY_BG',
    id: 561,
    layer: 0,
  },

  {
    name: 'STONE_HALF_GRAY_BG',
    id: 562,
    layer: 0,
  },

  {
    name: 'STONE_GREEN_BG',
    id: 688,
    layer: 0,
  },

  {
    name: 'STONE_HALF_GREEN_BG',
    id: 689,
    layer: 0,
  },

  {
    name: 'STONE_BROWN_BG',
    id: 690,
    layer: 0,
  },

  {
    name: 'STONE_HALF_BROWN_BG',
    id: 691,
    layer: 0,
  },

  {
    name: 'STONE_BLUE_BG',
    id: 692,
    layer: 0,
  },

  {
    name: 'STONE_HALF_BLUE_BG',
    id: 693,
    layer: 0,
  },

  {
    name: 'GEMSTONE_GREEN',
    id: 1013,
    layer: 1,
  },

  {
    name: 'GEMSTONE_PURPLE',
    id: 1014,
    layer: 1,
  },

  {
    name: 'GEMSTONE_YELLOW',
    id: 1015,
    layer: 1,
  },

  {
    name: 'GEMSTONE_BLUE',
    id: 1016,
    layer: 1,
  },

  {
    name: 'GEMSTONE_RED',
    id: 1017,
    layer: 1,
  },

  {
    name: 'GEMSTONE_CYAN',
    id: 1132,
    layer: 1,
  },

  {
    name: 'GEMSTONE_WHITE',
    id: 1158,
    layer: 1,
  },

  {
    name: 'GEMSTONE_BLACK',
    id: 1169,
    layer: 1,
  },

  {
    name: 'SAND_WHITE',
    id: 137,
    layer: 1,
  },

  {
    name: 'SAND_WHITE_SURFACE',
    id: 301,
    layer: 1,
  },

  {
    name: 'SAND_GRAY',
    id: 138,
    layer: 1,
  },

  {
    name: 'SAND_GRAY_SURFACE',
    id: 302,
    layer: 1,
  },

  {
    name: 'SAND_YELLOW',
    id: 139,
    layer: 1,
  },

  {
    name: 'SAND_YELLOW_SURFACE',
    id: 303,
    layer: 1,
  },

  {
    name: 'SAND_ORANGE',
    id: 140,
    layer: 1,
  },

  {
    name: 'SAND_ORANGE_SURFACE',
    id: 304,
    layer: 1,
  },

  {
    name: 'SAND_BROWN_LIGHT',
    id: 141,
    layer: 1,
  },

  {
    name: 'SAND_BROWN_LIGHT_SURFACE',
    id: 305,
    layer: 1,
  },

  {
    name: 'SAND_BROWN_DARK',
    id: 142,
    layer: 1,
  },

  {
    name: 'SAND_BROWN_DARK_SURFACE',
    id: 306,
    layer: 1,
  },

  {
    name: 'SAND_YELLOW_LIGHT_BG',
    id: 579,
    layer: 0,
  },

  {
    name: 'SAND_GRAY_BG',
    id: 580,
    layer: 0,
  },

  {
    name: 'SAND_YELLOW_DARK_BG',
    id: 581,
    layer: 0,
  },

  {
    name: 'SAND_ORANGE_BG',
    id: 582,
    layer: 0,
  },

  {
    name: 'SAND_BROWN_LIGHT_BG',
    id: 583,
    layer: 0,
  },

  {
    name: 'SAND_BROWN_DARK_BG',
    id: 584,
    layer: 0,
  },

  {
    name: 'FARM_WHEAT',
    id: 386,
    layer: 1,
  },

  {
    name: 'FARM_CORN',
    id: 387,
    layer: 1,
  },

  {
    name: 'FARM_FENCE_LEFT',
    id: 388,
    layer: 1,
  },

  {
    name: 'FARM_FENCE_MIDDLE',
    id: 1531,
    layer: 1,
  },

  {
    name: 'FARM_FENCE_RIGHT',
    id: 389,
    layer: 1,
  },

  {
    name: 'FARM_HAY',
    id: 212,
    layer: 1,
  },

  {
    name: 'CAVE_GRAY_LIGHT_BG',
    id: 788,
    layer: 0,
  },

  {
    name: 'CAVE_GRAY_DARK_BG',
    id: 789,
    layer: 0,
  },

  {
    name: 'CAVE_BLACK_BG',
    id: 790,
    layer: 0,
  },

  {
    name: 'CAVE_RED_BG',
    id: 662,
    layer: 0,
  },

  {
    name: 'CAVE_BROWN_BG',
    id: 660,
    layer: 0,
  },

  {
    name: 'CAVE_YELLOW_BG',
    id: 661,
    layer: 0,
  },

  {
    name: 'CAVE_GREEN_BG',
    id: 659,
    layer: 0,
  },

  {
    name: 'CAVE_CYAN_BG',
    id: 656,
    layer: 0,
  },

  {
    name: 'CAVE_BLUE_BG',
    id: 657,
    layer: 0,
  },

  {
    name: 'CAVE_PURPLE_BG',
    id: 655,
    layer: 0,
  },

  {
    name: 'CAVE_PINK_BG',
    id: 658,
    layer: 0,
  },

  {
    name: 'HALLOWEEN_BLOOD',
    id: 68,
    layer: 1,
  },

  {
    name: 'HALLOWEEN_BRICK_GRAY',
    id: 69,
    layer: 1,
  },

  {
    name: 'HALLOWEEN_GRAY_BG',
    id: 541,
    layer: 0,
  },

  {
    name: 'HALLOWEEN_BRICK_GRAY_BG',
    id: 542,
    layer: 0,
  },

  {
    name: 'HALLOWEEN_BRICK_GRAY_RIGHT_BG',
    id: 543,
    layer: 0,
  },

  {
    name: 'HALLOWEEN_BRICK_GRAY_LEFT_BG',
    id: 544,
    layer: 0,
  },

  {
    name: 'HALLOWEEN_TREE_BG',
    id: 726,
    layer: 0,
  },

  {
    name: 'HALLOWEEN_LEAVES_PURPLE_BG',
    id: 727,
    layer: 0,
  },

  {
    name: 'HALLOWEEN_TOMBSTONE',
    id: 224,
    layer: 1,
  },

  {
    name: 'HALLOWEEN_COBWEB_TOP_LEFT',
    id: 225,
    layer: 1,
  },

  {
    name: 'HALLOWEEN_COBWEB_TOP_RIGHT',
    id: 226,
    layer: 1,
  },

  {
    name: 'HALLOWEEN_TREE_BRANCH_BOTTOM_RIGHT',
    id: 499,
    layer: 1,
  },

  {
    name: 'HALLOWEEN_PUMPKIN_OFF',
    id: 1500,
    layer: 1,
  },

  {
    name: 'HALLOWEEN_GRASS_PURPLE',
    id: 1501,
    layer: 1,
  },

  {
    name: 'HALLOWEEN_EYES_ORANGE',
    id: 1502,
    layer: 1,
  },

  {
    name: 'MARBLE_COLUMN_TOP',
    id: 382,
    layer: 1,
  },

  {
    name: 'MARBLE_COLUMN_MIDDLE',
    id: 383,
    layer: 1,
  },

  {
    name: 'MARBLE_COLUMN_BOTTOM',
    id: 384,
    layer: 1,
  },

  {
    name: 'MARBLE_GRAY',
    id: 208,
    layer: 1,
  },

  {
    name: 'MARBLE_GREEN',
    id: 209,
    layer: 1,
  },

  {
    name: 'MARBLE_RED',
    id: 210,
    layer: 1,
  },

  {
    name: 'MARBLE_ONEWAY',
    id: 211,
    layer: 1,
  },

  {
    name: 'MARBLE_GRAY_BG',
    id: 638,
    layer: 0,
  },

  {
    name: 'MARBLE_GREEN_BG',
    id: 639,
    layer: 0,
  },

  {
    name: 'MARBLE_RED_BG',
    id: 640,
    layer: 0,
  },

  {
    name: 'WILDWEST_ONEWAY_BROWN_TOP',
    id: 122,
    layer: 1,
  },

  {
    name: 'WILDWEST_ONEWAY_RED_TOP',
    id: 123,
    layer: 1,
  },

  {
    name: 'WILDWEST_ONEWAY_BLUE_TOP',
    id: 124,
    layer: 1,
  },

  {
    name: 'WILDWEST_ONEWAY_BROWN_DARK_TOP',
    id: 125,
    layer: 1,
  },

  {
    name: 'WILDWEST_ONEWAY_RED_DARK_TOP',
    id: 126,
    layer: 1,
  },

  {
    name: 'WILDWEST_ONEWAY_BLUE_DARK_TOP',
    id: 127,
    layer: 1,
  },

  {
    name: 'WILDWEST_SIDING_BROWN_LIGHT_BG',
    id: 568,
    layer: 0,
  },

  {
    name: 'WILDWEST_SIDING_BROWN_DARK_BG',
    id: 569,
    layer: 0,
  },

  {
    name: 'WILDWEST_SIDING_RED_LIGHT_BG',
    id: 570,
    layer: 0,
  },

  {
    name: 'WILDWEST_SIDING_RED_DARK_BG',
    id: 571,
    layer: 0,
  },

  {
    name: 'WILDWEST_SIDING_BLUE_LIGHT_BG',
    id: 572,
    layer: 0,
  },

  {
    name: 'WILDWEST_SIDING_BLUE_DARK_BG',
    id: 573,
    layer: 0,
  },

  {
    name: 'WILDWEST_POLE_WHITE_HORIZONTAL',
    id: 1521,
    layer: 1,
  },

  {
    name: 'WILDWEST_POLE_WHITE_VERTICAL',
    id: 285,
    layer: 1,
  },

  {
    name: 'WILDWEST_POLE_GRAY_HORIZONTAL',
    id: 1522,
    layer: 1,
  },

  {
    name: 'WILDWEST_POLE_GRAY_VERTICAL',
    id: 286,
    layer: 1,
  },

  {
    name: 'WILDWEST_DOOR_LEFT_BROWN',
    id: 287,
    layer: 1,
  },

  {
    name: 'WILDWEST_DOOR_LEFT_RED',
    id: 289,
    layer: 1,
  },

  {
    name: 'WILDWEST_DOOR_LEFT_BLUE',
    id: 291,
    layer: 1,
  },

  {
    name: 'WILDWEST_DOOR_RIGHT_BROWN',
    id: 288,
    layer: 1,
  },

  {
    name: 'WILDWEST_DOOR_RIGHT_RED',
    id: 290,
    layer: 1,
  },

  {
    name: 'WILDWEST_DOOR_RIGHT_BLUE',
    id: 292,
    layer: 1,
  },

  {
    name: 'WILDWEST_WINDOW',
    id: 293,
    layer: 1,
  },

  {
    name: 'WILDWEST_FENCE_BROWN_LIGHT',
    id: 294,
    layer: 1,
  },

  {
    name: 'WILDWEST_FENCE_BROWN_DARK',
    id: 295,
    layer: 1,
  },

  {
    name: 'WILDWEST_FENCE_RED_LIGHT',
    id: 296,
    layer: 1,
  },

  {
    name: 'WILDWEST_FENCE_RED_DARK',
    id: 297,
    layer: 1,
  },

  {
    name: 'WILDWEST_FENCE_BLUE_LIGHT',
    id: 298,
    layer: 1,
  },

  {
    name: 'WILDWEST_FENCE_BLUE_DARK',
    id: 299,
    layer: 1,
  },

  {
    name: 'NEON_MAGENTA_BG',
    id: 675,
    layer: 0,
  },

  {
    name: 'NEON_ORANGE_BG',
    id: 673,
    layer: 0,
  },

  {
    name: 'NEON_YELLOW_BG',
    id: 697,
    layer: 0,
  },

  {
    name: 'NEON_GREEN_BG',
    id: 674,
    layer: 0,
  },

  {
    name: 'NEON_CYAN_BG',
    id: 698,
    layer: 0,
  },

  {
    name: 'NEON_BLUE_BG',
    id: 605,
    layer: 0,
  },

  {
    name: 'CLOUD_WHITE_CENTER',
    id: 143,
    layer: 1,
  },

  {
    name: 'CLOUD_WHITE_TOP',
    id: 312,
    layer: 1,
  },

  {
    name: 'CLOUD_WHITE_BOTTOM',
    id: 311,
    layer: 1,
  },

  {
    name: 'CLOUD_WHITE_LEFT',
    id: 314,
    layer: 1,
  },

  {
    name: 'CLOUD_WHITE_RIGHT',
    id: 313,
    layer: 1,
  },

  {
    name: 'CLOUD_WHITE_TOP_RIGHT',
    id: 317,
    layer: 1,
  },

  {
    name: 'CLOUD_WHITE_TOP_LEFT',
    id: 318,
    layer: 1,
  },

  {
    name: 'CLOUD_WHITE_BOTTOM_LEFT',
    id: 315,
    layer: 1,
  },

  {
    name: 'CLOUD_WHITE_BOTTOM_RIGHT',
    id: 316,
    layer: 1,
  },

  {
    name: 'CLOUD_GRAY_CENTER',
    id: 1126,
    layer: 1,
  },

  {
    name: 'CLOUD_GRAY_TOP',
    id: 1524,
    layer: 1,
  },

  {
    name: 'CLOUD_GRAY_BOTTOM',
    id: 1523,
    layer: 1,
  },

  {
    name: 'CLOUD_GRAY_LEFT',
    id: 1526,
    layer: 1,
  },

  {
    name: 'CLOUD_GRAY_RIGHT',
    id: 1525,
    layer: 1,
  },

  {
    name: 'CLOUD_GRAY_TOP_RIGHT',
    id: 1529,
    layer: 1,
  },

  {
    name: 'CLOUD_GRAY_TOP_LEFT',
    id: 1530,
    layer: 1,
  },

  {
    name: 'CLOUD_GRAY_BOTTOM_LEFT',
    id: 1527,
    layer: 1,
  },

  {
    name: 'CLOUD_GRAY_BOTTOM_RIGHT',
    id: 1528,
    layer: 1,
  },

  {
    name: 'FOG_CENTER',
    id: 343,
    layer: 1,
  },

  {
    name: 'FOG_BOTTOM',
    id: 344,
    layer: 1,
  },

  {
    name: 'FOG_LEFT',
    id: 347,
    layer: 1,
  },

  {
    name: 'FOG_TOP_LEFT',
    id: 351,
    layer: 1,
  },

  {
    name: 'FOG_TOP_RIGHT',
    id: 350,
    layer: 1,
  },

  {
    name: 'FOG_RIGHT',
    id: 346,
    layer: 1,
  },

  {
    name: 'FOG_TOP',
    id: 345,
    layer: 1,
  },

  {
    name: 'FOG_BOTTOM_LEFT',
    id: 348,
    layer: 1,
  },

  {
    name: 'FOG_BOTTOM_RIGHT',
    id: 349,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_IRON',
    id: 144,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_WIRES',
    id: 145,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_PLATE_GRAY_PLAIN_BG',
    id: 585,
    layer: 0,
  },

  {
    name: 'INDUSTRIAL_PLATE_GRAY_GRAY_BG',
    id: 586,
    layer: 0,
  },

  {
    name: 'INDUSTRIAL_PLATE_GRAY_BLUE_BG',
    id: 587,
    layer: 0,
  },

  {
    name: 'INDUSTRIAL_PLATE_GRAY_GREEN_BG',
    id: 588,
    layer: 0,
  },

  {
    name: 'INDUSTRIAL_PLATE_GRAY_YELLOW_BG',
    id: 589,
    layer: 0,
  },

  {
    name: 'INDUSTRIAL_ONEWAY_GRAY_TOP',
    id: 146,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_SCAFFOLDING_HORIZONTAL',
    id: 147,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_SCAFFOLDING_VERTICAL',
    id: 1133,
    layer: 1,
  },
  {
    name: 'INDUSTRIAL_PISTON_TOP',
    id: 148,
    layer: 0,
  },
  {
    name: 'INDUSTRIAL_PISTON_BOTTOM',
    id: 1134,
    layer: 0,
  },

  {
    name: 'INDUSTRIAL_PIPE_THICK_HORIZONTAL',
    id: 1127,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_PIPE_THICK_VERTICAL',
    id: 149,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_PIPE_THIN_HORIZONTAL',
    id: 1135,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_CONVEYOR_LEFT',
    id: 150,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_CONVEYOR_MIDDLE_PEG',
    id: 151,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_CONVEYOR_MIDDLE',
    id: 152,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_CONVEYOR_RIGHT',
    id: 153,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_CAUTION_SIGN_FIRE',
    id: 319,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_CAUTION_SIGN_DEATH',
    id: 320,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_CAUTION_SIGN_ELECTRICITY',
    id: 321,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_CAUTION_SIGN_ENTRY',
    id: 322,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_CAUTION_TAPE_HORIZONTAL',
    id: 323,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_CAUTION_TAPE_VERTICAL',
    id: 324,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_PIPE_DECORATION_HORIZONTAL',
    id: 1535,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_LAMP_OVERHEAD',
    id: 352,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_TESLA_COIL',
    id: 353,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_WIRE_HORIZONTAL',
    id: 355,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_WIRE_VERTICAL',
    id: 354,
    layer: 1,
  },

  {
    name: 'INDUSTRIAL_ELECTRICITY',
    id: 356,
    layer: 1,
  },

  {
    name: 'CLAY_TILE_WHITE_BG',
    id: 594,
    layer: 0,
  },

  {
    name: 'CLAY_TILE_BRICK_BG',
    id: 595,
    layer: 0,
  },

  {
    name: 'CLAY_TILE_DIAMOND_BG',
    id: 596,
    layer: 0,
  },

  {
    name: 'CLAY_TILE_X_BG',
    id: 597,
    layer: 0,
  },

  {
    name: 'CLAY_TILE_ROUGH_BG',
    id: 598,
    layer: 0,
  },

  {
    name: 'MEDIEVAL_ONEWAY_GRAY_TOP',
    id: 158,
    layer: 1,
  },

  {
    name: 'MEDIEVAL_BRICK',
    id: 159,
    layer: 1,
  },

  {
    name: 'MEDIEVAL_BRICK_WINDOW',
    id: 160,
    layer: 1,
  },

  {
    name: 'MEDIEVAL_ANVIL',
    id: 162,
    layer: 1,
  },

  {
    name: 'MEDIEVAL_BARREL',
    id: 163,
    layer: 1,
  },

  {
    name: 'MEDIEVAL_BLINDS',
    id: 437,
    layer: 1,
  },

  {
    name: 'MEDIEVAL_BRICK_BG',
    id: 599,
    layer: 0,
  },

  {
    name: 'MEDIEVAL_WOOD_BG',
    id: 600,
    layer: 0,
  },

  {
    name: 'MEDIEVAL_STRAW_BG',
    id: 590,
    layer: 0,
  },

  {
    name: 'MEDIEVAL_ROOF_RED_BG',
    id: 591,
    layer: 0,
  },

  {
    name: 'MEDIEVAL_ROOF_GREEN_BG',
    id: 592,
    layer: 0,
  },

  {
    name: 'MEDIEVAL_ROOF_BROWN_BG',
    id: 556,
    layer: 0,
  },

  {
    name: 'MEDIEVAL_ROOF_GRAY_BG',
    id: 593,
    layer: 0,
  },

  {
    name: 'MEDIEVAL_BRICK_DECORATION_TOP_MIDDLE',
    id: 325,
    layer: 1,
  },

  {
    name: 'MEDIEVAL_STONE',
    id: 326,
    layer: 1,
  },

  {
    name: 'MEDIEVAL_SCAFFOLDING_STRAIGHT_HORIZONTAL',
    id: 440,
    layer: 1,
  },

  {
    name: 'MEDIEVAL_AXE_TOP_RIGHT',
    id: 275,
    layer: 1,
  },

  {
    name: 'MEDIEVAL_SWORD_BOTTOM_RIGHT',
    id: 329,
    layer: 1,
  },

  {
    name: 'MEDIEVAL_SHIELD_CIRCLE_BLUE',
    id: 273,
    layer: 1,
  },

  {
    name: 'MEDIEVAL_SHIELD_CURVED_BLUE',
    id: 328,
    layer: 1,
  },

  {
    name: 'MEDIEVAL_BANNER_BLUE',
    id: 327,
    layer: 1,
  },

  {
    name: 'MEDIEVAL_SHIELD',
    id: 330,
    layer: 1,
  },

  {
    name: 'PIPES_LEFT',
    id: 166,
    layer: 1,
  },

  {
    name: 'PIPES_HORIZONTAL',
    id: 167,
    layer: 1,
  },

  {
    name: 'PIPES_RIGHT',
    id: 168,
    layer: 1,
  },

  {
    name: 'PIPES_UP',
    id: 169,
    layer: 1,
  },

  {
    name: 'PIPES_VERTICAL',
    id: 170,
    layer: 1,
  },

  {
    name: 'PIPES_DOWN',
    id: 171,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_WHITE',
    id: 172,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_BLUE',
    id: 173,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_GREEN',
    id: 174,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_RED',
    id: 175,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_SAND',
    id: 176,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_MOON',
    id: 1029,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_MARS_ROCK_1',
    id: 177,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_MARS_ROCK_2',
    id: 178,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_MARS_ROCK_3',
    id: 179,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_MARS_ROCK_4',
    id: 180,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_MARS_ROCK_5',
    id: 181,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_WHITE_BG',
    id: 601,
    layer: 0,
  },

  {
    name: 'OUTERSPACE_BLUE_BG',
    id: 602,
    layer: 0,
  },

  {
    name: 'OUTERSPACE_GREEN_BG',
    id: 603,
    layer: 0,
  },

  {
    name: 'OUTERSPACE_RED_BG',
    id: 604,
    layer: 0,
  },

  {
    name: 'OUTERSPACE_MARS_ROCK_3_BG',
    id: 699,
    layer: 0,
  },

  {
    name: 'OUTERSPACE_MARS_ROCK_4_BG',
    id: 700,
    layer: 0,
  },

  {
    name: 'OUTERSPACE_MARS_ROCK_5_BG',
    id: 701,
    layer: 0,
  },

  {
    name: 'OUTERSPACE_SIGN_GREEN',
    id: 332,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_LIGHT_RED',
    id: 333,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_LIGHT_BLUE',
    id: 334,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_LIGHT_GREEN',
    id: 1567,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_LIGHT_YELLOW',
    id: 1568,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_LIGHT_MAGENTA',
    id: 1570,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_LIGHT_CYAN',
    id: 1571,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_COMPUTER',
    id: 335,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_STAR_RED',
    id: 428,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_STAR_BLUE',
    id: 429,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_STAR_YELLOW',
    id: 430,
    layer: 1,
  },

  {
    name: 'OUTERSPACE_ROCK_GRAY',
    id: 331,
    layer: 1,
  },

  {
    name: 'GARDEN_ROCK',
    id: 1159,
    layer: 1,
  },

  {
    name: 'GARDEN_GRASS',
    id: 1160,
    layer: 1,
  },

  {
    name: 'GARDEN_LEAVES',
    id: 1161,
    layer: 1,
  },

  {
    name: 'GARDEN_GRASSPLANT',
    id: 1560,
    layer: 1,
  },

  {
    name: 'GARDEN_FENCE',
    id: 1561,
    layer: 1,
  },

  {
    name: 'GARDEN_LATTICE',
    id: 1562,
    layer: 1,
  },

  {
    name: 'GARDEN_ONEWAY_LEAF_BRANCH',
    id: 1162,
    layer: 1,
  },

  {
    name: 'GARDEN_ONEWAY_LEAF_LEFT',
    id: 1163,
    layer: 1,
  },

  {
    name: 'GARDEN_ONEWAY_LEAF_RIGHT',
    id: 1164,
    layer: 1,
  },

  {
    name: 'GARDEN_SNAIL',
    id: 1563,
    layer: 1,
  },

  {
    name: 'GARDEN_BUTTERFLY',
    id: 1564,
    layer: 1,
  },

  {
    name: 'GARDEN_ROCK_BG',
    id: 773,
    layer: 0,
  },

  {
    name: 'GARDEN_GRASS_BG',
    id: 774,
    layer: 0,
  },

  {
    name: 'GARDEN_LEAVES_BG',
    id: 775,
    layer: 0,
  },

  {
    name: 'GARDEN_FRAME',
    id: 1565,
    layer: 1,
  },

  {
    name: 'DOMESTIC_TILE',
    id: 1035,
    layer: 1,
  },

  {
    name: 'DOMESTIC_WOOD',
    id: 1036,
    layer: 1,
  },

  {
    name: 'DOMESTIC_WOOD_PANEL',
    id: 1040,
    layer: 1,
  },

  {
    name: 'DOMESTIC_WALLPAPER_YELLOW_BG',
    id: 683,
    layer: 0,
  },

  {
    name: 'DOMESTIC_WALLPAPER_BROWN_BG',
    id: 684,
    layer: 0,
  },

  {
    name: 'DOMESTIC_WALLPAPER_RED_BG',
    id: 685,
    layer: 0,
  },

  {
    name: 'DOMESTIC_WALLPAPER_BLUE_BG',
    id: 686,
    layer: 0,
  },

  {
    name: 'DOMESTIC_WALLPAPER_GREEN_BG',
    id: 687,
    layer: 0,
  },

  {
    name: 'DOMESTIC_LAMP',
    id: 446,
    layer: 1,
  },

  {
    name: 'DOMESTIC_LIGHT_BULB_TOP_ON',
    id: 447,
    layer: 1,
  },

  {
    name: 'DOMESTIC_BOTTOM_RIGHT',
    id: 448,
    layer: 1,
  },

  {
    name: 'DOMESTIC_PIPE_T_BOTTOM',
    id: 1537,
    layer: 1,
  },

  {
    name: 'DOMESTIC_PIPE_STRAIGHT_HORIZONTAL',
    id: 1536,
    layer: 1,
  },

  {
    name: 'DOMESTIC_PIPE_CROSS',
    id: 1539,
    layer: 1,
  },

  {
    name: 'DOMESTIC_PAINTING_BLUE',
    id: 449,
    layer: 1,
  },

  {
    name: 'DOMESTIC_VASE_YELLOW',
    id: 450,
    layer: 1,
  },

  {
    name: 'DOMESTIC_TELEVISION_BLACK',
    id: 451,
    layer: 1,
  },

  {
    name: 'DOMESTIC_WINDOW_BLACK',
    id: 452,
    layer: 1,
  },

  {
    name: 'DOMESTIC_HALF_YELLOW_BOTTOM',
    id: 1041,
    layer: 1,
  },

  {
    name: 'DOMESTIC_HALF_BROWN_BOTTOM',
    id: 1042,
    layer: 1,
  },

  {
    name: 'DOMESTIC_HALF_WHITE_BOTTOM',
    id: 1043,
    layer: 1,
  },

  {
    name: 'DOMESTIC_FRAME_BORDER_FULL',
    id: 1538,
    layer: 1,
  },

  {
    name: 'DOJO_ONEWAY_WHITE_TOP',
    id: 96,
    layer: 1,
  },

  {
    name: 'DOJO_ONEWAY_GRAY_TOP',
    id: 97,
    layer: 1,
  },

  {
    name: 'DOJO_WALLPAPER_WHITE_BG',
    id: 564,
    layer: 0,
  },

  {
    name: 'DOJO_WALLPAPER_GRAY_BG',
    id: 565,
    layer: 0,
  },

  {
    name: 'DOJO_SHINGLES_RED_BG',
    id: 667,
    layer: 0,
  },

  {
    name: 'DOJO_SHINGLES_GREEN_BG',
    id: 669,
    layer: 0,
  },

  {
    name: 'DOJO_SHINGLES_BLUE_BG',
    id: 566,
    layer: 0,
  },

  {
    name: 'DOJO_SHINGLES_RED_DARK_BG',
    id: 668,
    layer: 0,
  },

  {
    name: 'DOJO_SHINGLES_GREEN_DARK_BG',
    id: 670,
    layer: 0,
  },

  {
    name: 'DOJO_SHINGLES_BLUE_DARK_BG',
    id: 567,
    layer: 0,
  },

  {
    name: 'DOJO_ROOFTOP_BLUE_LEFT',
    id: 276,
    layer: 1,
  },

  {
    name: 'DOJO_ROOFTOP_BLUE_RIGHT',
    id: 277,
    layer: 1,
  },

  {
    name: 'DOJO_ROOFTOP_BLUE_DARK_LEFT',
    id: 279,
    layer: 1,
  },

  {
    name: 'DOJO_ROOFTOP_BLUE_DARK_RIGHT',
    id: 280,
    layer: 1,
  },

  {
    name: 'DOJO_WINDOW_BRIGHT',
    id: 278,
    layer: 1,
  },

  {
    name: 'DOJO_WINDOW_DARK',
    id: 281,
    layer: 1,
  },

  {
    name: 'DOJO_CHINESE_CHARACTER_AND',
    id: 282,
    layer: 1,
  },

  {
    name: 'DOJO_CHINESE_CHARACTER_BOOK',
    id: 283,
    layer: 1,
  },

  {
    name: 'DOJO_CHINESE_SYMBOL_YIN_YANG',
    id: 284,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_TREE_LIGHTS',
    id: 252,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_TREE_PLAIN',
    id: 251,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_FENCE_SNOW',
    id: 253,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_FENCE_PLAIN',
    id: 254,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_ORNAMENT_RED',
    id: 218,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_ORNAMENT_GREEN',
    id: 219,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_ORNAMENT_BLUE',
    id: 220,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_WREATH',
    id: 221,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_STAR',
    id: 222,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_WRAPPING_PAPER_YELLOW_BG',
    id: 624,
    layer: 0,
  },

  {
    name: 'CHRISTMAS_WRAPPING_PAPER_GREEN_BG',
    id: 625,
    layer: 0,
  },

  {
    name: 'CHRISTMAS_WRAPPING_PAPER_BLUE_BG',
    id: 626,
    layer: 0,
  },

  {
    name: 'CHRISTMAS_RIBBON_BLUE_VERTICAL',
    id: 362,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_RIBBON_BLUE_HORIZONTAL',
    id: 363,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_RIBBON_BLUE_CROSS',
    id: 364,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_RIBBON_PURPLE_VERTICAL',
    id: 365,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_RIBBON_PURPLE_HORIZONTAL',
    id: 366,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_RIBBON_PURPLE_CROSS',
    id: 367,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_CANDY_CANE',
    id: 401,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_MISTLETOE',
    id: 402,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_STOCKING',
    id: 403,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_RIBBON_RED_BOW',
    id: 404,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_GIFT_FULL_RED',
    id: 80,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_GIFT_HALF_RED',
    id: 1101,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_GIFT_FULL_GREEN',
    id: 82,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_GIFT_HALF_GREEN',
    id: 1102,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_GIFT_FULL_WHITE',
    id: 79,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_GIFT_HALF_WHITE',
    id: 1103,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_GIFT_FULL_BLUE',
    id: 81,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_GIFT_HALF_BLUE',
    id: 1104,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_GIFT_FULL_YELLOW',
    id: 78,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_GIFT_HALF_YELLOW',
    id: 1105,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_STRING_LIGHT_TOP_RED',
    id: 1506,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_STRING_LIGHT_BOTTOM_RED',
    id: 1507,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_BELL_YELLOW',
    id: 1508,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_BELL_GROUP_RED',
    id: 1509,
    layer: 1,
  },

  {
    name: 'CHRISTMAS_CANDLE_RED',
    id: 1510,
    layer: 1,
  },

  {
    name: 'SCIFI_PANEL_RED',
    id: 84,
    layer: 1,
  },

  {
    name: 'SCIFI_PANEL_BLUE',
    id: 85,
    layer: 1,
  },

  {
    name: 'SCIFI_PANEL_GREEN',
    id: 1166,
    layer: 1,
  },

  {
    name: 'SCIFI_PANEL_YELLOW',
    id: 1167,
    layer: 1,
  },

  {
    name: 'SCIFI_PANEL_MAGENTA',
    id: 1173,
    layer: 1,
  },

  {
    name: 'SCIFI_PANEL_CYAN',
    id: 1174,
    layer: 1,
  },

  {
    name: 'SCIFI_METAL_GRAY',
    id: 86,
    layer: 1,
  },

  {
    name: 'SCIFI_METAL_WHITE',
    id: 87,
    layer: 1,
  },

  {
    name: 'SCIFI_BROWN_LEOPARD',
    id: 88,
    layer: 1,
  },

  {
    name: 'SCIFI_ONEWAY_RED_TOP',
    id: 89,
    layer: 1,
  },

  {
    name: 'SCIFI_ONEWAY_BLUE_TOP',
    id: 90,
    layer: 1,
  },

  {
    name: 'SCIFI_ONEWAY_GREEN_TOP',
    id: 91,
    layer: 1,
  },

  {
    name: 'SCIFI_ONEWAY_YELLOW_TOP',
    id: 1051,
    layer: 1,
  },

  {
    name: 'SCIFI_ONEWAY_MAGENTA_TOP',
    id: 1175,
    layer: 1,
  },

  {
    name: 'SCIFI_ONEWAY_CYAN_TOP',
    id: 1176,
    layer: 1,
  },

  {
    name: 'SCIFI_LASER_BLUE_STRAIGHT_HORIZONTAL',
    id: 376,
    layer: 1,
  },

  {
    name: 'SCIFI_LASER_BLUE_CORNER_BOTTOMRIGHT',
    id: 375,
    layer: 1,
  },

  {
    name: 'SCIFI_LASER_GREEN_STRAIGHT_HORIZONTAL',
    id: 380,
    layer: 1,
  },

  {
    name: 'SCIFI_LASER_GREEN_CORNER_BOTTOMRIGHT',
    id: 379,
    layer: 1,
  },

  {
    name: 'SCIFI_LASER_ORANGE_STRAIGHT_HORIZONTAL',
    id: 378,
    layer: 1,
  },

  {
    name: 'SCIFI_LASER_ORANGE_CORNER_BOTTOMRIGHT',
    id: 377,
    layer: 1,
  },

  {
    name: 'SCIFI_LASER_RED_STRAIGHT_HORIZONTAL',
    id: 439,
    layer: 1,
  },

  {
    name: 'SCIFI_LASER_RED_CORNER_BOTTOMRIGHT',
    id: 438,
    layer: 1,
  },

  {
    name: 'SCIFI_OUTLINE_GRAY_BG',
    id: 637,
    layer: 0,
  },

  {
    name: 'PRISON_BARS',
    id: 261,
    layer: 1,
  },

  {
    name: 'PRISON_BRICK',
    id: 92,
    layer: 1,
  },

  {
    name: 'PRISON_BRICK_BG',
    id: 550,
    layer: 0,
  },

  {
    name: 'PRISON_WINDOW_ORANGE_BG',
    id: 551,
    layer: 0,
  },

  {
    name: 'PRISON_WINDOW_BLUE_BG',
    id: 552,
    layer: 0,
  },

  {
    name: 'PRISON_WINDOW_BLACK_BG',
    id: 553,
    layer: 0,
  },

  {
    name: 'PIRATE_WOOD_PLANK_BROWN',
    id: 93,
    layer: 1,
  },

  {
    name: 'PIRATE_CHEST_BROWN',
    id: 94,
    layer: 1,
  },

  {
    name: 'PIRATE_ONEWAY_BROWN_TOP',
    id: 154,
    layer: 1,
  },

  {
    name: 'PIRATE_SHIP_BORDER_BROWN',
    id: 271,
    layer: 1,
  },

  {
    name: 'PIRATE_SKELETON_HEAD',
    id: 272,
    layer: 1,
  },

  {
    name: 'PIRATE_CANNON',
    id: 435,
    layer: 1,
  },

  {
    name: 'PIRATE_PORT_WINDOW',
    id: 436,
    layer: 1,
  },

  {
    name: 'PIRATE_GOLD_BAG',
    id: 1591,
    layer: 1,
  },

  {
    name: 'PIRATE_WOOD_PLANK_LIGHT_BROWN_BG',
    id: 555,
    layer: 0,
  },

  {
    name: 'PIRATE_WOOD_PLANK_BROWN_BG',
    id: 554,
    layer: 0,
  },

  {
    name: 'PIRATE_WOOD_PLANK_DARK_BROWN_BG',
    id: 559,
    layer: 0,
  },

  {
    name: 'PIRATE_SKELETON_FLAG_BG',
    id: 560,
    layer: 0,
  },

  {
    name: 'PLASTIC_RED',
    id: 129,
    layer: 1,
  },

  {
    name: 'PLASTIC_ORANGE',
    id: 135,
    layer: 1,
  },

  {
    name: 'PLASTIC_YELLOW',
    id: 130,
    layer: 1,
  },

  {
    name: 'PLASTIC_LIME',
    id: 128,
    layer: 1,
  },

  {
    name: 'PLASTIC_GREEN',
    id: 134,
    layer: 1,
  },

  {
    name: 'PLASTIC_CYAN',
    id: 131,
    layer: 1,
  },

  {
    name: 'PLASTIC_BLUE',
    id: 132,
    layer: 1,
  },

  {
    name: 'PLASTIC_MAGENTA',
    id: 133,
    layer: 1,
  },

  {
    name: 'LAVA_YELLOW',
    id: 202,
    layer: 1,
  },

  {
    name: 'LAVA_ORANGE',
    id: 203,
    layer: 1,
  },

  {
    name: 'LAVA_DARK_ORANGE',
    id: 204,
    layer: 1,
  },

  {
    name: 'LAVA_YELLOW_BG',
    id: 627,
    layer: 0,
  },

  {
    name: 'LAVA_ORANGE_BG',
    id: 628,
    layer: 0,
  },

  {
    name: 'LAVA_DARK_RED_BG',
    id: 629,
    layer: 0,
  },

  {
    name: 'GILDED_GOLD_BASIC',
    id: 1065,
    layer: 1,
  },

  {
    name: 'GILDED_GOLD_BRICK',
    id: 1066,
    layer: 1,
  },

  {
    name: 'GILDED_GOLD_CHISELED',
    id: 1067,
    layer: 1,
  },

  {
    name: 'GILDED_GOLD_TILE',
    id: 1068,
    layer: 1,
  },

  {
    name: 'GILDED_GOLD_MANTLE_ONEWAY_TOP',
    id: 1069,
    layer: 1,
  },

  {
    name: 'GILDED_GOLD_BASIC_BG',
    id: 709,
    layer: 0,
  },

  {
    name: 'GILDED_GOLD_BRICK_BG',
    id: 710,
    layer: 0,
  },

  {
    name: 'GILDED_GOLD_CHISELED_BG',
    id: 711,
    layer: 0,
  },

  {
    name: 'CONSTRUCTION_PLYWOOD',
    id: 1096,
    layer: 1,
  },

  {
    name: 'CONSTRUCTION_GRAVEL',
    id: 1097,
    layer: 1,
  },

  {
    name: 'CONSTRUCTION_CEMENT',
    id: 1098,
    layer: 1,
  },

  {
    name: 'CONSTRUCTION_BEAM_RED_HORIZONTAL_LEFT',
    id: 1099,
    layer: 1,
  },

  {
    name: 'CONSTRUCTION_BEAM_RED_HORIZONTAL_MIDDLE',
    id: 1130,
    layer: 1,
  },

  {
    name: 'CONSTRUCTION_BEAM_RED_HORIZONTAL_RIGHT',
    id: 1128,
    layer: 1,
  },

  {
    name: 'CONSTRUCTION_BEAM_RED_VERTICAL_TOP',
    id: 1129,
    layer: 1,
  },

  {
    name: 'CONSTRUCTION_BEAM_RED_VERTICAL_MIDDLE',
    id: 1131,
    layer: 1,
  },

  {
    name: 'CONSTRUCTION_BEAM_RED_VERTICAL_BOTTOM',
    id: 1100,
    layer: 1,
  },

  {
    name: 'CONSTRUCTION_CAUTION_ORANGE',
    id: 1503,
    layer: 1,
  },

  {
    name: 'CONSTRUCTION_CONE_ORANGE',
    id: 1504,
    layer: 1,
  },

  {
    name: 'CONSTRUCTION_SIGN_WARNING',
    id: 1505,
    layer: 1,
  },

  {
    name: 'CONSTRUCTION_SIGN_STOP',
    id: 1532,
    layer: 1,
  },

  {
    name: 'CONSTRUCTION_HYDRANT_FIRE',
    id: 1533,
    layer: 1,
  },

  {
    name: 'CONSTRUCTION_PLYWOOD_BG',
    id: 728,
    layer: 0,
  },

  {
    name: 'CONSTRUCTION_GRAVEL_BG',
    id: 729,
    layer: 0,
  },

  {
    name: 'CONSTRUCTION_CEMENT_BG',
    id: 730,
    layer: 0,
  },

  {
    name: 'CONSTRUCTION_BEAM_RED_HORIZONTAL_LEFT_BG',
    id: 731,
    layer: 0,
  },

  {
    name: 'CONSTRUCTION_BEAM_RED_HORIZONTAL_MIDDLE_BG',
    id: 755,
    layer: 0,
  },

  {
    name: 'CONSTRUCTION_BEAM_RED_HORIZONTAL_RIGHT_BG',
    id: 753,
    layer: 0,
  },

  {
    name: 'CONSTRUCTION_BEAM_RED_VERTICAL_TOP_BG',
    id: 754,
    layer: 0,
  },

  {
    name: 'CONSTRUCTION_BEAM_RED_VERTICAL_MIDDLE_BG',
    id: 756,
    layer: 0,
  },

  {
    name: 'CONSTRUCTION_BEAM_RED_VERTICAL_BOTTOM_BG',
    id: 732,
    layer: 0,
  },

  {
    name: 'TILES_WHITE',
    id: 1106,
    layer: 1,
  },

  {
    name: 'TILES_GRAY',
    id: 1107,
    layer: 1,
  },

  {
    name: 'TILES_BLACK',
    id: 1108,
    layer: 1,
  },

  {
    name: 'TILES_RED',
    id: 1109,
    layer: 1,
  },

  {
    name: 'TILES_ORANGE',
    id: 1110,
    layer: 1,
  },

  {
    name: 'TILES_YELLOW',
    id: 1111,
    layer: 1,
  },

  {
    name: 'TILES_GREEN',
    id: 1112,
    layer: 1,
  },

  {
    name: 'TILES_CYAN',
    id: 1113,
    layer: 1,
  },

  {
    name: 'TILES_BLUE',
    id: 1114,
    layer: 1,
  },

  {
    name: 'TILES_PURPLE',
    id: 1115,
    layer: 1,
  },

  {
    name: 'TILES_WHITE_BG',
    id: 733,
    layer: 0,
  },

  {
    name: 'TILES_GRAY_BG',
    id: 734,
    layer: 0,
  },

  {
    name: 'TILES_BLACK_BG',
    id: 735,
    layer: 0,
  },

  {
    name: 'TILES_RED_BG',
    id: 736,
    layer: 0,
  },

  {
    name: 'TILES_ORANGE_BG',
    id: 737,
    layer: 0,
  },

  {
    name: 'TILES_YELLOW_BG',
    id: 738,
    layer: 0,
  },

  {
    name: 'TILES_GREEN_BG',
    id: 739,
    layer: 0,
  },

  {
    name: 'TILES_CYAN_BG',
    id: 740,
    layer: 0,
  },

  {
    name: 'TILES_BLUE_BG',
    id: 741,
    layer: 0,
  },

  {
    name: 'TILES_PURPLE_BG',
    id: 742,
    layer: 0,
  },

  {
    name: 'HALFBLOCKS_WHITE_BOTTOM',
    id: 1116,
    layer: 1,
  },

  {
    name: 'HALFBLOCKS_GRAY_BOTTOM',
    id: 1117,
    layer: 1,
  },

  {
    name: 'HALFBLOCKS_BLACK_BOTTOM',
    id: 1118,
    layer: 1,
  },

  {
    name: 'HALFBLOCKS_RED_BOTTOM',
    id: 1119,
    layer: 1,
  },

  {
    name: 'HALFBLOCKS_ORANGE_BOTTOM',
    id: 1120,
    layer: 1,
  },

  {
    name: 'HALFBLOCKS_YELLOW_BOTTOM',
    id: 1121,
    layer: 1,
  },

  {
    name: 'HALFBLOCKS_GREEN_BOTTOM',
    id: 1122,
    layer: 1,
  },

  {
    name: 'HALFBLOCKS_CYAN_BOTTOM',
    id: 1123,
    layer: 1,
  },

  {
    name: 'HALFBLOCKS_BLUE_BOTTOM',
    id: 1124,
    layer: 1,
  },

  {
    name: 'HALFBLOCKS_MAGENTA_BOTTOM',
    id: 1125,
    layer: 1,
  },

  {
    name: 'WINTER_ICE_BRICK',
    id: 1136,
    layer: 1,
  },

  {
    name: 'WINTER_SNOW',
    id: 1137,
    layer: 1,
  },

  {
    name: 'WINTER_GLACIER',
    id: 1138,
    layer: 1,
  },

  {
    name: 'WINTER_SLATE',
    id: 1139,
    layer: 1,
  },

  {
    name: 'WINTER_ICE',
    id: 215,
    layer: 1,
  },

  {
    name: 'WINTER_ONEWAY_ICE',
    id: 216,
    layer: 1,
  },

  {
    name: 'WINTER_ICE_LIGHT',
    id: 1060,
    layer: 1,
  },

  {
    name: 'WINTER_ICE_DARK',
    id: 1059,
    layer: 1,
  },

  {
    name: 'WINTER_ICE_DARK_LEFT',
    id: 1061,
    layer: 1,
  },

  {
    name: 'WINTER_ICE_DARK_MIDDLE',
    id: 1062,
    layer: 1,
  },

  {
    name: 'WINTER_ICE_DARK_RIGHT',
    id: 1063,
    layer: 1,
  },

  {
    name: 'WINTER_HALF_SNOW_BOTTOM',
    id: 1140,
    layer: 1,
  },

  {
    name: 'WINTER_HALF_ICE_BOTTOM',
    id: 1141,
    layer: 1,
  },

  {
    name: 'WINTER_ICE_SLIPPERY',
    id: 1064,
    layer: 1,
  },

  {
    name: 'WINTER_SNOW_PILE',
    id: 1543,
    layer: 1,
  },

  {
    name: 'WINTER_ICE_DRIFT_BOTTOM_LEFT',
    id: 250,
    layer: 1,
  },

  {
    name: 'WINTER_ICE_DRIFT_BOTTOM_RIGHT',
    id: 249,
    layer: 1,
  },

  {
    name: 'WINTER_SNOW_DRIFT_BOTTOM_LEFT',
    id: 1545,
    layer: 1,
  },

  {
    name: 'WINTER_SNOW_DRIFT_BOTTOM_RIGHT',
    id: 1544,
    layer: 1,
  },

  {
    name: 'WINTER_SNOW_FLUFF_LEFT',
    id: 398,
    layer: 1,
  },

  {
    name: 'WINTER_SNOW_FLUFF_MIDDLE',
    id: 399,
    layer: 1,
  },

  {
    name: 'WINTER_SNOW_FLUFF_RIGHT',
    id: 400,
    layer: 1,
  },

  {
    name: 'WINTER_SNOWMAN',
    id: 1546,
    layer: 1,
  },

  {
    name: 'WINTER_TREE',
    id: 1547,
    layer: 1,
  },

  {
    name: 'WINTER_SNOWFLAKE_LARGE',
    id: 1548,
    layer: 1,
  },

  {
    name: 'WINTER_SNOWFLAKE_SMALL',
    id: 1549,
    layer: 1,
  },

  {
    name: 'WINTER_ICE_DARK_BG',
    id: 702,
    layer: 0,
  },

  {
    name: 'WINTER_ICE_LIGHT_BG',
    id: 703,
    layer: 0,
  },

  {
    name: 'WINTER_ICE_BRICK_BG',
    id: 757,
    layer: 0,
  },

  {
    name: 'WINTER_SNOW_BG',
    id: 758,
    layer: 0,
  },

  {
    name: 'WINTER_GLACIER_BG',
    id: 759,
    layer: 0,
  },

  {
    name: 'WINTER_SLATE_BG',
    id: 760,
    layer: 0,
  },

  {
    name: 'FAIRYTALE_PEBBLES',
    id: 1070,
    layer: 1,
  },

  {
    name: 'FAIRYTALE_TREE_ORANGE',
    id: 1071,
    layer: 1,
  },

  {
    name: 'FAIRYTALE_MOSS_GREEN',
    id: 1072,
    layer: 1,
  },

  {
    name: 'FAIRYTALE_CLOUD_BLUE',
    id: 1073,
    layer: 1,
  },

  {
    name: 'FAIRYTALE_MUSHROOM_BLOCK_RED',
    id: 1074,
    layer: 1,
  },

  {
    name: 'FAIRYTALE_VINE_GREEN',
    id: 468,
    layer: 1,
  },

  {
    name: 'FAIRYTALE_MUSHROOM_DECORATION_ORANGE',
    id: 469,
    layer: 1,
  },

  {
    name: 'FAIRYTALE_MUSHROOM_DECORATION_RED',
    id: 1569,
    layer: 1,
  },

  {
    name: 'FAIRYTALE_DEW_DROP',
    id: 470,
    layer: 1,
  },

  {
    name: 'FAIRYTALE_MIST_ORANGE_BG',
    id: 704,
    layer: 0,
  },

  {
    name: 'FAIRYTALE_MIST_GREEN_BG',
    id: 705,
    layer: 0,
  },

  {
    name: 'FAIRYTALE_MIST_BLUE_BG',
    id: 706,
    layer: 0,
  },

  {
    name: 'FAIRYTALE_MIST_PINK_BG',
    id: 707,
    layer: 0,
  },

  {
    name: 'FAIRYTALE_HALF_ORANGE_BOTTOM',
    id: 1075,
    layer: 1,
  },

  {
    name: 'FAIRYTALE_HALF_GREEN_BOTTOM',
    id: 1076,
    layer: 1,
  },

  {
    name: 'FAIRYTALE_HALF_BLUE_BOTTOM',
    id: 1077,
    layer: 1,
  },

  {
    name: 'FAIRYTALE_HALF_PINK_BOTTOM',
    id: 1078,
    layer: 1,
  },

  {
    name: 'FAIRYTALE_FLOWER_BLUE',
    id: 471,
    layer: 1,
  },

  {
    name: 'SPRING_DIRT_BROWN',
    id: 1081,
    layer: 1,
  },

  {
    name: 'SPRING_HEDGE_GREEN',
    id: 1082,
    layer: 1,
  },

  {
    name: 'SPRING_DIRT_DRIFT_BOTTOM_LEFT',
    id: 474,
    layer: 1,
  },

  {
    name: 'SPRING_DIRT_DRIFT_BOTTOM_RIGHT',
    id: 473,
    layer: 1,
  },

  {
    name: 'SPRING_DAISY_WHITE',
    id: 475,
    layer: 1,
  },

  {
    name: 'SPRING_TULIP_RED',
    id: 476,
    layer: 1,
  },

  {
    name: 'SPRING_DAFFODIL_YELLOW',
    id: 477,
    layer: 1,
  },

  {
    name: 'ONEWAY_WHITE_TOP',
    id: 1092,
    layer: 1,
  },

  {
    name: 'ONEWAY_GRAY_TOP',
    id: 1052,
    layer: 1,
  },

  {
    name: 'ONEWAY_BLACK_TOP',
    id: 1056,
    layer: 1,
  },

  {
    name: 'ONEWAY_RED_TOP',
    id: 1054,
    layer: 1,
  },

  {
    name: 'ONEWAY_ORANGE_TOP',
    id: 1002,
    layer: 1,
  },

  {
    name: 'ONEWAY_YELLOW_TOP',
    id: 1003,
    layer: 1,
  },

  {
    name: 'ONEWAY_GREEN_TOP',
    id: 1055,
    layer: 1,
  },

  {
    name: 'ONEWAY_CYAN_TOP',
    id: 1001,
    layer: 1,
  },

  {
    name: 'ONEWAY_BLUE_TOP',
    id: 1053,
    layer: 1,
  },

  {
    name: 'ONEWAY_MAGENTA_TOP',
    id: 1004,
    layer: 1,
  },

  {
    name: 'DUNGEON_COBBLESTONE_GREY',
    id: 1196,
    layer: 1,
  },

  {
    name: 'DUNGEON_COBBLESTONE_GREEN',
    id: 1197,
    layer: 1,
  },

  {
    name: 'DUNGEON_COBBLESTONE_BLUE',
    id: 1198,
    layer: 1,
  },

  {
    name: 'DUNGEON_COBBLESTONE_PURPLE',
    id: 1199,
    layer: 1,
  },

  {
    name: 'DUNGEON_COBBLESTONE_GREY_BG',
    id: 808,
    layer: 0,
  },

  {
    name: 'DUNGEON_COBBLESTONE_GREEN_BG',
    id: 809,
    layer: 0,
  },

  {
    name: 'DUNGEON_COBBLESTONE_BLUE_BG',
    id: 810,
    layer: 0,
  },

  {
    name: 'DUNGEON_COBBLESTONE_PURPLE_BG',
    id: 811,
    layer: 0,
  },

  {
    name: 'DUNGEON_PILLAR_MIDDLE_GRAY',
    id: 1633,
    layer: 1,
  },

  {
    name: 'DUNGEON_PILLAR_BOTTOM_GRAY',
    id: 1634,
    layer: 1,
  },

  {
    name: 'DUNGEON_ONEWAY_PILLAR_TOP_GRAY',
    id: 1645,
    layer: 1,
  },

  {
    name: 'DUNGEON_STEEL_ARC_LEFT_GRAY',
    id: 1647,
    layer: 1,
  },

  {
    name: 'DUNGEON_PILLAR_ARC_RIGHT_GRAY',
    id: 1648,
    layer: 1,
  },

  {
    name: 'DUNGEON_TORCH_YELLOW',
    id: 1627,
    layer: 1,
  },

  {
    name: 'DUNGEON_WINDOW',
    id: 1628,
    layer: 1,
  },

  {
    name: 'DUNGEON_CHAIN_RING',
    id: 1629,
    layer: 1,
  },

  {
    name: 'DUNGEON_CHAIN_HOOK',
    id: 1630,
    layer: 1,
  },

  {
    name: 'DUNGEON_CHAIN_LOCK',
    id: 1631,
    layer: 1,
  },

  {
    name: 'RETAIL_FLAG_RED',
    id: 481,
    layer: 1,
  },

  {
    name: 'RETAIL_AWNING_RED',
    id: 482,
    layer: 1,
  },

  {
    name: 'SUMMER_STRAW',
    id: 1083,
    layer: 1,
  },

  {
    name: 'SUMMER_PLANK_PURPLE',
    id: 1084,
    layer: 1,
  },

  {
    name: 'SUMMER_PLANK_YELLLOW',
    id: 1085,
    layer: 1,
  },

  {
    name: 'SUMMER_PLANK_GREEN',
    id: 1086,
    layer: 1,
  },

  {
    name: 'SUMMER_ONEWAY_DOCK_TOP',
    id: 1087,
    layer: 1,
  },

  {
    name: 'SUMMER_STRAW_BG',
    id: 708,
    layer: 0,
  },

  {
    name: 'SUMMER_PLANK_PURPLE_BG',
    id: 712,
    layer: 0,
  },

  {
    name: 'SUMMER_PLANK_YELLOW_BG',
    id: 713,
    layer: 0,
  },

  {
    name: 'SUMMER_PLANK_GREEN_BG',
    id: 714,
    layer: 0,
  },

  {
    name: 'SUMMER_ICE_CREAM_VANILLA',
    id: 483,
    layer: 1,
  },

  {
    name: 'MINE_STONE_BROWN',
    id: 1093,
    layer: 1,
  },

  {
    name: 'MINE_STONE_BROWN_BG',
    id: 720,
    layer: 0,
  },

  {
    name: 'MINE_STALAGMITE',
    id: 495,
    layer: 1,
  },

  {
    name: 'MINE_STALAGTITE',
    id: 496,
    layer: 1,
  },

  {
    name: 'MINE_CRYSTAL_RED',
    id: 497,
    layer: 1,
  },

  {
    name: 'MINE_TORCH',
    id: 498,
    layer: 1,
  },

  {
    name: 'HAUNTED_MOSSY_BRICK_GREEN',
    id: 1047,
    layer: 1,
  },

  {
    name: 'HAUNTED_SIDING_GRAY',
    id: 1048,
    layer: 1,
  },

  {
    name: 'HAUNTED_MOSSY_SHINGLES_GRAY',
    id: 1049,
    layer: 1,
  },

  {
    name: 'HAUNTED_ONEWAY_STONE_GRAY_TOP',
    id: 1050,
    layer: 1,
  },

  {
    name: 'HAUNTED_BUSH_DEAD',
    id: 454,
    layer: 1,
  },

  {
    name: 'HAUNTED_FENCE_IRON',
    id: 455,
    layer: 1,
  },

  {
    name: 'HAUNTED_WINDOW_CURVED_OFF',
    id: 456,
    layer: 1,
  },

  {
    name: 'HAUNTED_WINDOW_CIRCLE_OFF',
    id: 457,
    layer: 1,
  },

  {
    name: 'HAUNTED_LANTERN_OFF',
    id: 458,
    layer: 1,
  },

  {
    name: 'HAUNTED_MOSSY_BRICK_GREEN_BG',
    id: 694,
    layer: 0,
  },

  {
    name: 'HAUNTED_SLIDING_GRAY_BG',
    id: 695,
    layer: 0,
  },

  {
    name: 'HAUNTED_MOSSY_SHINGLES_GRAY_BG',
    id: 696,
    layer: 0,
  },

  {
    name: 'DESERT_ROCK_ORANGE',
    id: 336,
    layer: 1,
  },

  {
    name: 'DESERT_CACTUS',
    id: 425,
    layer: 1,
  },

  {
    name: 'DESERT_BUSH',
    id: 426,
    layer: 1,
  },

  {
    name: 'DESERT_TREE',
    id: 427,
    layer: 1,
  },

  {
    name: 'MONSTER_SKIN_GREEN_LIGHT_BG',
    id: 608,
    layer: 0,
  },

  {
    name: 'MONSTER_SKIN_GREEN_DARK_BG',
    id: 609,
    layer: 0,
  },

  {
    name: 'MONSTER_SCALES_RED_LIGHT_BG',
    id: 663,
    layer: 0,
  },

  {
    name: 'MONSTER_SCALES_RED_DARK_BG',
    id: 664,
    layer: 0,
  },

  {
    name: 'MONSTER_SCALES_PURPLE_LIGHT_BG',
    id: 665,
    layer: 0,
  },

  {
    name: 'MONSTER_SCALES_PURPLE_DARK_BG',
    id: 666,
    layer: 0,
  },

  {
    name: 'MONSTER_TEETH_LARGE_BOTTOM',
    id: 338,
    layer: 1,
  },

  {
    name: 'MONSTER_TEETH_MEDIUM_BOTTOM',
    id: 340,
    layer: 1,
  },

  {
    name: 'MONSTER_TEETH_SMALL_BOTTOM',
    id: 339,
    layer: 1,
  },

  {
    name: 'MONSTER_EYE_YELLOW',
    id: 341,
    layer: 1,
  },

  {
    name: 'MONSTER_EYE_BLUE',
    id: 342,
    layer: 1,
  },

  {
    name: 'MONSTER_EYE_PURPLE',
    id: 274,
    layer: 1,
  },

  {
    name: 'SWAMP_GRASS',
    id: 371,
    layer: 1,
  },

  {
    name: 'SWAMP_LOG',
    id: 372,
    layer: 1,
  },

  {
    name: 'SWAMP_SIGN_TOXIC',
    id: 373,
    layer: 1,
  },

  {
    name: 'SWAMP_MUD_BG',
    id: 557,
    layer: 0,
  },

  {
    name: 'SWAMP_GRASS_BG',
    id: 630,
    layer: 0,
  },

  {
    name: 'FALL_LEAVES_DRIFT_BOTTOM_LEFT',
    id: 391,
    layer: 1,
  },

  {
    name: 'FALL_LEAVES_DRIFT_BOTTOM_RIGHT',
    id: 390,
    layer: 1,
  },

  {
    name: 'FALL_GRASS_LEFT',
    id: 392,
    layer: 1,
  },

  {
    name: 'FALL_GRASS_MIDDLE',
    id: 393,
    layer: 1,
  },

  {
    name: 'FALL_GRASS_RIGHT',
    id: 394,
    layer: 1,
  },

  {
    name: 'FALL_ACORN',
    id: 395,
    layer: 1,
  },

  {
    name: 'FALL_PUMPKIN',
    id: 396,
    layer: 1,
  },

  {
    name: 'FALL_LEAVES_YELLOW_BG',
    id: 641,
    layer: 0,
  },

  {
    name: 'FALL_LEAVES_ORANGE_BG',
    id: 642,
    layer: 0,
  },

  {
    name: 'FALL_LEAVES_RED_BG',
    id: 643,
    layer: 0,
  },

  {
    name: 'VALENTINES_HEART_RED',
    id: 405,
    layer: 1,
  },

  {
    name: 'VALENTINES_HEART_PURPLE',
    id: 406,
    layer: 1,
  },

  {
    name: 'VALENTINES_HEART_PINK',
    id: 407,
    layer: 1,
  },

  {
    name: 'NEWYEARS_HUNG_LIGHT_RED',
    id: 247,
    layer: 1,
  },

  {
    name: 'NEWYEARS_HUNG_LIGHT_YELLOW',
    id: 245,
    layer: 1,
  },

  {
    name: 'NEWYEARS_HUNG_LIGHT_GREEN',
    id: 248,
    layer: 1,
  },

  {
    name: 'NEWYEARS_HUNG_LIGHT_BLUE',
    id: 246,
    layer: 1,
  },

  {
    name: 'NEWYEARS_HUNG_LIGHT_PINK',
    id: 244,
    layer: 1,
  },

  {
    name: 'NEWYEARS_WINE',
    id: 462,
    layer: 1,
  },

  {
    name: 'NEWYEARS_CHAMPAGNE',
    id: 463,
    layer: 1,
  },

  {
    name: 'NEWYEARS_BALLOON_ORANGE',
    id: 464,
    layer: 1,
  },

  {
    name: 'NEWYEARS_STREAMER_ORANGE',
    id: 465,
    layer: 1,
  },

  {
    name: 'LEPRECHAUN_SHAMROCK',
    id: 1511,
    layer: 1,
  },

  {
    name: 'LEPRECHAUN_GOLD_POT',
    id: 1512,
    layer: 1,
  },

  {
    name: 'LEPRECHAUN_HORSE_SHOE',
    id: 1513,
    layer: 1,
  },

  {
    name: 'LEPRECHAUN_RAINBOW_LEFT',
    id: 1514,
    layer: 1,
  },

  {
    name: 'LEPRECHAUN_RAINBOW_RIGHT',
    id: 1515,
    layer: 1,
  },

  {
    name: 'RESTAURANT_FOOD_BURGER',
    id: 487,
    layer: 1,
  },

  {
    name: 'RESTAURANT_FOOD_HOTDOG',
    id: 488,
    layer: 1,
  },

  {
    name: 'RESTAURANT_FOOD_SUB',
    id: 489,
    layer: 1,
  },

  {
    name: 'RESTAURANT_FOOD_SODA',
    id: 490,
    layer: 1,
  },

  {
    name: 'RESTAURANT_FOOD_FRIES',
    id: 491,
    layer: 1,
  },

  {
    name: 'RESTAURANT_GLASS_EMPTY',
    id: 492,
    layer: 1,
  },

  {
    name: 'RESTAURANT_PLATE_EMPTY',
    id: 493,
    layer: 1,
  },

  {
    name: 'RESTAURANT_BOWL_EMPTY',
    id: 494,
    layer: 1,
  },

  {
    name: 'TOXIC_ONEWAY_RUSTED_TOP',
    id: 1200,
    layer: 1,
  },

  {
    name: 'TOXIC_WASTE_BG',
    id: 812,
    layer: 0,
  },

  {
    name: 'TOXIC_WASTE_BARREL_OFF',
    id: 1638,
    layer: 1,
  },

  {
    name: 'TOXIC_SEWER_DRAIN_EMPTY',
    id: 1637,
    layer: 1,
  },

  {
    name: 'TOXIC_LADDER_VERTICAL_BROKEN',
    id: 1636,
    layer: 1,
  },

  {
    name: 'TOXIC_RAIL_RUSTED',
    id: 1635,
    layer: 1,
  },

  {
    name: 'TEXTILE_CLOTH_GREEN_BG',
    id: 721,
    layer: 0,
  },

  {
    name: 'TEXTILE_CLOTH_BLUE_BG',
    id: 722,
    layer: 0,
  },

  {
    name: 'TEXTILE_CLOTH_PINK_BG',
    id: 723,
    layer: 0,
  },

  {
    name: 'TEXTILE_CLOTH_YELLOW_BG',
    id: 724,
    layer: 0,
  },

  {
    name: 'TEXTILE_CLOTH_RED_BG',
    id: 725,
    layer: 0,
  },

  {
    name: 'CARNIVAL_STRIPES_RED_WHITE_BG',
    id: 563,
    layer: 0,
  },

  {
    name: 'CARNIVAL_STRIPES_RED_YELLOW_BG',
    id: 545,
    layer: 0,
  },

  {
    name: 'CARNIVAL_STRIPES_PURPLE_VIOLET_BG',
    id: 546,
    layer: 0,
  },

  {
    name: 'CARNIVAL_CHECKER_BG',
    id: 548,
    layer: 0,
  },

  {
    name: 'CARNIVAL_PINK_BG',
    id: 547,
    layer: 0,
  },

  {
    name: 'CARNIVAL_GREEN_BG',
    id: 549,
    layer: 0,
  },

  {
    name: 'CARNIVAL_YELLOW_BG',
    id: 558,
    layer: 0,
  },

  {
    name: 'CARNIVAL_BLUE_BG',
    id: 607,
    layer: 0,
  },

  {
    name: 'UNDERWATER_BG',
    id: 574,
    layer: 0,
  },

  {
    name: 'UNDERWATER_OCTOPUS_BG',
    id: 575,
    layer: 0,
  },

  {
    name: 'UNDERWATER_FISH_BG',
    id: 576,
    layer: 0,
  },

  {
    name: 'UNDERWATER_SEAHORSE_BG',
    id: 577,
    layer: 0,
  },

  {
    name: 'UNDERWATER_SEAWEED_BG',
    id: 578,
    layer: 0,
  },

  {
    name: 'BORDER_GLOW_LINE_TOP',
    id: 1611,
    layer: 0,
  },
  {
    name: 'BORDER_GLOW_CORNER_TOP_RIGHT',
    id: 1612,
    layer: 0,
  },
  {
    name: 'BORDER_GLOW_STRAIGHT_HORIZONTAL',
    id: 1613,
    layer: 0,
  },
  {
    name: 'BORDER_GLOW_CUP_LEFT',
    id: 1614,
    layer: 0,
  },
  {
    name: 'BORDER_GLOW_CENTER_SOLID',
    id: 1615,
    layer: 0,
  },
  {
    name: 'BORDER_GLOW_POINT_TOP_RIGHT',
    id: 1616,
    layer: 0,
  },
  {
    name: 'BORDER_GLOW_POINT_TOP_RIGHT_BOTTOM_RIGHT',
    id: 1617,
    layer: 0,
  },
  {
    name: 'BORDER_GLOW_POINT_TOP_RIGHT_BOTTOM_LEFT',
    id: 1618,
    layer: 0,
  },
  {
    name: 'BORDER_GLOW_POINT_TOP_RIGHT_BOTTOM_LEFT_BOTTOM_RIGHT',
    id: 1619,
    layer: 0,
  },
  {
    name: 'BORDER_GLOW_CENTER_HOLLOW',
    id: 1620,
    layer: 0,
  },
  {
    name: 'BORDER_GLOW_LINE_TOP_POINT_BOTTOM_RIGHT',
    id: 1621,
    layer: 0,
  },
  {
    name: 'BORDER_GLOW_LINE_TOP_POINT_BOTTOM_LEFT',
    id: 1622,
    layer: 0,
  },
  {
    name: 'BORDER_GLOW_LINE_TOP_POINT_BOTTOM_LEFT_BOTTOM_RIGHT',
    id: 1623,
    layer: 0,
  },
  {
    name: 'BORDER_GLOW_CORNER_TOP_RIGHT_POINT_BOTTOM_LEFT',
    id: 1624,
    layer: 0,
  },

  // vvv Blocks in EELVL, but not in PW vvv
  {
    name: 'COIN_GOLD_PICKED_UP',
    id: 110,
    layer: 0,
  },
  {
    name: 'COIN_BLUE_PICKED_UP',
    id: 111,
    layer: 0,
  },
  {
    name: 'TIMEGATE',
    id: 157,
    layer: 0,
  },
  {
    name: 'TIMEDOOR',
    id: 156,
    layer: 0,
  },
  {
    name: 'TROPHY_HALLOWEEN',
    id: 223,
    layer: 0,
  },
  {
    name: 'TROPHY_SPRING_BRONZE',
    id: 478,
    layer: 0,
  },
  {
    name: 'TROPHY_SPRING_SILVER',
    id: 479,
    layer: 0,
  },
  {
    name: 'TROPHY_SPRING_GOLD',
    id: 480,
    layer: 0,
  },
  {
    name: 'TROPHY_SUMMER_BRONZE',
    id: 484,
    layer: 0,
  },
  {
    name: 'TROPHY_SUMMER_SILVER',
    id: 485,
    layer: 0,
  },
  {
    name: 'TROPHY_SUMMER_GOLD',
    id: 486,
    layer: 0,
  },
  {
    name: 'TROPHY_DESIGN_BRONZE',
    id: 1540,
    layer: 0,
  },
  {
    name: 'TROPHY_DESIGN_SILVER',
    id: 1541,
    layer: 0,
  },
  {
    name: 'TROPHY_DESIGN_GOLD',
    id: 1542,
    layer: 0,
  },

  {
    name: 'LABEL',
    id: 1000,
    layer: 0,
  },

  {
    name: 'EFFECTS_POISON',
    id: 1646,
    layer: 0,
  },
  {
    name: 'GATE_GOLD',
    id: 201,
    layer: 0,
  },
  {
    name: 'DOOR_GOLD',
    id: 200,
    layer: 0,
  },

  {
    name: 'FIREWORKS',
    id: 1640,
    layer: 0,
  },
  {
    name: 'GOLDEN_EASTER_EGG',
    id: 1650,
    layer: 0,
  },
  {
    name: 'GREEN_SPACE',
    id: 1649,
    layer: 0,
  },
  {
    name: 'NPC_SMILE',
    id: 1592,
    layer: 0,
  },
  {
    name: 'NPC_SAD',
    id: 1593,
    layer: 0,
  },
  {
    name: 'NPC_OLD',
    id: 1594,
    layer: 0,
  },
  {
    name: 'NPC_ANGRY',
    id: 1595,
    layer: 0,
  },
  {
    name: 'NPC_SLIME',
    id: 1596,
    layer: 0,
  },
  {
    name: 'NPC_ROBOT',
    id: 1597,
    layer: 0,
  },
  {
    name: 'NPC_KNIGHT',
    id: 1598,
    layer: 0,
  },
  {
    name: 'NPC_MEH',
    id: 1599,
    layer: 0,
  },
  {
    name: 'NPC_COW',
    id: 1600,
    layer: 0,
  },
  {
    name: 'NPC_FROG',
    id: 1601,
    layer: 0,
  },
  {
    name: 'NPC_BRUCE',
    id: 1602,
    layer: 0,
  },
  {
    name: 'NPC_STARFISH',
    id: 1603,
    layer: 0,
  },
  {
    name: 'NPC_DT',
    id: 1604,
    layer: 0,
  },
  {
    name: 'NPC_SKELETON',
    id: 1605,
    layer: 0,
  },
  {
    name: 'NPC_ZOMBIE',
    id: 1606,
    layer: 0,
  },
  {
    name: 'NPC_GHOST',
    id: 1607,
    layer: 0,
  },
  {
    name: 'NPC_ASTRONAUT',
    id: 1608,
    layer: 0,
  },
  {
    name: 'NPC_SANTA',
    id: 1609,
    layer: 0,
  },
  {
    name: 'NPC_SNOWMAN',
    id: 1610,
    layer: 0,
  },
  {
    name: 'NPC_WALRUS',
    id: 1651,
    layer: 0,
  },
  {
    name: 'NPC_CRAB',
    id: 1652,
    layer: 0,
  },
  // EER exclusive blocks below
  {
    name: 'PASTEL_WHITE_BG',
    id: 777,
    layer: 1,
  },
  {
    name: 'PASTEL_GRAY_BG',
    id: 787,
    layer: 1,
  },
  {
    name: 'PASTEL_BLACK_BG',
    id: 776,
    layer: 1,
  },
  {
    name: 'SOLID_FOREGROUND_WHITE',
    id: 1142,
    layer: 0,
  },
  {
    name: 'SOLID_FOREGROUND_LIGHT_GRAY',
    id: 1143,
    layer: 0,
  },
  {
    name: 'SOLID_FOREGROUND_DARK_GRAY',
    id: 1144,
    layer: 0,
  },
  {
    name: 'SOLID_FOREGROUND_BLACK',
    id: 1145,
    layer: 0,
  },
  {
    name: 'SOLID_FOREGROUND_RED',
    id: 1182,
    layer: 0,
  },
  {
    name: 'SOLID_FOREGROUND_ORANGE',
    id: 1147,
    layer: 0,
  },
  {
    name: 'SOLID_FOREGROUND_YELLOW',
    id: 1148,
    layer: 0,
  },
  {
    name: 'SOLID_FOREGROUND_LIME',
    id: 1149,
    layer: 0,
  },
  {
    name: 'SOLID_FOREGROUND_GREEN',
    id: 1150,
    layer: 0,
  },
  {
    name: 'SOLID_FOREGROUND_TEAL',
    id: 1151,
    layer: 0,
  },
  {
    name: 'SOLID_FOREGROUND_CYAN',
    id: 1152,
    layer: 0,
  },
  {
    name: 'SOLID_FOREGROUND_LIGHT_BLUE',
    id: 1153,
    layer: 0,
  },
  {
    name: 'SOLID_FOREGROUND_DARK_BLUE',
    id: 1154,
    layer: 0,
  },
  {
    name: 'SOLID_FOREGROUND_PURPLE',
    id: 1155,
    layer: 0,
  },
  {
    name: 'SOLID_FOREGROUND_MAGENTA',
    id: 1156,
    layer: 0,
  },
  {
    name: 'SOLID_FOREGROUND_PINK',
    id: 1157,
    layer: 0,
  },
  {
    name: 'SOLID_BACKGROUND_WHITE',
    id: 791,
    layer: 1,
  },
  {
    name: 'SOLID_BACKGROUND_LIGHT_GRAY',
    id: 792,
    layer: 1,
  },
  {
    name: 'SOLID_BACKGROUND_DARK_GRAY',
    id: 793,
    layer: 1,
  },
  {
    name: 'SOLID_BACKGROUND_BLACK',
    id: 794,
    layer: 1,
  },
  {
    name: 'SOLID_BACKGROUND_RED',
    id: 795,
    layer: 1,
  },
  {
    name: 'SOLID_BACKGROUND_ORANGE',
    id: 796,
    layer: 1,
  },
  {
    name: 'SOLID_BACKGROUND_YELLOW',
    id: 797,
    layer: 1,
  },
  {
    name: 'SOLID_BACKGROUND_LIME',
    id: 798,
    layer: 1,
  },
  {
    name: 'SOLID_BACKGROUND_GREEN',
    id: 799,
    layer: 1,
  },
  {
    name: 'SOLID_BACKGROUND_TEAL',
    id: 800,
    layer: 1,
  },
  {
    name: 'SOLID_BACKGROUND_CYAN',
    id: 801,
    layer: 1,
  },
  {
    name: 'SOLID_BACKGROUND_LIGHT_BLUE',
    id: 802,
    layer: 1,
  },
  {
    name: 'SOLID_BACKGROUND_DARK_BLUE',
    id: 803,
    layer: 1,
  },
  {
    name: 'SOLID_BACKGROUND_PURPLE',
    id: 804,
    layer: 1,
  },
  {
    name: 'SOLID_BACKGROUND_MAGENTA',
    id: 805,
    layer: 1,
  },
  {
    name: 'SOLID_BACKGROUND_PINK',
    id: 806,
    layer: 1,
  },
]
