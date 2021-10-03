import AddonPack, { Registry } from "../addon"
import { getFromRegex, JsonArray, JsonObject } from "../utils"
import { RecipeClass } from "./Recipe"

export class ShapelessRecipeBuilder {
  private _ingredients: string[]
  private _result: string
  private _count: number
  private _priority: number

  private constructor(result: string, count: number) {
    this._result = result
    this._ingredients = []
    this._priority = 0
    this._count = count
  }

  public static shapeless(item: string, count = 1) {
    return new ShapelessRecipeBuilder(item, count)
  }

  public requires(item: string, count: number) {
    for (let i = 0; i < count; i++) {
      this._ingredients.push(item)
    }
    return this
  }

  public priority(value: number) {
    this._priority = value
    return this
  }

  public save(registry: Registry<RecipeClass>, path: string) {
    registry.register(new ShapelessRecipeClass(path, this._ingredients, this._result, this._count, this._priority))
  }
}

export class ShapelessRecipeClass {
  public id: string
  public path: string
  public priority: number
  public ingredients: string[]
  public result: string
  public count: number

  public constructor(path: string, ingredients: string[], result: string, count = 1, priority = 0) {
    this.path = path
    this.id = getFromRegex(path, /[^/]+$/)[0] ?? 'unknown'
    this.ingredients = ingredients
    this.result = result
    this.priority = priority
    this.count = count
  }

  public serializeRecipeData(): any {
    const recipeObj = new JsonObject()
    recipeObj.addProperty('format_version', '1.12')

    const recipe = new JsonObject()

    const desc = new JsonObject()
    desc.addProperty('identifier', AddonPack.namespace + ':' + this.id)
    recipe.add('description', desc)
    
    recipe.addProperty('priority', this.priority)

    const ingredients = new JsonArray()
    const compactIngrds: Record<string, number> = {}
    this.ingredients.forEach(ingrd => {
      if (compactIngrds[ingrd]) compactIngrds[ingrd]++
      else compactIngrds[ingrd] = 1
    })

    Object.entries(compactIngrds).forEach(([key, value]) => {
      const item = new JsonObject()
      item.addProperty('item', key)
      item.addProperty('data', 0)
      item.addProperty('count', value)
      
      ingredients.add(item)
    })
    recipe.add('ingredients', ingredients)

    const result = new JsonObject()
    result.addProperty('item', this.result)
    result.addProperty('data', 0)
    result.addProperty('count', this.count)
    recipe.add('result', result)

    recipeObj.add('minecraft:recipe_shapeless', recipe)
    return recipeObj.toJSON()
  }
}