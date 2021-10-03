import { Color } from "./styles"

export type TType = 'skin_pack' | 'resource_pack' | 'addon_pack'
export type TDescription = string | [string, { text: string, color: Color }]

export type BedrockTSConfig = {
  /**
   * Skin pack template name. Only works if addon pack type is skin_pack
   */
  skin_pack_name?: string
  /**
   * Path to pack icon. Inside resources/
   */
  pack_icon?: string
  /**
   * Namespace used inside the pack
  */
  namespace?: string
  /**
   * Name of the pack
   */
  name: TDescription
  /**
   * Description of the pack
   */
  description?: TDescription
  /**
   * Version of the pack
   */
  version?: [number, number, number]
  /**
   * Minimum version that this pack is compatible with
   */
  minCompatibleVersion?: [number, number, number]
  saveOptions?: {
    path: string
  }
}

export type TResources = {
  langs: string[],
  ui: { fullPath: string, shortPath: string }[],
  texts: { fullPath: string, shortPath: string }[],
  textures: { fullPath: string, shortPath: string }[],
  recipes: { fullPath: string, shortPath: string }[]
  loot_tables: { fullPath: string, shortPath: string }[]
  trading: { fullPath: string, shortPath: string }[]
}

export type TRecipeFurnaceTags = 'furnace' | 'smoker' | 'campfire' | 'blast_furnace'
export type TCraftingRecipeTags = 'crafting_table'

export enum EDefaultGeo {
  HUMANOID = 'geometry.humanoid.custom'
}

export type TBlockShape = 'invisible' | 'block' | 'cross_texture' | 'torch' | 'fire' | 'water' | 'red_dust' | 'rows' | 'door' | 'ladder' | 'rail' | 'stairs' | 'fence' | 'lever' | 'cactus' | 'bed' | 'diode' | 'iron_fence' | 'stem' | 'vine' | 'fence_gate' | 'chest' | 'lilypad' | 'brewing_stand' | 'portal_frame' | 'cocoa' | 'tree' | 'cobblestone_wall' | 'double_plant' | 'flower_pot' | 'anvil' | 'dragon_egg' | 'structure_void' | 'block_half' | 'top_snow' | 'tripwire' | 'tripwire_hook' | 'cauldron' | 'repeater' | 'comparator' | 'hopper' | 'slime_block' | 'piston' | 'beacon' | 'chorus_plant' | 'chorus_flower' | 'end_portal' | 'end_rod' | 'skull' | 'facing_block' | 'command_block' | 'terracotta' | 'double_side_fence' | 'frame' | 'shulker_box' | 'doublesided_cross_texture' | 'doublesided_double_plant' | 'doublesided_rows' | 'element_block' | 'chemistry_table' | 'coral_fan' | 'seagrass' | 'kelp' | 'trapdoor' | 'sea_pickle' | 'conduit' | 'turtle_egg' | 'bubble_column' | 'barrier' | 'sign' | 'bamboo' | 'bamboo_sapling' | 'scaffolding' | 'grindstone' | 'bell' | 'lantern' | 'campfire' | 'lectern' | 'sweet_berry_bush' | 'cartography_table' | 'stonecutter_block' | 'chain' | 'sculk_sensor' | 'azalea' | 'flowering_azalea' | 'glow_frame' | 'glow_lichen'

export type TTerrainTextures = string | string[] | { path: string, weight: number }[]