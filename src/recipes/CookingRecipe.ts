import { TItemLike, TRecipeFurnaceTags } from ".."
import AddonPack, { Registry } from "../addon"
import { getFromRegex, JsonArray, JsonObject } from "../utils"
import { RecipeClass } from "./Recipe"

export class FurnaceRecipeClass {
  public id: string
  public path: string
  private input: TItemLike
  private output: TItemLike
  private tags: TRecipeFurnaceTags[]

  public constructor(path: string, input: TItemLike, output: TItemLike)
  public constructor(path: string, tags: TRecipeFurnaceTags[], input: TItemLike, output: TItemLike)
  public constructor(path: string, tags: TRecipeFurnaceTags[] | TItemLike, input: TItemLike, output?: TItemLike) {
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
  public constructor(path: string, input: TItemLike, output: TItemLike) {
    super(path, ['smoker'], input, output)
  }
}

export class BlastFurnaceRecipeClass extends FurnaceRecipeClass {
  public constructor(path: string, input: TItemLike, output: TItemLike) {
    super(path, ['blast_furnace'], input, output)
  }
}

export class CampfireRecipeClass extends FurnaceRecipeClass {
  public constructor(path: string, input: TItemLike, output: TItemLike) {
    super(path, ['campfire'], input, output)
  }
}

export class CookingRecipeBuilder {
  private tags: TRecipeFurnaceTags[]
  private input: TItemLike
  private output: TItemLike

  private constructor(tags: TRecipeFurnaceTags[], input: TItemLike, output: TItemLike) {
    this.tags = tags
    this.input = input
    this.output = output
  }

  public static cooking(input: TItemLike, output: TItemLike, tags: TRecipeFurnaceTags[]) {
    return new CookingRecipeBuilder(tags, input, output)
  }

  public static smelting(input: TItemLike, output: TItemLike) {
    return new CookingRecipeBuilder(['furnace'], input, output)
  }

  public static blasting(input: TItemLike, output: TItemLike) {
    return new CookingRecipeBuilder(['blast_furnace'], input, output)
  }

  public static smoking(input: TItemLike, output: TItemLike) {
    return new CookingRecipeBuilder(['smoker'], input, output)
  }

  public static campfireCooking(input: TItemLike, output: TItemLike) {
    return new CookingRecipeBuilder(['campfire'], input, output)
  }

  public save(registry: Registry<RecipeClass>, path: string) {
    registry.register(new FurnaceRecipeClass(path, this.tags, this.input, this.output))
  }
}