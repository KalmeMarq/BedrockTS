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

export class BlockProperties {
  public drops(drops: string): BlockProperties {
    this._drops = drops
    return this
  }

  public destroyTime(time: number): BlockProperties {
    this._destroyTime = time
    return this
  }

  public explosionResistance(resis: number): BlockProperties {
    this._explosionResistance = resis
    return this
  }

  public strength(strength: number): BlockProperties
  public strength(destroyTime: number, resistance: number): BlockProperties
  public strength(destroyTime: number, resistance?: number): BlockProperties {
    return this.destroyTime(destroyTime).explosionResistance(resistance ?? destroyTime)
  }

  public mapColor(color: number | string | [number, number, number]): BlockProperties {
    if ((color as string).startsWith('#')) {
      this._mapColor = color as string
    }
    return this
  }

  public lightLevel(level: number) {
    this._light_emission = level
    return this
  }

  public lightAbsorption(level: number) {
    this._light_absorption = level
    return this
  }

  public light(absorption: number, emission: number): BlockProperties {
    return this.lightLevel(absorption).lightAbsorption(emission)
  }

  public _mapColor: string | undefined
  public _destroyTime: number | undefined
  public _friction: number | undefined
  public _explosionResistance: number | undefined
  public _drops: string | undefined
  public _light_emission: number | undefined
  public _light_absorption: number | undefined
}

export class MCBlock {
  public path: string
  public id: string

  public destroyTime: number | undefined
  public friction: number | undefined
  public explosionResistance: number | undefined
  public drops: string | undefined
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

  public serializeServerData(block: JsonObject): void {
    block.addProperty('format_version', '1.12')

    const mcblock = new JsonObject()

    const desc = new JsonObject()
    desc.addProperty('identifier', AddonPack.namespace + ':' + this.id)
    desc.addProperty('is_experimental', this.isExperimental())
    desc.addProperty('register_to_creative_menu', this.registerToCreativeMenu())
    
    if (this.customProperties) {
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

    if (this.destroyTime) components.addProperty('minecraft:destroy_time', this.destroyTime)
    if (this.explosionResistance) components.addProperty('minecraft:explosion_resistance', this.explosionResistance)
    if (this.friction) components.addProperty('minecraft:friction', this.friction)
    if (this.drops) components.addProperty('minecraft:loot', this.drops)
    if (this.properties._light_absorption) components.addProperty('minecraft:block_light_absorption', this.properties._light_absorption)
    if (this.properties._light_emission) components.addProperty('minecraft:block_light_emission', this.properties._light_emission)
    if (this.properties._mapColor) components.addProperty('minecraft:map_color', this.properties._mapColor)

    mcblock.add('components', components)

    block.add('minecraft:block', mcblock)
  }

  public serializeClientData(blocks: JsonObject): void {
  }

  public register(registry: Registry<MCBlock>) {
    registry.register(this)
  }
}