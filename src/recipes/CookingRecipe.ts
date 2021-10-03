import { TRecipeFurnaceTags } from ".."
import AddonPack, { Registry } from "../addon"
import { getFromRegex, JsonArray, JsonObject } from "../utils"
import { RecipeClass } from "./Recipe"

export class FurnaceRecipeClass {
  public id: string
  public path: string
  private input: string
  private output: string
  private tags: TRecipeFurnaceTags[]

  public constructor(path: string, input: string, output: string)
  public constructor(path: string, tags: TRecipeFurnaceTags[], input: string, output: string)
  public constructor(path: string, tags: TRecipeFurnaceTags[] | string, input: string, output?: string) {
    this.path = path
    this.id = getFromRegex(path, /[^/]+$/)[0] ?? 'unknown'
    this.tags = typeof tags === 'string' ? ['furnace'] : tags
    this.input = input
    this.output = output ?? input
  }

  public serializeRecipeData(): any {
    const recipeObj = new JsonObject()
    recipeObj.addProperty('format_version', '1.12')

    const furnace = new JsonObject()

    const desc = new JsonObject()
    desc.addProperty('identifier', AddonPack.namespace + ':' + this.id)

    const tags = new JsonArray()
    this.tags.forEach(tag => tags.add(tag))

    const input = new JsonObject()
    input.addProperty('item', this.input)
    input.addProperty('data', 0)

    furnace.add('description', desc)
    furnace.add('tags', tags)
    furnace.add('input', input)
    furnace.addProperty('output', this.output)

    recipeObj.add('minecraft:recipe_furnace', furnace)

    return recipeObj.toJSON()
  }
}

export class SmokerRecipeClass extends FurnaceRecipeClass {
  public constructor(path: string, input: string, output: string) {
    super(path, ['smoker'], input, output)
  }
}

export class BlastFurnaceRecipeClass extends FurnaceRecipeClass {
  public constructor(path: string, input: string, output: string) {
    super(path, ['blast_furnace'], input, output)
  }
}

export class CampfireRecipeClass extends FurnaceRecipeClass {
  public constructor(path: string, input: string, output: string) {
    super(path, ['campfire'], input, output)
  }
}

export class CookingRecipeBuilder {
  private tags: TRecipeFurnaceTags[]
  private input: string
  private output: string

  private constructor(tags: TRecipeFurnaceTags[], input: string, output: string) {
    this.tags = tags
    this.input = input
    this.output = output
  }

  public static cooking(input: string, output: string, tags: TRecipeFurnaceTags[]) {
    return new CookingRecipeBuilder(tags, input, output)
  }

  public static smelting(input: string, output: string) {
    return new CookingRecipeBuilder(['furnace'], input, output)
  }

  public static blasting(input: string, output: string) {
    return new CookingRecipeBuilder(['blast_furnace'], input, output)
  }

  public static smoking(input: string, output: string) {
    return new CookingRecipeBuilder(['smoker'], input, output)
  }

  public static campfireCooking(input: string, output: string) {
    return new CookingRecipeBuilder(['campfire'], input, output)
  }

  public save(registry: Registry<RecipeClass>, path: string) {
    registry.register(new FurnaceRecipeClass(path, this.tags, this.input, this.output))
  }
}