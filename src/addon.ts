import axios from 'axios'
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { basename, join } from 'path'
import { TRecipeFurnaceTags, TType } from '.'
import { BlockClass, IBlockComponents, IBlockTextures, MCBlock } from './data/Block'
import { LangClass } from './data/Lang'
import { SkinClass } from './data/Skin'
import { TerrainTextureClass } from './data/TerrainTexture'
import { TextureClass } from './data/Texture'
import { BlastFurnaceRecipeClass, CampfireRecipeClass, FurnaceRecipeClass, SmokerRecipeClass } from './recipes/CookingRecipe'
import { PotionRecipeClass } from './recipes/PotionRecipe'
import { RecipeClass } from './recipes/Recipe'
import { ShapedRecipeClass } from './recipes/ShapedRecipe'
import { ShapelessRecipeClass } from './recipes/ShapelessRecipe'
import { Styles } from './styles'
import { BedrockTSConfig, TBlockShape, TDescription, TItemLike, TResources, TTerrainTextures } from './types'
import { compactBasicArray, JsonArray, JsonObject } from './utils'

export class Registry<T> {
  public arr: T[]

  public constructor() {
    this.arr = []
  }

  public register(hm: T) {
    this.arr.push(hm)
  }
}

export default class AddonPack {
  public static namespace: string = 'minecraft'
  public skins: SkinClass[]
  public textures: (TextureClass|TerrainTextureClass)[]
  public langs: LangClass[]
  public recipes: RecipeClass[]
  public recipes_registry: Registry<RecipeClass>
  public blocks: BlockClass[]
  public blocks_registry: Registry<MCBlock>

  public constructor() {
    this.skins = []
    this.textures = []
    this.langs = []
    this.blocks = []
    this.recipes = []
    this.recipes_registry = new Registry()
    this.blocks_registry = new Registry()
  }

  public save = (config: BedrockTSConfig, resources: TResources) => {
    const root = join((config.saveOptions?.path ?? '.'), 'out', this.prepareDescription(config.name))
    if (existsSync(root)) {
      rmSync(join(process.cwd(), root), { recursive: true })
      mkdirSync(join(process.cwd(), root), { recursive: true })
    } else {
      mkdirSync(join(process.cwd(), root), { recursive: true })
    }

    if (config.namespace) AddonPack.namespace = config.namespace

    const type: TType = this.getPackType(root, resources)

    const packIcon = config.pack_icon ? join(process.cwd(), 'resources', config.pack_icon) : ''
    if (type !== 'skin_pack' && existsSync(packIcon)) {
      if (type === 'resource_pack') {
        copyFileSync(packIcon, join(root, 'pack_icon.png'))
      } else {
        copyFileSync(packIcon, join(root + ' (RP)', 'pack_icon.png'))
        copyFileSync(packIcon, join(root + ' (BP)', 'pack_icon.png'))
      }
    }

    if (type === 'skin_pack') {
      this.saveSkinPack(config, root, resources)
    }

    if (type === 'resource_pack') {
      this.saveResourcePack(config, root, resources)
    }

    if (type === 'addon_pack') {
      this.saveResourcePack(config, root + ' (RP)', resources)
      this.saveBehaviorPack(config, root + ' (BP)', resources)
    }
  }

  private getPackType(root: string, resources: TResources): TType {
    let type: TType = 'resource_pack'
    if (this.skins.length > 0) {
      type = 'skin_pack'
    } else if(resources.loot_tables.length > 0 || resources.recipes.length > 0 || resources.trading.length > 0) {
      type = 'addon_pack'

      let rpP = root + ' (RP)'
      let bpP = root + ' (BP)'

      if (existsSync(rpP)) {
        rmSync(join(process.cwd(), rpP), { recursive: true })
        mkdirSync(join(process.cwd(), rpP), { recursive: true })
      } else {
        mkdirSync(join(process.cwd(), rpP), { recursive: true })
      }

      if (existsSync(bpP)) {
        rmSync(join(process.cwd(), bpP), { recursive: true })
        mkdirSync(join(process.cwd(), bpP), { recursive: true })
      } else {
        mkdirSync(join(process.cwd(), bpP), { recursive: true })
      }
    }

    return type
  }

  private async saveLangs(root: string, { langs }: TResources): Promise<void> {
    const textsPath = join(root, 'texts')
    mkdirSync(textsPath, { recursive: true })
    langs.forEach(lang => {
      const rel = lang.replace(/.+?(?=lang\\)lang\\/, '').replace(/(?<=_).[a-zA-Z]*/, (m) => m.toUpperCase()).replace('.json', '.lang')
      
      const ldata = JSON.parse(readFileSync(lang).toString('utf-8'))
      let result = ''
      Object.entries<string>(ldata).forEach(([key, value], idx, arr) => {
        result += key + '=' + value + (idx + 1 === arr.length ? '' : '\n')
      })

      writeFileSync(join(textsPath, rel), result)
    })

    this.langs.forEach(lang => {
      const p = join(root, 'texts', lang.path + '.lang')
      if (existsSync(p) && !lang.replace) {
        let d = readFileSync(p).toString('utf-8')
        d += '\n' + lang.data
        writeFileSync(p, d)
      } else {
        writeFileSync(p, lang.data)
      }
    })
  }

  private async saveSkinPack(config: BedrockTSConfig, root: string, resources: TResources): Promise<void> {
    let manifest = JSON.parse(readFileSync(join(__dirname, 'templates/spack_manifest.json')).toString('utf-8'))

    manifest.header.name = this.prepareDescription(config.name)
    if (config.description) manifest.header.description = this.prepareDescription(config.description)
    if (config.version) {
      manifest.header.version = config.version
      manifest.modules[0].version = config.version
    }

    writeFileSync(join(root, 'manifest.json'), compactBasicArray(manifest, 2))

    this.saveLangs(root, resources)

    resources.textures.forEach(txt => {
      const n = txt.shortPath
      copyFileSync(txt.fullPath, join(root, n.substr(n.lastIndexOf('\\') + 1, n.length)))
    })

    for (const txt of this.textures) {
      if (txt instanceof TerrainTextureClass) continue

      try {
        const data = (await axios.get(txt.url, { responseType: 'arraybuffer' })).data
        writeFileSync(join(root, txt.path), Buffer.from(data, 'binary'))
      } catch(e) {
      }
    }

    const skins: any = {
      skins: this.skins.map(skin => {
        return {
          localization_name: skin.name,
          geometry: skin.geometry,
          texture: skin.texture,
          type: skin.type
        }
      }),
      serialize_name: config.skin_pack_name ?? 'skin_pack_example',
      localization_name: config.skin_pack_name ?? 'skin_pack_example'
    }

    writeFileSync(join(root, 'skins.json'), compactBasicArray(skins, 2))
  }

  private async saveResourcePack(config: BedrockTSConfig, root: string, resources: TResources): Promise<void> {
    let manifest = JSON.parse(readFileSync(join(__dirname, 'templates/rpack_manifest.json')).toString('utf-8'))

    manifest.header.name = this.prepareDescription(config.name)
    if (config.description) manifest.header.description = this.prepareDescription(config.description)
    if (config.version) {
      manifest.header.version = config.version
      manifest.modules[0].version = config.version
    }

    writeFileSync(join(root, 'manifest.json'), compactBasicArray(manifest, 2))

    this.saveLangs(root, resources)

    const txtsPath = join(root, 'textures')
    mkdirSync(txtsPath, { recursive: true })
    let txtCache: string[] = []

    resources.textures.forEach(txt => {
      const n = txt.shortPath
      const m = n.substr(0, n.lastIndexOf('\\'))
      mkdirSync(join(root, m), { recursive: true })

      copyFileSync(txt.fullPath, join(root, n))
      txtCache.push(txt.shortPath.replace(/\.([^.]*)$/, '').replace(/\\/g, '/'))
    })

    for (const txt of this.textures) {
      if (txt instanceof TerrainTextureClass) continue

      try {
        const data = (await axios.get(txt.url, { responseType: 'arraybuffer' })).data

        txtCache.push(txt.path.replace(/\.([^.]*)$/, '').replace(/\\/g, '/'))
        
        writeFileSync(join(root, txt.path), Buffer.from(data, 'binary'))
      } catch(e) {
      }
    }

    writeFileSync(join(txtsPath, 'textures_list.json'), JSON.stringify(txtCache, null, 2))

    resources.texts.forEach(text => {
      const nm = basename(text.shortPath)

      if (nm === 'splashes.txt' || nm === 'splashes.text') {
        let splashes: { splashes: string[] } = {
          splashes: []
        }

        try {
          let r = readFileSync(text.fullPath).toString('utf8').split(/\r\n/g)
          if (r.length > 0) {
            splashes.splashes = r
            writeFileSync(join(root, 'splashes.json'), JSON.stringify(splashes, null, 2))
          }
        } catch(e) {}
      }

      if (nm === 'loading_messages.txt' || nm === 'loading_messages.text') {
        let loading_messages: { loading_messages: string[] } = {
          loading_messages: []
        }

        try {
          let r = readFileSync(text.fullPath).toString('utf8').split(/\r\n/g)
          if (r.length > 0) {
            loading_messages.loading_messages = r
            writeFileSync(join(root, 'loading_messages.json'), JSON.stringify(loading_messages, null, 2))
          }
        } catch(e) {}
      }
    })

    let uis: string[] = []
    resources.ui.forEach(uifile => {
      const n = uifile.shortPath
      const m = n.substr(0, n.lastIndexOf('\\'))
      mkdirSync(join(root, m), { recursive: true })

      copyFileSync(uifile.fullPath, join(root, n))
      uis.push((n).replace('\\', '/'))
    })

    if (uis.length > 0) writeFileSync(join(root, 'ui', '_ui_defs.json'), JSON.stringify({ ui_defs: uis }, null, 2))

    if (this.blocks.length > 0) {
      const blocks = new JsonObject()

      const format = new JsonArray()
      format.add(1)
      format.add(1)
      format.add(0)
      blocks.add('format_version', format)

      this.blocks.forEach(block => {
        block.serializeClientData(blocks)
      })

      writeFileSync(join(root, 'blocks.json'), compactBasicArray(blocks.toJSON()))
    
      const terrain = new JsonObject()
      terrain.addProperty('resource_pack_name', AddonPack.namespace)
      terrain.addProperty('texture_name', 'atlas.terrain')
      terrain.addProperty('padding', 8)
      terrain.addProperty('num_mip_levels', 4)

      const textureData = new JsonObject()
      for (const txt of this.textures) {
        if (txt instanceof TextureClass) continue
        const txr = new JsonObject()
        txt.serialize(txr)
        textureData.add(txt.name, txr)
      }

      terrain.add('texture_data', textureData)

      writeFileSync(join(root, 'textures/terrain_texture.json'), compactBasicArray(terrain.toJSON()))
    }
  }

  private saveBehaviorPack(config: BedrockTSConfig, root: string, { recipes, loot_tables, trading }: TResources): void {
    let manifest = JSON.parse(readFileSync(join(__dirname, 'templates/bpack_manifest.json')).toString('utf-8'))

    manifest.header.name = this.prepareDescription(config.name)
    if (config.description) manifest.header.description = this.prepareDescription(config.description)
    if (config.version) {
      manifest.header.version = config.version
      manifest.modules[0].version = config.version
    }

    writeFileSync(join(root, 'manifest.json'), compactBasicArray(manifest, 2))


    if (recipes.length > 0) {
      const rcsPath = join(root, 'recipes')
      mkdirSync(rcsPath, { recursive: true })
    }
    
    recipes.forEach(recipe => {
      if (existsSync(recipe.fullPath)) {
        copyFileSync(recipe.fullPath, join(root, recipe.shortPath))
      }
    })

    if (loot_tables.length > 0) {
      const rcsPath = join(root, 'loot_tables')
      mkdirSync(rcsPath, { recursive: true })
    }
    
    loot_tables.forEach(recipe => {
      if (existsSync(recipe.fullPath)) {
        copyFileSync(recipe.fullPath, join(root, recipe.shortPath))
      }
    })

    if (trading.length > 0) {
      const rcsPath = join(root, 'trading')
      mkdirSync(rcsPath, { recursive: true })
    }
    
    trading.forEach(recipe => {
      if (existsSync(recipe.fullPath)) {
        copyFileSync(recipe.fullPath, join(root, recipe.shortPath))
      }
    })

    ;[...this.recipes_registry.arr, ...this.recipes].forEach(recipe => {
      const m = recipe.path.substr(0, recipe.path.lastIndexOf('/'))
      mkdirSync(join(root, 'recipes', m), { recursive: true })
      writeFileSync(join(root, 'recipes', recipe.path + '.json'), compactBasicArray(recipe.serializeRecipeData(), 2))
    })

    if (this.blocks.length > 0 || this.blocks_registry.arr.length > 0) {
      mkdirSync(join(root, 'blocks'))

      ;[...this.blocks, ...this.blocks_registry.arr].forEach(block => {
        const b = new JsonObject()
        block.serializeServerData(b)
        writeFileSync(join(root, 'blocks', block.path + '.json'), compactBasicArray(b.toJSON())) 
      })
    }
  }

  private prepareDescription(desc: TDescription): string {
    if (typeof desc === 'string') {
      return desc
    }

    return desc.map(v => typeof v === 'string'
      ? v
      : (Styles.COLORS.get(v.color.getName())?.getCode() ?? '') + v.text + '§r'
    ).join('')
  }

  Skin = (name: string, texture: string, geometry?: string, type?: 'free') => {
    this.skins.push(new SkinClass(name, texture, geometry ?? '', type ?? 'free'))
  }

  Texture = (path: string, url: string) => {
    this.textures.push(new TextureClass(path, url))
  }

  TerrainTexture = (name: string, path: TTerrainTextures) => {
    this.textures.push(new TerrainTextureClass(name, path))
  }
  
  Lang = (path: string, data: Record<string, string>, options?: { replace: boolean }) => {
    this.langs.push(new LangClass(path, data, options))
  }

  FurnaceRecipe = (path: string, tags: TRecipeFurnaceTags[] | string, input: TItemLike, output?: TItemLike) => {
    if (typeof tags === 'string') this.recipes.push(new FurnaceRecipeClass(path, input, output as string))
    else  this.recipes.push(new FurnaceRecipeClass(path, tags, input, output as string))
  }

  SmokerRecipe = (path: string, input: TItemLike, output: TItemLike) => {
    this.recipes.push(new SmokerRecipeClass(path, input, output))
  }

  BlastFurnaceRecipe = (path: string, input: TItemLike, output: TItemLike) => {
    this.recipes.push(new BlastFurnaceRecipeClass(path, input, output))
  }

  CampfireRecipe = (path: string, input: TItemLike, output: TItemLike) => {
    this.recipes.push(new CampfireRecipeClass(path, input, output))
  }

  ShapelessRecipe = (path: string, ingredients: string[], result: string, priority = 0) => {
    this.recipes.push(new ShapelessRecipeClass(path, ingredients, result, priority))
  }

  ShapedRecipe = (path: string, pattern: string[], keys: Record<string, string>, result: string, priority = 0) => {
    this.recipes.push(new ShapedRecipeClass(path, pattern, keys, result, priority))
  }

  PotionRecipe = (path: string, input: string, reagent: string, output: string) => {
    this.recipes.push(new PotionRecipeClass(path, input, reagent, output))
  }

  Block = (path: string, isExperimental: boolean, registerToCreativeMenu: boolean, components: IBlockComponents, textures: IBlockTextures, sound = 'stone', blockshape?: TBlockShape) => {
    this.blocks.push(new BlockClass(path, isExperimental, registerToCreativeMenu, components, textures, sound, blockshape))
  }

  GetRecipesRegistry = () => {
    return this.recipes_registry
  }
  
  GetBlocksRegistry = () => {
    return this.blocks_registry
  }
}