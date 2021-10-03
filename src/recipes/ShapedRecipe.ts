import AddonPack, { Registry } from "../addon"
import { getFromRegex, JsonArray, JsonObject } from "../utils"
import { RecipeClass } from "./Recipe"

export class ShapedRecipeBuilder {
  private _rows: string[]
  private _result: string
  private _count: number
  private _priority: number
  private _keys: Record<string, string>

  private constructor(result: string, count: number) {
    this._result = result
    this._rows = []
    this._priority = 0
    this._keys = {}
    this._count = count
  }

  public static shaped(item: string, count = 1) {
    return new ShapedRecipeBuilder(item, count)
  }

  public define(char: string, item: string) {
    this._keys[char] = item
    return this
  }

  public pattern(row: string) {
    this._rows.push(row)
    return this
  }

  public priority(value: number) {
    this._priority = value
    return this
  }

  public save(registry: Registry<RecipeClass>, path: string) {
    registry.register(new ShapedRecipeClass(path, this._rows, this._keys, this._result, this._count, this._priority))
  }
}

export class ShapedRecipeClass implements RecipeClass {
  public id: string
  public path: string
  public priority: number
  public pattern: string[]
  public keys: Record<string, string>
  public result: string
  public count: number

  public constructor(path: string, pattern: string[], keys: Record<string, string>, result: string, count = 1, priority = 0) {
    this.path = path
    this.id = getFromRegex(path, /[^/]+$/)[0] ?? 'unknown'
    this.pattern = pattern
    this.keys = keys
    this.result = result
    this.count = 1
    this.priority = priority
  }

  public serializeRecipeData(): any {
    const recipeObj = new JsonObject()
    recipeObj.addProperty('format_version', '1.12')

    const recipe = new JsonObject()

    const desc = new JsonObject()
    desc.addProperty('identifier', AddonPack.namespace + ':' + this.id)
    recipe.add('description', desc)
    
    recipe.addProperty('priority', this.priority)

    const pattern = new JsonArray()
    this.pattern.forEach(line => {
      pattern.add(line)
    })
    recipe.add('pattern', pattern)

    const keys = new JsonObject()
    Object.entries(this.keys).forEach(([key, value]) => {
      const item = new JsonObject()
      item.addProperty('item', value)
      item.addProperty('data', 0)

      keys.add(key, item)
    })
    recipe.add('keys', keys)

    const result = new JsonObject()
    result.addProperty('item', this.result)
    result.addProperty('data', 0)
    recipe.add('result', result)

    recipeObj.add('minecraft:recipe_shaped', recipe)
    return recipeObj.toJSON()
  }
}