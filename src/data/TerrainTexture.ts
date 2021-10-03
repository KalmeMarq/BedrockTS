import { TTerrainTextures } from ".."
import { JsonArray, JsonObject } from "../utils"

export class TerrainTextureClass {
  public name: string
  public path: string | string[] | { path: string, weight: number }[]

  public constructor(name: string, path: TTerrainTextures) {
    this.name = name
    this.path = path
  }

  public serialize(texture: JsonObject) {
    if (typeof this.path === 'string') {
      texture.addProperty('textures', this.path)
    } else if(Array.isArray(this.path)) {
      const textures = new JsonObject()

      const variants = new JsonArray()

      this.path.forEach(p => {
        const variant = new JsonObject()

        if (typeof p === 'string') {
          variant.addProperty('path', p)
        } else {
          variant.addProperty('path', p.path)
          variant.addProperty('weight', p.weight)
        }

        variants.add(variant)
      })

      textures.add('variants', variants)
      texture.add('textures', textures)
    }
  }
}