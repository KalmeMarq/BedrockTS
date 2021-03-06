import { TBlockShape } from '..'
import AddonPack, { Registry } from '../addon'
import { getFromRegex, JsonArray, JsonObject } from '../utils'
  

export interface IBlockComponents {
  loot?: string
  destroy_time?: number
  explosion_resistance?: number
  friction?: number
  flammable?: {
    flame_odds: number
    burn_odds: number
  }
  map_color?: string
  block_light_absorption?: number
  block_light_emission?: number,

  // Exp

  unit_cube?: boolean
  crafting_table?: {
    custom_description: string
		grid_size: number,
		crafting_tags: string[]
  }
  entity_collision?: boolean | {
    origin: [number, number, number]
		size: [number, number, number]
  }
  pick_collision?: boolean | {
    origin: [number, number, number]
		size: [number, number, number]
  }
  breakonpush?: boolean
  display_name?: string
  breathability?: 'solid' | 'air'
  immovable?: boolean
  onlypistonpush?: boolean
  preventsjumping?: boolean
  rotation?: [number, number, number]
  unwalkable?: boolean
}

const expComponents = [
  'unit_cube', 
  'crafting_table', 
  'entity_collision', 
  'entity_collision', 
  'pick_collision', 
  'breakonpush',
  'display_name',
  'breathability',
  'immovable',
  'onlypistonpush',
  'preventsjumping',
  'rotation',
  'unwalkable'
]

export type IBlockTexturesFull = {
  up: string
  down: string
  side?: string
  north?: string
  south?: string
  west?: string
  east?: string
}

export type IBlockTextures = string | IBlockTexturesFull

export class BlockClass {
  public id: string
  public path: string
  private isExperimental: boolean
  private inCreativeMenu: boolean
  private components: IBlockComponents
  private textures: IBlockTextures
  private sound: string
  private blockshape: TBlockShape | undefined

  public constructor(path: string, isExperimental: boolean, registerToCreativeMenu: boolean, components: IBlockComponents, textures: IBlockTextures, sound = 'stone', blockshape?: TBlockShape) {
    this.path = path
    this.id = getFromRegex(path, /[^/]+$/)[0] ?? 'unknown'

    this.isExperimental = isExperimental
    this.inCreativeMenu = registerToCreativeMenu
    this.components = components
    this.textures = textures
    this.sound = sound
    this.blockshape = blockshape
  }

  public serializeServerData(block: JsonObject) {
    block.addProperty('format_version', '1.12')

    const mcblock = new JsonObject()

    const desc = new JsonObject()
    desc.addProperty('identifier', AddonPack.namespace + ':' + this.id)
    desc.addProperty('is_experimental', this.isExperimental)
    desc.addProperty('register_to_creative_menu', this.inCreativeMenu)
    mcblock.add('description', desc)

    const components = new JsonObject()
    Object.entries(this.components).forEach(([key, value]) => {
      if ((!this.isExperimental && !expComponents.includes(key)) || (this.isExperimental)) {
        if (typeof value === 'object') {
          if (Array.isArray(value)) {
            const arr = new JsonArray()
            value.forEach(v => {
              arr.add(v)
            })
            components.add('minecraft:' + key, arr)
          } else {
            const obj = new JsonObject()
            Object.entries<any>(value).forEach(([k, v]) => {
              obj.addProperty(k, v)
            })
            components.add('minecraft:' + key, obj)
          }
        } else {
          components.addProperty('minecraft:' + key, value)
        }
      }
    })

    mcblock.add('components', components)
    block.add('minecraft:block', mcblock)
  }

  public serializeClientData(blocks: JsonObject) {
    const block = new JsonObject()

    if (this.blockshape) {
      block.addProperty('blockshape', this.blockshape)
    }

    if (typeof this.textures === 'string') {
      block.addProperty('textures', this.textures)
    } else {
      const textures = new JsonObject()
      
      textures.addProperty('up', this.textures.up)
      textures.addProperty('down', this.textures.down)
    
      if (this.textures.side) {
        textures.addProperty('side', this.textures.side)
      } else if (this.textures.north && this.textures.east && this.textures.south && this.textures.west) {
        textures.addProperty('north', this.textures.north)
        textures.addProperty('south', this.textures.south)
        textures.addProperty('east', this.textures.east)
        textures.addProperty('west', this.textures.west)
      } else {
        textures.addProperty('side', this.textures.up)
      }

      block.add('textures', textures)
    }

    block.addProperty('sound', this.sound)

    blocks.add(AddonPack.namespace + ':' + this.id, block)
  }
}

class Component<T> {
  public name: string
  public value: T | undefined

  public constructor(name: string, defaultValue?: T) {
    this.name = name
    this.value = defaultValue
  }

  public serialize(obj: JsonObject) {
    if (this.value instanceof JsonObject || this.value instanceof JsonArray) {
      obj.add(this.name, this.value)
    } else {
      if (this.value) obj.addProperty(this.name, this.value as any)
    }
  }
}

export class BlockProperties {
  public _mapColor = new Component<string>('minecraft:map_color')
  public _destroyTime = new Component<number>('minecraft:destroy_time')
  public _friction = new Component<number>('minecraft:friction')
  public _explosionResistance = new Component<number>('minecraft:explosion_resistance')
  public _drops = new Component<string>('minecraft:loot')
  public _light_emission = new Component<number>('minecraft:block_light_emission')
  public _light_absorption = new Component<number>('minecraft:block_light_absorption')
  public _breakOnPush = new Component<boolean>('minecraft:breakonpush')
  public _breathability = new Component<'solid' | 'air'>('minecraft:breathability')
  public _immovable = new Component<boolean>('minecraft:immovable')
  public _onlyPistonPush = new Component<boolean>('minecraft:onlypistonpush')
  public _preventsJumping = new Component<boolean>('minecraft:preventsjumping')
  public _flammable = new Component<JsonObject<{ flame_odds: number, burn_odds: number }>>('minecraft:flammable')
  public _rotation = new Component<JsonArray<number>>('minecraft:rotation')
  public _unwalkable = new Component<boolean>('minecraft:unwalkable')
  public _unit_cube = new Component<boolean>('minecraft:unit_cube')

  public unitCube() {
    this._unit_cube.value = true
    return this
  }

  public unwalkable() {
    this._unwalkable.value = true
    return this
  }

  public rotation(x: number, y: number, z: number) {
    const obj = new JsonArray<number>()
    obj.add(x)
    obj.add(y)
    obj.add(z)
    this._rotation.value = obj
    return this
  }
  
  public flammable(flameOdds: number, burnOdds: number) {
    const obj = new JsonObject<{ flame_odds: number, burn_odds: number }>()
    obj.addProperty('flame_odds', flameOdds)
    obj.addProperty('burn_odds', burnOdds)
    this._flammable.value = obj
    return this
  }

  public breakOnPush() {
    this._breakOnPush.value = true
    return this
  }

  public breathability(value: 'solid' | 'air') {
    this._breathability.value = value
    return this
  }

  public immovable() {
    this._immovable.value = true
    return this
  }

  public onlyPistonPush() {
    this._onlyPistonPush.value = true
    return this
  }

  public preventsJump() {
    this._preventsJumping.value = true
    return this
  }
  
  public drops(drops: string): BlockProperties {
    this._drops.value = drops
    return this
  }

  public destroyTime(time: number): BlockProperties {
    this._destroyTime.value = time
    return this
  }

  public explosionResistance(resis: number): BlockProperties {
    this._explosionResistance.value = resis
    return this
  }

  public strength(strength: number): BlockProperties
  public strength(destroyTime: number, resistance: number): BlockProperties
  public strength(destroyTime: number, resistance?: number): BlockProperties {
    return this.destroyTime(destroyTime).explosionResistance(resistance ?? destroyTime)
  }

  public mapColor(color: number | string | [number, number, number]): BlockProperties {
    if ((color as string).startsWith('#')) {
      this._mapColor.value = color as string
    }
    return this
  }

  public lightLevel(level: number) {
    this._light_emission.value = level
    return this
  }

  public lightAbsorption(level: number) {
    this._light_absorption.value = level
    return this
  }

  public light(absorption: number, emission: number): BlockProperties {
    return this.lightLevel(absorption).lightAbsorption(emission)
  }
}

export class CollisionBox {
  private constructor() {
  }

  public static create(width: number, height: number, depth: number, originX: number, originY: number, originZ: number) {
    const obj = new JsonObject<{ origins: [number, number, number], size: [number, number, number] }>()
    const origins = new JsonArray()
    origins.add(originX)
    origins.add(originY)
    origins.add(originZ)
    const size = new JsonArray()
    size.add(width)
    size.add(height)
    size.add(depth)
    obj.add('origins', origins)
    obj.add('size', size)
    return obj
  }
}

export type TBox = JsonObject<{ origins: [number, number, number], size: [number, number, number] }> | false

export type TBEvent = JsonObject<{
  condition: string;
  event: string;
  target: string;
}> | undefined

export class BEvent {
  private constructor() {
  }

  public static create(event: string, condition: string) {
    const obj = new JsonObject<{ condition: string, event: string, target: string }>()
    obj.addProperty('target', 'self')
    obj.addProperty('event', event)
    obj.addProperty('condition', condition)
    
    return obj
  }
}

export class MCBlock {
  public path: string
  public id: string

  public destroyTime: Component<number>
  public friction: Component<number>
  public explosionResistance: Component<number>
  public drops: Component<string>
  public properties: BlockProperties

  public constructor(path: string, properties: BlockProperties) {
    this.path = path
    this.id = getFromRegex(path, /[^/]+$/)[0] ?? 'unknown'

    this.destroyTime = properties._destroyTime
    this.explosionResistance = properties._explosionResistance
    this.friction = properties._friction
    this.drops = properties._drops
    this.properties = properties
  }

  public customProperties = {
  }

  public isExperimental(): boolean {
    return false
  }

  public registerToCreativeMenu(): boolean {
    return true
  }

  public getPickCollision(): TBox {
    return false
  }

  public getEntityCollision(): TBox {
    return false
  }

  public playSound(): undefined | string {
    return undefined
  }

  public onPlaced(event: TEventGetter): void {
  }

  public onInteract(event: TEventGetter): void {
  }

  public onStepOn(event: TEventGetter): void {
  }

  public onStepOff(event: TEventGetter): void {
  }

  public onFallOn(event: TEventGetter): void {
  }

  public onPlayerPlacing(event: TEventGetter): void {
  }

  public onPlayerDestroyed(event: TEventGetter): void {
  }

  public serializeServerData(block: JsonObject): void {
    block.addProperty('format_version', '1.12')

    const mcblock = new JsonObject()

    const desc = new JsonObject()
    desc.addProperty('identifier', AddonPack.namespace + ':' + this.id)
    desc.addProperty('is_experimental', this.isExperimental())
    desc.addProperty('register_to_creative_menu', this.registerToCreativeMenu())
    
    if (Object.keys(this.customProperties).length > 0) {
      const props = new JsonObject()

      Object.entries<any[] | string>(this.customProperties).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          const arr = new JsonArray()
          value.forEach(v => arr.add(v))
          props.add(AddonPack.namespace + ':' + key, arr)
        } else {
          props.addProperty(AddonPack.namespace + ':' + key, value)
        }
      })

      desc.add('properties', props)
    }

    mcblock.add('description', desc)


    const components = new JsonObject()

    this.destroyTime.serialize(components)
    this.explosionResistance.serialize(components)
    this.friction.serialize(components)
    this.drops.serialize(components)
    this.properties._light_absorption.serialize(components)
    this.properties._light_emission.serialize(components)
    this.properties._mapColor.serialize(components)
    this.properties._breakOnPush.serialize(components)
    this.properties._breathability.serialize(components)
    this.properties._immovable.serialize(components)
    this.properties._onlyPistonPush.serialize(components)
    this.properties._preventsJumping.serialize(components)
    this.properties._flammable.serialize(components)

    const pickCol = this.getPickCollision()
    const entCol = this.getEntityCollision()

    if (pickCol) {
      components.add('minecraft:pick_collision', pickCol)
    }

    if (entCol) {
      components.add('minecraft:entity_collision', entCol)
    }

    this.onPlaced((s: TBEvent) => {
      if(s) components.add('minecraft:on_placed', s)
    })

    this.onFallOn((s: TBEvent) => {
      if(s) components.add('minecraft:on_fall_on', s)
    })

    this.onInteract((s: TBEvent) => {
      if(s) components.add('minecraft:on_interact', s)
    })

    this.onPlayerDestroyed((s: TBEvent) => {
      if(s) components.add('minecraft:on_player_destroyed', s)
    })

    this.onPlayerPlacing((s: TBEvent) => {
      if(s) components.add('minecraft:on_player_placing', s)
    })

    this.onStepOff((s: TBEvent) => {
      if(s) components.add('minecraft:on_step_off', s)
    })

    this.onStepOn((s: TBEvent) => {
      if(s) components.add('minecraft:on_step_on', s)
    })

    mcblock.add('components', components)

    block.add('minecraft:block', mcblock)
  }

  public serializeClientData(blocks: JsonObject): void {
  }

  public register(registry: Registry<MCBlock>) {
    registry.register(this)
  }
}

export type TEventGetter = (ev: TBEvent) => void

export enum Blocks {
  ACACIA_BUTTON = 'minecraft:acacia_button',
  ACACIA_DOOR = 'minecraft:acacia_door',
  ACACIA_FENCE_GATE = 'minecraft:acacia_fence_gate',
  ACACIA_PRESSURE_PLATE = 'minecraft:acacia_pressure_plate',
  ACACIA_STAIRS = 'minecraft:acacia_stairs',
  ACACIA_STANDING_SIGN = 'minecraft:acacia_standing_sign',
  ACACIA_TRAPDOOR = 'minecraft:acacia_trapdoor',
  ACACIA_WALL_SIGN = 'minecraft:acacia_wall_sign',
  ACTIVATOR_RAIL = 'minecraft:activator_rail',
  AIR = 'minecraft:air',
  ALLOW = 'minecraft:allow',
  AMETHYST_BLOCK = 'minecraft:amethyst_block',
  AMETHYST_CLUSTER = 'minecraft:amethyst_cluster',
  ANCIENT_DEBRIS = 'minecraft:ancient_debris',
  ANDESITE_STAIRS = 'minecraft:andesite_stairs',
  ANVIL = 'minecraft:anvil',
  AZALEA = 'minecraft:azalea',
  AZALEA_LEAVES = 'minecraft:azalea_leaves',
  AZALEA_LEAVES_FLOWERED = 'minecraft:azalea_leaves_flowered',
  BAMBOO = 'minecraft:bamboo',
  BAMBOO_SAPLING = 'minecraft:bamboo_sapling',
  BARREL = 'minecraft:barrel',
  BARRIER = 'minecraft:barrier',
  BASALT = 'minecraft:basalt',
  BEACON = 'minecraft:beacon',
  BED = 'minecraft:bed',
  BEDROCK = 'minecraft:bedrock',
  BEE_NEST = 'minecraft:bee_nest',
  BEEHIVE = 'minecraft:beehive',
  BEETROOT = 'minecraft:beetroot',
  BELL = 'minecraft:bell',
  BIG_DRIPLEAF = 'minecraft:big_dripleaf',
  BIRCH_BUTTON = 'minecraft:birch_button',
  BIRCH_DOOR = 'minecraft:birch_door',
  BIRCH_FENCE_GATE = 'minecraft:birch_fence_gate',
  BIRCH_PRESSURE_PLATE = 'minecraft:birch_pressure_plate',
  BIRCH_STAIRS = 'minecraft:birch_stairs',
  BIRCH_STANDING_SIGN = 'minecraft:birch_standing_sign',
  BIRCH_TRAPDOOR = 'minecraft:birch_trapdoor',
  BIRCH_WALL_SIGN = 'minecraft:birch_wall_sign',
  BLACK_GLAZED_TERRACOTTA = 'minecraft:black_glazed_terracotta',
  BLACKSTONE = 'minecraft:blackstone',
  BLACKSTONE_DOUBLE_SLAB = 'minecraft:blackstone_double_slab',
  BLACKSTONE_SLAB = 'minecraft:blackstone_slab',
  BLACKSTONE_STAIRS = 'minecraft:blackstone_stairs',
  BLACKSTONE_WALL = 'minecraft:blackstone_wall',
  BLAST_FURNACE = 'minecraft:blast_furnace',
  BLUE_GLAZED_TERRACOTTA = 'minecraft:blue_glazed_terracotta',
  BLUE_ICE = 'minecraft:blue_ice',
  BONE_BLOCK = 'minecraft:bone_block',
  BOOKSHELF = 'minecraft:bookshelf',
  BORDER_BLOCK = 'minecraft:border_block',
  BREWING_STAND = 'minecraft:brewing_stand',
  BRICK_BLOCK = 'minecraft:brick_block',
  BRICK_STAIRS = 'minecraft:brick_stairs',
  BROWN_GLAZED_TERRACOTTA = 'minecraft:brown_glazed_terracotta',
  BROWN_MUSHROOM = 'minecraft:brown_mushroom',
  BROWN_MUSHROOM_BLOCK = 'minecraft:brown_mushroom_block',
  BUBBLE_COLUMN = 'minecraft:bubble_column',
  BUDDING_AMETHYST = 'minecraft:budding_amethyst',
  CACTUS = 'minecraft:cactus',
  CAKE = 'minecraft:cake',
  CALCITE = 'minecraft:calcite',
  CAMERA = 'minecraft:camera',
  CAMPFIRE = 'minecraft:campfire',
  CARPET = 'minecraft:carpet',
  CARROTS = 'minecraft:carrots',
  CARTOGRAPHY_TABLE = 'minecraft:cartography_table',
  CARVED_PUMPKIN = 'minecraft:carved_pumpkin',
  CAULDRON = 'minecraft:cauldron',
  CAVE_VINES = 'minecraft:cave_vines',
  CAVE_VINES_BODY_WITH_BERRIES = 'minecraft:cave_vines_body_with_berries',
  CAVE_VINES_HEAD_WITH_BERRIES = 'minecraft:cave_vines_head_with_berries',
  CHAIN = 'minecraft:chain',
  CHAIN_COMMAND_BLOCK = 'minecraft:chain_command_block',
  CHEMICAL_HEAT = 'minecraft:chemical_heat',
  CHEMISTRY_TABLE = 'minecraft:chemistry_table',
  CHEST = 'minecraft:chest',
  CHISELED_DEEPSLATE = 'minecraft:chiseled_deepslate',
  CHISELED_NETHER_BRICKS = 'minecraft:chiseled_nether_bricks',
  CHISELED_POLISHED_BLACKSTONE = 'minecraft:chiseled_polished_blackstone',
  CHORUS_FLOWER = 'minecraft:chorus_flower',
  CHORUS_PLANT = 'minecraft:chorus_plant',
  CLAY = 'minecraft:clay',
  COAL_BLOCK = 'minecraft:coal_block',
  COAL_ORE = 'minecraft:coal_ore',
  COBBLED_DEEPSLATE = 'minecraft:cobbled_deepslate',
  COBBLED_DEEPSLATE_DOUBLE_SLAB = 'minecraft:cobbled_deepslate_double_slab',
  COBBLED_DEEPSLATE_SLAB = 'minecraft:cobbled_deepslate_slab',
  COBBLED_DEEPSLATE_STAIRS = 'minecraft:cobbled_deepslate_stairs',
  COBBLED_DEEPSLATE_WALL = 'minecraft:cobbled_deepslate_wall',
  COBBLESTONE = 'minecraft:cobblestone',
  COBBLESTONE_WALL = 'minecraft:cobblestone_wall',
  COCOA = 'minecraft:cocoa',
  COLORED_TORCH_BP = 'minecraft:colored_torch_bp',
  COLORED_TORCH_RG = 'minecraft:colored_torch_rg',
  COMMAND_BLOCK = 'minecraft:command_block',
  COMPOSTER = 'minecraft:composter',
  CONCRETE = 'minecraft:concrete',
  CONCRETEPOWDER = 'minecraft:concretePowder',
  CONDUIT = 'minecraft:conduit',
  COPPER_BLOCK = 'minecraft:copper_block',
  COPPER_ORE = 'minecraft:copper_ore',
  CORAL = 'minecraft:coral',
  CORAL_BLOCK = 'minecraft:coral_block',
  CORAL_FAN = 'minecraft:coral_fan',
  CORAL_FAN_DEAD = 'minecraft:coral_fan_dead',
  CORAL_FAN_HANG = 'minecraft:coral_fan_hang',
  CORAL_FAN_HANG2 = 'minecraft:coral_fan_hang2',
  CORAL_FAN_HANG3 = 'minecraft:coral_fan_hang3',
  CRACKED_DEEPSLATE_BRICKS = 'minecraft:cracked_deepslate_bricks',
  CRACKED_DEEPSLATE_TILES = 'minecraft:cracked_deepslate_tiles',
  CRACKED_NETHER_BRICKS = 'minecraft:cracked_nether_bricks',
  CRACKED_POLISHED_BLACKSTONE_BRICKS = 'minecraft:cracked_polished_blackstone_bricks',
  CRAFTING_TABLE = 'minecraft:crafting_table',
  CRIMSON_BUTTON = 'minecraft:crimson_button',
  CRIMSON_DOOR = 'minecraft:crimson_door',
  CRIMSON_DOUBLE_SLAB = 'minecraft:crimson_double_slab',
  CRIMSON_FENCE = 'minecraft:crimson_fence',
  CRIMSON_FENCE_GATE = 'minecraft:crimson_fence_gate',
  CRIMSON_FUNGUS = 'minecraft:crimson_fungus',
  CRIMSON_HYPHAE = 'minecraft:crimson_hyphae',
  CRIMSON_NYLIUM = 'minecraft:crimson_nylium',
  CRIMSON_PLANKS = 'minecraft:crimson_planks',
  CRIMSON_PRESSURE_PLATE = 'minecraft:crimson_pressure_plate',
  CRIMSON_ROOTS = 'minecraft:crimson_roots',
  CRIMSON_SLAB = 'minecraft:crimson_slab',
  CRIMSON_STAIRS = 'minecraft:crimson_stairs',
  CRIMSON_STANDING_SIGN = 'minecraft:crimson_standing_sign',
  CRIMSON_STEM = 'minecraft:crimson_stem',
  CRIMSON_TRAPDOOR = 'minecraft:crimson_trapdoor',
  CRIMSON_WALL_SIGN = 'minecraft:crimson_wall_sign',
  CRYING_OBSIDIAN = 'minecraft:crying_obsidian',
  CUT_COPPER = 'minecraft:cut_copper',
  CUT_COPPER_SLAB = 'minecraft:cut_copper_slab',
  CUT_COPPER_STAIRS = 'minecraft:cut_copper_stairs',
  CYAN_GLAZED_TERRACOTTA = 'minecraft:cyan_glazed_terracotta',
  DARK_OAK_BUTTON = 'minecraft:dark_oak_button',
  DARK_OAK_DOOR = 'minecraft:dark_oak_door',
  DARK_OAK_FENCE_GATE = 'minecraft:dark_oak_fence_gate',
  DARK_OAK_PRESSURE_PLATE = 'minecraft:dark_oak_pressure_plate',
  DARK_OAK_STAIRS = 'minecraft:dark_oak_stairs',
  DARK_OAK_TRAPDOOR = 'minecraft:dark_oak_trapdoor',
  DARK_PRISMARINE_STAIRS = 'minecraft:dark_prismarine_stairs',
  DARKOAK_STANDING_SIGN = 'minecraft:darkoak_standing_sign',
  DARKOAK_WALL_SIGN = 'minecraft:darkoak_wall_sign',
  DAYLIGHT_DETECTOR = 'minecraft:daylight_detector',
  DAYLIGHT_DETECTOR_INVERTED = 'minecraft:daylight_detector_inverted',
  DEADBUSH = 'minecraft:deadbush',
  DEEPSLATE = 'minecraft:deepslate',
  DEEPSLATE_BRICK_DOUBLE_SLAB = 'minecraft:deepslate_brick_double_slab',
  DEEPSLATE_BRICK_SLAB = 'minecraft:deepslate_brick_slab',
  DEEPSLATE_BRICK_STAIRS = 'minecraft:deepslate_brick_stairs',
  DEEPSLATE_BRICK_WALL = 'minecraft:deepslate_brick_wall',
  DEEPSLATE_BRICKS = 'minecraft:deepslate_bricks',
  DEEPSLATE_COAL_ORE = 'minecraft:deepslate_coal_ore',
  DEEPSLATE_COPPER_ORE = 'minecraft:deepslate_copper_ore',
  DEEPSLATE_DIAMOND_ORE = 'minecraft:deepslate_diamond_ore',
  DEEPSLATE_EMERALD_ORE = 'minecraft:deepslate_emerald_ore',
  DEEPSLATE_GOLD_ORE = 'minecraft:deepslate_gold_ore',
  DEEPSLATE_IRON_ORE = 'minecraft:deepslate_iron_ore',
  DEEPSLATE_LAPIS_ORE = 'minecraft:deepslate_lapis_ore',
  DEEPSLATE_REDSTONE_ORE = 'minecraft:deepslate_redstone_ore',
  DEEPSLATE_TILE_DOUBLE_SLAB = 'minecraft:deepslate_tile_double_slab',
  DEEPSLATE_TILE_SLAB = 'minecraft:deepslate_tile_slab',
  DEEPSLATE_TILE_STAIRS = 'minecraft:deepslate_tile_stairs',
  DEEPSLATE_TILE_WALL = 'minecraft:deepslate_tile_wall',
  DEEPSLATE_TILES = 'minecraft:deepslate_tiles',
  DENY = 'minecraft:deny',
  DETECTOR_RAIL = 'minecraft:detector_rail',
  DIAMOND_BLOCK = 'minecraft:diamond_block',
  DIAMOND_ORE = 'minecraft:diamond_ore',
  DIORITE_STAIRS = 'minecraft:diorite_stairs',
  DIRT = 'minecraft:dirt',
  DIRT_WITH_ROOTS = 'minecraft:dirt_with_roots',
  DISPENSER = 'minecraft:dispenser',
  DOUBLE_CUT_COPPER_SLAB = 'minecraft:double_cut_copper_slab',
  DOUBLE_PLANT = 'minecraft:double_plant',
  DOUBLE_STONE_SLAB = 'minecraft:double_stone_slab',
  DOUBLE_STONE_SLAB2 = 'minecraft:double_stone_slab2',
  DOUBLE_STONE_SLAB3 = 'minecraft:double_stone_slab3',
  DOUBLE_STONE_SLAB4 = 'minecraft:double_stone_slab4',
  DOUBLE_WOODEN_SLAB = 'minecraft:double_wooden_slab',
  DRAGON_EGG = 'minecraft:dragon_egg',
  DRIED_KELP_BLOCK = 'minecraft:dried_kelp_block',
  DRIPSTONE_BLOCK = 'minecraft:dripstone_block',
  DROPPER = 'minecraft:dropper',
  ELEMENT_0 = 'minecraft:element_0',
  ELEMENT_1 = 'minecraft:element_1',
  ELEMENT_10 = 'minecraft:element_10',
  ELEMENT_100 = 'minecraft:element_100',
  ELEMENT_101 = 'minecraft:element_101',
  ELEMENT_102 = 'minecraft:element_102',
  ELEMENT_103 = 'minecraft:element_103',
  ELEMENT_104 = 'minecraft:element_104',
  ELEMENT_105 = 'minecraft:element_105',
  ELEMENT_106 = 'minecraft:element_106',
  ELEMENT_107 = 'minecraft:element_107',
  ELEMENT_108 = 'minecraft:element_108',
  ELEMENT_109 = 'minecraft:element_109',
  ELEMENT_11 = 'minecraft:element_11',
  ELEMENT_110 = 'minecraft:element_110',
  ELEMENT_111 = 'minecraft:element_111',
  ELEMENT_112 = 'minecraft:element_112',
  ELEMENT_113 = 'minecraft:element_113',
  ELEMENT_114 = 'minecraft:element_114',
  ELEMENT_115 = 'minecraft:element_115',
  ELEMENT_116 = 'minecraft:element_116',
  ELEMENT_117 = 'minecraft:element_117',
  ELEMENT_118 = 'minecraft:element_118',
  ELEMENT_12 = 'minecraft:element_12',
  ELEMENT_13 = 'minecraft:element_13',
  ELEMENT_14 = 'minecraft:element_14',
  ELEMENT_15 = 'minecraft:element_15',
  ELEMENT_16 = 'minecraft:element_16',
  ELEMENT_17 = 'minecraft:element_17',
  ELEMENT_18 = 'minecraft:element_18',
  ELEMENT_19 = 'minecraft:element_19',
  ELEMENT_2 = 'minecraft:element_2',
  ELEMENT_20 = 'minecraft:element_20',
  ELEMENT_21 = 'minecraft:element_21',
  ELEMENT_22 = 'minecraft:element_22',
  ELEMENT_23 = 'minecraft:element_23',
  ELEMENT_24 = 'minecraft:element_24',
  ELEMENT_25 = 'minecraft:element_25',
  ELEMENT_26 = 'minecraft:element_26',
  ELEMENT_27 = 'minecraft:element_27',
  ELEMENT_28 = 'minecraft:element_28',
  ELEMENT_29 = 'minecraft:element_29',
  ELEMENT_3 = 'minecraft:element_3',
  ELEMENT_30 = 'minecraft:element_30',
  ELEMENT_31 = 'minecraft:element_31',
  ELEMENT_32 = 'minecraft:element_32',
  ELEMENT_33 = 'minecraft:element_33',
  ELEMENT_34 = 'minecraft:element_34',
  ELEMENT_35 = 'minecraft:element_35',
  ELEMENT_36 = 'minecraft:element_36',
  ELEMENT_37 = 'minecraft:element_37',
  ELEMENT_38 = 'minecraft:element_38',
  ELEMENT_39 = 'minecraft:element_39',
  ELEMENT_4 = 'minecraft:element_4',
  ELEMENT_40 = 'minecraft:element_40',
  ELEMENT_41 = 'minecraft:element_41',
  ELEMENT_42 = 'minecraft:element_42',
  ELEMENT_43 = 'minecraft:element_43',
  ELEMENT_44 = 'minecraft:element_44',
  ELEMENT_45 = 'minecraft:element_45',
  ELEMENT_46 = 'minecraft:element_46',
  ELEMENT_47 = 'minecraft:element_47',
  ELEMENT_48 = 'minecraft:element_48',
  ELEMENT_49 = 'minecraft:element_49',
  ELEMENT_5 = 'minecraft:element_5',
  ELEMENT_50 = 'minecraft:element_50',
  ELEMENT_51 = 'minecraft:element_51',
  ELEMENT_52 = 'minecraft:element_52',
  ELEMENT_53 = 'minecraft:element_53',
  ELEMENT_54 = 'minecraft:element_54',
  ELEMENT_55 = 'minecraft:element_55',
  ELEMENT_56 = 'minecraft:element_56',
  ELEMENT_57 = 'minecraft:element_57',
  ELEMENT_58 = 'minecraft:element_58',
  ELEMENT_59 = 'minecraft:element_59',
  ELEMENT_6 = 'minecraft:element_6',
  ELEMENT_60 = 'minecraft:element_60',
  ELEMENT_61 = 'minecraft:element_61',
  ELEMENT_62 = 'minecraft:element_62',
  ELEMENT_63 = 'minecraft:element_63',
  ELEMENT_64 = 'minecraft:element_64',
  ELEMENT_65 = 'minecraft:element_65',
  ELEMENT_66 = 'minecraft:element_66',
  ELEMENT_67 = 'minecraft:element_67',
  ELEMENT_68 = 'minecraft:element_68',
  ELEMENT_69 = 'minecraft:element_69',
  ELEMENT_7 = 'minecraft:element_7',
  ELEMENT_70 = 'minecraft:element_70',
  ELEMENT_71 = 'minecraft:element_71',
  ELEMENT_72 = 'minecraft:element_72',
  ELEMENT_73 = 'minecraft:element_73',
  ELEMENT_74 = 'minecraft:element_74',
  ELEMENT_75 = 'minecraft:element_75',
  ELEMENT_76 = 'minecraft:element_76',
  ELEMENT_77 = 'minecraft:element_77',
  ELEMENT_78 = 'minecraft:element_78',
  ELEMENT_79 = 'minecraft:element_79',
  ELEMENT_8 = 'minecraft:element_8',
  ELEMENT_80 = 'minecraft:element_80',
  ELEMENT_81 = 'minecraft:element_81',
  ELEMENT_82 = 'minecraft:element_82',
  ELEMENT_83 = 'minecraft:element_83',
  ELEMENT_84 = 'minecraft:element_84',
  ELEMENT_85 = 'minecraft:element_85',
  ELEMENT_86 = 'minecraft:element_86',
  ELEMENT_87 = 'minecraft:element_87',
  ELEMENT_88 = 'minecraft:element_88',
  ELEMENT_89 = 'minecraft:element_89',
  ELEMENT_9 = 'minecraft:element_9',
  ELEMENT_90 = 'minecraft:element_90',
  ELEMENT_91 = 'minecraft:element_91',
  ELEMENT_92 = 'minecraft:element_92',
  ELEMENT_93 = 'minecraft:element_93',
  ELEMENT_94 = 'minecraft:element_94',
  ELEMENT_95 = 'minecraft:element_95',
  ELEMENT_96 = 'minecraft:element_96',
  ELEMENT_97 = 'minecraft:element_97',
  ELEMENT_98 = 'minecraft:element_98',
  ELEMENT_99 = 'minecraft:element_99',
  EMERALD_BLOCK = 'minecraft:emerald_block',
  EMERALD_ORE = 'minecraft:emerald_ore',
  ENCHANTING_TABLE = 'minecraft:enchanting_table',
  END_BRICK_STAIRS = 'minecraft:end_brick_stairs',
  END_BRICKS = 'minecraft:end_bricks',
  END_GATEWAY = 'minecraft:end_gateway',
  END_PORTAL = 'minecraft:end_portal',
  END_PORTAL_FRAME = 'minecraft:end_portal_frame',
  END_ROD = 'minecraft:end_rod',
  END_STONE = 'minecraft:end_stone',
  ENDER_CHEST = 'minecraft:ender_chest',
  EXPOSED_COPPER = 'minecraft:exposed_copper',
  EXPOSED_CUT_COPPER = 'minecraft:exposed_cut_copper',
  EXPOSED_CUT_COPPER_SLAB = 'minecraft:exposed_cut_copper_slab',
  EXPOSED_CUT_COPPER_STAIRS = 'minecraft:exposed_cut_copper_stairs',
  EXPOSED_DOUBLE_CUT_COPPER_SLAB = 'minecraft:exposed_double_cut_copper_slab',
  FARMLAND = 'minecraft:farmland',
  FENCE = 'minecraft:fence',
  FENCE_GATE = 'minecraft:fence_gate',
  FIRE = 'minecraft:fire',
  FLETCHING_TABLE = 'minecraft:fletching_table',
  FLOWER_POT = 'minecraft:flower_pot',
  FLOWERING_AZALEA = 'minecraft:flowering_azalea',
  FLOWING_LAVA = 'minecraft:flowing_lava',
  FLOWING_WATER = 'minecraft:flowing_water',
  FRAME = 'minecraft:frame',
  FROSTED_ICE = 'minecraft:frosted_ice',
  FURNACE = 'minecraft:furnace',
  GILDED_BLACKSTONE = 'minecraft:gilded_blackstone',
  GLASS = 'minecraft:glass',
  GLASS_PANE = 'minecraft:glass_pane',
  GLOW_FRAME = 'minecraft:glow_frame',
  GLOW_LICHEN = 'minecraft:glow_lichen',
  GLOWINGOBSIDIAN = 'minecraft:glowingobsidian',
  GLOWSTONE = 'minecraft:glowstone',
  GOLD_BLOCK = 'minecraft:gold_block',
  GOLD_ORE = 'minecraft:gold_ore',
  GOLDEN_RAIL = 'minecraft:golden_rail',
  GRANITE_STAIRS = 'minecraft:granite_stairs',
  GRASS = 'minecraft:grass',
  GRASS_PATH = 'minecraft:grass_path',
  GRAVEL = 'minecraft:gravel',
  GRAY_GLAZED_TERRACOTTA = 'minecraft:gray_glazed_terracotta',
  GREEN_GLAZED_TERRACOTTA = 'minecraft:green_glazed_terracotta',
  GRINDSTONE = 'minecraft:grindstone',
  HANGING_ROOTS = 'minecraft:hanging_roots',
  HARD_GLASS = 'minecraft:hard_glass',
  HARD_GLASS_PANE = 'minecraft:hard_glass_pane',
  HARD_STAINED_GLASS = 'minecraft:hard_stained_glass',
  HARD_STAINED_GLASS_PANE = 'minecraft:hard_stained_glass_pane',
  HARDENED_CLAY = 'minecraft:hardened_clay',
  HAY_BLOCK = 'minecraft:hay_block',
  HEAVY_WEIGHTED_PRESSURE_PLATE = 'minecraft:heavy_weighted_pressure_plate',
  HONEY_BLOCK = 'minecraft:honey_block',
  HONEYCOMB_BLOCK = 'minecraft:honeycomb_block',
  HOPPER = 'minecraft:hopper',
  ICE = 'minecraft:ice',
  INFESTED_DEEPSLATE = 'minecraft:infested_deepslate',
  INFO_UPDATE = 'minecraft:info_update',
  INFO_UPDATE2 = 'minecraft:info_update2',
  INVISIBLEBEDROCK = 'minecraft:invisibleBedrock',
  IRON_BARS = 'minecraft:iron_bars',
  IRON_BLOCK = 'minecraft:iron_block',
  IRON_DOOR = 'minecraft:iron_door',
  IRON_ORE = 'minecraft:iron_ore',
  IRON_TRAPDOOR = 'minecraft:iron_trapdoor',
  JIGSAW = 'minecraft:jigsaw',
  JUKEBOX = 'minecraft:jukebox',
  JUNGLE_BUTTON = 'minecraft:jungle_button',
  JUNGLE_DOOR = 'minecraft:jungle_door',
  JUNGLE_FENCE_GATE = 'minecraft:jungle_fence_gate',
  JUNGLE_PRESSURE_PLATE = 'minecraft:jungle_pressure_plate',
  JUNGLE_STAIRS = 'minecraft:jungle_stairs',
  JUNGLE_STANDING_SIGN = 'minecraft:jungle_standing_sign',
  JUNGLE_TRAPDOOR = 'minecraft:jungle_trapdoor',
  JUNGLE_WALL_SIGN = 'minecraft:jungle_wall_sign',
  KELP = 'minecraft:kelp',
  LADDER = 'minecraft:ladder',
  LANTERN = 'minecraft:lantern',
  LAPIS_BLOCK = 'minecraft:lapis_block',
  LAPIS_ORE = 'minecraft:lapis_ore',
  LARGE_AMETHYST_BUD = 'minecraft:large_amethyst_bud',
  LAVA = 'minecraft:lava',
  LAVA_CAULDRON = 'minecraft:lava_cauldron',
  LEAVES = 'minecraft:leaves',
  LEAVES2 = 'minecraft:leaves2',
  LECTERN = 'minecraft:lectern',
  LEVER = 'minecraft:lever',
  LIGHT_BLOCK = 'minecraft:light_block',
  LIGHT_BLUE_GLAZED_TERRACOTTA = 'minecraft:light_blue_glazed_terracotta',
  LIGHT_WEIGHTED_PRESSURE_PLATE = 'minecraft:light_weighted_pressure_plate',
  LIGHTNING_ROD = 'minecraft:lightning_rod',
  LIME_GLAZED_TERRACOTTA = 'minecraft:lime_glazed_terracotta',
  LIT_BLAST_FURNACE = 'minecraft:lit_blast_furnace',
  LIT_DEEPSLATE_REDSTONE_ORE = 'minecraft:lit_deepslate_redstone_ore',
  LIT_FURNACE = 'minecraft:lit_furnace',
  LIT_PUMPKIN = 'minecraft:lit_pumpkin',
  LIT_REDSTONE_LAMP = 'minecraft:lit_redstone_lamp',
  LIT_REDSTONE_ORE = 'minecraft:lit_redstone_ore',
  LIT_SMOKER = 'minecraft:lit_smoker',
  LODESTONE = 'minecraft:lodestone',
  LOG = 'minecraft:log',
  LOG2 = 'minecraft:log2',
  LOOM = 'minecraft:loom',
  MAGENTA_GLAZED_TERRACOTTA = 'minecraft:magenta_glazed_terracotta',
  MAGMA = 'minecraft:magma',
  MEDIUM_AMETHYST_BUD = 'minecraft:medium_amethyst_bud',
  MELON_BLOCK = 'minecraft:melon_block',
  MELON_STEM = 'minecraft:melon_stem',
  MOB_SPAWNER = 'minecraft:mob_spawner',
  MONSTER_EGG = 'minecraft:monster_egg',
  MOSS_BLOCK = 'minecraft:moss_block',
  MOSS_CARPET = 'minecraft:moss_carpet',
  MOSSY_COBBLESTONE = 'minecraft:mossy_cobblestone',
  MOSSY_COBBLESTONE_STAIRS = 'minecraft:mossy_cobblestone_stairs',
  MOSSY_STONE_BRICK_STAIRS = 'minecraft:mossy_stone_brick_stairs',
  MOVINGBLOCK = 'minecraft:movingBlock',
  MYCELIUM = 'minecraft:mycelium',
  NETHER_BRICK = 'minecraft:nether_brick',
  NETHER_BRICK_FENCE = 'minecraft:nether_brick_fence',
  NETHER_BRICK_STAIRS = 'minecraft:nether_brick_stairs',
  NETHER_GOLD_ORE = 'minecraft:nether_gold_ore',
  NETHER_SPROUTS = 'minecraft:nether_sprouts',
  NETHER_WART = 'minecraft:nether_wart',
  NETHER_WART_BLOCK = 'minecraft:nether_wart_block',
  NETHERITE_BLOCK = 'minecraft:netherite_block',
  NETHERRACK = 'minecraft:netherrack',
  NETHERREACTOR = 'minecraft:netherreactor',
  NORMAL_STONE_STAIRS = 'minecraft:normal_stone_stairs',
  NOTEBLOCK = 'minecraft:noteblock',
  OAK_STAIRS = 'minecraft:oak_stairs',
  OBSERVER = 'minecraft:observer',
  OBSIDIAN = 'minecraft:obsidian',
  ORANGE_GLAZED_TERRACOTTA = 'minecraft:orange_glazed_terracotta',
  OXIDIZED_COPPER = 'minecraft:oxidized_copper',
  OXIDIZED_CUT_COPPER = 'minecraft:oxidized_cut_copper',
  OXIDIZED_CUT_COPPER_SLAB = 'minecraft:oxidized_cut_copper_slab',
  OXIDIZED_CUT_COPPER_STAIRS = 'minecraft:oxidized_cut_copper_stairs',
  OXIDIZED_DOUBLE_CUT_COPPER_SLAB = 'minecraft:oxidized_double_cut_copper_slab',
  PACKED_ICE = 'minecraft:packed_ice',
  PINK_GLAZED_TERRACOTTA = 'minecraft:pink_glazed_terracotta',
  PISTON = 'minecraft:piston',
  PISTONARMCOLLISION = 'minecraft:pistonArmCollision',
  PLANKS = 'minecraft:planks',
  PODZOL = 'minecraft:podzol',
  POINTED_DRIPSTONE = 'minecraft:pointed_dripstone',
  POLISHED_ANDESITE_STAIRS = 'minecraft:polished_andesite_stairs',
  POLISHED_BASALT = 'minecraft:polished_basalt',
  POLISHED_BLACKSTONE = 'minecraft:polished_blackstone',
  POLISHED_BLACKSTONE_BRICK_DOUBLE_SLAB = 'minecraft:polished_blackstone_brick_double_slab',
  POLISHED_BLACKSTONE_BRICK_SLAB = 'minecraft:polished_blackstone_brick_slab',
  POLISHED_BLACKSTONE_BRICK_STAIRS = 'minecraft:polished_blackstone_brick_stairs',
  POLISHED_BLACKSTONE_BRICK_WALL = 'minecraft:polished_blackstone_brick_wall',
  POLISHED_BLACKSTONE_BRICKS = 'minecraft:polished_blackstone_bricks',
  POLISHED_BLACKSTONE_BUTTON = 'minecraft:polished_blackstone_button',
  POLISHED_BLACKSTONE_DOUBLE_SLAB = 'minecraft:polished_blackstone_double_slab',
  POLISHED_BLACKSTONE_PRESSURE_PLATE = 'minecraft:polished_blackstone_pressure_plate',
  POLISHED_BLACKSTONE_SLAB = 'minecraft:polished_blackstone_slab',
  POLISHED_BLACKSTONE_STAIRS = 'minecraft:polished_blackstone_stairs',
  POLISHED_BLACKSTONE_WALL = 'minecraft:polished_blackstone_wall',
  POLISHED_DEEPSLATE = 'minecraft:polished_deepslate',
  POLISHED_DEEPSLATE_DOUBLE_SLAB = 'minecraft:polished_deepslate_double_slab',
  POLISHED_DEEPSLATE_SLAB = 'minecraft:polished_deepslate_slab',
  POLISHED_DEEPSLATE_STAIRS = 'minecraft:polished_deepslate_stairs',
  POLISHED_DEEPSLATE_WALL = 'minecraft:polished_deepslate_wall',
  POLISHED_DIORITE_STAIRS = 'minecraft:polished_diorite_stairs',
  POLISHED_GRANITE_STAIRS = 'minecraft:polished_granite_stairs',
  PORTAL = 'minecraft:portal',
  POTATOES = 'minecraft:potatoes',
  POWDER_SNOW = 'minecraft:powder_snow',
  POWERED_COMPARATOR = 'minecraft:powered_comparator',
  POWERED_REPEATER = 'minecraft:powered_repeater',
  PRISMARINE = 'minecraft:prismarine',
  PRISMARINE_BRICKS_STAIRS = 'minecraft:prismarine_bricks_stairs',
  PRISMARINE_STAIRS = 'minecraft:prismarine_stairs',
  PUMPKIN = 'minecraft:pumpkin',
  PUMPKIN_STEM = 'minecraft:pumpkin_stem',
  PURPLE_GLAZED_TERRACOTTA = 'minecraft:purple_glazed_terracotta',
  PURPUR_BLOCK = 'minecraft:purpur_block',
  PURPUR_STAIRS = 'minecraft:purpur_stairs',
  QUARTZ_BLOCK = 'minecraft:quartz_block',
  QUARTZ_BRICKS = 'minecraft:quartz_bricks',
  QUARTZ_ORE = 'minecraft:quartz_ore',
  QUARTZ_STAIRS = 'minecraft:quartz_stairs',
  RAIL = 'minecraft:rail',
  RAW_COPPER_BLOCK = 'minecraft:raw_copper_block',
  RAW_GOLD_BLOCK = 'minecraft:raw_gold_block',
  RAW_IRON_BLOCK = 'minecraft:raw_iron_block',
  RED_FLOWER = 'minecraft:red_flower',
  RED_GLAZED_TERRACOTTA = 'minecraft:red_glazed_terracotta',
  RED_MUSHROOM = 'minecraft:red_mushroom',
  RED_MUSHROOM_BLOCK = 'minecraft:red_mushroom_block',
  RED_NETHER_BRICK = 'minecraft:red_nether_brick',
  RED_NETHER_BRICK_STAIRS = 'minecraft:red_nether_brick_stairs',
  RED_SANDSTONE = 'minecraft:red_sandstone',
  RED_SANDSTONE_STAIRS = 'minecraft:red_sandstone_stairs',
  REDSTONE_BLOCK = 'minecraft:redstone_block',
  REDSTONE_LAMP = 'minecraft:redstone_lamp',
  REDSTONE_ORE = 'minecraft:redstone_ore',
  REDSTONE_TORCH = 'minecraft:redstone_torch',
  REDSTONE_WIRE = 'minecraft:redstone_wire',
  REEDS = 'minecraft:reeds',
  REPEATING_COMMAND_BLOCK = 'minecraft:repeating_command_block',
  RESERVED6 = 'minecraft:reserved6',
  RESPAWN_ANCHOR = 'minecraft:respawn_anchor',
  SAND = 'minecraft:sand',
  SANDSTONE = 'minecraft:sandstone',
  SANDSTONE_STAIRS = 'minecraft:sandstone_stairs',
  SAPLING = 'minecraft:sapling',
  SCAFFOLDING = 'minecraft:scaffolding',
  SCULK_SENSOR = 'minecraft:sculk_sensor',
  SEA_PICKLE = 'minecraft:sea_pickle',
  SEAGRASS = 'minecraft:seagrass',
  SEALANTERN = 'minecraft:seaLantern',
  SHROOMLIGHT = 'minecraft:shroomlight',
  SHULKER_BOX = 'minecraft:shulker_box',
  SILVER_GLAZED_TERRACOTTA = 'minecraft:silver_glazed_terracotta',
  SKULL = 'minecraft:skull',
  SLIME = 'minecraft:slime',
  SMALL_AMETHYST_BUD = 'minecraft:small_amethyst_bud',
  SMALL_DRIPLEAF_BLOCK = 'minecraft:small_dripleaf_block',
  SMITHING_TABLE = 'minecraft:smithing_table',
  SMOKER = 'minecraft:smoker',
  SMOOTH_BASALT = 'minecraft:smooth_basalt',
  SMOOTH_QUARTZ_STAIRS = 'minecraft:smooth_quartz_stairs',
  SMOOTH_RED_SANDSTONE_STAIRS = 'minecraft:smooth_red_sandstone_stairs',
  SMOOTH_SANDSTONE_STAIRS = 'minecraft:smooth_sandstone_stairs',
  SMOOTH_STONE = 'minecraft:smooth_stone',
  SNOW = 'minecraft:snow',
  SNOW_LAYER = 'minecraft:snow_layer',
  SOUL_CAMPFIRE = 'minecraft:soul_campfire',
  SOUL_FIRE = 'minecraft:soul_fire',
  SOUL_LANTERN = 'minecraft:soul_lantern',
  SOUL_SAND = 'minecraft:soul_sand',
  SOUL_SOIL = 'minecraft:soul_soil',
  SOUL_TORCH = 'minecraft:soul_torch',
  SPONGE = 'minecraft:sponge',
  SPORE_BLOSSOM = 'minecraft:spore_blossom',
  SPRUCE_BUTTON = 'minecraft:spruce_button',
  SPRUCE_DOOR = 'minecraft:spruce_door',
  SPRUCE_FENCE_GATE = 'minecraft:spruce_fence_gate',
  SPRUCE_PRESSURE_PLATE = 'minecraft:spruce_pressure_plate',
  SPRUCE_STAIRS = 'minecraft:spruce_stairs',
  SPRUCE_STANDING_SIGN = 'minecraft:spruce_standing_sign',
  SPRUCE_TRAPDOOR = 'minecraft:spruce_trapdoor',
  SPRUCE_WALL_SIGN = 'minecraft:spruce_wall_sign',
  STAINED_GLASS = 'minecraft:stained_glass',
  STAINED_GLASS_PANE = 'minecraft:stained_glass_pane',
  STAINED_HARDENED_CLAY = 'minecraft:stained_hardened_clay',
  STANDING_BANNER = 'minecraft:standing_banner',
  STANDING_SIGN = 'minecraft:standing_sign',
  STICKY_PISTON = 'minecraft:sticky_piston',
  STICKYPISTONARMCOLLISION = 'minecraft:stickyPistonArmCollision',
  STONE = 'minecraft:stone',
  STONE_BRICK_STAIRS = 'minecraft:stone_brick_stairs',
  STONE_BUTTON = 'minecraft:stone_button',
  STONE_PRESSURE_PLATE = 'minecraft:stone_pressure_plate',
  STONE_SLAB = 'minecraft:stone_slab',
  STONE_SLAB2 = 'minecraft:stone_slab2',
  STONE_SLAB3 = 'minecraft:stone_slab3',
  STONE_SLAB4 = 'minecraft:stone_slab4',
  STONE_STAIRS = 'minecraft:stone_stairs',
  STONEBRICK = 'minecraft:stonebrick',
  STONECUTTER = 'minecraft:stonecutter',
  STONECUTTER_BLOCK = 'minecraft:stonecutter_block',
  STRIPPED_ACACIA_LOG = 'minecraft:stripped_acacia_log',
  STRIPPED_BIRCH_LOG = 'minecraft:stripped_birch_log',
  STRIPPED_CRIMSON_HYPHAE = 'minecraft:stripped_crimson_hyphae',
  STRIPPED_CRIMSON_STEM = 'minecraft:stripped_crimson_stem',
  STRIPPED_DARK_OAK_LOG = 'minecraft:stripped_dark_oak_log',
  STRIPPED_JUNGLE_LOG = 'minecraft:stripped_jungle_log',
  STRIPPED_OAK_LOG = 'minecraft:stripped_oak_log',
  STRIPPED_SPRUCE_LOG = 'minecraft:stripped_spruce_log',
  STRIPPED_WARPED_HYPHAE = 'minecraft:stripped_warped_hyphae',
  STRIPPED_WARPED_STEM = 'minecraft:stripped_warped_stem',
  STRUCTURE_BLOCK = 'minecraft:structure_block',
  STRUCTURE_VOID = 'minecraft:structure_void',
  SWEET_BERRY_BUSH = 'minecraft:sweet_berry_bush',
  TALLGRASS = 'minecraft:tallgrass',
  TARGET = 'minecraft:target',
  TINTED_GLASS = 'minecraft:tinted_glass',
  TNT = 'minecraft:tnt',
  TORCH = 'minecraft:torch',
  TRAPDOOR = 'minecraft:trapdoor',
  TRAPPED_CHEST = 'minecraft:trapped_chest',
  TRIPWIRE = 'minecraft:tripWire',
  TRIPWIRE_HOOK = 'minecraft:tripwire_hook',
  TUFF = 'minecraft:tuff',
  TURTLE_EGG = 'minecraft:turtle_egg',
  TWISTING_VINES = 'minecraft:twisting_vines',
  UNDERWATER_TORCH = 'minecraft:underwater_torch',
  UNDYED_SHULKER_BOX = 'minecraft:undyed_shulker_box',
  UNKNOWN = 'minecraft:unknown',
  UNLIT_REDSTONE_TORCH = 'minecraft:unlit_redstone_torch',
  UNPOWERED_COMPARATOR = 'minecraft:unpowered_comparator',
  UNPOWERED_REPEATER = 'minecraft:unpowered_repeater',
  VINE = 'minecraft:vine',
  WALL_BANNER = 'minecraft:wall_banner',
  WALL_SIGN = 'minecraft:wall_sign',
  WARPED_BUTTON = 'minecraft:warped_button',
  WARPED_DOOR = 'minecraft:warped_door',
  WARPED_DOUBLE_SLAB = 'minecraft:warped_double_slab',
  WARPED_FENCE = 'minecraft:warped_fence',
  WARPED_FENCE_GATE = 'minecraft:warped_fence_gate',
  WARPED_FUNGUS = 'minecraft:warped_fungus',
  WARPED_HYPHAE = 'minecraft:warped_hyphae',
  WARPED_NYLIUM = 'minecraft:warped_nylium',
  WARPED_PLANKS = 'minecraft:warped_planks',
  WARPED_PRESSURE_PLATE = 'minecraft:warped_pressure_plate',
  WARPED_ROOTS = 'minecraft:warped_roots',
  WARPED_SLAB = 'minecraft:warped_slab',
  WARPED_STAIRS = 'minecraft:warped_stairs',
  WARPED_STANDING_SIGN = 'minecraft:warped_standing_sign',
  WARPED_STEM = 'minecraft:warped_stem',
  WARPED_TRAPDOOR = 'minecraft:warped_trapdoor',
  WARPED_WALL_SIGN = 'minecraft:warped_wall_sign',
  WARPED_WART_BLOCK = 'minecraft:warped_wart_block',
  WATER = 'minecraft:water',
  WATERLILY = 'minecraft:waterlily',
  WAXED_COPPER = 'minecraft:waxed_copper',
  WAXED_CUT_COPPER = 'minecraft:waxed_cut_copper',
  WAXED_CUT_COPPER_SLAB = 'minecraft:waxed_cut_copper_slab',
  WAXED_CUT_COPPER_STAIRS = 'minecraft:waxed_cut_copper_stairs',
  WAXED_DOUBLE_CUT_COPPER_SLAB = 'minecraft:waxed_double_cut_copper_slab',
  WAXED_EXPOSED_COPPER = 'minecraft:waxed_exposed_copper',
  WAXED_EXPOSED_CUT_COPPER = 'minecraft:waxed_exposed_cut_copper',
  WAXED_EXPOSED_CUT_COPPER_SLAB = 'minecraft:waxed_exposed_cut_copper_slab',
  WAXED_EXPOSED_CUT_COPPER_STAIRS = 'minecraft:waxed_exposed_cut_copper_stairs',
  WAXED_EXPOSED_DOUBLE_CUT_COPPER_SLAB = 'minecraft:waxed_exposed_double_cut_copper_slab',
  WAXED_OXIDIZED_COPPER = 'minecraft:waxed_oxidized_copper',
  WAXED_OXIDIZED_CUT_COPPER = 'minecraft:waxed_oxidized_cut_copper',
  WAXED_OXIDIZED_CUT_COPPER_SLAB = 'minecraft:waxed_oxidized_cut_copper_slab',
  WAXED_OXIDIZED_CUT_COPPER_STAIRS = 'minecraft:waxed_oxidized_cut_copper_stairs',
  WAXED_OXIDIZED_DOUBLE_CUT_COPPER_SLAB = 'minecraft:waxed_oxidized_double_cut_copper_slab',
  WAXED_WEATHERED_COPPER = 'minecraft:waxed_weathered_copper',
  WAXED_WEATHERED_CUT_COPPER = 'minecraft:waxed_weathered_cut_copper',
  WAXED_WEATHERED_CUT_COPPER_SLAB = 'minecraft:waxed_weathered_cut_copper_slab',
  WAXED_WEATHERED_CUT_COPPER_STAIRS = 'minecraft:waxed_weathered_cut_copper_stairs',
  WAXED_WEATHERED_DOUBLE_CUT_COPPER_SLAB = 'minecraft:waxed_weathered_double_cut_copper_slab',
  WEATHERED_COPPER = 'minecraft:weathered_copper',
  WEATHERED_CUT_COPPER = 'minecraft:weathered_cut_copper',
  WEATHERED_CUT_COPPER_SLAB = 'minecraft:weathered_cut_copper_slab',
  WEATHERED_CUT_COPPER_STAIRS = 'minecraft:weathered_cut_copper_stairs',
  WEATHERED_DOUBLE_CUT_COPPER_SLAB = 'minecraft:weathered_double_cut_copper_slab',
  WEB = 'minecraft:web',
  WEEPING_VINES = 'minecraft:weeping_vines',
  WHEAT = 'minecraft:wheat',
  WHITE_GLAZED_TERRACOTTA = 'minecraft:white_glazed_terracotta',
  WITHER_ROSE = 'minecraft:wither_rose',
  WOOD = 'minecraft:wood',
  WOODEN_BUTTON = 'minecraft:wooden_button',
  WOODEN_DOOR = 'minecraft:wooden_door',
  WOODEN_PRESSURE_PLATE = 'minecraft:wooden_pressure_plate',
  WOODEN_SLAB = 'minecraft:wooden_slab',
  WOOL = 'minecraft:wool',
  YELLOW_FLOWER = 'minecraft:yellow_flower',
  YELLOW_GLAZED_TERRACOTTA = 'minecraft:yellow_glazed_terracotta',
}